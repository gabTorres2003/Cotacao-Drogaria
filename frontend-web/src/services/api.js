import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token && token !== 'null') {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Sessão expirada. Redirecionando para o login...");
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/'; 
    }
    
    return Promise.reject(error);
  }
);

export default api;