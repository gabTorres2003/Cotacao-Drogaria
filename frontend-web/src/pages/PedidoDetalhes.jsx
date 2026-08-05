import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Sidebar from '../components/layout/Sidebar';
import DevolucaoModal from '../components/DevolucaoModal';
import { ArrowLeft, CheckCircle, RotateCcw, Trash2, CheckSquare, Plus, X, Save, AlertTriangle, Edit2, RefreshCw } from 'lucide-react';

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
    const [itemParaTrocar, setItemParaTrocar] = useState(null); // NOVO

    const [isEditandoValores, setIsEditandoValores] = useState(false);
    const [valoresEditados, setValoresEditados] = useState({});

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

    // ATUALIZADO
    const abrirModalAdicao = async () => {
        setIsAddItemModalOpen(true);
        setItemParaTrocar(null);
        setNovoItem({ nomeProduto: '', quantidadePedida: 1, valorUnitarioPedido: '', itemCotacaoId: null });
        
        if (pedido?.cotacao?.id) {
            setTipoAdicao('COTACAO');
            try {
                const res = await api.get(`/api/pedidos/cotacao/${pedido.cotacao.id}/itens-pendentes`);
                setItensPendentes(res.data || []);
            } catch (error) {
                console.error("Erro ao buscar itens pendentes:", error);
            }
        } else {
            setTipoAdicao('MANUAL');
            setItensPendentes([]);
        }
    };

    // NOVO
    const abrirModalTroca = async (item) => {
        setIsAddItemModalOpen(true);
        setItemParaTrocar(item.id);
        setNovoItem({ nomeProduto: '', quantidadePedida: 1, valorUnitarioPedido: '', itemCotacaoId: null });

        if (pedido?.cotacao?.id) {
            setTipoAdicao('COTACAO');
            try {
                const res = await api.get(`/api/pedidos/cotacao/${pedido.cotacao.id}/itens-pendentes`);
                setItensPendentes(res.data || []);
            } catch (error) {
                console.error("Erro ao buscar itens pendentes:", error);
            }
        } else {
            setTipoAdicao('MANUAL');
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
            alert('Valores atualizados com sucesso! A cotação vinculada também foi atualizada.');
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

    return (
        <div className="layout">
            <Sidebar />
            <main className="main-content">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <div>
                        <h1 style={{ fontSize: '24px', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            Pedido #{pedido.id}
                            {pedido.cotacao?.id && (
                                <button 
                                    onClick={() => navigate(`/cotacao/${pedido.cotacao.id}`)}
                                    style={{ backgroundColor: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                                    title="Abrir Cotação vinculada"
                                >
                                    Ver Cotação #{pedido.cotacao.id}
                                </button>
                            )}
                        </h1>
                        <p style={{ color: '#4b5563', fontSize: '15px' }}>
                            <strong>Empresa:</strong> {empresa} &nbsp;|&nbsp; <strong>Vendedor:</strong> {vendedor}
                        </p>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button style={{ ...styles.btnVoltar, backgroundColor: '#ef4444', color: 'white' }} onClick={handleExcluirPedido}>
                            <Trash2 size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Excluir Pedido
                        </button>
                        <button style={styles.btnVoltar} onClick={() => navigate('/pedidos')}>
                            <ArrowLeft size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Voltar aos Pedidos
                        </button>
                    </div>
                </header>

                <div style={styles.infoCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                        <div>
                            <p style={{ fontSize: '15px', marginBottom: '8px' }}><strong>Status Atual:</strong> <span style={styles.statusBadge(pedido.status)}>{getStatusExibicao(pedido)}</span></p>
                            <p style={{ fontSize: '15px', marginBottom: '8px' }}><strong>Valor Estimado:</strong> {fMoney(pedido.valorTotalPedido)}</p>
                            {mostrarReais && pedido.valorTotalReal != null && (
                                <p style={{ fontSize: '15px' }}><strong>Valor Real (NF):</strong> {fMoney(pedido.valorTotalReal)}</p>
                            )}
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
                                            <strong>{item.nomeProduto || item.itemCotacao?.nomeProduto || 'Produto Desconhecido'}</strong>
                                            {item.valorAlteradoAposPedido && (
                                                <span style={{ display: 'block', fontSize: '11px', color: '#d97706', fontWeight: 'bold', marginTop: '4px' }}>
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
                                                <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                                    {/* NOVO: Botão de Trocar Produto */}
                                                    <button 
                                                        onClick={() => abrirModalTroca(item)} 
                                                        style={{ background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer' }}
                                                        title="Trocar este produto"
                                                    >
                                                        <RefreshCw size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleRemoverItemDoPedido(item.id)} 
                                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                                        title="Remover produto (retorna para Cotação Aberta)"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
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

                {isAddItemModalOpen && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '480px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ margin: 0, fontSize: '18px', color: '#1f2937' }}>
                                    {itemParaTrocar ? 'Trocar Produto' : 'Adicionar Produto Extra'}
                                </h3>
                                <button onClick={() => setIsAddItemModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><X size={20} /></button>
                            </div>

                            {/* Aviso quando o pedido não tem cotação vinculada */}
                            {!pedido?.cotacao?.id && tipoAdicao === 'MANUAL' && (
                                <div style={{ padding: '10px', backgroundColor: '#fef2f2', color: '#991b1b', borderRadius: '6px', marginBottom: '15px', fontSize: '13px', fontWeight: 'bold' }}>
                                    Este pedido não está vinculado a uma cotação. Insira o item manualmente.
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', backgroundColor: '#f1f5f9', padding: '6px', borderRadius: '8px' }}>
                                <button 
                                    onClick={() => setTipoAdicao('COTACAO')} 
                                    disabled={!pedido?.cotacao?.id}
                                    style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: !pedido?.cotacao?.id ? 'not-allowed' : 'pointer', backgroundColor: tipoAdicao === 'COTACAO' ? 'white' : 'transparent', color: tipoAdicao === 'COTACAO' ? '#2563eb' : '#64748b', opacity: !pedido?.cotacao?.id ? 0.5 : 1, boxShadow: tipoAdicao === 'COTACAO' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                                >
                                    De Cotações Abertas
                                </button>
                                <button 
                                    onClick={() => { setTipoAdicao('MANUAL'); setNovoItem({ nomeProduto: '', quantidadePedida: 1, valorUnitarioPedido: '', itemCotacaoId: null }); }} 
                                    style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', backgroundColor: tipoAdicao === 'MANUAL' ? 'white' : 'transparent', color: tipoAdicao === 'MANUAL' ? '#2563eb' : '#64748b', boxShadow: tipoAdicao === 'MANUAL' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                                >
                                    Digitar Manualmente
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                
                                {tipoAdicao === 'COTACAO' ? (
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>Selecione um Produto Pendente</label>
                                        <select style={styles.inputModal} value={novoItem.itemCotacaoId || ''} onChange={handleSelectPendente}>
                                            <option value="">{itensPendentes.length === 0 ? 'Nenhum produto pendente encontrado' : '-- Selecione --'}</option>
                                            {itensPendentes.map(p => (
                                                <option key={p.idItem} value={p.idItem}>
                                                    {p.nomeProduto} - Qtd: {p.quantidade}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
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
                                    style={{ width: '100%', padding: '12px', marginTop: '10px', backgroundColor: (tipoAdicao === 'COTACAO' && !novoItem.itemCotacaoId) ? '#9ca3af' : '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: (tipoAdicao === 'COTACAO' && !novoItem.itemCotacaoId) ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                                >
                                    <Save size={18} style={{ marginRight: '8px' }}/> 
                                    {salvandoItem ? 'Processando...' : (itemParaTrocar ? 'Confirmar Troca' : 'Confirmar e Adicionar')}
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