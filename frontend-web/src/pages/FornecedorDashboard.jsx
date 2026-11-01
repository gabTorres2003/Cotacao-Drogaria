import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { LogOut, PackageSearch, FileText, CheckCircle, AlertTriangle, X, Edit2, PlusCircle, Trash2, Tag, TrendingUp, Tags, ChevronDown, ChevronUp, Home } from 'lucide-react'
import api from '../services/api'
import ThemeToggle from '../components/layout/ThemeToggle'

export default function FornecedorDashboard() {
  const [cotacoes, setCotacoes] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(() => {
    const aba = new URLSearchParams(window.location.search).get('tab')
    return aba === 'pedidos' ? 'pedidos' : 'cotacoes'
  })
  
  const [subAbaPedidos, setSubAbaPedidos] = useState('ANDAMENTO')
  
  const [showPrimeiroAcesso, setShowPrimeiroAcesso] = useState(localStorage.getItem('primeiroAcesso') === 'true')
  const [novaSenha, setNovaSenha] = useState('')
  const [salvandoSenha, setSalvandoSenha] = useState(false)

  const [pedidoConfirmacao, setPedidoConfirmacao] = useState(null)
  const [checklistEstoque, setChecklistEstoque] = useState({})
  const [salvandoConfirmacao, setSalvandoConfirmacao] = useState(false)

  const [valoresMinimos, setValoresMinimos] = useState({})
  const [isSugestaoModalOpen, setIsSugestaoModalOpen] = useState(false)
  const [pedidoAtualSugestao, setPedidoAtualSugestao] = useState(null)
  
  const [novaSugestao, setNovaSugestao] = useState({ 
      nomeProduto: '', quantidade: '', precoUnitario: '', observacao: '',
      exibirCondicao: false, quantidadeCondicao: '', precoCondicao: ''
  })
  const [isSalvando, setIsSalvando] = useState(false)

  const [expandedPedidos, setExpandedPedidos] = useState({})

  const navigate = useNavigate()
  const location = useLocation()
  const nomeUsuario = localStorage.getItem('nomeUsuario') || 'Fornecedor'
  const usuarioId = localStorage.getItem('usuarioId')

  // Mantém a aba sincronizada quando o usuário chega pela página inicial.
  useEffect(() => {
    const aba = new URLSearchParams(location.search).get('tab')
    if (aba === 'pedidos' || aba === 'cotacoes') setActiveTab(aba)
  }, [location.search])

  const [agora, setAgora] = useState(new Date().getTime());
  useEffect(() => {
      const interval = setInterval(() => setAgora(new Date().getTime()), 60000); 
      return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchDados()
  }, [usuarioId, activeTab])

  const fetchDados = async () => {
    setLoading(true)
    try {
      if (usuarioId) {
        if (activeTab === 'cotacoes') {
          const response = await api.get(`/api/cotacao-fornecedor/fornecedor/${usuarioId}?resumo=true`)
          setCotacoes(response.data)
        } else {
          const response = await api.get(`/api/pedidos/fornecedor/${usuarioId}`)
          setPedidos(response.data)

          const initialExpanded = {};
          response.data.forEach(p => {
            initialExpanded[p.id] = p.status === 'PENDENTE_ENTREGA';
          });
          setExpandedPedidos(initialExpanded);
        }
      }
    } catch (error) {
      console.error(`Erro ao buscar ${activeTab}`, error)
    } finally {
      setLoading(false)
    }
  }

  const togglePedidoExpandido = (pedidoId) => {
    setExpandedPedidos(prev => ({
      ...prev,
      [pedidoId]: !prev[pedidoId]
    }))
  }

  const handleLogout = async () => {
    // Mantém a preferência de tema entre sessões.
    ;['token', 'tipoUsuario', 'primeiroAcesso', 'nomeUsuario', 'usuarioId'].forEach(
      (chave) => localStorage.removeItem(chave),
    )
    navigate('/')
  }

  const salvarNovaSenha = async () => {
    if (!novaSenha || novaSenha.length < 4) return alert("A senha deve ter no mínimo 4 dígitos.");
    setSalvandoSenha(true);
    try {
      await api.put(`/api/fornecedor/${usuarioId}/primeiro-acesso`, { novaSenha: novaSenha });
      localStorage.setItem('primeiroAcesso', 'false');
      setShowPrimeiroAcesso(false);
      alert("Senha de acesso atualizada com sucesso!");
    } catch (error) {
      alert("Erro ao atualizar a senha. Tente novamente.");
    } finally {
      setSalvandoSenha(false);
    }
  }

  const abrirModalConfirmacao = (pedido) => {
    setPedidoConfirmacao(pedido)
    const checklistInicial = {}
    pedido.itens.forEach(item => {
      checklistInicial[item.id] = true
    })
    setChecklistEstoque(checklistInicial)
  }

  const processarConfirmacaoPedido = async () => {
    setSalvandoConfirmacao(true)
    const itensEmFalta = pedidoConfirmacao.itens.filter(item => !checklistEstoque[item.id]);
    const todosEmFalta = itensEmFalta.length === pedidoConfirmacao.itens.length;

    try {
      for (const item of itensEmFalta) {
        try { await api.delete(`/api/pedidos/item/${item.id}`); } catch (e) {}
      }

      if (todosEmFalta) {
        await api.patch(`/api/pedidos/${pedidoConfirmacao.id}/status`, { status: "CANCELADO" });
        alert("Como todos os produtos estavam em falta, o pedido foi CANCELADO.");
      } else {
        await api.patch(`/api/pedidos/${pedidoConfirmacao.id}/status`, { status: "CONFIRMADO_FORNECEDOR" })
        alert("Pedido confirmado com sucesso!")
      }
      setPedidoConfirmacao(null)
      fetchDados()
    } catch(error) {
      alert("Erro ao processar o pedido.")
    } finally {
      setSalvandoConfirmacao(false)
    }
  }

  const handleValorMinimoChange = (pedidoId, value) => {
    setValoresMinimos(prev => ({ ...prev, [pedidoId]: value }));
  }

  const handleSalvarValorMinimo = async (pedidoId, valorMinimoStr) => {
    try {
      setIsSalvando(true);
      await api.patch(`/api/pedidos/${pedidoId}/valor-minimo`, { valorMinimo: Number(valorMinimoStr) });
      alert('Valor mínimo atualizado com sucesso!');
      fetchDados();
    } catch (error) {
      alert('Erro ao atualizar valor mínimo.');
    } finally {
      setIsSalvando(false);
    }
  };

  const handleSalvarSugestao = async () => {
    if (!novaSugestao.nomeProduto || !novaSugestao.quantidade || !novaSugestao.precoUnitario) {
      alert('Preencha os campos obrigatórios (Nome, Qtd e Preço).');
      return;
    }
    try {
      setIsSalvando(true);
      await api.post(`/api/pedidos/${pedidoAtualSugestao}/sugestoes`, {
        nomeProduto: novaSugestao.nomeProduto,
        quantidade: Number(novaSugestao.quantidade),
        precoUnitario: Number(novaSugestao.precoUnitario),
        observacao: novaSugestao.observacao,
        quantidadeCondicao: (novaSugestao.exibirCondicao && novaSugestao.quantidadeCondicao) ? Number(novaSugestao.quantidadeCondicao) : null,
        precoCondicao: (novaSugestao.exibirCondicao && novaSugestao.precoCondicao) ? Number(novaSugestao.precoCondicao) : null
      });
      alert('Sugestão enviada para a farmácia!');
      setIsSugestaoModalOpen(false);
      setNovaSugestao({ nomeProduto: '', quantidade: '', precoUnitario: '', observacao: '', exibirCondicao: false, quantidadeCondicao: '', precoCondicao: '' });
      setPedidoAtualSugestao(null);
      fetchDados();
    } catch (error) {
      alert('Erro ao enviar sugestão.');
    } finally {
      setIsSalvando(false);
    }
  };

  const handleRemoverSugestao = async (pedidoId, sugestaoId) => {
    if (window.confirm('Excluir esta sugestão?')) {
      try {
        await api.delete(`/api/pedidos/${pedidoId}/sugestoes/${sugestaoId}`);
        fetchDados();
      } catch (error) { alert('Erro ao excluir sugestão.'); }
    }
  };

  const formatarDataHora = (dataIso) => {
    if (!dataIso) return 'N/A'
    const data = new Date(dataIso)
    if (isNaN(data.getTime())) return dataIso
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) + ' às ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const formatarDataCurta = (dataIso) => {
    if (!dataIso) return 'N/A'
    const data = new Date(dataIso)
    if (isNaN(data.getTime())) return dataIso
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
  }

  const fMoney = (v) => v != null ? Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'

  const styles = {
    tabButton: (isActive) => ({ padding: '12px 24px', fontSize: '15px', fontWeight: '600', border: 'none', borderBottom: isActive ? '3px solid var(--primary)' : '3px solid transparent', backgroundColor: 'transparent', color: isActive ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }),
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
    modalContent: { backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '650px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }
  }

  const getBadgeFornecedor = (p) => {
    if (!p) return null;
    const status = p.status || '';
    
    if (status === 'PENDENTE_ENTREGA') {
        const dataCriacao = new Date(p.dataCriacao).getTime();
        const prazoFinal = dataCriacao + (24 * 60 * 60 * 1000); 
        const tempoRestante = prazoFinal - agora;

        if (tempoRestante <= 0) {
            return (
              <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', backgroundColor: 'var(--danger-soft)', color: 'var(--danger-text)', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid var(--danger-border)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                <AlertTriangle size={12} /> ESTOURADO
              </span>
            );
        }

        const horas = Math.floor((tempoRestante % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutos = Math.floor((tempoRestante % (1000 * 60 * 60)) / (1000 * 60));
        const isCritico = horas < 4; 

        return (
           <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', backgroundColor: isCritico ? 'var(--warning-soft)' : 'var(--success-soft)', color: isCritico ? 'var(--warning-text)' : 'var(--success-text)', display: 'flex', alignItems: 'center', gap: '4px', border: `1px solid ${isCritico ? 'var(--warning-border)' : 'var(--success-border)'}`, textAlign: 'center', whiteSpace: 'nowrap' }}>
              ⏳ {horas}h {minutos}m
           </span>
        );
    }

    if (status === 'CANCELADO') return <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', backgroundColor: 'var(--danger-soft)', color: 'var(--danger-text)', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid var(--danger-border)', justifyContent: 'center', whiteSpace: 'nowrap' }}><X size={12} /> CANCELADO</span>;
    if (status === 'CONFIRMADO_FORNECEDOR') return <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', backgroundColor: 'var(--purple-soft)', color: 'var(--purple-text)', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid var(--purple-border)', justifyContent: 'center', textAlign: 'center', whiteSpace: 'nowrap' }}><CheckCircle size={12} /> CONFIRMADO</span>;
    if (status.includes('ENTREGUE') || status.includes('DIVERGENCIA') || status.includes('VALORES') || status.includes('DEVOLUCAO')) return <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', backgroundColor: 'var(--success-soft)', color: 'var(--success-text)', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid var(--success-border)', justifyContent: 'center', textAlign: 'center', whiteSpace: 'nowrap' }}><CheckCircle size={12} /> ENTREGUE</span>;
    
    return <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', backgroundColor: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)', textAlign: 'center', whiteSpace: 'nowrap' }}>{status}</span>;
  }

  const cotacoesVisiveis = cotacoes.filter(vinculo => {
      const statusGlobal = vinculo.cotacao ? vinculo.cotacao.status : null;
      return statusGlobal !== 'FINALIZADA' && statusGlobal !== 'CANCELADA';
  });

  const pedidosVisiveis = pedidos.filter(pedido => {
      const isAndamento = ['PENDENTE_ENTREGA', 'CONFIRMADO_FORNECEDOR'].includes(pedido.status);
      return subAbaPedidos === 'ANDAMENTO' ? isAndamento : !isAndamento;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--surface-muted)', display: 'flex', flexDirection: 'column', fontFamily: "'Segoe UI', sans-serif" }}>
      <style>{`
        @media (max-width: 768px) {
          .dash-header { padding: 12px 16px !important; flex-direction: column; gap: 12px; align-items: flex-start !important; }
          .dash-main { padding: 16px !important; }
          
          .mobile-table-wrapper { overflow: hidden !important; border-radius: 8px; width: 100%; }
          .responsive-table { width: 100% !important; table-layout: auto !important; }
          
          .responsive-table th, .responsive-table td { padding: 10px 6px !important; font-size: 11px !important; }
          .col-produto { white-space: normal !important; word-break: break-word !important; width: 100% !important; }
          .col-nowrap { white-space: nowrap !important; word-break: normal !important; width: 1% !important; }
          .col-center { text-align: center !important; }
          .col-right { text-align: right !important; }
        }
      `}</style>

      {showPrimeiroAcesso && (
        <div style={styles.modalOverlay}>
            <div style={{ backgroundColor: 'var(--surface)', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                    <div style={{ backgroundColor: 'var(--primary-soft)', padding: '12px', borderRadius: '50%' }}>
                        <Edit2 size={32} color="var(--info)" />
                    </div>
                </div>
                <h3 style={{ margin: '0 0 10px 0', color: 'var(--text)', fontSize: '20px' }}>Bem-vindo(a)! 🎉</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5' }}>
                    Como este é o seu primeiro acesso (ou sua senha foi redefinida), por favor, crie uma nova senha (PIN) para continuar.
                </p>
                <div style={{ textAlign: 'left', marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '8px' }}>Nova Senha / PIN *</label>
                    <input 
                        type="password" 
                        value={novaSenha}
                        onChange={e => setNovaSenha(e.target.value)}
                        placeholder="Mínimo de 4 dígitos"
                        style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-strong)', outline: 'none', fontSize: '15px', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '4px' }}
                        maxLength={20}
                    />
                </div>
                <button 
                    onClick={salvarNovaSenha}
                    disabled={salvandoSenha}
                    style={{ width: '100%', padding: '14px', background: 'var(--info)', border: 'none', borderRadius: '8px', fontWeight: 'bold', color: 'white', cursor: 'pointer', fontSize: '15px', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)' }}
                >
                    {salvandoSenha ? 'Salvando...' : 'Salvar Nova Senha'}
                </button>
            </div>
        </div>
      )}

      <header className="dash-header" style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/assets/logo-torres.png" alt="Drogaria Torres Farma" style={{ height: '32px' }} />
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text)', margin: 0 }}>Portal do Fornecedor</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '500' }}>Olá, <strong style={{ color: 'var(--text)' }}>{nomeUsuario}</strong></span>
          <button
            type="button"
            onClick={() => navigate('/inicio')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: '600', cursor: 'pointer' }}
            title="Ir para a página inicial"
          >
            <Home size={18} /> Início
          </button>
          <ThemeToggle compact />
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--danger)', fontWeight: '600', cursor: 'pointer' }}><LogOut size={18} /> Sair</button>
        </div>
      </header>

      <div style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 32px' }}>
        <div style={{ display: 'flex', gap: '20px', maxWidth: '1200px', margin: '0 auto', overflowX: 'auto' }}>
          <button style={styles.tabButton(activeTab === 'cotacoes')} onClick={() => setActiveTab('cotacoes')}><FileText size={18} /> Cotações</button>
          <button style={styles.tabButton(activeTab === 'pedidos')} onClick={() => setActiveTab('pedidos')}><PackageSearch size={18} /> Meus Pedidos</button>
        </div>
      </div>

      <main className="dash-main" style={{ flex: 1, padding: '32px', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text)', margin: 0 }}>
            {activeTab === 'cotacoes' ? 'Cotações Ativas' : 'Meus Pedidos'}
          </h2>
        </div>

        {activeTab === 'pedidos' && !loading && (
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', backgroundColor: 'var(--border)', padding: '4px', borderRadius: '8px', width: 'fit-content', flexWrap: 'wrap' }}>
              <button 
                onClick={() => setSubAbaPedidos('ANDAMENTO')}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', backgroundColor: subAbaPedidos === 'ANDAMENTO' ? 'var(--surface)' : 'transparent', color: subAbaPedidos === 'ANDAMENTO' ? 'var(--primary)' : 'var(--text-muted)', boxShadow: subAbaPedidos === 'ANDAMENTO' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
              >
                Em Andamento
              </button>
              <button 
                onClick={() => setSubAbaPedidos('HISTORICO')}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', backgroundColor: subAbaPedidos === 'HISTORICO' ? 'var(--surface)' : 'transparent', color: subAbaPedidos === 'HISTORICO' ? 'var(--success)' : 'var(--text-muted)', boxShadow: subAbaPedidos === 'HISTORICO' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
              >
                Histórico (Encerrados)
              </button>
            </div>
        )}

        {loading ? (
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Buscando dados...</div>
        ) : (
          activeTab === 'cotacoes' ? (
            cotacoesVisiveis.length === 0 ? (
              <div style={{ backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <FileText size={48} color="var(--border-strong)" style={{ marginBottom: '16px' }} />
                <p style={{ margin: 0, fontSize: '16px' }}>Nenhuma cotação ativa enviada para você no momento.</p>
              </div>
            ) : (
              <div className="mobile-table-wrapper" style={{ backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: 'var(--surface-muted)', borderBottom: '1px solid var(--border)' }}>
                      <tr>
                        <th className="col-nowrap" style={{ padding: '12px 10px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '12px' }}>ID</th>
                        <th className="col-nowrap col-center" style={{ padding: '12px 10px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '12px', textAlign: 'center' }}>Data</th>
                        <th className="col-nowrap col-center" style={{ padding: '12px 10px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '12px', textAlign: 'center' }}>Status</th>
                        <th className="col-produto col-center" style={{ padding: '12px 10px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '12px', textAlign: 'center' }}>Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cotacoesVisiveis.map((vinculo) => {
                        const idCotacao = vinculo.cotacao ? vinculo.cotacao.id : vinculo.id
                        const dataEnvio = vinculo.cotacao ? vinculo.cotacao.dataCriacao || vinculo.dataEnvio : vinculo.dataEnvio
                        const status = vinculo.status || 'PENDENTE'
                        const isRespondida = status === 'RESPONDIDA'

                        return (
                          <tr key={vinculo.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td className="col-nowrap" style={{ padding: '12px 10px', fontWeight: '600', color: 'var(--text-secondary)' }}>#{idCotacao}</td>
                            <td className="col-nowrap col-center" style={{ padding: '12px 10px', color: 'var(--text-muted)', textAlign: 'center' }}>{formatarDataCurta(dataEnvio)}</td>
                            <td className="col-nowrap col-center" style={{ padding: '12px 10px', textAlign: 'center' }}>
                              <span style={{ padding: '3px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', backgroundColor: isRespondida ? 'var(--success-soft)' : 'var(--warning-soft)', color: isRespondida ? 'var(--success)' : 'var(--warning-text)', display: 'inline-block', textAlign: 'center', lineHeight: '1.2' }}>
                                {isRespondida ? 'Respondida' : 'Pendente'}
                              </span>
                            </td>
                            <td className="col-produto col-center" style={{ padding: '12px 10px', textAlign: 'center' }}>
                              <button onClick={() => navigate(`/responder-cotacao/${idCotacao}`)} style={{ backgroundColor: isRespondida ? 'var(--primary)' : 'var(--success)', color: 'white', padding: '6px 8px', borderRadius: '4px', border: 'none', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', width: '100%', justifyContent: 'center', fontSize: '11px', whiteSpace: 'nowrap' }}>
                                {isRespondida ? <Edit2 size={12}/> : <FileText size={12}/>}
                                {isRespondida ? 'Ver/Editar' : 'Responder'}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
            )
          ) : (
            pedidosVisiveis.length === 0 ? (
              <div style={{ backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <PackageSearch size={48} color="var(--border-strong)" style={{ marginBottom: '16px' }} />
                <p style={{ margin: 0, fontSize: '16px' }}>Nenhum pedido {subAbaPedidos === 'ANDAMENTO' ? 'em andamento' : 'no histórico'} encontrado.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {pedidosVisiveis.map((pedido) => {
                  const badge = getBadgeFornecedor(pedido);
                  const isExpanded = expandedPedidos[pedido.id];
                  const idCotacaoOrigem = pedido.cotacao?.id || pedido.cotacaoId;
                  const valorMinimoSalvo = pedido.valorMinimoFaturamento || 0;
                  const somaSugestoes = pedido.sugestoes?.reduce((acc, s) => acc + (s.quantidade * s.precoUnitario), 0) || 0;
                  const totalConsiderado = pedido.valorTotalPedido + somaSugestoes;
                  const faltaParaMinimo = valorMinimoSalvo > 0 ? valorMinimoSalvo - totalConsiderado : 0;
                  const atingiuMinimo = valorMinimoSalvo > 0 && totalConsiderado >= valorMinimoSalvo;
                  const pctProgresso = valorMinimoSalvo > 0 ? (totalConsiderado / valorMinimoSalvo) * 100 : 0;

                  return (
                    <div key={pedido.id} style={{ backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      
                      <div 
                        onClick={() => togglePedidoExpandido(pedido.id)}
                        style={{ backgroundColor: isExpanded ? 'var(--surface-muted)' : 'var(--surface)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', cursor: 'pointer', transition: 'background-color 0.2s' }}
                      >
                        <div style={{ minWidth: '150px' }}>
                          <h3 style={{ margin: '0 0 4px 0', color: 'var(--text)', fontSize: '18px', fontWeight: '800' }}>Pedido #{pedido.id}</h3>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Data: {formatarDataHora(pedido.dataCriacao)}</span>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Valor Total</div>
                            <span style={{ fontWeight: '900', fontSize: '16px', color: 'var(--success)', whiteSpace: 'nowrap' }}>{fMoney(pedido.valorTotalPedido)}</span>
                          </div>
                          
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            {badge}
                          </div>

                          <button style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--info)', fontWeight: '700', fontSize: '13px', cursor: 'pointer', padding: '6px' }}>
                             {isExpanded ? <><ChevronUp size={18}/> Ocultar</> : <><ChevronDown size={18}/> Detalhes</>}
                          </button>
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div style={{ borderTop: '1px solid var(--border)' }}>
                          
                          <div className="action-buttons-container" style={{ padding: '12px 20px', backgroundColor: 'var(--surface)', display: 'flex', gap: '10px', flexWrap: 'wrap', borderBottom: '1px solid var(--border)' }}>
                            {idCotacaoOrigem && (
                               <button onClick={() => navigate(`/responder-cotacao/${idCotacaoOrigem}`)} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--surface)', color: 'var(--purple-text)', padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--purple-border)', fontWeight: '600', cursor: 'pointer', fontSize: '13px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', whiteSpace: 'nowrap' }}>
                                 <Edit2 size={16} /> Editar Cotação Origem
                               </button>
                            )}

                            {pedido.status === 'PENDENTE_ENTREGA' && (
                              <>
                                <button 
                                  onClick={() => { setPedidoAtualSugestao(pedido.id); setIsSugestaoModalOpen(true); }}
                                  style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--info)', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: '600', cursor: 'pointer', fontSize: '13px', boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)', whiteSpace: 'nowrap' }}
                                >
                                  <PlusCircle size={16} /> Adicionar Sugestão
                                </button>

                                <button onClick={() => abrirModalConfirmacao(pedido)} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--success)', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)', whiteSpace: 'nowrap' }}>
                                  <CheckCircle size={16} /> Confirmar Separação
                                </button>
                              </>
                            )}
                          </div>

                          <div style={{ backgroundColor: 'var(--warning-soft)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                            <div style={{ flex: 1, minWidth: '100%' }}>
                              <h4 style={{ margin: '0 0 10px 0', color: 'var(--warning-text)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}><TrendingUp size={16}/> Acompanhamento do Mínimo</h4>
                              <div style={{ display: 'flex', gap: '10px', fontSize: '12px', color: 'var(--warning-text)', marginBottom: '12px', flexWrap: 'wrap' }}>
                                <span>Pedido: <strong style={{whiteSpace: 'nowrap'}}>{fMoney(pedido.valorTotalPedido)}</strong></span>
                                {somaSugestoes > 0 && <span>+ Sugestões: <strong style={{whiteSpace: 'nowrap'}}>{fMoney(somaSugestoes)}</strong></span>}
                                <span style={{ paddingLeft: '8px', borderLeft: '2px solid var(--warning-border)' }}>Total: <strong style={{whiteSpace: 'nowrap'}}>{fMoney(totalConsiderado)}</strong></span>
                              </div>

                              {valorMinimoSalvo > 0 && (
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px', fontWeight: 'bold', color: atingiuMinimo ? 'var(--success-text)' : 'var(--warning-text)' }}>
                                    <span>{atingiuMinimo ? 'Mínimo Alcançado!' : `Falta ${fMoney(faltaParaMinimo)}`}</span>
                                    <span>{Math.min(pctProgresso, 100).toFixed(0)}%</span>
                                  </div>
                                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--warning-border)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: `${Math.min(pctProgresso, 100)}%`, height: '100%', backgroundColor: atingiuMinimo ? 'var(--success)' : 'var(--warning)', transition: 'width 0.4s ease' }}></div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {pedido.status === 'PENDENTE_ENTREGA' && (
                              <div style={{ display: 'flex', gap: '8px', width: '100%', alignItems: 'center', padding: '10px', backgroundColor: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--warning-border)' }}>
                                <div style={{ flex: 1 }}>
                                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--warning-text)', display: 'block', marginBottom: '4px' }}>Definir Mínimo (R$):</label>
                                  <input 
                                    type="number" step="0.01" placeholder={valorMinimoSalvo || "0,00"}
                                    value={valoresMinimos[pedido.id] !== undefined ? valoresMinimos[pedido.id] : ''}
                                    onChange={(e) => handleValorMinimoChange(pedido.id, e.target.value)}
                                    style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-strong)', width: '100%', outline: 'none', fontSize: '13px', fontWeight: 'bold', color: 'var(--text)', boxSizing: 'border-box' }}
                                  />
                                </div>
                                <button 
                                  onClick={() => handleSalvarValorMinimo(pedido.id, valoresMinimos[pedido.id])}
                                  disabled={isSalvando || !valoresMinimos[pedido.id]}
                                  style={{ backgroundColor: 'var(--warning)', color: 'white', padding: '6px 16px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', height: '34px', marginTop: '18px', opacity: (!valoresMinimos[pedido.id] || isSalvando) ? 0.6 : 1 }}
                                >
                                  Salvar
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="mobile-table-wrapper" style={{ padding: '0', borderTop: '1px solid var(--border)' }}>
                            <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                              <thead>
                                <tr style={{ backgroundColor: 'var(--surface-muted)', borderBottom: '2px solid var(--border)' }}>
                                  <th className="col-produto" style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Produto</th>
                                  <th className="col-nowrap col-center" style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '11px', textAlign: 'center', textTransform: 'uppercase' }}>Qtd</th>
                                  <th className="col-nowrap col-right" style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '11px', textAlign: 'right', textTransform: 'uppercase' }}>Unitário</th>
                                  <th className="col-nowrap col-right" style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '11px', textAlign: 'right', textTransform: 'uppercase' }}>Subtotal</th>
                                </tr>
                              </thead>
                              <tbody>
                                {pedido.sugestoes && pedido.sugestoes.map(sug => (
                                  <tr key={`sug-${sug.id}`} style={{ borderBottom: '1px solid var(--surface-muted)', backgroundColor: 'var(--warning-soft)' }}>
                                    <td className="col-produto" style={{ padding: '10px 12px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '9px', backgroundColor: 'var(--warning)', color: 'white', padding: '2px 4px', borderRadius: '4px', fontWeight: 'bold' }}>SUGESTÃO</span>
                                      </div>
                                      <span style={{ color: 'var(--warning-text)', fontWeight: '700', fontSize: '13px', display: 'block' }}>{sug.nomeProduto}</span>
                                      
                                      {sug.precoCondicao && (
                                         <div style={{ fontSize: '11px', color: 'var(--success-text)', marginTop: '4px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'flex-start', gap: '4px' }}>
                                            <Tags size={12} style={{marginTop: '2px', flexShrink: 0}}/> Condição: {sug.quantidadeCondicao} un por {fMoney(sug.precoCondicao)}
                                         </div>
                                      )}
                                    </td>
                                    <td className="col-nowrap col-center" style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--warning-text)', fontWeight: '600', fontSize: '12px' }}>{sug.quantidade}</td>
                                    <td className="col-nowrap col-right" style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--warning-text)', fontSize: '12px' }}>{fMoney(sug.precoUnitario)}</td>
                                    <td className="col-nowrap col-right" style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '800', color: 'var(--success)', fontSize: '12px' }}>{fMoney(sug.quantidade * sug.precoUnitario)}</td>
                                  </tr>
                                ))}

                                {pedido.itens.map(item => (
                                  <tr key={item.id} style={{ borderBottom: '1px solid var(--surface-muted)' }}>
                                    <td className="col-produto" style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '12px' }}>
                                      <span style={{display: 'block'}}>{item.nomeProduto}</span>
                                      {item.condicaoAplicada && (
                                        <div style={{ fontSize: '10px', color: 'var(--success-text)', backgroundColor: 'var(--success-soft)', padding: '2px 6px', borderRadius: '4px', marginTop: '4px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px', border: '1px solid var(--success-border)' }}>
                                          <Tags size={10} style={{flexShrink: 0}} /> Escalonamento ({item.qtdCondicao} un por {fMoney(item.precoCondicao)})
                                        </div>
                                      )}
                                    </td>
                                    <td className="col-nowrap col-center" style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600' }}>{item.quantidadePedida}</td>
                                    <td className="col-nowrap col-right" style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '12px' }}>{fMoney(item.valorUnitarioPedido)}</td>
                                    <td className="col-nowrap col-right" style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '800', color: 'var(--text)', fontSize: '12px' }}>{fMoney(item.quantidadePedida * item.valorUnitarioPedido)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          )
        )}
      </main>

      {isSugestaoModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={{...styles.modalContent, maxWidth: '400px'}}>
            <h3 style={{ margin: '0 0 20px 0', color: 'var(--text)' }}>Sugerir Produto / Promoção</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Nome do Produto *</label>
                <input type="text" value={novaSugestao.nomeProduto} onChange={e => setNovaSugestao({...novaSugestao, nomeProduto: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-strong)', borderRadius: '6px', marginTop: '4px', boxSizing: 'border-box' }} placeholder="Ex: Tadalafila Genérico c/ 30"/>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Qtd Sugerida *</label>
                  <input type="number" min="1" value={novaSugestao.quantidade} onChange={e => setNovaSugestao({...novaSugestao, quantidade: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-strong)', borderRadius: '6px', marginTop: '4px', boxSizing: 'border-box' }}/>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Preço Unitário R$ *</label>
                  <input type="number" step="0.01" min="0.01" value={novaSugestao.precoUnitario} onChange={e => setNovaSugestao({...novaSugestao, precoUnitario: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-strong)', borderRadius: '6px', marginTop: '4px', boxSizing: 'border-box' }}/>
                </div>
              </div>

              <div>
                  <button type="button" onClick={() => setNovaSugestao(p => ({...p, exibirCondicao: !p.exibirCondicao}))} style={{ background: 'none', border: 'none', color: 'var(--success)', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}>
                      <Tags size={14} /> {novaSugestao.exibirCondicao ? 'Remover Condição' : 'Adicionar Condição / Escalonamento'}
                  </button>
                  {novaSugestao.exibirCondicao && (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginTop: '6px', padding: '10px', backgroundColor: 'var(--success-soft)', borderRadius: '6px', border: '1px dashed var(--success)' }}>
                          <span style={{ fontSize: '12px', color: 'var(--success-text)', fontWeight: 'bold' }}>Na compra de</span>
                          <input type="number" min="2" placeholder="Qtd" style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--success-border)', fontSize: '13px', width: '70px', textAlign: 'center', outline: 'none' }} value={novaSugestao.quantidadeCondicao} onChange={e => setNovaSugestao(p => ({...p, quantidadeCondicao: e.target.value}))}/>
                          <span style={{ fontSize: '12px', color: 'var(--success-text)', fontWeight: 'bold' }}>un, sai por R$</span>
                          <input type="number" step="0.01" placeholder="Valor" style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--success-border)', fontSize: '13px', width: '70px', textAlign: 'center', outline: 'none' }} value={novaSugestao.precoCondicao} onChange={e => setNovaSugestao(p => ({...p, precoCondicao: e.target.value}))}/>
                      </div>
                  )}
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Observação (Opcional)</label>
                <textarea value={novaSugestao.observacao} onChange={e => setNovaSugestao({...novaSugestao, observacao: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid var(--border-strong)', borderRadius: '6px', marginTop: '4px', boxSizing: 'border-box', resize: 'vertical', minHeight: '60px' }} placeholder="Ex: Vence em 3 meses, por isso o desconto."></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button onClick={() => { setIsSugestaoModalOpen(false); setPedidoAtualSugestao(null); }} style={{ padding: '10px 16px', background: 'var(--surface-muted)', border: 'none', borderRadius: '6px', fontWeight: 'bold', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancelar</button>
                <button onClick={handleSalvarSugestao} disabled={isSalvando} style={{ padding: '10px 16px', background: 'var(--info)', border: 'none', borderRadius: '6px', fontWeight: 'bold', color: 'white', cursor: 'pointer' }}>{isSalvando ? 'Enviando...' : 'Enviar Sugestão'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {pedidoConfirmacao && (
        <div style={styles.modalOverlay}>
          <div style={{...styles.modalContent, maxWidth: '700px', padding: '0'}}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--surface)', borderRadius: '12px 12px 0 0' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text)', fontWeight: 'bold' }}>Confirmar Separação - Pedido #{pedidoConfirmacao.id}</h3>
              <button onClick={() => setPedidoConfirmacao(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            
            <div style={{ padding: '16px 24px', backgroundColor: 'var(--surface-muted)', borderBottom: '1px solid var(--border)' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                Desmarque os itens que estiverem <strong style={{ color: 'var(--danger)' }}>em falta</strong> no seu estoque. Os itens desmarcados serão removidos do pedido.
              </p>
            </div>

            <div className="mobile-table-wrapper" style={{ maxHeight: '350px', overflowY: 'auto', backgroundColor: 'var(--surface)' }}>
              <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: 'var(--surface-muted)', position: 'sticky', top: 0, zIndex: 1, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  <tr>
                    <th className="col-nowrap col-center" style={{ padding: '10px', width: '1%' }}>✓</th>
                    <th className="col-produto" style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold' }}>Produto</th>
                    <th className="col-nowrap col-center" style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '11px', textAlign: 'center', textTransform: 'uppercase', fontWeight: 'bold' }}>Qtd</th>
                    <th className="col-nowrap col-right" style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '11px', textAlign: 'right', textTransform: 'uppercase', fontWeight: 'bold' }}>Unitário</th>
                    <th className="col-nowrap col-right" style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '11px', textAlign: 'right', textTransform: 'uppercase', fontWeight: 'bold' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidoConfirmacao.itens.map(item => {
                    const isChecked = checklistEstoque[item.id] ?? true;
                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--surface-muted)', backgroundColor: isChecked ? 'var(--surface)' : 'var(--surface-muted)', opacity: isChecked ? 1 : 0.5, transition: 'background-color 0.2s, opacity 0.2s' }}>
                        <td className="col-nowrap col-center" style={{ padding: '10px' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={e => setChecklistEstoque(prev => ({ ...prev, [item.id]: e.target.checked }))}
                            style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                          />
                        </td>
                        <td className="col-produto" style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text)', fontWeight: '600' }}>
                          <label style={{cursor: 'pointer', display: 'block'}} onClick={() => setChecklistEstoque(prev => ({ ...prev, [item.id]: !isChecked }))}>
                            {item.nomeProduto}
                          </label>
                        </td>
                        <td className="col-nowrap col-center" style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {item.quantidadePedida} un
                        </td>
                        <td className="col-nowrap col-right" style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                          {fMoney(item.valorUnitarioPedido)}
                        </td>
                        <td className="col-nowrap col-right" style={{ padding: '10px 12px', fontSize: '12px', fontWeight: 'bold', color: isChecked ? 'var(--success)' : 'var(--text-subtle)' }}>
                          {fMoney(item.quantidadePedida * item.valorUnitarioPedido)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div style={{ padding: '20px 24px', backgroundColor: 'var(--surface-muted)', borderRadius: '0 0 12px 12px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 'bold', marginRight: '10px' }}>Total Confirmado: </span>
                <span style={{ fontSize: '20px', color: 'var(--success)', fontWeight: '900' }}>
                  {fMoney(pedidoConfirmacao.itens.reduce((acc, item) => {
                    if (checklistEstoque[item.id] ?? true) {
                       return acc + (item.quantidadePedida * item.valorUnitarioPedido);
                    }
                    return acc;
                  }, 0))}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button onClick={() => setPedidoConfirmacao(null)} disabled={salvandoConfirmacao} style={{ padding: '10px 20px', background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: '6px', fontWeight: 'bold', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancelar</button>
                <button onClick={processarConfirmacaoPedido} disabled={salvandoConfirmacao} style={{ padding: '10px 20px', background: 'var(--success)', border: 'none', borderRadius: '6px', fontWeight: 'bold', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {salvandoConfirmacao ? 'Processando...' : 'Confirmar Envio'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  tabButton: (isActive) => ({ padding: '12px 24px', fontSize: '15px', fontWeight: '600', border: 'none', borderBottom: isActive ? '3px solid var(--primary)' : '3px solid transparent', backgroundColor: 'transparent', color: isActive ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }),
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
  modalContent: { backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '650px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }
}