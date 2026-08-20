import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Sidebar from '../components/layout/Sidebar'
import UploadModal from '../components/layout/UploadModal'
import ModalNovaCotacaoManual from '../components/cotacao/modais/ModalNovaCotacaoManual';
import { FileText, Search, Plus, Filter, ArrowUpDown, Loader2, Trash2, Eye, ListPlus } from 'lucide-react';

export default function Cotacoes() {
  const navigate = useNavigate()
  const [cotacoes, setCotacoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletandoId, setDeletandoId] = useState(null)

  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('TODOS')
  const [ordenacao, setOrdenacao] = useState('RECENTES')
  const [abaAtiva, setAbaAtiva] = useState('ANDAMENTO')
  
  // NOVO ESTADO: Setor da Cotação
  const [setorAtivo, setSetorAtivo] = useState('TODOS')

  const [resumo, setResumo] = useState({ total: 0, emAberto: 0, aguardando: 0, finalizadas: 0 })

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isModalManualOpen, setIsModalManualOpen] = useState(false);

  useEffect(() => {
    carregarCotacoes()
  }, [])

  const carregarCotacoes = async () => {
    setLoading(true)
    try {
      const response = await api.get('/api/cotacao')
      const data = response.data || []
      setCotacoes(data)

      setResumo({
        total: data.length,
        emAberto: data.filter(c => c.status === 'ABERTA').length,
        aguardando: data.filter(c => ['PENDENTE', 'RESPONDIDA_PARCIALMENTE', 'RESPONDIDA'].includes(c.status)).length,
        finalizadas: data.filter(c => c.status === 'FINALIZADA' || c.status === 'CANCELADA').length
      })
    } catch (error) {
      console.error('Erro ao carregar cotações', error)
    } finally {
      setLoading(false)
    }
  }

  const deletarCotacao = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta cotação permanentemente?')) {
      setDeletandoId(id)
      try {
        await api.delete(`/api/cotacao/${id}`)
        carregarCotacoes()
      } catch (error) {
        alert(error.response?.data || 'Erro ao excluir a cotação.')
      } finally {
        setDeletandoId(null)
      }
    }
  }

  const formatarData = (dataStr) => {
    if (!dataStr) return '--/--/--'
    const d = new Date(dataStr)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
  }

  const cotacoesFiltradas = cotacoes
    .filter(c => {
      const isEncerrada = c.status === 'FINALIZADA' || c.status === 'CANCELADA';
      if (abaAtiva === 'ANDAMENTO' && isEncerrada) return false;
      if (abaAtiva === 'HISTORICO' && !isEncerrada) return false;

      const texto = busca.toLowerCase();
      const descBusca = c.descricao || c.origem || '';
      const userBusca = c.nomeUsuario || c.usuario || '';
      
      const matchTexto = c.id.toString().includes(texto) || 
                         descBusca.toLowerCase().includes(texto) ||
                         userBusca.toLowerCase().includes(texto);
      
      const matchStatus = filtroStatus === 'TODOS' || c.status === filtroStatus;

      // FILTRO POR SETOR
      let matchSetor = true;
      if (setorAtivo !== 'TODOS') {
          const setorCotacao = (c.setor || c.setorCompra || c.descricao || '').toUpperCase();
          if (setorAtivo === 'MEDICAMENTOS') matchSetor = setorCotacao.includes('MEDICAMENTO');
          if (setorAtivo === 'PERFUMARIA') matchSetor = setorCotacao.includes('PERFUMARIA');
      }

      return matchTexto && matchStatus && matchSetor;
    })
    .sort((a, b) => {
      if (ordenacao === 'RECENTES') return new Date(b.dataCriacao) - new Date(a.dataCriacao);
      if (ordenacao === 'ANTIGOS') return new Date(a.dataCriacao) - new Date(b.dataCriacao);
      return 0;
    });

  const getBadge = (status) => {
    switch (status) {
      case 'ABERTA': return <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', backgroundColor: '#e0e7ff', color: '#3730a3' }}>Em Aberto</span>;
      case 'PENDENTE': return <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', backgroundColor: '#ffedd5', color: '#c2410c' }}>Aguard. Resposta</span>;
      case 'RESPONDIDA_PARCIALMENTE': return <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', backgroundColor: '#fef3c7', color: '#b45309' }}>Resp. Parcial</span>;
      case 'RESPONDIDA': return <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', backgroundColor: '#dcfce7', color: '#15803d' }}>Pronta p/ Fechar</span>;
      case 'FINALIZADA': return <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', backgroundColor: '#f3f4f6', color: '#4b5563' }}>Encerrada</span>;
      default: return <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', backgroundColor: '#f3f4f6', color: '#4b5563' }}>{status}</span>;
    }
  };

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1 style={{ fontSize: '24px', marginBottom: '5px' }}>Painel de Cotações</h1>
            <p style={{ color: '#6b7280' }}>Gerencie suas compras e fornecedores</p>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setIsModalManualOpen(true)}
              style={{ padding: '10px 20px', backgroundColor: '#eab308', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
            >
              <ListPlus size={20} /> Nova Cotação (Manual / Busca)
            </button>

            <button 
              onClick={() => setIsUploadModalOpen(true)}
              style={{ padding: '10px 20px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
            >
              <FileText size={20} /> Importar Faltas DNA
            </button>
          </div>
        </header>

        <div className="stats-grid" style={{ marginBottom: '24px' }}>
          <div className="stat-card">
            <div className="stat-value">{resumo.total}</div>
            <div className="stat-label">Total Gerado</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#3b82f6' }}>{resumo.emAberto}</div>
            <div className="stat-label">Em Aberto (Sem Envio)</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#f97316' }}>{resumo.aguardando}</div>
            <div className="stat-label">Aguardando Respostas</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#16a34a' }}>{resumo.finalizadas}</div>
            <div className="stat-label">Finalizadas / Histórico</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '20px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '10px', backgroundColor: '#e5e7eb', padding: '4px', borderRadius: '8px', width: 'fit-content' }}>
              <button 
                onClick={() => { setAbaAtiva('ANDAMENTO'); setFiltroStatus('TODOS'); }}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', backgroundColor: abaAtiva === 'ANDAMENTO' ? 'white' : 'transparent', color: abaAtiva === 'ANDAMENTO' ? '#2563eb' : '#6b7280', boxShadow: abaAtiva === 'ANDAMENTO' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
              >
                Cotações em Andamento
              </button>
              <button 
                onClick={() => { setAbaAtiva('HISTORICO'); setFiltroStatus('TODOS'); }}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', backgroundColor: abaAtiva === 'HISTORICO' ? 'white' : 'transparent', color: abaAtiva === 'HISTORICO' ? '#16a34a' : '#6b7280', boxShadow: abaAtiva === 'HISTORICO' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
              >
                Histórico (Encerradas)
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '8px', width: 'fit-content', border: '1px solid #cbd5e1' }}>
              <button 
                onClick={() => setSetorAtivo('TODOS')}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', backgroundColor: setorAtivo === 'TODOS' ? 'white' : 'transparent', color: setorAtivo === 'TODOS' ? '#1e293b' : '#64748b', boxShadow: setorAtivo === 'TODOS' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
              >
                Todas Origens
              </button>
              <button 
                onClick={() => setSetorAtivo('MEDICAMENTOS')}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', backgroundColor: setorAtivo === 'MEDICAMENTOS' ? 'white' : 'transparent', color: setorAtivo === 'MEDICAMENTOS' ? '#2563eb' : '#64748b', boxShadow: setorAtivo === 'MEDICAMENTOS' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
              >
                Medicamentos
              </button>
              <button 
                onClick={() => setSetorAtivo('PERFUMARIA')}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', backgroundColor: setorAtivo === 'PERFUMARIA' ? 'white' : 'transparent', color: setorAtivo === 'PERFUMARIA' ? '#9333ea' : '#64748b', boxShadow: setorAtivo === 'PERFUMARIA' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
              >
                Perfumaria
              </button>
            </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          
          <div style={{ flex: '1 1 250px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #d1d5db', padding: '8px 12px', borderRadius: '6px' }}>
            <Search size={18} color="#9ca3af" />
            <input
              type="text"
              placeholder="Buscar por ID ou Descrição..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #d1d5db', padding: '8px 12px', borderRadius: '6px' }}>
            <Filter size={16} color="#6b7280" />
            <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: '13px', color: '#4b5563', cursor: 'pointer' }}>
              <option value="TODOS">Todos os Status</option>
              {abaAtiva === 'ANDAMENTO' ? (
                <>
                  <option value="ABERTA">Em Aberto</option>
                  <option value="PENDENTE">Aguard. Resposta</option>
                  <option value="RESPONDIDA_PARCIALMENTE">Resp. Parcial</option>
                  <option value="RESPONDIDA">Pronta p/ Fechar</option>
                </>
              ) : (
                <>
                  <option value="FINALIZADA">Finalizada / Encerrada</option>
                  <option value="CANCELADA">Cancelada</option>
                </>
              )}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #d1d5db', padding: '8px 12px', borderRadius: '6px' }}>
            <ArrowUpDown size={16} color="#6b7280" />
            <select value={ordenacao} onChange={(e) => setOrdenacao(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: '13px', color: '#4b5563', cursor: 'pointer' }}>
              <option value="RECENTES">Mais Recentes</option>
              <option value="ANTIGOS">Mais Antigas</option>
            </select>
          </div>

          {(busca || filtroStatus !== 'TODOS' || ordenacao !== 'RECENTES' || setorAtivo !== 'TODOS') && (
            <button 
              onClick={() => { setBusca(''); setFiltroStatus('TODOS'); setOrdenacao('RECENTES'); setSetorAtivo('TODOS'); }}
              style={{ padding: '8px 16px', fontSize: '12px', color: '#ef4444', backgroundColor: '#fee2e2', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Limpar Filtros
            </button>
          )}
        </div>

        <div className="table-container" style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '16px', color: '#64748b', fontWeight: '600', fontSize: '13px', width: '80px' }}>ID</th>
                <th style={{ padding: '16px', color: '#64748b', fontWeight: '600', fontSize: '13px' }}>Descrição</th>
                <th style={{ padding: '16px', color: '#64748b', fontWeight: '600', fontSize: '13px', width: '150px' }}>Usuário</th>
                <th style={{ padding: '16px', color: '#64748b', fontWeight: '600', fontSize: '13px', width: '120px' }}>Data</th>
                <th style={{ padding: '16px', color: '#64748b', fontWeight: '600', fontSize: '13px', width: '150px' }}>Status</th>
                <th style={{ padding: '16px', color: '#64748b', fontWeight: '600', fontSize: '13px', width: '120px', textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <Loader2 size={32} className="animate-spin" color="#3b82f6" />
                      <span style={{ fontWeight: '500' }}>Carregando cotações...</span>
                    </div>
                  </td>
                </tr>
              ) : cotacoesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>
                    Nenhuma cotação encontrada nesta aba ou setor.
                  </td>
                </tr>
              ) : (
                cotacoesFiltradas.map((cotacao) => (
                  <tr key={cotacao.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px', fontWeight: 'bold', color: '#374151' }}>#{cotacao.id}</td>
                    <td style={{ padding: '16px', color: '#1f2937', fontWeight: '500' }}>
                      {cotacao.descricao || cotacao.origem || 'Cotação Manual'}
                    </td>
                    <td style={{ padding: '16px', color: '#4b5563', fontSize: '14px' }}>
                      <span style={{ backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        {cotacao.nomeUsuario || cotacao.usuario || 'Sistema'}
                      </span>
                    </td>

                    <td style={{ padding: '16px', color: '#6b7280', fontSize: '14px' }}>{formatarData(cotacao.dataCriacao)}</td>
                    <td style={{ padding: '16px' }}>{getBadge(cotacao.status)}</td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button onClick={() => navigate(`/cotacao/${cotacao.id}`)} title="Abrir Cotação" style={{ background: '#f3f4f6', color: '#4b5563', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '12px' }}>
                          <Eye size={16} /> Abrir
                        </button>
                        
                        <button 
                          onClick={() => deletarCotacao(cotacao.id)} 
                          disabled={deletandoId === cotacao.id}
                          title="Excluir Cotação" 
                          style={{ background: '#fef2f2', color: '#ef4444', border: 'none', padding: '8px', borderRadius: '6px', cursor: deletandoId === cotacao.id ? 'not-allowed' : 'pointer' }}
                        >
                          {deletandoId === cotacao.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {isUploadModalOpen && (
        <UploadModal 
          onClose={() => setIsUploadModalOpen(false)} 
          onSuccess={carregarCotacoes} 
        />
      )}

      {isModalManualOpen && (
        <ModalNovaCotacaoManual 
          isOpen={isModalManualOpen} 
          onClose={() => { setIsModalManualOpen(false); carregarCotacoes(); }} 
        />
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  )
}