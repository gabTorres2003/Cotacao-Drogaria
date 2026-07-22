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
  List,
  Tag,
  Plus
} from 'lucide-react'

export default function CotacaoDetalhes() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [relatorio, setRelatorio] = useState([])
  const [fornecedores, setFornecedores] = useState([])
  const [promocoes, setPromocoes] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [modoVisualizacao, setModoVisualizacao] = useState('itens') 
  
  const [decisaoCompra, setDecisaoCompra] = useState({})
  const [showModal, setShowModal] = useState(false)
  const [pedidosGerados, setPedidosGerados] = useState([])
  const [salvandoPedidos, setSalvandoPedidos] = useState(false)

  const [editandoItem, setEditandoItem] = useState(null)
  const [formEdicao, setFormEdicao] = useState({ nome: '', qtd: 1 })

  useEffect(() => {
    carregarRelatorio()
  }, [id])

  const carregarRelatorio = async () => {
    try {
      // Busca os itens do comparativo
      const response = await api.get(`/api/comparativo/relatorio/${id}`)
      setRelatorio(response.data)

      const nomes = new Set()
      const decisaoInicial = {}

      response.data.forEach((item) => {
        if (item.precosPorFornecedor) {
          Object.keys(item.precosPorFornecedor).forEach((n) => nomes.add(n))
        }
        if (item.fornecedorVencedor && item.fornecedorVencedor !== 'Sem ofertas') {
          decisaoInicial[item.idItem] = item.fornecedorVencedor
        }
      })

      setFornecedores(Array.from(nomes))
      setDecisaoCompra(decisaoInicial)

      // Busca as sugestões e promoções extras
      try {
        const resPromos = await api.get(`/api/cotacao/sugestoes/${id}`);
        setPromocoes(resPromos.data || []);
      } catch (err) {
        console.warn('Cotação sem promoções extras ou erro ao buscar.', err);
      }

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

  // --- LÓGICA DE GERAR PEDIDOS ---
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
        const substituto = itemRelatorio.substitutosPorFornecedor?.[fornecedorNome];
        const obs = itemRelatorio.observacoesPorFornecedor?.[fornecedorNome];
        
        pedidosPorFornecedor[fornecedorNome].itens.push({
          idItem: Number(idItem),
          nomeProduto: substituto ? substituto : itemRelatorio.nomeProduto,
          nomeOriginal: substituto ? itemRelatorio.nomeProduto : null,
          observacao: obs,
          quantidadePedida: qtd,
          valorUnitarioPedido: preco,
          subtotal: qtd * preco,
          isExtra: false
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

  const adicionarPromocaoAoPedido = (fornecedorNome, promo) => {
    setPedidosGerados(prev => prev.map(ped => {
      if (ped.fornecedorNome === fornecedorNome) {
        const subtotal = promo.qtdMinima * promo.preco;
        const novoItem = {
          idItem: null, 
          promocaoId: promo.id,
          nomeProduto: promo.nomeProduto,
          observacao: promo.observacao,
          quantidadePedida: promo.qtdMinima,
          valorUnitarioPedido: promo.preco,
          subtotal: subtotal,
          isExtra: true
        };
        return {
          ...ped,
          itens: [...ped.itens, novoItem],
          total: ped.total + subtotal
        };
      }
      return ped;
    }));
  }

  const removerItemDoPedido = (fornecedorNome, indexItem) => {
    setPedidosGerados(prev => prev.map(ped => {
      if (ped.fornecedorNome === fornecedorNome) {
        const novosItens = [...ped.itens];
        novosItens.splice(indexItem, 1);
        return {
          ...ped,
          itens: novosItens,
          total: novosItens.reduce((acc, it) => acc + it.subtotal, 0)
        };
      }
      return ped;
    }).filter(ped => ped.itens.length > 0));
  }

  const salvarPedidosNoBanco = async () => {
    setSalvandoPedidos(true)
    try {
      for (const pedido of pedidosGerados) {
        const payload = {
          cotacaoId: Number(id),
          fornecedorNome: pedido.fornecedorNome,
          itens: pedido.itens.map(item => ({
            itemCotacaoId: item.idItem || null, 
            nomeProduto: item.nomeProduto,
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
      alert(`Falha ao salvar no banco. Motivo: ${error.response?.data?.message || 'Erro desconhecido'}`)
    } finally {
      setSalvandoPedidos(false)
    }
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
    
    const tableData = pedido.itens.map(item => {
      let nomeApresentacao = item.nomeProduto;
      if (item.isExtra) nomeApresentacao = `[PROMO] ${item.nomeProduto}`;
      else if (item.nomeOriginal) nomeApresentacao = `[TROCA] ${item.nomeProduto} (Original: ${item.nomeOriginal})`;

      return [
        nomeApresentacao,
        `${item.quantidadePedida} un`,
        fMoney(item.valorUnitarioPedido),
        fMoney(item.subtotal)
      ]
    })

    autoTable(doc, {
      startY: 45,
      head: [['Produto', 'Quantidade', 'Valor Unit.', 'Subtotal']],
      body: tableData,
      foot: [['', '', 'Total do Pedido:', fMoney(pedido.total)]],
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] }
    })

    doc.save(`cotacao_dia_${diaArquivo}_${pedido.fornecedorNome}.pdf`)
  }

  const handleQuantidadeModalChange = (fornecedorNome, indexItem, novaQtd) => {
    const qtdNumber = Number(novaQtd) > 0 ? Number(novaQtd) : 1; 
    setPedidosGerados(prev => prev.map(pedido => {
      if (pedido.fornecedorNome === fornecedorNome) {
        const novosItens = [...pedido.itens];
        novosItens[indexItem] = { 
          ...novosItens[indexItem], 
          quantidadePedida: qtdNumber, 
          subtotal: qtdNumber * novosItens[indexItem].valorUnitarioPedido 
        };
        return { ...pedido, itens: novosItens, total: novosItens.reduce((acc, i) => acc + i.subtotal, 0) };
      }
      return pedido;
    }));
  };

  const handleFornecedorModalChange = (fornecedorAtual, novoFornecedor, idItem, indexItem) => {
    if (novoFornecedor === fornecedorAtual || idItem == null) return;
    
    if (!window.confirm(`Mover este produto para "${novoFornecedor}"? O valor unitário poderá sofrer alterações baseadas na oferta do fornecedor.`)) {
      return;
    }

    const itemBase = relatorio.find(r => r.idItem === idItem);
    const novoPreco = itemBase.precosPorFornecedor[novoFornecedor];
    const novoSubstituto = itemBase.substitutosPorFornecedor?.[novoFornecedor];
    const novaObs = itemBase.observacoesPorFornecedor?.[novoFornecedor];

    if (!novoPreco || novoPreco === -1) {
      alert(`Operação cancelada: O fornecedor ${novoFornecedor} não possui um preço cadastrado (ou está em falta) para este produto.`);
      return;
    }

    setPedidosGerados(prev => {
      let itemRemovido = null;

      const prevSemItem = prev.map(pedido => {
        if (pedido.fornecedorNome === fornecedorAtual) {
          itemRemovido = pedido.itens[indexItem];
          const novosItens = [...pedido.itens];
          novosItens.splice(indexItem, 1);
          return { ...pedido, itens: novosItens, total: novosItens.reduce((acc, it) => acc + it.subtotal, 0) };
        }
        return pedido;
      });

      const itemAtualizado = {
        ...itemRemovido,
        nomeProduto: novoSubstituto ? novoSubstituto : itemBase.nomeProduto,
        nomeOriginal: novoSubstituto ? itemBase.nomeProduto : null,
        observacao: novaObs,
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

  const fMoney = (v) => v != null ? Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'
  const fData = (data) => data ? data : '-'; 

  const RenderTabela = () => {
    const isComparativo = modoVisualizacao === 'comparativo';
    const isItens = modoVisualizacao === 'itens';

    return (
      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Produto</th>
              <th style={styles.th}>Qtd. Solicitada</th>
              <th style={styles.th}>Estoque Atual</th>
              
              {isItens && (
                <>
                  <th style={styles.th}>Vendido no Mês</th>
                  <th style={styles.th}>Vendido pós Últ. Compra</th>
                  <th style={styles.th}>Data Últ. Compra</th>
                  <th style={styles.th}>Qtd. Últ. Compra</th>
                  <th style={styles.th}>Data Últ. Venda</th>
                </>
              )}

              <th style={{ ...styles.th, color: '#4f46e5', textAlign: 'right' }}>Preço Últ. Compra</th>

              {isComparativo && fornecedores.map((f) => (
                <th key={f} style={{ ...styles.th, backgroundColor: '#f9fafb', textAlign: 'center', borderLeft: '1px solid #e5e7eb' }}>
                  {f}
                </th>
              ))}

              {isItens && <th style={{ ...styles.th, textAlign: 'center' }}>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {relatorio.map((item) => (
              <tr key={item.idItem}>
                <td style={styles.td}>
                  {editandoItem === item.idItem ? (
                    <input style={styles.inputEdicao} value={formEdicao.nome} onChange={(e) => setFormEdicao({ ...formEdicao, nome: e.target.value })} />
                  ) : (
                    <strong>{item.nomeProduto}</strong>
                  )}
                </td>
                <td style={styles.td}>
                  {editandoItem === item.idItem ? (
                    <input type="number" style={{ ...styles.inputEdicao, width: '60px' }} value={formEdicao.qtd} onChange={(e) => setFormEdicao({ ...formEdicao, qtd: Number(e.target.value) })} />
                  ) : (
                    `${item.quantidade} un`
                  )}
                </td>
                <td style={styles.td}>{item.estoque ?? '-'}</td>

                {isItens && (
                  <>
                    <td style={styles.td}>{item.vendidoNoMes ?? '-'}</td>
                    <td style={styles.td}>{item.vendidoAposUltCompra ?? '-'}</td>
                    <td style={styles.td}>{fData(item.ultCompraData)}</td>
                    <td style={styles.td}>{item.ultCompraQtde ?? '-'}</td>
                    <td style={styles.td}>{fData(item.ultVendaData)}</td>
                  </>
                )}

                <td style={{ ...styles.td, textAlign: 'right', fontWeight: '500' }}>
                  {item.ultimoPreco != null ? fMoney(item.ultimoPreco) : '-'}
                </td>

                {/* ABA COMPARATIVO: Renderizando as respostas com Observações e Trocas */}
                {isComparativo && fornecedores.map((f) => {
                  const precoFornecedor = item.precosPorFornecedor[f]
                  const obs = item.observacoesPorFornecedor?.[f]
                  const substituto = item.substitutosPorFornecedor?.[f]
                  const isWinner = f === item.fornecedorVencedor
                  const emFalta = precoFornecedor === -1

                  return (
                    <td
                      key={f}
                      style={{
                        ...styles.td,
                        backgroundColor: isWinner ? '#ecfdf5' : 'transparent',
                        textAlign: 'center',
                        borderLeft: '1px solid #f3f4f6',
                        verticalAlign: 'top'
                      }}
                    >
                      <div style={{ fontWeight: isWinner ? 'bold' : 'normal', color: isWinner ? '#059669' : emFalta ? '#dc2626' : '#374151' }}>
                        {emFalta ? 'Em falta' : precoFornecedor ? fMoney(precoFornecedor) : '-'}
                      </div>
                      
                      {substituto && (
                        <div style={{ fontSize: '11px', color: '#b45309', backgroundColor: '#fef3c7', padding: '2px 4px', borderRadius: '4px', marginTop: '6px', display: 'inline-block' }}>
                          Troca: {substituto}
                        </div>
                      )}
                      
                      {obs && (
                        <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px', fontStyle: 'italic', lineHeight: '1.2' }}>
                          Obs: {obs}
                        </div>
                      )}
                    </td>
                  )
                })}

                {isItens && (
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    {editandoItem === item.idItem ? (
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                        <button onClick={() => salvarEdicao(item.idItem)} style={{ ...styles.btnIcon, color: '#16a34a' }}><Save size={18} /></button>
                        <button onClick={() => setEditandoItem(null)} style={{ ...styles.btnIcon, color: '#6b7280' }}><X size={18} /></button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                        <button onClick={() => iniciarEdicao(item)} style={{ ...styles.btnIcon, color: '#3b82f6' }}><Edit2 size={18} /></button>
                        <button onClick={() => deletarItem(item.idItem)} style={{ ...styles.btnIcon, color: '#ef4444' }}><Trash2 size={18} /></button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {/* SEÇÃO DE PROMOÇÕES EXTRAS (Visível no Comparativo) */}
        {isComparativo && promocoes.length > 0 && (
          <div style={{ marginTop: '30px', borderTop: '2px dashed #e5e7eb', paddingTop: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tag size={20} color="#2563eb" /> Sugestões & Ofertas Extras dos Fornecedores
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {promocoes.map(promo => (
                <div key={promo.id} style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1d4ed8', marginBottom: '4px', textTransform: 'uppercase' }}>{promo.fornecedorNome}</div>
                    <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e3a8a', lineHeight: '1.2' }}>{promo.nomeProduto}</div>
                    <div style={{ fontSize: '14px', color: '#1e40af', marginTop: '6px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{fMoney(promo.preco)}</span> <br/>
                      <span style={{ fontSize: '12px' }}>(Mínimo: {promo.qtdMinima} un)</span>
                    </div>
                    {promo.observacao && <div style={{ fontSize: '12px', color: '#475569', marginTop: '8px', fontStyle: 'italic', borderTop: '1px solid #bfdbfe', paddingTop: '8px' }}>{promo.observacao}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const styles = {
    container: { padding: '20px', backgroundColor: '#f3f4f6', minHeight: '100vh', fontFamily: 'Segoe UI' },
    header: { marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: '24px', fontWeight: 'bold', color: '#1f2937' },
    card: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px' },
    th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #e5e7eb', color: '#4b5563', fontSize: '13px', whiteSpace: 'nowrap' },
    td: { padding: '12px', borderBottom: '1px solid #e5e7eb', color: '#374151', fontSize: '13px' },
    btnVoltar: { padding: '10px 20px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' },
    toggleContainer: { display: 'flex', gap: '10px', marginBottom: '20px', backgroundColor: '#e5e7eb', padding: '4px', borderRadius: '8px', width: 'fit-content' },
    toggleBtn: (ativo) => ({
      display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '600', backgroundColor: ativo ? 'white' : 'transparent', color: ativo ? '#111827' : '#6b7280', boxShadow: ativo ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s'
    }),
    inputEdicao: { padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' },
    btnIcon: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '95%', maxWidth: '900px', maxHeight: '85vh', overflowY: 'auto' }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Cotação #{id}</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            style={{ ...styles.btnVoltar, backgroundColor: Object.keys(decisaoCompra).length > 0 ? '#16a34a' : '#9ca3af', cursor: Object.keys(decisaoCompra).length > 0 ? 'pointer' : 'not-allowed' }}
            onClick={handleGerarPedidos} disabled={Object.keys(decisaoCompra).length === 0}
          >
            <ShoppingCart size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
            Gerar Pedidos de Compra
          </button>
          <button style={styles.btnVoltar} onClick={() => navigate('/cotacoes')}>Voltar ao Painel</button>
        </div>
      </div>

      <div style={styles.toggleContainer}>
        <button style={styles.toggleBtn(modoVisualizacao === 'itens')} onClick={() => setModoVisualizacao('itens')}>
          <List size={18} /> Detalhes da Cotação
        </button>
        <button style={styles.toggleBtn(modoVisualizacao === 'comparativo')} onClick={() => setModoVisualizacao('comparativo')}>
          <BarChart2 size={18} /> Comparativo de Preços
        </button>
      </div>

      {loading ? <p>Carregando dados da cotação...</p> : <RenderTabela />}

      {/* MODAL DE RESUMO DE PEDIDOS COMPLETO */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1f2937' }}>Resumo de Vencedores para Emissão de Pedido</h2>
              <button onClick={() => setShowModal(false)} style={styles.btnIcon} title="Fechar"><X size={24} color="#4b5563" /></button>
            </div>
            
            {pedidosGerados.map((pedido, index) => {
              // Verifica se tem promoções extras disponíveis para adicionar neste fornecedor
              const promosDesteFornecedor = promocoes.filter(p => p.fornecedorNome === pedido.fornecedorNome);
              const promosNaoAdicionadas = promosDesteFornecedor.filter(p => !pedido.itens.some(i => i.isExtra && i.promocaoId === p.id));

              return (
                <div key={index} style={{ marginBottom: '24px', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f9fafb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>
                      {pedido.fornecedorNome}
                    </h3>
                    <button onClick={() => gerarPDF(pedido)} style={{ ...styles.btnVoltar, backgroundColor: '#2563eb', padding: '8px 16px' }}>
                      <FileText size={16} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Gerar PDF
                    </button>
                  </div>
                  
                  <table style={{ ...styles.table, backgroundColor: 'white' }}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Produto</th>
                        <th style={styles.th}>Vendedor</th>
                        <th style={{...styles.th, textAlign: 'center'}}>Qtd</th>
                        <th style={styles.th}>Preço Unit.</th>
                        <th style={styles.th}>Subtotal</th>
                        <th style={styles.th}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {pedido.itens.map((item, idx) => (
                        <tr key={idx} style={{ backgroundColor: item.isExtra ? '#eff6ff' : 'white' }}>
                          <td style={styles.td}>
                            <span style={{ fontWeight: '500', color: '#111827', display: 'block' }}>{item.nomeProduto}</span>
                            {item.nomeOriginal && <span style={{ fontSize: '11px', color: '#b45309', display: 'block' }}>Troca de: {item.nomeOriginal}</span>}
                            {item.isExtra && <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 'bold', display: 'block' }}>Promoção Extra Adicionada</span>}
                            {item.observacao && <span style={{ fontSize: '11px', color: '#475569', fontStyle: 'italic', display: 'block' }}>Obs: {item.observacao}</span>}
                          </td>
                          <td style={styles.td}>
                            {!item.isExtra ? (
                              <select 
                                value={pedido.fornecedorNome}
                                onChange={(e) => handleFornecedorModalChange(pedido.fornecedorNome, e.target.value, item.idItem, idx)}
                                style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', backgroundColor: '#f9fafb', cursor: 'pointer' }}
                              >
                                {fornecedores.map(f => (<option key={f} value={f}>{f}</option>))}
                              </select>
                            ) : (
                              <span style={{ fontSize: '13px', color: '#6b7280' }}>Fixo (Extra)</span>
                            )}
                          </td>
                          <td style={{...styles.td, textAlign: 'center'}}>
                            <input 
                              type="number" min="1" value={item.quantidadePedida}
                              onChange={(e) => handleQuantidadeModalChange(pedido.fornecedorNome, idx, e.target.value)}
                              style={{ ...styles.inputEdicao, width: '60px', textAlign: 'center' }}
                            />
                          </td>
                          <td style={styles.td}>{fMoney(item.valorUnitarioPedido)}</td>
                          <td style={styles.td}>{fMoney(item.subtotal)}</td>
                          <td style={{...styles.td, textAlign: 'center'}}>
                            <button onClick={() => removerItemDoPedido(pedido.fornecedorNome, idx)} style={{ ...styles.btnIcon, color: '#ef4444' }} title="Remover item">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="4" style={{ ...styles.td, textAlign: 'right', fontWeight: 'bold' }}>Total do Fornecedor:</td>
                        <td colSpan="2" style={{ ...styles.td, fontWeight: 'bold', color: '#16a34a', fontSize: '16px' }}>{fMoney(pedido.total)}</td>
                      </tr>
                    </tfoot>
                  </table>

                  {/* Botões para adicionar promoções que ficaram de fora */}
                  {promosNaoAdicionadas.length > 0 && (
                    <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
                      <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#166534', fontWeight: '600' }}>Este fornecedor ofereceu itens extras. Deseja incluir no pedido?</p>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {promosNaoAdicionadas.map(promo => (
                          <button 
                            key={promo.id}
                            onClick={() => adicionarPromocaoAoPedido(pedido.fornecedorNome, promo)}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: 'white', border: '1px solid #22c55e', color: '#16a34a', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                            <Plus size={14} /> Add {promo.nomeProduto} ({fMoney(promo.preco)})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', gap: '12px' }}>
              <button onClick={() => setShowModal(false)} style={styles.btnVoltar} disabled={salvandoPedidos}>Cancelar</button>
              <button onClick={salvarPedidosNoBanco} style={{ ...styles.btnVoltar, backgroundColor: '#16a34a' }} disabled={salvandoPedidos}>
                {salvandoPedidos ? 'Salvando no Banco...' : 'Salvar Pedidos no Sistema'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}