import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080'
});

// Adiciona o token no header de todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Captura token expirado e limpa sessão
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