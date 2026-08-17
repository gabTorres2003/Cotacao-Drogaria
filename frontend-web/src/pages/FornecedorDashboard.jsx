import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, PackageSearch, FileText, CheckCircle, AlertTriangle, X, Edit2, DollarSign, PlusCircle, Trash2, Tag, TrendingUp, Tags } from 'lucide-react'
import api from '../services/api'

export default function FornecedorDashboard() {
  const [cotacoes, setCotacoes] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('cotacoes') 
  
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

  const navigate = useNavigate()
  const nomeUsuario = localStorage.getItem('nomeUsuario') || 'Fornecedor'
  const usuarioId = localStorage.getItem('usuarioId')

  useEffect(() => {
    fetchDados()
  }, [usuarioId, activeTab])

  const fetchDados = async () => {
    setLoading(true)
    try {
      if (usuarioId) {
        if (activeTab === 'cotacoes') {
          const response = await api.get(`/api/cotacao-fornecedor/fornecedor/${usuarioId}`)
          setCotacoes(response.data)
        } else {
          const response = await api.get(`/api/pedidos/fornecedor/${usuarioId}`)
          setPedidos(response.data)
        }
      }
    } catch (error) {
      console.error(`Erro ao buscar ${activeTab}`, error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    localStorage.clear()
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
    if (!dataIso) return 'Data não informada'
    const data = new Date(dataIso)
    if (isNaN(data.getTime())) return dataIso
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' às ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const fMoney = (v) => v != null ? Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'

  const styles = {
    tabButton: (isActive) => ({ padding: '12px 24px', fontSize: '15px', fontWeight: '600', border: 'none', borderBottom: isActive ? '3px solid #2563eb' : '3px solid transparent', backgroundColor: 'transparent', color: isActive ? '#2563eb' : '#64748b', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }),
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '650px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }
  }

  const getBadgeFornecedor = (status) => {
    if (status === 'PENDENTE_ENTREGA') return null;
    if (status === 'CONFIRMADO_FORNECEDOR') return <span style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', backgroundColor: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #c7d2fe' }}><CheckCircle size={16} /> CONFIRMADO NA FÁBRICA</span>;
    if (status.includes('ENTREGUE') || status.includes('DIVERGENCIA') || status.includes('VALORES') || status.includes('DEVOLUCAO')) return <span style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', backgroundColor: '#dcfce7', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #86efac' }}><CheckCircle size={16} /> ENTREGUE NA FARMÁCIA</span>;
    return <span style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', backgroundColor: '#f3f4f6', color: '#4b5563', border: '1px solid #e5e7eb' }}>{status}</span>;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', fontFamily: "'Segoe UI', sans-serif" }}>
      <style>{`
        @media (max-width: 768px) {
          .dash-header { padding: 12px 16px !important; flex-direction: column; gap: 12px; align-items: flex-start !important; }
          .dash-main { padding: 16px !important; }
          .table-container { overflow-x: auto !important; display: block !important; }
          .pedido-scroll { overflow-x: auto; }
        }
      `}</style>

      <header className="dash-header" style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/assets/logo-torres.png" alt="Drogaria Torres Farma" style={{ height: '32px' }} />
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Portal do Fornecedor</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Olá, <strong style={{ color: '#0f172a' }}>{nomeUsuario}</strong></span>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#ef4444', fontWeight: '600', cursor: 'pointer' }}><LogOut size={18} /> Sair</button>
        </div>
      </header>

      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 32px' }}>
        <div style={{ display: 'flex', gap: '20px', maxWidth: '1200px', margin: '0 auto', overflowX: 'auto' }}>
          <button style={styles.tabButton(activeTab === 'cotacoes')} onClick={() => setActiveTab('cotacoes')}><FileText size={18} /> Cotações</button>
          <button style={styles.tabButton(activeTab === 'pedidos')} onClick={() => setActiveTab('pedidos')}><PackageSearch size={18} /> Meus Pedidos</button>
        </div>
      </div>

      <main className="dash-main" style={{ flex: 1, padding: '32px', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 8px 0' }}>{activeTab === 'cotacoes' ? 'Cotações Ativas' : 'Meus Pedidos'}</h2>
        </div>

        {loading ? (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '40px', textAlign: 'center', color: '#64748b' }}>Buscando dados...</div>
        ) : (
          activeTab === 'cotacoes' ? (
            cotacoes.length === 0 ? (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '40px 24px', textAlign: 'center', color: '#64748b' }}>
                <FileText size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
                <p style={{ margin: 0, fontSize: '16px' }}>Nenhuma cotação ativa enviada para você no momento.</p>
              </div>
            ) : (
              <>
                <div className="table-container" style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                    <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <tr>
                        <th style={{ padding: '16px 24px', color: '#64748b', fontWeight: '600', fontSize: '13px' }}>ID Cotação</th>
                        <th style={{ padding: '16px 24px', color: '#64748b', fontWeight: '600', fontSize: '13px' }}>Data de Envio</th>
                        <th style={{ padding: '16px 24px', color: '#64748b', fontWeight: '600', fontSize: '13px' }}>Status</th>
                        <th style={{ padding: '16px 24px', color: '#64748b', fontWeight: '600', fontSize: '13px', textAlign: 'right' }}>Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cotacoes.map((vinculo) => {
                        const idCotacao = vinculo.cotacao ? vinculo.cotacao.id : vinculo.id
                        const dataEnvio = vinculo.cotacao ? vinculo.cotacao.dataCriacao || vinculo.dataEnvio : vinculo.dataEnvio
                        const status = vinculo.status || 'PENDENTE'
                        const isRespondida = status === 'RESPONDIDA'

                        return (
                          <tr key={vinculo.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '16px 24px', fontWeight: '600', color: '#334155' }}>#{idCotacao}</td>
                            <td style={{ padding: '16px 24px', color: '#64748b' }}>{formatarDataHora(dataEnvio)}</td>
                            <td style={{ padding: '16px 24px' }}>
                              <span style={{ padding: '4px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: '600', backgroundColor: isRespondida ? '#dcfce7' : '#fef3c7', color: isRespondida ? '#15803d' : '#b45309' }}>{isRespondida ? 'Respondida' : 'Pendente'}</span>
                            </td>
                            <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                              <button onClick={() => navigate(`/responder-cotacao/${idCotacao}`)} style={{ backgroundColor: isRespondida ? '#2563eb' : '#16a34a', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                {isRespondida ? 'Ver / Editar' : 'Responder'}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )
          ) : (
            pedidos.length === 0 ? (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '40px 24px', textAlign: 'center', color: '#64748b' }}>
                <PackageSearch size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
                <p style={{ margin: 0, fontSize: '16px' }}>Nenhum pedido de compra aprovado para você ainda.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {pedidos.map((pedido) => {
                  const badge = getBadgeFornecedor(pedido.status);
                  const idCotacaoOrigem = pedido.cotacao?.id || pedido.cotacaoId;
                  const valorMinimoSalvo = pedido.valorMinimoFaturamento || 0;
                  const somaSugestoes = pedido.sugestoes?.reduce((acc, s) => acc + (s.quantidade * s.precoUnitario), 0) || 0;
                  const totalConsiderado = pedido.valorTotalPedido + somaSugestoes;
                  const faltaParaMinimo = valorMinimoSalvo > 0 ? valorMinimoSalvo - totalConsiderado : 0;
                  const atingiuMinimo = valorMinimoSalvo > 0 && totalConsiderado >= valorMinimoSalvo;
                  const pctProgresso = valorMinimoSalvo > 0 ? (totalConsiderado / valorMinimoSalvo) * 100 : 0;

                  return (
                    <div key={pedido.id} style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                      <div style={{ backgroundColor: '#f8fafc', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                        <div>
                          <h3 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '20px', fontWeight: '800' }}>Pedido #{pedido.id}</h3>
                          <span style={{ fontSize: '14px', color: '#64748b' }}>Data: {formatarDataHora(pedido.dataCriacao)}</span>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#16a34a' }}>{fMoney(pedido.valorTotalPedido)}</span>
                          
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {idCotacaoOrigem && (
                               <button onClick={() => navigate(`/responder-cotacao/${idCotacaoOrigem}`)} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'white', color: '#4338ca', padding: '8px 16px', borderRadius: '6px', border: '1px solid #c7d2fe', fontWeight: '600', cursor: 'pointer', fontSize: '13px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                 <Edit2 size={16} /> Editar Cotação Origem
                               </button>
                            )}

                            {pedido.status === 'PENDENTE_ENTREGA' && (
                              <button 
                                onClick={() => { setPedidoAtualSugestao(pedido.id); setIsSugestaoModalOpen(true); }}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#3b82f6', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: '600', cursor: 'pointer', fontSize: '13px', boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)' }}
                              >
                                <PlusCircle size={16} /> Adicionar Sugestão
                              </button>
                            )}

                            {badge === null ? (
                              <button onClick={() => abrirModalConfirmacao(pedido)} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#10b981', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)' }}>
                                <CheckCircle size={16} /> Confirmar Separação / Envio
                              </button>
                            ) : (
                              badge
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ backgroundColor: '#fff7ed', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                        <div style={{ flex: 1, minWidth: '300px' }}>
                          <h4 style={{ margin: '0 0 10px 0', color: '#9a3412', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px' }}><TrendingUp size={18}/> Acompanhamento do Pedido Mínimo</h4>
                          <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#9a3412', marginBottom: '12px', flexWrap: 'wrap' }}>
                            <span>Itens do Pedido: <strong style={{fontSize: '14px'}}>{fMoney(pedido.valorTotalPedido)}</strong></span>
                            {somaSugestoes > 0 && <span>+ Sugestões: <strong style={{fontSize: '14px'}}>{fMoney(somaSugestoes)}</strong></span>}
                            <span style={{ paddingLeft: '8px', borderLeft: '2px solid #fdba74' }}>Total Considerado: <strong style={{fontSize: '16px'}}>{fMoney(totalConsiderado)}</strong></span>
                          </div>

                          {valorMinimoSalvo > 0 && (
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px', fontWeight: 'bold', color: atingiuMinimo ? '#166534' : '#b45309' }}>
                                <span>{atingiuMinimo ? 'Mínimo Alcançado! 🎉' : `Faltam ${fMoney(faltaParaMinimo)} para atingir o mínimo`}</span>
                                <span>{Math.min(pctProgresso, 100).toFixed(0)}%</span>
                              </div>
                              <div style={{ width: '100%', height: '10px', backgroundColor: '#fed7aa', borderRadius: '5px', overflow: 'hidden' }}>
                                <div style={{ width: `${Math.min(pctProgresso, 100)}%`, height: '100%', backgroundColor: atingiuMinimo ? '#22c55e' : '#f97316', transition: 'width 0.4s ease' }}></div>
                              </div>
                            </div>
                          )}
                        </div>

                        {pedido.status === 'PENDENTE_ENTREGA' && (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', padding: '12px 16px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #fdba74', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <div>
                              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#c2410c', display: 'block', marginBottom: '4px' }}>Definir Mínimo (R$):</label>
                              <input 
                                type="number" step="0.01" placeholder={valorMinimoSalvo || "0,00"}
                                value={valoresMinimos[pedido.id] !== undefined ? valoresMinimos[pedido.id] : ''}
                                onChange={(e) => handleValorMinimoChange(pedido.id, e.target.value)}
                                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '120px', outline: 'none', fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}
                              />
                            </div>
                            <button 
                              onClick={() => handleSalvarValorMinimo(pedido.id, valoresMinimos[pedido.id])}
                              disabled={isSalvando || !valoresMinimos[pedido.id]}
                              style={{ backgroundColor: '#f97316', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', height: '37px', opacity: (!valoresMinimos[pedido.id] || isSalvando) ? 0.6 : 1 }}
                            >
                              Salvar
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="pedido-scroll" style={{ padding: '16px 24px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
                          <thead>
                            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                              <th style={{ padding: '12px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase' }}>Produto</th>
                              <th style={{ padding: '12px', color: '#64748b', fontSize: '13px', textAlign: 'center', textTransform: 'uppercase' }}>Qtd</th>
                              <th style={{ padding: '12px', color: '#64748b', fontSize: '13px', textAlign: 'right', textTransform: 'uppercase' }}>Unitário</th>
                              <th style={{ padding: '12px', color: '#64748b', fontSize: '13px', textAlign: 'right', textTransform: 'uppercase' }}>Subtotal</th>
                              <th style={{ padding: '12px', width: '40px' }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {pedido.sugestoes && pedido.sugestoes.map(sug => (
                              <tr key={`sug-${sug.id}`} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: '#fefce8' }}>
                                <td style={{ padding: '12px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '10px', backgroundColor: '#f59e0b', color: 'white', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>SUGESTÃO EXTRA</span>
                                    <span style={{ fontSize: '11px', color: '#d97706', fontWeight: '700' }}>Aguardando análise da loja</span>
                                  </div>
                                  <span style={{ color: '#9a3412', fontWeight: '700', fontSize: '14px' }}>{sug.nomeProduto}</span>
                                  
                                  {sug.precoCondicao && (
                                     <div style={{ fontSize: '11px', color: '#166534', marginTop: '4px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Tags size={12}/> Condição: Na compra de {sug.quantidadeCondicao} un, sai por {fMoney(sug.precoCondicao)}
                                     </div>
                                  )}
                                  {sug.observacao && <div style={{ fontSize: '12px', color: '#b45309', marginTop: '4px', fontStyle: 'italic' }}>Obs: {sug.observacao}</div>}
                                </td>
                                <td style={{ padding: '12px', textAlign: 'center', color: '#9a3412', fontWeight: '600', fontSize: '14px' }}>{sug.quantidade} un</td>
                                <td style={{ padding: '12px', textAlign: 'right', color: '#9a3412', fontSize: '14px' }}>{fMoney(sug.precoUnitario)}</td>
                                <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: '#16a34a', fontSize: '14px' }}>{fMoney(sug.quantidade * sug.precoUnitario)}</td>
                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                  {pedido.status === 'PENDENTE_ENTREGA' && (
                                    <button onClick={() => handleRemoverSugestao(pedido.id, sug.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}><Trash2 size={18} /></button>
                                  )}
                                </td>
                              </tr>
                            ))}

                            {pedido.itens.map(item => (
                              <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '12px', color: '#334155', fontWeight: '600', fontSize: '14px' }}>{item.nomeProduto}</td>
                                <td style={{ padding: '12px', textAlign: 'center', color: '#475569', fontSize: '14px' }}>{item.quantidadePedida} un</td>
                                <td style={{ padding: '12px', textAlign: 'right', color: '#64748b', fontSize: '14px' }}>{fMoney(item.valorUnitarioPedido)}</td>
                                <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: '#1e293b', fontSize: '14px' }}>{fMoney(item.quantidadePedida * item.valorUnitarioPedido)}</td>
                                <td style={{ padding: '12px' }}></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          )
        )}
      </main>

      {/* MODAL DE ADICIONAR SUGESTÃO */}
      {isSugestaoModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={{...styles.modalContent, maxWidth: '400px'}}>
            <h3 style={{ margin: '0 0 20px 0', color: '#1e293b' }}>Sugerir Produto / Promoção</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Nome do Produto *</label>
                <input type="text" value={novaSugestao.nomeProduto} onChange={e => setNovaSugestao({...novaSugestao, nomeProduto: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '4px', boxSizing: 'border-box' }} placeholder="Ex: Tadalafila Genérico c/ 30"/>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Qtd Sugerida *</label>
                  <input type="number" min="1" value={novaSugestao.quantidade} onChange={e => setNovaSugestao({...novaSugestao, quantidade: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '4px', boxSizing: 'border-box' }}/>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Preço Unitário R$ *</label>
                  <input type="number" step="0.01" min="0.01" value={novaSugestao.precoUnitario} onChange={e => setNovaSugestao({...novaSugestao, precoUnitario: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '4px', boxSizing: 'border-box' }}/>
                </div>
              </div>

              {/* BOX DA NOVA FUNCAO: CONDIÇÃO DE ESCALONAMENTO */}
              <div>
                  <button type="button" onClick={() => setNovaSugestao(p => ({...p, exibirCondicao: !p.exibirCondicao}))} style={{ background: 'none', border: 'none', color: '#16a34a', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}>
                      <Tags size={14} /> {novaSugestao.exibirCondicao ? 'Remover Condição' : 'Adicionar Condição / Escalonamento'}
                  </button>
                  {novaSugestao.exibirCondicao && (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginTop: '6px', padding: '10px', backgroundColor: '#f0fdf4', borderRadius: '6px', border: '1px dashed #4ade80' }}>
                          <span style={{ fontSize: '12px', color: '#166534', fontWeight: 'bold' }}>Na compra de</span>
                          <input type="number" min="2" placeholder="Qtd" style={{ padding: '6px', borderRadius: '4px', border: '1px solid #86efac', fontSize: '13px', width: '70px', textAlign: 'center', outline: 'none' }} value={novaSugestao.quantidadeCondicao} onChange={e => setNovaSugestao(p => ({...p, quantidadeCondicao: e.target.value}))}/>
                          <span style={{ fontSize: '12px', color: '#166534', fontWeight: 'bold' }}>un, sai por R$</span>
                          <input type="number" step="0.01" placeholder="Valor" style={{ padding: '6px', borderRadius: '4px', border: '1px solid #86efac', fontSize: '13px', width: '70px', textAlign: 'center', outline: 'none' }} value={novaSugestao.precoCondicao} onChange={e => setNovaSugestao(p => ({...p, precoCondicao: e.target.value}))}/>
                      </div>
                  )}
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Observação (Opcional)</label>
                <textarea value={novaSugestao.observacao} onChange={e => setNovaSugestao({...novaSugestao, observacao: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '4px', boxSizing: 'border-box', resize: 'vertical', minHeight: '60px' }} placeholder="Ex: Vence em 3 meses, por isso o desconto."></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button onClick={() => { setIsSugestaoModalOpen(false); setPedidoAtualSugestao(null); }} style={{ padding: '10px 16px', background: '#f1f5f9', border: 'none', borderRadius: '6px', fontWeight: 'bold', color: '#475569', cursor: 'pointer' }}>Cancelar</button>
                <button onClick={handleSalvarSugestao} disabled={isSalvando} style={{ padding: '10px 16px', background: '#3b82f6', border: 'none', borderRadius: '6px', fontWeight: 'bold', color: 'white', cursor: 'pointer' }}>{isSalvando ? 'Enviando...' : 'Enviar Sugestão'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}