// 👇 1. URL DE LA API CENTRAL (Solo para BUSCAR billeteras)
const INTEROP_HOST = 'https://centralized-wallet-api-production.up.railway.app'; 

// 👇 2. URL DE TU MICROSERVICIO DE TRANSACCIONES (Para ENVIAR)
const TRANSACTION_HOST = 'https://transactionmicroservicios-production.up.railway.app';

// --- CONFIGURACIÓN DE RUTAS ---
export const API_URLS = {
    // Microservicios de Banca Luca
    USERS: 'https://userservicesanti.onrender.com/users',
    WALLET: 'https://billetera-production.up.railway.app/api/v1/wallets',
    TRANSACTION: `${TRANSACTION_HOST}/transactions`,

    // 👇 RUTAS DE INTEROPERABILIDAD
    // 1. Buscar: Sigue yendo directo a la central (GET)
    INTEROP_WALLETS: `${INTEROP_HOST}/api/v1/wallets`,
    
    // 2. Enviar: Ahora va a TU microservicio (POST)
    // Apunta a la ruta que creamos: /api/interbank/send
    INTERBANK_SEND: `${TRANSACTION_HOST}/api/interbank/send`
};

// Fetch para tus servicios internos (Usa Bearer Token)
export const authFetch = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };
    // ... resto de tu lógica de fetch ...
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) console.error("Token expirado");
    return response;
};

// Fetch para la API Central (Usa x-wallet-token) - SOLO PARA BUSQUEDAS
export const interopFetch = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-wallet-token': 'luca-token', 
        ...options.headers
    };
    return fetch(url, { ...options, headers });
};