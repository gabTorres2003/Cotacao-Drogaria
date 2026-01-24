import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

export default function ResponderCotacao() {
  const { idCotacao } = useParams();
  
  const searchParams = new URLSearchParams(window.location.search);
  const idFornecedor = searchParams.get('f') || 1;

  const [itens, setItens] = useState([]);
  const [precos, setPrecos] = useState({});
  const [emFalta, setEmFalta] = useState({});
  const [loading, setLoading] = useState(true);
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    carregarItens();
  }, []);

  const carregarItens = async () => {
    try {
      const response = await api.get(`/api/comparativo/listar-itens/${idCotacao}`);
      if (Array.isArray(response.data)) {
        setItens(response.data);
      } else {
        setItens([]);
      }
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
      alert('Erro ao carregar a cotação.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrecoChange = (idItem, valor) => {
    setEmFalta(prev => ({ ...prev, [idItem]: false }));
    setPrecos(prev => ({
      ...prev,
      [idItem]: valor
    }));
  };

  const toggleEmFalta = (idItem) => {
    setEmFalta(prev => {
      const isFalta = !prev[idItem];
      
      if (isFalta) {
        setPrecos(prevPrecos => {
          const newPrecos = { ...prevPrecos };
          delete newPrecos[idItem];
          return newPrecos;
        });
      }
      
      return { ...prev, [idItem]: isFalta };
    });
  };

  const enviarResposta = async () => {
    const temPreco = Object.keys(precos).length > 0;
    const temFalta = Object.values(emFalta).some(v => v === true);

    if (!temPreco && !temFalta) {
      alert('Preencha pelo menos um preço ou indique itens em falta antes de enviar.');
      return;
    }

    try {
      const payload = itens
        .filter(item => precos[item.idItem] || emFalta[item.idItem]) 
        .map(item => {
          let precoFinal = 0;

          if (emFalta[item.idItem]) {
            precoFinal = -1; // CÓDIGO PARA "EM FALTA"
          } else {
            precoFinal = parseFloat(precos[item.idItem].replace(',', '.'));
          }

          return {
            idItem: item.idItem,
            idFornecedor: parseInt(idFornecedor),
            preco: precoFinal
          };
        });

      if (payload.length === 0) {
        alert("Preencha algum valor.");
        return;
      }

      await api.post('/api/fornecedor/salvar-respostas', payload);

      setEnviado(true);
      alert('Cotação enviada com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar:', error);
      alert('Erro ao enviar cotação: ' + (error.response?.data || 'Erro desconhecido'));
    }
  };

  const styles = {
    container: {
      maxWidth: '800px',
      margin: '40px auto',
      padding: '20px',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      backgroundColor: '#f9fafb',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
    },
    header: {
      textAlign: 'center',
      marginBottom: '30px',
      color: '#1f2937'
    },
    successBox: {
      textAlign: 'center',
      padding: '40px',
      backgroundColor: '#d1fae5',
      color: '#065f46',
      borderRadius: '8px',
      marginTop: '50px',
      maxWidth: '500px',
      margin: '50px auto'
    },
    card: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: 'white',
      padding: '20px',
      marginBottom: '12px',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      flexWrap: 'wrap',
      gap: '10px'
    },
    info: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      flex: 1,
      minWidth: '200px'
    },
    productName: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#374151'
    },
    quantity: {
      fontSize: '14px',
      color: '#6b7280'
    },
    actionsArea: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    inputGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '5px'
    },
    currency: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151'
    },
    input: {
      padding: '10px',
      width: '100px',
      borderRadius: '6px',
      border: '1px solid #d1d5db',
      fontSize: '16px',
      textAlign: 'right',
      transition: 'all 0.2s'
    },
    btnFalta: (ativo) => ({
      padding: '8px 12px',
      borderRadius: '6px',
      border: '1px solid',
      borderColor: ativo ? '#ef4444' : '#d1d5db',
      backgroundColor: ativo ? '#fee2e2' : 'white',
      color: ativo ? '#b91c1c' : '#6b7280',
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    }),
    button: {
      width: '100%',
      padding: '14px',
      backgroundColor: '#2563eb',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      marginTop: '20px',
      transition: 'background-color 0.2s'
    }
  };

  // TELA DE SUCESSO
  if (enviado) {
    return (
      <div style={styles.successBox}>
        <h2 style={{ marginBottom: '10px' }}>✅ Proposta Enviada!</h2>
        <p>Obrigado por responder à cotação.</p>
        <p>Seus preços (e itens em falta) foram registrados.</p>
      </div>
    );
  }

  // TELA DE FORMULÁRIO
  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Responder Cotação #{idCotacao}</h1>
      
      {loading ? (
        <p style={{ textAlign: 'center', color: '#666' }}>Carregando itens...</p>
      ) : (
        <div>
          {itens.length === 0 ? (
            <p style={{ textAlign: 'center' }}>Nenhum item nesta cotação.</p>
          ) : (
            itens.map(item => {
              const isFalta = !!emFalta[item.idItem];

              return (
                <div key={item.idItem} style={styles.card}>
                  <div style={styles.info}>
                    <span style={styles.productName}>{item.nomeProduto}</span>
                    <span style={styles.quantity}>Qtd Solicitada: {item.quantidade}</span>
                  </div>

                  <div style={styles.actionsArea}>
                    {/* Botão Em Falta */}
                    <button 
                      style={styles.btnFalta(isFalta)}
                      onClick={() => toggleEmFalta(item.idItem)}
                      title="Marcar produto como indisponível"
                    >
                      {isFalta ? '🚫 Em falta' : 'Indisponível?'}
                    </button>

                    {/* Input de Preço */}
                    <div style={{...styles.inputGroup, opacity: isFalta ? 0.4 : 1}}>
                      <span style={styles.currency}>R$</span>
                      <input 
                        type="number" 
                        step="0.01"
                        placeholder="0,00"
                        style={{
                            ...styles.input,
                            backgroundColor: isFalta ? '#f3f4f6' : 'white',
                            cursor: isFalta ? 'not-allowed' : 'text'
                        }}
                        value={precos[item.idItem] || ''}
                        onChange={(e) => handlePrecoChange(item.idItem, e.target.value)}
                        disabled={isFalta} 
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
          
          {itens.length > 0 && (
            <button 
              style={styles.button} 
              onClick={enviarResposta}
              onMouseOver={(e) => e.target.style.backgroundColor = '#1d4ed8'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#2563eb'}
            >
              Enviar Proposta
            </button>
          )}
        </div>
      )}
    </div>
  );
}