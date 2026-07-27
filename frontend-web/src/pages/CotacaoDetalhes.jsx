import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { MessageCircle, FileText, ShoppingCart, BarChart2, Edit2, Trash2, Save, X, List, Tag, Plus, ClipboardCheck } from 'lucide-react'

export default function CotacaoDetalhes() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [relatorio, setRelatorio] = useState([])
  const [fornecedores, setFornecedores] = useState([])
  const [promocoes, setPromocoes] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [modoVisualizacao, setModoVisualizacao] = useState('itens') 
  
  const [decisaoCompra, setDecisaoCompra] = useState({})
  const [aceitesTroca, setAceitesTroca] = useState({})

  const [showModal, setShowModal] = useState(false)
  const [pedidosGerados, setPedidosGerados] = useState([])
  const [salvandoPedidos, setSalvandoPedidos] = useState(false)

  const [editandoItem, setEditandoItem] = useState(null)
  const [formEdicao, setFormEdicao] = useState({ nome: '', qtd: 1 })

  const [mostrarNomeReal, setMostrarNomeReal] = useState(false)
  const [dicionarioDiversos, setDicionarioDiversos] = useState({})

  const [fornecedoresLista, setFornecedoresLista] = useState([])
  const [fornecedorManual, setFornecedorManual] = useState('')
  const [checklist, setChecklist] = useState({})

  useEffect(() => {
    carregarRelatorio()
    carregarDicionarioDiversos() 
    carregarFornecedores()
  }, [id])

  const carregarFornecedores = async () => {
    try {
      const response = await api.get('/api/fornecedor')
      setFornecedoresLista(response.data)
    } catch (error) {
      console.error("Erro ao carregar lista de fornecedores gerais", error)
    }
  }

  useEffect(() => {
    if (relatorio.length > 0 && Object.keys(checklist).length === 0) {
      const initialCheck = {}
      relatorio.forEach(item => {
        initialCheck[item.idItem] = {
          comprado: false,
          qtd: item.quantidade || 1,
          preco: item.ultimoPreco || 0
        }
      })
      setChecklist(initialCheck)
    }
  }, [relatorio])

  const carregarDicionarioDiversos = async () => {
    try {
      const response = await api.get('/api/diversos')
      const mapDiversos = {}
      response.data.forEach(item => {
        if (item.codigoDiversos) {
          const codigoPuro = String(item.codigoDiversos).toUpperCase().replace(/\s/g, '')
          
          mapDiversos[codigoPuro] = item.produto
          
          if (!codigoPuro.startsWith('DIVERSOS')) {
            mapDiversos[`DIVERSOS${codigoPuro}`] = item.produto
          }
        }
      })
      
      setDicionarioDiversos(mapDiversos)
    } catch (error) {
      console.error("Erro ao carregar dicionário de diversos:", error)
    }
  }

  const getNomeRealSempre = (nomeProduto) => {
    if (!nomeProduto) return '';
    const codigoLimpo = nomeProduto.toUpperCase().replace(/\s/g, '');
    return dicionarioDiversos[codigoLimpo] || nomeProduto; 
  }

  const getNomeExibicao = (nomeProduto) => {
    if (!nomeProduto) return '';
    if (mostrarNomeReal) {
      return getNomeRealSempre(nomeProduto);
    }
    return nomeProduto;
  }

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
        if (item.fornecedorVencedor && item.fornecedorVencedor !== 'Sem ofertas') {
          decisaoInicial[item.idItem] = item.fornecedorVencedor
        }
      })

      setFornecedores(Array.from(nomes))
      setDecisaoCompra(decisaoInicial)

      try {
        const resPromos = await api.get(`/api/cotacao/sugestoes/${id}`);
        setPromocoes(resPromos.data || []);
      } catch (err) {
        console.warn('Sem promoções extras.');
      }
    } catch (error) {
      alert('Erro ao carregar detalhes.')
    } finally {
      setLoading(false)
    }
  }

  const handleSetWinner = (idItem, fornecedorNome) => {
    setDecisaoCompra(prev => ({ ...prev, [idItem]: fornecedorNome }))
  }

  const toggleTroca = (idItem, fornecedorNome) => {
    const isAtivando = !aceitesTroca[idItem];

    setAceitesTroca(prev => ({ ...prev, [idItem]: isAtivando }));

    if (isAtivando) {
      handleSetWinner(idItem, fornecedorNome);
    } else {
      const itemRelatorio = relatorio.find(r => r.idItem === idItem);
      if (itemRelatorio) {
        const precoOriginal = itemRelatorio.precosPorFornecedor[fornecedorNome];
        
        if (!precoOriginal || precoOriginal <= 0) {
          let menorPreco = Infinity;
          let vencedorOriginal = 'Sem ofertas';
          
          Object.entries(itemRelatorio.precosPorFornecedor).forEach(([forn, p]) => {
            if (p > 0 && p < menorPreco) {
              menorPreco = p;
              vencedorOriginal = forn;
            }
          });
          
          handleSetWinner(idItem, vencedorOriginal);
        }
      }
    }
  }

  const iniciarEdicao = (item) => {
    setEditandoItem(item.idItem)
    setFormEdicao({ nome: item.nomeProduto, qtd: item.quantidade })
  }

  const salvarEdicao = async (idItem) => {
    try {
      await api.put(`/api/cotacao/item/${idItem}`, { nomeProduto: formEdicao.nome, quantidade: formEdicao.qtd })
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

    Object.entries(decisaoCompra).forEach(([idItemStr, fornecedorNome]) => {
      const idItem = Number(idItemStr);
      if (fornecedorNome === 'Sem ofertas') return

      if (!pedidosPorFornecedor[fornecedorNome]) {
        pedidosPorFornecedor[fornecedorNome] = { fornecedorNome: fornecedorNome, itens: [], total: 0 }
      }

      const itemRelatorio = relatorio.find((r) => r.idItem === idItem)
      
      if (itemRelatorio) {
        const isTrocaAceita = aceitesTroca[idItem];
        const nomeSubstituto = itemRelatorio.substitutosPorFornecedor?.[fornecedorNome];

        let preco = itemRelatorio.precosPorFornecedor[fornecedorNome];
        let qtd = itemRelatorio.quantidade;
        let nomeFinal;
        let nomeOriginal = null;

        if (isTrocaAceita && nomeSubstituto) {
          preco = itemRelatorio.precosSubstitutosPorFornecedor?.[fornecedorNome] || preco;
          qtd = itemRelatorio.qtdsSubstitutosPorFornecedor?.[fornecedorNome] || qtd;
          nomeFinal = getNomeRealSempre(nomeSubstituto); 
          nomeOriginal = getNomeRealSempre(itemRelatorio.nomeProduto); 
        } else {
          nomeFinal = getNomeRealSempre(itemRelatorio.nomeProduto);
        }

        if (preco <= 0) return;

        pedidosPorFornecedor[fornecedorNome].itens.push({
          idItem: idItem,
          nomeProduto: nomeFinal,
          nomeOriginal: nomeOriginal,
          observacao: itemRelatorio.observacoesPorFornecedor?.[fornecedorNome],
          quantidadePedida: qtd,
          valorUnitarioPedido: preco,
          subtotal: qtd * preco,
          isExtra: false
        })
        pedidosPorFornecedor[fornecedorNome].total += (qtd * preco);
      }
    })

    const pedidosArray = Object.values(pedidosPorFornecedor).filter(ped => ped.itens.length > 0)
    
    if (pedidosArray.length === 0) {
      alert('Nenhum item válido para gerar pedido.')
      return
    }

    setPedidosGerados(pedidosArray)
    setShowModal(true)
  }

  const handleSalvarRegistroManual = async () => {
    if (!fornecedorManual) {
      alert('Por favor, selecione um Fornecedor no topo da tela para vincular as compras.');
      return;
    }

    const itensComprados = [];
    Object.keys(checklist).forEach(idItemStr => {
      const idItem = Number(idItemStr);
      const chk = checklist[idItem];
      
      if (chk.comprado && chk.qtd > 0) {
        const itemRelatorio = relatorio.find(r => r.idItem === idItem);
        itensComprados.push({
          itemCotacaoId: idItem,
          quantidadePedida: chk.qtd,
          valorUnitarioPedido: chk.preco,
          nomeProduto: getNomeRealSempre(itemRelatorio.nomeProduto)
        });
      }
    });

    if (itensComprados.length === 0) {
      alert('Marque pelo menos um produto como "✅ Já Comprado" para gerar o pedido.');
      return;
    }

    const payload = [{
      cotacaoId: Number(id),
      fornecedorNome: fornecedorManual,
      itens: itensComprados
    }];

    if (window.confirm(`Confirma o registro do pedido com ${itensComprados.length} itens no fornecedor ${fornecedorManual}? A cotação será finalizada.`)) {
      setSalvandoPedidos(true);
      try {
        await api.post('/api/pedidos/registro-manual', payload);
        alert('Pedido manual registrado com sucesso!');
        navigate('/pedidos');
      } catch (error) {
        alert('Erro ao registrar pedido manual: ' + (error.response?.data?.message || error.message));
      } finally {
        setSalvandoPedidos(false);
      }
    }
  }

  const adicionarPromocaoAoPedido = (fornecedorNome, promo) => {
    setPedidosGerados(prev => prev.map(ped => {
      if (ped.fornecedorNome === fornecedorNome) {
        const subtotal = promo.qtdMinima * promo.preco;
        const novoItem = {
          idItem: null, 
          promocaoId: promo.id,
          nomeProduto: getNomeRealSempre(promo.nomeProduto), 
          observacao: promo.observacao,
          quantidadePedida: promo.qtdMinima,
          valorUnitarioPedido: promo.preco,
          subtotal: subtotal,
          isExtra: true
        };
        return { ...ped, itens: [...ped.itens, novoItem], total: ped.total + subtotal };
      }
      return ped;
    }));
  }

  const removerItemDoPedido = (fornecedorNome, indexItem) => {
    setPedidosGerados(prev => prev.map(ped => {
      if (ped.fornecedorNome === fornecedorNome) {
        const novosItens = [...ped.itens];
        novosItens.splice(indexItem, 1);
        return { ...ped, itens: novosItens, total: novosItens.reduce((acc, it) => acc + it.subtotal, 0) };
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
      
      alert('Pedidos gerados com sucesso!')
      setShowModal(false)
      navigate('/pedidos')
      
    } catch (error) {
      alert(`Falha ao salvar. Motivo: ${error.response?.data?.message || 'Erro'}`)
    } finally {
      setSalvandoPedidos(false)
    }
  }

  const baixarRelatorioGeral = async (idCotacao) => {
    try {
      const doc = new jsPDF()
      const response = await api.get(`/api/comparativo/relatorio/${idCotacao}`)
      const itens = response.data

      if (!itens || itens.length === 0) {
        alert('Essa cotação ainda não tem itens processados.')
        return
      }

      doc.setFontSize(18)
      doc.text(`Relatório de Fechamento - Cotação #${idCotacao}`, 14, 20)
      doc.setFontSize(12)
      doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, 14, 30)

      const linhas = itens.map((item) => {
        const vencedor = item.fornecedorVencedor || 'Sem Oferta'
        const preco = item.menorPrecoEncontrado || 0
        const total = preco * item.quantidade
        const nomeCorreto = getNomeRealSempre(item.nomeProduto);

        return [
          nomeCorreto,
          item.quantidade,
          vencedor,
          preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
          total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        ]
      })

      const totalGeral = itens.reduce((acc, item) => {
        const preco = item.menorPrecoEncontrado || 0
        return acc + preco * item.quantidade
      }, 0)

      autoTable(doc, {
        startY: 40,
        head: [['Produto', 'Qtd', 'Vencedor', 'Unitário', 'Total']],
        body: linhas,
        foot: [
          [
            '',
            '',
            '',
            'TOTAL GERAL',
            totalGeral.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }),
          ],
        ],
        theme: 'striped',
        headStyles: { fillColor: [22, 163, 74] },
      })

      doc.save(`Relatorio_Geral_Cotacao_${idCotacao}.pdf`)
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      alert('Erro ao gerar o relatório.')
    }
  }

  const fMoney = (v) => v != null && v > 0 ? Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'
  const fData = (data) => data ? data : '-'; 

  const RenderChecklistManual = () => {
    
    const totalComprado = Object.keys(checklist).reduce((acc, key) => {
      const item = checklist[key];
      return item.comprado ? acc + (item.qtd * item.preco) : acc;
    }, 0);

    const getCorOrigem = (origem) => {
      if (origem === 'Falta Manual') return { bg: '#ffedd5', color: '#c2410c', border: '#fdba74' };
      if (origem === 'Sugestão') return { bg: '#e0e7ff', color: '#1d4ed8', border: '#93c5fd' };
      if (origem === 'Falta e Sugestão') return { bg: '#fae8ff', color: '#6d28d9', border: '#d8b4fe' };
      return { bg: '#f3f4f6', color: '#4b5563', border: '#d1d5db' };
    };

    return (
      <div style={{ ...styles.card, borderTop: '4px solid #10b981' }}>
        
        {/* Painel de Controle Superior */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', paddingBottom: '20px', borderBottom: '2px dashed #e5e7eb' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#374151', marginBottom: '6px' }}>Fornecedor da Compra</label>
            <select 
              value={fornecedorManual} 
              onChange={(e) => setFornecedorManual(e.target.value)}
              style={{ width: '300px', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', backgroundColor: '#f9fafb', fontSize: '14px' }}
            >
              <option value="">-- Selecione o Fornecedor --</option>
              {fornecedoresLista.map(f => (
                <option key={f.id} value={f.nome}>{f.nome}</option>
              ))}
            </select>
            <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '6px' }}>Marque os itens abaixo à medida que for finalizando no site do fornecedor.</p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>Total Acumulado (Itens Marcados)</div>
            <div style={{ fontSize: '28px', color: '#16a34a', fontWeight: '900' }}>{fMoney(totalComprado)}</div>
          </div>
        </div>

        {/* Tabela do Checklist */}
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{ ...styles.th, width: '120px' }}>Origem</th>
              <th style={styles.th}>Produto</th>
              <th style={{ ...styles.th, textAlign: 'center', width: '100px' }}>Qtd Comprada</th>
              <th style={{ ...styles.th, textAlign: 'right', width: '120px' }}>Custo Final (R$)</th>
              <th style={{ ...styles.th, textAlign: 'right', width: '120px' }}>Subtotal</th>
              <th style={{ ...styles.th, textAlign: 'center', width: '130px', backgroundColor: '#f0fdf4', color: '#166534' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {relatorio.map((item) => {
              const chk = checklist[item.idItem] || { comprado: false, qtd: 1, preco: 0 };
              const cores = getCorOrigem(item.origemItem || 'Geral');
              
              const rowStyle = chk.comprado ? { backgroundColor: '#f0fdf4', opacity: 0.85 } : {};
              const textStyle = chk.comprado ? { textDecoration: 'line-through', color: '#6b7280' } : { fontWeight: '600', color: '#1f2937' };

              return (
                <tr key={item.idItem} style={rowStyle}>
                  
                  {/* Badge de Origem */}
                  <td style={styles.td}>
                    <span style={{ 
                      fontSize: '11px', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold', 
                      backgroundColor: cores.bg, color: cores.color, border: `1px solid ${cores.border}` 
                    }}>
                      {item.origemItem || 'Geral'}
                    </span>
                  </td>

                  {/* Nome do Produto */}
                  <td style={styles.td}>
                    <span style={{ ...textStyle, fontSize: '14px' }}>
                      {getNomeExibicao(item.nomeProduto)}
                    </span>
                  </td>

                  {/* Input Quantidade */}
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    <input 
                      type="number" 
                      min="0" 
                      value={chk.qtd} 
                      onChange={(e) => setChecklist({ ...checklist, [item.idItem]: { ...chk, qtd: Number(e.target.value) } })}
                      style={{ ...styles.inputEdicao, width: '70px', textAlign: 'center', fontWeight: 'bold' }}
                      disabled={chk.comprado}
                    />
                  </td>

                  {/* Input Preço */}
                  <td style={{ ...styles.td, textAlign: 'right' }}>
                    <input 
                      type="number" 
                      step="0.01"
                      min="0" 
                      value={chk.preco} 
                      onChange={(e) => setChecklist({ ...checklist, [item.idItem]: { ...chk, preco: Number(e.target.value) } })}
                      style={{ ...styles.inputEdicao, width: '90px', textAlign: 'right', fontWeight: 'bold' }}
                      disabled={chk.comprado}
                    />
                  </td>

                  {/* Subtotal da Linha */}
                  <td style={{ ...styles.td, textAlign: 'right', fontWeight: 'bold', color: chk.comprado ? '#166534' : '#374151' }}>
                    {fMoney(chk.qtd * chk.preco)}
                  </td>

                  {/* O Checkbox Gigante */}
                  <td style={{ ...styles.td, textAlign: 'center', backgroundColor: chk.comprado ? '#dcfce7' : 'transparent', borderLeft: '1px dashed #d1d5db' }}>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', height: '100%' }}>
                      <input 
                        type="checkbox" 
                        checked={chk.comprado}
                        onChange={(e) => setChecklist({ ...checklist, [item.idItem]: { ...chk, comprado: e.target.checked } })}
                        style={{ transform: 'scale(1.5)', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: chk.comprado ? '#166534' : '#6b7280' }}>
                        {chk.comprado ? 'Comprado' : 'Marcar'}
                      </span>
                    </label>
                  </td>

                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Botão Flutuante de Salvar no Final */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button onClick={handleSalvarRegistroManual} disabled={salvandoPedidos} style={{ ...styles.btnVoltar, backgroundColor: '#10b981', fontSize: '15px', padding: '12px 24px', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.4)' }}>
            <Save size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> 
            {salvandoPedidos ? 'Registrando...' : 'Finalizar Registro e Gerar Pedidos'}
          </button>
        </div>

      </div>
    );
  };

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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <strong>{getNomeExibicao(item.nomeProduto)}</strong>
                      <span style={{ fontSize: '10px', backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '8px', width: 'fit-content', color: '#6b7280' }}>
                        {item.origemItem || 'Geral'}
                      </span>
                    </div>
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

                <td style={{ ...styles.td, textAlign: 'right', fontWeight: '500' }}>{item.ultimoPreco != null ? fMoney(item.ultimoPreco) : '-'}</td>

                {isComparativo && fornecedores.map((f) => {
                  const precoOriginal = item.precosPorFornecedor[f]
                  const precoSubstituto = item.precosSubstitutosPorFornecedor?.[f] || precoOriginal
                  const qtdSubstituto = item.qtdsSubstitutosPorFornecedor?.[f] || item.quantidade
                  const obs = item.observacoesPorFornecedor?.[f]
                  const substituto = item.substitutosPorFornecedor?.[f]
                  
                  const isWinner = decisaoCompra[item.idItem] === f
                  const isTrocaAceita = aceitesTroca[item.idItem]
                  const isEmFaltaOriginal = precoOriginal <= 0; 

                  return (
                    <td
                      key={f}
                      onClick={() => handleSetWinner(item.idItem, f)}
                      style={{
                        ...styles.td,
                        backgroundColor: isWinner ? '#ecfdf5' : 'transparent',
                        textAlign: 'center',
                        borderLeft: '1px solid #f3f4f6',
                        border: isWinner ? '2px solid #10b981' : '1px solid #e5e7eb',
                        cursor: 'pointer',
                        verticalAlign: 'top',
                        position: 'relative'
                      }}
                    >
                      {isWinner && <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', backgroundColor: '#10b981', color: 'white', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>VENCEDOR</div>}

                      <div style={{ marginTop: '8px', fontWeight: isWinner ? 'bold' : 'normal', color: isEmFaltaOriginal ? '#dc2626' : '#374151' }}>
                        {isEmFaltaOriginal ? 'Em falta' : fMoney(precoOriginal)}
                      </div>
                      
                      {substituto && (
                        <div 
                          onClick={(e) => e.stopPropagation()} 
                          style={{ marginTop: '8px', backgroundColor: (isTrocaAceita && isWinner) ? '#dcfce7' : '#fef3c7', padding: '6px', borderRadius: '6px', border: `1px solid ${(isTrocaAceita && isWinner) ? '#4ade80' : '#fde047'}`, textAlign: 'left' }}
                        >
                          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', cursor: 'pointer', fontSize: '11px', color: '#111827' }}>
                            <input 
                              type="checkbox" 
                              checked={isTrocaAceita && isWinner} 
                              onChange={() => toggleTroca(item.idItem, f)} 
                              style={{ marginTop: '2px' }}
                            />
                            <div>
                              <strong style={{ color: '#b45309' }}>Troca: {getNomeExibicao(substituto)}</strong><br/>
                              <span style={{ color: '#059669', fontWeight: 'bold' }}>{fMoney(precoSubstituto)}</span> (Qtd: {qtdSubstituto})
                            </div>
                          </label>
                        </div>
                      )}
                      
                      {obs && (
                        <div style={{ fontSize: '11px', color: '#475569', marginTop: '8px', fontStyle: 'italic', lineHeight: '1.2' }}>
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

        {isComparativo && promocoes.length > 0 && (
          <div style={{ marginTop: '30px', borderTop: '2px dashed #e5e7eb', paddingTop: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tag size={20} color="#2563eb" /> Sugestões & Ofertas Extras dos Fornecedores
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {promocoes.map(promo => (
                <div key={promo.id} style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1d4ed8', textTransform: 'uppercase' }}>{promo.fornecedorNome}</div>
                  <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e3a8a', marginTop: '4px' }}>{getNomeExibicao(promo.nomeProduto)}</div>
                  <div style={{ fontSize: '14px', color: '#1e40af', marginTop: '6px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{fMoney(promo.preco)}</span> <span style={{ fontSize: '12px' }}>(Mínimo: {promo.qtdMinima} un)</span>
                  </div>
                  {promo.observacao && <div style={{ fontSize: '12px', color: '#475569', marginTop: '8px', fontStyle: 'italic', borderTop: '1px solid #bfdbfe', paddingTop: '8px' }}>{promo.observacao}</div>}
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
    toggleBtn: (ativo) => ({ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '600', backgroundColor: ativo ? 'white' : 'transparent', color: ativo ? '#111827' : '#6b7280', boxShadow: ativo ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }),
    inputEdicao: { padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' },
    btnIcon: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '95%', maxWidth: '900px', maxHeight: '85vh', overflowY: 'auto' }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Cotação #{id}</h1>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          
          <label style={{
            display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
            backgroundColor: 'white', padding: '8px 12px', borderRadius: '6px',
            border: '1px solid #d1d5db', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            marginRight: '10px'
          }}>
            <input
              type="checkbox"
              checked={mostrarNomeReal}
              onChange={(e) => setMostrarNomeReal(e.target.checked)}
              style={{ transform: 'scale(1.1)' }}
            />
            <span style={{ fontSize: '13px', color: '#374151', fontWeight: '600' }}>
              Alternar Nome Diversos/Real
            </span>
          </label>

          <button style={{ ...styles.btnVoltar, backgroundColor: Object.keys(decisaoCompra).length > 0 ? '#16a34a' : '#9ca3af', cursor: Object.keys(decisaoCompra).length > 0 ? 'pointer' : 'not-allowed', display: modoVisualizacao === 'manual' ? 'none' : 'inline-block' }} onClick={handleGerarPedidos} disabled={Object.keys(decisaoCompra).length === 0}>
            <ShoppingCart size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Gerar Pedidos
          </button>
          <button style={styles.btnVoltar} onClick={() => navigate('/cotacoes')}>Voltar ao Painel</button>
        </div>
      </div>

      <div style={styles.toggleContainer}>
        <button style={styles.toggleBtn(modoVisualizacao === 'itens')} onClick={() => setModoVisualizacao('itens')}><List size={18} /> Detalhes da Cotação</button>
        <button style={styles.toggleBtn(modoVisualizacao === 'comparativo')} onClick={() => setModoVisualizacao('comparativo')}><BarChart2 size={18} /> Comparativo de Preços</button>
        
        {/* --- NOVO BOTÃO DA ÁREA DE TRABALHO MANUAL --- */}
        <button style={styles.toggleBtn(modoVisualizacao === 'manual')} onClick={() => setModoVisualizacao('manual')}>
          <ClipboardCheck size={18} color={modoVisualizacao === 'manual' ? '#10b981' : '#6b7280'} /> Registro Manual (Checklist)
        </button>
      </div>

      {loading ? <p>Carregando dados...</p> : (
        <>
          {modoVisualizacao === 'manual' ? <RenderChecklistManual /> : <RenderTabela />}
        </>
      )}

      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1f2937' }}>Resumo de Pedidos</h2>
              <button onClick={() => setShowModal(false)} style={styles.btnIcon}><X size={24} color="#4b5563" /></button>
            </div>
            
            {pedidosGerados.map((pedido, index) => {
              const promosDesteFornecedor = promocoes.filter(p => p.fornecedorNome === pedido.fornecedorNome);
              const promosNaoAdicionadas = promosDesteFornecedor.filter(p => !pedido.itens.some(i => i.isExtra && i.promocaoId === p.id));

              return (
                <div key={index} style={{ marginBottom: '24px', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f9fafb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>{pedido.fornecedorNome}</h3>
                  </div>
                  
                  <table style={{ ...styles.table, backgroundColor: 'white' }}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Produto</th>
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
                            {item.isExtra && <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 'bold', display: 'block' }}>Oferta Extra</span>}
                            {item.observacao && <span style={{ fontSize: '11px', color: '#475569', fontStyle: 'italic', display: 'block' }}>Obs: {item.observacao}</span>}
                          </td>
                          <td style={{...styles.td, textAlign: 'center'}}>
                            <input 
                              type="number" min="1" value={item.quantidadePedida}
                              onChange={(e) => {
                                const q = Number(e.target.value) || 1;
                                setPedidosGerados(prev => prev.map(p => {
                                  if (p.fornecedorNome === pedido.fornecedorNome) {
                                    const nitens = [...p.itens];
                                    nitens[idx] = { ...nitens[idx], quantidadePedida: q, subtotal: q * nitens[idx].valorUnitarioPedido };
                                    return { ...p, itens: nitens, total: nitens.reduce((a, b) => a + b.subtotal, 0) };
                                  }
                                  return p;
                                }));
                              }}
                              style={{ ...styles.inputEdicao, width: '60px', textAlign: 'center' }}
                            />
                          </td>
                          <td style={styles.td}>{fMoney(item.valorUnitarioPedido)}</td>
                          <td style={styles.td}>{fMoney(item.subtotal)}</td>
                          <td style={{...styles.td, textAlign: 'center'}}>
                            <button onClick={() => removerItemDoPedido(pedido.fornecedorNome, idx)} style={{ ...styles.btnIcon, color: '#ef4444' }}>
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="3" style={{ ...styles.td, textAlign: 'right', fontWeight: 'bold' }}>Total:</td>
                        <td colSpan="2" style={{ ...styles.td, fontWeight: 'bold', color: '#16a34a', fontSize: '16px' }}>{fMoney(pedido.total)}</td>
                      </tr>
                    </tfoot>
                  </table>

                  {promosNaoAdicionadas.length > 0 && (
                    <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
                      <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#166534', fontWeight: '600' }}>Fornecedor ofereceu itens extras. Incluir no pedido?</p>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {promosNaoAdicionadas.map(promo => (
                          <button key={promo.id} onClick={() => adicionarPromocaoAoPedido(pedido.fornecedorNome, promo)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: 'white', border: '1px solid #22c55e', color: '#16a34a', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
                            <Plus size={14} /> Add {getNomeRealSempre(promo.nomeProduto)} ({fMoney(promo.preco)})
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
                {salvandoPedidos ? 'Salvando...' : 'Salvar Pedidos no Sistema'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}