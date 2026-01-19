import { BrowserRouter, Routes, Route } from 'react-router-dom';
import React from 'react';
import Dashboard from './pages/Dashboard';
import ResponderCotacao from './pages/ResponderCotacao'; 
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota Raiz: Mostra o Dashboard */}
        <Route path="/" element={<Dashboard />} />
        
        {/* Rota do Fornecedor: Mostra a tela de responder */}
        <Route path="/responder" element={<ResponderCotacao />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;