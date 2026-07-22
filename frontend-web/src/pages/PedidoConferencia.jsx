import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Sidebar from '../components/layout/Sidebar';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export default function PedidoConferencia() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pedido, setPedido] = useState(null);
  const [conferencia, setConferencia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarPedido();
  }, [id]);

  const carregarPedido = async () => {
    try {
      const response = await api.get(`/api/pedidos/${id}`);
      setPedido(response.data);
      if (response.data.itens) {
        setConferencia(
          response.data.itens.map(item => ({
            id: item.id,
            quantidadeReal: '',
            valorUnitarioReal: '',
            isAvariadoIncorreto: false
          }))
        );
      }
    } catch (error) {
      console.error('Erro ao carregar pedido para conferência:', error);
      alert('Erro ao carregar dados do pedido.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (idItem, field, value) => {
    setConferencia(prev => prev.map(item => 
      item.id === idItem ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSalvando(true);

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
      await api.put(`/api/pedidos/${id}/receber`, payload);
      alert('Conferência finalizada com sucesso!');
      navigate(`/pedidos/${id}`);
    } catch (error) {
      console.error('Erro ao finalizar conferência:', error);
      alert('Ocorreu um erro ao processar o recebimento do pedido.');
    } finally {
      setSalvando(false);
    }
  };

  if (loading) return <div className="p-6">Carregando...</div>;
  if (!pedido) return <div className="p-6">Pedido não encontrado.</div>;

  const fornecedorNome = pedido.fornecedor?.nome || pedido.fornecedorNome || 'Fornecedor Desconhecido';

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '24px', marginBottom: '5px' }}>Conferência de Entrega (Cega)</h1>
            <p style={{ color: '#6b7280' }}>Pedido #{pedido.id} - {fornecedorNome}</p>
          </div>
          <button 
            style={styles.btnVoltar} 
            onClick={() => navigate(`/pedidos/${id}`)}
          >
            <ArrowLeft size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            Voltar aos Detalhes
          </button>
        </header>

        <div style={styles.card}>
          <form onSubmit={handleSubmit}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Produto</th>
                  <th style={{ ...styles.th, width: '150px', textAlign: 'center' }}>Qtd Real</th>
                  <th style={{ ...styles.th, width: '200px', textAlign: 'center' }}>Vlr Unitário Real (R$)</th>
                  <th style={{ ...styles.th, width: '150px', textAlign: 'center' }}>Avariado / Incorreto?</th>
                </tr>
              </thead>
              <tbody>
                {pedido.itens?.map((item, index) => (
                  <tr key={item.id}>
                    <td style={styles.td}>
                      <strong>{item.itemCotacao?.nomeProduto || 'Produto'}</strong>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <input 
                        type="number" 
                        required
                        min="0"
                        style={styles.inputField}
                        value={conferencia[index]?.quantidadeReal ?? ''}
                        onChange={(e) => handleInputChange(item.id, 'quantidadeReal', e.target.value)}
                      />
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <input 
                        type="number" 
                        step="0.01"
                        required
                        min="0"
                        style={styles.inputField}
                        value={conferencia[index]?.valorUnitarioReal ?? ''}
                        onChange={(e) => handleInputChange(item.id, 'valorUnitarioReal', e.target.value)}
                      />
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <input 
                        type="checkbox"
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        checked={conferencia[index]?.isAvariadoIncorreto ?? false}
                        onChange={(e) => handleInputChange(item.id, 'isAvariadoIncorreto', e.target.checked)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <button 
                type="button" 
                onClick={() => navigate(`/pedidos/${id}`)} 
                style={styles.btnCancelar}
                disabled={salvando}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                style={styles.btnSalvar}
                disabled={salvando}
              >
                <CheckCircle size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                {salvando ? 'Salvando...' : 'Finalizar Conferência'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

const styles = {
  card: { backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px' },
  th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #e5e7eb', color: '#4b5563', fontSize: '13px' },
  td: { padding: '12px', borderBottom: '1px solid #e5e7eb', color: '#374151', fontSize: '14px' },
  inputField: { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', width: '100%', textAlign: 'center' },
  btnVoltar: { padding: '10px 20px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center' },
  btnCancelar: { padding: '10px 20px', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' },
  btnSalvar: { padding: '10px 20px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center' }
};