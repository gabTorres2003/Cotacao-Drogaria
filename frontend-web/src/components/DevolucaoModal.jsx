import { useState } from 'react';

export default function DevolucaoModal({ pedidoId, onClose, onSuccess }) {
    const [observacao, setObservacao] = useState('');

    const handleConfirmarDevolucao = () => {
        fetch(`http://localhost:8080/api/pedidos/${pedidoId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'ENTREGUE_COM_FALTA' }) 
        }).then(res => {
            if(res.ok) onSuccess();
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded p-6 w-96">
                <h2 className="text-xl font-bold mb-4 text-red-600">Tratar Devolução</h2>
                <p className="mb-4 text-sm text-gray-600">Os itens avariados serão devolvidos ao fornecedor. Deseja registrar a nota de devolução e atualizar o status?</p>
                
                <textarea 
                    className="w-full border p-2 mb-4" 
                    rows="3" 
                    placeholder="Notas da devolução (Opcional)"
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                ></textarea>

                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 border rounded">Cancelar</button>
                    <button onClick={handleConfirmarDevolucao} className="px-4 py-2 bg-red-600 text-white rounded">Confirmar Devolução</button>
                </div>
            </div>
        </div>
    );
}