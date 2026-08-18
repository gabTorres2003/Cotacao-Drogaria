import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Sidebar from '../components/layout/Sidebar';
import DevolucaoModal from '../components/DevolucaoModal';
import { ArrowLeft, CheckCircle, RotateCcw, Trash2, CheckSquare, Plus, X, Save, AlertTriangle, Edit2, MessageCircle, TrendingUp, Tag, Eye, Check, Search, Tags } from 'lucide-react';

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
    
    const [isModalSugestoesAberto, setIsModalSugestoesAberto] = useState(false);

    const [codigoDna, setCodigoDna] = useState('');

    const carregarPedido = async () => {
        try {
            const response = await api.get(`/api/pedidos/${id}`);
            setPedido(response.data);
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

    const handleAceitarSugestao = async (idSugestao) => {
        try {
            await api.post(`/api/pedidos/${id}/sugestoes/${idSugestao}/aceitar`);
            alert('Sugestão aceita e adicionada ao pedido com sucesso!');
            carregarPedido();
            if (pedido.sugestoes.length === 1) setIsModalSugestoesAberto(false);
        } catch (error) {
            alert('Erro ao aceitar a sugestão.');
        }
    };

    const handleRecusarSugestao = async (idSugestao) => {
        if(window.confirm('Tem certeza que deseja recusar e excluir esta sugestão?')) {
            try {
                await api.delete(`/api/pedidos/${id}/sugestoes/${idSugestao}`);
                carregarPedido();
                if (pedido.sugestoes.length === 1) setIsModalSugestoesAberto(false);
            } catch (error) {
                alert('Erro ao recusar a sugestão.');
            }
        }
    };

    const aceitarDivergenciaValor = async () => {
        if (window.confirm('Confirmar o recebimento ignorando as diferenças de valores/impostos? O pedido será marcado como Concluído.')) {
            try {
                await api.patch(`/api/pedidos/${id}/status`, { status: 'ENTREGUE_SUCESSO' });
                alert('Divergência aceita. Pedido concluído!');
                carregarPedido();
            } catch (error) {
                alert('Erro ao atualizar o pedido.');
            }
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
            } catch (error) {
                console.error("Erro ao buscar itens pendentes:", error);
            }
        } else {
            setTipoAdicao('DNA');
            setItensPendentes([]);
        }
    };

    const handleSelectPendente = (e) => {
        const val = e.target.value;
        if (!val) {
            setNovoItem({ nomeProduto: '', quantidadePedida: 1, valorUnitarioPedido: '', itemCotacaoId: null });
            return;
        }
        const itemSel = itensPendentes.find(i => String(i.idItem) === String(val));
        if (itemSel) {
            setNovoItem({
                nomeProduto: itemSel.nomeProduto,
                quantidadePedida: itemSel.quantidade || 1,
                valorUnitarioPedido: '', 
                itemCotacaoId: itemSel.idItem
            });
        }
    };

    const handleBuscarDna = async () => {
        if (!codigoDna) return;
        const cod = codigoDna.trim();
        try {
            const res = await api.get(`/api/produtos/buscar?q=${encodeURIComponent(cod)}`);
            if (res.data) {
                setNovoItem(prev => ({ ...prev, nomeProduto: res.data.descricao }));
            }
        } catch (error) {
            alert(`Código DNA ${cod} não encontrado na base de dados.`);
            setNovoItem(prev => ({ ...prev, nomeProduto: '' }));
        }
    };

    const handleSalvarNovoItem = async () => {
        if (!novoItem.nomeProduto || !novoItem.quantidadePedida || !novoItem.valorUnitarioPedido) {
            alert('Preencha todos os campos do produto (Nome, Qtd e Valor).');
            return;
        }

        setSalvandoItem(true);
        try {
            const payload = {
                nomeProduto: novoItem.nomeProduto,
                quantidadePedida: Number(novoItem.quantidadePedida),
                valorUnitarioPedido: Number(novoItem.valorUnitarioPedido),
                itemCotacao: novoItem.itemCotacaoId ? { id: novoItem.itemCotacaoId } : null
            };

            if (itemParaTrocar) {
                await api.put(`/api/pedidos/${id}/itens/${itemParaTrocar}/trocar`, payload);
                alert('Produto trocado com sucesso!');
            } else {
                await api.post(`/api/pedidos/${id}/itens`, payload);
                alert('Produto adicionado com sucesso!');
            }
            
            setIsAddItemModalOpen(false);
            carregarPedido();
        } catch (error) {
            alert('Erro ao processar: ' + (error.response?.data?.message || error.message));
        } finally {
            setSalvandoItem(false);
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

    const fMoney = (valor) => {
        if (valor == null) return '-';
        return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const fDataHora = (dataIso) => {
        if (!dataIso) return '-';
        return new Date(dataIso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const getStatusExibicao = (pedidoObj) => {
        if (!pedidoObj) return '';
        const status = pedidoObj.status;
        
        if (status === 'CONFIRMADO_FORNECEDOR') return 'CONFIRMADO NA FÁBRICA (AGUARDANDO ENTREGA)';
        if (status === 'PENDENTE_ENTREGA') return 'AGUARDANDO FORNECEDOR';

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
    
    const podeConferir = pedido.status === 'PENDENTE_ENTREGA' || pedido.status === 'CONFIRMADO_FORNECEDOR';
    const mostrarReais = !podeConferir; 
    
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

    return (
        <div className="layout">
            <Sidebar />
            <main className="main-content">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
                    <div>
                        <h1 style={{ fontSize: '24px', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            Pedido #{pedido.id}
                            {pedido.cotacao?.id ? (
                                <button 
                                    onClick={() => navigate(`/cotacao/${pedido.cotacao.id}`)}
                                    style={{ backgroundColor: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                                    title="Abrir Cotação vinculada"
                                >
                                    Ver Cotação #{pedido.cotacao.id}
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
                        <button style={{ ...styles.btnVoltar, backgroundColor: '#ef4444', color: 'white' }} onClick={handleExcluirPedido}>
                            <Trash2 size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Excluir Pedido
                        </button>
                        <button style={styles.btnVoltar} onClick={() => navigate('/pedidos')}>
                            <ArrowLeft size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Voltar aos Pedidos
                        </button>
                    </div>
                </header>

                {pedido.sugestoes && pedido.sugestoes.length > 0 && (
                    <div style={{ backgroundColor: '#fefce8', border: '1px solid #fef08a', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontWeight: 'bold' }}>
                            <Tag size={20} />
                            <span>O fornecedor enviou {pedido.sugestoes.length} sugestão(ões) de produtos extras/promoções!</span>
                        </div>
                        <button 
                            onClick={() => setIsModalSugestoesAberto(true)}
                            style={{ backgroundColor: '#eab308', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 4px rgba(234, 179, 8, 0.3)' }}
                        >
                            <Eye size={16} /> Visualizar Sugestões
                        </button>
                    </div>
                )}

                <div style={styles.infoCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                        <div>
                            <p style={{ fontSize: '15px', marginBottom: '8px' }}><strong>Status Atual:</strong> <span style={styles.statusBadge(pedido.status)}>{getStatusExibicao(pedido)}</span></p>
                            
                            <p style={{ fontSize: '14px', marginBottom: '8px', color: '#4b5563' }}>
                                <strong>Gerado (Enviado) em:</strong> {fDataHora(pedido.dataCriacao)}
                            </p>
                            {pedido.dataConfirmacao && (
                                <p style={{ fontSize: '14px', marginBottom: '8px', color: '#166534' }}>
                                    <strong>Confirmado pelo Forn. em:</strong> {fDataHora(pedido.dataConfirmacao)}
                                </p>
                            )}
                            
                            <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'inline-block' }}>
                                <p style={{ fontSize: '15px', margin: '0 0 5px 0' }}><strong>Valor Estimado:</strong> {fMoney(pedido.valorTotalPedido)}</p>
                                {mostrarReais && pedido.valorTotalReal != null && (
                                    <p style={{ fontSize: '15px', margin: 0 }}><strong>Valor Real (NF):</strong> {fMoney(pedido.valorTotalReal)}</p>
                                )}
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            {podeConferir && (
                                <button onClick={isEditandoValores ? () => setIsEditandoValores(false) : iniciarEdicaoValores} style={{ ...styles.btnConferir, backgroundColor: isEditandoValores ? '#6b7280' : '#3b82f6' }}>
                                    <Edit2 size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> 
                                    {isEditandoValores ? 'Cancelar Edição' : 'Editar Valores / Qtd'}
                                </button>
                            )}
                            
                            {isEditandoValores && (
                                <button onClick={salvarEdicaoValores} style={{ ...styles.btnConferir, backgroundColor: '#10b981' }}>
                                    <Save size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Salvar Alterações
                                </button>
                            )}
                            
                            {podeConferir && !isEditandoValores && (
                                <button onClick={() => navigate(`/pedidos/${pedido.id}/conferir`)} style={styles.btnConferir}>
                                    <CheckCircle size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Conferir Recebimento (Loja)
                                </button>
                            )}

                            {podeRefazerConferencia && (
                                <button onClick={handleRefazerConferencia} style={{ ...styles.btnConferir, backgroundColor: '#3b82f6' }}>
                                    <RotateCcw size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Refazer Conferência Cega
                                </button>
                            )}
                            
                            {temDivergencia && pedido.status !== 'PENDENTE_DEVOLUCAO' && (
                                <button onClick={aceitarDivergenciaValor} style={{ ...styles.btnConferir, backgroundColor: '#059669' }}>
                                    <CheckSquare size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Aceitar Diferenças (Concluir)
                                </button>
                            )}
                            
                            {podeDevolver && (
                                <button onClick={() => setIsDevolucaoModalOpen(true)} style={styles.btnDevolucao}>
                                    <RotateCcw size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> 
                                    {pedido.status === 'PENDENTE_DEVOLUCAO' ? 'Gerenciar Devolução' : 'Gerar / Ver Devolução'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {valorMinimoSalvo > 0 && (
                    <div style={{ marginTop: '-5px', marginBottom: '20px', padding: '16px 20px', backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#9a3412', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px' }}>
                            <TrendingUp size={18}/> Faturamento Mínimo do Fornecedor
                        </h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px', fontWeight: 'bold', color: atingiuMinimo ? '#166534' : '#b45309' }}>
                            <span>{atingiuMinimo ? 'Mínimo Alcançado! 🎉 O fornecedor poderá faturar o pedido.' : `Faltam ${fMoney(faltaParaMinimo)} para atingir o faturamento mínimo exigido de ${fMoney(valorMinimoSalvo)}.`}</span>
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
                            <button onClick={abrirModalAdicao} style={styles.btnAddItem}>
                                <Plus size={16} style={{ marginRight: '6px' }} /> Adicionar Produto Extra
                            </button>
                        )}
                    </div>

                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Produto</th>
                                <th style={{ ...styles.th, textAlign: 'center', backgroundColor: '#f9fafb' }}>Qtd Pedida</th>
                                {mostrarReais && <th style={{ ...styles.th, textAlign: 'center', backgroundColor: '#f0fdf4' }}>Qtd Real (NF)</th>}
                                
                                <th style={{ ...styles.th, textAlign: 'right', backgroundColor: '#f9fafb' }}>Vlr Unit. (Prev)</th>
                                {mostrarReais && <th style={{ ...styles.th, textAlign: 'right', backgroundColor: '#f0fdf4' }}>Vlr Unit. (NF)</th>}
                                {mostrarReais && <th style={{ ...styles.th, textAlign: 'center' }}>% Imposto</th>}
                                
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

                                let pctImposto = 0;
                                let alertImposto = false;
                                if (mostrarReais && vlrReal !== null && vlrPrevisto > 0 && vlrReal > vlrPrevisto) {
                                    pctImposto = ((vlrReal - vlrPrevisto) / vlrPrevisto) * 100;
                                    if (pctImposto > 5) alertImposto = true;
                                }

                                return (
                                    <tr key={item.id}>
                                        <td style={styles.td}>
                                            <strong style={{ display: 'block' }}>{item.nomeProduto || item.itemCotacao?.nomeProduto || 'Produto Desconhecido'}</strong>
                                            
                                            {/* EXIBE A CONDIÇÃO SE TIVER SIDO APLICADA NO PEDIDO */}
                                            {item.condicaoAplicada && (
                                              <div style={{ fontSize: '11px', color: '#166534', backgroundColor: '#dcfce7', padding: '2px 6px', borderRadius: '4px', marginTop: '4px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px', border: '1px solid #bbf7d0' }}>
                                                <Tags size={12} /> Escalonamento: {item.qtdCondicao} un por {fMoney(item.precoCondicao)}
                                              </div>
                                            )}

                                            {item.valorAlteradoAposPedido && (
                                                <span style={{ display: 'inline-block', fontSize: '11px', color: '#d97706', fontWeight: 'bold', marginTop: '4px' }}>
                                                    <AlertTriangle size={12} style={{ verticalAlign: 'middle', marginRight: '2px' }} /> Valor/Qtd editado pós-pedido
                                                </span>
                                            )}
                                        </td>
                                        
                                        <td style={{ ...styles.td, textAlign: 'center', backgroundColor: '#f9fafb' }}>
                                            {isEditandoValores ? (
                                                <input 
                                                    type="number" 
                                                    min="1"
                                                    value={valoresEditados[item.id]?.quantidadePedida || ''}
                                                    onChange={e => setValoresEditados(prev => ({ ...prev, [item.id]: { ...prev[item.id], quantidadePedida: e.target.value } }))}
                                                    style={{ width: '70px', padding: '6px', textAlign: 'center', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                                />
                                            ) : (
                                                `${qtdPedida} un`
                                            )}
                                        </td>
                                        
                                        {mostrarReais && (
                                            <td style={{ ...styles.td, textAlign: 'center', backgroundColor: '#f0fdf4', fontWeight: 'bold', color: (qtdReal !== null && qtdReal !== qtdPedida) ? '#dc2626' : '#16a34a' }}>
                                                {qtdReal !== null ? `${qtdReal} un` : '-'}
                                            </td>
                                        )}
                                        
                                        <td style={{ ...styles.td, textAlign: 'right', color: '#6b7280', backgroundColor: '#f9fafb' }}>
                                            {isEditandoValores ? (
                                                <input 
                                                    type="number" 
                                                    step="0.01"
                                                    value={valoresEditados[item.id]?.valorUnitarioPedido || ''}
                                                    onChange={e => setValoresEditados(prev => ({ ...prev, [item.id]: { ...prev[item.id], valorUnitarioPedido: e.target.value } }))}
                                                    style={{ width: '90px', padding: '6px', textAlign: 'right', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                                />
                                            ) : (
                                                fMoney(vlrPrevisto)
                                            )}
                                        </td>
                                        
                                        {mostrarReais && (
                                            <td style={{ ...styles.td, textAlign: 'right', fontWeight: 'bold', color: '#1f2937', backgroundColor: '#f0fdf4' }}>
                                                {vlrReal !== null ? fMoney(vlrReal) : '-'}
                                            </td>
                                        )}

                                        {mostrarReais && (
                                            <td style={{ ...styles.td, textAlign: 'center' }}>
                                                {(() => {
                                                    if (vlrReal !== null && vlrPrevisto > 0) {
                                                        if (vlrReal > vlrPrevisto) {
                                                            return (
                                                                <span style={{ color: alertImposto ? '#dc2626' : '#d97706', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                                                    {alertImposto && <AlertTriangle size={14} />} +{pctImposto.toFixed(1)}%
                                                                </span>
                                                            );
                                                        } else if (vlrReal < vlrPrevisto) {
                                                            const pctNeg = ((vlrPrevisto - vlrReal) / vlrPrevisto) * 100;
                                                            return <span style={{ color: '#16a34a', fontWeight: 'bold' }}>-{pctNeg.toFixed(1)}%</span>;
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
                                                {qtdReal !== null && vlrReal !== null ? fMoney(vlrReal * qtdReal) : '-'}
                                            </td>
                                        )}

                                        <td style={{ ...styles.td, textAlign: 'center' }}>
                                            <span style={styles.itemStatus(item.statusRecebimento, qtdReal, qtdPedida)}>
                                                {mostrarReais && qtdReal !== null && qtdReal < qtdPedida && item.statusRecebimento === 'OK' 
                                                    ? 'FALTA PARCIAL' 
                                                    : (item.statusRecebimento || 'AGUARDANDO')}
                                            </span>
                                        </td>

                                        {podeAdicionarProduto && !isEditandoValores && (
                                            <td style={{ ...styles.td, textAlign: 'center' }}>
                                                <button 
                                                    onClick={() => handleRemoverItemDoPedido(item.id)} 
                                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                                    title="Remover produto (retorna para Cotação Aberta)"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {isDevolucaoModalOpen && (
                    <DevolucaoModal 
                        pedidoId={pedido.id} 
                        onClose={() => setIsDevolucaoModalOpen(false)} 
                        onSuccess={() => { setIsDevolucaoModalOpen(false); carregarPedido(); }}
                    />
                )}

                {isModalSugestoesAberto && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ margin: '0 0 18px 0', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}><Tag size={20} color="#eab308"/> Sugestões do Fornecedor</h3>
                                <button onClick={() => setIsModalSugestoesAberto(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><X size={20} /></button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {pedido.sugestoes?.map(sug => (
                                    <div key={sug.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: '#f8fafc' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
                                            <div>
                                                <h4 style={{ margin: '0 0 4px 0', color: '#1e293b', fontSize: '16px' }}>{sug.nomeProduto}</h4>
                                                
                                                {/* MOSTRANDO A CONDIÇÃO DENTRO DO MODAL DE SUGESTÃO */}
                                                {sug.quantidadeCondicao && sug.precoCondicao && (
                                                   <div style={{ fontSize: '11px', color: '#166534', backgroundColor: '#dcfce7', padding: '2px 6px', borderRadius: '4px', marginBottom: '6px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px', border: '1px solid #bbf7d0' }}>
                                                     <Tags size={12} /> Condição Especial: A partir de {sug.quantidadeCondicao} un por {fMoney(sug.precoCondicao)}
                                                   </div>
                                                )}

                                                {sug.observacao && <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#64748b', fontStyle: 'italic' }}>Obs: {sug.observacao}</p>}
                                                <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#475569' }}>
                                                    <span>Qtd: <strong>{sug.quantidade}</strong></span>
                                                    <span>Preço Unit: <strong>{fMoney(sug.precoUnitario)}</strong></span>
                                                    <span style={{ color: '#16a34a' }}>Subtotal: <strong>{fMoney(sug.quantidade * sug.precoUnitario)}</strong></span>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={() => handleRecusarSugestao(sug.id)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #fca5a5', backgroundColor: '#fef2f2', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <X size={14}/> Recusar
                                                </button>
                                                <button onClick={() => handleAceitarSugestao(sug.id)} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: '#10b981', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Check size={14}/> Aceitar e Incluir
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {isAddItemModalOpen && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '480px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ margin: 0, fontSize: '18px', color: '#1f2937' }}>Adicionar Produto Extra</h3>
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
    btnVoltar: { padding: '10px 20px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', transition: '0.2s' },
    btnConferir: { padding: '10px 20px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center' },
    btnDevolucao: { padding: '10px 20px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center' },
    btnAddItem: { padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', fontSize: '13px' },
    inputModal: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' },
    statusBadge: (status) => ({ fontWeight: '700', color: ['ENTREGUE_COM_FALTA', 'VALORES_INCOMPATIVEIS', 'DIVERGENCIA', 'PENDENTE_DEVOLUCAO'].includes(status) ? '#dc2626' : '#2563eb' }),
    itemStatus: (status, qtdReal, qtdPedida) => {
        const isFalta = status === 'FALTA' || (qtdReal !== null && qtdReal < qtdPedida);
        const isError = ['AVARIADO', 'INCORRETO'].includes(status) || isFalta;
        return {
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: '600',
            backgroundColor: isError ? '#fee2e2' : status === 'OK' ? '#dcfce7' : '#f3f4f6',
            color: isError ? '#991b1b' : status === 'OK' ? '#166534' : '#374151',
            whiteSpace: 'nowrap'
        }
    }
};