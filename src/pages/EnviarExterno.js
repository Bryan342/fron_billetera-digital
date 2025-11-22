import React, { useState, useEffect } from 'react';
import '../styles/enviarExterno.css';

// ==============================================================
// CONFIGURACIÓN DE ENDPOINTS Y LLAVES
// ==============================================================
const API_BASE_URL = 'https://pixel-money.koyeb.app';

// Endpoint para validar si el usuario existe (GET)
const URL_VALIDATE_PHONE = `${API_BASE_URL}/p2p/check`;

// Endpoint para ejecutar la transferencia (POST)
const URL_INBOUND_TRANSFER = `${API_BASE_URL}/api/v1/inbound-transfer`;

// Header de seguridad
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
  // Ahora también validamos que el status sea 'valid' antes de permitir enviar
  const isSubmitDisabled = isProcessing || !selectedBank || !telefono || !monto || !isPixelMoney || verificationStatus !== 'valid';

  // ============================================================
  // ⚡ EFECTO: VERIFICACIÓN AUTOMÁTICA DE TELÉFONO
  // ============================================================
  useEffect(() => {
    // Solo verificamos si tiene 9 dígitos y es Pixel Money
    if (telefono.length === 9 && isPixelMoney) {
      const verifyUser = async () => {
        setVerificationStatus('checking');
        setBeneficiaryName('');
        
        try {
          const response = await fetch(`${URL_VALIDATE_PHONE}/${telefono}`);
          if (response.ok) {
            // Intentamos obtener el nombre si la API lo devuelve
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

      // Debounce simple para no saturar si escribe muy rápido (espera 500ms)
      const timeoutId = setTimeout(verifyUser, 500);
      return () => clearTimeout(timeoutId);
    } else {
      // Resetear si borra números
      setVerificationStatus('idle');
      setBeneficiaryName('');
    }
  }, [telefono, isPixelMoney]);


  // ============================================================
  // 🔄 PROCESAR TRANSFERENCIA (LOGICA PREVIA)
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

      const payload = {
        destination_phone_number: telefono,
        amount: parseFloat(monto),
        external_transaction_id: transactionId
      };

      console.log("Enviando payload:", payload);

      const transferResponse = await fetch(URL_INBOUND_TRANSFER, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-wallet-b2b-key': WALLET_API_KEY 
        },
        body: JSON.stringify(payload)
      });

      const responseData = await transferResponse.json().catch(() => ({}));

      if (!transferResponse.ok) {
        throw new Error(responseData.message || responseData.error || "Error al procesar la transferencia.");
      }

      setLoadingText('¡Transferencia Exitosa!');
      setStep(2); 

    } catch (error) {
      console.error("Error en la transacción:", error);
      const cleanError = error.message.replace('Error:', '').trim();
      alert(`⚠️ Falló el envío: ${cleanError}`);
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
                    // Cambio de color según estado
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
              <h3>¡Abono Realizado!</h3>
              <p>El dinero ha sido cargado a la billetera.</p>
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