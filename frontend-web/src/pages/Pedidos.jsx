import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Sidebar from '../components/layout/Sidebar'
import DevolucaoModal from '../components/DevolucaoModal'
import { Eye, Search, Filter, CheckCircle, RotateCcw, Trash2, Loader2, ArrowUpDown, Calendar, MessageCircle } from 'lucide-react'

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [modalDevolucaoAberto, setModalDevolucaoAberto] = useState(false)
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const [pedidosSelecionados, setPedidosSelecionados] = useState([])
  
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
        setPedidosSelecionados(prev => prev.filter(selId => selId !== id));
        alert('Pedido excluído com sucesso!');
        carregarPedidos(); 
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
        carregarPedidos(); 
      } catch (error) {
        alert('Alguns pedidos não puderam ser excluídos. Verifique se possuem devoluções vinculadas no histórico.');
        carregarPedidos(); 
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // NOVO: Mensagem em massa para lista de transmissão
  const handleAvisarEmMassa = () => {
    const horaAtual = new Date().getHours();
    let saudacao = 'Boa noite';
    if (horaAtual >= 5 && horaAtual < 12) saudacao = 'Bom dia';
    else if (horaAtual >= 12 && horaAtual < 18) saudacao = 'Boa tarde';

    const mensagem = `${saudacao}, pessoal! 📦✨\n\nAcabamos de enviar novos pedidos de compra para a tela de pedidos no nosso portal.\n\n🔗 *Acessem o link padrão abaixo, façam o login com o PIN e cliquem na opção "Meus Pedidos" para confirmar o recebimento e checar se há produtos para vocês:*\nhttps://cotacaotorresfarma.netlify.app\n\nFicamos no aguardo das confirmações!`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`, '_blank');
  };

  // NOVO: Mensagem individual para o fornecedor da linha
  const handleAvisarIndividual = (pedido) => {
    const fornecedorNome = pedido.fornecedor?.nome || pedido.fornecedorNome || 'parceiro';
    const telefone = pedido.fornecedor?.telefone || ''; 

    const horaAtual = new Date().getHours();
    let saudacao = 'Boa noite';
    if (horaAtual >= 5 && horaAtual < 12) saudacao = 'Bom dia';
    else if (horaAtual >= 12 && horaAtual < 18) saudacao = 'Boa tarde';

    const mensagem = `${saudacao}, *${fornecedorNome}*! 📦✨\n\nAcabamos de enviar o *Pedido #${pedido.id}* para a sua tela de pedidos no nosso portal.\n\n🔗 *Acesse o link padrão abaixo, faça seu login com o PIN e clique na opção "Meus Pedidos" para nos confirmar o recebimento:*\nhttps://cotacaotorresfarma.netlify.app\n\nFico no aguardo da sua confirmação!`;

    let url = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`;
    
    // Se tiver telefone salvo no banco, já abre o chat direto com a pessoa!
    if (telefone) {
      let telefoneLimpo = telefone.replace(/\D/g, '');
      if (telefoneLimpo.length === 10 || telefoneLimpo.length === 11) telefoneLimpo = `55${telefoneLimpo}`;
      url = `https://api.whatsapp.com/send?phone=${telefoneLimpo}&text=${encodeURIComponent(mensagem)}`;
    }

    window.open(url, '_blank');
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
      const entreguePorTexto = p.fornecedor?.entreguePor ? p.fornecedor.entreguePor.toLowerCase() : '';
      const nfStr = p.numeroNota ? p.numeroNota.toLowerCase() : '';
      
      const matchProduto = p.itens ? p.itens.some(item => item.nomeProduto && item.nomeProduto.toLowerCase().includes(textoBusca)) : false;

      const matchTexto = nomeEmpresa.toLowerCase().includes(textoBusca) || 
                         p.id.toString().includes(textoBusca) || 
                         idCotacaoStr.includes(textoBusca) || 
                         entreguePorTexto.includes(textoBusca) ||
                         nfStr.includes(textoBusca) ||
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
            onClick={() => { setAbaAtiva('ANDAMENTO'); setFiltroStatus('TODOS'); setOrdenacao('RECENTES'); setPedidosSelecionados([]); }}
            style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', backgroundColor: abaAtiva === 'ANDAMENTO' ? 'white' : 'transparent', color: abaAtiva === 'ANDAMENTO' ? '#2563eb' : '#6b7280', boxShadow: abaAtiva === 'ANDAMENTO' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
          >
            Pedidos em Andamento
          </button>
          <button 
            onClick={() => { setAbaAtiva('HISTORICO'); setFiltroStatus('TODOS'); setOrdenacao('RECENTES'); setPedidosSelecionados([]); }}
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
              placeholder="Buscar Pedido, Empresa, NF ou Produto..."
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
              <option value="MAIOR_VALOR">Maior Valor</option>
              <option value="MENOR_VALOR">Menor Valor</option>
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

        {pedidosSelecionados.length > 0 && (
          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', padding: '12px 20px', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', animation: 'fadeIn 0.3s', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ color: '#334155', fontWeight: 'bold', fontSize: '15px' }}>
              {pedidosSelecionados.length} pedido(s) selecionado(s)
            </span>
            <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={handleAvisarEmMassa} 
                  style={{ backgroundColor: '#25D366', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(37, 211, 102, 0.3)' }}
                >
                  <MessageCircle size={18} /> Avisar Fornecedores
                </button>
                <button 
                  onClick={handleExcluirEmMassa} 
                  disabled={isDeleting} 
                  style={{ backgroundColor: '#ef4444', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)' }}
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
                    style={{ transform: 'scale(1.2)', cursor: 'pointer', accentColor: '#3b82f6' }}
                    title="Selecionar/Desmarcar Todos"
                  />
                </th>
                <th style={{ width: '80px' }}>ID</th>
                <th style={{ width: '120px' }}>Cotação</th>
                <th>Empresa (Vendedor)</th>
                <th style={{ width: '100px' }}>NF</th>
                <th>Entregue Por</th>
                <th>Grupos</th>
                <th>Valor Total</th>
                <th style={{ width: '100px' }}>Data</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <Loader2 size={32} className="animate-spin" color="#3b82f6" />
                      <span style={{ fontWeight: '500' }}>Carregando pedidos...</span>
                    </div>
                  </td>
                </tr>
              ) : pedidosProcessados.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>
                    Nenhum pedido encontrado nesta aba.
                  </td>
                </tr>
              ) : (
                pedidosProcessados.map((p) => {
                  const statusInfo = getStatusFormatado(p.status)
                  
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
                  
                  const isAguardando = p.status === 'PENDENTE_ENTREGA' || p.status === 'CONFIRMADO_FORNECEDOR';
                  const valorExibir = (!isAguardando && p.valorTotalReal != null) ? p.valorTotalReal : p.valorTotalPedido;
                  
                  const isSelected = pedidosSelecionados.includes(p.id);

                  return (
                    <tr key={p.id} style={{ backgroundColor: isSelected ? '#f0f9ff' : 'transparent', transition: 'background-color 0.2s' }}>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectPedido(p.id)}
                          style={{ transform: 'scale(1.2)', cursor: 'pointer', accentColor: '#3b82f6' }}
                        />
                      </td>
                      <td><span style={{ fontWeight: 'bold', color: '#374151' }}>#{p.id}</span></td>
                      
                      <td>
                        {idCotacao !== '-' ? (
                          <button 
                            onClick={() => navigate(`/cotacao/${idCotacao}`)}
                            style={{ backgroundColor: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                            title="Ir para a Cotação"
                          >
                            Ver Cot. #{idCotacao}
                          </button>
                        ) : (
                          <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                            -
                          </span>
                        )}
                      </td>

                      <td><span style={{ fontWeight: '600', color: '#111827', fontSize: '14px' }}>{nomeEmpresa}</span></td>
                      <td><span style={{ color: '#4b5563', fontSize: '13px', fontWeight: '600', backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>{p.numeroNota || '-'}</span></td>
                      <td><span style={{ color: '#4b5563', fontSize: '13px', fontWeight: '500' }}>{p.fornecedor?.entreguePor || '-'}</span></td>
                      <td><span style={{ color: '#4b5563', fontSize: '13px' }}>{gruposFormatados}</span></td>
                      <td><span style={{ fontWeight: '600', color: '#16a34a', fontSize: '14px' }}>{fMoney(valorExibir)}</span></td>
                      <td><span style={{ color: '#6b7280', fontSize: '14px' }}>{formatarDataBR(p.dataCriacao)}</span></td>
                      <td><span style={statusInfo.style}>{statusInfo.texto}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn-icon" title="Ver Detalhes" onClick={() => navigate(`/pedidos/${p.id}`)}>
                            <Eye size={18} />
                          </button>
                          
                          {/* NOVO: Botão verde para avisar no WhatsApp na linha individual */}
                          {p.status === 'PENDENTE_ENTREGA' && (
                             <button className="btn-icon" title="Avisar Fornecedor (WhatsApp)" onClick={() => handleAvisarIndividual(p)}>
                               <MessageCircle size={18} color="#25D366" />
                             </button>
                          )}

                          {isAguardando && (
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
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  )
}