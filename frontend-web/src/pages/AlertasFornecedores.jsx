import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock,
  MessageSquare,
  RefreshCw,
  Scissors,
  Search,
} from 'lucide-react'
import Sidebar from '../components/layout/Sidebar'
import api from '../services/api'

const TIPOS = [
  { value: 'TODOS', label: 'Todos', icon: Bell },
  { value: 'RESPOSTA_COTACAO', label: 'Respostas de cotação', icon: MessageSquare },
  { value: 'CONFIRMACAO_PEDIDO', label: 'Confirmações de pedido', icon: CheckCircle2 },
  { value: 'CORTE_PEDIDO', label: 'Cortes', icon: Scissors },
  { value: 'PRAZO_ESTOURADO', label: 'Prazo estourado', icon: Clock },
]

const ESTILO_TIPO = {
  RESPOSTA_COTACAO: {
    bg: 'var(--info-soft)',
    color: 'var(--info-text)',
    border: 'var(--info-border)',
    label: 'Resposta de cotação',
    icon: MessageSquare,
  },
  CONFIRMACAO_PEDIDO: {
    bg: 'var(--success-soft)',
    color: 'var(--success-text)',
    border: 'var(--success-border)',
    label: 'Pedido confirmado',
    icon: CheckCircle2,
  },
  CORTE_PEDIDO: {
    bg: 'var(--danger-soft)',
    color: 'var(--danger-text)',
    border: 'var(--danger-border)',
    label: 'Corte no pedido',
    icon: Scissors,
  },
  PRAZO_ESTOURADO: {
    bg: 'var(--warning-soft)',
    color: 'var(--warning-text)',
    border: 'var(--warning-border)',
    label: 'Prazo estourado',
    icon: Clock,
  },
}

function formatarDataHora(valor) {
  if (!valor) return ''
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return ''
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AlertasFornecedores() {
  const [alertas, setAlertas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [tipoSelecionado, setTipoSelecionado] = useState('TODOS')
  const [busca, setBusca] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    carregarAlertas()
  }, [])

  const carregarAlertas = async () => {
    setCarregando(true)
    setErro('')
    try {
      const resposta = await api.get('/api/alertas-fornecedores')
      setAlertas(Array.isArray(resposta.data) ? resposta.data : [])
    } catch (e) {
      console.error('Erro ao carregar alertas de fornecedores:', e)
      setErro('Não foi possível carregar os alertas de fornecedores.')
    } finally {
      setCarregando(false)
    }
  }

  const contagemPorTipo = useMemo(() => {
    const contagem = { TODOS: alertas.length }
    alertas.forEach((alerta) => {
      contagem[alerta.tipo] = (contagem[alerta.tipo] || 0) + 1
    })
    return contagem
  }, [alertas])

  const alertasFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return alertas.filter((alerta) => {
      if (tipoSelecionado !== 'TODOS' && alerta.tipo !== tipoSelecionado) return false
      if (!termo) return true
      return [alerta.mensagem, alerta.fornecedorNome, alerta.nomeProduto]
        .filter(Boolean)
        .some((valor) => String(valor).toLowerCase().includes(termo))
    })
  }, [alertas, tipoSelecionado, busca])

  const abrirAlerta = (alerta) => {
    if (alerta.cotacaoId) {
      navigate(`/cotacao/${alerta.cotacaoId}`)
      return
    }
    if (alerta.pedidoId) {
      navigate(`/pedidos/${alerta.pedidoId}`)
    }
  }

  return (
    <div className="layout">
      <Sidebar />

      <main className="main-content">
        <header className="page-header">
          <div>
            <h1 className="page-title">
              <Bell size={22} /> Alertas de Fornecedores
            </h1>
            <p className="page-subtitle">
              Respostas de cotação, confirmações, cortes e prazos de confirmação
              vencidos, reunidos no painel do dia.
            </p>
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={carregarAlertas}
            disabled={carregando}
          >
            <RefreshCw size={16} className={carregando ? 'spin' : undefined} />
            {carregando ? 'Atualizando...' : 'Atualizar'}
          </button>
        </header>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '16px',
          }}
        >
          {TIPOS.map((tipo) => {
            const Icone = tipo.icon
            const ativo = tipoSelecionado === tipo.value
            return (
              <button
                key={tipo.value}
                type="button"
                onClick={() => setTipoSelecionado(tipo.value)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '999px',
                  border: ativo
                    ? '1px solid var(--primary)'
                    : '1px solid var(--border)',
                  backgroundColor: ativo
                    ? 'var(--primary-soft)'
                    : 'var(--surface)',
                  color: ativo ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                <Icone size={15} />
                {tipo.label}
                <span
                  style={{
                    minWidth: '20px',
                    padding: '1px 6px',
                    borderRadius: '999px',
                    backgroundColor: ativo
                      ? 'var(--primary)'
                      : 'var(--surface-muted)',
                    color: ativo ? 'var(--surface)' : 'var(--text-muted)',
                    fontSize: '11px',
                    textAlign: 'center',
                  }}
                >
                  {contagemPorTipo[tipo.value] || 0}
                </span>
              </button>
            )
          })}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 12px',
            borderRadius: '8px',
            border: '1px solid var(--border-strong)',
            backgroundColor: 'var(--surface)',
            marginBottom: '16px',
            maxWidth: '420px',
          }}
        >
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar por fornecedor, produto ou mensagem..."
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              width: '100%',
              fontSize: '13px',
              color: 'var(--text)',
            }}
          />
        </div>

        {erro && (
          <div className="error-msg" role="alert">
            {erro}
          </div>
        )}

        {carregando ? (
          <div className="empty-state">Carregando alertas...</div>
        ) : alertasFiltrados.length === 0 ? (
          <div className="empty-state">
            {alertas.length === 0
              ? 'Nenhum alerta de fornecedor registrado hoje.'
              : 'Nenhum alerta encontrado para os filtros selecionados.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {alertasFiltrados.map((alerta) => {
              const estilo =
                ESTILO_TIPO[alerta.tipo] || ESTILO_TIPO.RESPOSTA_COTACAO
              const Icone = estilo.icon
              const destino = alerta.cotacaoId
                ? `Abrir cotação #${alerta.cotacaoId}`
                : alerta.pedidoId
                  ? `Abrir pedido #${alerta.pedidoId}`
                  : ''

              return (
                <button
                  key={alerta.id || `${alerta.tipo}-${alerta.data}-${alerta.mensagem}`}
                  type="button"
                  onClick={() => abrirAlerta(alerta)}
                  disabled={!alerta.cotacaoId && !alerta.pedidoId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: '14px 16px',
                    textAlign: 'left',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    borderLeft: `4px solid ${estilo.color}`,
                    backgroundColor: 'var(--surface)',
                    cursor:
                      alerta.cotacaoId || alerta.pedidoId
                        ? 'pointer'
                        : 'default',
                    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '38px',
                      height: '38px',
                      flexShrink: 0,
                      borderRadius: '10px',
                      backgroundColor: estilo.bg,
                      color: estilo.color,
                      border: `1px solid ${estilo.border}`,
                    }}
                  >
                    <Icone size={19} />
                  </span>

                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexWrap: 'wrap',
                        marginBottom: '3px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          color: estilo.color,
                          backgroundColor: estilo.bg,
                          border: `1px solid ${estilo.border}`,
                          borderRadius: '999px',
                          padding: '2px 8px',
                        }}
                      >
                        {estilo.label}
                      </span>
                      {alerta.data && (
                        <span
                          style={{
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                          }}
                        >
                          {formatarDataHora(alerta.data)}
                        </span>
                      )}
                    </span>

                    <span
                      style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'var(--text)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {alerta.mensagem}
                    </span>

                    {destino && (
                      <span
                        style={{
                          display: 'block',
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                          marginTop: '3px',
                        }}
                      >
                        {destino}
                      </span>
                    )}
                  </span>

                  {destino && (
                    <ChevronRight
                      size={18}
                      color="var(--text-subtle)"
                      style={{ flexShrink: 0 }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
