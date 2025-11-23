// 👇 1. CAMBIA ESTA VARIABLE A TU ANTOJO
const INTEROP_HOST = 'http://localhost:3000'; 

// --- CONFIGURACIÓN DE RUTAS ---
export const API_URLS = {
    // Microservicio de Usuarios (Banca Luca)
    USERS: 'https://userservicesanti.onrender.com/users',
    
    // Microservicio de Billeteras (Banca Luca)
    WALLET: 'https://billetera-production.up.railway.app/api/v1/wallets',
    
    // Microservicio de Transacciones (Banca Luca)
    TRANSACTION: 'https://transactionmicroservicios-production.up.railway.app/transactions',

    // 👇 2. AQUÍ SE CONSTRUYEN LAS RUTAS AUTOMÁTICAMENTE
    INTEROP_WALLETS: `${INTEROP_HOST}/api/v1/wallets`,
    INTEROP_SEND:    `${INTEROP_HOST}/api/v1/sendTransfer`
};

// Función auxiliar para hacer peticiones con el Token automáticamente
export const authFetch = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };

    const response = await fetch(url, { ...options, headers });
    
    // Si el token expiró (401), podrías redirigir al login aquí
    if (response.status === 401) {
        console.error("Token expirado o inválido");
        // window.location.href = '/login'; 
    }

    return response;
};
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