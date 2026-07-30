import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Sidebar from '../components/layout/Sidebar';
import DevolucaoModal from '../components/DevolucaoModal';
import { ArrowLeft, CheckCircle, RotateCcw, Trash2, CheckSquare, Plus, X, Save } from 'lucide-react';

export default function PedidoDetalhes() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [pedido, setPedido] = useState(null);
    const [isDevolucaoModalOpen, setIsDevolucaoModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
    const [novoItem, setNovoItem] = useState({ nomeProduto: '', quantidadePedida: 1, valorUnitarioPedido: '' });
    const [salvandoItem, setSalvandoItem] = useState(false);

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

    const handleSalvarNovoItem = async () => {
        if (!novoItem.nomeProduto || !novoItem.quantidadePedida || !novoItem.valorUnitarioPedido) {
            alert('Preencha todos os campos do produto.');
            return;
        }

        setSalvandoItem(true);
        try {
            await api.post(`/api/pedidos/${id}/itens`, {
                nomeProduto: novoItem.nomeProduto,
                quantidadePedida: Number(novoItem.quantidadePedida),
                valorUnitarioPedido: Number(novoItem.valorUnitarioPedido)
            });
            alert('Produto adicionado com sucesso!');
            setIsAddItemModalOpen(false);
            setNovoItem({ nomeProduto: '', quantidadePedida: 1, valorUnitarioPedido: '' });
            carregarPedido();
        } catch (error) {
            alert('Erro ao adicionar produto: ' + (error.response?.data?.message || error.message));
        } finally {
            setSalvandoItem(false);
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

        if (['ENTREGUE_COM_FALTA', 'VALORES_INCOMPATIVEIS', 'DIVERGENCIA'].includes(status)) {
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

            if (detalhes.length > 0) return `DIVERGÊNCIA (${detalhes.join(' | ')})`;
            if (status === 'VALORES_INCOMPATIVEIS') return 'DIVERGÊNCIA DE VALORES (IMPOSTOS/NF)';
            return 'DIVERGÊNCIA IDENTIFICADA';
        }

        return status;
    };

    if (loading) return <div className="layout"><Sidebar /><main className="main-content"><p>Carregando...</p></main></div>;
    if (!pedido) return <div className="layout"><Sidebar /><main className="main-content"><p>Pedido não encontrado.</p></main></div>;

    const fornecedorNome = pedido.fornecedor?.nome || pedido.fornecedorNome || 'Fornecedor Desconhecido';
    
    const podeConferir = pedido.status === 'PENDENTE_ENTREGA' || pedido.status === 'CONFIRMADO_FORNECEDOR';
    const temDivergencia = ['ENTREGUE_COM_FALTA', 'VALORES_INCOMPATIVEIS', 'DIVERGENCIA'].includes(pedido.status);
    const podeDevolver = temDivergencia || pedido.status === 'ENTREGUE_SUCESSO'; 
    const podeAdicionarProduto = pedido.status === 'PENDENTE_ENTREGA'; // Permite adicionar itens apenas se o fornecedor ainda não processou.

    return (
        <div className="layout">
            <Sidebar />
            <main className="main-content">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <div>
                        <h1 style={{ fontSize: '24px', marginBottom: '5px' }}>Pedido #{pedido.id}</h1>
                        <p style={{ color: '#6b7280' }}>Fornecedor: {fornecedorNome}</p>
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
                            {pedido.valorTotalReal != null && (
                                <p style={{ fontSize: '15px' }}><strong>Valor Real (NF):</strong> {fMoney(pedido.valorTotalReal)}</p>
                            )}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            {podeConferir && (
                                <button onClick={() => navigate(`/pedidos/${pedido.id}/conferir`)} style={styles.btnConferir}>
                                    <CheckCircle size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Conferir Recebimento (Loja)
                                </button>
                            )}
                            {temDivergencia && (
                                <button onClick={aceitarDivergenciaValor} style={{ ...styles.btnConferir, backgroundColor: '#059669' }}>
                                    <CheckSquare size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Aceitar Diferenças (Concluir)
                                </button>
                            )}
                            {podeDevolver && (
                                <button onClick={() => setIsDevolucaoModalOpen(true)} style={styles.btnDevolucao}>
                                    <RotateCcw size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Gerar / Ver Devolução
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div style={styles.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>Itens do Pedido</h3>
                        
                        {/* NOVO: Botão para abrir o modal de adicionar produto manual */}
                        {podeAdicionarProduto && (
                            <button onClick={() => setIsAddItemModalOpen(true)} style={styles.btnAddItem}>
                                <Plus size={16} style={{ marginRight: '6px' }} /> Adicionar Produto Extra
                            </button>
                        )}
                    </div>

                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Produto</th>
                                <th style={{ ...styles.th, textAlign: 'center' }}>Qtd Solicitada</th>
                                <th style={{ ...styles.th, textAlign: 'right' }}>Valor Unit.</th>
                                <th style={{ ...styles.th, textAlign: 'right' }}>Subtotal</th>
                                <th style={{ ...styles.th, textAlign: 'center' }}>Qtd Real (NF)</th>
                                <th style={{ ...styles.th, textAlign: 'center' }}>Status Item</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pedido.itens?.map(item => (
                                <tr key={item.id}>
                                    <td style={styles.td}>
                                        <strong>{item.nomeProduto || item.itemCotacao?.nomeProduto || 'Produto Desconhecido'}</strong>
                                    </td>
                                    <td style={{ ...styles.td, textAlign: 'center' }}>{item.quantidadePedida} un</td>
                                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: '500', color: '#16a34a' }}>{fMoney(item.valorUnitarioPedido)}</td>
                                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: '500', color: '#374151' }}>{fMoney((item.valorUnitarioPedido || 0) * (item.quantidadePedida || 0))}</td>
                                    <td style={{ ...styles.td, textAlign: 'center' }}>{item.quantidadeReal !== null ? `${item.quantidadeReal} un` : '-'}</td>
                                    <td style={{ ...styles.td, textAlign: 'center' }}>
                                        <span style={styles.itemStatus(item.statusRecebimento, item.quantidadeReal, item.quantidadePedida)}>
                                            {item.quantidadeReal !== null && item.quantidadeReal < item.quantidadePedida && item.statusRecebimento === 'OK' 
                                                ? 'FALTA PARCIAL' 
                                                : (item.statusRecebimento || 'AGUARDANDO')}
                                        </span>
                                    </td>
                                </tr>
                            ))}
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

                {/* NOVO: Modal para Adicionar Produto Manualmente */}
                {isAddItemModalOpen && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ margin: 0, fontSize: '18px', color: '#1f2937' }}>Adicionar Produto Extra</h3>
                                <button onClick={() => setIsAddItemModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><X size={20} /></button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>Nome do Produto</label>
                                    <input type="text" style={styles.inputModal} value={novoItem.nomeProduto} onChange={e => setNovoItem({...novoItem, nomeProduto: e.target.value})} placeholder="Ex: Neosaldina C/ 30" />
                                </div>
                                
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
                                    disabled={salvandoItem}
                                    style={{ width: '100%', padding: '12px', marginTop: '10px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
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
    th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #e5e7eb', color: '#4b5563', fontSize: '13px' },
    td: { padding: '12px', borderBottom: '1px solid #e5e7eb', color: '#374151', fontSize: '14px' },
    btnVoltar: { padding: '10px 20px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', transition: '0.2s' },
    btnConferir: { padding: '10px 20px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center' },
    btnDevolucao: { padding: '10px 20px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center' },
    btnAddItem: { padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', fontSize: '13px' },
    inputModal: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' },
    statusBadge: (status) => ({ fontWeight: '700', color: ['ENTREGUE_COM_FALTA', 'VALORES_INCOMPATIVEIS', 'DIVERGENCIA'].includes(status) ? '#dc2626' : '#2563eb' }),
    itemStatus: (status, qtdReal, qtdPedida) => {
        const isFalta = status === 'FALTA' || (qtdReal !== null && qtdReal < qtdPedida);
        const isError = ['AVARIADO', 'INCORRETO'].includes(status) || isFalta;
        return {
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '600',
            backgroundColor: isError ? '#fee2e2' : status === 'OK' ? '#dcfce7' : '#f3f4f6',
            color: isError ? '#991b1b' : status === 'OK' ? '#166534' : '#374151'
        }
    }
};