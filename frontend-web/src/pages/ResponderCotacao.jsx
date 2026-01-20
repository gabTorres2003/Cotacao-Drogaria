import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

export default function ResponderCotacao() {
  const { idCotacao } = useParams();
  
  const searchParams = new URLSearchParams(window.location.search);
  const idFornecedor = searchParams.get('f') || 1;

  const [itens, setItens] = useState([]);
  const [precos, setPrecos] = useState({});
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
    setPrecos(prev => ({
      ...prev,
      [idItem]: valor
    }));
  };

  const enviarResposta = async () => {
    if (Object.keys(precos).length === 0) {
      alert('Preencha pelo menos um preço antes de enviar.');
      return;
    }

    try {
      const payload = Object.entries(precos).map(([idItem, valorTexto]) => ({
        idItem: parseInt(idItem),
        idFornecedor: parseInt(idFornecedor),
        preco: parseFloat(valorTexto.replace(',', '.'))
      }));

      // Envia para o Backend
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
      padding: '16px',
      marginBottom: '12px',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
    },
    info: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
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
    inputArea: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151'
    },
    input: {
      padding: '10px',
      width: '120px',
      borderRadius: '6px',
      border: '1px solid #d1d5db',
      fontSize: '16px',
      textAlign: 'right'
    },
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
        <p>Seus preços foram registrados no sistema.</p>
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
            itens.map(item => (
              <div key={item.idItem} style={styles.card}>
                <div style={styles.info}>
                  <span style={styles.productName}>{item.nomeProduto}</span>
                  <span style={styles.quantity}>Quantidade: {item.quantidade}</span>
                </div>
                <div style={styles.inputArea}>
                  <span>R$</span>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0,00"
                    style={styles.input}
                    onChange={(e) => handlePrecoChange(item.idItem, e.target.value)}
                  />
                </div>
              </div>
            ))
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