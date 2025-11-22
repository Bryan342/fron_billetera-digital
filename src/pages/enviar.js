import React, { useState, useEffect } from 'react';
import Sidebar from '../components/sidebar';
import '../styles/enviar.css';

// 🔴 ENDPOINTS REALES (Solo para uso interno)
const URL_USERS_SERVICE = 'https://userservicesanti.onrender.com/users';
const URL_WALLET_SERVICE = 'https://billetera-production.up.railway.app/api/v1/wallets';
const URL_TX_SERVICE = 'https://transactionmicroservicios-production.up.railway.app/transactions';

function EnviarInterno() {
  const [step, setStep] = useState(1);
  const [telefono, setTelefono] = useState('');
  const [monto, setMonto] = useState('');

  // Estados Lógicos
  const [senderWalletId, setSenderWalletId] = useState(null);
  const [receiverWalletId, setReceiverWalletId] = useState(null);
  const [receiverName, setReceiverName] = useState('');

  // Feedback UI
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. Cargar MI billetera al inicio
  useEffect(() => {
    const cargarMiBilletera = async () => {
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem("userData"));
      if (!token || !userData) return;

      try {
        const res = await fetch(`${URL_WALLET_SERVICE}/${userData.user_id}/balance`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSenderWalletId(data.wallet_id);
        }
      } catch (err) {
        console.error("Error cargando mi wallet:", err);
      }
    };
    cargarMiBilletera();
  }, []);

  // 2. Buscar Destinatario automáticamente
  useEffect(() => {
    if (telefono.length !== 9) {
      setReceiverWalletId(null);
      setReceiverName('');
      return;
    }
    const timeout = setTimeout(() => buscarUsuarioLuca(telefono), 500);
    return () => clearTimeout(timeout);
  }, [telefono]);

  const buscarUsuarioLuca = async (phone) => {
    setIsSearching(true);
    setSearchError(null);
    const token = localStorage.getItem('token');

    try {
      // A) Buscar Usuario
      const userRes = await fetch(`${URL_USERS_SERVICE}/phone/${phone}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!userRes.ok) throw new Error("Usuario no encontrado");
      const userData = await userRes.json();
      
      setReceiverName(userData.email); // O userData.name si existe

      // B) Buscar su Billetera
      const walletRes = await fetch(`${URL_WALLET_SERVICE}/${userData.user_id}/balance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!walletRes.ok) throw new Error("Sin billetera activa");
      const walletData = await walletRes.json();
      
      setReceiverWalletId(walletData.wallet_id);

    } catch (error) {
      setSearchError("El usuario no usa Banca Luca.");
      setReceiverWalletId(null);
    } finally {
      setIsSearching(false);
    }
  };

  // 3. Enviar Dinero (Real)
  const handleTransfer = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    const token = localStorage.getItem('token');

    try {
      const payload = {
        idempotencyKey: Math.random().toString(36).substring(2),
        sender_wallet: senderWalletId,
        receiver_wallet: receiverWalletId,
        amount: parseFloat(monto),
        currency: "SOL"
      };

      const response = await fetch(URL_TX_SERVICE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setStep(2); // Éxito
      } else {
        const errData = await response.json();
        alert(`Error: ${errData.message || "Fallo interno"}`);
      }
    } catch (error) {
      alert("Error de conexión con el servidor.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="content-area">
        <div className="card-transferencia">
          {step === 1 ? (
            <>
              <header className="card-header">
                <h2>Banca Luca</h2>
                <p className="sub-title">Transferencias internas gratuitas</p>
              </header>

              <form onSubmit={handleTransfer} className="form-stack">
                <div className="form-group">
                  <label>Celular del destinatario</label>
                  <div className="input-with-status">
                    <input
                      type="text"
                      placeholder="Ej: 999 000 111"
                      maxLength={9}
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ''))}
                      className={`input-modern ${searchError ? 'input-error' : ''}`}
                      required
                    />
                    <div className="status-icon">
                      {isSearching && <div className="spinner-small"></div>}
                      {!isSearching && receiverWalletId && <span style={{ color: '#10b981' }}>✔</span>}
                    </div>
                  </div>
                  {searchError && <span className="error-text">{searchError}</span>}
                  {receiverName && !searchError && (
                    <div className="destinatario-badge">👤 {receiverName}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Monto</label>
                  <div className="currency-input-wrapper">
                    <span className="currency-symbol">S/</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={monto}
                      onChange={(e) => setMonto(e.target.value)}
                      className="amount-hero"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isProcessing || !receiverWalletId || !monto}
                >
                  {isProcessing ? 'Procesando...' : 'Transferir Ahora'}
                </button>
              </form>
            </>
          ) : (
            <div className="success-view">
              <div className="success-icon-large">🎉</div>
              <h3>¡Envío Exitoso!</h3>
              <div className="amount-display">S/ {parseFloat(monto).toFixed(2)}</div>
              <p>Destino: <strong>{receiverName}</strong></p>
              <button className="btn-secondary" onClick={() => {
                setStep(1); setTelefono(''); setMonto(''); setReceiverName('');
              }}>Nueva Operación</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Enviar;