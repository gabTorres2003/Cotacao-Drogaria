import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ResponderCotacao from './pages/ResponderCotacao';
import CotacaoDetalhes from './pages/CotacaoDetalhes';
import Fornecedores from './pages/Fornecedores';
import './App.css';

const RotaPrivada = ({ children }) => {
  const isLogado = localStorage.getItem('usuarioLogado');
  return isLogado ? children : <Navigate to="/" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. TELA DE LOGIN  */}
        <Route path="/" element={<Login />} />

        {/* 2. DASHBOARD  */}
        <Route 
          path="/dashboard" 
          element={
            <RotaPrivada>
              <Dashboard />
            </RotaPrivada>
          } 
        />

        {/* 3. DETALHES DA COTAÇÃO */}
        <Route 
          path="/cotacao/:id" 
          element={
            <RotaPrivada>
              <CotacaoDetalhes />
            </RotaPrivada>
          } 
        />

        {/* 4. TELA DO FORNECEDOR */}
        <Route path="/responder-cotacao/:idCotacao" element={<ResponderCotacao />} />

        {/* rota desconhecida joga pro Login */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;