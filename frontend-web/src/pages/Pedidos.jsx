import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Pedidos() {
    const [pedidos, setPedidos] = useState([]);
    const [filtroStatus, setFiltroStatus] = useState('TODOS');

    useEffect(() => {
        fetch('http://localhost:8080/api/pedidos')
            .then(res => res.json())
            .then(data => setPedidos(data))
            .catch(err => console.error("Erro ao buscar pedidos:", err));
    }, []);

    const pedidosFiltrados = filtroStatus === 'TODOS' 
        ? pedidos 
        : pedidos.filter(p => p.status === filtroStatus);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Gerenciamento de Pedidos</h1>
            
            <div className="mb-4">
                <label className="mr-2 font-semibold">Filtrar por Status:</label>
                <select 
                    className="border p-2 rounded"
                    value={filtroStatus} 
                    onChange={(e) => setFiltroStatus(e.target.value)}
                >
                    <option value="TODOS">Todos</option>
                    <option value="PENDENTE_ENTREGA">Pendente de Entrega</option>
                    <option value="ENTREGUE_SUCESSO">Entregue com Sucesso</option>
                    <option value="ENTREGUE_COM_FALTA">Entregue com Falta</option>
                    <option value="VALORES_INCOMPATIVEIS">Valores Incompatíveis</option>
                    <option value="PENDENTE_DEVOLUCAO">Pendente de Devolução</option>
                </select>
            </div>

            <table className="min-w-full bg-white border">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="py-2 px-4 border-b">ID</th>
                        <th className="py-2 px-4 border-b">Fornecedor</th>
                        <th className="py-2 px-4 border-b">Data</th>
                        <th className="py-2 px-4 border-b">Status</th>
                        <th className="py-2 px-4 border-b">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {pedidosFiltrados.map(pedido => (
                        <tr key={pedido.id} className="text-center">
                            <td className="py-2 px-4 border-b">#{pedido.id}</td>
                            <td className="py-2 px-4 border-b">{pedido.fornecedorNome}</td>
                            <td className="py-2 px-4 border-b">{new Date(pedido.dataCriacao).toLocaleDateString()}</td>
                            <td className="py-2 px-4 border-b">{pedido.status}</td>
                            <td className="py-2 px-4 border-b">
                                <Link to={`/pedidos/${pedido.id}`} className="text-blue-500 hover:underline">
                                    Ver Detalhes
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}