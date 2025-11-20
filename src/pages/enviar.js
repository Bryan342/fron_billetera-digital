import React, { useState, useEffect } from 'react';
import Sidebar from '../components/sidebar';
import '../styles/enviar.css';

// ==============================================================
// 🔴 CONFIGURACIÓN DE ENDPOINTS (CAMBIA LOS PUERTOS AQUÍ)
// ==============================================================
const URL_USERS_SERVICE = 'http://localhost:3001/users';       // Microservicio Usuarios
const URL_WALLET_SERVICE = 'http://localhost:3005/wallets';    // Microservicio Wallet
const URL_TX_SERVICE = 'http://localhost:3002/transactions';   // Microservicio Transacciones
// ==============================================================

function Enviar() {
  // --- ESTADOS UI ---
  const [step, setStep] = useState(1);
  const [tipoDestino, setTipoDestino] = useState('luca');
  
  // --- DATOS FORMULARIO ---
  const [bancoSeleccionado, setBancoSeleccionado] = useState('');
  const [telefono, setTelefono] = useState('');
  const [monto, setMonto] = useState('');

  // --- LÓGICA INTERNA ---
  const [receiverWalletId, setReceiverWalletId] = useState(null);
  const [receiverName, setReceiverName] = useState(''); 
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 🔴 IMPORTANTE: Esto debería venir del login real (localStorage)
  const SENDER_WALLET_ID = 1; 

  // Limpiar estados al cambiar de pestaña
  useEffect(() => {
    setTelefono('');
    setMonto('');
    setReceiverWalletId(null);
    setReceiverName('');
    setSearchError(null);
    setBancoSeleccionado('');
  }, [tipoDestino]);

  // --- TRIGGER DE BÚSQUEDA ---
  useEffect(() => {
    if (tipoDestino !== 'luca' || telefono.length !== 9) return;

    const timeoutId = setTimeout(() => {
      buscarDestinatarioInterno(telefono);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [telefono, tipoDestino]);


  // ==============================================================
  // 🔴 LÓGICA 1: BÚSQUEDA ENCADENADA (ORQUESTACIÓN)
  // ==============================================================
  const buscarDestinatarioInterno = async (phoneInput) => {
    setIsSearching(true);
    setSearchError(null);
    setReceiverWalletId(null);

    try {
      console.log(`🔎 Buscando usuario: ${phoneInput}...`);
      
      // ----------------------------------------------------------
      // PASO A: Buscar Usuario por Teléfono
      // GET http://localhost:3001/users/search?phone=999999999
      // ----------------------------------------------------------
      const userRes = await fetch(`${URL_USERS_SERVICE}/search?phone=${phoneInput}`);
      
      if (!userRes.ok) throw new Error("Usuario no encontrado en el sistema.");
      
      const userData = await userRes.json();
      // Se asume que userData devuelve: { id: 123, name: "Juan", ... }

      // ----------------------------------------------------------
      // PASO B: Buscar Wallet usando el ID del Usuario
      // GET http://localhost:3005/wallets/user/123
      // ----------------------------------------------------------
      const walletRes = await fetch(`${URL_WALLET_SERVICE}/user/${userData.id}`);
      
      if (!walletRes.ok) throw new Error("El usuario existe pero no tiene billetera.");
      
      const walletData = await walletRes.json();
      // Se asume que walletData devuelve: { id: 45, balance: 100, ... }

      // ----------------------------------------------------------
      // ÉXITO: Guardamos los datos reales
      // ----------------------------------------------------------
      setReceiverWalletId(walletData.id); 
      setReceiverName(userData.name || "Usuario Luca"); 

    } catch (error) {
      console.error("Error búsqueda:", error);
      setSearchError("El número no corresponde a un usuario activo.");
    } finally {
      setIsSearching(false);
    }
  };


  // ==============================================================
  // 🔴 LÓGICA 2: ENVIAR TRANSACCIÓN
  // ==============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    // Validaciones
    if (tipoDestino === 'luca' && !receiverWalletId) {
      alert("Debes ingresar un número válido de un usuario Luca.");
      setIsProcessing(false);
      return;
    }

    // Generar Idempotency Key
    const idempotencyKey = Math.random().toString(36).substring(7) + Date.now();

    // Construir Payload
    let payload = {};

    if (tipoDestino === 'luca') {
      payload = {
        idempotencyKey: idempotencyKey,
        sender_wallet: SENDER_WALLET_ID,
        receiver_wallet: receiverWalletId, // ID REAL obtenido de la búsqueda
        amount: parseFloat(monto),
        currency: "SOL"
      };
    } else {
      // Lógica para bancos externos (Simulada o a otro endpoint)
      payload = {
        idempotencyKey: idempotencyKey,
        sender_wallet: SENDER_WALLET_ID,
        destination_bank: bancoSeleccionado,
        destination_phone: telefono,
        amount: parseFloat(monto),
        currency: "SOL",
        type: "EXTERNAL"
      };
    }

    try {
      console.log("🚀 Enviando Payload:", payload);

      // ----------------------------------------------------------
      // LLAMADA POST AL SERVICIO DE TRANSACCIONES
      // POST http://localhost:3002/transactions
      // ----------------------------------------------------------
      const response = await fetch(URL_TX_SERVICE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Transacción exitosa:", data);
        setStep(2); // Ir a pantalla de éxito
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || "Falló la transacción"}`);
      }

    } catch (error) {
      console.error("Error de red:", error);
      alert("Error de conexión con el servidor de transacciones.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="layout-container">
      <Sidebar />
      <main className="content-area">
        <div className="card-transferencia">
          
          {step === 1 ? (
            <>
              <header className="card-header">
                <h2>Realizar Transferencia</h2>
                <p>Envía dinero rápido y seguro</p>
              </header>

              <div className="toggle-container">
                <label className="toggle-label">¿A dónde envías?</label>
                <div className="toggle-group">
                  <button 
                    className={`toggle-btn ${tipoDestino === 'luca' ? 'active' : ''}`}
                    onClick={() => setTipoDestino('luca')}
                    type="button"
                  >
                    Usuario Luca
                  </button>
                  <button 
                    className={`toggle-btn ${tipoDestino === 'banco' ? 'active' : ''}`}
                    onClick={() => setTipoDestino('banco')}
                    type="button"
                  >
                    Otro Banco / Billetera
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="form-stack">
                
                {tipoDestino === 'banco' && (
                  <div className="form-group slide-in">
                    <label>Selecciona la entidad</label>
                    <select 
                      value={bancoSeleccionado}
                      onChange={(e) => setBancoSeleccionado(e.target.value)}
                      required
                    >
                      <option value="">-- Selecciona --</option>
                      <option value="BCP">BCP</option>
                      <option value="Interbank">Interbank</option>
                      <option value="BBVA">BBVA</option>
                      <option value="Yape">Yape</option>
                      <option value="Plin">Plin</option>
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label>Celular del destinatario</label>
                  <div className="input-with-status">
                    <input
                      type="text"
                      placeholder="999 999 999"
                      value={telefono}
                      maxLength={9}
                      onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ''))}
                      className={searchError ? 'input-error' : ''}
                      required
                    />
                    
                    {tipoDestino === 'luca' && (
                      <div className="status-icon">
                        {isSearching && <div className="spinner-small"></div>}
                        {!isSearching && receiverWalletId && <span className="check-icon">✔</span>}
                      </div>
                    )}
                  </div>

                  {tipoDestino === 'luca' && (
                    <>
                      {searchError && <span className="error-text">{searchError}</span>}
                      {receiverName && !isSearching && (
                        <div className="receiver-badge">
                          Destino: <strong>{receiverName}</strong>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="form-group">
                  <label>Monto a enviar</label>
                  <div className="input-wrapper currency-input">
                    <span className="currency-symbol">S/</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={monto}
                      onChange={(e) => setMonto(e.target.value)}
                      required
                      min="0.1"
                      step="0.01"
                      disabled={tipoDestino === 'luca' && !receiverWalletId}
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={isProcessing || (tipoDestino === 'luca' && !receiverWalletId)}
                >
                  {isProcessing ? 'Procesando...' : 'Confirmar Envío'}
                </button>

              </form>
            </>
          ) : (
            <div className="success-view">
              <div className="success-icon-large">🎉</div>
              <h3>¡Envío Realizado!</h3>
              <p>Tu transferencia ha sido procesada con éxito.</p>
              
              <div className="receipt">
                 <div className="receipt-row">
                  <span>Destino:</span>
                  <strong>{tipoDestino === 'luca' ? receiverName : `Banco - ${telefono}`}</strong>
                </div>
                <div className="receipt-row">
                  <span>Monto:</span>
                  <strong>S/ {parseFloat(monto).toFixed(2)}</strong>
                </div>
              </div>

              <button className="btn-secondary" onClick={() => setStep(1)}>
                Nueva Operación
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default Enviar;