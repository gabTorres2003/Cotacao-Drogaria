import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Sidebar from '../components/layout/Sidebar';
import DevolucaoModal from '../components/DevolucaoModal';
import { ArrowLeft, CheckCircle, RotateCcw, Trash2, CheckSquare } from 'lucide-react';

export default function PedidoDetalhes() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [pedido, setPedido] = useState(null);
    const [isDevolucaoModalOpen, setIsDevolucaoModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

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
                console.error('Erro ao excluir pedido:', error);
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

            if (detalhes.length > 0) {
                return `DIVERGÊNCIA (${detalhes.join(' | ')})`;
            }
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
                        <button 
                            style={{ ...styles.btnVoltar, backgroundColor: '#ef4444', color: 'white' }} 
                            onClick={handleExcluirPedido}
                        >
                            <Trash2 size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                            Excluir Pedido
                        </button>

                        <button style={styles.btnVoltar} onClick={() => navigate('/pedidos')}>
                            <ArrowLeft size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                            Voltar aos Pedidos
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
                                <button 
                                    onClick={() => navigate(`/pedidos/${pedido.id}/conferir`)} 
                                    style={styles.btnConferir}
                                >
                                    <CheckCircle size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                                    Conferir Recebimento (Loja)
                                </button>
                            )}

                            {temDivergencia && (
                                <button 
                                    onClick={aceitarDivergenciaValor} 
                                    style={{ ...styles.btnConferir, backgroundColor: '#059669' }}
                                >
                                    <CheckSquare size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                                    Aceitar Diferenças (Concluir)
                                </button>
                            )}

                            {podeDevolver && (
                                <button 
                                    onClick={() => setIsDevolucaoModalOpen(true)} 
                                    style={styles.btnDevolucao}
                                >
                                    <RotateCcw size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                                    Gerar / Ver Devolução
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div style={styles.card}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>Itens do Pedido</h3>
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
                                    
                                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: '500', color: '#16a34a' }}>
                                        {fMoney(item.valorUnitarioPedido)}
                                    </td>
                                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: '500', color: '#374151' }}>
                                        {fMoney((item.valorUnitarioPedido || 0) * (item.quantidadePedida || 0))}
                                    </td>

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
                        onSuccess={() => {
                            setIsDevolucaoModalOpen(false);
                            carregarPedido();
                        }}
                    />
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