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

  if (loading) return <div className="layout"><Sidebar /><main className="main-content"><p>Carregando...</p></main></div>;
  if (!pedido) return <div className="layout"><Sidebar /><main className="main-content"><p>Pedido não encontrado.</p></main></div>;

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
          <div style={{ backgroundColor: '#fffbeb', borderLeft: '4px solid #f59e0b', padding: '12px 16px', marginBottom: '20px', borderRadius: '4px' }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#b45309', fontWeight: '500' }}>
              <strong>Atenção:</strong> Esta é uma conferência cega. Digite as quantidades e valores unitários exatamente como constam na Nota Fiscal física recebida.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Produto</th>
                  <th style={{ ...styles.th, width: '180px', textAlign: 'center', backgroundColor: '#f0fdf4', color: '#166534' }}>Qtd Real (NF)</th>
                  <th style={{ ...styles.th, width: '180px', textAlign: 'center', backgroundColor: '#f0fdf4', color: '#166534' }}>Vlr Unit. (NF)</th>
                  <th style={{ ...styles.th, width: '150px', textAlign: 'center' }}>Avariado / Incorreto?</th>
                </tr>
              </thead>
              <tbody>
                {pedido.itens?.map((item, index) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={styles.td}>
                      <strong>{item.nomeProduto || item.itemCotacao?.nomeProduto || 'Produto Desconhecido'}</strong>
                    </td>
                    
                    <td style={{ ...styles.td, textAlign: 'center', backgroundColor: '#f8fafc' }}>
                      <input 
                        type="number" 
                        required
                        min="0"
                        style={styles.inputField}
                        placeholder="0"
                        value={conferencia[index]?.quantidadeReal ?? ''}
                        onChange={(e) => handleInputChange(item.id, 'quantidadeReal', e.target.value)}
                      />
                    </td>
                    
                    <td style={{ ...styles.td, textAlign: 'center', backgroundColor: '#f8fafc' }}>
                      <input 
                        type="number" 
                        step="0.01"
                        required
                        min="0"
                        placeholder="R$ 0,00"
                        style={styles.inputField}
                        value={conferencia[index]?.valorUnitarioReal ?? ''}
                        onChange={(e) => handleInputChange(item.id, 'valorUnitarioReal', e.target.value)}
                      />
                    </td>
                    
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <input 
                        type="checkbox"
                        title="Marque se a caixa chegou rasgada, quebrada ou com o produto trocado."
                        style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#ef4444' }}
                        checked={conferencia[index]?.isAvariadoIncorreto ?? false}
                        onChange={(e) => handleInputChange(item.id, 'isAvariadoIncorreto', e.target.checked)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '30px', padding: '20px 0', borderTop: '1px solid #e5e7eb' }}>
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
                {salvando ? 'Processando...' : 'Finalizar e Gravar Conferência'}
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
  th: { textAlign: 'left', padding: '14px', borderBottom: '2px solid #e5e7eb', color: '#4b5563', fontSize: '13px' },
  td: { padding: '14px', color: '#374151', fontSize: '14px' },
  inputField: { padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '15px', width: '100%', textAlign: 'center', outline: 'none', fontWeight: 'bold', color: '#166534', backgroundColor: '#f0fdf4' },
  btnVoltar: { padding: '10px 20px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center' },
  btnCancelar: { padding: '12px 24px', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' },
  btnSalvar: { padding: '12px 24px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center' }
};