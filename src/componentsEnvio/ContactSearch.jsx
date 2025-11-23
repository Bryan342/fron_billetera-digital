import React, { useState, useEffect } from 'react';
import { API_URLS, authFetch } from './apiConfig';

const ContactSearch = ({ onContactSelect }) => {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [foundUser, setFoundUser] = useState(null);
    const [error, setError] = useState(null);

    // Efecto "Debounce": Busca solo cuando el usuario deja de escribir o llega a 9 dígitos
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
            // 1. Buscamos Perfil (Para obtener Nombre y User ID)
            // Usamos 'profile/phone' porque nos devuelve el FULLNAME
            const resProfile = await authFetch(`${API_URLS.USERS}/profile/phone/${numero}`);
            
            if (!resProfile.ok) throw new Error("Usuario no encontrado en Banca Luca");
            const profileData = await resProfile.json();

            // 2. Buscamos su Billetera (Para saber a dónde mandar la plata)
            // Usamos el ID del usuario que nos dio el endpoint anterior
            const userId = profileData.user.user_id;
            const resWallet = await authFetch(`${API_URLS.WALLET}/${userId}/balance`);
            
            if (!resWallet.ok) throw new Error("El usuario no tiene billetera activa");
            const walletData = await resWallet.json();

            // 3. ¡Éxito! Preparamos el objeto para el siguiente paso
            setFoundUser({
                name: profileData.fullname, // Nombre real
                phone: numero,
                email: profileData.user.email,
                userId: userId,
                walletId: walletData.wallet_id // ID de billetera destino
            });

        } catch (err) {
            setError(err.message || "Error buscando usuario");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="search-container fade-in">
            <h3 style={{marginBottom: '1rem'}}>¿A quién transferimos?</h3>
            
            <div className="input-group">
                <input 
                    type="text" 
                    placeholder="Ingresa celular (9 dígitos)" 
                    value={phone}
                    maxLength={9}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="input-modern big-text"
                    autoFocus
                />
                {loading && <div className="spinner-input"></div>}
            </div>

            {/* ERROR MESSAGE */}
            {error && (
                <div className="alert-error fade-in">
                    ❌ {error}
                </div>
            )}

            {/* RESULT CARD (ESTILO YAPE) */}
            {foundUser && !loading && (
                <div 
                    className="contact-card fade-in" 
                    onClick={() => onContactSelect(foundUser)}
                >
                    <div className="avatar-circle">
                        {foundUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="contact-info">
                        <h4>{foundUser.name}</h4>
                        <p>{foundUser.phone}</p>
                        <small>{foundUser.email}</small>
                    </div>
                    <div className="arrow-icon">➔</div>
                </div>
            )}
            
            {/* Estilos inline para referencia rápida (mejor mover a CSS) */}
            <style>{`
                .big-text { font-size: 1.2rem; text-align: center; letter-spacing: 2px; }
                .alert-error { color: #dc2626; background: #fee2e2; padding: 10px; border-radius: 8px; margin-top: 10px; text-align: center;}
                
                .contact-card {
                    margin-top: 20px;
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 12px;
                    padding: 15px;
                    display: flex;
                    align-items: center;
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
                .contact-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.2);
                    border-color: #2563eb;
                }
                .avatar-circle {
                    width: 50px;
                    height: 50px;
                    background: #2563eb;
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    font-size: 1.5rem;
                    font-weight: bold;
                    margin-right: 15px;
                }
                .contact-info { flex: 1; text-align: left; }
                .contact-info h4 { margin: 0; font-weight: 600; color: #1f2937; }
                .contact-info p { margin: 2px 0; color: #4b5563; }
                .contact-info small { color: #9ca3af; font-size: 0.8rem; }
                .arrow-icon { color: #2563eb; font-weight: bold; font-size: 1.2rem; }
            `}</style>
        </div>
    );
};

export default ContactSearch;