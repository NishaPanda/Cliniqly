const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const API_BASE = isLocal ? 'http://localhost:8080/api' : (import.meta.env.VITE_API_BASE || 'https://cliniqly.onrender.com/api');
export const SOCKET_URL = isLocal ? 'http://localhost:8080' : (import.meta.env.VITE_SOCKET_URL || 'https://cliniqly.onrender.com');
export const USE_MOCK = false; // set to false when backend ready
