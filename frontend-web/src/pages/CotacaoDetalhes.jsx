import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { MessageCircle, FileText, ArrowRightLeft, ShoppingCart, BarChart2, CheckCircle, Clock } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function CotacaoDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [relatorio, setRelatorio] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modoVisualizacao, setModoVisualizacao] = useState('tabela'); 
  const [decisaoCompra, setDecisaoCompra] = useState({});
  const [enviados, setEnviados] = useState(() => {
    const salvos = localStorage.getItem(`enviados_cotacao_${id}`);
    return salvos ? JSON.parse(salvos) : [];
  });

  useEffect(() => {
    carregarRelatorio();
  }, [id]);

  useEffect(() => {
    localStorage.setItem(`enviados_cotacao_${id}`, JSON.stringify(enviados));
  }, [enviados, id]);

  const carregarRelatorio = async () => {
    try {
      const response = await api.get(`/api/comparativo/relatorio/${id}`);
      setRelatorio(response.data);

      const nomes = new Set();
      const decisaoInicial = {};

      response.data.forEach(item => {
        if (item.precosPorFornecedor) {
          Object.keys(item.precosPorFornecedor).forEach(n => nomes.add(n));
        }
        if (item.fornecedorVencedor) {
          decisaoInicial[item.idItem] = item.fornecedorVencedor;
        }
      });

      setFornecedores(Array.from(nomes));
      setDecisaoCompra(decisaoInicial);

    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao carregar detalhes.');
    } finally {
      setLoading(false);
    }
  };

  const trocarFornecedor = (idItem, novoFornecedor) => {
    setDecisaoCompra(prev => ({ ...prev, [idItem]: novoFornecedor }));
  };

  const gerarPDF = (nomeFornecedor, itens) => {
    const doc = new jsPDF();

    // Cabeçalho
    doc.setFontSize(18);
    doc.text(`Pedido de Compra - ${nomeFornecedor}`, 14, 20);
    
    doc.setFontSize(12);
    doc.text(`Cotação Referência: #${id}`, 14, 30);
    doc.text(`Data: ${new Date().toLocaleDateString()}`, 14, 36);

    // Prepara os dados para a tabela
    const tabelaDados = itens.map(item => {
      const precoUnitario = item.precosPorFornecedor[nomeFornecedor];
      const totalItem = precoUnitario * item.quantidade;
      return [
        item.nomeProduto,
        item.quantidade,
        fMoney(precoUnitario),
        fMoney(totalItem)
      ];
    });

    // Calcula o Total Geral
    const total = itens.reduce((acc, item) => acc + (item.precosPorFornecedor[nomeFornecedor] * item.quantidade), 0);
    autoTable(doc, {
      startY: 45,
      head: [['Produto', 'Qtd', 'Unitário', 'Total']],
      body: tabelaDados,
      foot: [['', '', 'TOTAL PEDIDO', fMoney(total)]],
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] }
    });

    doc.save(`Pedido_${nomeFornecedor}_Cotacao${id}.pdf`);
  };

  // --- LÓGICA DE ENVIO E STATUS ---
  const marcarComoEnviado = async (nomeFornecedor) => {
    const novaListaEnviados = [...enviados, nomeFornecedor];
    setEnviados(novaListaEnviados);

    const fornecedoresComPedidos = fornecedores.filter(f => {
       return relatorio.some(item => decisaoCompra[item.idItem] === f);
    });
    const todosEnviados = fornecedoresComPedidos.every(f => novaListaEnviados.includes(f));

    if (todosEnviados) {
      try {
        await api.put(`/api/cotacao/${id}/status`, { status: 'FINALIZADA' });
        alert('Parabéns! Todos os pedidos foram enviados. Cotação finalizada.');
      } catch (error) {
        console.error('Erro ao finalizar cotação:', error);
      }
    }
  };

  const enviarPedidoWhatsApp = (nomeFornecedor, itensDoPedido) => {
    let totalPedido = 0;
    let texto = `*Olá ${nomeFornecedor}, segue meu pedido da Cotação #${id}:*\n\n`;

    itensDoPedido.forEach(item => {
      const preco = item.precosPorFornecedor[nomeFornecedor];
      const subtotal = preco * item.quantidade;
      totalPedido += subtotal;
      texto += `📦 *${item.nomeProduto}*\n   Qtd: ${item.quantidade} x R$ ${preco.toFixed(2)} = R$ ${subtotal.toFixed(2)}\n`;
    });

    texto += `\n💰 *TOTAL DO PEDIDO: R$ ${totalPedido.toFixed(2)}*`;
    
    const textoCodificado = encodeURIComponent(texto);
    window.open(`https://api.whatsapp.com/send?text=${textoCodificado}`, '_blank');
    
    // Marca como enviado após abrir o Zap
    marcarComoEnviado(nomeFornecedor);
  };

  const fMoney = (v) => v ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-';

  const RenderPedidos = () => {
    const pedidosAgrupados = {};
    fornecedores.forEach(f => pedidosAgrupados[f] = []);

    relatorio.forEach(item => {
      const fornecedorEscolhido = decisaoCompra[item.idItem];
      if (fornecedorEscolhido && item.precosPorFornecedor[fornecedorEscolhido]) {
        pedidosAgrupados[fornecedorEscolhido].push(item);
      }
    });

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
        {Object.entries(pedidosAgrupados).map(([fornecedor, itens]) => {
          if (itens.length === 0) return null;
          
          const totalCard = itens.reduce((acc, item) => acc + (item.precosPorFornecedor[fornecedor] * item.quantidade), 0);
          const jaEnviado = enviados.includes(fornecedor);

          return (
            <div key={fornecedor} style={{...styles.pedidoCard, border: jaEnviado ? '2px solid #22c55e' : '1px solid #e5e7eb'}}>
              <div style={styles.pedidoHeader}>
                <div>
                    <h3 style={{margin:0, display:'flex', alignItems:'center', gap:'8px'}}>
                        {fornecedor}
                        {jaEnviado && <CheckCircle size={20} color="#22c55e" />}
                    </h3>
                    <span style={{fontSize:'12px', color: jaEnviado ? '#22c55e' : '#f59e0b', display:'flex', alignItems:'center', gap:'4px', marginTop:'4px'}}>
                        {jaEnviado ? 'Enviado' : <><Clock size={12}/> Pendente Envio</>}
                    </span>
                </div>
                <span style={styles.badge}>{itens.length} itens</span>
              </div>
              
              <div style={styles.pedidoLista}>
                {itens.map(item => (
                  <div key={item.idItem} style={styles.pedidoItem}>
                    <div>
                      <strong>{item.nomeProduto}</strong>
                      <div style={{fontSize:'12px', color:'#666'}}>
                        {item.quantidade} un x {fMoney(item.precosPorFornecedor[fornecedor])}
                      </div>
                    </div>
                    <div style={{display:'flex', alignItems:'center', gap:'5px'}}>
                        <ArrowRightLeft size={14} color="#999" />
                        <select 
                            style={styles.miniSelect}
                            value={fornecedor}
                            onChange={(e) => trocarFornecedor(item.idItem, e.target.value)}
                            disabled={jaEnviado} 
                        >
                            {fornecedores.map(fOpcao => (
                                item.precosPorFornecedor[fOpcao] ? (
                                    <option key={fOpcao} value={fOpcao}>
                                        {fOpcao} ({fMoney(item.precosPorFornecedor[fOpcao])})
                                    </option>
                                ) : null
                            ))}
                        </select>
                    </div>
                  </div>
                ))}
              </div>

              <div style={styles.pedidoFooter}>
                <div style={{fontSize:'18px', fontWeight:'bold', marginBottom:'10px'}}>
                  Total: {fMoney(totalCard)}
                </div>
                
                <div style={{display:'flex', gap:'10px'}}>
                    <button 
                        style={{...styles.btnAction, backgroundColor: '#ef4444'}}
                        onClick={() => gerarPDF(fornecedor, itens)}
                        title="Baixar PDF"
                    >
                        <FileText size={18} /> PDF
                    </button>
                    
                    <button 
                        style={{...styles.btnAction, backgroundColor: jaEnviado ? '#9ca3af' : '#16a34a', flex: 1}}
                        onClick={() => enviarPedidoWhatsApp(fornecedor, itens)}
                    >
                        <MessageCircle size={18} /> {jaEnviado ? 'Reenviar Zap' : 'Enviar Pedido'}
                    </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    );
  };

  const RenderTabela = () => (
    <div style={styles.card}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Produto</th>
            <th style={styles.th}>Qtd</th>
            {fornecedores.map(f => <th key={f} style={{...styles.th, backgroundColor:'#f9fafb'}}>{f}</th>)}
            <th style={{...styles.th, color:'#059669'}}>Melhor Preço</th>
          </tr>
        </thead>
        <tbody>
          {relatorio.map(item => (
            <tr key={item.idItem}>
              <td style={styles.td}>{item.nomeProduto}</td>
              <td style={styles.td}>{item.quantidade}</td>
              {fornecedores.map(f => {
                const isWinner = f === item.fornecedorVencedor;
                return (
                  <td key={f} style={{...styles.td, fontWeight: isWinner?'bold':'normal', color: isWinner?'#059669':'#374151', backgroundColor: isWinner?'#ecfdf5':'transparent'}}>
                    {fMoney(item.precosPorFornecedor[f])}
                  </td>
                )
              })}
              <td style={{...styles.td, fontWeight:'bold', color:'#059669'}}>{fMoney(item.menorPrecoEncontrado)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const styles = {
    container: { padding: '20px', backgroundColor: '#f3f4f6', minHeight: '100vh', fontFamily: 'Segoe UI' },
    header: { marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: '24px', fontWeight: 'bold', color: '#1f2937' },
    card: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px' },
    th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #e5e7eb', color: '#4b5563', fontSize: '14px' },
    td: { padding: '12px', borderBottom: '1px solid #e5e7eb', color: '#374151', fontSize: '14px' },
    btnVoltar: { padding: '10px 20px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
    toggleContainer: { display: 'flex', gap: '10px', marginBottom: '20px' },
    toggleBtn: (ativo) => ({ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '30px', border: 'none', cursor: 'pointer', fontWeight: '600', backgroundColor: ativo ? '#2563eb' : 'white', color: ativo ? 'white' : '#4b5563', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }),
    pedidoCard: { backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' },
    pedidoHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'start', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' },
    badge: { backgroundColor: '#dbeafe', color: '#1e40af', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' },
    pedidoLista: { flex: 1, maxHeight: '300px', overflowY: 'auto', marginBottom: '15px' },
    pedidoItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px dotted #eee' },
    miniSelect: { padding: '4px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '12px', maxWidth: '120px' },
    pedidoFooter: { borderTop: '1px solid #eee', paddingTop: '15px' },
    btnAction: { padding: '10px', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontWeight: 'bold' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Cotação #{id}</h1>
        <button style={styles.btnVoltar} onClick={() => navigate('/dashboard')}>Voltar</button>
      </div>

      <div style={styles.toggleContainer}>
        <button style={styles.toggleBtn(modoVisualizacao === 'tabela')} onClick={() => setModoVisualizacao('tabela')}>
            <BarChart2 size={18} /> Comparativo
        </button>
        <button style={styles.toggleBtn(modoVisualizacao === 'pedidos')} onClick={() => setModoVisualizacao('pedidos')}>
            <ShoppingCart size={18} /> Gerar Pedidos
        </button>
      </div>

      {loading ? <p>Carregando...</p> : (modoVisualizacao === 'tabela' ? <RenderTabela /> : <RenderPedidos />)}
    </div>
  );
}