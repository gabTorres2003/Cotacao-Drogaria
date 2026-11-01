import React, { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  UserCog,
  FileSpreadsheet,
  RotateCcw,
  Brain,
  ShieldAlert,
  PackageCheck,
  LogOut,
  Sparkles,
  CalendarDays,
  Info,
  ArrowRight,
} from 'lucide-react'
import Sidebar from '../components/layout/Sidebar'
import ThemeToggle from '../components/layout/ThemeToggle'

const ACOES_ADMIN = [
  {
    to: '/cotacoes',
    title: 'Cotações',
    description: 'Criar, acompanhar e comparar cotações de fornecedores.',
    icon: LayoutDashboard,
    accent: 'accent-blue',
  },
  {
    to: '/pedidos',
    title: 'Pedidos',
    description: 'Gerar pedidos, acompanhar entregas e conferir recebimentos.',
    icon: ShoppingCart,
    accent: 'accent-green',
  },
  {
    to: '/fornecedores',
    title: 'Fornecedores',
    description: 'Cadastrar e manter os fornecedores da rede.',
    icon: Users,
    accent: 'accent-cyan',
  },
  {
    to: '/inteligencia',
    title: 'Inteligência',
    description: 'Analisar histórico, sugestões e oportunidades de compra.',
    icon: Brain,
    accent: 'accent-purple',
  },
  {
    to: '/relatorios',
    title: 'Relatórios',
    description: 'Consultar indicadores e resultados do processo de compras.',
    icon: FileSpreadsheet,
    accent: 'accent-amber',
  },
  {
    to: '/devolucoes',
    title: 'Devoluções',
    description: 'Registrar e acompanhar devoluções de pedidos.',
    icon: RotateCcw,
    accent: 'accent-red',
  },
  {
    to: '/usuarios',
    title: 'Usuários',
    description: 'Gerenciar acessos e permissões da equipe interna.',
    icon: UserCog,
    accent: 'accent-blue',
  },
  {
    to: '/auditoria',
    title: 'Auditoria',
    description: 'Acompanhar o histórico de ações do sistema.',
    icon: ShieldAlert,
    accent: 'accent-purple',
  },
]

const ACOES_CONFERENTE = [
  {
    to: '/pedidos',
    title: 'Pedidos',
    description: 'Acompanhar pedidos e realizar a conferência de recebimento.',
    icon: PackageCheck,
    accent: 'accent-green',
  },
]

const ACOES_FORNECEDOR = [
  {
    to: '/portal-fornecedor?tab=cotacoes',
    title: 'Responder Cotações',
    description: 'Informe preços, quantidades e disponibilidade dos produtos solicitados.',
    icon: FileSpreadsheet,
    accent: 'accent-blue',
  },
  {
    to: '/portal-fornecedor?tab=pedidos',
    title: 'Meus Pedidos',
    description: 'Consulte os pedidos recebidos e o andamento das entregas.',
    icon: ShoppingCart,
    accent: 'accent-green',
  },
]

function iniciais(nome) {
  const partes = String(nome || '').trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

function dataAtual() {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  })
}

function CartaoAcao({ acao }) {
  const Icone = acao.icon
  return (
    <Link to={acao.to} className={`home-card ${acao.accent}`}>
      <span className="home-card-icon">
        <Icone size={22} />
      </span>
      <h3>{acao.title}</h3>
      <p>{acao.description}</p>
      <span className="home-card-arrow">
        Acessar <ArrowRight size={14} />
      </span>
    </Link>
  )
}

function CabecalhoFornecedor({ nome, aoSair }) {
  return (
    <header className="supplier-header">
      <div className="supplier-brand">
        <img src="/assets/logo-torres.png" alt="Torres Farma" className="supplier-logo" />
        <div>
          <strong>Torres Farma</strong>
          <span>Portal do Fornecedor</span>
        </div>
      </div>

      <div className="supplier-header-actions">
        <ThemeToggle compact />
        <div className="supplier-user" title={nome}>
          <span className="user-avatar">{iniciais(nome)}</span>
          <span className="supplier-user-name">{nome || 'Fornecedor'}</span>
        </div>
        <button type="button" className="icon-button danger" onClick={aoSair} aria-label="Sair do sistema" title="Sair do sistema">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}

export default function Inicio() {
  const navigate = useNavigate()

  const perfil = localStorage.getItem('tipoUsuario')
  const nome = localStorage.getItem('nomeUsuario') || ''
  const isFornecedor = perfil !== 'ADMIN' && perfil !== 'CONFERENTE'
  const isConferente = perfil === 'CONFERENTE'

  const acoes = useMemo(() => {
    if (isFornecedor) return ACOES_FORNECEDOR
    if (isConferente) return ACOES_CONFERENTE
    return ACOES_ADMIN
  }, [isFornecedor, isConferente])

  const saudacao = (() => {
    const hora = new Date().getHours()
    if (hora < 12) return 'Bom dia'
    if (hora < 18) return 'Boa tarde'
    return 'Boa noite'
  })()

  const primeiroNome = nome.trim().split(/\s+/)[0] || ''

  const sair = () => {
    // Mantém a preferência de tema entre sessões.
    ;['token', 'tipoUsuario', 'primeiroAcesso', 'nomeUsuario', 'usuarioId'].forEach(
      (chave) => localStorage.removeItem(chave),
    )
    navigate('/')
  }

  if (isFornecedor) {
    return (
      <div className="supplier-home">
        <CabecalhoFornecedor nome={nome} aoSair={sair} />

        <main className="supplier-main">
          <section className="supplier-hero">
            <h1>
              {saudacao}
              {primeiroNome ? `, ${primeiroNome}` : ''}!
            </h1>
            <p>
              Este é o seu portal de atendimento à Drogaria Torres Farma. Escolha uma
              das opções abaixo para responder cotações ou consultar seus pedidos.
            </p>
            <span className="home-date">
              <CalendarDays size={14} /> {dataAtual()}
            </span>
          </section>

          <h2 className="home-section-title">
            <Sparkles size={15} /> O que você precisa fazer?
          </h2>
          <div className="home-grid">
            {acoes.map((acao) => (
              <CartaoAcao key={acao.to} acao={acao} />
            ))}
          </div>

          <div className="home-note">
            <Info size={16} />
            <span>
              Precisa de ajuda? Entre em contato com a equipe de compras da Drogaria
              Torres Farma pelo WhatsApp.
            </span>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <div className="home-page">
          <header className="home-header">
            <div className="home-greeting">
              <h1>
                {saudacao}
                {primeiroNome ? `, ${primeiroNome}` : ''}!
              </h1>
              <p>
                {isConferente
                  ? 'Selecione uma opção para acompanhar pedidos e realizar conferências.'
                  : 'Selecione uma área para começar. As principais funcionalidades estão reunidas abaixo.'}
              </p>
              <span className="home-date">
                <CalendarDays size={14} /> {dataAtual()}
              </span>
            </div>
            <div className="page-actions">
              <ThemeToggle />
            </div>
          </header>

          <h2 className="home-section-title">
            <Sparkles size={15} /> Acesso rápido
          </h2>
          <div className="home-grid">
            {acoes.map((acao) => (
              <CartaoAcao key={acao.to} acao={acao} />
            ))}
          </div>

          <div className="home-note">
            <Info size={16} />
            <span>
              O menu lateral continua disponível para navegar entre todas as áreas do
              sistema. Clique em <strong>Expandir menu</strong> para exibi-lo.
            </span>
          </div>
        </div>
      </main>
    </div>
  )
}
