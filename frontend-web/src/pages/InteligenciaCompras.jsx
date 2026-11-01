import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Sidebar from '../components/layout/Sidebar';
import {
  Brain,
  Search,
  Filter,
  Settings,
  Truck,
  Sparkles,
  Eye,
  CheckCircle,
  XCircle,
  SlidersHorizontal,
  ShoppingCart,
  RefreshCw,
  AlertTriangle,
  Package,
  TrendingUp,
  CalendarDays,
  Save,
} from 'lucide-react';

const fMoney = (v) => (v != null ? Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-');
const fNum = (v, d = 0) => (v != null ? Number(v).toLocaleString('pt-BR', { maximumFractionDigits: d }) : '-');
const fDate = (v) => {
  if (!v) return '-';
  const [ano, mes, dia] = String(v).split('-');
  return `${dia}/${mes}/${ano}`;
};
const fDateTime = (v) => (v ? new Date(v).toLocaleString('pt-BR') : '-');

const badge = (texto, fundo, cor) => (
  <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', backgroundColor: fundo, color: cor, whiteSpace: 'nowrap' }}>
    {texto}
  </span>
);

const STATUS_ITEM = {
  OK: badge('OK', 'var(--success-soft)', 'var(--success)'),
  SUSPENSO: badge('Suspenso (DNA)', 'var(--danger-soft)', 'var(--danger-text)'),
  SEM_HISTORICO: badge('Sem Histórico', 'var(--bg)', 'var(--text-secondary)'),
  SEM_GIRO: badge('Sem Giro', 'var(--warning-soft)', 'var(--warning-text)'),
  HISTORICO_INSUFICIENTE: badge('Histórico Insuficiente', 'var(--warning-soft)', 'var(--warning-text)'),
};

const STATUS_SUGESTAO = {
  GERADA: badge('Gerada', 'var(--info-soft)', 'var(--primary-hover)'),
  EM_REVISAO: badge('Em Revisão', 'var(--warning-soft)', 'var(--warning-text)'),
  APROVADA: badge('Aprovada', 'var(--success-soft)', 'var(--success)'),
  DESCARTADA: badge('Descartada', 'var(--danger-soft)', 'var(--danger-text)'),
  COTACAO_GERADA: badge('Cotação Gerada', 'var(--purple-soft)', 'var(--purple-text)'),
};

const DECISAO_BADGE = {
  PENDENTE: badge('Pendente', 'var(--bg)', 'var(--text-secondary)'),
  APROVADO: badge('Aprovado', 'var(--success-soft)', 'var(--success)'),
  AJUSTADO: badge('Ajustado', 'var(--info-soft)', 'var(--primary-hover)'),
  RECUSADO: badge('Recusado', 'var(--danger-soft)', 'var(--danger-text)'),
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid var(--border-strong)',
  outline: 'none',
  boxSizing: 'border-box',
  fontSize: '14px',
  backgroundColor: 'var(--surface)',
};

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: '600',
  color: 'var(--text-secondary)',
  marginBottom: '6px',
};

export default function InteligenciaCompras() {
  const navigate = useNavigate();

  const [grupos, setGrupos] = useState([]);
  const [grupoSelecionado, setGrupoSelecionado] = useState('');
  const [sugestoes, setSugestoes] = useState([]);
  const [sugestaoAtiva, setSugestaoAtiva] = useState(null); // { sugestao, itens }
  const [carregandoGrupos, setCarregandoGrupos] = useState(true);
  const [carregandoSugestoes, setCarregandoSugestoes] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [gerandoCotacao, setGerandoCotacao] = useState(false);
  const [salvandoDecisao, setSalvandoDecisao] = useState(false);

  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  const [filtroDecisao, setFiltroDecisao] = useState('TODAS');

  const [modalConfigGrupo, setModalConfigGrupo] = useState(false);
  const [modalFornecedores, setModalFornecedores] = useState(false);

  const [configForm, setConfigForm] = useState({
    dnaGrupoId: '',
    dnaGrupoNome: '',
    intervaloCompraDias: 30,
    diasSeguranca: 7,
    janelaDemandaDias: 90,
    coberturaMaximaDias: '',
    ativo: true,
  });
  const [configsGrupo, setConfigsGrupo] = useState([]);

  const [configFornecedores, setConfigFornecedores] = useState([]);
  const [fornecedoresSistema, setFornecedoresSistema] = useState([]);
  const [fornecedoresDna, setFornecedoresDna] = useState([]);
  const [formFornecedor, setFormFornecedor] = useState({
    fornecedorId: '',
    dnaFornecedorId: '',
    leadTimeManualDias: '',
    pedidoMinimoValor: '',
    observacao: '',
    ativo: true,
  });

  const [detalheProduto, setDetalheProduto] = useState(null);
  const [decisaoForm, setDecisaoForm] = useState({ decisao: 'APROVADO', quantidadeDecidida: '', motivo: '' });

  // ------------------------------------------------------------------
  // Carga inicial
  // ------------------------------------------------------------------
  useEffect(() => {
    carregarGrupos();
    carregarSugestoes();
  }, []);

  const carregarGrupos = async () => {
    setCarregandoGrupos(true);
    try {
      const { data } = await api.get('/api/inteligencia/grupos');
      setGrupos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
      alert(error.response?.data?.message || 'Erro ao carregar os grupos do DNA.');
    } finally {
      setCarregandoGrupos(false);
    }
  };

  const carregarSugestoes = async (grupo) => {
    setCarregandoSugestoes(true);
    try {
      const params = grupo ? { grupo } : {};
      const { data } = await api.get('/api/inteligencia/sugestoes', { params });
      const lista = Array.isArray(data) ? data : [];
      setSugestoes(lista);
      // mantém a sugestão aberta se ainda existir na lista
      setSugestaoAtiva((atual) => {
        if (!atual) return null;
        const aindaExiste = lista.some((s) => s.id === atual.sugestao.id);
        return aindaExiste ? atual : null;
      });
    } catch (error) {
      console.error('Erro ao carregar sugestões:', error);
      alert(error.response?.data?.message || 'Erro ao carregar as sugestões.');
    } finally {
      setCarregandoSugestoes(false);
    }
  };

  const gerarAnalise = async () => {
    if (!grupoSelecionado) {
      alert('Selecione um grupo para gerar a análise.');
      return;
    }
    const grupo = grupos.find((g) => g.codigo === Number(grupoSelecionado));
    const semConfig = grupo && !grupo.configurado;
    if (semConfig) {
      alert('Este grupo ainda não tem configuração de compra. Configure-o antes de gerar a análise.');
      return;
    }
    if (!window.confirm(`Gerar nova análise de compra para "${grupo?.nome}"? A consulta ao DNA pode demorar alguns segundos.`)) return;

    setGerando(true);
    try {
      const { data } = await api.post('/api/inteligencia/sugestoes/gerar', { dnaGrupoId: Number(grupoSelecionado) });
      await carregarSugestoes();
      if (data?.id) await abrirSugestao(data.id);
    } catch (error) {
      alert(error.response?.data?.message || 'Erro ao gerar a análise.');
    } finally {
      setGerando(false);
    }
  };

  const abrirSugestao = async (id) => {
    try {
      const { data } = await api.get(`/api/inteligencia/sugestoes/${id}`);
      setSugestaoAtiva(data);
      setBusca('');
      setFiltroStatus('TODOS');
      setFiltroDecisao('TODAS');
    } catch (error) {
      alert(error.response?.data?.message || 'Erro ao abrir a sugestão.');
    }
  };

  const abrirDetalheProduto = async (itemId) => {
    if (!sugestaoAtiva) return;
    try {
      const { data } = await api.get(`/api/inteligencia/sugestoes/${sugestaoAtiva.sugestao.id}/itens/${itemId}/detalhe`);
      setDetalheProduto(data);
      setDecisaoForm({
        decisao: 'APROVADO',
        quantidadeDecidida: data.snapshot?.quantidadeSugerida != null ? String(data.snapshot.quantidadeSugerida) : '',
        motivo: '',
      });
    } catch (error) {
      alert(error.response?.data?.message || 'Erro ao carregar o detalhe do produto.');
    }
  };

  const salvarDecisao = async () => {
    if (!detalheProduto || !sugestaoAtiva) return;
    if (decisaoForm.decisao === 'AJUSTADO' && (decisaoForm.quantidadeDecidida === '' || Number(decisaoForm.quantidadeDecidida) < 0)) {
      alert('Informe a quantidade aprovada (ajuste).');
      return;
    }
    setSalvandoDecisao(true);
    try {
      const body = {
        decisao: decisaoForm.decisao,
        quantidadeDecidida: decisaoForm.quantidadeDecidida === '' ? null : Number(decisaoForm.quantidadeDecidida),
        motivo: decisaoForm.motivo || null,
        usuarioId: null,
      };
      await api.put(
        `/api/inteligencia/sugestoes/${sugestaoAtiva.sugestao.id}/itens/${detalheProduto.snapshot.id}/decisao`,
        body,
      );
      await abrirSugestao(sugestaoAtiva.sugestao.id);
      await carregarSugestoes();
      await abrirDetalheProduto(detalheProduto.snapshot.id);
    } catch (error) {
      alert(error.response?.data?.message || 'Erro ao registrar a decisão.');
    } finally {
      setSalvandoDecisao(false);
    }
  };

  const gerarCotacao = async () => {
    if (!sugestaoAtiva) return;
    if (!window.confirm('Gerar cotação com todos os itens aprovados desta sugestão?')) return;
    setGerandoCotacao(true);
    try {
      const { data } = await api.post(`/api/inteligencia/sugestoes/${sugestaoAtiva.sugestao.id}/gerar-cotacao`, {
        nomeUsuario: localStorage.getItem('nomeUsuario') || null,
        setor: null,
      });
      await carregarSugestoes();
      if (data?.cotacaoId) navigate(`/cotacao/${data.cotacaoId}`);
    } catch (error) {
      alert(error.response?.data?.message || 'Erro ao gerar a cotação.');
    } finally {
      setGerandoCotacao(false);
    }
  };

  // ------------------------------------------------------------------
  // Configuração de grupos
  // ------------------------------------------------------------------
  const abrirConfigGrupo = async () => {
    setModalConfigGrupo(true);
    try {
      const { data } = await api.get('/api/inteligencia/config/grupos');
      setConfigsGrupo(Array.isArray(data) ? data : []);
      aplicarConfig(data, Number(grupoSelecionado));
    } catch (error) {
      alert(error.response?.data?.message || 'Erro ao carregar as configurações.');
    }
  };

  const aplicarConfig = (configs, dnaGrupoId) => {
    const cfg = (Array.isArray(configs) ? configs : []).find((c) => c.dnaGrupoId === dnaGrupoId);
    if (cfg) {
      setConfigForm({
        dnaGrupoId: cfg.dnaGrupoId,
        dnaGrupoNome: cfg.dnaGrupoNome || '',
        intervaloCompraDias: cfg.intervaloCompraDias ?? 30,
        diasSeguranca: cfg.diasSeguranca ?? 7,
        janelaDemandaDias: cfg.janelaDemandaDias ?? 90,
        coberturaMaximaDias: cfg.coberturaMaximaDias ?? '',
        ativo: cfg.ativo !== false,
      });
    } else if (dnaGrupoId) {
      const grupo = grupos.find((g) => g.codigo === dnaGrupoId);
      setConfigForm({
        dnaGrupoId,
        dnaGrupoNome: grupo?.nome || '',
        intervaloCompraDias: 30,
        diasSeguranca: 7,
        janelaDemandaDias: 90,
        coberturaMaximaDias: '',
        ativo: true,
      });
    } else {
      setConfigForm({ dnaGrupoId: '', dnaGrupoNome: '', intervaloCompraDias: 30, diasSeguranca: 7, janelaDemandaDias: 90, coberturaMaximaDias: '', ativo: true });
    }
  };

  const salvarConfigGrupo = async () => {
    if (!configForm.dnaGrupoId) {
      alert('Selecione um grupo.');
      return;
    }
    try {
      await api.post('/api/inteligencia/config/grupos', {
        dnaGrupoId: Number(configForm.dnaGrupoId),
        dnaGrupoNome: configForm.dnaGrupoNome || grupos.find((g) => g.codigo === Number(configForm.dnaGrupoId))?.nome || null,
        intervaloCompraDias: Number(configForm.intervaloCompraDias),
        diasSeguranca: Number(configForm.diasSeguranca || 0),
        janelaDemandaDias: Number(configForm.janelaDemandaDias || 90),
        coberturaMaximaDias: configForm.coberturaMaximaDias === '' ? null : Number(configForm.coberturaMaximaDias),
        ativo: configForm.ativo,
      });
      alert('Configuração salva.');
      await carregarGrupos();
      setModalConfigGrupo(false);
    } catch (error) {
      alert(error.response?.data?.message || 'Erro ao salvar a configuração.');
    }
  };

  // ------------------------------------------------------------------
  // Configuração de fornecedores / lead time
  // ------------------------------------------------------------------
  const abrirConfigFornecedores = async () => {
    setModalFornecedores(true);
    try {
      const [cfg, sistema, dna] = await Promise.all([
        api.get('/api/inteligencia/config/fornecedores'),
        api.get('/api/inteligencia/fornecedores'),
        api.get('/api/inteligencia/fornecedores-dna'),
      ]);
      setConfigFornecedores(Array.isArray(cfg.data) ? cfg.data : []);
      setFornecedoresSistema(Array.isArray(sistema.data) ? sistema.data : []);
      setFornecedoresDna(Array.isArray(dna.data) ? dna.data : []);
    } catch (error) {
      alert(error.response?.data?.message || 'Erro ao carregar os fornecedores.');
    }
  };

  const editarConfigFornecedor = (cfg) => {
    setFormFornecedor({
      fornecedorId: cfg.fornecedorId ?? '',
      dnaFornecedorId: cfg.dnaFornecedorId ?? '',
      leadTimeManualDias: cfg.leadTimeManualDias ?? '',
      pedidoMinimoValor: cfg.pedidoMinimoValor ?? '',
      observacao: cfg.observacao || '',
      ativo: cfg.ativo !== false,
    });
  };

  const salvarConfigFornecedor = async () => {
    if (!formFornecedor.fornecedorId && !formFornecedor.dnaFornecedorId) {
      alert('Selecione um fornecedor do sistema.');
      return;
    }
    try {
      const fornecedor = fornecedoresSistema.find((f) => String(f.id) === String(formFornecedor.fornecedorId));
      await api.post('/api/inteligencia/config/fornecedores', {
        fornecedorId: formFornecedor.fornecedorId !== '' ? Number(formFornecedor.fornecedorId) : null,
        dnaFornecedorId: formFornecedor.dnaFornecedorId !== '' ? Number(formFornecedor.dnaFornecedorId) : null,
        fornecedorNome: fornecedor ? fornecedor.nome || fornecedor.empresa : null,
        leadTimeManualDias: formFornecedor.leadTimeManualDias === '' ? null : Number(formFornecedor.leadTimeManualDias),
        pedidoMinimoValor: formFornecedor.pedidoMinimoValor === '' ? null : Number(formFornecedor.pedidoMinimoValor),
        observacao: formFornecedor.observacao || null,
        ativo: formFornecedor.ativo,
      });
      alert('Configuração de fornecedor salva.');
      await abrirConfigFornecedores();
      setFormFornecedor({ fornecedorId: '', dnaFornecedorId: '', leadTimeManualDias: '', pedidoMinimoValor: '', observacao: '', ativo: true });
    } catch (error) {
      alert(error.response?.data?.message || 'Erro ao salvar o fornecedor.');
    }
  };

  // ------------------------------------------------------------------
  // Filtros da tabela de itens
  // ------------------------------------------------------------------
  const itensFiltrados = (sugestaoAtiva?.itens || []).filter((item) => {
    const texto = busca.toLowerCase();
    const matchBusca =
      !texto ||
      (item.produtoNome || '').toLowerCase().includes(texto) ||
      (item.ean || '').toLowerCase().includes(texto) ||
      String(item.dnaProdutoId || '').includes(texto);
    const status = item.status || 'OK';
    const matchStatus = filtroStatus === 'TODOS' || status === filtroStatus;
    const matchDecisao = filtroDecisao === 'TODAS' || (item.decisao || 'PENDENTE') === filtroDecisao;
    return matchBusca && matchStatus && matchDecisao;
  });

  const totais = sugestoes.reduce(
    (acc, s) => ({
      pendentes: acc.pendentes + (s.pendentes || 0),
      aprovados: acc.aprovados + (s.aprovados || 0),
      cotacoes: acc.cotacoes + (s.status === 'COTACAO_GERADA' ? 1 : 0),
    }),
    { pendentes: 0, aprovados: 0, cotacoes: 0 },
  );

  const sugestaoPodeDecidir = sugestaoAtiva && sugestaoAtiva.sugestao.status !== 'COTACAO_GERADA';
  const aprovadosAtivos = (sugestaoAtiva?.itens || []).filter(
    (i) => (i.decisao === 'APROVADO' || i.decisao === 'AJUSTADO') && Number(i.quantidadeAprovada) > 0,
  ).length;

  const thStyle = { padding: '14px 12px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '12px', textAlign: 'left', whiteSpace: 'nowrap' };
  const tdStyle = { padding: '12px', fontSize: '13px', color: 'var(--text-secondary)', verticalAlign: 'middle' };

  return (
    <div className="layout">
      <Sidebar />

      <main className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1 style={{ fontSize: '24px', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Brain size={28} color="var(--primary-hover)" /> Inteligência de Compras
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>
              Análise de demanda, estoque e histórico de compras para gerar sugestões inteligentes.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={abrirConfigGrupo}
              style={{ padding: '10px 16px', backgroundColor: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-strong)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Settings size={18} /> Config. Grupos
            </button>
            <button
              onClick={abrirConfigFornecedores}
              style={{ padding: '10px 16px', backgroundColor: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-strong)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Truck size={18} /> Fornecedores / Lead Time
            </button>
          </div>
        </header>

        {/* Gerador de análise */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 320px' }}>
            <label style={labelStyle}>Grupo de produtos (DNA)</label>
            <select
              className="filter-select"
              value={grupoSelecionado}
              onChange={(e) => setGrupoSelecionado(e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
              disabled={carregandoGrupos}
            >
              <option value="">{carregandoGrupos ? 'Carregando grupos...' : 'Selecione um grupo'}</option>
              {grupos.map((g) => (
                <option key={g.codigo} value={g.codigo}>
                  {g.nome} {g.configurado ? '✓' : '(sem configuração)'}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={gerarAnalise}
            disabled={gerando || !grupoSelecionado}
            style={{
              padding: '11px 22px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px',
              cursor: gerando || !grupoSelecionado ? 'not-allowed' : 'pointer', fontWeight: '700',
              display: 'flex', alignItems: 'center', gap: '8px', opacity: gerando || !grupoSelecionado ? 0.6 : 1,
            }}
          >
            {gerando ? <RefreshCw size={18} className="spin" /> : <Sparkles size={18} />}
            {gerando ? 'Consultando DNA...' : 'Gerar Análise'}
          </button>
          {sugestoes.length > 0 && (
            <button
              onClick={() => carregarSugestoes()}
              style={{ padding: '11px 16px', backgroundColor: 'var(--surface-muted)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <RefreshCw size={16} /> Atualizar
            </button>
          )}
        </div>

        {/* Estatísticas */}
        <div className="stats-grid" style={{ marginBottom: '24px' }}>
          <div className="stat-card">
            <div className="stat-value">{sugestoes.length}</div>
            <div className="stat-label">Análises Geradas</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={24} /> {totais.pendentes}
            </div>
            <div className="stat-label">Itens Pendentes</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={24} /> {totais.aprovados}
            </div>
            <div className="stat-label">Itens Aprovados</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--purple)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingCart size={24} /> {totais.cotacoes}
            </div>
            <div className="stat-label">Cotações Geradas</div>
          </div>
        </div>

        {/* Lista de sugestões */}
        <div className="table-container" style={{ marginBottom: '24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
            <thead style={{ backgroundColor: 'var(--surface-muted)', borderBottom: '1px solid var(--border)' }}>
              <tr>
                <th style={thStyle}>Grupo</th>
                <th style={thStyle}>Gerada em</th>
                <th style={thStyle}>Período analisado</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Status</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Itens</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Pendentes</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Aprovados</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Recusados</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {carregandoSugestoes ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Carregando sugestões...</td></tr>
              ) : sugestoes.length === 0 ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Nenhuma análise gerada ainda. Selecione um grupo e clique em "Gerar Análise".</td></tr>
              ) : (
                sugestoes.map((s) => (
                  <tr
                    key={s.id}
                    style={{ borderBottom: '1px solid var(--surface-muted)', backgroundColor: sugestaoAtiva?.sugestao.id === s.id ? 'var(--primary-soft)' : 'transparent', cursor: 'pointer' }}
                    onClick={() => abrirSugestao(s.id)}
                  >
                    <td style={{ ...tdStyle, fontWeight: '600' }}>{s.dnaGrupoNome || `Grupo ${s.dnaGrupoId}`}</td>
                    <td style={tdStyle}>{fDateTime(s.geradaEm)}</td>
                    <td style={tdStyle}>{fDate(s.periodoInicio)} a {fDate(s.periodoFim)}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{STATUS_SUGESTAO[s.status] || s.status}</td>
                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: '700' }}>{s.totalItens}</td>
                    <td style={{ ...tdStyle, textAlign: 'center', color: 'var(--warning-text)', fontWeight: '700' }}>{s.pendentes}</td>
                    <td style={{ ...tdStyle, textAlign: 'center', color: 'var(--success)', fontWeight: '700' }}>{s.aprovados}</td>
                    <td style={{ ...tdStyle, textAlign: 'center', color: 'var(--danger-text)', fontWeight: '700' }}>{s.recusados}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); abrirSugestao(s.id); }}
                        title="Visualizar itens"
                        style={{ background: 'var(--primary-soft)', color: 'var(--info)', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Itens da sugestão ativa */}
        {sugestaoAtiva && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Package size={20} color="var(--primary-hover)" />
                  {sugestaoAtiva.sugestao.dnaGrupoNome} — sugestão de compra
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0 0' }}>
                  Período {fDate(sugestaoAtiva.sugestao.periodoInicio)} a {fDate(sugestaoAtiva.sugestao.periodoFim)} ·{' '}
                  {STATUS_SUGESTAO[sugestaoAtiva.sugestao.status]}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setSugestaoAtiva(null)}
                  style={{ padding: '10px 16px', backgroundColor: 'var(--surface-muted)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                >
                  Fechar
                </button>
                <button
                  onClick={gerarCotacao}
                  disabled={gerandoCotacao || aprovadosAtivos === 0 || sugestaoAtiva.sugestao.status === 'COTACAO_GERADA'}
                  style={{
                    padding: '10px 18px', backgroundColor: 'var(--success)', color: 'white', border: 'none', borderRadius: '8px',
                    cursor: gerandoCotacao || aprovadosAtivos === 0 || sugestaoAtiva.sugestao.status === 'COTACAO_GERADA' ? 'not-allowed' : 'pointer',
                    fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px',
                    opacity: gerandoCotacao || aprovadosAtivos === 0 || sugestaoAtiva.sugestao.status === 'COTACAO_GERADA' ? 0.6 : 1,
                  }}
                >
                  <ShoppingCart size={18} />
                  {gerandoCotacao ? 'Gerando...' : `Gerar Cotação dos Aprovados (${aprovadosAtivos})`}
                </button>
              </div>
            </div>

            <div className="filters-bar" style={{ marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center' }}>
              <div className="search-input-container" style={{ margin: 0, flex: '1 1 260px' }}>
                <Search size={18} color="var(--text-subtle)" />
                <input
                  type="text"
                  placeholder="Buscar produto, EAN ou código..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  style={{ border: 'none', outline: 'none', width: '100%' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Filter size={18} color="var(--text-muted)" />
                <select className="filter-select" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer', backgroundColor: 'transparent' }}>
                  <option value="TODOS">Todos os status</option>
                  <option value="OK">OK</option>
                  <option value="SUSPENSO">Suspenso (DNA)</option>
                  <option value="SEM_HISTORICO">Sem Histórico</option>
                  <option value="SEM_GIRO">Sem Giro</option>
                  <option value="HISTORICO_INSUFICIENTE">Histórico Insuficiente</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <SlidersHorizontal size={18} color="var(--text-muted)" />
                <select className="filter-select" value={filtroDecisao} onChange={(e) => setFiltroDecisao(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer', backgroundColor: 'transparent' }}>
                  <option value="TODAS">Todas decisões</option>
                  <option value="PENDENTE">Pendentes</option>
                  <option value="APROVADO">Aprovados</option>
                  <option value="AJUSTADO">Ajustados</option>
                  <option value="RECUSADO">Recusados</option>
                </select>
              </div>
              {(busca || filtroStatus !== 'TODOS' || filtroDecisao !== 'TODAS') && (
                <button
                  onClick={() => { setBusca(''); setFiltroStatus('TODOS'); setFiltroDecisao('TODAS'); }}
                  style={{ padding: '8px 16px', fontSize: '12px', color: 'var(--danger)', backgroundColor: 'var(--danger-soft)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Limpar Filtros
                </button>
              )}
            </div>

            <div className="table-container">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1300px' }}>
                <thead style={{ backgroundColor: 'var(--surface-muted)', borderBottom: '1px solid var(--border)' }}>
                  <tr>
                    <th style={thStyle}>Produto</th>
                    <th style={thStyle}>EAN</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Estoque</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Vendas 30d</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>VMD 30d</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Demanda/dia</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Cobertura</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Estoque alvo</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Qtd sugerida</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Qtd aprovada</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Status</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Decisão</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {itensFiltrados.length === 0 ? (
                    <tr><td colSpan="13" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Nenhum item encontrado com os filtros atuais.</td></tr>
                  ) : (
                    itensFiltrados.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--surface-muted)' }}>
                        <td style={{ ...tdStyle, fontWeight: '600', maxWidth: '320px' }}>
                          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.produtoNome}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>DNA #{item.dnaProdutoId}</div>
                        </td>
                        <td style={{ ...tdStyle, fontSize: '12px', color: 'var(--text-muted)' }}>{item.ean || '-'}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>{fNum(item.estoqueAtual)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>{fNum(item.vendas30d)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>{fNum(item.vmd30d, 2)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '700' }}>{fNum(item.demandaDiariaPrevista, 2)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>{fNum(item.coberturaAtualDias, 1)}d</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>{fNum(item.estoqueAlvo)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '700', color: 'var(--primary-hover)' }}>{fNum(item.quantidadeSugerida)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '700', color: 'var(--success)' }}>{item.quantidadeAprovada != null ? fNum(item.quantidadeAprovada) : '-'}</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>{STATUS_ITEM[item.status] || item.status || '-'}</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>{DECISAO_BADGE[item.decisao] || item.decisao}</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <button
                            onClick={() => abrirDetalheProduto(item.id)}
                            title="Detalhar e decidir"
                            style={{ background: 'var(--primary-soft)', color: 'var(--info)', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}
                          >
                            <Eye size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modal: configuração de grupos */}
      {modalConfigGrupo && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'var(--surface)', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={20} color="var(--primary-hover)" /> Configuração de Grupos de Compra
            </h3>

            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Grupo</label>
              <select
                className="filter-select"
                value={configForm.dnaGrupoId}
                onChange={(e) => aplicarConfig(configsGrupo, Number(e.target.value))}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="">Selecione um grupo</option>
                {grupos.map((g) => (
                  <option key={g.codigo} value={g.codigo}>{g.nome}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={labelStyle}>Intervalo de compra (dias)</label>
                <input type="number" min="1" value={configForm.intervaloCompraDias} onChange={(e) => setConfigForm({ ...configForm, intervaloCompraDias: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Dias de segurança</label>
                <input type="number" min="0" value={configForm.diasSeguranca} onChange={(e) => setConfigForm({ ...configForm, diasSeguranca: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Janela de demanda (dias)</label>
                <select value={configForm.janelaDemandaDias} onChange={(e) => setConfigForm({ ...configForm, janelaDemandaDias: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="30">30 dias</option>
                  <option value="60">60 dias</option>
                  <option value="90">90 dias</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Cobertura máxima (dias, vazio = livre)</label>
                <input type="number" min="1" value={configForm.coberturaMaximaDias} onChange={(e) => setConfigForm({ ...configForm, coberturaMaximaDias: e.target.value })} style={inputStyle} />
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '18px', cursor: 'pointer' }}>
              <input type="checkbox" checked={configForm.ativo} onChange={(e) => setConfigForm({ ...configForm, ativo: e.target.checked })} />
              Grupo ativo para análises
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setModalConfigGrupo(false)} style={{ padding: '10px 16px', backgroundColor: 'var(--surface-muted)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                Cancelar
              </button>
              <button onClick={salvarConfigGrupo} style={{ padding: '10px 18px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Save size={16} /> Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: fornecedores / lead time */}
      {modalFornecedores && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'var(--surface)', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Truck size={20} color="var(--primary-hover)" /> Fornecedores — Lead Time e Pedido Mínimo
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={labelStyle}>Fornecedor (sistema)</label>
                <select
                  value={formFornecedor.fornecedorId}
                  onChange={(e) => setFormFornecedor({ ...formFornecedor, fornecedorId: e.target.value })}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="">Selecione...</option>
                  {fornecedoresSistema.map((f) => (
                    <option key={f.id} value={f.id}>{f.nome || f.empresa} (#{f.id})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Código fornecedor no DNA (opcional)</label>
                <select
                  value={formFornecedor.dnaFornecedorId}
                  onChange={(e) => setFormFornecedor({ ...formFornecedor, dnaFornecedorId: e.target.value })}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="">Não vinculado</option>
                  {fornecedoresDna.filter((f) => f.inativo !== 'S').map((f) => (
                    <option key={f.codigo} value={f.codigo}>{f.razao || f.fantasia || `DNA #${f.codigo}`}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Lead time manual (dias)</label>
                <input type="number" min="0" value={formFornecedor.leadTimeManualDias} onChange={(e) => setFormFornecedor({ ...formFornecedor, leadTimeManualDias: e.target.value })} style={inputStyle} placeholder="ex.: 7" />
              </div>
              <div>
                <label style={labelStyle}>Pedido mínimo (R$)</label>
                <input type="number" min="0" step="0.01" value={formFornecedor.pedidoMinimoValor} onChange={(e) => setFormFornecedor({ ...formFornecedor, pedidoMinimoValor: e.target.value })} style={inputStyle} placeholder="ex.: 500,00" />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Observação</label>
              <input type="text" value={formFornecedor.observacao} onChange={(e) => setFormFornecedor({ ...formFornecedor, observacao: e.target.value })} style={inputStyle} placeholder="ex.: entrega toda quinta" />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '18px' }}>
              <button onClick={() => setFormFornecedor({ fornecedorId: '', dnaFornecedorId: '', leadTimeManualDias: '', pedidoMinimoValor: '', observacao: '', ativo: true })} style={{ padding: '10px 16px', backgroundColor: 'var(--surface-muted)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                Limpar
              </button>
              <button onClick={salvarConfigFornecedor} style={{ padding: '10px 18px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Save size={16} /> Salvar Fornecedor
              </button>
            </div>

            <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)' }}>Configurações existentes</h4>
            {configFornecedores.length === 0 ? (
              <p style={{ color: 'var(--text-subtle)', fontSize: '13px' }}>Nenhum fornecedor configurado ainda.</p>
            ) : (
              <div className="table-container">
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                  <thead style={{ backgroundColor: 'var(--surface-muted)', borderBottom: '1px solid var(--border)' }}>
                    <tr>
                      <th style={thStyle}>Fornecedor</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Lead time</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Pedido mínimo</th>
                      <th style={thStyle}>Observação</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {configFornecedores.map((cfg) => (
                      <tr key={cfg.id} style={{ borderBottom: '1px solid var(--surface-muted)' }}>
                        <td style={tdStyle}>{cfg.fornecedorNome || (cfg.fornecedorId ? `Fornecedor #${cfg.fornecedorId}` : `DNA #${cfg.dnaFornecedorId}`)}</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>{cfg.leadTimeManualDias != null ? `${cfg.leadTimeManualDias}d` : '-'}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>{fMoney(cfg.pedidoMinimoValor)}</td>
                        <td style={{ ...tdStyle, fontSize: '12px', color: 'var(--text-muted)' }}>{cfg.observacao || '-'}</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <button onClick={() => editarConfigFornecedor(cfg)} title="Editar" style={{ background: 'var(--primary-soft)', color: 'var(--info)', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}>
                            <Settings size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '18px' }}>
              <button onClick={() => setModalFornecedores(false)} style={{ padding: '10px 16px', backgroundColor: 'var(--surface-muted)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: detalhe do produto + decisão */}
      {detalheProduto && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'var(--surface)', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '860px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0' }}>{detalheProduto.snapshot.produtoNome}</h3>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  DNA #{detalheProduto.dnaProdutoId} {detalheProduto.snapshot.ean ? `· EAN ${detalheProduto.snapshot.ean}` : ''}{' '}
                  {detalheProduto.curvaAbc ? `· Curva ${detalheProduto.curvaAbc}` : ''}
                </div>
                <div style={{ marginTop: '6px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {STATUS_ITEM[detalheProduto.snapshot.status] || detalheProduto.snapshot.status}
                  {DECISAO_BADGE[detalheProduto.snapshot.decisao] || detalheProduto.snapshot.decisao}
                  {detalheProduto.suspenderCompra === 'S' && badge('SUSPENDERCOMPRA = S', 'var(--danger-soft)', 'var(--danger-text)')}
                </div>
              </div>
              <button onClick={() => setDetalheProduto(null)} style={{ background: 'var(--bg)', color: 'var(--text-secondary)', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                Fechar
              </button>
            </div>

            {(detalheProduto.snapshot.alertas?.length > 0) && (
              <div style={{ background: 'var(--warning-soft)', border: '1px solid var(--warning-border)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: 'var(--warning-text)' }}>
                <strong>Alertas:</strong> {detalheProduto.snapshot.alertas.join(' · ')}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '16px' }}>
              {/* ESTOQUE */}
              <div style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '14px' }}>
                <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--primary-hover)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Package size={16} /> ESTOQUE
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.9' }}>
                  <div>Atual: <strong>{fNum(detalheProduto.snapshot.estoqueAtual)}</strong></div>
                  <div>Cobertura: <strong>{fNum(detalheProduto.snapshot.coberturaAtualDias, 1)} dias</strong></div>
                  <div>Última venda: <strong>{fDate(detalheProduto.snapshot.dataUltimaVenda)}</strong></div>
                </div>
              </div>

              {/* VENDAS */}
              <div style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '14px' }}>
                <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--success)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TrendingUp size={16} /> VENDAS
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.9' }}>
                  <div>7d: <strong>{fNum(detalheProduto.snapshot.vendas7d)}</strong> (VMD {fNum(detalheProduto.snapshot.vmd7d, 2)})</div>
                  <div>30d: <strong>{fNum(detalheProduto.snapshot.vendas30d)}</strong> (VMD {fNum(detalheProduto.snapshot.vmd30d, 2)})</div>
                  <div>60d: <strong>{fNum(detalheProduto.snapshot.vendas60d)}</strong> (VMD {fNum(detalheProduto.snapshot.vmd60d, 2)})</div>
                  <div>90d: <strong>{fNum(detalheProduto.snapshot.vendas90d)}</strong> (VMD {fNum(detalheProduto.snapshot.vmd90d, 2)})</div>
                  <div>Tendência: <strong>{fNum(detalheProduto.snapshot.indiceTendencia, 2)}</strong></div>
                </div>
              </div>

              {/* PREÇOS */}
              <div style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '14px' }}>
                <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--warning-text)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} /> PREÇOS
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.9' }}>
                  <div>Custo atual: <strong>{fMoney(detalheProduto.snapshot.custoAtual)}</strong></div>
                  <div>Custo médio: <strong>{fMoney(detalheProduto.snapshot.custoMedio)}</strong></div>
                  <div>Venda: <strong>{fMoney(detalheProduto.snapshot.precoVenda)}</strong></div>
                  <div>Promoção: <strong>{fMoney(detalheProduto.precoPromocao)}</strong></div>
                  <div>Margem: <strong>{detalheProduto.margemLucro != null ? `${fNum(detalheProduto.margemLucro, 1)}%` : '-'}</strong></div>
                </div>
              </div>

              {/* PLANEJAMENTO */}
              <div style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '14px' }}>
                <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--purple)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CalendarDays size={16} /> PLANEJAMENTO
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.9' }}>
                  <div>Demanda/dia prevista: <strong>{fNum(detalheProduto.snapshot.demandaDiariaPrevista, 2)}</strong></div>
                  <div>Ciclo de compra: <strong>{fNum(detalheProduto.snapshot.cicloCompraDias)} dias</strong></div>
                  <div>Lead time: <strong>{fNum(detalheProduto.snapshot.leadTimeDias)} dias</strong></div>
                  <div>Dias de segurança: <strong>{fNum(detalheProduto.snapshot.diasSeguranca)}</strong></div>
                  <div>Estoque alvo: <strong>{fNum(detalheProduto.snapshot.estoqueAlvo)}</strong></div>
                  <div style={{ color: 'var(--primary-hover)', fontWeight: '700' }}>Qtd sugerida: {fNum(detalheProduto.snapshot.quantidadeSugerida)}</div>
                </div>
              </div>
            </div>

            {/* COMPRAS */}
            <div style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
              <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShoppingCart size={16} /> COMPRAS (últimas entradas — 12 meses)
              </div>
              {detalheProduto.ultimasCompras?.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '520px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <th style={{ ...thStyle, fontSize: '11px' }}>NF</th>
                        <th style={{ ...thStyle, fontSize: '11px' }}>Entrada</th>
                        <th style={{ ...thStyle, fontSize: '11px', textAlign: 'right' }}>Qtd</th>
                        <th style={{ ...thStyle, fontSize: '11px', textAlign: 'right' }}>Unitário</th>
                        <th style={{ ...thStyle, fontSize: '11px', textAlign: 'right' }}>Total</th>
                        <th style={{ ...thStyle, fontSize: '11px', textAlign: 'center' }}>Fornecedor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalheProduto.ultimasCompras.map((c, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--surface-muted)' }}>
                          <td style={{ ...tdStyle, fontSize: '12px' }}>{c.nrNota || '-'}</td>
                          <td style={{ ...tdStyle, fontSize: '12px' }}>{fDate(c.dtEntrada)}</td>
                          <td style={{ ...tdStyle, textAlign: 'right', fontSize: '12px' }}>{fNum(c.quantidade)}</td>
                          <td style={{ ...tdStyle, textAlign: 'right', fontSize: '12px' }}>{fMoney(c.vrUnitario)}</td>
                          <td style={{ ...tdStyle, textAlign: 'right', fontSize: '12px', fontWeight: '600' }}>{fMoney(c.valorTotal)}</td>
                          <td style={{ ...tdStyle, textAlign: 'center', fontSize: '12px' }}>{c.codFornecedor ? `#${c.codFornecedor}` : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ fontSize: '13px', color: 'var(--text-subtle)', margin: 0 }}>Sem compras registradas nos últimos 12 meses.</p>
              )}
              {detalheProduto.snapshot.dataUltimaCompra && (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '10px 0 0 0' }}>
                  Última compra: {fDate(detalheProduto.snapshot.dataUltimaCompra)} ·{' '}
                  {fNum(detalheProduto.snapshot.quantidadeUltimaCompra)} un
                </p>
              )}
            </div>

            {/* Justificativa do motor */}
            {detalheProduto.snapshot.justificativaMotor && (
              <div style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <strong>Justificativa do motor:</strong> {detalheProduto.snapshot.justificativaMotor}
              </div>
            )}

            {/* Decisão */}
            {sugestaoPodeDecidir ? (
              <div style={{ border: '1px solid var(--border-strong)', borderRadius: '10px', padding: '16px', background: 'var(--surface-muted)' }}>
                <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '12px', color: 'var(--text)' }}>Decisão de compra</div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  {['APROVADO', 'AJUSTADO', 'RECUSADO'].map((d) => {
                    const ativo = decisaoForm.decisao === d;
                    const cores = { APROVADO: 'var(--success)', AJUSTADO: 'var(--primary)', RECUSADO: 'var(--danger)' };
                    return (
                      <button
                        key={d}
                        onClick={() => setDecisaoForm({ ...decisaoForm, decisao: d })}
                        style={{
                          padding: '9px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px',
                          backgroundColor: ativo ? cores[d] : 'var(--surface)',
                          color: ativo ? 'white' : cores[d],
                          border: `1.5px solid ${cores[d]}`,
                        }}
                      >
                        {d === 'APROVADO' ? 'Aprovar sugerida' : d === 'AJUSTADO' ? 'Ajustar quantidade' : 'Recusar'}
                      </button>
                    );
                  })}
                </div>

                {decisaoForm.decisao === 'AJUSTADO' && (
                  <div style={{ marginBottom: '12px', maxWidth: '220px' }}>
                    <label style={labelStyle}>Quantidade aprovada</label>
                    <input
                      type="number"
                      min="0"
                      value={decisaoForm.quantidadeDecidida}
                      onChange={(e) => setDecisaoForm({ ...decisaoForm, quantidadeDecidida: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                )}

                {decisaoForm.decisao === 'RECUSADO' && (
                  <div style={{ marginBottom: '12px' }}>
                    <label style={labelStyle}>Motivo da recusa (opcional)</label>
                    <input
                      type="text"
                      value={decisaoForm.motivo}
                      onChange={(e) => setDecisaoForm({ ...decisaoForm, motivo: e.target.value })}
                      style={inputStyle}
                      placeholder="ex.: sem verba este mês"
                    />
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={salvarDecisao}
                    disabled={salvandoDecisao}
                    style={{
                      padding: '10px 20px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px',
                      cursor: salvandoDecisao ? 'not-allowed' : 'pointer', fontWeight: '700',
                      display: 'flex', alignItems: 'center', gap: '8px', opacity: salvandoDecisao ? 0.6 : 1,
                    }}
                  >
                    <CheckCircle size={16} /> {salvandoDecisao ? 'Salvando...' : 'Registrar Decisão'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ background: 'var(--surface-muted)', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <XCircle size={16} /> Cotação já gerada para esta sugestão — decisões encerradas.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
