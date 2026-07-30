import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Sidebar from '../components/layout/Sidebar';
import { ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';

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
            <h1 style={{ fontSize: '24px', marginBottom: '5px' }}>Conferência de Entrega (Nota Fiscal)</h1>
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
                  <th style={{ ...styles.th, width: '100px', textAlign: 'center', backgroundColor: '#f9fafb' }}>Qtd Pedida</th>
                  <th style={{ ...styles.th, width: '110px', textAlign: 'center', backgroundColor: '#f0fdf4', color: '#166534' }}>Qtd Real (NF)</th>
                  <th style={{ ...styles.th, width: '110px', textAlign: 'right', backgroundColor: '#f9fafb' }}>Vlr Unit. (Prev)</th>
                  <th style={{ ...styles.th, width: '130px', textAlign: 'right', backgroundColor: '#f0fdf4', color: '#166534' }}>Vlr Unit. (NF)</th>
                  <th style={{ ...styles.th, width: '100px', textAlign: 'center' }}>% Imposto</th>
                  <th style={{ ...styles.th, width: '120px', textAlign: 'right', backgroundColor: '#f9fafb' }}>Subtotal (Prev)</th>
                  <th style={{ ...styles.th, width: '130px', textAlign: 'right', backgroundColor: '#f0fdf4', color: '#166534' }}>Subtotal (Real)</th>
                  <th style={{ ...styles.th, width: '100px', textAlign: 'center' }}>Avariado / Incorreto?</th>
                </tr>
              </thead>
              <tbody>
                {pedido.itens?.map((item, index) => {
                  const valPrevNum = item.valorUnitarioPedido || 0;
                  const inputValReal = conferencia[index]?.valorUnitarioReal;
                  const valRealNum = parseFloat(inputValReal);
                  
                  const inputQtdReal = conferencia[index]?.quantidadeReal;
                  const qtdRealNum = parseFloat(inputQtdReal);
                  const qtdPedidaNum = item.quantidadePedida || 0;

                  let pctImposto = 0;
                  let alertImposto = false;
                  let diferencaTexto = '-';
                  let diferencaCor = '#9ca3af';

                  if (!isNaN(valRealNum) && valPrevNum > 0 && inputValReal !== '') {
                      if (valRealNum > valPrevNum) {
                          pctImposto = ((valRealNum - valPrevNum) / valPrevNum) * 100;
                          if (pctImposto > 5) alertImposto = true;
                          diferencaTexto = `+${pctImposto.toFixed(1)}%`;
                          diferencaCor = alertImposto ? '#dc2626' : '#d97706';
                      } else if (valRealNum < valPrevNum) {
                          const pctNeg = ((valPrevNum - valRealNum) / valPrevNum) * 100;
                          diferencaTexto = `-${pctNeg.toFixed(1)}%`;
                          diferencaCor = '#16a34a';
                      } else {
                          diferencaTexto = '0%';
                          diferencaCor = '#6b7280';
                      }
                  }

                  const subtotalPrevisto = qtdPedidaNum * valPrevNum;
                  const subtotalReal = (!isNaN(qtdRealNum) && !isNaN(valRealNum)) ? (qtdRealNum * valRealNum) : 0;

                  return (
                    <tr key={item.id}>
                      <td style={styles.td}>
                        <strong>{item.nomeProduto || item.itemCotacao?.nomeProduto || 'Produto Desconhecido'}</strong>
                      </td>
                      
                      <td style={{ ...styles.td, textAlign: 'center', backgroundColor: '#f9fafb', color: '#4b5563' }}>
                        {qtdPedidaNum} un
                      </td>

                      <td style={{ ...styles.td, textAlign: 'center', backgroundColor: '#f0fdf4' }}>
                        <input 
                          type="number" 
                          required
                          min="0"
                          style={{ ...styles.inputField, borderColor: '#86efac', backgroundColor: 'white' }}
                          value={inputQtdReal ?? ''}
                          onChange={(e) => handleInputChange(item.id, 'quantidadeReal', e.target.value)}
                        />
                      </td>

                      <td style={{ ...styles.td, textAlign: 'right', backgroundColor: '#f9fafb', color: '#4b5563' }}>
                        {fMoney(valPrevNum)}
                      </td>

                      <td style={{ ...styles.td, textAlign: 'center', backgroundColor: '#f0fdf4' }}>
                        <input 
                          type="number" 
                          step="0.01"
                          required
                          min="0"
                          style={{ ...styles.inputField, borderColor: '#86efac', backgroundColor: 'white', textAlign: 'right' }}
                          value={inputValReal ?? ''}
                          onChange={(e) => handleInputChange(item.id, 'valorUnitarioReal', e.target.value)}
                        />
                      </td>

                      <td style={{ ...styles.td, textAlign: 'center', fontWeight: 'bold', color: diferencaCor }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          {alertImposto && <AlertTriangle size={14} color="#dc2626" />}
                          {diferencaTexto}
                        </div>
                      </td>

                      <td style={{ ...styles.td, textAlign: 'right', backgroundColor: '#f9fafb', color: '#4b5563' }}>
                        {fMoney(subtotalPrevisto)}
                      </td>

                      <td style={{ ...styles.td, textAlign: 'right', backgroundColor: '#f0fdf4', fontWeight: 'bold', color: '#166534' }}>
                        {fMoney(subtotalReal)}
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
                  )
                })}
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
                {salvando ? 'Processando Recebimento...' : 'Finalizar e Gravar Conferência'}
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
  th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #e5e7eb', color: '#4b5563', fontSize: '12px' },
  td: { padding: '12px', borderBottom: '1px solid #e5e7eb', color: '#374151', fontSize: '13px' },
  inputField: { padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', width: '100%', textAlign: 'center', outline: 'none' },
  btnVoltar: { padding: '10px 20px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center' },
  btnCancelar: { padding: '12px 24px', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' },
  btnSalvar: { padding: '12px 24px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center' }
};