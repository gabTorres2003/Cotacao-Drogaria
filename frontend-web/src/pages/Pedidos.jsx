import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Sidebar from '../components/layout/Sidebar'
import DevolucaoModal from '../components/DevolucaoModal'
import { Eye, Search, Filter, CheckCircle, RotateCcw, Trash2, Loader2, ArrowUpDown, Calendar } from 'lucide-react'

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [modalDevolucaoAberto, setModalDevolucaoAberto] = useState(false)
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const [abaAtiva, setAbaAtiva] = useState('ANDAMENTO')
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('TODOS')
  const [ordenacao, setOrdenacao] = useState('RECENTES')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  const [resumo, setResumo] = useState({ total: 0, pendentes: 0, entregues: 0, devolucoes: 0 })
  const navigate = useNavigate()

  useEffect(() => {
    carregarPedidos()
  }, [])

  const carregarPedidos = async () => {
    setLoading(true)
    try {
      const response = await api.get('/api/pedidos')
      const data = response.data

      if (Array.isArray(data)) {
        setPedidos(data)
        setResumo({
          total: data.length,
          pendentes: data.filter((p) => p.status === 'PENDENTE_ENTREGA' || p.status === 'CONFIRMADO_FORNECEDOR').length,
          entregues: data.filter((p) => p.status === 'ENTREGUE_SUCESSO' || p.status === 'ENTREGUE_COM_FALTA').length,
          devolucoes: data.filter((p) => p.status === 'PENDENTE_DEVOLUCAO').length,
        })
      }
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error)
    } finally {
      setLoading(false)
    }
  }

  const deletarPedido = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.')) {
      setIsDeleting(true);
      try {
        await api.delete(`/api/pedidos/${id}`);
        setPedidos(pedidos.filter(p => p.id !== id));
        alert('Pedido excluído com sucesso!');
        carregarPedidos(); 
      } catch (error) {
        alert(error.response?.data?.message || 'Erro ao excluir pedido.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const fMoney = (valor) => valor != null ? Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-';

  const pedidosProcessados = pedidos
    .filter((p) => {
      const isConcluido = p.status === 'ENTREGUE_SUCESSO' || p.status === 'ENTREGUE_COM_FALTA' || p.status === 'CANCELADO';
      if (abaAtiva === 'ANDAMENTO' && isConcluido) return false;
      if (abaAtiva === 'HISTORICO' && !isConcluido) return false;
      
      const textoBusca = busca.toLowerCase()
      const nomeEmpresa = p.fornecedor?.empresa || p.fornecedor?.nomeEmpresa || p.fornecedor?.nome || ''
      const idCotacaoStr = p.cotacao?.id ? p.cotacao.id.toString() : (p.cotacaoId ? p.cotacaoId.toString() : '');
      
      const matchProduto = p.itens ? p.itens.some(item => item.nomeProduto && item.nomeProduto.toLowerCase().includes(textoBusca)) : false;

      const matchTexto = nomeEmpresa.toLowerCase().includes(textoBusca) || 
                         p.id.toString().includes(textoBusca) || 
                         idCotacaoStr.includes(textoBusca) || 
                         matchProduto;

      const matchStatus = filtroStatus === 'TODOS' || p.status === filtroStatus

      let matchData = true;
      if (dataInicio || dataFim) {
        const dataPedido = new Date(p.dataCriacao);
        dataPedido.setHours(0, 0, 0, 0); 

        if (dataInicio) {
          const dInicio = new Date(dataInicio + 'T00:00:00');
          if (dataPedido < dInicio) matchData = false;
        }
        if (dataFim) {
          const dFim = new Date(dataFim + 'T00:00:00');
          if (dataPedido > dFim) matchData = false;
        }
      }

      return matchTexto && matchStatus && matchData;
    })
    .sort((a, b) => {
      // Ordenação robusta com fallback para datas nulas e desempate por ID
      if (ordenacao === 'RECENTES') return new Date(b.dataCriacao || 0) - new Date(a.dataCriacao || 0) || b.id - a.id;
      if (ordenacao === 'ANTIGOS') return new Date(a.dataCriacao || 0) - new Date(b.dataCriacao || 0) || a.id - b.id;
      if (ordenacao === 'MAIOR_VALOR') return (b.valorTotalPedido || 0) - (a.valorTotalPedido || 0);
      if (ordenacao === 'MENOR_VALOR') return (a.valorTotalPedido || 0) - (b.valorTotalPedido || 0);
      return 0;
    });

  const formatarDataBR = (dataIso) => {
    if (!dataIso) return '--/--/--'
    return new Date(dataIso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
  }

  const abrirModalDevolucao = (pedido) => {
    setPedidoSelecionado(pedido)
    setModalDevolucaoAberto(true)
  }

  const getStatusFormatado = (status) => {
    const baseStyle = { padding: '4px 10px', borderRadius: '20px', fontWeight: '700', fontSize: '12px', display: 'inline-block' };
    switch (status) {
      case 'PENDENTE_ENTREGA': return { texto: 'Aguard. Fornecedor', style: { ...baseStyle, backgroundColor: '#ffedd5', color: '#c2410c' } };
      case 'CONFIRMADO_FORNECEDOR': return { texto: 'Confirmado na Fábrica', style: { ...baseStyle, backgroundColor: '#cffafe', color: '#1d4ed8' } };
      case 'ENTREGUE_SUCESSO': return { texto: 'Entregue', style: { ...baseStyle, backgroundColor: '#dcfce7', color: '#15803d' } };
      case 'ENTREGUE_COM_FALTA': return { texto: 'Entregue com Falta', style: { ...baseStyle, backgroundColor: '#fef3c7', color: '#b45309' } };
      case 'VALORES_INCOMPATIVEIS': return { texto: 'Divergência: Valor', style: { ...baseStyle, backgroundColor: '#fee2e2', color: '#b91c1c' } };
      case 'DIVERGENCIA': return { texto: 'Divergência: Quantidade', style: { ...baseStyle, backgroundColor: '#fee2e2', color: '#b91c1c' } };
      case 'PENDENTE_DEVOLUCAO': return { texto: 'Devolução Pendente', style: { ...baseStyle, backgroundColor: '#f3e8ff', color: '#7e22ce' } };
      default: return { texto: status, style: { ...baseStyle, backgroundColor: '#f3f4f6', color: '#4b5563' } };
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

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', backgroundColor: '#e5e7eb', padding: '4px', borderRadius: '8px', width: 'fit-content' }}>
          <button 
            onClick={() => { setAbaAtiva('ANDAMENTO'); setFiltroStatus('TODOS'); setOrdenacao('RECENTES'); }}
            style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', backgroundColor: abaAtiva === 'ANDAMENTO' ? 'white' : 'transparent', color: abaAtiva === 'ANDAMENTO' ? '#2563eb' : '#6b7280', boxShadow: abaAtiva === 'ANDAMENTO' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
          >
            Pedidos em Andamento
          </button>
          <button 
            onClick={() => { setAbaAtiva('HISTORICO'); setFiltroStatus('TODOS'); setOrdenacao('RECENTES'); }}
            style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', backgroundColor: abaAtiva === 'HISTORICO' ? 'white' : 'transparent', color: abaAtiva === 'HISTORICO' ? '#16a34a' : '#6b7280', boxShadow: abaAtiva === 'HISTORICO' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
          >
            Histórico (Concluídos)
          </button>
        </div>

        <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          
          <div style={{ flex: '1 1 250px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #d1d5db', padding: '8px 12px', borderRadius: '6px' }}>
            <Search size={18} color="#9ca3af" />
            <input
              type="text"
              placeholder="Buscar Pedido, Empresa ou Produto..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #d1d5db', padding: '6px 12px', borderRadius: '6px' }}>
             <Calendar size={16} color="#6b7280" />
             <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: '13px', color: '#4b5563', cursor: 'pointer', backgroundColor: 'transparent' }} title="Data Inicial" />
             <span style={{ color: '#9ca3af', fontSize: '13px' }}>até</span>
             <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: '13px', color: '#4b5563', cursor: 'pointer', backgroundColor: 'transparent' }} title="Data Final" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #d1d5db', padding: '8px 12px', borderRadius: '6px' }}>
            <Filter size={16} color="#6b7280" />
            <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: '13px', color: '#4b5563', cursor: 'pointer', backgroundColor: 'transparent' }}>
              <option value="TODOS">Todos os Status</option>
              {abaAtiva === 'ANDAMENTO' ? (
                <>
                  <option value="PENDENTE_ENTREGA">Aguardando Fornecedor</option>
                  <option value="CONFIRMADO_FORNECEDOR">Confirmado na Fábrica</option>
                  <option value="VALORES_INCOMPATIVEIS">Valores Incompatíveis</option>
                  <option value="DIVERGENCIA">Divergência de Quantidade</option>
                  <option value="PENDENTE_DEVOLUCAO">Pendente de Devolução</option>
                </>
              ) : (
                <>
                  <option value="ENTREGUE_SUCESSO">Entregue com Sucesso</option>
                  <option value="ENTREGUE_COM_FALTA">Entregue com Falta</option>
                  <option value="CANCELADO">Cancelado</option>
                </>
              )}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #d1d5db', padding: '8px 12px', borderRadius: '6px' }}>
            <ArrowUpDown size={16} color="#6b7280" />
            <select value={ordenacao} onChange={(e) => setOrdenacao(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: '13px', color: '#4b5563', cursor: 'pointer', backgroundColor: 'transparent' }}>
              <option value="RECENTES">Mais Recentes</option>
              <option value="ANTIGOS">Mais Antigos</option>
              <option value="MAIOR_VALOR">Maior Valor Previsto</option>
              <option value="MENOR_VALOR">Menor Valor Previsto</option>
            </select>
          </div>

          {(busca || filtroStatus !== 'TODOS' || dataInicio || dataFim || ordenacao !== 'RECENTES') && (
            <button 
              onClick={() => { setBusca(''); setFiltroStatus('TODOS'); setDataInicio(''); setDataFim(''); setOrdenacao('RECENTES'); }}
              style={{ padding: '8px 16px', fontSize: '12px', color: '#ef4444', backgroundColor: '#fee2e2', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Limpar Filtros
            </button>
          )}
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: '80px' }}>ID</th>
                <th style={{ width: '90px' }}>Cotação</th>
                <th>Empresa (Fornecedor)</th>
                <th>Grupos</th>
                <th>Valor Previsto</th>
                <th style={{ width: '100px' }}>Data</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <Loader2 size={32} className="animate-spin" color="#3b82f6" />
                      <span style={{ fontWeight: '500' }}>Carregando pedidos...</span>
                    </div>
                  </td>
                </tr>
              ) : pedidosProcessados.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>
                    Nenhum pedido encontrado nesta aba.
                  </td>
                </tr>
              ) : (
                pedidosProcessados.map((p) => {
                  const statusInfo = getStatusFormatado(p.status)
                  const nomeEmpresa = p.fornecedor?.empresa || p.fornecedor?.nomeEmpresa || p.fornecedor?.nome || 'N/A'
                  const idCotacao = p.cotacao?.id || p.cotacaoId || '-';

                  let gruposFormatados = '-';
                  if (p.itens && p.itens.length > 0) {
                    const listaDeGrupos = p.itens.map(item => item.itemCotacao?.grupo).filter(Boolean); 
                    const gruposUnicos = [...new Set(listaDeGrupos)]; 
                    if (gruposUnicos.length > 0) gruposFormatados = gruposUnicos.join(', ');
                  }
                  
                  return (
                    <tr key={p.id}>
                      <td><span style={{ fontWeight: 'bold', color: '#374151' }}>#{p.id}</span></td>
                      
                      <td>
                        <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                          #{idCotacao}
                        </span>
                      </td>

                      <td><span style={{ fontWeight: '600', color: '#111827', fontSize: '14px' }}>{nomeEmpresa}</span></td>
                      <td><span style={{ color: '#4b5563', fontSize: '13px' }}>{gruposFormatados}</span></td>
                      <td><span style={{ fontWeight: '600', color: '#16a34a', fontSize: '14px' }}>{fMoney(p.valorTotalPedido)}</span></td>
                      <td><span style={{ color: '#6b7280', fontSize: '14px' }}>{formatarDataBR(p.dataCriacao)}</span></td>
                      <td><span style={statusInfo.style}>{statusInfo.texto}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn-icon" title="Ver Detalhes" onClick={() => navigate(`/pedidos/${p.id}`)}>
                            <Eye size={18} />
                          </button>
                          
                          {(p.status === 'PENDENTE_ENTREGA' || p.status === 'CONFIRMADO_FORNECEDOR') && (
                            <button className="btn-icon" title="Conferir Recebimento" onClick={() => navigate(`/pedidos/${p.id}/conferir`)}>
                              <CheckCircle size={18} color="#16a34a" />
                            </button>
                          )}

                          {p.status === 'PENDENTE_DEVOLUCAO' && (
                            <button className="btn-icon" title="Tratar Devolução" onClick={() => abrirModalDevolucao(p)}>
                              <RotateCcw size={18} color="#ef4444" />
                            </button>
                          )}

                          <button className="btn-icon" title="Excluir Pedido" onClick={() => deletarPedido(p.id)}>
                            <Trash2 size={18} color="#ef4444" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {modalDevolucaoAberto && pedidoSelecionado && (
          <DevolucaoModal
            pedidoId={pedidoSelecionado.id}
            onClose={() => setModalDevolucaoAberto(false)}
            onSuccess={() => { setModalDevolucaoAberto(false); carregarPedidos(); }}
          />
        )}
      </main>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  )
}