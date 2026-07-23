import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Sidebar from '../components/layout/Sidebar';
import DevolucaoModal from '../components/DevolucaoModal';
import { ArrowLeft, CheckCircle, RotateCcw } from 'lucide-react';

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

    const fMoney = (valor) => {
        if (valor == null) return '-';
        return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    if (loading) return <div className="layout"><Sidebar /><main className="main-content"><p>Carregando...</p></main></div>;
    if (!pedido) return <div className="layout"><Sidebar /><main className="main-content"><p>Pedido não encontrado.</p></main></div>;

    const fornecedorNome = pedido.fornecedor?.nome || pedido.fornecedorNome || 'Fornecedor Desconhecido';

    return (
        <div className="layout">
            <Sidebar />
            <main className="main-content">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <div>
                        <h1 style={{ fontSize: '24px', marginBottom: '5px' }}>Pedido #{pedido.id}</h1>
                        <p style={{ color: '#6b7280' }}>Fornecedor: {fornecedorNome}</p>
                    </div>
                    <button style={styles.btnVoltar} onClick={() => navigate('/pedidos')}>
                        <ArrowLeft size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                        Voltar aos Pedidos
                    </button>
                </header>

                <div style={styles.infoCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                        <div>
                            <p style={{ fontSize: '15px', marginBottom: '8px' }}><strong>Status Atual:</strong> <span style={styles.statusBadge}>{pedido.status}</span></p>
                            <p style={{ fontSize: '15px', marginBottom: '8px' }}><strong>Valor Estimado:</strong> {fMoney(pedido.valorTotalPedido)}</p>
                            {pedido.valorTotalReal != null && (
                                <p style={{ fontSize: '15px' }}><strong>Valor Real (NF):</strong> {fMoney(pedido.valorTotalReal)}</p>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {pedido.status === 'PENDENTE_ENTREGA' && (
                                <button 
                                    onClick={() => navigate(`/pedidos/${pedido.id}/conferir`)} 
                                    style={styles.btnConferir}
                                >
                                    <CheckCircle size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                                    Conferir Entrega
                                </button>
                            )}
                            {pedido.status === 'PENDENTE_DEVOLUCAO' && (
                                <button 
                                    onClick={() => setIsDevolucaoModalOpen(true)} 
                                    style={styles.btnDevolucao}
                                >
                                    <RotateCcw size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                                    Gerenciar Devolução
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
                                <th style={{ ...styles.th, textAlign: 'center' }}>Qtd Real</th>
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
                                        <span style={styles.itemStatus(item.statusRecebimento)}>
                                            {item.statusRecebimento || 'AGUARDANDO'}
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
    btnVoltar: { padding: '10px 20px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center' },
    btnConferir: { padding: '10px 20px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center' },
    btnDevolucao: { padding: '10px 20px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center' },
    statusBadge: { fontWeight: '600', color: '#2563eb' },
    itemStatus: (status) => ({
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '600',
        backgroundColor: status === 'AVARIADO' ? '#fee2e2' : status === 'OK' ? '#dcfce7' : '#f3f4f6',
        color: status === 'AVARIADO' ? '#991b1b' : status === 'OK' ? '#166534' : '#374151'
    })
};