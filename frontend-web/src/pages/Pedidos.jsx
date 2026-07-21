import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Sidebar from '../components/layout/Sidebar'
import ReceberPedidoModal from '../components/ReceberPedidoModal'
import DevolucaoModal from '../components/DevolucaoModal'
import {
  Eye,
  Search,
  Filter,
  CheckCircle,
  RotateCcw
} from 'lucide-react'

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([])
  
  // Estados para Modais
  const [modalReceberAberto, setModalReceberAberto] = useState(false)
  const [modalDevolucaoAberto, setModalDevolucaoAberto] = useState(false)
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null)

  // Estados de Filtro
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('TODOS')

  const [resumo, setResumo] = useState({
    total: 0,
    pendentes: 0,
    entregues: 0,
    devolucoes: 0,
  })
  
  const navigate = useNavigate()

  useEffect(() => {
    carregarPedidos()
  }, [])

  const carregarPedidos = async () => {
    try {
      const response = await api.get('/api/pedidos')
      const data = response.data

      if (Array.isArray(data)) {
        setPedidos(data)
        setResumo({
          total: data.length,
          pendentes: data.filter((p) => p.status === 'PENDENTE_ENTREGA').length,
          entregues: data.filter((p) => p.status === 'ENTREGUE_SUCESSO' || p.status === 'ENTREGUE_COM_FALTA').length,
          devolucoes: data.filter((p) => p.status === 'PENDENTE_DEVOLUCAO').length,
        })
      }
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error)
    }
  }

  const pedidosFiltrados = pedidos.filter((p) => {
    const textoBusca = busca.toLowerCase()
    const matchTexto = p.fornecedorNome?.toLowerCase().includes(textoBusca) || p.id.toString().includes(textoBusca)
    const matchStatus = filtroStatus === 'TODOS' || p.status === filtroStatus
    return matchTexto && matchStatus
  })

  const formatarDataBR = (dataIso) => {
    if (!dataIso) return '--/--/--'
    return new Date(dataIso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
  }

  const abrirModalRecebimento = (pedido) => {
    setPedidoSelecionado(pedido)
    setModalReceberAberto(true)
  }

  const abrirModalDevolucao = (pedido) => {
    setPedidoSelecionado(pedido)
    setModalDevolucaoAberto(true)
  }

  const getStatusFormatado = (status) => {
    switch (status) {
      case 'PENDENTE_ENTREGA': return { texto: 'Aguardando', classe: 'status-PENDENTE' }
      case 'ENTREGUE_SUCESSO': return { texto: 'Entregue', classe: 'status-FINALIZADA' }
      case 'ENTREGUE_COM_FALTA': return { texto: 'Entregue c/ Falta', classe: 'status-RESPONDIDA_PARCIALMENTE' }
      case 'VALORES_INCOMPATIVEIS': return { texto: 'Divergência', classe: 'status-ABERTA' }
      case 'PENDENTE_DEVOLUCAO': return { texto: 'Devolução', classe: 'status-ABERTA' } // Reutilizando vermelho/alerta se houver no CSS
      default: return { texto: status, classe: 'bg-gray-100 text-gray-800' }
    }
  }

  return (
    <div className="layout">
      <Sidebar />

      <main className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '24px', marginBottom: '5px' }}>Gerenciamento de Pedidos</h1>
            <p style={{ color: '#6b7280' }}>Acompanhe entregas e resolva divergências</p>
          </div>
        </header>

        {/* Cards de Resumo */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{resumo.total}</div>
            <div className="stat-label">Total de Pedidos</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#f97316' }}>{resumo.pendentes}</div>
            <div className="stat-label">Aguardando Entrega</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#16a34a' }}>{resumo.entregues}</div>
            <div className="stat-label">Entregues</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#ef4444' }}>{resumo.devolucoes}</div>
            <div className="stat-label">Pendentes de Devolução</div>
          </div>
        </div>

        <div className="filters-bar">
          <div className="search-input-container">
            <Search size={18} color="#9ca3af" />
            <input
              type="text"
              placeholder="Buscar por ID ou Fornecedor..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Filter size={18} color="#6b7280" />
            <select
              className="filter-select"
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
            >
              <option value="TODOS">Todos os Status</option>
              <option value="PENDENTE_ENTREGA">Pendente de Entrega</option>
              <option value="ENTREGUE_SUCESSO">Entregue com Sucesso</option>
              <option value="ENTREGUE_COM_FALTA">Entregue com Falta</option>
              <option value="VALORES_INCOMPATIVEIS">Valores Incompatíveis</option>
              <option value="PENDENTE_DEVOLUCAO">Pendente de Devolução</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: '80px' }}>ID</th>
                <th>Fornecedor</th>
                <th style={{ width: '120px' }}>Data</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {pedidosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>
                    Nenhum pedido encontrado.
                  </td>
                </tr>
              ) : (
                pedidosFiltrados.map((p) => {
                  const statusInfo = getStatusFormatado(p.status)
                  return (
                    <tr key={p.id}>
                      <td><span style={{ fontWeight: 'bold', color: '#374151' }}>#{p.id}</span></td>
                      <td><span style={{ fontWeight: '500', color: '#111827', fontSize: '15px' }}>{p.fornecedorNome}</span></td>
                      <td><span style={{ color: '#6b7280', fontSize: '14px' }}>{formatarDataBR(p.dataCriacao)}</span></td>
                      <td><span className={`status-badge ${statusInfo.classe}`}>{statusInfo.texto}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn-icon" title="Ver Detalhes" onClick={() => navigate(`/pedidos/${p.id}`)}>
                            <Eye size={18} />
                          </button>
                          
                          {p.status === 'PENDENTE_ENTREGA' && (
                            <button className="btn-icon" title="Conferir Entrega" onClick={() => abrirModalRecebimento(p)}>
                              <CheckCircle size={18} color="#16a34a" />
                            </button>
                          )}

                          {p.status === 'PENDENTE_DEVOLUCAO' && (
                            <button className="btn-icon" title="Tratar Devolução" onClick={() => abrirModalDevolucao(p)}>
                              <RotateCcw size={18} color="#ef4444" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {modalReceberAberto && pedidoSelecionado && (
          <ReceberPedidoModal
            pedidoId={pedidoSelecionado.id}
            itens={pedidoSelecionado.itens || []}
            onClose={() => setModalReceberAberto(false)}
            onSuccess={() => {
              setModalReceberAberto(false)
              carregarPedidos()
            }}
          />
        )}

        {modalDevolucaoAberto && pedidoSelecionado && (
          <DevolucaoModal
            pedidoId={pedidoSelecionado.id}
            onClose={() => setModalDevolucaoAberto(false)}
            onSuccess={() => {
              setModalDevolucaoAberto(false)
              carregarPedidos()
            }}
          />
        )}
      </main>
    </div>
  )
}