import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Sidebar from '../components/layout/Sidebar';
import DevolucaoModal from '../components/DevolucaoModal';
import { ArrowLeft, CheckCircle, RotateCcw, Trash2, CheckSquare, Plus, X, Save, AlertTriangle, Edit2, MessageCircle, TrendingUp, Tag, Eye, Check, Search, Tags, XCircle, Zap, Truck } from 'lucide-react';

export default function PedidoDetalhes() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [pedido, setPedido] = useState(null);
    const [isDevolucaoModalOpen, setIsDevolucaoModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
    const [tipoAdicao, setTipoAdicao] = useState('COTACAO'); 
    const [itensPendentes, setItensPendentes] = useState([]);
    const [novoItem, setNovoItem] = useState({ nomeProduto: '', quantidadePedida: 1, valorUnitarioPedido: '', itemCotacaoId: null });
    const [salvandoItem, setSalvandoItem] = useState(false);
    const [itemParaTrocar, setItemParaTrocar] = useState(null);

    const [isEditandoValores, setIsEditandoValores] = useState(false);
    const [valoresEditados, setValoresEditados] = useState({});

    const [isEditandoReais, setIsEditandoReais] = useState(false);
    const [valoresReaisEditados, setValoresReaisEditados] = useState({});
    
    const [isModalSugestoesAberto, setIsModalSugestoesAberto] = useState(false);
    const [sugestoesEditaveis, setSugestoesEditaveis] = useState({});

    const [codigoDna, setCodigoDna] = useState('');

    const [modalFalhaAberto, setModalFalhaAberto] = useState(false);
    const [motivoFalha, setMotivoFalha] = useState('');
    const [acaoDestino, setAcaoDestino] = useState('ORIGINAL');
    const [cotacoesAtivas, setCotacoesAtivas] = useState([]);
    const [cotacaoDestinoId, setCotacaoDestinoId] = useState('');

    const [agora, setAgora] = useState(new Date().getTime());
    useEffect(() => {
        const interval = setInterval(() => setAgora(new Date().getTime()), 60000); 
        return () => clearInterval(interval);
    }, []);

    const carregarPedido = async () => {
        try {
            const response = await api.get(`/api/pedidos/${id}`);
            setPedido(response.data);
            
            if (response.data.sugestoes) {
                const sugMap = {};
                response.data.sugestoes.forEach(s => {
                    let condAtiva = false;
                    let precoAtual = s.precoUnitario;

                    if (s.quantidadeCondicao && s.precoCondicao && s.quantidade >= s.quantidadeCondicao) {
                        condAtiva = true;
                        precoAtual = s.precoCondicao;
                    }

                    sugMap[s.id] = { 
                        ...s,
                        quantidadeAtualizada: s.quantidade,
                        precoAplicado: precoAtual,
                        condicaoAplicada: condAtiva
                    };
                });
                setSugestoesEditaveis(sugMap);
            }
        } catch (error) {
            console.error('Erro ao carregar pedido:', error);
            alert('Erro ao carregar detalhes do pedido.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarPedido();
    }, [id]);

    const handleExcluirPedido = async () => {
        if (window.confirm('Tem certeza que deseja excluir este pedido permanentemente? Esta ação não pode ser desfeita.')) {
            try {
                await api.delete(`/api/pedidos/${id}`);
                alert('Pedido excluído com sucesso!');
                navigate('/pedidos');
            } catch (error) {
                alert(`Erro ao excluir pedido. Motivo: ${error.response?.data?.message || error.message}`);
            }
        }
    };

    const handleCancelarConfirmacao = async () => {
        if (window.confirm('Tem certeza que deseja cancelar a confirmação deste pedido?\n\nEle voltará para o status "Aguardando Fornecedor" e você poderá adicionar ou editar produtos novamente.')) {
            try {
                await api.patch(`/api/pedidos/${id}/cancelar-confirmacao`);
                alert('Confirmação cancelada com sucesso! O pedido foi reaberto.');
                carregarPedido();
            } catch (error) {
                alert('Erro ao cancelar a confirmação do pedido: ' + (error.response?.data?.message || error.message));
            }
        }
    };

    const handleRefazerConferencia = async () => {
        if (window.confirm('Tem certeza que deseja APAGAR os valores recebidos e REFAZER a conferência cega deste pedido?')) {
            try {
                await api.patch(`/api/pedidos/${id}/refazer-conferencia`);
                alert('Conferência apagada. Você foi redirecionado para lançar a NF novamente.');
                navigate(`/pedidos/${id}/conferir`);
            } catch (error) {
                alert('Erro ao refazer a conferência: ' + (error.response?.data?.message || error.message));
            }
        }
    };

    const handleConferenciaRapida = async () => {
        if (window.confirm('Tem certeza que deseja fazer o recebimento rápido?\n\nIsso confirmará que TODOS os itens chegaram exatamente com as quantidades e valores previstos no pedido.')) {
            try {
                await api.patch(`/api/pedidos/${id}/recebimento-rapido`);
                alert('Recebimento rápido realizado com sucesso!');
                carregarPedido();
            } catch (error) {
                alert('Erro ao processar o recebimento rápido: ' + (error.response?.data?.message || error.message));
            }
        }
    };

    const handleContinuarConferencia = async () => {
        if (window.confirm('Deseja reabrir a conferência deste pedido para continuar lançando o próximo volume?')) {
            try {
                await api.patch(`/api/pedidos/${id}/reabrir-conferencia`);
                navigate(`/pedidos/${id}/conferir`);
            } catch (error) {
                alert('Erro ao reabrir a conferência: ' + (error.response?.data?.message || error.message));
            }
        }
    };

    const handleRemoverItemDoPedido = async (idItem) => {
        if (window.confirm('Deseja remover este produto do pedido? Ele voltará para a cotação como pendente.')) {
            try {
                await api.delete(`/api/pedidos/item/${idItem}`);
                carregarPedido(); 
            } catch (error) {
                alert('Erro ao remover o item: ' + (error.response?.data?.message || error.message));
            }
        }
    };

    const abrirModalFalha = async () => {
        setMotivoFalha('');
        setAcaoDestino('ORIGINAL');
        setCotacaoDestinoId('');
        
        try {
            const res = await api.get('/api/cotacao');
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
            await api.patch(`/api/pedidos/${id}/falha-entrega`, { 
                motivo: motivoFalha,
                acaoDestino: acaoDestino,
                cotacaoDestinoId: cotacaoDestinoId
            });
            alert('Pedido marcado como NÃO ENTREGUE. Os itens foram redirecionados com sucesso!');
            setModalFalhaAberto(false);
            carregarPedido();
        } catch (e) {
            alert('Erro ao registrar falha de entrega: ' + (e.response?.data?.message || e.message));
        }
    };

    const iniciarEdicaoValores = () => {
        const initialEdits = {};
        pedido.itens.forEach(item => {
            initialEdits[item.id] = {
                quantidadePedida: item.quantidadePedida,
                valorUnitarioPedido: item.valorUnitarioPedido,
            };
        });
        setValoresEditados(initialEdits);
        setIsEditandoValores(true);
    };

    const salvarEdicaoValores = async () => {
        try {
            const payload = Object.keys(valoresEditados).map(itemId => ({
                idItemPedido: Number(itemId),
                quantidadePedida: Number(valoresEditados[itemId].quantidadePedida),
                valorUnitarioPedido: Number(valoresEditados[itemId].valorUnitarioPedido)
            }));
            await api.put(`/api/pedidos/${id}/valores-previstos`, payload);
            alert('Valores atualizados com sucesso!');
            setIsEditandoValores(false);
            carregarPedido();
        } catch (error) {
            alert('Erro ao atualizar valores: ' + (error.response?.data?.message || error.message));
        }
    };

    const iniciarEdicaoReais = () => {
        const initialEdits = {};
        pedido.itens.forEach(item => {
            initialEdits[item.id] = {
                quantidadeReal: item.quantidadeReal !== null ? item.quantidadeReal : item.quantidadePedida,
                valorUnitarioReal: item.valorUnitarioReal !== null ? item.valorUnitarioReal : item.valorUnitarioPedido,
            };
        });
        setValoresReaisEditados(initialEdits);
        setIsEditandoReais(true);
    };

    const salvarEdicaoReais = async () => {
        try {
            const payload = Object.keys(valoresReaisEditados).map(itemId => ({
                id: Number(itemId),
                quantidadeReal: Number(valoresReaisEditados[itemId].quantidadeReal),
                valorUnitarioReal: Number(valoresReaisEditados[itemId].valorUnitarioReal)
            }));
            await api.put(`/api/pedidos/${id}/valores-reais`, payload);
            alert('Valores da NF ajustados com sucesso!');
            setIsEditandoReais(false);
            carregarPedido();
        } catch (error) {
            alert('Erro ao ajustar valores reais: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleQtdSugestaoChange = (idSugestao, novaQtd) => {
        setSugestoesEditaveis(prev => {
            const currentSugestao = prev[idSugestao];
            const qtd = Math.max(1, parseInt(novaQtd, 10) || 1);
            let precoAplicado = currentSugestao.precoUnitario;
            let condicaoAtiva = false;
            if (currentSugestao.quantidadeCondicao && currentSugestao.precoCondicao && qtd >= currentSugestao.quantidadeCondicao) {
                precoAplicado = currentSugestao.precoCondicao;
                condicaoAtiva = true;
            }
            return { ...prev, [idSugestao]: { ...currentSugestao, quantidadeAtualizada: qtd, precoAplicado: precoAplicado, condicaoAplicada: condicaoAtiva } };
        });
    };

    const handleForcarAceitarCondicaoSugestao = (idSugestao) => {
        setSugestoesEditaveis(prev => {
            const currentSugestao = prev[idSugestao];
            return { ...prev, [idSugestao]: { ...currentSugestao, quantidadeAtualizada: currentSugestao.quantidadeCondicao, precoAplicado: currentSugestao.precoCondicao, condicaoAplicada: true } };
        });
    };

    const handleAceitarSugestao = async (idSugestao) => {
        const sugOriginal = pedido.sugestoes.find(s => s.id === idSugestao);
        const sugEditada = sugestoesEditaveis[idSugestao] || sugOriginal;

        const qtdFinal = sugEditada.quantidadeAtualizada || sugEditada.quantidade;
        let precoFinal = sugEditada.precoAplicado || sugEditada.precoUnitario;
        let condAtiva = sugEditada.condicaoAplicada || false;

        if (sugEditada.quantidadeCondicao && sugEditada.precoCondicao && qtdFinal >= sugEditada.quantidadeCondicao) {
            precoFinal = sugEditada.precoCondicao;
            condAtiva = true;
        }

        try {
            const payloadNovoItem = {
                nomeProduto: sugEditada.nomeProduto + " (Sugestão Aceita)", quantidadePedida: qtdFinal, valorUnitarioPedido: precoFinal, itemCotacao: null,
                condicaoAplicada: condAtiva, qtdCondicao: sugEditada.quantidadeCondicao || null, precoCondicao: sugEditada.precoCondicao || null
            };
            await api.post(`/api/pedidos/${id}/itens`, payloadNovoItem);
            await api.delete(`/api/pedidos/${id}/sugestoes/${idSugestao}`);
            alert('Sugestão aceita e adicionada ao pedido com sucesso!');
            carregarPedido();
            if (pedido.sugestoes.length === 1) setIsModalSugestoesAberto(false);
        } catch (error) { alert('Erro ao aceitar a sugestão.'); }
    };

    const handleRecusarSugestao = async (idSugestao) => {
        if(window.confirm('Tem certeza que deseja recusar e excluir esta sugestão?')) {
            try { await api.delete(`/api/pedidos/${id}/sugestoes/${idSugestao}`); carregarPedido(); if (pedido.sugestoes.length === 1) setIsModalSugestoesAberto(false); } 
            catch (error) { alert('Erro ao recusar a sugestão.'); }
        }
    };

    const aceitarDivergenciaValor = async () => {
        if (window.confirm('Confirmar o recebimento ignorando as diferenças de valores/impostos? O pedido será marcado como Concluído.')) {
            try { await api.patch(`/api/pedidos/${id}/status`, { status: 'ENTREGUE_SUCESSO' }); alert('Divergência aceita. Pedido concluído!'); carregarPedido(); } 
            catch (error) { alert('Erro ao atualizar o pedido.'); }
        }
    };

    const handleAvisarFornecedor = () => {
      const fornecedorNome = pedido.fornecedor?.nome || pedido.fornecedorNome || 'parceiro';
      const telefone = pedido.fornecedor?.telefone || ''; 
      const horaAtual = new Date().getHours();
      let saudacao = 'Boa noite';
      if (horaAtual >= 5 && horaAtual < 12) saudacao = 'Bom dia';
      else if (horaAtual >= 12 && horaAtual < 18) saudacao = 'Boa tarde';
  
      const mensagem = `${saudacao}, *${fornecedorNome}*! 📦✨\n\nAcabamos de enviar o *Pedido #${pedido.id}* para a sua tela de pedidos no nosso portal.\n\n🔗 *Acesse o link padrão abaixo, faça seu login com o PIN e clique na opção "Meus Pedidos" para visualizar e nos confirmar o recebimento:*\nhttps://cotacaotorresfarma.netlify.app\n\nFico no aguardo da sua confirmação!`;
      let url = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`;
      if (telefone) {
        let telefoneLimpo = telefone.replace(/\D/g, '');
        if (telefoneLimpo.length === 10 || telefoneLimpo.length === 11) telefoneLimpo = `55${telefoneLimpo}`;
        url = `https://api.whatsapp.com/send?phone=${telefoneLimpo}&text=${encodeURIComponent(mensagem)}`;
      }
      window.open(url, '_blank');
    };

    const abrirModalAdicao = async () => {
        setIsAddItemModalOpen(true); 
        setItemParaTrocar(null); 
        setNovoItem({ nomeProduto: '', quantidadePedida: 1, valorUnitarioPedido: '', itemCotacaoId: null }); 
        setCodigoDna('');
        
        if (pedido?.cotacao?.id) {
            setTipoAdicao('COTACAO');
            try { 
                const res = await api.get(`/api/pedidos/cotacao/${pedido.cotacao.id}/itens-pendentes`); 
                setItensPendentes(res.data || []); 
            } 
            catch (error) { console.error("Erro ao buscar itens pendentes:", error); }
        } else {
            setTipoAdicao('DNA'); 
            setItensPendentes([]);
        }
    };

    const handleSelectPendente = (e) => {
        const val = e.target.value;
        if (!val) { setNovoItem({ nomeProduto: '', quantidadePedida: 1, valorUnitarioPedido: '', itemCotacaoId: null }); return; }
        const itemSel = itensPendentes.find(i => String(i.idItem) === String(val));
        if (itemSel) { setNovoItem({ nomeProduto: itemSel.nomeProduto, quantidadePedida: itemSel.quantidade || 1, valorUnitarioPedido: '', itemCotacaoId: itemSel.idItem }); }
    };

    const handleBuscarDna = async () => {
        if (!codigoDna) return;
        try { const res = await api.get(`/api/produtos/buscar?q=${encodeURIComponent(codigoDna.trim())}`); if (res.data) setNovoItem(prev => ({ ...prev, nomeProduto: res.data.descricao })); } 
        catch (error) { alert(`Código DNA ${codigoDna} não encontrado.`); setNovoItem(prev => ({ ...prev, nomeProduto: '' })); }
    };

    const handleSalvarNovoItem = async () => {
        if (!novoItem.nomeProduto || !novoItem.quantidadePedida || !novoItem.valorUnitarioPedido) return alert('Preencha todos os campos do produto.');
        setSalvandoItem(true);
        try {
            const payload = { nomeProduto: novoItem.nomeProduto, quantidadePedida: Number(novoItem.quantidadePedida), valorUnitarioPedido: Number(novoItem.valorUnitarioPedido), itemCotacao: novoItem.itemCotacaoId ? { id: novoItem.itemCotacaoId } : null };
            if (itemParaTrocar) { await api.put(`/api/pedidos/${id}/itens/${itemParaTrocar}/trocar`, payload); alert('Produto trocado com sucesso!'); } 
            else { await api.post(`/api/pedidos/${id}/itens`, payload); alert('Produto adicionado com sucesso!'); }
            setIsAddItemModalOpen(false); 
            carregarPedido();
        } catch (error) { alert('Erro ao processar: ' + (error.response?.data?.message || error.message)); } 
        finally { setSalvandoItem(false); }
    };

    const fMoney = (valor) => valor == null ? '-' : Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const fDataHora = (dataIso) => !dataIso ? '-' : new Date(dataIso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const getStatusExibicao = (pedidoObj) => {
        if (!pedidoObj) return '';
        const status = pedidoObj.status;

        if (status === 'PENDENTE_ENTREGA') {
            const prazoFinal = new Date(pedidoObj.dataCriacao).getTime() + (24 * 60 * 60 * 1000);
            if (prazoFinal - agora <= 0) return 'PRAZO ESTOURADO (> 24H)';
            return 'AGUARDANDO FORNECEDOR';
        }
        if (status === 'CANCELADO') return 'CANCELADO / FALHA NA ENTREGA';
        if (status === 'CONFIRMADO_FORNECEDOR') return 'CONFIRMADO NA FÁBRICA (AGUARDANDO ENTREGA)';
        if (status === 'ENTREGA_PARCIAL') {
            const totalItens = pedidoObj.itens?.length || 0;
            const recebidos = pedidoObj.itens?.filter(i => i.quantidadeReal !== null && i.quantidadeReal >= i.quantidadePedida).length || 0;
            return `ENTREGA PARCIAL (${recebidos}/${totalItens} itens concluídos)`;
        }

        if (['ENTREGUE_COM_FALTA', 'VALORES_INCOMPATIVEIS', 'DIVERGENCIA', 'PENDENTE_DEVOLUCAO'].includes(status)) {
            let faltas = 0, avarias = 0, incorretos = 0;
            pedidoObj.itens?.forEach(item => {
                if (item.statusRecebimento === 'FALTA' || (item.quantidadeReal !== null && item.quantidadeReal < item.quantidadePedida)) faltas++;
                if (item.statusRecebimento === 'AVARIADO') avarias++;
                if (item.statusRecebimento === 'INCORRETO') incorretos++;
            });
            let detalhes = [];
            if (faltas > 0) detalhes.push(`${faltas} Falta(s)`);
            if (avarias > 0) detalhes.push(`${avarias} Avariado(s)`);
            if (incorretos > 0) detalhes.push(`${incorretos} Incorreto(s)`);

            let textoDivergencia = detalhes.length > 0 ? `(${detalhes.join(' | ')})` : '';
            if (status === 'PENDENTE_DEVOLUCAO') return `DEVOLUÇÃO EM TRATATIVA ${textoDivergencia}`;
            if (detalhes.length > 0) return `DIVERGÊNCIA ${textoDivergencia}`;
            if (status === 'VALORES_INCOMPATIVEIS') return 'DIVERGÊNCIA DE VALORES (IMPOSTOS/NF)';
            return 'DIVERGÊNCIA IDENTIFICADA';
        }
        return status;
    };

    if (loading) return <div className="layout"><Sidebar /><main className="main-content"><p>Carregando...</p></main></div>;
    if (!pedido) return <div className="layout"><Sidebar /><main className="main-content"><p>Pedido não encontrado.</p></main></div>;

    const empresa = pedido.fornecedor?.empresa || pedido.fornecedor?.nomeEmpresa || 'Empresa não informada';
    const vendedor = pedido.fornecedor?.nome || pedido.fornecedor?.vendedor || pedido.fornecedorNome || 'Vendedor não informado';

    const podeConferir = pedido.status === 'PENDENTE_ENTREGA' || pedido.status === 'CONFIRMADO_FORNECEDOR' || pedido.status === 'ENTREGA_PARCIAL';
    const mostrarReais = !podeConferir && pedido.status !== 'CANCELADO';
    const isEntregaParcial = pedido.status === 'ENTREGA_PARCIAL';
    
    const temDivergencia = ['ENTREGUE_COM_FALTA', 'VALORES_INCOMPATIVEIS', 'DIVERGENCIA', 'PENDENTE_DEVOLUCAO'].includes(pedido.status);
    const podeDevolver = temDivergencia || pedido.status === 'ENTREGUE_SUCESSO'; 
    const podeAdicionarProduto = pedido.status === 'PENDENTE_ENTREGA'; 
    const estaConfirmadoForn = pedido.status === 'CONFIRMADO_FORNECEDOR';
    const podeRefazerConferencia = temDivergencia || pedido.status === 'ENTREGUE_SUCESSO';

    const valorMinimoSalvo = pedido.valorMinimoFaturamento || 0;
    const totalConsiderado = pedido.valorTotalPedido || 0;
    const faltaParaMinimo = valorMinimoSalvo > 0 ? valorMinimoSalvo - totalConsiderado : 0;
    const atingiuMinimo = valorMinimoSalvo > 0 && totalConsiderado >= valorMinimoSalvo;
    const pctProgresso = valorMinimoSalvo > 0 ? (totalConsiderado / valorMinimoSalvo) * 100 : 0;

    // TASK 1: Garantir que o link para a cotação funcione, independente se veio da Cotação Manual ou Via DNA
    const idCotacaoOrigem = pedido.cotacao?.id || pedido.cotacaoId;

    return (
        <div className="layout">
            <Sidebar />
            <main className="main-content">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
                    <div>
                        <h1 style={{ fontSize: '24px', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            Pedido #{pedido.id}
                            {idCotacaoOrigem ? (
                                <button 
                                    onClick={() => navigate(`/cotacao/${idCotacaoOrigem}`)}
                                    style={{ backgroundColor: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                                    title="Abrir Cotação vinculada"
                                >
                                    Ver Cotação #{idCotacaoOrigem}
                                </button>
                            ) : (
                                <span style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold' }}>
                                    Pedido Avulso
                                </span>
                            )}
                        </h1>
                        <p style={{ color: '#4b5563', fontSize: '15px' }}>
                            <strong>Empresa:</strong> {empresa} &nbsp;|&nbsp; <strong>Vendedor:</strong> {vendedor}
                        </p>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {estaConfirmadoForn && (
                            <button style={{ ...styles.btnVoltar, backgroundColor: '#f59e0b', color: 'white' }} onClick={handleCancelarConfirmacao}>
                                <RotateCcw size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Cancelar Confirmação
                            </button>
                        )}
                        {pedido.status === 'PENDENTE_ENTREGA' && (
                          <button style={{ ...styles.btnVoltar, backgroundColor: '#25D366', color: 'white' }} onClick={handleAvisarFornecedor}>
                              <MessageCircle size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Avisar Fornecedor
                          </button>
                        )}
                        {(pedido.status === 'PENDENTE_ENTREGA' || pedido.status === 'CONFIRMADO_FORNECEDOR') && (
                            <button style={{ ...styles.btnVoltar, backgroundColor: '#f97316', color: 'white' }} onClick={abrirModalFalha}>
                                <XCircle size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Registrar Falha / Cancelar
                            </button>
                        )}
                        <button style={{ ...styles.btnVoltar, backgroundColor: '#ef4444', color: 'white' }} onClick={handleExcluirPedido}>
                            <Trash2 size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Excluir Pedido
                        </button>
                        <button style={styles.btnVoltar} onClick={() => navigate('/pedidos')}>
                            <ArrowLeft size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Voltar aos Pedidos
                        </button>
                    </div>
                </header>

                {pedido.status === 'CANCELADO' && (
                    <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fca5a5', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
                        <h4 style={{ margin: '0 0 8px 0', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertTriangle size={18} /> Pedido Cancelado / Falha na Entrega</h4>
                        <p style={{ margin: 0, color: '#7f1d1d', fontSize: '14px' }}><strong>Motivo registrado:</strong> {pedido.motivoCancelamento || 'Não informado'}</p>
                    </div>
                )}

                {pedido.sugestoes && pedido.sugestoes.length > 0 && pedido.status !== 'CANCELADO' && (
                    <div style={{ backgroundColor: '#fefce8', border: '1px solid #fef08a', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontWeight: 'bold' }}><Tag size={20} /><span>O fornecedor enviou {pedido.sugestoes.length} sugestão(ões) extras!</span></div>
                        <button onClick={() => setIsModalSugestoesAberto(true)} style={{ backgroundColor: '#eab308', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><Eye size={16} /> Visualizar Sugestões</button>
                    </div>
                )}

                {isEntregaParcial && (
                    <div style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9a3412', fontWeight: 'bold' }}>
                            <Truck size={20} />
                            <span>Entrega Parcial — aguardando próximo volume do fornecedor{pedido.numeroNota ? ` (NF(ns): ${pedido.numeroNota})` : ''}.</span>
                        </div>
                        <button onClick={handleContinuarConferencia} style={{ backgroundColor: '#f97316', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <CheckCircle size={16} /> Continuar Conferência
                        </button>
                    </div>
                )}

                <div style={styles.infoCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                        <div>
                            {/* TASK 2: Alerta visual de status de Sugestão Pendente */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                <p style={{ fontSize: '15px', margin: 0 }}><strong>Status Atual:</strong></p>
                                <span style={styles.statusBadge(pedido.status, getStatusExibicao(pedido))}>{getStatusExibicao(pedido)}</span>
                                
                                {pedido.sugestoes && pedido.sugestoes.length > 0 && pedido.status !== 'CANCELADO' && (
                                    <span style={{ backgroundColor: '#fef08a', color: '#854d0e', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px', border: '1px solid #fde047' }}>
                                        <Tag size={12}/> Sugestão Pendente
                                    </span>
                                )}
                            </div>

                            <p style={{ fontSize: '14px', marginBottom: '8px', color: '#4b5563' }}><strong>Enviado em:</strong> {fDataHora(pedido.dataCriacao)}</p>
                            {pedido.dataConfirmacao && <p style={{ fontSize: '14px', marginBottom: '8px', color: '#166534' }}><strong>Confirmado em:</strong> {fDataHora(pedido.dataConfirmacao)}</p>}
                            
                            <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'inline-block' }}>
                                <p style={{ fontSize: '15px', margin: '0 0 5px 0' }}><strong>Valor Estimado:</strong> {fMoney(pedido.valorTotalPedido)}</p>
                                {mostrarReais && pedido.valorTotalReal != null && <p style={{ fontSize: '15px', margin: 0 }}><strong>Valor Real (NF):</strong> {fMoney(pedido.valorTotalReal)}</p>}
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            {podeConferir && (
                                <>
                                    <button onClick={isEditandoValores ? () => setIsEditandoValores(false) : iniciarEdicaoValores} style={{ ...styles.btnConferir, backgroundColor: isEditandoValores ? '#6b7280' : '#3b82f6' }}>
                                        <Edit2 size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> {isEditandoValores ? 'Cancelar Edição' : 'Editar Valores Previstos'}
                                    </button>
                                    
                                    {isEditandoValores ? (
                                        <button onClick={salvarEdicaoValores} style={{ ...styles.btnConferir, backgroundColor: '#10b981' }}><Save size={18} style={{ marginRight: '6px' }} /> Salvar Previstos</button>
                                    ) : (
                                        <>
                                            <button onClick={() => navigate(`/pedidos/${pedido.id}/conferir`)} style={styles.btnConferir}><CheckCircle size={18} style={{ marginRight: '6px' }} /> Conferência Item a Item</button>
                                            <button onClick={handleConferenciaRapida} style={{ ...styles.btnConferir, backgroundColor: '#0284c7' }} title="Aceita as quantidades e valores originais do pedido"><Zap size={18} style={{ marginRight: '6px' }} /> Conferência Rápida (Tudo OK)</button>
                                        </>
                                    )}
                                </>
                            )}
                            
                            {mostrarReais && (
                                <>
                                    <button onClick={isEditandoReais ? () => setIsEditandoReais(false) : iniciarEdicaoReais} style={{ ...styles.btnConferir, backgroundColor: isEditandoReais ? '#6b7280' : '#8b5cf6' }}>
                                        <Edit2 size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> {isEditandoReais ? 'Cancelar Ajuste NF' : 'Ajustar Valores NF (Conferidos)'}
                                    </button>

                                    {isEditandoReais ? (
                                        <button onClick={salvarEdicaoReais} style={{ ...styles.btnConferir, backgroundColor: '#10b981' }}><Save size={18} style={{ marginRight: '6px' }} /> Salvar NF Corrigida</button>
                                    ) : (
                                        <>
                                            {podeRefazerConferencia && (
                                                <button onClick={handleRefazerConferencia} style={{ ...styles.btnConferir, backgroundColor: '#3b82f6' }}><RotateCcw size={18} style={{ marginRight: '6px' }} /> Refazer Conferência Total</button>
                                            )}
                                            {temDivergencia && pedido.status !== 'PENDENTE_DEVOLUCAO' && (
                                                <button onClick={aceitarDivergenciaValor} style={{ ...styles.btnConferir, backgroundColor: '#059669' }}><CheckSquare size={18} style={{ marginRight: '6px' }} /> Aceitar Diferenças (Concluir)</button>
                                            )}
                                            {podeDevolver && (
                                                <button onClick={() => setIsDevolucaoModalOpen(true)} style={styles.btnDevolucao}><RotateCcw size={18} style={{ marginRight: '6px' }} /> {pedido.status === 'PENDENTE_DEVOLUCAO' ? 'Gerenciar Devolução' : 'Gerar / Ver Devolução'}</button>
                                            )}
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {valorMinimoSalvo > 0 && pedido.status !== 'CANCELADO' && (
                    <div style={{ marginTop: '-5px', marginBottom: '20px', padding: '16px 20px', backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#9a3412', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px' }}><TrendingUp size={18}/> Faturamento Mínimo do Fornecedor</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px', fontWeight: 'bold', color: atingiuMinimo ? '#166534' : '#b45309' }}>
                            <span>{atingiuMinimo ? 'Mínimo Alcançado!' : `Faltam ${fMoney(faltaParaMinimo)} para atingir ${fMoney(valorMinimoSalvo)}.`}</span>
                            <span>{Math.min(pctProgresso, 100).toFixed(0)}%</span>
                        </div>
                        <div style={{ width: '100%', height: '10px', backgroundColor: '#fed7aa', borderRadius: '5px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(pctProgresso, 100)}%`, height: '100%', backgroundColor: atingiuMinimo ? '#22c55e' : '#f97316', transition: 'width 0.4s ease' }}></div>
                        </div>
                    </div>
                )}

                <div style={styles.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>Itens do Pedido</h3>
                        {podeAdicionarProduto && (
                            <button onClick={abrirModalAdicao} style={styles.btnAddItem}><Plus size={16} style={{ marginRight: '6px' }} /> Adicionar Produto Extra</button>
                        )}
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Produto</th>
                                    <th style={{ ...styles.th, textAlign: 'center', backgroundColor: '#f9fafb' }}>Qtd (Prevista)</th>
                                    {mostrarReais && <th style={{ ...styles.th, textAlign: 'center', backgroundColor: '#f0fdf4' }}>Qtd Real (NF)</th>}
                                    <th style={{ ...styles.th, textAlign: 'right', backgroundColor: '#f9fafb' }}>Valor Unit. (Prev)</th>
                                    {mostrarReais && <th style={{ ...styles.th, textAlign: 'right', backgroundColor: '#f0fdf4' }}>Vlr Unit. (NF)</th>}
                                    {mostrarReais && <th style={{ ...styles.th, textAlign: 'center' }}>% Divergência</th>}
                                    <th style={{ ...styles.th, textAlign: 'right', backgroundColor: '#f9fafb' }}>Subtotal (Prev)</th>
                                    {mostrarReais && <th style={{ ...styles.th, textAlign: 'right', backgroundColor: '#f0fdf4' }}>Subtotal (Real)</th>}
                                    <th style={{ ...styles.th, textAlign: 'center' }}>Status Item</th>
                                    {podeAdicionarProduto && !isEditandoValores && <th style={{ ...styles.th, textAlign: 'center' }}>Ação</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {pedido.itens?.map(item => {
                                    const qtdPedida = item.quantidadePedida || 0;
                                    const qtdReal = item.quantidadeReal;
                                    const vlrPrevisto = item.valorUnitarioPedido || 0;
                                    const vlrReal = item.valorUnitarioReal;

                                    let pctImposto = 0; let alertImposto = false;
                                    if (mostrarReais && vlrReal !== null && vlrPrevisto > 0 && vlrReal > vlrPrevisto) {
                                        pctImposto = ((vlrReal - vlrPrevisto) / vlrPrevisto) * 100;
                                        if (pctImposto > 5) alertImposto = true;
                                    }

                                    return (
                                        <tr key={item.id}>
                                            <td style={styles.td}>
                                                <strong style={{ display: 'block', textDecoration: pedido.status === 'CANCELADO' ? 'line-through' : 'none' }}>{item.nomeProduto || item.itemCotacao?.nomeProduto || 'Produto Desconhecido'}</strong>
                                                {item.condicaoAplicada && (
                                                  <div style={{ fontSize: '11px', color: '#166534', backgroundColor: '#dcfce7', padding: '2px 6px', borderRadius: '4px', marginTop: '4px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px', border: '1px solid #bbf7d0' }}>
                                                    <Tags size={12} /> Escalonamento Aplicado ({item.qtdCondicao} un por {fMoney(item.precoCondicao)})
                                                  </div>
                                                )}
                                                {item.valorAlteradoAposPedido && <span style={{ display: 'inline-block', fontSize: '11px', color: '#d97706', fontWeight: 'bold', marginTop: '4px' }}><AlertTriangle size={12} style={{ verticalAlign: 'middle', marginRight: '2px' }} /> Valor/Qtd editado pós-pedido</span>}
                                            </td>
                                            
                                            <td style={{ ...styles.td, textAlign: 'center', backgroundColor: '#f9fafb' }}>
                                                {isEditandoValores ? (
                                                    <input type="number" min="1" value={valoresEditados[item.id]?.quantidadePedida || ''} onChange={e => setValoresEditados(prev => ({ ...prev, [item.id]: { ...prev[item.id], quantidadePedida: e.target.value } }))} style={styles.inputTable} />
                                                ) : (`${qtdPedida} un`)}
                                            </td>
                                            
                                            {mostrarReais && (
                                                <td style={{ ...styles.td, textAlign: 'center', backgroundColor: '#f0fdf4', fontWeight: 'bold', color: (qtdReal !== null && qtdReal !== qtdPedida) ? '#dc2626' : '#16a34a' }}>
                                                    {isEditandoReais ? (
                                                        <input type="number" min="0" value={valoresReaisEditados[item.id]?.quantidadeReal || ''} onChange={e => setValoresReaisEditados(prev => ({ ...prev, [item.id]: { ...prev[item.id], quantidadeReal: e.target.value } }))} style={{...styles.inputTable, borderColor: '#4ade80'}} />
                                                    ) : (qtdReal !== null ? `${qtdReal} un` : '-')}
                                                </td>
                                            )}
                                            
                                            <td style={{ ...styles.td, textAlign: 'right', color: '#6b7280', backgroundColor: '#f9fafb' }}>
                                                {isEditandoValores ? (
                                                    <input type="number" step="0.01" value={valoresEditados[item.id]?.valorUnitarioPedido || ''} onChange={e => setValoresEditados(prev => ({ ...prev, [item.id]: { ...prev[item.id], valorUnitarioPedido: e.target.value } }))} style={{...styles.inputTable, width: '90px'}} />
                                                ) : (fMoney(vlrPrevisto))}
                                            </td>
                                            
                                            {mostrarReais && (
                                                <td style={{ ...styles.td, textAlign: 'right', fontWeight: 'bold', color: '#1f2937', backgroundColor: '#f0fdf4' }}>
                                                    {isEditandoReais ? (
                                                        <input type="number" step="0.01" value={valoresReaisEditados[item.id]?.valorUnitarioReal || ''} onChange={e => setValoresReaisEditados(prev => ({ ...prev, [item.id]: { ...prev[item.id], valorUnitarioReal: e.target.value } }))} style={{...styles.inputTable, width: '90px', borderColor: '#4ade80'}} />
                                                    ) : (vlrReal !== null ? fMoney(vlrReal) : '-')}
                                                </td>
                                            )}

                                            {mostrarReais && (
                                                <td style={{ ...styles.td, textAlign: 'center' }}>
                                                    {(() => {
                                                        const currentVlrReal = isEditandoReais ? Number(valoresReaisEditados[item.id]?.valorUnitarioReal || 0) : vlrReal;
                                                        if (currentVlrReal !== null && vlrPrevisto > 0 && currentVlrReal > 0) {
                                                            if (currentVlrReal > vlrPrevisto) {
                                                                const diff = ((currentVlrReal - vlrPrevisto) / vlrPrevisto) * 100;
                                                                return <span style={{ color: diff > 5 ? '#dc2626' : '#d97706', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>{diff > 5 && <AlertTriangle size={14} />} +{diff.toFixed(1)}%</span>;
                                                            } else if (currentVlrReal < vlrPrevisto) {
                                                                const diff = ((vlrPrevisto - currentVlrReal) / vlrPrevisto) * 100;
                                                                return <span style={{ color: '#16a34a', fontWeight: 'bold' }}>-{diff.toFixed(1)}%</span>;
                                                            }
                                                        }
                                                        return <span style={{ color: '#9ca3af' }}>-</span>;
                                                    })()}
                                                </td>
                                            )}

                                            <td style={{ ...styles.td, textAlign: 'right', color: '#6b7280', backgroundColor: '#f9fafb' }}>
                                                {isEditandoValores ? fMoney((valoresEditados[item.id]?.valorUnitarioPedido || 0) * (valoresEditados[item.id]?.quantidadePedida || 0)) : fMoney(vlrPrevisto * qtdPedida)}
                                            </td>

                                            {mostrarReais && (
                                                <td style={{ ...styles.td, textAlign: 'right', fontWeight: 'bold', color: '#1f2937', backgroundColor: '#f0fdf4' }}>
                                                    {isEditandoReais 
                                                        ? fMoney((valoresReaisEditados[item.id]?.valorUnitarioReal || 0) * (valoresReaisEditados[item.id]?.quantidadeReal || 0))
                                                        : (qtdReal !== null && vlrReal !== null ? fMoney(vlrReal * qtdReal) : '-')}
                                                </td>
                                            )}

                                            <td style={{ ...styles.td, textAlign: 'center' }}>
                                                <span style={styles.itemStatus(item.statusRecebimento, qtdReal, qtdPedida, pedido.status)}>
                                                    {pedido.status === 'CANCELADO' ? 'CANCELADO' : (
                                                    mostrarReais && qtdReal !== null && qtdReal < qtdPedida && item.statusRecebimento === 'OK'
                                                        ? 'FALTA PARCIAL' : (item.statusRecebimento || (mostrarReais ? 'PENDENTE' : 'AGUARDANDO'))
                                                    )}
                                                </span>
                                            </td>

                                            {podeAdicionarProduto && !isEditandoValores && (
                                                <td style={{ ...styles.td, textAlign: 'center' }}>
                                                    <button onClick={() => handleRemoverItemDoPedido(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="Remover produto (retorna para Cotação Aberta)"><Trash2 size={18} /></button>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Demais Modais abaixo... */}
                {isDevolucaoModalOpen && <DevolucaoModal pedidoId={pedido.id} onClose={() => setIsDevolucaoModalOpen(false)} onSuccess={() => { setIsDevolucaoModalOpen(false); carregarPedido(); }} />}
                
                {modalFalhaAberto && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '500px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <XCircle size={20} color="#ef4444" /> Registrar Falha de Entrega
                                </h3>
                                <button onClick={() => setModalFalhaAberto(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><X size={20} /></button>
                            </div>
                            
                            <p style={{ fontSize: '14px', color: '#475569', marginBottom: '20px', lineHeight: '1.5' }}>
                                O Pedido <strong>#{pedido.id}</strong> será marcado como Falha/Cancelado.
                            </p>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>Selecione o Motivo da Falha / Cancelamento *</label>
                                <select 
                                    value={motivoFalha} 
                                    onChange={e => setMotivoFalha(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' }}
                                >
                                    <option value="">-- Selecione o Motivo --</option>
                                    <option value="Prazo Estourado (24h)">Prazo Estourado (24h)</option>
                                    <option value="Pedido não confirmado pelo fornecedor">Pedido não confirmado pelo fornecedor</option>
                                    <option value="Faturamento não realizado">Faturamento não realizado</option>
                                    <option value="Ruptura na Entrega (Não Entregue)">Ruptura na Entrega (Não Entregue)</option>
                                    <option value="Outro Motivo">Outro...</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '12px' }}>O que fazer com os itens deste pedido?</label>
                                
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#1e293b', marginBottom: '10px' }}>
                                    <input type="radio" checked={acaoDestino === 'ORIGINAL'} onChange={() => setAcaoDestino('ORIGINAL')} style={{ transform: 'scale(1.2)' }} />
                                    <span>Devolver para a <strong>Cotação Original</strong> (se houver)</span>
                                </label>

                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#1e293b', marginBottom: '10px' }}>
                                    <input type="radio" checked={acaoDestino === 'NOVA'} onChange={() => setAcaoDestino('NOVA')} style={{ transform: 'scale(1.2)' }} />
                                    <span>Gerar uma <strong>Nova Cotação</strong> com estes itens</span>
                                </label>

                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#1e293b' }}>
                                    <input type="radio" checked={acaoDestino === 'EXISTENTE'} onChange={() => setAcaoDestino('EXISTENTE')} style={{ transform: 'scale(1.2)' }} />
                                    <span>Adicionar em uma <strong>Cotação Ativa</strong></span>
                                </label>

                                {acaoDestino === 'EXISTENTE' && (
                                    <div style={{ marginTop: '10px', marginLeft: '24px' }}>
                                        <select 
                                            value={cotacaoDestinoId} 
                                            onChange={e => setCotacaoDestinoId(e.target.value)}
                                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px' }}
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
                                <button onClick={() => setModalFalhaAberto(false)} style={{ padding: '10px 16px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 'bold', color: '#475569', cursor: 'pointer' }}>Cancelar</button>
                                <button onClick={registrarFalhaEntrega} style={{ padding: '10px 16px', background: '#ef4444', border: 'none', borderRadius: '6px', fontWeight: 'bold', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    Confirmar Cancelamento
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {isModalSugestoesAberto && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ margin: '0 0 18px 0', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}><Tag size={20} color="#eab308"/> Sugestões do Fornecedor</h3>
                                <button onClick={() => setIsModalSugestoesAberto(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><X size={20} /></button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {pedido.sugestoes?.map(sug => {
                                    const state = sugestoesEditaveis[sug.id] || { ...sug, quantidadeAtualizada: sug.quantidade, precoAplicado: sug.precoUnitario, condicaoAplicada: false };
                                    const temCondicao = sug.quantidadeCondicao && sug.precoCondicao;

                                    return (
                                        <div key={sug.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: '#f8fafc' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
                                                <div style={{ flex: 1, minWidth: '250px' }}>
                                                    <h4 style={{ margin: '0 0 4px 0', color: '#1e293b', fontSize: '16px' }}>{sug.nomeProduto}</h4>
                                                    
                                                    {temCondicao && (
                                                        <div style={{ marginBottom: '10px', marginTop: '6px' }}>
                                                            {state.condicaoAplicada ? (
                                                                <div style={{ fontSize: '11px', color: '#166534', backgroundColor: '#dcfce7', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px', border: '1px solid #bbf7d0' }}>
                                                                    <Tags size={14} /> Condição Ativada: A partir de {sug.quantidadeCondicao} un por {fMoney(sug.precoCondicao)}
                                                                </div>
                                                            ) : (
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => handleForcarAceitarCondicaoSugestao(sug.id)}
                                                                    style={{ fontSize: '11px', color: '#854d0e', backgroundColor: '#fef08a', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '6px', border: '1px solid #fde047', cursor: 'pointer', transition: '0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                                                                >
                                                                    <Tags size={14} /> Aceitar Condição: A partir de {sug.quantidadeCondicao} un por {fMoney(sug.precoCondicao)}
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}

                                                    {sug.observacao && <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#64748b', fontStyle: 'italic' }}>Obs: {sug.observacao}</p>}
                                                    
                                                    <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#475569', alignItems: 'center', backgroundColor: 'white', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <span style={{fontSize: '13px', fontWeight: 'bold'}}>Qtd:</span>
                                                            <input 
                                                                type="number" 
                                                                min="1"
                                                                value={state.quantidadeAtualizada || ''}
                                                                onChange={(e) => handleQtdSugestaoChange(sug.id, e.target.value)}
                                                                onFocus={(e) => e.target.select()}
                                                                style={{ width: '60px', padding: '6px', textAlign: 'center', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontWeight: 'bold' }}
                                                            />
                                                        </div>
                                                        <span>Preço Unit: <strong style={{ color: state.condicaoAplicada ? '#16a34a' : '#1e293b', fontSize: '15px' }}>{fMoney(state.precoAplicado)}</strong></span>
                                                        <span style={{ color: '#16a34a', borderLeft: '1px solid #cbd5e1', paddingLeft: '16px' }}>Subtotal: <strong style={{fontSize: '15px'}}>{fMoney((state.quantidadeAtualizada || 0) * (state.precoAplicado || 0))}</strong></span>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                                    <button onClick={() => handleRecusarSugestao(sug.id)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #fca5a5', backgroundColor: '#fef2f2', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <X size={16}/> Recusar
                                                    </button>
                                                    <button onClick={() => handleAceitarSugestao(sug.id)} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#10b981', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)' }}>
                                                        <Check size={16}/> Aceitar e Incluir
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {isAddItemModalOpen && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '480px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ margin: '0 0 18px 0', color: '#1f2937' }}>Adicionar Produto Extra</h3>
                                <button onClick={() => setIsAddItemModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><X size={20} /></button>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', backgroundColor: '#f1f5f9', padding: '6px', borderRadius: '8px', flexWrap: 'wrap' }}>
                                {pedido.cotacao?.id && (
                                    <button 
                                        onClick={() => { setTipoAdicao('COTACAO'); setNovoItem({...novoItem, nomeProduto: ''}); }} 
                                        style={{ flex: '1 1 120px', padding: '8px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', backgroundColor: tipoAdicao === 'COTACAO' ? 'white' : 'transparent', color: tipoAdicao === 'COTACAO' ? '#2563eb' : '#64748b', boxShadow: tipoAdicao === 'COTACAO' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                                    >
                                        De Cotações
                                    </button>
                                )}
                                <button 
                                    onClick={() => { setTipoAdicao('DNA'); setNovoItem({...novoItem, nomeProduto: ''}); setCodigoDna(''); }} 
                                    style={{ flex: '1 1 120px', padding: '8px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', backgroundColor: tipoAdicao === 'DNA' ? 'white' : 'transparent', color: tipoAdicao === 'DNA' ? '#2563eb' : '#64748b', boxShadow: tipoAdicao === 'DNA' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                                >
                                    Por Código DNA
                                </button>
                                <button 
                                    onClick={() => { setTipoAdicao('MANUAL'); setNovoItem({...novoItem, nomeProduto: ''}); }} 
                                    style={{ flex: '1 1 120px', padding: '8px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', backgroundColor: tipoAdicao === 'MANUAL' ? 'white' : 'transparent', color: tipoAdicao === 'MANUAL' ? '#2563eb' : '#64748b', boxShadow: tipoAdicao === 'MANUAL' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                                >
                                    Manualmente
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                
                                {tipoAdicao === 'COTACAO' && (
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>Selecione um Produto Pendente</label>
                                        <select style={styles.inputModal} value={novoItem.itemCotacaoId || ''} onChange={handleSelectPendente}>
                                            <option value="">{itensPendentes.length === 0 ? 'Nenhum produto pendente encontrado' : '-- Selecione --'}</option>
                                            {itensPendentes.map(p => (
                                                <option key={p.idItem} value={p.idItem}>
                                                    [Cot. #{p.cotacaoId}] {p.nomeProduto} - Qtd: {p.quantidade}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {tipoAdicao === 'DNA' && (
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>Digite o Código DNA</label>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <div style={{ position: 'relative', flex: 1 }}>
                                                <Search size={18} color="#9ca3af" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                                                <input type="text" style={{...styles.inputModal, paddingLeft: '35px'}} value={codigoDna} onChange={e => setCodigoDna(e.target.value)} placeholder="Ex: 12345" />
                                            </div>
                                            <button onClick={handleBuscarDna} style={{ padding: '0 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Buscar</button>
                                        </div>
                                        {novoItem.nomeProduto && (
                                            <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#f0fdf4', borderRadius: '6px', border: '1px solid #bbf7d0', color: '#166534', fontSize: '14px', fontWeight: '600' }}>
                                                <CheckCircle size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                                                {novoItem.nomeProduto}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {tipoAdicao === 'MANUAL' && (
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>Nome do Produto</label>
                                        <input type="text" style={styles.inputModal} value={novoItem.nomeProduto} onChange={e => setNovoItem({...novoItem, nomeProduto: e.target.value})} placeholder="Ex: Neosaldina C/ 30" />
                                    </div>
                                )}
                                
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>Qtd. Pedida</label>
                                        <input type="number" min="1" style={styles.inputModal} value={novoItem.quantidadePedida} onChange={e => setNovoItem({...novoItem, quantidadePedida: e.target.value})} onFocus={e => e.target.select()}/>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>Valor Unit. (R$)</label>
                                        <input type="number" step="0.01" style={styles.inputModal} value={novoItem.valorUnitarioPedido} onChange={e => setNovoItem({...novoItem, valorUnitarioPedido: e.target.value})} onFocus={e => e.target.select()}/>
                                    </div>
                                </div>

                                <button 
                                    onClick={handleSalvarNovoItem} 
                                    disabled={salvandoItem || (tipoAdicao === 'COTACAO' && !novoItem.itemCotacaoId)}
                                    style={{ width: '100%', padding: '12px', marginTop: '10px', backgroundColor: ((tipoAdicao === 'COTACAO' && !novoItem.itemCotacaoId) || !novoItem.nomeProduto) ? '#9ca3af' : '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: ((tipoAdicao === 'COTACAO' && !novoItem.itemCotacaoId) || !novoItem.nomeProduto) ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                                >
                                    <Save size={18} style={{ marginRight: '8px' }}/> {salvandoItem ? 'Adicionando...' : 'Confirmar e Adicionar'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
            </main>
        </div>
    );
}

const styles = {
    card: { backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflowX: 'auto' },
    infoCard: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '20px' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px' },
    th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #e5e7eb', color: '#4b5563', fontSize: '12px' },
    td: { padding: '12px', borderBottom: '1px solid #e5e7eb', color: '#374151', fontSize: '13px' },
    inputTable: { width: '70px', padding: '6px', textAlign: 'center', borderRadius: '4px', border: '1px solid #cbd5e1' },
    btnVoltar: { padding: '10px 20px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', transition: '0.2s' },
    btnConferir: { padding: '10px 20px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center' },
    btnDevolucao: { padding: '10px 20px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center' },
    btnAddItem: { padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', fontSize: '13px' },
    inputModal: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' },
    statusBadge: (status, label) => ({ fontWeight: '700', color: status === 'CANCELADO' ? '#991b1b' : status === 'ENTREGA_PARCIAL' ? '#c2410c' : ['ENTREGUE_COM_FALTA', 'VALORES_INCOMPATIVEIS', 'DIVERGENCIA', 'PENDENTE_DEVOLUCAO'].includes(status) || label.includes('ESTOURADO') ? '#dc2626' : '#2563eb' }),
    itemStatus: (status, qtdReal, qtdPedida, pedidoStatus) => {
        const isFalta = status === 'FALTA' || (qtdReal !== null && qtdReal < qtdPedida);
        const isError = ['AVARIADO', 'INCORRETO'].includes(status) || isFalta || pedidoStatus === 'CANCELADO';
        return { padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', backgroundColor: isError ? '#fee2e2' : status === 'OK' ? '#dcfce7' : '#f3f4f6', color: isError ? '#991b1b' : status === 'OK' ? '#166534' : '#374151', whiteSpace: 'nowrap' }
    }
};