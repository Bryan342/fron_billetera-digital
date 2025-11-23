import React, { useState } from 'react';
import { API_URLS, authFetch } from '../services/apiConfig';

const AmountScreen = ({ contact, myWalletId, onBack, onSuccess }) => {
    const [amount, setAmount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleTransfer = async (e) => {
        e.preventDefault();
        if (!amount || parseFloat(amount) <= 0) return alert("Ingresa un monto válido");
        
        setIsProcessing(true);

        try {
            // PAYLOAD EXACTO COMO LO PIDE EL MICROSERVICIO
            const payload = {
                idempotencyKey: Math.random().toString(36).substring(2) + Date.now().toString(36),
                sender_wallet: parseInt(myWalletId),      // ID Entero
                receiver_wallet: parseInt(contact.walletId), // ID Entero
                amount: parseFloat(amount),
                currency: "SOL"
            };

            const response = await authFetch(API_URLS.TRANSACTION, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                onSuccess(data, amount); // Pasamos datos al padre para mostrar éxito
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.message || 'Falló la transferencia'}`);
            }

        } catch (error) {
            console.error(error);
            alert("Error de conexión al procesar el pago");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="amount-screen fade-in">
            {/* Header con botón atrás */}
            <div className="header-actions">
                <button onClick={onBack} className="btn-back">← Volver</button>
                <span className="step-indicator">Paso 2 de 2</span>
            </div>

            <div className="recipient-summary">
                <div className="avatar-large">
                    {contact.name.charAt(0).toUpperCase()}
                </div>
                <h3>{contact.name}</h3>
                <p>{contact.phone}</p>
            </div>

            <form onSubmit={handleTransfer} className="form-amount">
                <label>¿Cuánto quieres enviar?</label>
                <div className="input-currency-wrapper">
                    <span className="currency">S/</span>
                    <input 
                        type="number" 
                        step="0.01"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="input-giant"
                        autoFocus
                    />
                </div>

                <button 
                    type="submit" 
                    className="btn-primary full-width"
                    disabled={isProcessing || !amount}
                >
                    {isProcessing ? 'Procesando...' : 'Confirmar Envío'}
                </button>
            </form>

            <style>{`
                .header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                .btn-back { background: none; border: none; color: #6b7280; cursor: pointer; font-size: 1rem; }
                
                .recipient-summary { text-align: center; margin-bottom: 30px; }
                .avatar-large { 
                    width: 80px; height: 80px; background: #9333ea; color: white; 
                    border-radius: 50%; margin: 0 auto 10px; display: flex; 
                    align-items: center; justify-content: center; font-size: 2.5rem; 
                }
                
                .input-currency-wrapper { 
                    display: flex; align-items: center; justify-content: center; 
                    border-bottom: 2px solid #2563eb; margin: 20px 0 40px; 
                }
                .currency { font-size: 2rem; color: #2563eb; font-weight: bold; margin-right: 10px; }
                .input-giant { 
                    border: none; font-size: 3rem; width: 200px; text-align: center; 
                    outline: none; background: transparent; color: #1f2937; font-weight: bold;
                }
                .input-giant::placeholder { color: #e5e7eb; }
                
                .full-width { width: 100%; padding: 15px; font-size: 1.1rem; border-radius: 12px; }
            `}</style>
        </div>
    );
};

export default AmountScreen;