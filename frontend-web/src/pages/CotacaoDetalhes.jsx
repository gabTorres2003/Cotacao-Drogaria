import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
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
    if (
      window.confirm('Tem certeza que deseja remover este produto da cotação?')
    ) {
      try {
        await api.delete(`/api/cotacao/item/${idItem}`)
        carregarRelatorio()
      } catch (error) {
        alert('Erro ao remover produto.')
      }
    }
  }

  const handleGerarPedidos = async () => {
    const pedidosPorFornecedor = {}

    Object.entries(decisaoCompra).forEach(([idItem, fornecedorNome]) => {
      if (fornecedorNome === 'Sem ofertas') return

      if (!pedidosPorFornecedor[fornecedorNome]) {
        pedidosPorFornecedor[fornecedorNome] = {
          cotacaoId: Number(id),
          fornecedorNome: fornecedorNome,
          itens: [],
        }
      }

      const itemRelatorio = relatorio.find((r) => r.idItem === Number(idItem))
      
      if (itemRelatorio) {
        pedidosPorFornecedor[fornecedorNome].itens.push({
          itemCotacaoId: Number(idItem),
          quantidadePedida: itemRelatorio.quantidade,
          valorUnitarioPedido: itemRelatorio.precosPorFornecedor[fornecedorNome],
        })
      }
    })

    const pedidosArray = Object.values(pedidosPorFornecedor)
    
    if (pedidosArray.length === 0) {
      alert('Nenhum fornecedor vencedor selecionado para gerar pedido.')
      return
    }

    try {
      setLoading(true)
      for (const payload of pedidosArray) {
        await api.post('/api/pedidos/gerar', payload)
      }
      alert('Pedidos gerados com sucesso! Acompanhe na aba Pedidos.')
      navigate('/pedidos') 
    } catch (error) {
      console.error('Erro ao gerar pedidos:', error)
      alert('Ocorreu um erro ao gerar os pedidos.')
    } finally {
      setLoading(false)
    }
  }

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
              <td
                style={{ ...styles.td, textAlign: 'right', fontWeight: '500' }}
              >
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
                  <div
                    style={{
                      display: 'flex',
                      gap: '5px',
                      justifyContent: 'center',
                    }}
                  >
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
                  <div
                    style={{
                      display: 'flex',
                      gap: '5px',
                      justifyContent: 'center',
                    }}
                  >
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
    container: {
      padding: '20px',
      backgroundColor: '#f3f4f6',
      minHeight: '100vh',
      fontFamily: 'Segoe UI',
    },
    header: {
      marginBottom: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: { fontSize: '24px', fontWeight: 'bold', color: '#1f2937' },
    card: {
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
      overflowX: 'auto',
    },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px' },
    th: {
      textAlign: 'left',
      padding: '12px',
      borderBottom: '2px solid #e5e7eb',
      color: '#4b5563',
      fontSize: '13px',
    },
    td: {
      padding: '12px',
      borderBottom: '1px solid #e5e7eb',
      color: '#374151',
      fontSize: '13px',
    },
    btnVoltar: {
      padding: '10px 20px',
      backgroundColor: '#6b7280',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
    },
    toggleContainer: { display: 'flex', gap: '10px', marginBottom: '20px' },
    toggleBtn: (ativo) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 20px',
      borderRadius: '30px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '600',
      backgroundColor: ativo ? '#2563eb' : 'white',
      color: ativo ? 'white' : '#4b5563',
    }),
    inputEdicao: {
      padding: '4px 8px',
      border: '1px solid #d1d5db',
      borderRadius: '4px',
      fontSize: '13px',
    },
    btnIcon: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '4px',
    },
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
            title="Gera os pedidos automaticamente baseados nos menores preços"
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
    </div>
  )
}