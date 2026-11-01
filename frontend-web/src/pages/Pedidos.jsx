import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Sidebar from '../components/layout/Sidebar'
import DevolucaoModal from '../components/DevolucaoModal'
import ModalPedidoManual from '../components/pedidos/modais/ModalPedidoManual' 
import { Eye, Search, Filter, CheckCircle, RotateCcw, Trash2, Loader2, ArrowUpDown, Calendar, MessageCircle, PackagePlus, AlertTriangle, XCircle, X, Tag, ClipboardCheck } from 'lucide-react'

export default function Pedidos() {
  const isConferente = localStorage.getItem('tipoUsuario') === 'CONFERENTE'
  const [pedidos, setPedidos] = useState([])
  const [pedidosCache, setPedidosCache] = useState({})
  const [loading, setLoading] = useState(true)
  
  const [modalDevolucaoAberto, setModalDevolucaoAberto] = useState(false)
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const [pedidosSelecionados, setPedidosSelecionados] = useState([])
  
  const [abaAtiva, setAbaAtiva] = useState(isConferente ? 'AGUARDANDO_ENTREGA' : 'TRATAMENTO')
  const [busca, setBusca] = useState('')
  const [buscaGeral, setBuscaGeral] = useState('')
  const [pedidosAtivos, setPedidosAtivos] = useState(null)
  const [carregandoBusca, setCarregandoBusca] = useState(false)
  const [filtroStatus, setFiltroStatus] = useState('TODOS')
  const [ordenacao, setOrdenacao] = useState('RECENTES')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  const [setorAtivo, setSetorAtivo] = useState('TODOS')
  const [periodoConferente, setPeriodoConferente] = useState('TODOS')

  const [resumo, setResumo] = useState({ total: 0, emTratamento: 0, aguardandoEntrega: 0, aguardandoConfirmacao: 0, entregues: 0, devolucoes: 0, historico: 0 })
  const navigate = useNavigate()

  const [isModalManualOpen, setIsModalManualOpen] = useState(false)

  const [modalFalhaAberto, setModalFalhaAberto] = useState(false)
  const [pedidoFalha, setPedidoFalha] = useState(null)
  const [motivoFalha, setMotivoFalha] = useState('')
  const [acaoDestino, setAcaoDestino] = useState('ORIGINAL')
  const [cotacoesAtivas, setCotacoesAtivas] = useState([])
  const [cotacaoDestinoId, setCotacaoDestinoId] = useState('')

  const [agora, setAgora] = useState(new Date().getTime());

  const STATUS_TRATAMENTO = ['DIVERGENCIA', 'VALORES_INCOMPATIVEIS', 'PENDENTE_DEVOLUCAO', 'ENTREGA_PARCIAL', 'CONFERENCIA_INICIADA'];
  const STATUS_AGUARDANDO_ENTREGA = ['CONFIRMADO_FORNECEDOR'];
  const STATUS_AGUARDANDO_CONFIRMACAO = ['PENDENTE_ENTREGA'];
  const STATUS_HISTORICO = ['ENTREGUE_SUCESSO', 'ENTREGUE_COM_FALTA', 'CANCELADO'];
  const STATUS_ATIVOS = [...STATUS_TRATAMENTO, ...STATUS_AGUARDANDO_ENTREGA, ...STATUS_AGUARDANDO_CONFIRMACAO];

  const normalizarTexto = (valor) => String(valor ?? '').toLowerCase().trim();

  const pedidoCombinaTexto = (pedido, termo) => {
    const termoNormalizado = normalizarTexto(termo);
    if (!termoNormalizado) return true;

    const combina = (valor) => normalizarTexto(valor).includes(termoNormalizado);

    const camposDoPedido = [
      pedido.id,
      pedido.numeroNota,
      pedido.cotacao?.id,
      pedido.cotacaoId,
      pedido.fornecedor?.empresa,
      pedido.fornecedor?.nomeEmpresa,
      pedido.fornecedor?.nome,
      pedido.fornecedorNome,
      pedido.fornecedor?.entreguePor,
      pedido.cotacao?.setor,
    ];

    if (camposDoPedido.some(combina)) return true;

    return pedido.itens?.some(item =>
      [item.nomeProduto, item.itemCotacao?.nomeProduto, item.codigoBarrasRecebido, item.itemCotacao?.codBarras].some(combina)
    ) || false;
  };

  const calcularResumo = (contagens) => {
    const somar = (statuses) => statuses.reduce((total, status) => total + (contagens[status] || 0), 0);

    return {
      total: Object.values(contagens).reduce((total, quantidade) => total + quantidade, 0),
      emTratamento: somar(STATUS_TRATAMENTO),
      aguardandoEntrega: somar(STATUS_AGUARDANDO_ENTREGA),
      aguardandoConfirmacao: somar(STATUS_AGUARDANDO_CONFIRMACAO),
      entregues: somar(['ENTREGUE_SUCESSO', 'ENTREGUE_COM_FALTA']),
      devolucoes: contagens['PENDENTE_DEVOLUCAO'] || 0,
      historico: somar(STATUS_HISTORICO),
    };
  };
  
  useEffect(() => {
      const interval = setInterval(() => setAgora(new Date().getTime()), 60000); 
      return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    carregarPedidosAba(abaAtiva);
  }, [abaAtiva])

  useEffect(() => {
    if (!isConferente) carregarResumo();
  }, [])

  useEffect(() => {
    if (buscaGeral.trim()) carregarPedidosAtivos();
  }, [buscaGeral])

  const getStatusParaAba = (aba) => {
    if (isConferente) return ['PENDENTE_ENTREGA', 'CONFIRMADO_FORNECEDOR', 'CONFERENCIA_INICIADA'];
    switch (aba) {
      case 'TRATAMENTO': return STATUS_TRATAMENTO;
      case 'AGUARDANDO_ENTREGA': return STATUS_AGUARDANDO_ENTREGA;
      case 'AGUARDANDO_CONFIRMACAO': return STATUS_AGUARDANDO_CONFIRMACAO;
      case 'HISTORICO': return STATUS_HISTORICO;
      default: return [];
    }
  };

  const carregarPedidosAba = async (aba, forceReload = false) => {
    if (!forceReload && pedidosCache[aba]) {
      setPedidos(pedidosCache[aba]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const statuses = getStatusParaAba(aba);
      const queryString = statuses.map(s => `statuses=${encodeURIComponent(s)}`).join('&');
      const response = await api.get(`/api/pedidos/filtrar?${queryString}&resumo=true`);
      const data = response.data || [];
      setPedidos(data);
      setPedidosCache(prev => ({ ...prev, [aba]: data }));
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  };

  const carregarResumo = async () => {
    try {
      const response = await api.get('/api/pedidos/resumo');
      setResumo(calcularResumo(response.data || {}));
    } catch (error) {
      console.error('Erro ao carregar resumo de pedidos:', error);
    }
  };

  const carregarPedidosAtivos = async (forceReload = false) => {
    if (!forceReload && pedidosAtivos) return;
    setCarregandoBusca(true);
    try {
      const queryString = STATUS_ATIVOS.map(s => `statuses=${encodeURIComponent(s)}`).join('&');
      const response = await api.get(`/api/pedidos/filtrar?${queryString}&resumo=true`);
      setPedidosAtivos(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar pedidos ativos:', error);
      setPedidosAtivos([]);
    } finally {
      setCarregandoBusca(false);
    }
  };

  const refreshAbaAtual = () => {
    carregarResumo();
    setPedidosAtivos(null);
    carregarPedidosAba(abaAtiva, true);
    if (buscaGeral.trim()) carregarPedidosAtivos(true);
  };

  const deletarPedido = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.')) {
      setIsDeleting(true);
      try {
        await api.delete(`/api/pedidos/${id}`);
        setPedidos(pedidos.filter(p => p.id !== id));
        setPedidosSelecionados(prev => prev.filter(selId => selId !== id));
        alert('Pedido excluído com sucesso!');
        refreshAbaAtual(); 
      } catch (error) {
        alert(error.response?.data?.message || 'Erro ao excluir pedido.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleExcluirEmMassa = async () => {
    if (window.confirm(`Tem certeza que deseja excluir permanentemente ${pedidosSelecionados.length} pedido(s)? Esta ação não pode ser desfeita.`)) {
      setIsDeleting(true);
      try {
        await Promise.all(pedidosSelecionados.map(id => api.delete(`/api/pedidos/${id}`)));
        alert('Pedidos excluídos com sucesso!');
        setPedidosSelecionados([]); 
        refreshAbaAtual(); 
      } catch (error) {
        alert('Alguns pedidos não puderam ser excluídos. Verifique se possuem devoluções vinculadas no histórico.');
        refreshAbaAtual(); 
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const abrirModalFalha = async (pedido) => {
      setPedidoFalha(pedido);
      setMotivoFalha('');
      setAcaoDestino('ORIGINAL');
      setCotacaoDestinoId('');
      
      try {
          const res = await api.get('/api/cotacao?resumo=true');
          const ativas = res.data.filter(c => ['ABERTA', 'PENDENTE', 'RESPONDIDA_PARCIALMENTE', 'RESPONDIDA'].includes(c.status));
          setCotacoesAtivas(ativas);
      } catch (error) {
          console.error("Erro ao carregar cotações ativas", error);
      }
      setModalFalhaAberto(true);
  };

  const registrarFalhaEntrega = async () => {
      if (!motivoFalha.trim()) return alert('Por favor, selecione ou informe o motivo do cancelamento.');
      if (acaoDestino === 'EXISTENTE' && !cotacaoDestinoId) return alert('Por favor, selecione em qual cotação deseja adicionar os itens.');

      try {
          await api.patch(`/api/pedidos/${pedidoFalha.id}/falha-entrega`, { 
              motivo: motivoFalha,
              acaoDestino: acaoDestino,
              cotacaoDestinoId: cotacaoDestinoId
          });
          alert('Pedido marcado como NÃO ENTREGUE. Os itens foram redirecionados com sucesso!');
          setModalFalhaAberto(false);
          refreshAbaAtual();
      } catch (e) {
          alert('Erro ao registrar falha de entrega: ' + (e.response?.data?.message || e.message));
      }
  };

  const handleAvisarEmMassa = () => {
    const horaAtual = new Date().getHours();
    let saudacao = 'Boa noite';
    if (horaAtual >= 5 && horaAtual < 12) saudacao = 'Bom dia';
    else if (horaAtual >= 12 && horaAtual < 18) saudacao = 'Boa tarde';

    const mensagem = `${saudacao}, pessoal! 📦✨\n\nAcabamos de enviar novos pedidos de compra para a tela de pedidos no nosso portal.\n\n🔗 *Acessem o link padrão abaixo, façam o login com o PIN e cliquem na opção "Meus Pedidos" para confirmar o recebimento e checar se há produtos para vocês:*\nhttps://cotacaotorresfarma.netlify.app\n\nFicamos no aguardo das confirmações!`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`, '_blank');
  };

  const handleAvisarIndividual = (pedido) => {
    const fornecedorNome = pedido.fornecedor?.nome || pedido.fornecedorNome || 'parceiro';
    const telefone = pedido.fornecedor?.telefone || ''; 

    const horaAtual = new Date().getHours();
    let saudacao = 'Boa noite';
    if (horaAtual >= 5 && horaAtual < 12) saudacao = 'Bom dia';
    else if (horaAtual >= 12 && horaAtual < 18) saudacao = 'Boa tarde';

    const mensagem = `${saudacao}, *${fornecedorNome}*! 📦✨\n\nAcabamos de enviar o *Pedido #${pedido.id}* para a sua tela de pedidos no nosso portal.\n\n🔗 *Acesse o link padrão abaixo, faça seu login com o PIN e clique na opção "Meus Pedidos" para nos confirmar o recebimento:*\nhttps://cotacaotorresfarma.netlify.app\n\nFico no aguardo da sua confirmação!`;

    let url = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`;
    
    if (telefone) {
      let telefoneLimpo = telefone.replace(/\D/g, '');
      if (telefoneLimpo.length === 10 || telefoneLimpo.length === 11) telefoneLimpo = `55${telefoneLimpo}`;
      url = `https://api.whatsapp.com/send?phone=${telefoneLimpo}&text=${encodeURIComponent(mensagem)}`;
    }

    window.open(url, '_blank');
  };

  const fMoney = (valor) => valor != null ? Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-';

  const emBuscaGeral = buscaGeral.trim().length > 0;

  const pedidosProcessados = (emBuscaGeral ? (pedidosAtivos || []) : pedidos)
    .filter((p) => {
      let gruposFormatados = '-';
      if (p.itens && p.itens.length > 0) {
          const listaDeGrupos = p.itens.map(item => item.itemCotacao?.grupo).filter(Boolean); 
          const gruposUnicos = [...new Set(listaDeGrupos)]; 
          if (gruposUnicos.length > 0) gruposFormatados = gruposUnicos.join(', ');
      }

      const matchTexto = pedidoCombinaTexto(p, emBuscaGeral ? buscaGeral : busca)

      const matchStatus = emBuscaGeral || filtroStatus === 'TODOS' || p.status === filtroStatus;

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

      let matchSetor = true;
      if (setorAtivo !== 'TODOS') {
          const setorFornecedor = (p.fornecedor?.setorCompra || '').toUpperCase();
          const grupos = gruposFormatados.toUpperCase();
          const setorCot = (p.cotacao?.setor || '').toUpperCase();
          
          if (setorAtivo === 'MEDICAMENTOS') {
              matchSetor = setorFornecedor.includes('MEDICAMENTOS') || setorFornecedor.includes('AMBOS') || grupos.includes('MEDICAMENTO') || setorCot.includes('MEDICAMENTO');
          }
          if (setorAtivo === 'PERFUMARIA') {
              matchSetor = setorFornecedor.includes('PERFUMARIA') || setorFornecedor.includes('AMBOS') || grupos.includes('PERFUMARIA') || setorCot.includes('PERFUMARIA');
          }
      }

      let matchPeriodoConferente = true;
      if (isConferente && periodoConferente !== 'TODOS') {
        const dataPedido = new Date(p.dataCriacao);
        const inicioPeriodo = new Date();
        inicioPeriodo.setHours(0, 0, 0, 0);
        if (periodoConferente === 'SEMANA') {
          const diasDesdeSegunda = inicioPeriodo.getDay() === 0 ? 6 : inicioPeriodo.getDay() - 1;
          inicioPeriodo.setDate(inicioPeriodo.getDate() - diasDesdeSegunda);
        } else if (periodoConferente === 'MES') {
          inicioPeriodo.setDate(1);
        }
        matchPeriodoConferente = dataPedido >= inicioPeriodo;
      }

      return matchTexto && matchStatus && matchData && matchSetor && matchPeriodoConferente;
    })
    .sort((a, b) => {
      if (ordenacao === 'RECENTES') return new Date(b.dataCriacao || 0) - new Date(a.dataCriacao || 0) || b.id - a.id;
      if (ordenacao === 'ANTIGOS') return new Date(a.dataCriacao || 0) - new Date(b.dataCriacao || 0) || a.id - b.id;
      
      const valA = (a.status !== 'PENDENTE_ENTREGA' && a.status !== 'CONFIRMADO_FORNECEDOR' && a.valorTotalReal != null) ? a.valorTotalReal : (a.valorTotalPedido || 0);
      const valB = (b.status !== 'PENDENTE_ENTREGA' && b.status !== 'CONFIRMADO_FORNECEDOR' && b.valorTotalReal != null) ? b.valorTotalReal : (b.valorTotalPedido || 0);
      
      if (ordenacao === 'MAIOR_VALOR') return valB - valA;
      if (ordenacao === 'MENOR_VALOR') return valA - valB;
      return 0;
    });

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allVisibleIds = pedidosProcessados.map(p => p.id);
      setPedidosSelecionados(Array.from(new Set([...pedidosSelecionados, ...allVisibleIds])));
    } else {
      const visibleIds = pedidosProcessados.map(p => p.id);
      setPedidosSelecionados(pedidosSelecionados.filter(id => !visibleIds.includes(id)));
    }
  };

  const handleSelectPedido = (id) => {
    setPedidosSelecionados(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const formatarDataBR = (dataIso) => {
    if (!dataIso) return '--/--/--'
    return new Date(dataIso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
  }

  const abrirModalDevolucao = (pedido) => {
    setPedidoSelecionado(pedido)
    setModalDevolucaoAberto(true)
  }

  const getStatusFormatado = (p) => {
    const status = p.status;
    const baseStyle = { padding: '4px 10px', borderRadius: '20px', fontWeight: '700', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px', justifyContent: 'center' };

    if (status === 'PENDENTE_ENTREGA') {
        const dataCriacao = new Date(p.dataCriacao).getTime();
        const prazoFinal = dataCriacao + (24 * 60 * 60 * 1000); 
        const tempoRestante = prazoFinal - agora;

        if (tempoRestante <= 0) {
            return { texto: 'Prazo Estourado (> 24h)', style: { ...baseStyle, backgroundColor: 'var(--danger-soft)', color: 'var(--danger-text)', border: '1px solid var(--danger-border)' }, estourado: true };
        }

        const horas = Math.floor((tempoRestante % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutos = Math.floor((tempoRestante % (1000 * 60 * 60)) / (1000 * 60));
        const isCritico = horas < 4;

        return { texto: `Aguardando (⏳ ${horas}h ${minutos}m)`, style: { ...baseStyle, backgroundColor: isCritico ? 'var(--warning-soft)' : 'var(--warning-soft)', color: isCritico ? 'var(--warning)' : 'var(--warning-text)' } };
    }

    switch (status) {
      case 'CONFIRMADO_FORNECEDOR': return { texto: 'Confirmado na Fábrica', style: { ...baseStyle, backgroundColor: 'var(--info-soft)', color: 'var(--primary-hover)' } };
      case 'ENTREGUE_SUCESSO': return { texto: 'Entregue', style: { ...baseStyle, backgroundColor: 'var(--success-soft)', color: 'var(--success)' } };
      case 'ENTREGUE_COM_FALTA': return { texto: 'Entregue com Falta', style: { ...baseStyle, backgroundColor: 'var(--warning-soft)', color: 'var(--warning-text)' } };
      case 'VALORES_INCOMPATIVEIS': return { texto: 'Divergência: Valor', style: { ...baseStyle, backgroundColor: 'var(--danger-soft)', color: 'var(--danger-text)' } };
      case 'DIVERGENCIA': return { texto: 'Divergência: Quantidade', style: { ...baseStyle, backgroundColor: 'var(--danger-soft)', color: 'var(--danger-text)' } };
      case 'PENDENTE_DEVOLUCAO': return { texto: 'Devolução Pendente', style: { ...baseStyle, backgroundColor: 'var(--purple-soft)', color: 'var(--purple-text)' } };
      case 'ENTREGA_PARCIAL': return { texto: 'Entrega Parcial', style: { ...baseStyle, backgroundColor: 'var(--warning-soft)', color: 'var(--warning-text)' } };
      case 'CONFERENCIA_INICIADA': return { texto: 'Conferência em andamento', style: { ...baseStyle, backgroundColor: 'var(--purple-soft)', color: 'var(--purple-text)' } };
      case 'CANCELADO': return { texto: 'Cancelado / Falha na Entrega', style: { ...baseStyle, backgroundColor: 'var(--surface-muted)', color: 'var(--text-secondary)', textDecoration: 'line-through' } };
      default: return { texto: status, style: { ...baseStyle, backgroundColor: 'var(--bg)', color: 'var(--text-secondary)' } };
    }
  }

  if (isConferente) {
    return (
      <div className="layout pedidos-conferente-mobile">
        <style>{`
          /* ===== Computador: layout amplo, igual às demais telas do sistema ===== */
          .pedidos-conferente-mobile .main-content {
            padding: 30px;
            width: 100%;
            box-sizing: border-box;
            overflow-x: hidden;
          }
          .conferente-filtros {
            grid-template-columns: repeat(auto-fit, minmax(170px, 250px));
            justify-content: start;
          }
          .conferente-lista {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 16px;
            align-items: start;
          }
          .conferente-pedido-card {
            background: white;
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 16px 18px;
            margin: 0;
            box-shadow: 0 1px 3px rgba(15, 23, 42, .06);
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .conferente-btn-abrir {
            align-self: flex-start;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            width: fit-content;
            min-height: 36px;
            padding: 7px 14px;
            background: var(--primary);
            border: 0;
            border-radius: 7px;
            color: white;
            font-weight: 600;
            font-size: 13px;
            cursor: pointer;
            box-shadow: 0 1px 2px rgba(37, 99, 235, .25);
            transition: background .15s;
          }
          .conferente-btn-abrir:hover { background: var(--primary-hover); }

          /* ===== Celular ===== */
          @media (max-width: 768px) {
            .pedidos-conferente-mobile .main-content {
              padding: 12px 10px calc(220px + env(safe-area-inset-bottom));
              min-height: calc(100vh - 64px);
              overflow: visible;
            }
            .pedidos-conferente-mobile h1 {
              font-size: 21px !important;
            }
            .conferente-filtros {
              grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            }
            .conferente-lista {
              grid-template-columns: 1fr;
              gap: 12px;
            }
            .conferente-pedido-card {
              border-radius: 10px;
              padding: 12px;
            }
            .conferente-pedido-card:last-child {
              margin-bottom: 160px;
            }
            .conferente-btn-abrir {
              align-self: stretch;
              width: 100%;
              min-height: 48px;
              padding: 12px 16px;
              font-size: 15px;
            }
          }
        `}</style>
        <Sidebar />
        <main className="main-content">
          <header style={{ marginBottom: '16px' }}>
            <h1 style={{ fontSize: '24px', margin: '0 0 5px' }}>Conferência de Pedidos</h1>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '14px' }}>
              Selecione um pedido para conferir os produtos recebidos.
            </p>
          </header>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Buscar por produto, empresa, NF ou pedido..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{ border: 0, outline: 0, width: '100%', fontSize: '16px' }}
            />
          </div>

          <div className="conferente-filtros" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px', marginBottom: '16px', display: 'grid', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid var(--border-strong)', borderRadius: '7px', padding: '8px 10px', color: 'var(--text-secondary)', fontSize: '13px' }}>
              <Filter size={16} />
              <select value={setorAtivo} onChange={(e) => setSetorAtivo(e.target.value)} style={{ border: 0, outline: 0, width: '100%', background: 'transparent', color: 'var(--text-secondary)', fontSize: '13px' }}>
                <option value="TODOS">Todos os grupos</option>
                <option value="MEDICAMENTOS">Medicamentos</option>
                <option value="PERFUMARIA">Perfumaria</option>
              </select>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid var(--border-strong)', borderRadius: '7px', padding: '8px 10px', color: 'var(--text-secondary)', fontSize: '13px' }}>
              <Calendar size={16} />
              <select value={periodoConferente} onChange={(e) => setPeriodoConferente(e.target.value)} style={{ border: 0, outline: 0, width: '100%', background: 'transparent', color: 'var(--text-secondary)', fontSize: '13px' }}>
                <option value="TODOS">Todo o período</option>
                <option value="SEMANA">Esta semana</option>
                <option value="MES">Este mês</option>
              </select>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid var(--border-strong)', borderRadius: '7px', padding: '8px 10px', color: 'var(--text-secondary)', fontSize: '13px' }}>
              <ArrowUpDown size={16} />
              <select value={ordenacao} onChange={(e) => setOrdenacao(e.target.value)} style={{ border: 0, outline: 0, width: '100%', background: 'transparent', color: 'var(--text-secondary)', fontSize: '13px' }}>
                <option value="RECENTES">Mais recentes</option>
                <option value="ANTIGOS">Mais antigos</option>
              </select>
            </label>
            {(busca || setorAtivo !== 'TODOS' || periodoConferente !== 'TODOS' || ordenacao !== 'RECENTES') && (
              <button
                type="button"
                onClick={() => { setBusca(''); setSetorAtivo('TODOS'); setPeriodoConferente('TODOS'); setOrdenacao('RECENTES'); }}
                style={{ minHeight: '42px', border: '1px solid var(--danger-border)', borderRadius: '7px', background: 'var(--danger-soft)', color: 'var(--danger-text)', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}
              >
                Limpar filtros
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
              <Loader2 size={28} className="animate-spin" />
              <p>Carregando pedidos...</p>
            </div>
          ) : pedidosProcessados.length === 0 ? (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '28px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Nenhum pedido disponível para conferência.
            </div>
          ) : (
            <div className="conferente-lista">
              {pedidosProcessados.map((p) => {
                const empresa = p.fornecedor?.empresa || p.fornecedor?.nome || 'Empresa não informada';
                const statusInfo = getStatusFormatado(p);
                return (
                  <article className="conferente-pedido-card" key={p.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      <div>
                        <strong style={{ color: 'var(--text)', fontSize: '16px' }}>Pedido #{p.id}</strong>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>{empresa}</div>
                      </div>
                      <span style={statusInfo.style}>{statusInfo.texto}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', color: 'var(--text-muted)', fontSize: '13px' }}>
                      <span>{p.itens?.length || 0} produto(s)</span>
                      <span>NF: {p.numeroNota || 'Não informada'}</span>
                    </div>
                    <button
                      className="conferente-btn-abrir"
                      onClick={() => navigate(`/pedidos/${p.id}`)}
                    >
                      Ver produtos e conferir
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className={`layout pedidos-page ${isConferente ? 'pedidos-conferente' : ''}`}>
      <style>{`
        @media (max-width: 768px) {
          .pedidos-conferente .main-content {
            padding: 14px 10px;
          }
          .pedidos-conferente .main-content > header {
            margin-bottom: 18px !important;
          }
          .pedidos-conferente .main-content > header h1 {
            font-size: 21px !important;
          }
          .pedidos-conferente .main-content > header p {
            font-size: 13px;
          }
          .pedidos-page .filters-bar {
            padding: 10px !important;
            gap: 8px !important;
          }
          .pedidos-page .table-container {
            border-radius: 8px;
          }
          .pedidos-page .table-container table {
            min-width: 760px;
          }
          .pedidos-page .table-container th,
          .pedidos-page .table-container td {
            padding: 9px 7px !important;
            font-size: 12px !important;
          }
          .pedidos-page .pedidos-acoes {
            gap: 4px !important;
          }
          .pedidos-page .btn-icon {
            min-width: 34px;
            min-height: 34px;
          }
        }
      `}</style>
      <Sidebar />

      <main className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '24px', marginBottom: '5px' }}>Gerenciamento de Pedidos</h1>
            <p style={{ color: 'var(--text-muted)' }}>Acompanhe entregas e resolva divergências</p>
          </div>
        </header>

        <div style={{ backgroundColor: 'var(--surface)', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <div style={{ flex: '1 1 320px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid var(--border-strong)', padding: '10px 12px', borderRadius: '8px' }}>
            <Search size={18} color="var(--text-subtle)" />
            <input
              type="text"
              placeholder="Busca geral em pedidos ativos: produto, EAN, fornecedor, empresa, NF ou nº do pedido"
              value={buscaGeral}
              onChange={(e) => { setBuscaGeral(e.target.value); setPedidosSelecionados([]); }}
              style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px' }}
            />
            {buscaGeral && (
              <button
                type="button"
                onClick={() => { setBuscaGeral(''); setPedidosSelecionados([]); }}
                title="Limpar busca geral"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 0 }}
              >
                <X size={18} />
              </button>
            )}
          </div>
          {emBuscaGeral && (
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600' }}>
              {carregandoBusca ? 'Buscando em todos os pedidos ativos...' : `${pedidosProcessados.length} resultado(s) em todos os pedidos ativos`}
            </span>
          )}
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{resumo.total}</div>
            <div className="stat-label">Total de Pedidos</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--danger)' }}>{resumo.emTratamento}</div>
            <div className="stat-label">Em Tratamento</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--warning)' }}>{resumo.aguardandoEntrega}</div>
            <div className="stat-label">Aguardando Entrega</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--warning)' }}>{resumo.aguardandoConfirmacao}</div>
            <div className="stat-label">Aguardando Confirmação</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--success)' }}>{resumo.entregues}</div>
            <div className="stat-label">Entregues</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          {[
            { chave: 'TRATAMENTO', titulo: 'Em Tratamento', descricao: 'Divergências e pendências', cor: 'var(--danger)', fundo: 'var(--danger-soft)', icone: <AlertTriangle size={20} />, quantidade: resumo.emTratamento },
            { chave: 'AGUARDANDO_ENTREGA', titulo: 'Aguardando Entrega', descricao: 'Confirmados pelo fornecedor', cor: 'var(--warning)', fundo: 'var(--warning-soft)', icone: <PackagePlus size={20} />, quantidade: resumo.aguardandoEntrega },
            { chave: 'AGUARDANDO_CONFIRMACAO', titulo: 'Aguardando Confirmação', descricao: 'Aguardando fornecedor', cor: 'var(--warning)', fundo: 'var(--warning-soft)', icone: <Calendar size={20} />, quantidade: resumo.aguardandoConfirmacao },
            { chave: 'HISTORICO', titulo: 'Histórico', descricao: 'Entregues e cancelados', cor: 'var(--success)', fundo: 'var(--success-soft)', icone: <CheckCircle size={20} />, quantidade: resumo.historico },
          ].map((categoria) => {
            const ativa = abaAtiva === categoria.chave;
            return (
              <button
                key={categoria.chave}
                type="button"
                onClick={() => {
                  setAbaAtiva(categoria.chave);
                  setFiltroStatus('TODOS');
                  setOrdenacao('RECENTES');
                  setPedidosSelecionados([]);
                  setBuscaGeral('');
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '6px',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  backgroundColor: ativa ? categoria.fundo : 'var(--surface)',
                  border: `2px solid ${ativa ? categoria.cor : 'var(--border)'}`,
                  boxShadow: ativa ? `0 4px 10px ${categoria.cor}22` : '0 1px 2px rgba(15, 23, 42, 0.04)',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: categoria.cor, fontWeight: '700', fontSize: '14px' }}>
                    {categoria.icone} {categoria.titulo}
                  </span>
                  <span style={{ color: categoria.cor, fontWeight: '800', fontSize: '20px' }}>{categoria.quantidade}</span>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{categoria.descricao}</span>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '8px', backgroundColor: 'var(--surface-muted)', padding: '4px', borderRadius: '8px', width: 'fit-content', border: '1px solid var(--border-strong)' }}>
              <button 
                onClick={() => setSetorAtivo('TODOS')}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', backgroundColor: setorAtivo === 'TODOS' ? 'var(--surface)' : 'transparent', color: setorAtivo === 'TODOS' ? 'var(--text)' : 'var(--text-muted)', boxShadow: setorAtivo === 'TODOS' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
              >
                Todas Origens
              </button>
              <button 
                onClick={() => setSetorAtivo('MEDICAMENTOS')}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', backgroundColor: setorAtivo === 'MEDICAMENTOS' ? 'var(--surface)' : 'transparent', color: setorAtivo === 'MEDICAMENTOS' ? 'var(--primary)' : 'var(--text-muted)', boxShadow: setorAtivo === 'MEDICAMENTOS' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
              >
                Medicamentos
              </button>
              <button 
                onClick={() => setSetorAtivo('PERFUMARIA')}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', backgroundColor: setorAtivo === 'PERFUMARIA' ? 'var(--surface)' : 'transparent', color: setorAtivo === 'PERFUMARIA' ? 'var(--purple)' : 'var(--text-muted)', boxShadow: setorAtivo === 'PERFUMARIA' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
              >
                Perfumaria
              </button>
            </div>
          </div>

          <button 
              onClick={() => setIsModalManualOpen(true)}
              style={{ padding: '10px 16px', backgroundColor: 'var(--text)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
            >
              <PackagePlus size={18} /> Criar Pedido Manual
          </button>
        </div>

        <div style={{ backgroundColor: 'var(--surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          
          <div style={{ flex: '1 1 250px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid var(--border-strong)', padding: '8px 12px', borderRadius: '6px' }}>
            <Search size={18} color="var(--text-subtle)" />
            <input
              type="text"
              placeholder="Buscar Pedido, Empresa, NF ou Produto..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid var(--border-strong)', padding: '6px 12px', borderRadius: '6px' }}>
             <Calendar size={16} color="var(--text-muted)" />
             <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer', backgroundColor: 'transparent' }} title="Data Inicial" />
             <span style={{ color: 'var(--text-subtle)', fontSize: '13px' }}>até</span>
             <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer', backgroundColor: 'transparent' }} title="Data Final" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid var(--border-strong)', padding: '8px 12px', borderRadius: '6px' }}>
            <Filter size={16} color="var(--text-muted)" />
            <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer', backgroundColor: 'transparent' }}>
              <option value="TODOS">Todos os Status</option>
              {abaAtiva === 'TRATAMENTO' && (
                <>
                  <option value="DIVERGENCIA">Divergência de Quantidade</option>
                  <option value="VALORES_INCOMPATIVEIS">Valores Incompatíveis</option>
                  <option value="PENDENTE_DEVOLUCAO">Devolução Pendente</option>
                  <option value="ENTREGA_PARCIAL">Entrega Parcial</option>
                  <option value="CONFERENCIA_INICIADA">Conferência em andamento</option>
                </>
              )}
              {abaAtiva === 'AGUARDANDO_ENTREGA' && (
                <option value="CONFIRMADO_FORNECEDOR">Confirmado na Fábrica</option>
              )}
              {abaAtiva === 'AGUARDANDO_CONFIRMACAO' && (
                <option value="PENDENTE_ENTREGA">Aguardando Fornecedor</option>
              )}
              {abaAtiva === 'HISTORICO' && (
                <>
                  <option value="ENTREGUE_SUCESSO">Entregue com Sucesso</option>
                  <option value="ENTREGUE_COM_FALTA">Entregue com Falta</option>
                  <option value="CANCELADO">Cancelado / Falha</option>
                </>
              )}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid var(--border-strong)', padding: '8px 12px', borderRadius: '6px' }}>
            <ArrowUpDown size={16} color="var(--text-muted)" />
            <select value={ordenacao} onChange={(e) => setOrdenacao(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer', backgroundColor: 'transparent' }}>
              <option value="RECENTES">Mais Recentes</option>
              <option value="ANTIGOS">Mais Antigos</option>
              <option value="MAIOR_VALOR">Maior Valor</option>
              <option value="MENOR_VALOR">Menor Valor</option>
            </select>
          </div>

          {(busca || filtroStatus !== 'TODOS' || dataInicio || dataFim || ordenacao !== 'RECENTES' || setorAtivo !== 'TODOS') && (
            <button 
              onClick={() => { setBusca(''); setFiltroStatus('TODOS'); setDataInicio(''); setDataFim(''); setOrdenacao('RECENTES'); setSetorAtivo('TODOS'); }}
              style={{ padding: '8px 16px', fontSize: '12px', color: 'var(--danger)', backgroundColor: 'var(--danger-soft)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Limpar Filtros
            </button>
          )}
        </div>

        {pedidosSelecionados.length > 0 && (
          <div style={{ backgroundColor: 'var(--surface-muted)', border: '1px solid var(--border-strong)', padding: '12px 20px', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', animation: 'fadeIn 0.3s', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 'bold', fontSize: '15px' }}>
              {pedidosSelecionados.length} pedido(s) selecionado(s)
            </span>
            <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => {
                    if (pedidosSelecionados.length === 1) {
                      navigate(`/conferencia/${pedidosSelecionados[0]}`);
                    } else {
                      const pendentes = pedidosProcessados.filter(p => pedidosSelecionados.includes(p.id) && ['CONFIRMADO_FORNECEDOR', 'ENTREGA_PARCIAL'].includes(p.status));
                      if (pendentes.length === 0) {
                        alert('Nenhum dos pedidos selecionados está pendente de conferência.\n\nStatus elegíveis: Confirmado no Fornecedor, Entrega Parcial.');
                        return;
                      }
                      if (window.confirm(`Abrir conferência para ${pendentes.length} pedido(s)? Será aberta uma aba para cada conferência.`)) {
                        pendentes.forEach(p => window.open(`/conferencia/${p.id}`, '_blank'));
                      }
                    }
                  }}
                  style={{ backgroundColor: 'var(--purple)', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(99, 102, 241, 0.3)' }}
                >
                  <ClipboardCheck size={18} /> Conferir Selecionados
                </button>
                <button 
                  onClick={handleAvisarEmMassa} 
                  style={{ backgroundColor: '#25D366', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(37, 211, 102, 0.3)' }}
                >
                  <MessageCircle size={18} /> Avisar Fornecedores
                </button>
                <button 
                  onClick={handleExcluirEmMassa} 
                  disabled={isDeleting} 
                  style={{ backgroundColor: 'var(--danger)', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)' }}
                >
                  <Trash2 size={18} /> {isDeleting ? 'Excluindo...' : 'Excluir Selecionados'}
                </button>
            </div>
          </div>
        )}

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={pedidosProcessados.length > 0 && pedidosProcessados.every(p => pedidosSelecionados.includes(p.id))}
                    onChange={handleSelectAll}
                    style={{ transform: 'scale(1.2)', cursor: 'pointer', accentColor: 'var(--info)' }}
                    title="Selecionar/Desmarcar Todos"
                  />
                </th>
                <th style={{ width: '80px' }}>ID</th>
                <th style={{ width: '120px' }}>Cotação</th>
                <th>Empresa (Vendedor)</th>
                <th style={{ textAlign: 'center' }}>Setor</th>
                <th style={{ width: '100px' }}>NF</th>
                <th>Entregue Por</th>
                <th>Grupos</th>
                <th>Valor Total</th>
                <th style={{ width: '100px' }}>Data</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading || (emBuscaGeral && carregandoBusca) ? (
                <tr>
                  <td colSpan="12" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <Loader2 size={32} className="animate-spin" color="var(--info)" />
                      <span style={{ fontWeight: '500' }}>Carregando pedidos...</span>
                    </div>
                  </td>
                </tr>
              ) : pedidosProcessados.length === 0 ? (
                <tr>
                  <td colSpan="12" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    {emBuscaGeral ? 'Nenhum pedido ativo encontrado para a busca.' : 'Nenhum pedido encontrado nesta aba ou setor.'}
                  </td>
                </tr>
              ) : (
                pedidosProcessados.map((p) => {
                  const statusInfo = getStatusFormatado(p)
                  
                  const emp = p.fornecedor?.empresa || p.fornecedor?.nomeEmpresa || '';
                  const vend = p.fornecedor?.nome || p.fornecedorNome || '';
                  let nomeEmpresa = emp;
                  if (emp && vend && emp !== vend) nomeEmpresa += ` (${vend})`;
                  else if (!emp && vend) nomeEmpresa = vend;
                  else if (!emp && !vend) nomeEmpresa = 'N/A';

                  const idCotacao = p.cotacao?.id || p.cotacaoId || '-';

                  let gruposFormatados = '-';
                  if (p.itens && p.itens.length > 0) {
                    const listaDeGrupos = p.itens.map(item => item.itemCotacao?.grupo).filter(Boolean); 
                    const gruposUnicos = [...new Set(listaDeGrupos)]; 
                    if (gruposUnicos.length > 0) gruposFormatados = gruposUnicos.join(', ');
                  }
                  
                  const isAguardando = p.status === 'PENDENTE_ENTREGA' || p.status === 'CONFIRMADO_FORNECEDOR' || p.status === 'CONFERENCIA_INICIADA';
                  const valorExibir = (!isAguardando && p.valorTotalReal != null) ? p.valorTotalReal : p.valorTotalPedido;
                  
                  const isSelected = pedidosSelecionados.includes(p.id);

                  return (
                    <tr key={p.id} style={{ backgroundColor: isSelected ? 'var(--info-soft)' : 'transparent', transition: 'background-color 0.2s' }}>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectPedido(p.id)}
                          style={{ transform: 'scale(1.2)', cursor: 'pointer', accentColor: 'var(--info)' }}
                        />
                      </td>
                      <td><span style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>#{p.id}</span></td>
                      
                      <td>
                        {idCotacao !== '-' ? (
                          <button 
                            onClick={() => navigate(`/cotacao/${idCotacao}`)}
                            style={{ backgroundColor: 'var(--purple-soft)', color: 'var(--purple-text)', border: '1px solid var(--purple-border)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                            title="Ir para a Cotação"
                          >
                            Ver Cot. #{idCotacao}
                          </button>
                        ) : (
                          <span style={{ backgroundColor: 'var(--surface-muted)', color: 'var(--text-secondary)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                            Avulso
                          </span>
                        )}
                      </td>

                      <td><span style={{ fontWeight: '600', color: 'var(--text)', fontSize: '14px' }}>{nomeEmpresa}</span></td>
                      
                      <td style={{ textAlign: 'center' }}>
                        {(() => {
                          const setor = p.cotacao?.setor || p.fornecedor?.setorCompra || 'AMBOS';
                          const setorColor = setor === 'MEDICAMENTOS' ? 'var(--primary)' : setor === 'PERFUMARIA' ? 'var(--purple)' : 'var(--text-secondary)';
                          const setorBg = setor === 'MEDICAMENTOS' ? 'var(--info-soft)' : setor === 'PERFUMARIA' ? 'var(--purple-soft)' : 'var(--surface-muted)';
                          return (
                            <div style={{ fontSize: '11px', fontWeight: 'bold', color: setorColor, backgroundColor: setorBg, padding: '4px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Tag size={12} /> {setor === 'AMBOS' ? 'Med / Perf' : setor}
                            </div>
                          );
                        })()}
                      </td>

                      <td><span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600', backgroundColor: 'var(--bg)', padding: '2px 6px', borderRadius: '4px' }}>{p.numeroNota || '-'}</span></td>
                      <td><span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '500' }}>{p.fornecedor?.entreguePor || '-'}</span></td>
                      <td><span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{gruposFormatados}</span></td>
                      <td><span style={{ fontWeight: '600', color: 'var(--success)', fontSize: '14px' }}>{fMoney(valorExibir)}</span></td>
                      <td><span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{formatarDataBR(p.dataCriacao)}</span></td>
                      
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                          <span style={statusInfo.style}>{statusInfo.texto}</span>
                          
                          {(p.qtdSugestoes > 0 || p.sugestoes?.length > 0) && p.status !== 'CANCELADO' && (
                              <span style={{ backgroundColor: 'var(--warning-border)', color: 'var(--warning-text)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px', border: '1px solid var(--warning-border)' }} title="Há sugestões extras do fornecedor pendentes de análise">
                                  <Tag size={10} /> Sugestão Pendente
                              </span>
                          )}
                        </div>
                      </td>

                      <td>
                        <div className="pedidos-acoes" style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn-icon" title="Ver Detalhes" onClick={() => navigate(`/pedidos/${p.id}`)}>
                            <Eye size={18} />
                          </button>
                          
                          {!isConferente && p.status === 'PENDENTE_ENTREGA' && (
                             <button className="btn-icon" title="Avisar Fornecedor (WhatsApp)" onClick={() => handleAvisarIndividual(p)}>
                               <MessageCircle size={18} color="#25D366" />
                             </button>
                          )}

                          {isAguardando && (
                            <button className="btn-icon" title="Conferir Recebimento" onClick={() => navigate(`/pedidos/${p.id}/conferir`)}>
                              <CheckCircle size={18} color="var(--success)" />
                            </button>
                          )}

                          {!isConferente && isAguardando && (
                            <button className="btn-icon" title="Registrar Falha na Entrega / Cancelar" onClick={() => abrirModalFalha(p)}>
                              <XCircle size={18} color="var(--danger)" />
                            </button>
                          )}

                          {!isConferente && p.status === 'PENDENTE_DEVOLUCAO' && (
                            <button className="btn-icon" title="Tratar Devolução" onClick={() => abrirModalDevolucao(p)}>
                              <RotateCcw size={18} color="var(--danger)" />
                            </button>
                          )}

                          {!isConferente && <button className="btn-icon" title="Excluir Pedido" onClick={() => deletarPedido(p.id)}>
                            <Trash2 size={18} color="var(--danger)" />
                          </button>}
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
            onSuccess={() => { setModalDevolucaoAberto(false); refreshAbaAtual(); }}
          />
        )}
        
        {isModalManualOpen && (
            <ModalPedidoManual 
                isOpen={isModalManualOpen} 
                onClose={() => { setIsModalManualOpen(false); refreshAbaAtual(); }} 
            />
        )}

        {/* MODAL DE FALHA NA ENTREGA */}
        {modalFalhaAberto && pedidoFalha && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' }}>
                <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '500px', maxHeight: 'calc(100dvh - 32px)', overflowY: 'auto', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: '0 0 18px 0', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <XCircle size={20} color="var(--danger)" /> Registrar Falha de Entrega
                        </h3>
                        <button onClick={() => setModalFalhaAberto(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
                    </div>
                    
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
                        O Pedido <strong>#{pedidoFalha.id}</strong> ({pedidoFalha.fornecedor?.nome || pedidoFalha.fornecedorNome}) será marcado como Falha/Cancelado.
                    </p>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '8px' }}>Selecione o Motivo da Falha / Cancelamento *</label>
                        <select 
                            value={motivoFalha} 
                            onChange={e => setMotivoFalha(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-strong)', outline: 'none', fontSize: '14px' }}
                        >
                            <option value="">-- Selecione o Motivo --</option>
                            <option value="Prazo Estourado (24h)">Prazo Estourado (24h)</option>
                            <option value="Pedido não confirmado pelo fornecedor">Pedido não confirmado pelo fornecedor</option>
                            <option value="Faturamento não realizado">Faturamento não realizado</option>
                            <option value="Ruptura na Entrega (Não Entregue)">Ruptura na Entrega (Não Entregue)</option>
                            <option value="Outro Motivo">Outro...</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: 'var(--surface-muted)', borderRadius: '8px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '12px' }}>O que fazer com os itens deste pedido?</label>
                        
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text)', marginBottom: '10px' }}>
                            <input type="radio" checked={acaoDestino === 'ORIGINAL'} onChange={() => setAcaoDestino('ORIGINAL')} style={{ transform: 'scale(1.2)' }} />
                            <span>Devolver para a <strong>Cotação Original</strong> (se houver)</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text)', marginBottom: '10px' }}>
                            <input type="radio" checked={acaoDestino === 'NOVA'} onChange={() => setAcaoDestino('NOVA')} style={{ transform: 'scale(1.2)' }} />
                            <span>Gerar uma <strong>Nova Cotação</strong> com estes itens</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text)' }}>
                            <input type="radio" checked={acaoDestino === 'EXISTENTE'} onChange={() => setAcaoDestino('EXISTENTE')} style={{ transform: 'scale(1.2)' }} />
                            <span>Adicionar em uma <strong>Cotação Ativa</strong></span>
                        </label>

                        {acaoDestino === 'EXISTENTE' && (
                            <div style={{ marginTop: '10px', marginLeft: '24px' }}>
                                <select 
                                    value={cotacaoDestinoId} 
                                    onChange={e => setCotacaoDestinoId(e.target.value)}
                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-strong)', outline: 'none', fontSize: '13px' }}
                                >
                                    <option value="">-- Selecione a Cotação --</option>
                                    {cotacoesAtivas.map(c => (
                                        <option key={c.id} value={c.id}>#{c.id} - {c.descricao} ({c.status})</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button onClick={() => setModalFalhaAberto(false)} style={{ padding: '10px 16px', background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: '6px', fontWeight: 'bold', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancelar</button>
                        <button onClick={registrarFalhaEntrega} style={{ padding: '10px 16px', background: 'var(--danger)', border: 'none', borderRadius: '6px', fontWeight: 'bold', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            Confirmar Cancelamento
                        </button>
                    </div>
                </div>
            </div>
        )}

      </main>
      
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  )
}