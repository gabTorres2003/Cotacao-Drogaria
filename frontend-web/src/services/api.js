import axios from 'axios';

const api = axios.create({
  baseURL: 'https://cotacao-drogaria.onrender.com', 
});

export default api;