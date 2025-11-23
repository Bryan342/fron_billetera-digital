import React, { useState, useEffect } from 'react';
import Sidebar from '../components/sidebar';

// 👇 1. IMPORTAMOS LA CONFIGURACIÓN Y LOS COMPONENTES NUEVOS
// (Rutas ajustadas según la imagen que me enviaste)
import { API_URLS, authFetch } from '../componentsEnvio/apiConfig';
import ContactSearch from '../componentsEnvio/ContactSearch';
import AmountScreen from '../componentsEnvio/AmountScreen';
import EnviarExterno from '../componentsEnvio/EnviarExterno';

const Enviar = () => {
    const [activeTab, setActiveTab] = useState('interno');
    
    // Estados para el flujo INTERNO (Banca Luca)
    const [step, setStep] = useState(1);
    const [myWalletId, setMyWalletId] = useState(null);
    const [selectedContact, setSelectedContact] = useState(null);
    const [lastTxData, setLastTxData] = useState(null);

    // 1. Obtener mi Billetera al cargar (Para saber quién envía en el flujo interno)
    useEffect(() => {
        const fetchMyWallet = async () => {
            const userData = JSON.parse(localStorage.getItem("userData"));
            const token = localStorage.getItem("token");
            
            if (!userData || !token) return;
            
            try {
                const res = await authFetch(`${API_URLS.WALLET}/${userData.user_id}/balance`);
                if (res.ok) {
                    const data = await res.json();
                    setMyWalletId(data.wallet_id);
                }
            } catch (error) {
                console.error("Error cargando billetera propia", error);
            }
        };
        fetchMyWallet();
    }, []);

    // Manejadores del flujo Interno
    const handleContactSelect = (contactData) => {
        setSelectedContact(contactData);
        setStep(2);
    };

    const handleSuccess = (txResponse, amountSent) => {
        setLastTxData({ amount: amountSent, ...txResponse });
        setStep(3);
    };

    const resetFlow = () => {
        setStep(1);
        setSelectedContact(null);
        setLastTxData(null);
    };

    return (
        <div className="app-container">
            {/* MANTENEMOS TUS ESTILOS CSS AQUÍ */}
            <style>{`
                :root { --primary: #2563eb; --primary-dark: #1e40af; --bg-gray: #f3f4f6; }
                .app-container { display: flex; height: 100vh; font-family: 'Segoe UI', sans-serif; background: #fff; overflow: hidden; }
                
                /* Estilos Generales */
                .content-area { flex: 1; padding: 40px; background: var(--bg-gray); display: flex; flex-direction: column; align-items: center; overflow-y: auto; }
                .card-transferencia { background: white; width: 100%; max-width: 480px; border-radius: 20px; padding: 30px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); min-height: 500px; position: relative; }

                /* Tabs */
                .tabs-container { display: flex; background: #e5e7eb; padding: 5px; border-radius: 50px; margin-bottom: 30px; width: fit-content; }
                .tab-btn { padding: 10px 25px; border: none; border-radius: 40px; cursor: pointer; font-weight: 600; color: #6b7280; background: transparent; transition: 0.3s; }
                .tab-btn.active { background: white; color: var(--primary); box-shadow: 0 2px 5px rgba(0,0,0,0.05); }

                /* Elementos UI Comunes */
                .btn-primary { background: var(--primary); color: white; border: none; padding: 18px; border-radius: 12px; font-size: 1.1rem; font-weight: bold; cursor: pointer; width: 100%; transition: 0.2s; }
                .btn-primary:hover:not(:disabled) { background: var(--primary-dark); transform: translateY(-1px); }
                .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
                .btn-back { background: none; border: none; color: #6b7280; font-weight: 600; cursor: pointer; padding: 0; }
                .fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                
                /* Estilos Específicos (Necesarios si los componentes hijos no tienen su propio CSS) */
                .input-search-wrapper { border-bottom: 2px solid #e5e7eb; padding: 10px 0; margin: 20px 0; display: flex; align-items: center; }
                .input-giant-search { width: 100%; border: none; font-size: 1.5rem; text-align: center; outline: none; letter-spacing: 2px; color: #374151; }
                .contact-card { margin-top: 20px; background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 15px; display: flex; align-items: center; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
                .avatar-circle { width: 50px; height: 50px; background: var(--primary); color: white; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 1.2rem; font-weight: bold; margin-right: 15px; }
                
                @media (max-width: 768px) {
                    .app-container { flex-direction: column; }
                    .content-area { padding-bottom: 90px; }
                }
            `}</style>

            <Sidebar />

            <main className="content-area">
                {/* PESTAÑAS SUPERIORES */}
                <div className="tabs-container">
                    <button 
                        className={`tab-btn ${activeTab === 'interno' ? 'active' : ''}`}
                        onClick={() => setActiveTab('interno')}
                    >
                        A Contacto Luca
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'externo' ? 'active' : ''}`}
                        onClick={() => setActiveTab('externo')}
                    >
                        A Otros Bancos
                    </button>
                </div>

                <div className="card-transferencia">
                    
                    {/* === OPCIÓN 2: TRANSFERENCIA EXTERNA (INTEROPERABILIDAD) === */}
                    {activeTab === 'externo' ? (
                        // Todo el flujo externo ahora vive en este componente limpio
                        <EnviarExterno />
                    ) : (
                        
                        // === OPCIÓN 1: TRANSFERENCIA INTERNA (ORIGINAL) ===
                        <>
                            {/* Paso 1: Buscar */}
                            {step === 1 && (
                                <ContactSearch onContactSelect={handleContactSelect} />
                            )}
                            
                            {/* Paso 2: Monto */}
                            {step === 2 && selectedContact && (
                                <AmountScreen 
                                    contact={selectedContact}
                                    myWalletId={myWalletId}
                                    onBack={() => setStep(1)}
                                    onSuccess={handleSuccess}
                                />
                            )}

                            {/* Paso 3: Éxito (Interno) */}
                            {step === 3 && (
                                <div className="success-view fade-in" style={{textAlign: 'center', paddingTop: '20px'}}>
                                    <div style={{fontSize: '4rem', marginBottom: '10px'}}>🎉</div>
                                    <h2 style={{color: '#10b981', margin: '0'}}>¡Envío Exitoso!</h2>
                                    
                                    <div style={{background: '#f9fafb', border: '1px dashed #d1d5db', borderRadius: '16px', padding: '30px', margin: '20px 0'}}>
                                        <p style={{margin: '0', color: '#6b7280', fontSize: '0.9rem'}}>Le enviaste a</p>
                                        <h3 style={{margin: '5px 0', fontSize: '1.2rem'}}>{selectedContact?.name}</h3>
                                        <h1 style={{color: '#2563eb', fontSize: '3rem', margin: '10px 0'}}>
                                            S/ {parseFloat(lastTxData?.amount).toFixed(2)}
                                        </h1>
                                        <p style={{fontSize: '0.8rem', color: '#9ca3af', marginTop: '15px'}}>
                                            ID Operación: {lastTxData?.id || Math.floor(Math.random() * 1000000)}
                                        </p>
                                    </div>

                                    <button 
                                        onClick={resetFlow} 
                                        className="btn-primary" 
                                        style={{background: 'white', color: '#374151', border: '1px solid #d1d5db'}}
                                    >
                                        Nuevo Envío
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Enviar;