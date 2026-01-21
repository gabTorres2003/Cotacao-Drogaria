import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Sidebar from '../components/layout/Sidebar'; 

export default function CotacaoDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [relatorio, setRelatorio] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarRelatorio();
  }, [id]);

  const carregarRelatorio = async () => {
    try {
      const response = await api.get(`/api/comparativo/relatorio/${id}`);
      setRelatorio(response.data);

      // Lógica para extrair nomes únicos de fornecedores que responderam
      const nomesFornecedores = new Set();
      response.data.forEach(item => {
        if (item.precosPorFornecedor) {
          Object.keys(item.precosPorFornecedor).forEach(nome => nomesFornecedores.add(nome));
        }
      });
      setFornecedores(Array.from(nomesFornecedores));

    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
      alert('Erro ao carregar os detalhes da cotação.');
    } finally {
      setLoading(false);
    }
  };

  // Função para formatar moeda
  const fMoney = (valor) => {
    if (!valor && valor !== 0) return '-';
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const styles = {
    container: { padding: '20px', backgroundColor: '#f3f4f6', minHeight: '100vh' },
    header: { marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: '24px', fontWeight: 'bold', color: '#1f2937' },
    card: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px' },
    th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #e5e7eb', color: '#4b5563', fontSize: '14px' },
    td: { padding: '12px', borderBottom: '1px solid #e5e7eb', color: '#374151', fontSize: '14px' },
    winner: { color: '#059669', fontWeight: 'bold' }, // Verde para o vencedor
    btnVoltar: { padding: '10px 20px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📊 Comparativo da Cotação #{id}</h1>
        <button style={styles.btnVoltar} onClick={() => navigate('/dashboard')}>Voltar</button>
      </div>

      <div style={styles.card}>
        {loading ? <p>Carregando comparativo...</p> : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Produto</th>
                <th style={styles.th}>Qtd</th>
                {/* Colunas Dinâmicas dos Fornecedores */}
                {fornecedores.map(f => (
                  <th key={f} style={{...styles.th, backgroundColor: '#f9fafb'}}>{f}</th>
                ))}
                <th style={{...styles.th, color: '#059669'}}>Menor Preço</th>
                <th style={styles.th}>Vencedor</th>
              </tr>
            </thead>
            <tbody>
              {relatorio.map(item => (
                <tr key={item.idItem}>
                  <td style={styles.td}>{item.nomeProduto}</td>
                  <td style={styles.td}>{item.quantidade}</td>
                  
                  {/* Preços de cada Fornecedor */}
                  {fornecedores.map(fornecedor => {
                    const preco = item.precosPorFornecedor[fornecedor];
                    const isWinner = fornecedor === item.fornecedorVencedor;
                    return (
                      <td key={fornecedor} style={{
                        ...styles.td, 
                        fontWeight: isWinner ? 'bold' : 'normal',
                        color: isWinner ? '#059669' : '#374151',
                        backgroundColor: isWinner ? '#ecfdf5' : 'transparent'
                      }}>
                        {fMoney(preco)}
                      </td>
                    );
                  })}

                  <td style={{...styles.td, fontWeight: 'bold', color: '#059669'}}>
                    {fMoney(item.menorPrecoEncontrado)}
                  </td>
                  <td style={styles.td}>
                     {item.fornecedorVencedor || <span style={{color:'#999'}}>Sem ofertas</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}