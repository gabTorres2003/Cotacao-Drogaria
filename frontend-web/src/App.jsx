import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Cotacoes from './pages/Cotacoes'
import ResponderCotacao from './pages/ResponderCotacao'
import CotacaoDetalhes from './pages/CotacaoDetalhes'
import Fornecedores from './pages/Fornecedores'
import Relatorios from './pages/Relatorios'
import SessionTimeout from './components/SessionTimeout'
import './App.css'

const RotaPrivada = ({ children }) => {
  const isLogado = localStorage.getItem('token')
  return isLogado ? children : <Navigate to="/" />
}

function App() {
  return (
    <BrowserRouter>
      <SessionTimeout />
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/cotacoes"
          element={
            <RotaPrivada>
              <Cotacoes />
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