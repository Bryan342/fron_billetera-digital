import React, { useState, useEffect } from 'react';
import Sidebar from '../components/sidebar'; // Asegúrate que la ruta sea correcta (mayúscula/minúscula)
import '../styles/enviar.css';

// ==============================================================
// 🔴 CONFIGURACIÓN DE ENDPOINTS
// ==============================================================
const URL_USERS_SERVICE = 'https://userservicesanti.onrender.com/users';
const URL_WALLET_SERVICE = 'https://billetera-production.up.railway.app/api/v1/wallets';
const URL_TX_SERVICE = 'https://transactionmicroservicios-production.up.railway.app/transactions';

function Enviar() {
  // --- ESTADOS ---
  const [step, setStep] = useState(1);
  const [telefono, setTelefono] = useState('');
  const [monto, setMonto] = useState('');

  // Datos lógicos internos
  const [senderWalletId, setSenderWalletId] = useState(null);
  const [receiverWalletId, setReceiverWalletId] = useState(null);
  const [receiverName, setReceiverName] = useState('');

  // UI Feedback
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- ESTADOS: TRANSFERENCIA INTERBANCARIA ---
  const [activeTab, setActiveTab] = useState('interno'); // 'interno' | 'interbancario'
  const [selectedBank, setSelectedBank] = useState('');
  const [telefonoInterbank, setTelefonoInterbank] = useState('');

  // ==============================================================
  // 🔄 PASO 1: AL CARGAR LA PÁGINA (Obtener MI Billetera)
  // ==============================================================
  useEffect(() => {
    const inicializarUsuario = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        alert("No hay sesión activa");
        return;
      }

      const userData = JSON.parse(localStorage.getItem("userData"));
      const userId = userData?.user_id;

      try {
        const response = await fetch(`${URL_WALLET_SERVICE}/${userId}/balance`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setSenderWalletId(data.wallet_id);
          console.log("✅ Mi Billetera ID cargada:", data.wallet_id);
        } else {
          console.error("Error cargando mi billetera");
        }
      } catch (error) {
        console.error("Error de red inicializando:", error);
      }
    };

    inicializarUsuario();
  }, []);

  // ==============================================================
  // 🔎 TRIGGER DE BÚSQUEDA DE DESTINATARIO
  // ==============================================================
  useEffect(() => {

    if (activeTab !== 'interno') return;

    if (telefono.length !== 9) {
      setReceiverWalletId(null);
      setReceiverName('');
      return;
    }

    const timeoutId = setTimeout(() => {
      buscarDestinatario(telefono);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [telefono]);

  // ==============================================================
  // 🔄 PASO 2: BUSCAR USUARIO Y SU BILLETERA
  // ==============================================================
  const buscarDestinatario = async (phoneInput) => {
    setIsSearching(true);
    setSearchError(null);
    const token = localStorage.getItem('token');

    try {
      const userRes = await fetch(`${URL_USERS_SERVICE}/phone/${phoneInput}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!userRes.ok) throw new Error("Usuario no encontrado");

      const userData = await userRes.json();
      const receiverUserId = userData.user_id;
      setReceiverName(userData.email);

      const walletRes = await fetch(`${URL_WALLET_SERVICE}/${receiverUserId}/balance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!walletRes.ok) throw new Error("El usuario no tiene billetera activa");

      const walletData = await walletRes.json();
      setReceiverWalletId(walletData.wallet_id);
      console.log("✅ Billetera Destino ID:", walletData.wallet_id);

    } catch (error) {
      console.error(error);
      setSearchError("Usuario no encontrado o sin billetera activa.");
      setReceiverWalletId(null);
    } finally {
      setIsSearching(false);
    }
  };

  // ==============================================================
  // 🔄 PASO 3: EJECUTAR TRANSACCIÓN
  // ==============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!senderWalletId || !receiverWalletId) {
      alert("Faltan datos. Verifica el destinatario.");
      return;
    }

    setIsProcessing(true);
    const token = localStorage.getItem('token');
    const randomKey = Math.random().toString(36).substring(2) + Date.now().toString(36);

    const payload = {
      idempotencyKey: randomKey,
      sender_wallet: senderWalletId,
      receiver_wallet: receiverWalletId,
      amount: parseFloat(monto),
      currency: "SOL"
    };

    console.log("🚀 Enviando Transacción:", payload);

    try {
      const response = await fetch(URL_TX_SERVICE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Exito:", data);
        setStep(2);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || "Falló la transacción"}`);
      }

    } catch (error) {
      console.error("Error de red:", error);
      alert("No se pudo conectar con el servidor.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInterbankSubmit = async (e) => {
    e.preventDefault();

    if (!selectedBank || telefonoInterbank.length !== 9 || !monto) {
      alert("Por favor completa todos los datos");
      return;
    }

    setIsProcessing(true);

    // SIMULACIÓN DE PROCESO (Aquí conectarás tu lógica luego)
    setTimeout(() => {
      setIsProcessing(false);
      setStep(2);
    }, 1500);
  };

  // Función para resetear formulario al cambiar de tab
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setMonto('');
    setTelefono('');
    setTelefonoInterbank('');
    setSearchError(null);
    setReceiverWalletId(null);
    setReceiverName('');
  };

  // --- RENDERIZADO ---
  return (
    <div className="app-layout">
      {/* El Sidebar se queda a la izquierda y ocupa el alto total */}
      <Sidebar />

      <main className="content-area">
        <div className="card-transferencia">

          {step === 1 ? (
            <>
              <header className="card-header">
                <h2>Enviar Dinero</h2>
                <p className="sub-title">Transfiere al instante y sin comisiones</p>
              </header>

              {/* --- TABS (PESTAÑAS) --- */}
              <div className="tabs-container">
                <button
                  className={`tab-btn ${activeTab === 'interno' ? 'active' : ''}`}
                  onClick={() => handleTabChange('interno')}
                >
                  Banca Luca
                </button>
                <button
                  className={`tab-btn ${activeTab === 'interbancario' ? 'active' : ''}`}
                  onClick={() => handleTabChange('interbancario')}
                >
                  Otra Banca
                </button>
              </div>
              {activeTab === 'interno' && (
                <form onSubmit={handleSubmit} className="form-stack">

                  {/* INPUT TELÉFONO */}
                  <div className="form-group">
                    <label>Celular del destinatario</label>
                    <div className="input-with-status">
                      <input
                        type="text"
                        placeholder="Ej: 999 123 456"
                        maxLength={9}
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ''))}
                        className={`input-modern ${searchError ? 'input-error' : ''}`}
                        required
                      />
                      <div className="status-icon">
                        {isSearching && <div className="spinner-small"></div>}
                        {!isSearching && receiverWalletId && <span style={{ color: '#10b981', fontSize: '1.2rem' }}>✔</span>}
                      </div>
                    </div>

                    {/* Feedback de errores y éxito en búsqueda */}
                    {searchError && <span className="error-text">{searchError}</span>}

                    {receiverName && !searchError && (
                      <div className="destinatario-badge">
                        <span>👤</span>
                        <span>Destino: <strong>{receiverName}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* INPUT MONTO */}
                  <div className="form-group">
                    <label>¿Cuánto quieres enviar?</label>
                    <div className="currency-input-wrapper">
                      <span className="currency-symbol">S/</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={monto}
                        onChange={(e) => setMonto(e.target.value)}
                        step="0.01"
                        min="0.1"
                        className="amount-hero"
                        required
                        disabled={!receiverWalletId}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isProcessing || !receiverWalletId || !senderWalletId || !monto}
                  >
                    {isProcessing ? 'Procesando...' : 'Enviar Dinero'}
                  </button>

                </form>
              )}

              {/* === FORMULARIO INTERBANCARIO (OTRO BANCO) === */}
              {activeTab === 'interbancario' && (
                <form onSubmit={handleInterbankSubmit} className="form-stack animate-fade-in">

                  {/* Selector de Banco */}
                  <div className="form-group">
                    <label>Selecciona el Banco</label>
                    <select
                      className="input-modern"
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      required
                    >
                      <option value="">-- Elige un banco --</option>
                      <option value="XXXBANK">XXXbank</option>
                    </select>
                  </div>

                  {/* Celular (Igual que interno) */}
                  <div className="form-group">
                    <label>Celular del destinatario</label>
                    <input
                      type="text"
                      placeholder="Ej: 999 123 456"
                      maxLength={9}
                      value={telefonoInterbank}
                      onChange={(e) => setTelefonoInterbank(e.target.value.replace(/\D/g, ''))}
                      className="input-modern"
                      required
                    />
                  </div>

                  {/* Monto */}
                  <div className="form-group">
                    <label>Monto a enviar</label>
                    <div className="currency-input-wrapper">
                      <span className="currency-symbol">S/</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={monto}
                        onChange={(e) => setMonto(e.target.value)}
                        step="0.01"
                        className="amount-hero"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-primary btn-interbank"
                    disabled={isProcessing || !selectedBank || telefonoInterbank.length !== 9 || !monto}
                  >
                    {isProcessing ? 'Validando...' : 'Transferir a Banco'}
                  </button>
                </form>
              )}

            </>
          ) : (
            <div className="success-view">
              <div className="success-icon-large">🎉</div>
              <h3>¡Envío Exitoso!</h3>

              <div className="amount-display">
                S/ {parseFloat(monto).toFixed(2)}
              </div>

              <p className="receiver-display">Enviado a <strong>{receiverName}</strong></p>

              <button className="btn-secondary" onClick={() => {
                setStep(1);
                setTelefono('');
                setTelefonoInterbank('');
                setMonto('');
                setReceiverWalletId(null);
                setReceiverName('');
                setSelectedBank('');
              }}>
                Realizar otra operación
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default Enviar;