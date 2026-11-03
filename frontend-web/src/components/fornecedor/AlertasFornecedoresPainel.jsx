import React, { useEffect, useMemo, useState } from 'react'
import { Bell, CalendarDays, CheckCircle2, ChevronRight, Clock, MessageSquare, RefreshCw, Scissors, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../services/api'

const TIPOS = [
  { value: 'TODOS', label: 'Todos', icon: Bell },
  { value: 'RESPOSTA_COTACAO', label: 'Respostas de cotação', icon: MessageSquare },
  { value: 'CONFIRMACAO_PEDIDO', label: 'Confirmações de pedido', icon: CheckCircle2 },
  { value: 'CORTE_PEDIDO', label: 'Cortes', icon: Scissors },
  { value: 'PRAZO_ESTOURADO', label: 'Prazo estourado', icon: Clock },
]

const ESTILO_TIPO = {
  RESPOSTA_COTACAO: { bg: 'var(--info-soft)', color: 'var(--info-text)', border: 'var(--info-border)', label: 'Resposta de cotação', icon: MessageSquare },
  CONFIRMACAO_PEDIDO: { bg: 'var(--success-soft)', color: 'var(--success-text)', border: 'var(--success-border)', label: 'Pedido confirmado', icon: CheckCircle2 },
  CORTE_PEDIDO: { bg: 'var(--danger-soft)', color: 'var(--danger-text)', border: 'var(--danger-border)', label: 'Corte no pedido', icon: Scissors },
  PRAZO_ESTOURADO: { bg: 'var(--warning-soft)', color: 'var(--warning-text)', border: 'var(--warning-border)', label: 'Prazo estourado', icon: Clock },
}

function dataLocalHoje() {
  const agora = new Date()
  const offset = agora.getTimezoneOffset() * 60000
  return new Date(agora.getTime() - offset).toISOString().slice(0, 10)
}

function formatarDataHora(valor) {
  if (!valor) return ''
  const data = new Date(valor)
  return Number.isNaN(data.getTime()) ? '' : data.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

function formatarDataFiltro(valor) {
  if (!valor) return ''
  const [ano, mes, dia] = valor.split('-')
  return `${dia}/${mes}/${ano}`
}

export default function AlertasFornecedoresPainel({ compacto = false }) {
  const [alertas, setAlertas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [tipoSelecionado, setTipoSelecionado] = useState('TODOS')
  const [busca, setBusca] = useState('')
  const [dataSelecionada, setDataSelecionada] = useState(dataLocalHoje)

  const carregarAlertas = async () => {
    setCarregando(true)
    setErro('')
    try {
      const resposta = await api.get('/api/alertas-fornecedores', { params: { data: dataSelecionada } })
      setAlertas(Array.isArray(resposta.data) ? resposta.data : [])
    } catch (e) {
      console.error('Erro ao carregar alertas de fornecedores:', e)
      setErro('Não foi possível carregar os alertas de fornecedores.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarAlertas()
  }, [dataSelecionada])

  const contagemPorTipo = useMemo(() => {
    const contagem = { TODOS: alertas.length }
    alertas.forEach((alerta) => { contagem[alerta.tipo] = (contagem[alerta.tipo] || 0) + 1 })
    return contagem
  }, [alertas])

  const alertasFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return alertas.filter((alerta) => {
      if (tipoSelecionado !== 'TODOS' && alerta.tipo !== tipoSelecionado) return false
      if (!termo) return true
      return [alerta.mensagem, alerta.fornecedorNome, alerta.nomeProduto]
        .filter(Boolean).some((valor) => String(valor).toLowerCase().includes(termo))
    })
  }, [alertas, tipoSelecionado, busca])

  return (
    <section className={compacto ? 'alertas-fornecedores-painel alertas-fornecedores-painel-compacto' : 'alertas-fornecedores-painel'}>
      <div className="alertas-fornecedores-cabecalho">
        <div>
          <h2 className="home-section-title"><Bell size={15} /> Alertas de Fornecedores</h2>
          <p className="alertas-fornecedores-subtitulo">
            {dataSelecionada === dataLocalHoje() ? 'Alertas de hoje' : `Alertas de ${formatarDataFiltro(dataSelecionada)}`}
          </p>
        </div>
        <button type="button" className="btn-secondary" onClick={carregarAlertas} disabled={carregando}>
          <RefreshCw size={15} className={carregando ? 'spin' : undefined} /> Atualizar
        </button>
      </div>

      <div className="alertas-fornecedores-filtros">
        <label className="alertas-fornecedores-data">
          <CalendarDays size={15} />
          <span>Data</span>
          <input type="date" value={dataSelecionada} onChange={(event) => setDataSelecionada(event.target.value)} />
        </label>
        {TIPOS.map((tipo) => {
          const Icone = tipo.icon
          const ativo = tipoSelecionado === tipo.value
          return (
            <button key={tipo.value} type="button" onClick={() => setTipoSelecionado(tipo.value)} className={`alerta-tipo-filtro ${ativo ? 'ativo' : ''}`}>
              <Icone size={14} /> {tipo.label} <span>{contagemPorTipo[tipo.value] || 0}</span>
            </button>
          )
        })}
        <label className="alertas-fornecedores-busca">
          <Search size={15} />
          <input value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar alerta..." />
        </label>
      </div>

      {erro && <div className="error-msg" role="alert">{erro}</div>}
      {carregando ? <div className="mensagens-empty">Carregando alertas...</div> : alertasFiltrados.length === 0 ? (
        <div className="mensagens-empty">Nenhum alerta de fornecedor encontrado para {formatarDataFiltro(dataSelecionada)}.</div>
      ) : (
        <div className="alertas-fornecedores-lista">
          {alertasFiltrados.map((alerta) => {
            const estilo = ESTILO_TIPO[alerta.tipo] || ESTILO_TIPO.RESPOSTA_COTACAO
            const Icone = estilo.icon
            const destino = alerta.cotacaoId
              ? `/cotacao/${alerta.cotacaoId}`
              : alerta.pedidoId
                ? `/pedidos/${alerta.pedidoId}`
                : null
            return (
              destino ? (
                <Link key={alerta.id || `${alerta.tipo}-${alerta.data}-${alerta.mensagem}`} to={destino} className="alerta-fornecedor-item" style={{ textDecoration: 'none' }}>
                <span className="alerta-fornecedor-icone" style={{ backgroundColor: estilo.bg, color: estilo.color, borderColor: estilo.border }}><Icone size={17} /></span>
                <span className="alerta-fornecedor-conteudo">
                  <span className="alerta-fornecedor-meta" style={{ color: estilo.color }}>{estilo.label} {alerta.data && <small>{formatarDataHora(alerta.data)}</small>}</span>
                  <strong>{alerta.mensagem}</strong>
                </span>
                <ChevronRight size={17} color="var(--text-subtle)" />
              </Link>
              ) : (
                <button key={alerta.id || `${alerta.tipo}-${alerta.data}-${alerta.mensagem}`} type="button" disabled className="alerta-fornecedor-item">
                  <span className="alerta-fornecedor-icone" style={{ backgroundColor: estilo.bg, color: estilo.color, borderColor: estilo.border }}><Icone size={17} /></span>
                  <span className="alerta-fornecedor-conteudo">
                    <span className="alerta-fornecedor-meta" style={{ color: estilo.color }}>{estilo.label} {alerta.data && <small>{formatarDataHora(alerta.data)}</small>}</span>
                    <strong>{alerta.mensagem}</strong>
                  </span>
                </button>
              )
            )
          })}
        </div>
      )}
    </section>
  )
}
