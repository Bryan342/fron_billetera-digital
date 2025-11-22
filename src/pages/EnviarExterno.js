import React, { useState, useEffect } from 'react';
import '../styles/enviarExterno.css';

// ==============================================================
// CONFIGURACIÓN DE ENDPOINTS Y LLAVES
// ==============================================================
const API_BASE_URL = 'https://pixel-money.koyeb.app';
const WALLET_SERVICE_URL = 'https://billetera-production.up.railway.app/api/v1/wallets';

// Endpoint para validar si el usuario existe (GET)
const URL_VALIDATE_PHONE = `${API_BASE_URL}/p2p/check`;

// Endpoint para ejecutar la transferencia al destino (POST)
const URL_INBOUND_TRANSFER = `${API_BASE_URL}/api/v1/inbound-transfer`;

// Header de seguridad para el Inbound
const WALLET_API_KEY = 'G2a8-SuperClaveSecreta-Billetera-2025-XyZ';

// ==============================================================
// 🚀 APP PRINCIPAL
// ==============================================================

function EnviarExterno() {
  const [step, setStep] = useState(1);
  const [selectedBank, setSelectedBank] = useState('');
  const [telefono, setTelefono] = useState('');
  const [monto, setMonto] = useState('');
  
  // Estados para la verificación del teléfono
  const [verificationStatus, setVerificationStatus] = useState('idle'); // idle, checking, valid, invalid
  const [beneficiaryName, setBeneficiaryName] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingText, setLoadingText] = useState('Procesando...');

  const isPixelMoney = selectedBank === 'PIXEL_MONEY';
  const isSubmitDisabled = isProcessing || !selectedBank || !telefono || !monto || !isPixelMoney || verificationStatus !== 'valid';

  // ============================================================
  // ⚡ EFECTO: VERIFICACIÓN AUTOMÁTICA DE TELÉFONO
  // ============================================================
  useEffect(() => {
    if (telefono.length === 9 && isPixelMoney) {
      const verifyUser = async () => {
        setVerificationStatus('checking');
        setBeneficiaryName('');
        
        try {
          const response = await fetch(`${URL_VALIDATE_PHONE}/${telefono}`);
          if (response.ok) {
            const data = await response.json().catch(() => ({}));
            setVerificationStatus('valid');
            setBeneficiaryName(data.message || 'Usuario Verificado');
          } else {
            setVerificationStatus('invalid');
            setBeneficiaryName('');
          }
        } catch (error) {
          console.error("Error validando usuario:", error);
          setVerificationStatus('invalid');
        }
      };

      const timeoutId = setTimeout(verifyUser, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setVerificationStatus('idle');
      setBeneficiaryName('');
    }
  }, [telefono, isPixelMoney]);


  // ============================================================
  // 🔄 PROCESAR TRANSFERENCIA (LOGICA NUEVA AGREGADA)
  // ============================================================
  const generateTransactionId = () => {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    return `EXT-${randomNum}-ABC`;
  };

  const handleRealExternalTransfer = async (e) => {
    e.preventDefault();
    if (!isPixelMoney) return;

    setIsProcessing(true);
    setLoadingText('Conectando con la Billetera...');

    try {
      const transactionId = generateTransactionId();
      const amountNumber = parseFloat(monto);

      // ----------------------------------------------------------
      // PASO 1: REALIZAR EL ABONO A LA PERSONA EXTERNA (INBOUND)
      // ----------------------------------------------------------
      const payloadInbound = {
        destination_phone_number: telefono,
        amount: amountNumber,
        external_transaction_id: transactionId
      };

      console.log("1. Enviando dinero al destino:", payloadInbound);

      const transferResponse = await fetch(URL_INBOUND_TRANSFER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-b2b-key': WALLET_API_KEY
        },
        body: JSON.stringify(payloadInbound)
      });

      const responseData = await transferResponse.json().catch(() => ({}));

      if (!transferResponse.ok) {
        throw new Error(responseData.message || responseData.error || "Error al procesar la transferencia externa.");
      }

      // =================================================================================
      // 🔻🔻🔻 AQUÍ COMIENZA LA LÓGICA DE DESCUENTO AL USUARIO LOGUEADO 🔻🔻🔻
      // =================================================================================
      setLoadingText('Debitando de tu cuenta...');

      // A. OBTENER TOKEN Y ID DEL LOCALSTORAGE
      const token = localStorage.getItem('token');
      const userDataString = localStorage.getItem("userData");
      
      if (!token || !userDataString) {
        throw new Error("Error de sesión: No se encontró el token o datos del usuario.");
      }
      
      const userData = JSON.parse(userDataString);
      // Asumimos que el objeto userData tiene una propiedad 'id' o 'user_id'. Ajusta si es diferente.
      const currentUserId = userData.id || userData.user_id; 

      // B. CONSULTAR LA WALLET DEL USUARIO PARA OBTENER EL WALLET_ID
      console.log(`2. Consultando wallet del usuario ID: ${currentUserId}`);
      
      const balanceUrl = `${WALLET_SERVICE_URL}/${currentUserId}/balance`;
      
      const balanceResponse = await fetch(balanceUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!balanceResponse.ok) {
        throw new Error("No se pudo obtener la información de tu billetera.");
      }

      const balanceData = await balanceResponse.json();
      // Obtenemos el wallet_id de la respuesta (según tu ejemplo: { "wallet_id": 6, ... })
      const senderWalletId = balanceData.wallet_id;

      if (!senderWalletId) {
        throw new Error("ID de billetera no encontrado.");
      }

      // C. DEBITAR EL DINERO AL USUARIO LOGUEADO
      console.log(`3. Debitando wallet ID: ${senderWalletId}`);
      
      const debitPayload = {
        walletId: String(senderWalletId), // Convertimos a string por si acaso
        amount: amountNumber,
        currency: "SOL",
        externalTransactionId: transactionId, // Usamos el mismo ID para trazabilidad
        counterpartyId: "" // Vacío como solicitaste porque es externo
      };

      const debitResponse = await fetch(`${WALLET_SERVICE_URL}/debit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(debitPayload)
      });

      if (!debitResponse.ok) {
        const debitError = await debitResponse.json().catch(() => ({}));
        // NOTA: Si falla aquí, el dinero ya se envió al otro usuario pero no se descontó a este.
        // En un sistema real, esto requeriría una "Saga" o transacción distribuida.
        throw new Error(debitError.message || "Error al debitar el saldo, pero la transferencia externa se envió.");
      }

      // =================================================================================
      // 🔺🔺🔺 FIN DE LA LÓGICA DE DESCUENTO 🔺🔺🔺
      // =================================================================================

      setLoadingText('¡Transferencia Exitosa!');
      setStep(2);

    } catch (error) {
      console.error("Error en la transacción:", error);
      const cleanError = error.message.replace('Error:', '').trim();
      alert(`⚠️ Alerta: ${cleanError}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="app-layout">
      <main className="content-area">
        <div className="card-transferencia">
          {step === 1 ? (
            <>
              <header className="card-header">
                <h2>Transferencia B2B</h2>
                <p className="sub-title">Simulación de Inbound (Recarga)</p>
              </header>

              <form onSubmit={handleRealExternalTransfer} className="form-stack">
                <div className="form-group">
                  <label>Entidad de Origen</label>
                  <select
                    className="input-modern"
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    required
                  >
                    <option value="">-- Seleccionar --</option>
                    <option value="PIXEL_MONEY">Pixel Money (Partner)</option>
                    <option value="BCP">BCP (Yape)</option>
                    <option value="INTERBANK">Interbank (Plin)</option>
                  </select>
                </div>

                {selectedBank && !isPixelMoney && (
                  <div className="warning-box">
                    ⚠️ Integración no activa
                  </div>
                )}

                <div className="form-group">
                  <label>Celular de Destino (Wallet)</label>
                  <input
                    type="text"
                    placeholder="Ej: 999 888 777"
                    maxLength={9}
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ''))}
                    className={`input-modern ${
                      verificationStatus === 'valid' ? 'input-valid' :
                      verificationStatus === 'invalid' ? 'input-invalid' : ''
                    }`}
                    required
                  />
                  
                  {/* Feedback Visual de Verificación */}
                  {verificationStatus === 'checking' && (
                    <div className="validation-msg msg-checking">
                      ⏳ Verificando cuenta...
                    </div>
                  )}
                  {verificationStatus === 'valid' && (
                    <div className="validation-msg msg-valid">
                      ✅ {beneficiaryName}
                    </div>
                  )}
                  {verificationStatus === 'invalid' && (
                    <div className="validation-msg msg-invalid">
                      ❌ Cuenta no encontrada en Pixel Money
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Monto a transferir</label>
                  <div className="currency-input-wrapper">
                    <span className="currency-symbol">S/</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={monto}
                      onChange={(e) => setMonto(e.target.value)}
                      className="amount-hero"
                      step="0.01"
                      min="0.10"
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn-primary" disabled={isSubmitDisabled}>
                  {isProcessing ? loadingText : 'Ejecutar Transacción'}
                </button>
              </form>
            </>
          ) : (
            <div className="success-view">
              <div className="success-icon-large">🎉</div>
              <h3>¡Envío Realizado!</h3>
              <p>El dinero ha sido enviado y descontado de tu saldo.</p>
              <div className="amount-display">S/ {parseFloat(monto).toFixed(2)}</div>
              <button className="btn-secondary" onClick={() => {
                setStep(1); setTelefono(''); setMonto(''); setSelectedBank(''); setVerificationStatus('idle');
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

export default EnviarExterno;