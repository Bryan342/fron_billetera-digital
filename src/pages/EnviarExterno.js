import React, { useState } from 'react';
import '../styles/enviarExterno.css'; 

// ==============================================================
// CONFIGURACIÓN DE ENDPOINTS
// ==============================================================
const API_BASE_URL = 'http://pixel-money.koyeb.app';
const URL_VALIDATE_PHONE = `${API_BASE_URL}/p2p/check`; 
const URL_EXECUTE_TRANSFER = `${API_BASE_URL}/api/transfer`;

// ==============================================================
// 🚀 APP PRINCIPAL
// ==============================================================

// Nota: Aquí quité el 'export default' para ponerlo al final
function EnviarExterno() {
  const [step, setStep] = useState(1);
  const [selectedBank, setSelectedBank] = useState('');
  const [telefono, setTelefono] = useState('');
  const [monto, setMonto] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingText, setLoadingText] = useState('Procesando...');

  const isPixelMoney = selectedBank === 'PIXEL_MONEY';
  const isSubmitDisabled = isProcessing || !selectedBank || !telefono || !monto || !isPixelMoney;

  const handleRealExternalTransfer = async (e) => {
    e.preventDefault();
    if (!isPixelMoney) return;

    setIsProcessing(true);
    setLoadingText('Verificando cuenta...');

    try {
      // PASO 1: Validar
      const validationResponse = await fetch(`${URL_VALIDATE_PHONE}/${telefono}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!validationResponse.ok) {
        const errorData = await validationResponse.json().catch(() => ({}));
        throw new Error(errorData.message || `El número ${telefono} no está registrado.`);
      }

      setLoadingText(`Procesando envío...`);

      // PASO 2: Transferir
      const payload = {
        bank: selectedBank,
        destination_phone: telefono,
        amount: parseFloat(monto),
        currency: "SOL",
        date: new Date().toISOString()
      };

      const transferResponse = await fetch(URL_EXECUTE_TRANSFER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!transferResponse.ok) {
        const errorData = await transferResponse.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al procesar la transferencia.");
      }

      // PASO 3: Éxito
      setLoadingText('¡Transferencia Exitosa!');
      setStep(2); 

    } catch (error) {
      console.error("Error externo:", error);
      alert(error.message);
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
                <h2>Transferencia Externa</h2>
                <p className="sub-title">Envía dinero al instante</p>
              </header>

              <form onSubmit={handleRealExternalTransfer} className="form-stack">
                <div className="form-group">
                  <label>Entidad de Destino</label>
                  <select 
                    className="input-modern"
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    required
                  >
                    <option value="">-- Seleccionar --</option>
                    <option value="PIXEL_MONEY">Pixel Money (Oficial)</option>
                    <option value="BCP">BCP (Yape)</option>
                    <option value="INTERBANK">Interbank (Plin)</option>
                    <option value="BBVA">BBVA</option>
                    <option value="SCOTIABANK">Scotiabank</option>
                  </select>
                </div>

                {selectedBank && !isPixelMoney && (
                  <div className="warning-box">
                    ⚠️ Convenio no oficial<br/>
                    <span style={{fontWeight: 400, fontSize: '0.8rem'}}>
                      Las transferencias a {selectedBank} no están disponibles.
                    </span>
                  </div>
                )}

                <div className="form-group">
                  <label>Celular del Beneficiario</label>
                  <input
                    type="text"
                    placeholder="Ej: 999 888 777"
                    maxLength={9}
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ''))}
                    className="input-modern"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Monto a enviar</label>
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
                  {isProcessing ? loadingText : 'Confirmar Envío'}
                </button>
              </form>
            </>
          ) : (
            <div className="success-view">
              <div className="success-icon-large">🎉</div>
              <h3>¡Envío Exitoso!</h3>
              <div className="amount-display">S/ {parseFloat(monto).toFixed(2)}</div>
              <button className="btn-secondary" onClick={() => {
                setStep(1); setTelefono(''); setMonto(''); setSelectedBank('');
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

// ✅ AQUÍ ESTÁ EL EXPORT DEFAULT (Solo uno, al final)
export default EnviarExterno;