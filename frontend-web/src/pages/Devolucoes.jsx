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
  Plus
} from 'lucide-react';

export default function Devolucoes() {
  const [devolucoes, setDevolucoes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para o Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [devolucaoParaEditar, setDevolucaoParaEditar] = useState(null);

  // Filtros
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('TODOS');

  // Resumo
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
    setModalAberto(true);
  };

  const abrirModalEdicao = (id) => {
    setDevolucaoParaEditar(id);
    setModalAberto(true);
  };

  const devolucoesFiltradas = devolucoes.filter((d) => {
    const textoBusca = busca.toLowerCase();
    const fornecedorNome = d.fornecedor?.nome || d.fornecedor?.empresa || '';
    const nf = d.nfOrigem || '';
    
    const matchBusca = fornecedorNome.toLowerCase().includes(textoBusca) || nf.toLowerCase().includes(textoBusca) || d.id.toString().includes(textoBusca);
    const matchStatus = filtroStatus === 'TODOS' || d.status === filtroStatus;
    
    return matchBusca && matchStatus;
  });

  const formatarData = (dataIso) => {
    if (!dataIso) return '--/--/--';
    const [ano, mes, dia] = dataIso.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const fMoney = (v) => v != null ? Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-';

  const getStatusBadge = (status) => {
    switch (status) {
      case 'AGUARDANDO_RECOLHIMENTO': return <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', backgroundColor: '#ffedd5', color: '#c2410c' }}>Aguard. Recolhimento</span>;
      case 'AGUARDANDO_CREDITO': return <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', backgroundColor: '#dbeafe', color: '#1d4ed8' }}>Aguard. Crédito/Boleto</span>;
      case 'CONCLUIDA': return <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', backgroundColor: '#dcfce7', color: '#15803d' }}>Concluída</span>;
      case 'CANCELADA': return <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', backgroundColor: '#fee2e2', color: '#b91c1c' }}>Cancelada</span>;
      default: return <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', backgroundColor: '#f3f4f6', color: '#4b5563' }}>{status}</span>;
    }
  };

  return (
    <div className="layout">
      <Sidebar />

      <main className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1 style={{ fontSize: '24px', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RotateCcw size={28} color="#1d4ed8" /> Gestão de Devoluções
            </h1>
            <p style={{ color: '#6b7280' }}>Acompanhe recolhimentos, protocolos e abatimentos financeiros.</p>
          </div>
          
          <button 
            onClick={abrirModalNova}
            style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
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
            <div className="stat-value" style={{ color: '#f97316', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={24} /> {resumo.aguardandoRecolhimento}
            </div>
            <div className="stat-label">Aguard. Recolhimento</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Banknote size={24} /> {resumo.aguardandoCredito}
            </div>
            <div className="stat-label">Aguard. Crédito (NF/Boleto)</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={24} /> {resumo.concluidas}
            </div>
            <div className="stat-label">Devoluções Concluídas</div>
          </div>
        </div>

        <div className="filters-bar" style={{ marginBottom: '20px' }}>
          <div className="search-input-container">
            <Search size={18} color="#9ca3af" />
            <input
              type="text"
              placeholder="Buscar por Fornecedor, NF ou ID..."
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
              <option value="AGUARDANDO_RECOLHIMENTO">Aguardando Recolhimento</option>
              <option value="AGUARDANDO_CREDITO">Aguardando Crédito</option>
              <option value="CONCLUIDA">Concluídas</option>
              <option value="CANCELADA">Canceladas</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' }}>
            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '16px', color: '#64748b', fontWeight: '600', fontSize: '13px' }}>ID / NF</th>
                <th style={{ padding: '16px', color: '#64748b', fontWeight: '600', fontSize: '13px' }}>Fornecedor</th>
                <th style={{ padding: '16px', color: '#64748b', fontWeight: '600', fontSize: '13px', textAlign: 'center' }}>Data Solicitação</th>
                <th style={{ padding: '16px', color: '#64748b', fontWeight: '600', fontSize: '13px' }}>Protocolo(s)</th>
                <th style={{ padding: '16px', color: '#64748b', fontWeight: '600', fontSize: '13px', textAlign: 'right' }}>Valor Total</th>
                <th style={{ padding: '16px', color: '#64748b', fontWeight: '600', fontSize: '13px', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '16px', color: '#64748b', fontWeight: '600', fontSize: '13px', textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>Carregando devoluções...</td></tr>
              ) : devolucoesFiltradas.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>Nenhuma devolução encontrada.</td></tr>
              ) : (
                devolucoesFiltradas.map((dev) => (
                  <tr key={dev.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 'bold', color: '#374151' }}>#{dev.id}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>NF: {dev.nfOrigem || 'Não inf.'}</div>
                    </td>
                    
                    <td style={{ padding: '16px', fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>
                      {dev.fornecedor?.empresa || dev.fornecedor?.nome || 'Fornecedor Excluído'}
                    </td>
                    
                    <td style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                      {formatarData(dev.dataSolicitacao)}
                    </td>

                    <td style={{ padding: '16px' }}>
                      {dev.protocolo && <div style={{ fontSize: '12px', color: '#334155' }}>Geral: {dev.protocolo}</div>}
                      {dev.protocoloFalta && <div style={{ fontSize: '12px', color: '#b45309' }}>Falta: {dev.protocoloFalta}</div>}
                      {dev.protocoloSobra && <div style={{ fontSize: '12px', color: '#1d4ed8' }}>Sobra: {dev.protocoloSobra}</div>}
                      {!dev.protocolo && !dev.protocoloFalta && !dev.protocoloSobra && <span style={{ color: '#94a3b8', fontSize: '12px' }}>Aguardando...</span>}
                    </td>

                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: 'bold', color: '#16a34a', fontSize: '15px' }}>
                      {fMoney(dev.valorTotal)}
                    </td>

                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      {getStatusBadge(dev.status)}
                    </td>

                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button onClick={() => abrirModalEdicao(dev.id)} title="Editar / Ver Detalhes" style={{ background: '#eff6ff', color: '#3b82f6', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}>
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => deletarDevolucao(dev.id)} title="Excluir" style={{ background: '#fef2f2', color: '#ef4444', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}>
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

      {/* Renderiza o Modal se estiver aberto */}
      {modalAberto && (
        <DevolucaoModal 
          devolucaoId={devolucaoParaEditar} 
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