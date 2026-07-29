import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const nomeUsuario = localStorage.getItem('nomeUsuario');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  if (nomeUsuario) {
    config.headers['X-Usuario-Nome'] = encodeURIComponent(nomeUsuario);
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const urlRequisicao = error.config.url || '';
      
      if (!urlRequisicao.includes('/auth/login')) {
        console.warn("Sessão expirada. Redirecionando...");
        localStorage.removeItem('token');
        window.location.href = '/'; 
      }
    }
    return Promise.reject(error);
  }
);

export default api;