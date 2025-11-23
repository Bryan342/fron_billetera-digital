// 👇 1. Centralizamos las URLs y el Token aquí para no repetir código
export const API_URLS = {
    USERS: 'https://userservicesanti.onrender.com/users',
    WALLET: 'https://billetera-production.up.railway.app/api/v1/wallets',
    TRANSACTION: 'https://transactionmicroservicios-production.up.railway.app/transactions'
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