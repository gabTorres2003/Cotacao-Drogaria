import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ReceberPedidoModal from '../components/ReceberPedidoModal';
import DevolucaoModal from '../components/DevolucaoModal';

export default function PedidoDetalhes() {
    const { id } = useParams();
    const [pedido, setPedido] = useState(null);
    const [isReceberModalOpen, setIsReceberModalOpen] = useState(false);
    const [isDevolucaoModalOpen, setIsDevolucaoModalOpen] = useState(false);

    const carregarPedido = () => {
        fetch(`http://localhost:8080/api/pedidos/${id}`)
            .then(res => res.json())
            .then(data => setPedido(data));
    };

    useEffect(() => {
        carregarPedido();
    }, [id]);

    if (!pedido) return <div>Carregando...</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Pedido #{pedido.id} - {pedido.fornecedorNome}</h1>
            
            <div className="bg-gray-50 p-4 rounded mb-6 flex justify-between items-center">
                <div>
                    <p><strong>Status:</strong> {pedido.status}</p>
                    <p><strong>Valor Estimado:</strong> R$ {pedido.valorTotalPedido?.toFixed(2)}</p>
                    {pedido.valorTotalReal && <p><strong>Valor Real (NF):</strong> R$ {pedido.valorTotalReal?.toFixed(2)}</p>}
                </div>
                <div>
                    {pedido.status === 'PENDENTE_ENTREGA' && (
                        <button onClick={() => setIsReceberModalOpen(true)} className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700">
                            Conferir Entrega
                        </button>
                    )}
                    {pedido.status === 'PENDENTE_DEVOLUCAO' && (
                        <button onClick={() => setIsDevolucaoModalOpen(true)} className="bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700 ml-2">
                            Gerenciar Devolução
                        </button>
                    )}
                </div>
            </div>

            <h3 className="text-xl font-semibold mb-2">Itens do Pedido</h3>
            <table className="min-w-full bg-white border">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="py-2 px-4 border">Produto</th>
                        <th className="py-2 px-4 border">Qtd Pedida</th>
                        <th className="py-2 px-4 border">Qtd Real</th>
                        <th className="py-2 px-4 border">Status Item</th>
                    </tr>
                </thead>
                <tbody className="text-center">
                    {pedido.itens?.map(item => (
                        <tr key={item.id}>
                            <td className="py-2 px-4 border">{item.nomeProduto}</td>
                            <td className="py-2 px-4 border">{item.quantidadePedida}</td>
                            <td className="py-2 px-4 border">{item.quantidadeReal !== null ? item.quantidadeReal : '-'}</td>
                            <td className="py-2 px-4 border">{item.statusRecebimento || 'AGUARDANDO'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {isReceberModalOpen && (
                <ReceberPedidoModal 
                    pedidoId={pedido.id} 
                    itens={pedido.itens} 
                    onClose={() => setIsReceberModalOpen(false)} 
                    onSuccess={() => {
                        setIsReceberModalOpen(false);
                        carregarPedido();
                    }}
                />
            )}

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
        </div>
    );
}