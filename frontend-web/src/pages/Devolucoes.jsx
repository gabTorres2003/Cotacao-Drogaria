import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Sidebar from '../components/layout/Sidebar';
import DevolucaoModal from '../components/DevolucaoModal';
import {
  Search,
  Filter,
  RotateCcw,
  Trash2,
  Edit2,
  Clock,
  Banknote,
  CheckCircle,
  Plus,
  Eye,
  ArrowUpDown
} from 'lucide-react';

export default function Devolucoes() {
  const [devolucoes, setDevolucoes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [modalAberto, setModalAberto] = useState(false);
  const [devolucaoParaEditar, setDevolucaoParaEditar] = useState(null);
  const [modoLeitura, setModoLeitura] = useState(false);

  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  const [abaAtiva, setAbaAtiva] = useState('ANDAMENTO');
  const [ordenacao, setOrdenacao] = useState('RECENTES');

  const [resumo, setResumo] = useState({
    total: 0,
    aguardandoRecolhimento: 0,
    aguardandoCredito: 0,
    concluidas: 0,
  });

  const navigate = useNavigate();

  useEffect(() => {
    carregarDevolucoes();
  }, []);

  const carregarDevolucoes = async () => {
    try {
      const response = await api.get('/api/devolucoes');
      const data = response.data;

      if (Array.isArray(data)) {
        setDevolucoes(data);
        setResumo({
          total: data.length,
          aguardandoRecolhimento: data.filter(d => d.status === 'AGUARDANDO_RECOLHIMENTO').length,
          aguardandoCredito: data.filter(d => d.status === 'AGUARDANDO_CREDITO').length,
          concluidas: data.filter(d => d.status === 'CONCLUIDA').length,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar devoluções:', error);
    } finally {
      setLoading(false);
    }
  };

  const deletarDevolucao = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta devolução permanentemente?')) {
      try {
        await api.delete(`/api/devolucoes/${id}`);
        carregarDevolucoes();
      } catch (error) {
        alert('Erro ao excluir devolução.');
      }
    }
  };

  const abrirModalNova = () => {
    setDevolucaoParaEditar(null);
    setModoLeitura(false);
    setModalAberto(true);
  };

  const abrirModalEdicao = (id) => {
    setDevolucaoParaEditar(id);
    setModoLeitura(false);
    setModalAberto(true);
  };

  const abrirModalVisualizacao = (id) => {
    setDevolucaoParaEditar(id);
    setModoLeitura(true);
    setModalAberto(true);
  };

  const devolucoesFiltradas = devolucoes.filter((d) => {
    const isEncerrada = d.status === 'CONCLUIDA' || d.status === 'CANCELADA';
    if (abaAtiva === 'ANDAMENTO' && isEncerrada) return false;
    if (abaAtiva === 'HISTORICO' && !isEncerrada) return false;

    const textoBusca = busca.toLowerCase();
    const fornecedorNome = d.fornecedor?.nome || d.fornecedor?.empresa || '';
    const entreguePorTexto = d.fornecedor?.entreguePor || '';
    const nf = d.nfOrigem || '';
    const pedidoIdStr = d.pedido?.id ? d.pedido.id.toString() : '';
    
    const matchBusca = fornecedorNome.toLowerCase().includes(textoBusca) || 
                       entreguePorTexto.toLowerCase().includes(textoBusca) ||
                       nf.toLowerCase().includes(textoBusca) || 
                       d.id.toString().includes(textoBusca) || 
                       pedidoIdStr.includes(textoBusca);
                       
    const matchStatus = filtroStatus === 'TODOS' || d.status === filtroStatus;
    
    return matchBusca && matchStatus;
  }).sort((a, b) => {
    if (ordenacao === 'RECENTES') return new Date(b.dataSolicitacao || 0) - new Date(a.dataSolicitacao || 0) || b.id - a.id;
    if (ordenacao === 'ANTIGOS') return new Date(a.dataSolicitacao || 0) - new Date(b.dataSolicitacao || 0) || a.id - b.id;
    if (ordenacao === 'MAIOR_VALOR') return (b.valorTotal || 0) - (a.valorTotal || 0);
    if (ordenacao === 'MENOR_VALOR') return (a.valorTotal || 0) - (b.valorTotal || 0);
    return 0;
  });

  const formatarData = (dataIso) => {
    if (!dataIso) return '--/--/--';
    const [ano, mes, dia] = dataIso.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const fMoney = (v) => v != null ? Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-';

  const getStatusBadge = (status) => {
    switch (status) {
      case 'AGUARDANDO_RECOLHIMENTO': return <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', backgroundColor: 'var(--warning-soft)', color: 'var(--warning-text)' }}>Aguard. Recolhimento</span>;
      case 'AGUARDANDO_CREDITO': return <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', backgroundColor: 'var(--info-soft)', color: 'var(--primary-hover)' }}>Aguard. Crédito/Boleto</span>;
      case 'CONCLUIDA': return <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', backgroundColor: 'var(--success-soft)', color: 'var(--success)' }}>Concluída</span>;
      case 'CANCELADA': return <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', backgroundColor: 'var(--danger-soft)', color: 'var(--danger-text)' }}>Cancelada</span>;
      default: return <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', backgroundColor: 'var(--bg)', color: 'var(--text-secondary)' }}>{status}</span>;
    }
  };

  return (
    <div className="layout">
      <Sidebar />

      <main className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1 style={{ fontSize: '24px', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RotateCcw size={28} color="var(--primary-hover)" /> Gestão de Devoluções
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>Acompanhe recolhimentos, protocolos e abatimentos financeiros.</p>
          </div>
          
          <button 
            onClick={abrirModalNova}
            style={{ padding: '10px 20px', backgroundColor: 'var(--info)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
          >
            <Plus size={20} /> Registrar Devolução Manual
          </button>
        </header>

        <div className="stats-grid" style={{ marginBottom: '24px' }}>
          <div className="stat-card">
            <div className="stat-value">{resumo.total}</div>
            <div className="stat-label">Total Registrado</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={24} /> {resumo.aguardandoRecolhimento}
            </div>
            <div className="stat-label">Aguard. Recolhimento</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--info)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Banknote size={24} /> {resumo.aguardandoCredito}
            </div>
            <div className="stat-label">Aguard. Crédito (NF/Boleto)</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={24} /> {resumo.concluidas}
            </div>
            <div className="stat-label">Devoluções Concluídas</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', backgroundColor: 'var(--border)', padding: '4px', borderRadius: '8px', width: 'fit-content' }}>
          <button 
            onClick={() => { setAbaAtiva('ANDAMENTO'); setFiltroStatus('TODOS'); setOrdenacao('RECENTES'); }}
            style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', backgroundColor: abaAtiva === 'ANDAMENTO' ? 'var(--surface)' : 'transparent', color: abaAtiva === 'ANDAMENTO' ? 'var(--primary)' : 'var(--text-muted)', boxShadow: abaAtiva === 'ANDAMENTO' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
          >
            Devoluções em Andamento
          </button>
          <button 
            onClick={() => { setAbaAtiva('HISTORICO'); setFiltroStatus('TODOS'); setOrdenacao('RECENTES'); }}
            style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', backgroundColor: abaAtiva === 'HISTORICO' ? 'var(--surface)' : 'transparent', color: abaAtiva === 'HISTORICO' ? 'var(--success)' : 'var(--text-muted)', boxShadow: abaAtiva === 'HISTORICO' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
          >
            Histórico (Encerradas)
          </button>
        </div>

        <div className="filters-bar" style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center' }}>
          <div className="search-input-container" style={{ margin: 0, flex: '1 1 250px' }}>
            <Search size={18} color="var(--text-subtle)" />
            <input
              type="text"
              placeholder="Buscar Fornecedor, NF, ID ou Pedido..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{ border: 'none', outline: 'none', width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Filter size={18} color="var(--text-muted)" />
            <select
              className="filter-select"
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer', backgroundColor: 'transparent' }}
            >
              <option value="TODOS">Todos os Status</option>
              {abaAtiva === 'ANDAMENTO' ? (
                <>
                  <option value="AGUARDANDO_RECOLHIMENTO">Aguardando Recolhimento</option>
                  <option value="AGUARDANDO_CREDITO">Aguardando Crédito</option>
                </>
              ) : (
                <>
                  <option value="CONCLUIDA">Concluídas</option>
                  <option value="CANCELADA">Canceladas</option>
                </>
              )}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ArrowUpDown size={18} color="var(--text-muted)" />
            <select
              className="filter-select"
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer', backgroundColor: 'transparent' }}
            >
              <option value="RECENTES">Mais Recentes</option>
              <option value="ANTIGOS">Mais Antigas</option>
              <option value="MAIOR_VALOR">Maior Valor</option>
              <option value="MENOR_VALOR">Menor Valor</option>
            </select>
          </div>

          {(busca || filtroStatus !== 'TODOS' || ordenacao !== 'RECENTES') && (
            <button 
              onClick={() => { setBusca(''); setFiltroStatus('TODOS'); setOrdenacao('RECENTES'); }}
              style={{ padding: '8px 16px', fontSize: '12px', color: 'var(--danger)', backgroundColor: 'var(--danger-soft)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Limpar Filtros
            </button>
          )}
        </div>

        <div className="table-container">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' }}>
            <thead style={{ backgroundColor: 'var(--surface-muted)', borderBottom: '1px solid var(--border)' }}>
              <tr>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '13px' }}>ID / NF</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '13px', textAlign: 'center' }}>Origem</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '13px' }}>Pedido por</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '13px' }}>Entregue por</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '13px', textAlign: 'center' }}>Data Solicitada</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '13px', textAlign: 'center' }}>Data Recolhido</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '13px' }}>Protocolo(s)</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '13px', textAlign: 'right' }}>Valor Total</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '13px', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '13px', textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Carregando devoluções...</td></tr>
              ) : devolucoesFiltradas.length === 0 ? (
                <tr><td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Nenhuma devolução encontrada nesta aba.</td></tr>
              ) : (
                devolucoesFiltradas.map((dev) => (
                  <tr key={dev.id} style={{ borderBottom: '1px solid var(--surface-muted)' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>#{dev.id}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>NF: {dev.nfOrigem || 'Não inf.'}</div>
                    </td>
                    
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      {dev.pedido?.id ? (
                        <button 
                          onClick={() => navigate(`/pedidos/${dev.pedido.id}`)}
                          style={{ backgroundColor: 'var(--purple-soft)', color: 'var(--purple-text)', border: '1px solid var(--purple-border)', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          Pedido #{dev.pedido.id}
                        </button>
                      ) : (
                        <span style={{ backgroundColor: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--border-strong)', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                          Manual
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '16px', fontWeight: '600', color: 'var(--text)', fontSize: '14px' }}>
                      {dev.fornecedor?.empresa || dev.fornecedor?.nome || 'Fornecedor Excluído'}
                    </td>
                    
                    <td style={{ padding: '16px', fontWeight: '500', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {dev.fornecedor?.entreguePor || '-'}
                    </td>
                    
                    <td style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                      {formatarData(dev.dataSolicitacao)}
                    </td>

                    <td style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                      {formatarData(dev.dataRecolhimento)}
                    </td>

                    <td style={{ padding: '16px' }}>
                      {dev.protocolo && <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Geral: {dev.protocolo}</div>}
                      {dev.protocoloFalta && <div style={{ fontSize: '12px', color: 'var(--warning-text)' }}>Falta: {dev.protocoloFalta}</div>}
                      {dev.protocoloSobra && <div style={{ fontSize: '12px', color: 'var(--primary-hover)' }}>Sobra: {dev.protocoloSobra}</div>}
                      {!dev.protocolo && !dev.protocoloFalta && !dev.protocoloSobra && <span style={{ color: 'var(--text-subtle)', fontSize: '12px' }}>Aguardando...</span>}
                    </td>

                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: 'bold', color: 'var(--success)', fontSize: '15px' }}>
                      {fMoney(dev.valorTotal)}
                    </td>

                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      {getStatusBadge(dev.status)}
                    </td>

                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button onClick={() => abrirModalVisualizacao(dev.id)} title="Ver Detalhes" style={{ background: 'var(--bg)', color: 'var(--text-secondary)', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}>
                          <Eye size={18} />
                        </button>
                        <button onClick={() => abrirModalEdicao(dev.id)} title="Editar" style={{ background: 'var(--primary-soft)', color: 'var(--info)', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}>
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => deletarDevolucao(dev.id)} title="Excluir" style={{ background: 'var(--danger-soft)', color: 'var(--danger)', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}>
                          <Trash2 size={18} />
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

      {modalAberto && (
        <DevolucaoModal 
          devolucaoId={devolucaoParaEditar} 
          readOnly={modoLeitura}
          onClose={() => setModalAberto(false)} 
          onSuccess={() => {
            setModalAberto(false);
            carregarDevolucoes();
          }}
        />
      )}
    </div>
  );
}