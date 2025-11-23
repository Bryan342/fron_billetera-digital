import React, { useState, useEffect } from 'react';
import { LucideArrowRight } from 'lucide-react';

// 👇 IMPORTAMOS TU SIDEBAR (Asegúrate que la ruta coincida con tu estructura)
import Sidebar from '../components/sidebar';

// --- 1. CONFIGURACIÓN API ---
const API_URLS = {
    USERS: 'https://userservicesanti.onrender.com/users',
    WALLET: 'https://billetera-production.up.railway.app/api/v1/wallets',
    TRANSACTION: 'https://transactionmicroservicios-production.up.railway.app/transactions'
};

const authFetch = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };
    return fetch(url, { ...options, headers });
};

// --- 2. COMPONENTES INTERNOS (Para que funcione todo en un solo archivo) ---

const EnviarExterno = () => (
    <div className="external-transfer-mock fade-in">
        <h3>Transferencia Interbancaria</h3>
        <p>Próximamente podrás enviar dinero a BCP, BBVA e Interbank.</p>
        <div className="bank-icons">
            <span className="bank-icon" style={{background: '#0039a6'}}></span>
            <span className="bank-icon" style={{background: '#004481'}}></span>
            <span className="bank-icon" style={{background: '#009c3b'}}></span>
        </div>
    </div>
);

const ContactSearch = ({ onContactSelect }) => {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [foundUser, setFoundUser] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (phone.length === 9) {
            buscarUsuario(phone);
        } else {
            setFoundUser(null);
            setError(null);
        }
    }, [phone]);

    const buscarUsuario = async (numero) => {
        setLoading(true);
        setError(null);
        setFoundUser(null);

        try {
            const resProfile = await authFetch(`${API_URLS.USERS}/profile/phone/${numero}`);
            if (!resProfile.ok) throw new Error("Usuario no encontrado en Banca Luca");
            const profileData = await resProfile.json();

            const userId = profileData.user.user_id;
            const resWallet = await authFetch(`${API_URLS.WALLET}/${userId}/balance`);
            if (!resWallet.ok) throw new Error("El usuario no tiene billetera activa");
            const walletData = await resWallet.json();

            setFoundUser({
                name: profileData.fullname,
                phone: numero,
                email: profileData.user.email,
                userId: userId,
                walletId: walletData.wallet_id
            });
        } catch (err) {
            setError(err.message || "No se encontró el usuario");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="step-container fade-in">
            <h3 className="step-title">¿A quién transferimos?</h3>
            <div className="input-search-wrapper">
                <input 
                    type="text" 
                    placeholder="Celular (9 dígitos)" 
                    value={phone}
                    maxLength={9}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="input-giant-search"
                    autoFocus
                />
                {loading && <div className="spinner-small"></div>}
            </div>
            {error && <div className="alert-error fade-in">❌ {error}</div>}
            {foundUser && !loading && (
                <div className="contact-card fade-in" onClick={() => onContactSelect(foundUser)}>
                    <div className="avatar-circle">{foundUser.name.charAt(0).toUpperCase()}</div>
                    <div className="contact-info">
                        <h4>{foundUser.name}</h4>
                        <p>{foundUser.phone}</p>
                    </div>
                    <div className="arrow-icon"><LucideArrowRight size={24} /></div>
                </div>
            )}
        </div>
    );
};

const AmountScreen = ({ contact, myWalletId, onBack, onSuccess }) => {
    const [amount, setAmount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleTransfer = async (e) => {
        e.preventDefault();
        if (!amount || parseFloat(amount) <= 0) return alert("Ingresa un monto válido");
        setIsProcessing(true);
        try {
            const payload = {
                idempotencyKey: Math.random().toString(36).substring(2) + Date.now().toString(36),
                sender_wallet: parseInt(myWalletId),
                receiver_wallet: parseInt(contact.walletId),
                amount: parseFloat(amount),
                currency: "SOL"
            };
            const response = await authFetch(API_URLS.TRANSACTION, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                const data = await response.json();
                onSuccess(data, amount);
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.message || 'Falló la transferencia'}`);
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="step-container fade-in">
            <div className="header-actions">
                <button onClick={onBack} className="btn-back">← Volver</button>
            </div>
            <div className="recipient-summary">
                <div className="avatar-large">{contact.name.charAt(0).toUpperCase()}</div>
                <h3>{contact.name}</h3>
                <p className="recipient-phone">{contact.phone}</p>
            </div>
            <form onSubmit={handleTransfer} className="form-amount">
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
                <button type="submit" className="btn-primary full-width" disabled={isProcessing || !amount}>
                    {isProcessing ? 'Enviando...' : 'Yapear ahora'}
                </button>
            </form>
        </div>
    );
};

// --- 3. COMPONENTE PRINCIPAL (ENVIAR) ---

const Enviar = () => {
    const [activeTab, setActiveTab] = useState('interno');
    const [step, setStep] = useState(1);
    const [myWalletId, setMyWalletId] = useState(null);
    const [selectedContact, setSelectedContact] = useState(null);
    const [lastTxData, setLastTxData] = useState(null);

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
            {/* INYECTAMOS ESTILOS ESPECÍFICOS AQUÍ */}
            <style>{`
                :root { --primary: #2563eb; --primary-dark: #1e40af; --bg-gray: #f3f4f6; }
                .app-container { display: flex; height: 100vh; font-family: 'Segoe UI', sans-serif; background: #fff; overflow: hidden; }
                
                /* Estilos del Contenido Principal */
                .content-area { flex: 1; padding: 40px; background: var(--bg-gray); display: flex; flex-direction: column; align-items: center; overflow-y: auto; }
                .card-transferencia { background: white; width: 100%; max-width: 480px; border-radius: 20px; padding: 30px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); min-height: 500px; position: relative; }

                /* Tabs */
                .tabs-container { display: flex; background: #e5e7eb; padding: 5px; border-radius: 50px; margin-bottom: 30px; width: fit-content; }
                .tab-btn { padding: 10px 25px; border: none; border-radius: 40px; cursor: pointer; font-weight: 600; color: #6b7280; background: transparent; transition: 0.3s; }
                .tab-btn.active { background: white; color: var(--primary); box-shadow: 0 2px 5px rgba(0,0,0,0.05); }

                /* Inputs & Cards */
                .input-search-wrapper { border-bottom: 2px solid #e5e7eb; padding: 10px 0; margin: 20px 0; display: flex; align-items: center; }
                .input-search-wrapper:focus-within { border-color: var(--primary); }
                .input-giant-search { width: 100%; border: none; font-size: 1.5rem; text-align: center; outline: none; letter-spacing: 2px; color: #374151; }
                .contact-card { margin-top: 20px; background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 15px; display: flex; align-items: center; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
                .contact-card:hover { transform: translateY(-3px); border-color: var(--primary); box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.2); }
                .avatar-circle { width: 50px; height: 50px; background: var(--primary); color: white; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 1.2rem; font-weight: bold; margin-right: 15px; }
                
                /* Amount Screen */
                .avatar-large { width: 80px; height: 80px; background: var(--primary); color: white; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 2rem; margin: 0 auto 15px; }
                .recipient-summary { text-align: center; margin-bottom: 30px; }
                .recipient-summary h3 { margin: 0; color: #111827; }
                .input-currency-wrapper { display: flex; justify-content: center; align-items: center; margin-bottom: 40px; }
                .currency-symbol { font-size: 2.5rem; color: var(--primary); font-weight: bold; margin-right: 10px; }
                .input-giant-amount { border: none; font-size: 3.5rem; width: 220px; text-align: center; outline: none; font-weight: bold; color: #111827; background: transparent; }
                
                /* Buttons & Animations */
                .btn-primary { background: var(--primary); color: white; border: none; padding: 18px; border-radius: 12px; font-size: 1.1rem; font-weight: bold; cursor: pointer; width: 100%; transition: 0.2s; }
                .btn-primary:hover:not(:disabled) { background: var(--primary-dark); transform: translateY(-1px); }
                .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
                .btn-back { background: none; border: none; color: #6b7280; font-weight: 600; cursor: pointer; padding: 0; }
                .fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                
                @media (max-width: 768px) {
                    .app-container { flex-direction: column; }
                    .content-area { padding-bottom: 90px; }
                }
            `}</style>

            <Sidebar />

            <main className="content-area">
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
                    {activeTab === 'externo' ? (
                        <EnviarExterno />
                    ) : (
                        <>
                            {step === 1 && <ContactSearch onContactSelect={handleContactSelect} />}
                            
                            {step === 2 && selectedContact && (
                                <AmountScreen 
                                    contact={selectedContact}
                                    myWalletId={myWalletId}
                                    onBack={() => setStep(1)}
                                    onSuccess={handleSuccess}
                                />
                            )}

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