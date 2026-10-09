import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Login from './pages/Login'
import Cotacoes from './pages/Cotacoes'
import ResponderCotacao from './pages/ResponderCotacao'
import CotacaoDetalhes from './pages/CotacaoDetalhes'
import Fornecedores from './pages/Fornecedores'
import DashboardEstrategico from './pages/DashboardEstrategico'
import Usuarios from './pages/Usuarios'
import FornecedorDashboard from './pages/FornecedorDashboard' 
import Pedidos from './pages/Pedidos' 
import PedidoDetalhes from './pages/PedidoDetalhes'
import PedidoConferencia from './pages/PedidoConferencia'
import Auditoria from './pages/Auditoria'
import Devolucoes from './pages/Devolucoes'
import InteligenciaCompras from './pages/InteligenciaCompras'
import SessionTimeout from './components/SessionTimeout'
import './App.css'

const RotaPrivada = ({ children }) => {
  const isLogado = localStorage.getItem('token')
  const location = useLocation()
  return isLogado ? children : <Navigate to="/" state={{ from: location.pathname }} replace />
}

const RotaPerfil = ({ children, permitidos }) => {
  const perfil = localStorage.getItem('tipoUsuario')
  return permitidos.includes(perfil) ? children : <Navigate to="/pedidos" replace />
}

function App() {
  return (
    <BrowserRouter>
      <SessionTimeout />
      <Routes>
        <Route path="/" element={<Login />} />
        
        <Route path="/usuarios" element={<RotaPrivada><RotaPerfil permitidos={['ADMIN']}><Usuarios /></RotaPerfil></RotaPrivada>} />
        <Route path="/cotacoes" element={<RotaPrivada><RotaPerfil permitidos={['ADMIN']}><Cotacoes /></RotaPerfil></RotaPrivada>} />
        <Route path="/fornecedores" element={<RotaPrivada><RotaPerfil permitidos={['ADMIN']}><Fornecedores /></RotaPerfil></RotaPrivada>} />
        <Route path="/cotacao/:id" element={<RotaPrivada><RotaPerfil permitidos={['ADMIN']}><CotacaoDetalhes /></RotaPerfil></RotaPrivada>} />
        <Route path="/pedidos" element={<RotaPrivada><Pedidos /></RotaPrivada>} />
        <Route path="/pedidos/:id" element={<RotaPrivada><PedidoDetalhes /></RotaPrivada>} />
        <Route path="/pedidos/:id/conferir" element={<RotaPrivada><RotaPerfil permitidos={['ADMIN', 'CONFERENTE']}><PedidoConferencia /></RotaPerfil></RotaPrivada>} />
    
        <Route path="/relatorios" element={<RotaPrivada><RotaPerfil permitidos={['ADMIN']}><DashboardEstrategico /></RotaPerfil></RotaPrivada>} />
        
        <Route path="/portal-fornecedor" element={<RotaPrivada><FornecedorDashboard /></RotaPrivada>} />
        <Route path="/auditoria" element={<RotaPrivada><RotaPerfil permitidos={['ADMIN']}><Auditoria /></RotaPerfil></RotaPrivada>} />
        <Route path="/devolucoes" element={<RotaPrivada><RotaPerfil permitidos={['ADMIN']}><Devolucoes /></RotaPerfil></RotaPrivada>} />
        <Route path="/inteligencia" element={<RotaPrivada><RotaPerfil permitidos={['ADMIN']}><InteligenciaCompras /></RotaPerfil></RotaPrivada>} />
        
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