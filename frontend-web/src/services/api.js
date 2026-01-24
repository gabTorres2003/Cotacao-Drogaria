import axios from 'axios';

const api = axios.create({
  baseURL: 'https://cotacao-drogaria.onrender.com',
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

export default api;