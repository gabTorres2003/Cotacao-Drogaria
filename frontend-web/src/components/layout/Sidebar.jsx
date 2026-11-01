import React, { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  Settings,
  UserCog,
  LogOut,
  Lock,
  ShoppingCart,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  RotateCcw,
  Brain,
  Home,
} from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import ThemeToggle from './ThemeToggle'

const MENU_ADMIN = [
  { to: '/inicio', label: 'Início', icon: Home, exact: true },
  { to: '/cotacoes', label: 'Cotações', icon: LayoutDashboard },
  { to: '/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { to: '/fornecedores', label: 'Fornecedores', icon: Users },
  { to: '/usuarios', label: 'Usuários', icon: UserCog },
  { to: '/relatorios', label: 'Relatórios', icon: FileSpreadsheet },
  { to: '/devolucoes', label: 'Devoluções', icon: RotateCcw },
  { to: '/inteligencia', label: 'Inteligência', icon: Brain },
  { to: '/auditoria', label: 'Auditoria', icon: ShieldAlert },
]

const MENU_CONFERENTE = [
  { to: '/inicio', label: 'Início', icon: Home, exact: true },
  { to: '/pedidos', label: 'Pedidos', icon: ShoppingCart },
]

function iniciais(nome) {
  const partes = String(nome || '').trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

function rotuloPerfil(perfil) {
  if (perfil === 'ADMIN') return 'Administrador'
  if (perfil === 'CONFERENTE') return 'Conferente'
  if (perfil === 'FORNECEDOR') return 'Fornecedor'
  return perfil || 'Usuário'
}

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [showFirstAccessModal, setShowFirstAccessModal] = useState(false)
  const [novoPin, setNovoPin] = useState('')
  const [loadingModal, setLoadingModal] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (location.pathname === '/inicio') return true
    return localStorage.getItem('sidebarCollapsed') === 'true'
  })
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const perfil = localStorage.getItem('tipoUsuario')
  const nome = localStorage.getItem('nomeUsuario') || ''
  const isConferente = perfil === 'CONFERENTE'
  const menu = isConferente ? MENU_CONFERENTE : MENU_ADMIN

  useEffect(() => {
    if (localStorage.getItem('primeiroAcesso') === 'true') {
      setShowFirstAccessModal(true)
    }
  }, [])

  // A página inicial começa com o menu recolhido, mas o usuário pode expandi-lo.
  useEffect(() => {
    if (location.pathname === '/inicio') {
      setIsCollapsed(true)
    }
  }, [location.pathname])

  // Fecha o menu mobile ao navegar.
  useEffect(() => {
    setIsMobileOpen(false)
  }, [location.pathname])

  // Bloqueia o scroll do fundo e permite fechar o menu com Escape no mobile.
  useEffect(() => {
    if (!isMobileOpen) return undefined

    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const aoPressionarTecla = (event) => {
      if (event.key === 'Escape') setIsMobileOpen(false)
    }
    window.addEventListener('keydown', aoPressionarTecla)

    return () => {
      document.body.style.overflow = overflowAnterior
      window.removeEventListener('keydown', aoPressionarTecla)
    }
  }, [isMobileOpen])

  const toggleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('sidebarCollapsed', newState)
  }

  const handleLogout = () => {
    // Mantém a preferência de tema entre sessões.
    ;['token', 'tipoUsuario', 'primeiroAcesso', 'nomeUsuario', 'usuarioId'].forEach(
      (chave) => localStorage.removeItem(chave),
    )
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

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.to
    return location.pathname.startsWith(item.to)
  }

  return (
    <>
      <div className="mobile-topbar">
        <button
          type="button"
          className="icon-button"
          onClick={() => setIsMobileOpen(true)}
          aria-label="Abrir menu"
          aria-expanded={isMobileOpen}
        >
          <Menu size={24} />
        </button>

        <div className="mobile-brand">
          <img src="/assets/logo-torres.png" alt="" />
          <span>Torres Farma</span>
        </div>

        <div className="mobile-actions">
          <ThemeToggle compact />
          <button
            type="button"
            className="icon-button danger"
            onClick={handleLogout}
            aria-label="Sair do sistema"
            title="Sair do sistema"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div
        className={`sidebar-overlay ${isMobileOpen ? 'active' : ''}`}
        onClick={() => setIsMobileOpen(false)}
        aria-hidden="true"
      ></div>

      <aside
        className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}
        aria-label="Menu principal"
      >
        <div className="sidebar-brand">
          <img src="/assets/logo-torres.png" alt="Logo Torres Farma" className="brand-logo" />
          <div className="hide-on-collapse">
            <p className="brand-name">Torres Farma</p>
            <span className="brand-subtitle">Gestão de Compras</span>
          </div>

          {isMobileOpen && (
            <button
              type="button"
              className="icon-button"
              onClick={() => setIsMobileOpen(false)}
              aria-label="Fechar menu"
              style={{ marginLeft: 'auto' }}
            >
              <X size={22} />
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          {menu.map((item) => {
            const Icone = item.icon
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`menu-item ${isActive(item) ? 'active' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icone size={20} />
                <span className="hide-on-collapse">{item.label}</span>
              </Link>
            )
          })}

          {!isConferente && (
            <div
              className="menu-item hide-on-collapse"
              style={{ cursor: 'pointer' }}
              title="Configurações"
            >
              <Settings size={20} />
              <span className="hide-on-collapse">Configurações</span>
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip" title={nome || 'Usuário'}>
            <span className="user-avatar">{iniciais(nome)}</span>
            <div className="user-meta hide-on-collapse">
              <span className="user-name">{nome || 'Usuário'}</span>
              <span className="user-role">{rotuloPerfil(perfil)}</span>
            </div>
          </div>

          <div className="hide-on-collapse">
            <ThemeToggle />
          </div>
          <div className="sidebar-collapsed-only">
            <ThemeToggle compact />
          </div>

          <button
            className="desktop-toggle-btn"
            onClick={toggleCollapse}
            title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            <span className="hide-on-collapse">Recolher menu</span>
          </button>

          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            <span className="hide-on-collapse">Sair do Sistema</span>
          </button>
        </div>
      </aside>

      {showFirstAccessModal && (
        <div className="modal-overlay">
          <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="titulo-primeiro-acesso">
            <div className="modal-body">
              <div className="first-access-header">
                <div className="first-access-icon">
                  <Lock size={28} />
                </div>
                <h2 id="titulo-primeiro-acesso">Bem-vindo(a)!</h2>
                <p>
                  Por questões de segurança, você precisa cadastrar um novo PIN de
                  acesso para continuar.
                </p>
              </div>

              <form onSubmit={handleAlterarPin}>
                <label className="login-label" htmlFor="novo-pin">
                  Novo PIN
                </label>
                <input
                  id="novo-pin"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  autoFocus
                  value={novoPin}
                  onChange={(e) => setNovoPin(e.target.value.replace(/\D/g, ''))}
                  className="form-input"
                  placeholder="Mínimo 4 dígitos"
                />
                <button
                  type="submit"
                  disabled={novoPin.length < 4 || loadingModal}
                  className="btn-primary"
                  style={{ width: '100%', marginTop: '18px' }}
                >
                  {loadingModal ? 'Salvando...' : 'Salvar Novo PIN'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
