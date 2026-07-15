import axios from 'axios';

// In dev, Vite proxies "/api" to the local backend (see vite.config.js). In production there's
// no such proxy, so VITE_API_URL must point at the deployed backend's /api base, e.g.
// https://focusos-api.onrender.com/api.
const baseURL = import.meta.env.VITE_API_URL || '/api';
// Visible in the browser console on every load — lets you confirm which backend a deployment
// is actually pointed at without digging through the compiled bundle.
console.log('[FocusOS] API base URL:', baseURL);

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('focusos_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('focusos_token');
      localStorage.removeItem('focusos_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
