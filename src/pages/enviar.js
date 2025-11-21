import React, { useState, useEffect } from 'react';
import Sidebar from '../components/sidebar';
import '../styles/enviar.css';

// ==============================================================
// 🔴 CONFIGURACIÓN DE ENDPOINTS
// ==============================================================
const URL_USERS_SERVICE = 'http://localhost:3005/users';           // Puerto 3000
const URL_WALLET_SERVICE = 'http://localhost:3001/api/v1/wallets'; // Puerto 3001
const URL_TX_SERVICE = 'http://localhost:3002/transactions';       // Puerto 3002

// ==============================================================
// 🛠️ HELPER PARA DECODIFICAR JWT (Sin librerías externas)
// ==============================================================
const decodeJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error al decodificar token:", error);
    return null;
  }
};

function Enviar() {
  // --- ESTADOS ---
  const [step, setStep] = useState(1);
  const [telefono, setTelefono] = useState('');
  const [monto, setMonto] = useState('');

  // Datos lógicos internos
  const [senderWalletId, setSenderWalletId] = useState(null);   // MI Billetera
  const [receiverWalletId, setReceiverWalletId] = useState(null); // SU Billetera
  const [receiverName, setReceiverName] = useState('');         // Nombre para mostrar

  // UI Feedback
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // ==============================================================
  // 🔄 PASO 1: AL CARGAR LA PÁGINA (Obtener MI Billetera)
  // ==============================================================
  useEffect(() => {
    const inicializarUsuario = async () => {
      // 1. Sacar token del Local Storage
      const token = localStorage.getItem('token');
      if (!token) {
        alert("No hay sesión activa");
        return;
      }

      // 2. Sacar el userId del userData
      const userData = JSON.parse(localStorage.getItem("userData"));
      const userId = userData?.user_id;

      try {
        // 3. Consultar mi billetera al Wallet Service
        // GET http://localhost:3001/api/v1/wallets/{userId}/balance
        const response = await fetch(`${URL_WALLET_SERVICE}/${userId}/balance`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`, // <--- SIEMPRE EL TOKEN
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          // data es: { wallet_id: 1, user_id: "1", balance: "2700.00", ... }
          setSenderWalletId(data.wallet_id); // GUARDAMOS EL 1
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
    if (telefono.length !== 9) {
      setReceiverWalletId(null); // Reset si borra el numero
      setReceiverName('');
      return;
    }

    const timeoutId = setTimeout(() => {
      buscarDestinatario(telefono);
    }, 500); // Debounce de 500ms

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
      // A. Buscar Usuario por Teléfono (User Service)
      // GET http://localhost:3000/users/phone/98563526
      const userRes = await fetch(`${URL_USERS_SERVICE}/phone/${phoneInput}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!userRes.ok) throw new Error("Usuario no encontrado");

      const userData = await userRes.json();
      // userData: { user_id: 1, email: "...", ... }
      const receiverUserId = userData.user_id;
      setReceiverName(userData.email); // Mostramos email o nombre para confirmar

      // B. Buscar Billetera del Destinatario (Wallet Service)
      // GET http://localhost:3001/api/v1/wallets/{userId}/balance
      const walletRes = await fetch(`${URL_WALLET_SERVICE}/${receiverUserId}/balance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!walletRes.ok) throw new Error("El usuario no tiene billetera activa");

      const walletData = await walletRes.json();
      // walletData: { wallet_id: 2, user_id: "1", ... }

      setReceiverWalletId(walletData.wallet_id); // GUARDAMOS EL ID DE SU BILLETERA
      console.log("✅ Billetera Destino ID:", walletData.wallet_id);

    } catch (error) {
      console.error(error);
      setSearchError("Usuario no encontrado o sin billetera.");
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
      alert("Faltan datos de las billeteras. Recarga la página o verifica el destinatario.");
      return;
    }

    setIsProcessing(true);
    const token = localStorage.getItem('token');

    // Generar Idempotency Key Random
    const randomKey = Math.random().toString(36).substring(2) + Date.now().toString(36);

    // Construir Body
    const payload = {
      idempotencyKey: randomKey,
      sender_wallet: senderWalletId,    // ID sacado del Token -> WalletService
      receiver_wallet: receiverWalletId,// ID sacado del Telefono -> UserService -> WalletService
      amount: parseFloat(monto),
      currency: "SOL"                   // Siempre SOL
    };

    console.log("🚀 Enviando Transacción:", payload);

    try {
      // POST http://localhost:3002/transactions
      const response = await fetch(URL_TX_SERVICE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Siempre el token
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Exito:", data);
        setStep(2); // Ir a pantalla de éxito
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || "Falló la transacción"}`);
      }

    } catch (error) {
      console.error("Error de red:", error);
      alert("No se pudo conectar con el servidor de transacciones.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- RENDERIZADO ---
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="content-area">
        <div className="card-transferencia">

          {step === 1 ? (
            <>
              <header className="card-header">
                <h2>Enviar Dinero (Luca)</h2>
              </header>

              <form onSubmit={handleSubmit} className="form-stack">

                {/* INPUT TELÉFONO */}
                <div className="form-group">
                  <label>Celular del destinatario</label>
                  <div className="input-with-status">
                    <input
                      type="text"
                      placeholder="999 999 999"
                      maxLength={9}
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ''))}
                      className={searchError ? 'input-error' : ''}
                      required
                    />
                    <div className="status-icon">
                      {isSearching && <div className="spinner-small"></div>}
                      {!isSearching && receiverWalletId && <span style={{ color: 'green' }}>✔</span>}
                    </div>
                  </div>
                  {searchError && <span className="error-text">{searchError}</span>}
                  {receiverName && !searchError && <small>Destino: <strong>{receiverName}</strong></small>}
                </div>

                {/* INPUT MONTO */}
                <div className="form-group">
                  <label>Monto a enviar</label>
                  <div className="input-wrapper currency-input">
                    <span className="currency-symbol">S/</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={monto}
                      onChange={(e) => setMonto(e.target.value)}
                      step="0.01"
                      min="0.1"
                      required
                      disabled={!receiverWalletId} // Bloquear si no hay destinatario valido
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isProcessing || !receiverWalletId || !senderWalletId}
                >
                  {isProcessing ? 'Procesando...' : 'Confirmar Envío'}
                </button>

              </form>
            </>
          ) : (
            <div className="success-view">
              <div className="success-icon-large">🎉</div>
              <h3>¡Envío Exitoso!</h3>
              <p>Has enviado <strong>S/ {parseFloat(monto).toFixed(2)}</strong> a {receiverName}</p>
              <button className="btn-secondary" onClick={() => {
                setStep(1);
                setTelefono('');
                setMonto('');
                setReceiverWalletId(null);
                setReceiverName('');
              }}>
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