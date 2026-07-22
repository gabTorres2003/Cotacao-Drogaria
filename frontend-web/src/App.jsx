import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Login from './pages/Login'
import Cotacoes from './pages/Cotacoes'
import ResponderCotacao from './pages/ResponderCotacao'
import CotacaoDetalhes from './pages/CotacaoDetalhes'
import Fornecedores from './pages/Fornecedores'
import Relatorios from './pages/Relatorios'
import Usuarios from './pages/Usuarios'
import FornecedorDashboard from './pages/FornecedorDashboard' 
import Pedidos from './pages/Pedidos' 
import PedidoDetalhes from './pages/PedidoDetalhes'
import SessionTimeout from './components/SessionTimeout'
import PedidoConferencia from './pages/PedidoConferencia';
import './App.css'

// Componente que protege as rotas e guarda a intenção de redirecionamento
const RotaPrivada = ({ children }) => {
  const isLogado = localStorage.getItem('token')
  const location = useLocation()
  
  // Se não estiver logado, manda para o Login, mas salva a rota atual no state
  return isLogado ? children : <Navigate to="/" state={{ from: location.pathname }} replace />
}

function App() {
  return (
    <BrowserRouter>
      <SessionTimeout />
      <Routes>
        <Route path="/" element={<Login />} />
        
        <Route path="/usuarios" element={<RotaPrivada><Usuarios /></RotaPrivada>} />
        <Route path="/cotacoes" element={<RotaPrivada><Cotacoes /></RotaPrivada>} />
        <Route path="/fornecedores" element={<RotaPrivada><Fornecedores /></RotaPrivada>} />
        <Route path="/cotacao/:id" element={<RotaPrivada><CotacaoDetalhes /></RotaPrivada>} />
        <Route path="/pedidos" element={<RotaPrivada><Pedidos /></RotaPrivada>} />
        <Route path="/pedidos/:id" element={<RotaPrivada><PedidoDetalhes /></RotaPrivada>} />
        <Route path="/pedidos/:id/conferir" element={<RotaPrivada><PedidoConferencia /></RotaPrivada>} />
        <Route path="/relatorios" element={<RotaPrivada><Relatorios /></RotaPrivada>} />
        <Route path="/portal-fornecedor" element={<RotaPrivada><FornecedorDashboard /></RotaPrivada>} />
        <Route
          path="/responder-cotacao/:idCotacao"
          element={
            <RotaPrivada>
              <ResponderCotacao />
            </RotaPrivada>
          }
        />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App