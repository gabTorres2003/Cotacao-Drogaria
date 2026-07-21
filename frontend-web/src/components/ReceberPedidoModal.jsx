import { useState } from 'react';
import api from '../services/api'; 

export default function ReceberPedidoModal({ pedidoId, itens, onClose, onSuccess }) {
    const [conferencia, setConferencia] = useState(
        itens.map(item => ({
            id: item.id,
            quantidadeReal: '',
            valorUnitarioReal: '',
            isAvariadoIncorreto: false
        }))
    );

    const handleInputChange = (id, field, value) => {
        setConferencia(prev => prev.map(item => 
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const payload = {
            itens: conferencia.map(item => ({
                id: item.id,
                quantidadeReal: Number(item.quantidadeReal),
                valorUnitarioReal: Number(item.valorUnitarioReal),
                statusRecebimento: item.isAvariadoIncorreto ? 'AVARIADO' : 'OK',
                observacaoDevolucao: item.isAvariadoIncorreto ? 'Marcado na conferência' : ''
            }))
        };

        try {
            await api.put(`/api/pedidos/${pedidoId}/receber`, payload);
            onSuccess(); 
        } catch (error) {
            console.error("Erro ao finalizar conferência:", error);
            alert("Ocorreu um erro ao processar o recebimento do pedido.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-4">Conferência de Entrega (Cega)</h2>
                <form onSubmit={handleSubmit}>
                    <table className="min-w-full mb-6">
                        <thead>
                            <tr className="bg-gray-100 text-sm">
                                <th className="p-2">Produto</th>
                                <th className="p-2">Qtd Real</th>
                                <th className="p-2">Vlr Unitário Real (R$)</th>
                                <th className="p-2">Avariado/Incorreto?</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itens.map((item, index) => (
                                <tr key={item.id} className="border-b">
                                    <td className="p-2">{item.nomeProduto}</td>
                                    <td className="p-2">
                                        <input 
                                            type="number" 
                                            required
                                            className="border p-1 w-full"
                                            value={conferencia[index].quantidadeReal}
                                            onChange={(e) => handleInputChange(item.id, 'quantidadeReal', e.target.value)}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input 
                                            type="number" 
                                            step="0.01"
                                            required
                                            className="border p-1 w-full"
                                            value={conferencia[index].valorUnitarioReal}
                                            onChange={(e) => handleInputChange(item.id, 'valorUnitarioReal', e.target.value)}
                                        />
                                    </td>
                                    <td className="p-2 text-center">
                                        <input 
                                            type="checkbox"
                                            checked={conferencia[index].isAvariadoIncorreto}
                                            onChange={(e) => handleInputChange(item.id, 'isAvariadoIncorreto', e.target.checked)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Finalizar Conferência</button>
                    </div>
                </form>
            </div>
        </div>
    );
}