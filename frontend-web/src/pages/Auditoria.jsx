import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Sidebar from '../components/layout/Sidebar';
import {
  Search,
  Filter,
  History,
  ShieldAlert,
  UserCheck,
  Trash2,
  CalendarDays,
  FileText
} from 'lucide-react';

export default function Auditoria() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados dos Filtros
  const [busca, setBusca] = useState('');
  const [filtroAcao, setFiltroAcao] = useState('TODOS');
  const [filtroTipoUsuario, setFiltroTipoUsuario] = useState('TODOS');

  // Estados dos Resumos
  const [resumo, setResumo] = useState({
    total: 0,
    logins: 0,
    criacoes: 0,
    exclusoes: 0,
  });

  useEffect(() => {
    carregarLogs();
  }, []);

  const carregarLogs = async () => {
    try {
      const response = await api.get('/api/auditoria');
      const data = response.data;

      if (Array.isArray(data)) {
        setLogs(data);
        setResumo({
          total: data.length,
          logins: data.filter(log => log.acao === 'LOGIN').length,
          criacoes: data.filter(log => log.acao === 'CRIACAO').length,
          exclusoes: data.filter(log => log.acao === 'EXCLUSAO').length,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar logs de auditoria:', error);
    } finally {
      setLoading(false);
    }
  };

  const logsFiltrados = logs.filter((log) => {
    const textoBusca = busca.toLowerCase();
    const matchBusca = 
      (log.nomeUsuario && log.nomeUsuario.toLowerCase().includes(textoBusca)) ||
      (log.entidadeAfetada && log.entidadeAfetada.toLowerCase().includes(textoBusca)) ||
      (log.detalhes && log.detalhes.toLowerCase().includes(textoBusca));

    const matchAcao = filtroAcao === 'TODOS' || log.acao === filtroAcao;
    const matchTipoUsuario = filtroTipoUsuario === 'TODOS' || log.tipoUsuario === filtroTipoUsuario;

    return matchBusca && matchAcao && matchTipoUsuario;
  });

  const formatarDataHora = (dataIso) => {
    if (!dataIso) return '--/--/--';
    const data = new Date(dataIso);
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + 
           ' às ' + 
           data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const renderBadgeAcao = (acao) => {
    let bg = '#f3f4f6', color = '#4b5563', label = acao;

    switch (acao) {
      case 'LOGIN':
      case 'LOGOUT':
        bg = '#dbeafe'; color = '#1d4ed8'; label = acao;
        break;
      case 'CRIACAO':
      case 'GERACAO_PEDIDO':
      case 'ENVIO_COTACAO':
        bg = '#dcfce7'; color = '#166534'; label = acao.replace('_', ' ');
        break;
      case 'ATUALIZACAO':
      case 'STATUS_PEDIDO':
      case 'RESPOSTA_COTACAO':
        bg = '#fef08a'; color = '#854d0e'; label = acao.replace('_', ' ');
        break;
      case 'EXCLUSAO':
        bg = '#fee2e2'; color = '#991b1b'; label = 'EXCLUSÃO';
        break;
      case 'RESET_SENHA':
        bg = '#f3e8ff'; color = '#7e22ce'; label = 'RESET DE SENHA';
        break;
      default:
        break;
    }

    return (
      <span style={{
        padding: '4px 8px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: '700',
        backgroundColor: bg,
        color: color,
        whiteSpace: 'nowrap'
      }}>
        {label}
      </span>
    );
  };

  return (
    <div className="layout">
      <Sidebar />

      <main className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '24px', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={28} color="#1d4ed8" />
              Auditoria do Sistema
            </h1>
            <p style={{ color: '#6b7280' }}>Monitore os acessos e rastreie as alterações feitas na plataforma.</p>
          </div>
        </header>

        {/* --- CARDS DE ESTATÍSTICAS --- */}
        <div className="stats-grid" style={{ marginBottom: '24px' }}>
          <div className="stat-card">
            <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={24} color="#64748b" /> {resumo.total}
            </div>
            <div className="stat-label">Registros (Últimos 100)</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#2563eb', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck size={24} /> {resumo.logins}
            </div>
            <div className="stat-label">Acessos (Logins)</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={24} /> {resumo.criacoes}
            </div>
            <div className="stat-label">Criações / Envios</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trash2 size={24} /> {resumo.exclusoes}
            </div>
            <div className="stat-label">Exclusões</div>
          </div>
        </div>

        {/* --- BARRA DE FILTROS --- */}
        <div className="filters-bar" style={{ marginBottom: '20px' }}>
          <div className="search-input-container">
            <Search size={18} color="#9ca3af" />
            <input
              type="text"
              placeholder="Buscar por usuário, tela ou detalhes..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Filter size={18} color="#6b7280" />
            <select
              className="filter-select"
              value={filtroAcao}
              onChange={(e) => setFiltroAcao(e.target.value)}
            >
              <option value="TODOS">Todas as Ações</option>
              <option value="LOGIN">Acessos (Login)</option>
              <option value="CRIACAO">Criações Gerais</option>
              <option value="ATUALIZACAO">Edições / Atualizações</option>
              <option value="EXCLUSAO">Exclusões (Deletes)</option>
              <option value="GERACAO_PEDIDO">Pedidos Gerados</option>
              <option value="STATUS_PEDIDO">Status Alterados</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CalendarDays size={18} color="#6b7280" />
            <select
              className="filter-select"
              value={filtroTipoUsuario}
              onChange={(e) => setFiltroTipoUsuario(e.target.value)}
            >
              <option value="TODOS">Todos os Tipos de Perfil</option>
              <option value="INTERNO">Equipe (Interno)</option>
              <option value="FORNECEDOR">Fornecedores Externos</option>
              <option value="SISTEMA">Automação (Sistema)</option>
            </select>
          </div>
        </div>

        {/* --- TABELA PRINCIPAL --- */}
        <div className="table-container">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '16px', color: '#64748b', fontWeight: '600', fontSize: '13px', width: '160px' }}>Data / Hora</th>
                <th style={{ padding: '16px', color: '#64748b', fontWeight: '600', fontSize: '13px' }}>Usuário</th>
                <th style={{ padding: '16px', color: '#64748b', fontWeight: '600', fontSize: '13px', width: '140px', textAlign: 'center' }}>Ação</th>
                <th style={{ padding: '16px', color: '#64748b', fontWeight: '600', fontSize: '13px', width: '180px' }}>Local (ID)</th>
                <th style={{ padding: '16px', color: '#64748b', fontWeight: '600', fontSize: '13px' }}>Detalhes do Evento</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>Carregando histórico de auditoria...</td>
                </tr>
              ) : logsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>
                    Nenhum registro encontrado para os filtros atuais.
                  </td>
                </tr>
              ) : (
                logsFiltrados.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9', transition: '0.2s', ':hover': { backgroundColor: '#f8fafc' } }}>
                    
                    {/* DATA / HORA */}
                    <td style={{ padding: '16px', fontSize: '13px', color: '#64748b' }}>
                      {formatarDataHora(log.dataHora)}
                    </td>

                    {/* USUÁRIO E TIPO */}
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>{log.nomeUsuario}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }}>{log.tipoUsuario}</div>
                    </td>

                    {/* BADGE DA AÇÃO */}
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      {renderBadgeAcao(log.acao)}
                    </td>

                    {/* ENTIDADE (LOCAL) */}
                    <td style={{ padding: '16px' }}>
                      {log.entidadeAfetada ? (
                        <>
                          <div style={{ fontWeight: '600', color: '#334155', fontSize: '13px' }}>{log.entidadeAfetada}</div>
                          {log.entidadeId && <div style={{ fontSize: '12px', color: '#64748b' }}>ID: #{log.entidadeId}</div>}
                        </>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>Geral</span>
                      )}
                    </td>

                    {/* DETALHES GERAIS */}
                    <td style={{ padding: '16px', fontSize: '13px', color: '#475569', lineHeight: '1.4' }}>
                      {log.detalhes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
}