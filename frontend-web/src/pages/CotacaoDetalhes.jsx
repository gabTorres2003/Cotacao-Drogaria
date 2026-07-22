import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  MessageCircle,
  FileText,
  ArrowRightLeft,
  ShoppingCart,
  BarChart2,
  CheckCircle,
  Clock,
  Edit2,
  Trash2,
  Save,
  X,
} from 'lucide-react'

export default function CotacaoDetalhes() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [relatorio, setRelatorio] = useState([])
  const [fornecedores, setFornecedores] = useState([])
  const [loading, setLoading] = useState(true)
  const [modoVisualizacao, setModoVisualizacao] = useState('tabela')
  const [decisaoCompra, setDecisaoCompra] = useState({})
  const [showModal, setShowModal] = useState(false)
  const [pedidosGerados, setPedidosGerados] = useState([])
  const [salvandoPedidos, setSalvandoPedidos] = useState(false)

  const [enviados, setEnviados] = useState(() => {
    const salvos = localStorage.getItem(`enviados_cotacao_${id}`)
    return salvos ? JSON.parse(salvos) : []
  })

  const [editandoItem, setEditandoItem] = useState(null)
  const [formEdicao, setFormEdicao] = useState({ nome: '', qtd: 1 })

  useEffect(() => {
    carregarRelatorio()
  }, [id])

  useEffect(() => {
    localStorage.setItem(`enviados_cotacao_${id}`, JSON.stringify(enviados))
  }, [enviados, id])

  const carregarRelatorio = async () => {
    try {
      const response = await api.get(`/api/comparativo/relatorio/${id}`)
      setRelatorio(response.data)

      const nomes = new Set()
      const decisaoInicial = {}

      response.data.forEach((item) => {
        if (item.precosPorFornecedor) {
          Object.keys(item.precosPorFornecedor).forEach((n) => nomes.add(n))
        }
        if (
          item.fornecedorVencedor &&
          item.fornecedorVencedor !== 'Sem ofertas'
        ) {
          decisaoInicial[item.idItem] = item.fornecedorVencedor
        }
      })

      setFornecedores(Array.from(nomes))
      setDecisaoCompra(decisaoInicial)
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao carregar detalhes.')
    } finally {
      setLoading(false)
    }
  }

  const iniciarEdicao = (item) => {
    setEditandoItem(item.idItem)
    setFormEdicao({ nome: item.nomeProduto, qtd: item.quantidade })
  }

  const salvarEdicao = async (idItem) => {
    try {
      await api.put(`/api/cotacao/item/${idItem}`, {
        nomeProduto: formEdicao.nome,
        quantidade: formEdicao.qtd,
      })
      setEditandoItem(null)
      carregarRelatorio()
    } catch (error) {
      alert('Erro ao atualizar produto.')
    }
  }

  const deletarItem = async (idItem) => {
    if (window.confirm('Tem certeza que deseja remover este produto da cotação?')) {
      try {
        await api.delete(`/api/cotacao/item/${idItem}`)
        carregarRelatorio()
      } catch (error) {
        alert('Erro ao remover produto.')
      }
    }
  }

  const handleGerarPedidos = () => {
    const pedidosPorFornecedor = {}

    Object.entries(decisaoCompra).forEach(([idItem, fornecedorNome]) => {
      if (fornecedorNome === 'Sem ofertas') return

      if (!pedidosPorFornecedor[fornecedorNome]) {
        pedidosPorFornecedor[fornecedorNome] = {
          fornecedorNome: fornecedorNome,
          itens: [],
          total: 0
        }
      }

      const itemRelatorio = relatorio.find((r) => r.idItem === Number(idItem))
      
      if (itemRelatorio) {
        const qtd = itemRelatorio.quantidade;
        const preco = itemRelatorio.precosPorFornecedor[fornecedorNome];
        
        pedidosPorFornecedor[fornecedorNome].itens.push({
          idItem: Number(idItem),
          nomeProduto: itemRelatorio.nomeProduto,
          quantidadePedida: qtd,
          valorUnitarioPedido: preco,
          subtotal: qtd * preco
        })
        pedidosPorFornecedor[fornecedorNome].total += (qtd * preco);
      }
    })

    const pedidosArray = Object.values(pedidosPorFornecedor)
    
    if (pedidosArray.length === 0) {
      alert('Nenhum fornecedor vencedor selecionado para gerar pedido.')
      return
    }

    setPedidosGerados(pedidosArray)
    setShowModal(true)
  }

  const gerarPDF = (pedido) => {
    const doc = new jsPDF()
    const dataAtual = new Date()
    const diaFormatado = dataAtual.toLocaleDateString('pt-BR')
    const diaArquivo = diaFormatado.replace(/\//g, '-') 
    
    doc.setFontSize(18)
    doc.text(`Pedido de Compra`, 14, 20)
    
    doc.setFontSize(12)
    doc.text(`Fornecedor: ${pedido.fornecedorNome}`, 14, 30)
    doc.text(`Data: ${diaFormatado}`, 14, 36)
    
    const tableData = pedido.itens.map(item => [
      item.nomeProduto,
      `${item.quantidadePedida} un`,
      fMoney(item.valorUnitarioPedido),
      fMoney(item.subtotal)
    ])

    autoTable(doc, {
      startY: 45,
      head: [['Produto', 'Quantidade', 'Valor Unit.', 'Subtotal']],
      body: tableData,
      foot: [['', '', 'Total do Pedido:', fMoney(pedido.total)]],
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] }
    })

    doc.save(`cotacao dia ${diaArquivo} ${pedido.fornecedorNome}.pdf`)
  }

  const salvarPedidosNoBanco = async () => {
    setSalvandoPedidos(true)
    try {
      for (const pedido of pedidosGerados) {
        const payload = {
          cotacaoId: Number(id),
          fornecedorNome: pedido.fornecedorNome,
          itens: pedido.itens.map(item => ({
            itemCotacaoId: item.idItem,
            quantidadePedida: item.quantidadePedida,
            valorUnitarioPedido: item.valorUnitarioPedido
          }))
        }
  
        await api.post('/api/pedidos/gerar', payload)
      }
      
      alert('Pedidos gerados e salvos com sucesso no sistema!')
      setShowModal(false)
      navigate('/pedidos')
      
    } catch (error) {
      console.error('Erro ao salvar pedidos no banco:', error)
      alert('Erro ao salvar os pedidos. Verifique se o nome do fornecedor está idêntico ao cadastrado.')
    } finally {
      setSalvandoPedidos(false)
    }
  }

  const handleQuantidadeModalChange = (fornecedorNome, idItem, novaQtd) => {
    const qtdNumber = Number(novaQtd) > 0 ? Number(novaQtd) : 1; 
    
    setPedidosGerados(prev => prev.map(pedido => {
      if (pedido.fornecedorNome === fornecedorNome) {
        const novosItens = pedido.itens.map(item => 
          item.idItem === idItem 
            ? { ...item, quantidadePedida: qtdNumber, subtotal: qtdNumber * item.valorUnitarioPedido }
            : item
        );
        return { ...pedido, itens: novosItens, total: novosItens.reduce((acc, i) => acc + i.subtotal, 0) };
      }
      return pedido;
    }));
  };

  const handleFornecedorModalChange = (fornecedorAtual, novoFornecedor, idItem) => {
    if (novoFornecedor === fornecedorAtual) return;
    
    if (!window.confirm(`Tem certeza que deseja mover este produto para "${novoFornecedor}"? O valor unitário poderá ser maior que a melhor oferta.`)) {
      return;
    }

    const itemBase = relatorio.find(r => r.idItem === idItem);
    const novoPreco = itemBase.precosPorFornecedor[novoFornecedor];

    if (!novoPreco || novoPreco === -1) {
      alert(`Operação cancelada: O fornecedor ${novoFornecedor} não possui um preço cadastrado (ou está em falta) para este produto.`);
      return;
    }

    setPedidosGerados(prev => {
      let itemRemovido = null;

      const prevSemItem = prev.map(pedido => {
        if (pedido.fornecedorNome === fornecedorAtual) {
          itemRemovido = pedido.itens.find(i => i.idItem === idItem);
          const novosItens = pedido.itens.filter(i => i.idItem !== idItem);
          return { ...pedido, itens: novosItens, total: novosItens.reduce((acc, it) => acc + it.subtotal, 0) };
        }
        return pedido;
      });

      const itemAtualizado = {
        ...itemRemovido,
        valorUnitarioPedido: novoPreco,
        subtotal: itemRemovido.quantidadePedida * novoPreco
      };

      let fornecedorJaExiste = false;
      const novoState = prevSemItem.map(pedido => {
        if (pedido.fornecedorNome === novoFornecedor) {
          fornecedorJaExiste = true;
          const novosItens = [...pedido.itens, itemAtualizado];
          return { ...pedido, itens: novosItens, total: novosItens.reduce((acc, it) => acc + it.subtotal, 0) };
        }
        return pedido;
      });

      if (!fornecedorJaExiste) {
        novoState.push({
          fornecedorNome: novoFornecedor,
          itens: [itemAtualizado],
          total: itemAtualizado.subtotal
        });
      }

      return novoState.filter(pedido => pedido.itens.length > 0);
    });
  };

  const fMoney = (v) =>
    v != null ? Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'
    
  const fData = (dataIso) => {
    if (!dataIso) return '-';
    return new Date(dataIso + 'T12:00:00').toLocaleDateString('pt-BR');
  };

  const RenderTabela = () => (
    <div style={styles.card}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Produto</th>
            <th style={styles.th}>Qtd. Solicitada</th>
            <th style={styles.th}>Estoque Atual</th>
            <th style={styles.th}>Vendido no Mês</th>
            <th style={styles.th}>Vendido pós Últ. Compra</th>
            <th style={styles.th}>Data Últ. Compra</th>
            <th style={styles.th}>Qtd. Últ. Compra</th>
            <th style={styles.th}>Data Últ. Venda</th>
            <th style={{ ...styles.th, color: '#4f46e5', textAlign: 'right' }}>
              Preço Última Compra
            </th>

            {fornecedores.map((f) => (
              <th
                key={f}
                style={{
                  ...styles.th,
                  backgroundColor: '#f9fafb',
                  textAlign: 'center',
                }}
              >
                {f}
              </th>
            ))}

            <th style={{ ...styles.th, textAlign: 'center' }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {relatorio.map((item) => (
            <tr key={item.idItem}>
              <td style={styles.td}>
                {editandoItem === item.idItem ? (
                  <input
                    style={styles.inputEdicao}
                    value={formEdicao.nome}
                    onChange={(e) =>
                      setFormEdicao({ ...formEdicao, nome: e.target.value })
                    }
                  />
                ) : (
                  <strong>{item.nomeProduto}</strong>
                )}
              </td>
              <td style={styles.td}>
                {editandoItem === item.idItem ? (
                  <input
                    type="number"
                    style={{ ...styles.inputEdicao, width: '60px' }}
                    value={formEdicao.qtd}
                    onChange={(e) =>
                      setFormEdicao({
                        ...formEdicao,
                        qtd: Number(e.target.value),
                      })
                    }
                  />
                ) : (
                  `${item.quantidade} un`
                )}
              </td>

              <td style={styles.td}>{item.estoque ?? '-'}</td>
              <td style={styles.td}>{item.vendidoNoMes ?? '-'}</td>
              <td style={styles.td}>{item.vendidoAposUltCompra ?? '-'}</td>
              <td style={styles.td}>{fData(item.ultCompraData)}</td>
              <td style={styles.td}>{item.ultCompraQtde ?? '-'}</td>
              <td style={styles.td}>{fData(item.ultVendaData)}</td>
              <td style={{ ...styles.td, textAlign: 'right', fontWeight: '500' }}>
                {item.ultimoPreco != null ? fMoney(item.ultimoPreco) : '-'}
              </td>

              {fornecedores.map((f) => {
                const precoFornecedor = item.precosPorFornecedor[f]
                const isWinner = f === item.fornecedorVencedor
                const emFalta = precoFornecedor === -1
                return (
                  <td
                    key={f}
                    style={{
                      ...styles.td,
                      fontWeight: isWinner ? 'bold' : 'normal',
                      color: isWinner
                        ? '#059669'
                        : emFalta
                          ? '#dc2626'
                          : '#374151',
                      backgroundColor: isWinner ? '#ecfdf5' : 'transparent',
                      textAlign: 'center',
                    }}
                  >
                    {emFalta
                      ? 'Em falta'
                      : precoFornecedor
                        ? fMoney(precoFornecedor)
                        : '-'}
                  </td>
                )
              })}

              <td style={{ ...styles.td, textAlign: 'center' }}>
                {editandoItem === item.idItem ? (
                  <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                    <button
                      onClick={() => salvarEdicao(item.idItem)}
                      title="Salvar"
                      style={{ ...styles.btnIcon, color: '#16a34a' }}
                    >
                      <Save size={18} />
                    </button>
                    <button
                      onClick={() => setEditandoItem(null)}
                      title="Cancelar"
                      style={{ ...styles.btnIcon, color: '#6b7280' }}
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                    <button
                      onClick={() => iniciarEdicao(item)}
                      title="Editar Produto"
                      style={{ ...styles.btnIcon, color: '#3b82f6' }}
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => deletarItem(item.idItem)}
                      title="Remover Produto"
                      style={{ ...styles.btnIcon, color: '#ef4444' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const styles = {
    container: { padding: '20px', backgroundColor: '#f3f4f6', minHeight: '100vh', fontFamily: 'Segoe UI' },
    header: { marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: '24px', fontWeight: 'bold', color: '#1f2937' },
    card: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px' },
    th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #e5e7eb', color: '#4b5563', fontSize: '13px' },
    td: { padding: '12px', borderBottom: '1px solid #e5e7eb', color: '#374151', fontSize: '13px' },
    btnVoltar: { padding: '10px 20px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
    toggleContainer: { display: 'flex', gap: '10px', marginBottom: '20px' },
    toggleBtn: (ativo) => ({
      display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '30px', border: 'none', cursor: 'pointer', fontWeight: '600', backgroundColor: ativo ? '#2563eb' : 'white', color: ativo ? 'white' : '#4b5563'
    }),
    inputEdicao: { padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' },
    btnIcon: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px' },
    modalOverlay: {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    },
    modalContent: {
      backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '800px', maxHeight: '85vh', overflowY: 'auto'
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Cotação #{id}</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            style={{ 
              ...styles.btnVoltar, 
              backgroundColor: Object.keys(decisaoCompra).length > 0 ? '#16a34a' : '#9ca3af',
              cursor: Object.keys(decisaoCompra).length > 0 ? 'pointer' : 'not-allowed'
            }}
            onClick={handleGerarPedidos}
            disabled={Object.keys(decisaoCompra).length === 0}
          >
            <ShoppingCart size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
            Gerar Pedidos de Compra
          </button>
          
          <button style={styles.btnVoltar} onClick={() => navigate('/cotacoes')}>
            Voltar ao Painel
          </button>
        </div>
      </div>

      <div style={styles.toggleContainer}>
        <button
          style={styles.toggleBtn(modoVisualizacao === 'tabela')}
          onClick={() => setModoVisualizacao('tabela')}
        >
          <BarChart2 size={18} /> Comparativo / Itens
        </button>
      </div>

      {loading ? <p>Carregando dados da cotação...</p> : <RenderTabela />}

      {/* MODAL DE RESUMO DE PEDIDOS */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1f2937' }}>Resumo de Vencedores</h2>
              <button onClick={() => setShowModal(false)} style={styles.btnIcon} title="Fechar">
                <X size={24} color="#4b5563" />
              </button>
            </div>
            
            {pedidosGerados.map((pedido, index) => (
              <div key={index} style={{ marginBottom: '24px', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f9fafb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>
                    {pedido.fornecedorNome}
                  </h3>
                  <button 
                    onClick={() => gerarPDF(pedido)}
                    style={{ ...styles.btnVoltar, backgroundColor: '#2563eb', padding: '8px 16px' }}
                  >
                    <FileText size={16} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                    Gerar PDF
                  </button>
                </div>
                
                <table style={{ ...styles.table, backgroundColor: 'white' }}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Produto</th>
                      <th style={styles.th}>Vendedor</th>
                      <th style={styles.th}>Qtd</th>
                      <th style={styles.th}>Preço Unit.</th>
                      <th style={styles.th}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedido.itens.map((item, idx) => (
                      <tr key={idx}>
                        <td style={styles.td}>
                          <span style={{ fontWeight: '500', color: '#111827' }}>
                            {item.nomeProduto}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <select 
                            value={pedido.fornecedorNome}
                            onChange={(e) => handleFornecedorModalChange(pedido.fornecedorNome, e.target.value, item.idItem)}
                            style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', backgroundColor: '#f9fafb', cursor: 'pointer' }}
                          >
                            {fornecedores.map(f => (
                              <option key={f} value={f}>{f}</option>
                            ))}
                          </select>
                        </td>
                        <td style={styles.td}>
                          <input 
                            type="number" 
                            min="1"
                            value={item.quantidadePedida}
                            onChange={(e) => handleQuantidadeModalChange(pedido.fornecedorNome, item.idItem, e.target.value)}
                            style={{ ...styles.inputEdicao, width: '70px', textAlign: 'center' }}
                          />
                        </td>
                        <td style={styles.td}>{fMoney(item.valorUnitarioPedido)}</td>
                        <td style={styles.td}>{fMoney(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="4" style={{ ...styles.td, textAlign: 'right', fontWeight: 'bold' }}>Total do Fornecedor:</td>
                      <td style={{ ...styles.td, fontWeight: 'bold', color: '#16a34a', fontSize: '16px' }}>{fMoney(pedido.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ))}
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', gap: '12px' }}>
              <button 
                onClick={() => setShowModal(false)} 
                style={styles.btnVoltar}
                disabled={salvandoPedidos}
              >
                Cancelar
              </button>
              
              <button 
                onClick={salvarPedidosNoBanco} 
                style={{ ...styles.btnVoltar, backgroundColor: '#16a34a' }}
                disabled={salvandoPedidos}
              >
                {salvandoPedidos ? 'Salvando no Banco...' : 'Salvar Pedidos no Sistema'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}