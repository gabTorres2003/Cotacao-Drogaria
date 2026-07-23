import React, { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  Settings,
  Pill,
  UserCog,
  LogOut,
  Lock,
  ShoppingCart,
} from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import api from '../../services/api'

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [showFirstAccessModal, setShowFirstAccessModal] = useState(false)
  const [novoPin, setNovoPin] = useState('')
  const [loadingModal, setLoadingModal] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('primeiroAcesso') === 'true') {
      setShowFirstAccessModal(true)
    }
  }, [])

  const isActive = (path) =>
    location.pathname === path ? 'menu-item active' : 'menu-item'
  const isMenuActive = (basePath) =>
    location.pathname.startsWith(basePath) ? 'menu-item active' : 'menu-item'

  const handleLogout = () => {
    localStorage.clear()
    navigate('/')
  }

  const handleAlterarPin = async (e) => {
    e.preventDefault()
    setLoadingModal(true)
    try {
      await api.patch('/usuarios/alterar-pin', { novoPin })
      localStorage.setItem('primeiroAcesso', 'false')
      setShowFirstAccessModal(false)
    } catch (error) {
      alert('Erro ao alterar senha. Tente novamente.')
    } finally {
      setLoadingModal(false)
    }
  }

  return (
    <>
      {/* Container flex com height 100vh para permitir o botão congelado no rodapé */}
      <aside
        className="sidebar"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          position: 'sticky',
          top: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '20px',
            marginBottom: '20px',
          }}
        >
          <img
            src="/assets/logo-torres.png"
            alt="Logo Drogaria Torres Farma"
            style={{ height: '32px', width: 'auto' }}
          />
          <span
            style={{ fontWeight: 'bold', fontSize: '18px', color: '#1d4ed8' }}
          >
            Drogaria Torres Farma
          </span>
        </div>

        {/* Flex 1 empurra tudo que está abaixo dele para o fim da tela */}
        <nav style={{ flex: 1, overflowY: 'auto' }}>
          <Link
            to="/cotacoes"
            className={isMenuActive('/cotacoes')}
            style={{ textDecoration: 'none' }}
          >
            <LayoutDashboard size={20} /> Cotação
          </Link>

          {/* Link para Pedidos */}
          <Link
            to="/pedidos"
            className={isMenuActive('/pedidos')}
            style={{ textDecoration: 'none' }}
          >
            <ShoppingCart size={20} /> Pedidos
          </Link>

          <Link
            to="/fornecedores"
            className={isMenuActive('/fornecedores')}
            style={{ textDecoration: 'none' }}
          >
            <Users size={20} /> Fornecedores
          </Link>
          <Link
            to="/usuarios"
            className={isMenuActive('/usuarios')}
            style={{ textDecoration: 'none' }}
          >
            <UserCog size={20} /> Usuários
          </Link>
          <Link
            to="/relatorios"
            className={isMenuActive('/relatorios')}
            style={{ textDecoration: 'none' }}
          >
            <FileSpreadsheet size={20} /> Relatórios
          </Link>
          <div className="menu-item">
            <Settings size={20} /> Configurações
          </div>
        </nav>

        {/* BOTÃO DE SAIR CONGELADO NA BASE */}
        <div
          style={{
            padding: '20px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              padding: '12px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '15px',
              transition: '0.2s',
            }}
          >
            <LogOut size={20} />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* OVERLAY DO PRIMEIRO ACESSO (Obriga a trocar a senha) */}
      {showFirstAccessModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '32px',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '400px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginBottom: '24px',
              }}
            >
              <div
                style={{
                  backgroundColor: '#eff6ff',
                  padding: '12px',
                  borderRadius: '50%',
                  color: '#3b82f6',
                  marginBottom: '16px',
                }}
              >
                <Lock size={32} />
              </div>
              <h2
                style={{
                  margin: '0 0 8px 0',
                  color: '#1e293b',
                  fontSize: '20px',
                }}
              >
                Bem-vindo(a)!
              </h2>
              <p
                style={{
                  margin: 0,
                  color: '#64748b',
                  textAlign: 'center',
                  fontSize: '14px',
                }}
              >
                Por questões de segurança, você precisa cadastrar um novo PIN de
                acesso para continuar.
              </p>
            </div>

            <form onSubmit={handleAlterarPin}>
              <div style={{ marginBottom: '24px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#334155',
                    marginBottom: '8px',
                  }}
                >
                  Novo PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  autoFocus
                  value={novoPin}
                  onChange={(e) =>
                    setNovoPin(e.target.value.replace(/\D/g, ''))
                  }
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontSize: '16px',
                  }}
                  placeholder="Mínimo 4 dígitos"
                />
              </div>
              <button
                type="submit"
                disabled={novoPin.length < 4 || loadingModal}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '16px',
                  cursor:
                    novoPin.length < 4 || loadingModal
                      ? 'not-allowed'
                      : 'pointer',
                  opacity: novoPin.length < 4 || loadingModal ? 0.7 : 1,
                }}
              >
                {loadingModal ? 'Salvando...' : 'Salvar Novo PIN'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
