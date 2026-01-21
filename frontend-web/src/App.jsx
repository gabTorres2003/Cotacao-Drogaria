import { BrowserRouter, Routes, Route } from 'react-router-dom';
import React from 'react';
import Dashboard from './pages/Dashboard';
import ResponderCotacao from './pages/ResponderCotacao'; 
import './App.css';

function App() {

  const isAuthenticated = localStorage.getItem('usuarioLogado');

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        
        {/* Rotas Privadas (Dashboard) */}
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/" />} 
        />
        <Route 
          path="/cotacao/:id" 
          element={isAuthenticated ? <CotacaoDetalhes /> : <Navigate to="/" />} 
        />

        {/* --- 2. ROTA PÚBLICA DO FORNECEDOR --- */}
        <Route path="/responder-cotacao/:idCotacao" element={<ResponderCotacao />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;