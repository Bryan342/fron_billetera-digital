import React, { useState, useEffect } from 'react';
import { LucideArrowRight, LucideBuilding2 } from 'lucide-react';
import { API_URLS, authFetch, interopFetch } from './apiConfig'; 

const EnviarExterno = () => {
    // --- ESTADOS ---
    const [step, setStep] = useState(1); // 1:Buscar, 2:Elegir, 3:Monto, 4:Éxito
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Datos de la transacción
    const [myPhone, setMyPhone] = useState(null);
    const [targetPhone, setTargetPhone] = useState('');
    const [foundWallets, setFoundWallets] = useState([]);
    const [selectedWallet, setSelectedWallet] = useState(null);
    const [amount, setAmount] = useState('');

    // 1. AL CARGAR: OBTENER MI NÚMERO
    useEffect(() => {
        const fetchMyNumber = async () => {
            try {
                const userData = JSON.parse(localStorage.getItem("userData"));
                if (!userData || !userData.user_id) return;
                const res = await authFetch(`${API_URLS.USERS}/${userData.user_id}`);
                const data = await res.json();
                if (data.phone) setMyPhone(data.phone);
            } catch (err) {
                console.error("Error obteniendo mi número:", err);
                setError("Error de sesión. Por favor relogueate.");
            }
        };
        fetchMyNumber();
    }, []);

    // 2. BUSCAR BILLETERAS (Con filtro anti-LUCA)
    const handleSearch = async () => {
        if (targetPhone.length !== 9) return;
        setLoading(true);
        setError(null);
        setFoundWallets([]);

        try {
            const res = await interopFetch(`${API_URLS.INTEROP_WALLETS}/${targetPhone}`);
            const json = await res.json();

            if (json.success && json.data && json.data.length > 0) {
                // 👇👇👇 AQUÍ ESTÁ EL CAMBIO CLAVE: FILTRAMOS "LUCA" 👇👇👇
                const walletsFiltradas = json.data.filter(wallet => wallet.appName !== 'LUCA');
                
                if (walletsFiltradas.length > 0) {
                    setFoundWallets(walletsFiltradas);
                    setStep(2); // Pasamos a elegir
                } else {
                    setError("Este número solo tiene cuenta en LUCA. Usa la pestaña 'A Contacto Luca'.");
                }
            } else {
                setError("El número no tiene billeteras interbancarias registradas.");
            }
        } catch (err) {
            console.error(err);
            setError("No se pudo conectar con el servicio interbancario.");
        } finally {
            setLoading(false);
        }
    };

    // 3. ELEGIR BILLETERA
    const handleSelectWallet = (wallet) => {
        setSelectedWallet(wallet);
        setStep(3); // Pasamos a poner monto
    };

    // 4. ENVIAR DINERO
    const handleTransfer = async (e) => {
        e.preventDefault();
        if (!amount || !myPhone || !selectedWallet) return;
        
        setLoading(true);
        try {
            const payload = {
                fromIdentifier: myPhone,
                toIdentifier: targetPhone,
                toAppName: selectedWallet.appName,
                amount: parseFloat(amount)
            };

            const res = await interopFetch(API_URLS.INTEROP_SEND, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok || data.success) {
                setStep(4); // Éxito
            } else {
                setError(data.message || "La transferencia falló.");
            }
        } catch (err) {
            console.error(err);
            setError("Error de conexión al procesar el pago.");
        } finally {
            setLoading(false);
        }
    };

    // --- VISTAS ---

    // VISTA 1: BUSCADOR
    if (step === 1) return (
        <div className="step-container fade-in">
            <h3 className="step-title">Transferencia a Otros Bancos</h3>
            <p style={{textAlign:'center', color:'#6b7280', marginBottom:'20px'}}>
                Envía dinero a Pixel Money, Interbank y más.
            </p>
            <div className="input-search-wrapper">
                <input 
                    type="text" 
                    placeholder="Celular (9 dígitos)" 
                    value={targetPhone}
                    maxLength={9}
                    onChange={(e) => setTargetPhone(e.target.value.replace(/\D/g, ''))}
                    className="input-giant-search"
                    autoFocus
                />
                {loading && <div className="spinner-small"></div>}
            </div>
            {error && <div className="alert-error fade-in" style={{color: 'red', textAlign:'center', margin: '10px 0'}}>❌ {error}</div>}
            
            <button 
                className="btn-primary" 
                onClick={handleSearch}
                disabled={loading || targetPhone.length !== 9 || !myPhone}
            >
                {loading ? 'Buscando...' : 'Buscar Destino'}
            </button>
        </div>
    );

    // VISTA 2: LISTA DE BILLETERAS
    if (step === 2) return (
        <div className="step-container fade-in">
            <button onClick={() => setStep(1)} className="btn-back">← Volver</button>
            <h3 style={{marginTop:'10px'}}>Elige destino</h3>
            <p style={{color: '#6b7280', fontSize:'0.9rem'}}>Resultados para: {targetPhone}</p>
            
            <div className="wallets-list" style={{marginTop:'20px'}}>
                {foundWallets.map((wallet, idx) => (
                    <div key={idx} className="contact-card" onClick={() => handleSelectWallet(wallet)}>
                        <div className="avatar-circle" style={{background:'#4f46e5'}}>
                            <LucideBuilding2 size={24} />
                        </div>
                        <div className="contact-info">
                            <h4 style={{margin:0}}>{wallet.userName}</h4>
                            <span className="badge-app" style={{marginTop:'4px'}}>{wallet.appName}</span>
                        </div>
                        <div className="arrow-icon"><LucideArrowRight size={20} /></div>
                    </div>
                ))}
            </div>
        </div>
    );

    // VISTA 3: MONTO (Aquí se arregló el avatar estirado)
    if (step === 3) return (
        <div className="step-container fade-in">
            <button onClick={() => setStep(2)} className="btn-back">← Volver</button>
            
            <div className="recipient-summary" style={{marginTop: '20px'}}>
                {/* El estilo inline asegura que el color de fondo se aplique */}
                <div className="avatar-large" style={{background:'#4f46e5'}}>
                    {selectedWallet.userName.charAt(0).toUpperCase()}
                </div>
                <h3 style={{margin:'0'}}>{selectedWallet.userName}</h3>
                <div style={{margin: '5px 0'}}>
                     <span className="badge-app" style={{fontSize:'0.9rem'}}>{selectedWallet.appName}</span>
                </div>
                <p style={{color: '#6b7280', margin:0}}>{targetPhone}</p>
            </div>

            <form onSubmit={handleTransfer} className="form-amount" style={{marginTop:'30px'}}>
                <div className="input-currency-wrapper">
                    <span className="currency-symbol">S/</span>
                    <input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="input-giant-amount"
                        autoFocus
                    />
                </div>
                 {error && <div className="alert-error fade-in" style={{color: 'red', textAlign:'center', margin: '10px 0'}}>❌ {error}</div>}
                <button type="submit" className="btn-primary full-width" disabled={loading || !amount || parseFloat(amount) <= 0}>
                    {loading ? 'Procesando...' : 'Transferir Ahora'}
                </button>
            </form>
        </div>
    );

    // VISTA 4: ÉXITO
    return (
        <div className="success-view fade-in" style={{textAlign:'center', paddingTop:'20px'}}>
            <div style={{fontSize:'4rem'}}>🎉</div>
            <h2 style={{color:'#10b981'}}>¡Enviado Interbancario!</h2>
            
            <div style={{background:'#f9fafb', padding:'20px', borderRadius:'12px', margin:'20px 0', border:'1px dashed #ccc'}}>
                <p style={{margin:0, color:'#6b7280'}}>Destino</p>
                <h3 style={{margin:'5px 0'}}>{selectedWallet.userName}</h3>
                <span className="badge-app">{selectedWallet.appName}</span>
                <h1 style={{color:'#2563eb', fontSize:'2.5rem', margin:'15px 0'}}>
                    S/ {parseFloat(amount).toFixed(2)}
                </h1>
                 <p style={{fontSize: '0.8rem', color: '#9ca3af'}}>Celular destino: {targetPhone}</p>
            </div>

            <button onClick={() => {setStep(1); setTargetPhone(''); setAmount('');}} className="btn-primary">
                Nueva Operación
            </button>
        </div>
    );
};

// 👇👇👇 ESTILOS LOCALES PARA ARREGLAR EL AVATAR 👇👇👇
const styles = `
    .badge-app { background: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; display: inline-block; }
    
    /* Esto arregla la "línea morada". Fuerza al avatar a ser un círculo centrado */
    .recipient-summary .avatar-large {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 2rem;
        margin: 0 auto 15px auto; /* Centrado horizontal y margen abajo */
        color: white;
        font-weight: bold;
    }
`;

// Inyectamos los estilos al final del componente
const EnviarExternoWithStyles = () => (
    <>
        <style>{styles}</style>
        <EnviarExterno />
    </>
);

export default EnviarExternoWithStyles;