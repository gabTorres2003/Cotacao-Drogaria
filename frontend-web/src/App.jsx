import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ResponderCotacao from './pages/ResponderCotacao'
import CotacaoDetalhes from './pages/CotacaoDetalhes'
import Fornecedores from './pages/Fornecedores'
import Relatorios from './pages/Relatorios'
import './App.css'

const RotaPrivada = ({ children }) => {
  const isLogado = localStorage.getItem('usuarioLogado')
  return isLogado ? children : <Navigate to="/" />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <RotaPrivada>
              <Dashboard />
            </RotaPrivada>
          }
        />

        <Route
          path="/fornecedores"
          element={
            <RotaPrivada>
              <Fornecedores />
            </RotaPrivada>
          }
        />

        <Route
          path="/cotacao/:id"
          element={
            <RotaPrivada>
              <CotacaoDetalhes />
            </RotaPrivada>
          }
        />

        <Route
          path="/relatorios"
          element={
            <RotaPrivada>
              <Relatorios />
            </RotaPrivada>
          }
        />

        <Route
          path="/responder-cotacao/:idCotacao"
          element={<ResponderCotacao />}
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
