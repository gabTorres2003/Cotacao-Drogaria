import React, { useState, useEffect } from 'react'
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
} from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import api from '../../services/api'

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [showFirstAccessModal, setShowFirstAccessModal] = useState(false)
  const [novoPin, setNovoPin] = useState('')
  const [loadingModal, setLoadingModal] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(
    localStorage.getItem('sidebarCollapsed') === 'true',
  )
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('primeiroAcesso') === 'true') {
      setShowFirstAccessModal(true)
    }
  }, [])

  const toggleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('sidebarCollapsed', newState)
  }

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

  const isActive = (basePath) =>
    location.pathname.startsWith(basePath) ? 'menu-item active' : 'menu-item'

  return (
    <>
      {/* =========================================================
          INJEÇÃO DE CSS GLOBAL (Torna o sistema inteiro responsivo)
          ========================================================= */}
      <style>{`
        /* Reset e Base do Layout */
        body { margin: 0; padding: 0; overflow-x: hidden; }
        .layout { display: flex; min-height: 100vh; background-color: #f8fafc; flex-direction: row; width: 100%; }
        .main-content { flex: 1; padding: 32px; overflow-y: auto; width: 100%; max-width: 100vw; box-sizing: border-box; transition: padding 0.3s; }
        
        /* Sidebar Desktop Base */
        .sidebar { 
          width: 260px; background: white; border-right: 1px solid #e2e8f0; 
          transition: width 0.3s ease, transform 0.3s ease; 
          display: flex; flex-direction: column; height: 100vh; 
          position: sticky; top: 0; z-index: 50; 
        }
        
        /* Estados do Collapse (Desktop) */
        .sidebar.collapsed { width: 80px; }
        .sidebar.collapsed .hide-on-collapse { display: none; }
        .sidebar.collapsed .menu-item { justify-content: center; padding: 12px; }
        .sidebar.collapsed .logo-container { justify-content: center; padding: 20px 0; }
        
        /* Estilos dos Menus */
        .menu-item {
          display: flex; align-items: center; gap: 12px; padding: 12px 16px;
          color: #64748b; text-decoration: none; border-radius: 8px;
          margin-bottom: 4px; font-weight: 500; transition: all 0.2s; white-space: nowrap;
        }
        .menu-item:hover { background-color: #f1f5f9; color: #1e293b; }
        .menu-item.active { background-color: #eff6ff; color: #2563eb; }
        
        /* Botões de Ação do Menu */
        .desktop-toggle-btn { 
          display: flex; align-items: center; gap: 12px; padding: 12px 16px; 
          width: 100%; border: none; background: transparent; color: #64748b; 
          cursor: pointer; border-radius: 8px; font-weight: 500; white-space: nowrap;
        }
        .desktop-toggle-btn:hover { background-color: #f1f5f9; }
        
        /* Topbar Mobile (Escondida no Desktop) */
        .mobile-topbar { 
          display: none; background: white; padding: 16px 20px; 
          border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; 
          z-index: 40; align-items: center; justify-content: space-between; 
          box-shadow: 0 1px 2px rgba(0,0,0,0.05); width: 100%; box-sizing: border-box;
        }

        /* Ajustes Globais de Tabelas para não quebrarem a tela */
        .table-container { overflow-x: auto; width: 100%; background: white; border-radius: 12px; border: 1px solid #e2e8f0; }
        .table-container table { width: 100%; min-width: 700px; border-collapse: collapse; }
        
        /* =========================================
           RESPONSIVIDADE (MOBILE)
           ========================================= */
        @media (max-width: 768px) {
          .layout { flex-direction: column; }
          .mobile-topbar { display: flex; }
          .desktop-toggle-btn { display: none !important; }
          
          /* Comportamento da Gaveta (Drawer) */
          .sidebar { 
            position: fixed; left: 0; top: 0; transform: translateX(-100%); 
            width: 280px !important; z-index: 100; box-shadow: 4px 0 10px rgba(0,0,0,0.1); 
          }
          .sidebar.mobile-open { transform: translateX(0); }
          .sidebar .hide-on-collapse { display: block !important; } 
          .sidebar .menu-item { justify-content: flex-start !important; padding: 12px 20px !important; }
          .sidebar .logo-container { justify-content: flex-start !important; padding: 20px !important; }

          /* Fundo Escuro ao abrir o menu no celular */
          .sidebar-overlay { 
            position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 90; 
            opacity: 0; visibility: hidden; transition: 0.3s; 
          }
          .sidebar-overlay.active { opacity: 1; visibility: visible; }
          
          /* Ajustes de Elementos Internos das Telas */
          .main-content { padding: 16px; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; gap: 12px !important; }
          .filters-bar { flex-direction: column !important; align-items: stretch !important; gap: 12px !important; }
          .filters-bar > div { width: 100%; justify-content: space-between; }
          .search-input-container { width: 100% !important; }
          .main-content > header { flex-direction: column; align-items: flex-start !important; gap: 16px; }
          .btn-new-cotacao { width: 100%; justify-content: center; }
        }
      `}</style>

      {/* =========================================
          TOPBAR MOBILE (Aparece apenas em telas pequenas)
          ========================================= */}
      <div className="mobile-topbar">
        <button
          onClick={() => setIsMobileOpen(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#374151',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <Menu size={28} />
        </button>
        <img
          src="/assets/logo-torres.png"
          alt="Torres Farma"
          style={{ height: '28px' }}
        />
        <div style={{ width: '28px' }}></div>{' '}
        {/* Espaçador invisível para centralizar a logo */}
      </div>

      {/* =========================================
          OVERLAY MOBILE (Fundo escuro ao abrir gaveta)
          ========================================= */}
      <div
        className={`sidebar-overlay ${isMobileOpen ? 'active' : ''}`}
        onClick={() => setIsMobileOpen(false)}
      ></div>

      {/* =========================================
          SIDEBAR PRINCIPAL
          ========================================= */}
      <aside
        className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}
      >
        {/* LOGO */}
        <div
          className="logo-container"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '20px',
            marginBottom: '10px',
          }}
        >
          <img
            src="/assets/logo-torres.png"
            alt="Logo"
            style={{ height: '32px', minWidth: '32px' }}
          />
          <span
            className="hide-on-collapse"
            style={{ fontWeight: 'bold', fontSize: '18px', color: '#1d4ed8' }}
          >
            Torres Farma
          </span>

          {/* Botão de Fechar Apenas no Mobile */}
          {isMobileOpen && (
            <button
              onClick={() => setIsMobileOpen(false)}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: '#64748b',
              }}
            >
              <X size={24} />
            </button>
          )}
        </div>

        {/* NAVEGAÇÃO */}
        <nav
          style={{ flex: 1, overflowY: 'auto', padding: '0 12px' }}
          onClick={() => setIsMobileOpen(false)}
        >
          <Link to="/cotacoes" className={isActive('/cotacoes')}>
            <LayoutDashboard size={20} style={{ minWidth: '20px' }} />
            <span className="hide-on-collapse">Cotação</span>
          </Link>

          <Link to="/pedidos" className={isActive('/pedidos')}>
            <ShoppingCart size={20} style={{ minWidth: '20px' }} />
            <span className="hide-on-collapse">Pedidos</span>
          </Link>

          <Link to="/fornecedores" className={isActive('/fornecedores')}>
            <Users size={20} style={{ minWidth: '20px' }} />
            <span className="hide-on-collapse">Fornecedores</span>
          </Link>

          <Link to="/usuarios" className={isActive('/usuarios')}>
            <UserCog size={20} style={{ minWidth: '20px' }} />
            <span className="hide-on-collapse">Usuários</span>
          </Link>

          <Link to="/relatorios" className={isActive('/relatorios')}>
            <FileSpreadsheet size={20} style={{ minWidth: '20px' }} />
            <span className="hide-on-collapse">Relatórios</span>
          </Link>

          <Link to="/auditoria" className={isActive('/auditoria')}>
            <ShieldAlert size={20} style={{ minWidth: '20px' }} />
            <span className="hide-on-collapse">Auditoria</span>
          </Link>

          <div className="menu-item" style={{ cursor: 'pointer' }}>
            <Settings size={20} style={{ minWidth: '20px' }} />
            <span className="hide-on-collapse">Configurações</span>
          </div>
        </nav>

        {/* AÇÕES DE RODAPÉ */}
        <div
          style={{
            padding: '12px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {/* Botão de Recolher/Expandir (Some no Mobile) */}
          <button className="desktop-toggle-btn" onClick={toggleCollapse}>
            {isCollapsed ? (
              <ChevronRight size={20} style={{ minWidth: '20px' }} />
            ) : (
              <ChevronLeft size={20} style={{ minWidth: '20px' }} />
            )}
            <span className="hide-on-collapse">Recolher Menu</span>
          </button>

          {/* Botão de Sair */}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '12px 16px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '15px',
              transition: '0.2s',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
            }}
          >
            <LogOut size={20} style={{ minWidth: '20px' }} />
            <span className="hide-on-collapse">Sair do Sistema</span>
          </button>
        </div>
      </aside>

      {/* =========================================
          MODAL DE PRIMEIRO ACESSO
          ========================================= */}
      {showFirstAccessModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
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
              width: '90%',
              maxWidth: '400px',
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
