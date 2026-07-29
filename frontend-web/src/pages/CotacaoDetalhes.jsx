import React, { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { MessageCircle, FileText, ShoppingCart, BarChart2, Edit2, Trash2, Save, X, List, Tag, Plus, ClipboardCheck, Search, ArrowUpDown, ChevronUp, ChevronDown, RefreshCcw, Copy, Check, ArrowRightLeft, Settings2 } from 'lucide-react'

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

  const [itensJaComprados, setItensJaComprados] = useState([])

  const [termoBusca, setTermoBusca] = useState('')
  const [filtroOrigem, setFiltroOrigem] = useState('TODOS')
  const [filtroPropostas, setFiltroPropostas] = useState('TODOS') 
  const [sortConfig, setSortConfig] = useState({ key: 'nomeProduto', direction: 'asc' })

  const [copiadoId, setCopiadoId] = useState(null)
  const [avisosDuplicidade, setAvisosDuplicidade] = useState({})

  const [showColunasDropdown, setShowColunasDropdown] = useState(false)
  const [colunasVisiveis, setColunasVisiveis] = useState({
    quantidade: true,
    estoque: true,
    vendidoNoMes: true,
    vendidoAposUltCompra: true,
    ultCompraData: true,
    ultCompraQtde: true,
    ultVendaData: true,
    ultimoPreco: true
  })

  useEffect(() => {
    carregarRelatorio()
    carregarDicionarioDiversos() 
    carregarFornecedores()
    carregarPedidosDaCotacao()
  }, [id])

  const carregarPedidosDaCotacao = async () => {
    try {
      const response = await api.get(`/api/pedidos/cotacao/${id}`)
      const pedidos = response.data
      const comprados = []
      pedidos.forEach(p => {
        p.itens.forEach(item => {
          const idItemCotacao = item.itemCotacao?.id || item.itemCotacaoId;
          if (idItemCotacao) {
            comprados.push(idItemCotacao)
          }
        })
      })
      setItensJaComprados(comprados)
    } catch (error) {
      console.error("Erro ao carregar pedidos da cotação", error)
    }
  }

  const carregarFornecedores = async () => {
    try {
      const response = await api.get('/api/fornecedor')
      setFornecedoresLista(response.data)
    } catch (error) {
      console.error("Erro ao carregar lista de fornecedores gerais", error)
    }
  }

  useEffect(() => {
    if (relatorio.length > 0) {
      const newChecklist = { ...checklist }
      let changed = false

      relatorio.forEach(item => {
        const isBloqueado = itensJaComprados.includes(item.idItem)
        
        if (!newChecklist[item.idItem]) {
          newChecklist[item.idItem] = {
            comprado: isBloqueado,
            qtd: item.quantidade || 1,
            preco: item.ultimoPreco || 0,
            bloqueado: isBloqueado
          }
          changed = true
        } else if (isBloqueado && !newChecklist[item.idItem].bloqueado) {
          newChecklist[item.idItem].comprado = true
          newChecklist[item.idItem].bloqueado = true
          changed = true
        }
      })

      if (changed) {
        setChecklist(newChecklist)
      }
    }
  }, [relatorio, itensJaComprados])

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
    const codigoLimpo = String(nomeProduto).toUpperCase().replace(/\s/g, '');
    return dicionarioDiversos[codigoLimpo] || String(nomeProduto); 
  }

  const getNomeExibicao = (nomeProduto) => {
    if (!nomeProduto) return '';
    if (mostrarNomeReal) {
      return getNomeRealSempre(nomeProduto);
    }
    return nomeProduto;
  }

  const copiarParaAreaTransferencia = (texto, idItem) => {
    navigator.clipboard.writeText(texto).then(() => {
      setCopiadoId(idItem);
      setTimeout(() => setCopiadoId(null), 2000); 
    }).catch(err => {
      console.error('Falha ao copiar:', err);
    });
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

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getValorOrdenacao = (item, key) => {
    if (key === 'nomeProduto') return getNomeExibicao(item.nomeProduto);
    if (key === 'origemItem') return item.origemItem || 'Geral';
    return item[key] ?? 0;
  };

  const relatorioOrdenado = useMemo(() => {
    let ordenavel = [...relatorio];
    ordenavel.sort((a, b) => {
      const valA = getValorOrdenacao(a, sortConfig.key);
      const valB = getValorOrdenacao(b, sortConfig.key);

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return ordenavel;
  }, [relatorio, sortConfig, mostrarNomeReal, dicionarioDiversos]);

  const relatorioExibicao = useMemo(() => {
    return relatorioOrdenado.filter(item => {
      const matchBusca = getNomeExibicao(item.nomeProduto).toLowerCase().includes(termoBusca.toLowerCase());
      const origemItem = item.origemItem || 'Geral';
      const matchOrigem = filtroOrigem === 'TODOS' || origemItem === filtroOrigem;
      const precos = Object.values(item.precosPorFornecedor || {});
      const temPropostaValida = precos.some(p => p > 0);
      const matchPropostas = 
        filtroPropostas === 'TODOS' || 
        (filtroPropostas === 'COM_PROPOSTAS' && temPropostaValida) || 
        (filtroPropostas === 'SEM_PROPOSTAS' && !temPropostaValida);

      return matchBusca && matchOrigem && matchPropostas;
    });
  }, [relatorioOrdenado, termoBusca, filtroOrigem, filtroPropostas]);

  const SortIcon = ({ sortKey }) => {
    if (sortConfig.key !== sortKey) return <ArrowUpDown size={14} color="#9ca3af" style={{ marginLeft: '6px' }} />;
    return sortConfig.direction === 'asc' 
      ? <ChevronUp size={14} color="#2563eb" style={{ marginLeft: '6px' }} />
      : <ChevronDown size={14} color="#2563eb" style={{ marginLeft: '6px' }} />;
  };

  const handleSetWinner = (idItem, fornecedorNome) => {
    setDecisaoCompra(prev => {
      if (prev[idItem] === fornecedorNome) {
        const itemRelatorio = relatorio.find(r => r.idItem === idItem);
        if (itemRelatorio) {
          let menorPreco = Infinity;
          let melhorFornecedor = 'Sem ofertas';

          Object.entries(itemRelatorio.precosPorFornecedor || {}).forEach(([fNome, p]) => {
            if (p > 0 && p < menorPreco) {
              menorPreco = p;
              melhorFornecedor = fNome;
            }
          });

          if (fornecedorNome !== melhorFornecedor && melhorFornecedor !== 'Sem ofertas') {
            return { ...prev, [idItem]: melhorFornecedor };
          }
        }
        
        const novoEstado = { ...prev };
        delete novoEstado[idItem];
        return novoEstado;
      }
      return { ...prev, [idItem]: fornecedorNome };
    });
  }

  const toggleTroca = (idItem, fornecedorNome) => {
    const isAtivando = !aceitesTroca[idItem];
    setAceitesTroca(prev => ({ ...prev, [idItem]: isAtivando }));

    if (isAtivando) {
      setDecisaoCompra(prev => ({ ...prev, [idItem]: fornecedorNome }));
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
          
          setDecisaoCompra(prev => ({ ...prev, [idItem]: vencedorOriginal }));
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

  const reatribuirItem = (idItem) => {
    if (window.confirm("Deseja reatribuir este item para comprar novamente? (O pedido existente NÃO será apagado do sistema)")) {
      setItensJaComprados(prev => prev.filter(id => id !== idItem));
      setChecklist(prev => {
        const newChecklist = { ...prev };
        if (newChecklist[idItem]) {
          newChecklist[idItem].bloqueado = false;
          newChecklist[idItem].comprado = false;
        }
        return newChecklist;
      });
    }
  };

  const mapearDuplicatas = async () => {
    try {
      const response = await api.get('/api/pedidos');
      const pendentes = response.data.filter(p => p.status === 'PENDENTE_ENTREGA' && (p.cotacao?.id !== Number(id) && p.cotacaoId !== Number(id)));

      const mapa = {};
      pendentes.forEach(p => {
        const cId = p.cotacao?.id || p.cotacaoId || '?';
        p.itens.forEach(i => {
          const nomeNormalizado = getNomeRealSempre(i.nomeProduto).toUpperCase().trim();
          if (!mapa[nomeNormalizado]) {
            mapa[nomeNormalizado] = new Set();
          }
          mapa[nomeNormalizado].add(cId);
        });
      });
      return mapa;
    } catch (error) {
      console.error("Erro ao buscar duplicatas:", error);
      return {};
    }
  };

  const handleGerarPedidos = async () => {
    const pedidosPorFornecedor = {}

    relatorioOrdenado.forEach(itemRelatorio => {
      const idItem = itemRelatorio.idItem;
      
      if (itensJaComprados.includes(idItem)) return;

      const fornecedorNome = decisaoCompra[idItem];

      if (!fornecedorNome || fornecedorNome === 'Sem ofertas') return;

      if (!pedidosPorFornecedor[fornecedorNome]) {
        pedidosPorFornecedor[fornecedorNome] = { fornecedorNome: fornecedorNome, itens: [], total: 0 }
      }

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
        isExtra: false,
        todosDadosItem: itemRelatorio 
      })
      pedidosPorFornecedor[fornecedorNome].total += (qtd * preco);
    });

    const pedidosArray = Object.values(pedidosPorFornecedor).filter(ped => ped.itens.length > 0)
    
    if (pedidosArray.length === 0) {
      alert('Nenhum item válido para gerar pedido.')
      return
    }

    const mapaDuplicatas = await mapearDuplicatas();
    setAvisosDuplicidade(mapaDuplicatas);

    setPedidosGerados(pedidosArray)
    setShowModal(true)
  }

  const moverItemParaFornecedor = (fornecedorOrigem, indexItem, fornecedorDestino) => {
    if (fornecedorOrigem === fornecedorDestino) return;

    setPedidosGerados(prev => {
      let newState = prev.map(p => ({ ...p, itens: [...p.itens] })); 

      const pedOrigem = newState.find(p => p.fornecedorNome === fornecedorOrigem);
      if (!pedOrigem) return prev;

      const itemToMove = pedOrigem.itens.splice(indexItem, 1)[0];
      pedOrigem.total = pedOrigem.itens.reduce((acc, it) => acc + it.subtotal, 0);

      let pedDestino = newState.find(p => p.fornecedorNome === fornecedorDestino);
      if (!pedDestino) {
        pedDestino = { fornecedorNome: fornecedorDestino, itens: [], total: 0 };
        newState.push(pedDestino);
      }

      const precos = itemToMove.todosDadosItem?.precosPorFornecedor || {};
      let novoPreco = precos[fornecedorDestino] || 0;
      
      if (novoPreco > 0) {
          itemToMove.valorUnitarioPedido = novoPreco;
          itemToMove.subtotal = itemToMove.quantidadePedida * novoPreco;
      } else {
          alert(`Aviso: O fornecedor ${fornecedorDestino} informou o preço como R$ 0,00 ou falta para este produto.`);
          itemToMove.valorUnitarioPedido = 0;
          itemToMove.subtotal = 0;
      }

      pedDestino.itens.push(itemToMove);
      pedDestino.total = pedDestino.itens.reduce((acc, it) => acc + it.subtotal, 0);

      return newState.filter(p => p.itens.length > 0);
    });
  };

  const irParaProximoMenorPreco = (fornecedorOrigem, indexItem) => {
    const pedOrigem = pedidosGerados.find(p => p.fornecedorNome === fornecedorOrigem);
    const item = pedOrigem.itens[indexItem];
    const precos = item.todosDadosItem?.precosPorFornecedor || {};

    let menorPreco = Infinity;
    let fornecedorVencedor = null;

    Object.entries(precos).forEach(([fNome, p]) => {
      if (p > 0 && p < menorPreco && fNome !== fornecedorOrigem) {
        menorPreco = p;
        fornecedorVencedor = fNome;
      }
    });

    if (fornecedorVencedor) {
      moverItemParaFornecedor(fornecedorOrigem, indexItem, fornecedorVencedor);
    } else {
      alert('Não há outro fornecedor com preço cadastrado e disponível para este produto.');
    }
  };

  const handleSalvarRegistroManual = async () => {
    if (!fornecedorManual) {
      alert('Por favor, selecione um Fornecedor no topo da tela para vincular as compras.');
      return;
    }

    const itensComprados = [];

    relatorioOrdenado.forEach(itemRelatorio => {
      const idItem = itemRelatorio.idItem;
      const chk = checklist[idItem];
      
      if (chk && chk.comprado && !chk.bloqueado && chk.qtd > 0) {
        itensComprados.push({
          itemCotacaoId: idItem,
          quantidadePedida: chk.qtd,
          valorUnitarioPedido: chk.preco,
          nomeProduto: getNomeRealSempre(itemRelatorio.nomeProduto)
        });
      }
    });

    if (itensComprados.length === 0) {
      alert('Marque pelo menos um produto (que ainda não foi pedido) como "✅ Já Comprado" para gerar o registro.');
      return;
    }

    const mapaDuplicatas = await mapearDuplicatas();
    const itensDuplicados = itensComprados.filter(i => mapaDuplicatas[getNomeRealSempre(i.nomeProduto).toUpperCase().trim()]);

    let mensagemConfirmacao = `Confirma o registro do pedido com ${itensComprados.length} itens no fornecedor ${fornecedorManual}?`;

    if (itensDuplicados.length > 0) {
      mensagemConfirmacao = `⚠️ AVISO DE DUPLICIDADE ⚠️\n\nOs seguintes itens já possuem pedidos pendentes em outras cotações:\n`;
      itensDuplicados.forEach(i => {
        const cots = Array.from(mapaDuplicatas[getNomeRealSempre(i.nomeProduto).toUpperCase().trim()]).join(', ');
        mensagemConfirmacao += `- ${i.nomeProduto} (Cotações: ${cots})\n`;
      });
      mensagemConfirmacao += `\nDeseja gerar o pedido mesmo assim?`;
    }

    if (window.confirm(mensagemConfirmacao)) {
      setSalvandoPedidos(true);
      try {
        const payload = [{
          cotacaoId: Number(id),
          fornecedorNome: fornecedorManual,
          itens: itensComprados
        }];
        
        await api.post('/api/pedidos/registro-manual', payload);
        alert('Pedido manual registrado com sucesso!');
        carregarPedidosDaCotacao();
        setFornecedorManual('');
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

  const baixarRelatorioGeral = async () => {
    try {
      const itens = relatorioOrdenado;

      if (!itens || itens.length === 0) {
        alert('Essa cotação ainda não tem itens processados.')
        return
      }

      const doc = new jsPDF()
      doc.setFontSize(18)
      doc.text(`Relatório de Fechamento - Cotação #${id}`, 14, 20)
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

      doc.save(`Relatorio_Geral_Cotacao_${id}.pdf`)
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      alert('Erro ao gerar o relatório.')
    }
  }

  const fMoney = (v) => v != null && v > 0 ? Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'
  const fData = (data) => data ? data : '-'; 

  const getCorOrigem = (origem) => {
    if (origem === 'Falta Manual') return { bg: '#ffedd5', color: '#c2410c', border: '#fdba74' };
    if (origem === 'Sugestão') return { bg: '#e0e7ff', color: '#1d4ed8', border: '#93c5fd' };
    if (origem === 'Falta e Sugestão') return { bg: '#fae8ff', color: '#7e22ce', border: '#d8b4fe' };
    return { bg: '#f3f4f6', color: '#4b5563', border: '#d1d5db' };
  };

  const renderChecklistManual = () => {
    const totalComprado = Object.keys(checklist).reduce((acc, key) => {
      const item = checklist[key];
      return (item.comprado && !item.bloqueado) ? acc + (item.qtd * item.preco) : acc;
    }, 0);

    return (
      <div style={{ ...styles.card, borderTop: '4px solid #10b981' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', paddingBottom: '20px', borderBottom: '2px dashed #e5e7eb', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#374151', marginBottom: '6px' }}>Fornecedor da Compra</label>
            <select 
              value={fornecedorManual} 
              onChange={(e) => setFornecedorManual(e.target.value)}
              style={{ width: '100%', minWidth: '300px', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', backgroundColor: '#f9fafb', fontSize: '14px' }}
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

        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, width: '120px', minWidth: '100px', cursor: 'pointer' }} onClick={() => requestSort('origemItem')}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>Origem <SortIcon sortKey="origemItem" /></div>
                </th>
                <th style={{ ...styles.th, cursor: 'pointer', minWidth: '250px' }} onClick={() => requestSort('nomeProduto')}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>Produto <SortIcon sortKey="nomeProduto" /></div>
                </th>
                <th style={{ ...styles.th, textAlign: 'center', width: '100px', minWidth: '100px', cursor: 'pointer' }} onClick={() => requestSort('quantidade')}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Qtd <SortIcon sortKey="quantidade" /></div>
                </th>
                <th style={{ ...styles.th, textAlign: 'right', width: '120px', minWidth: '120px' }}>Custo Final (R$)</th>
                <th style={{ ...styles.th, textAlign: 'right', width: '120px', minWidth: '120px' }}>Subtotal</th>
                <th style={{ ...styles.th, textAlign: 'center', width: '130px', minWidth: '130px', backgroundColor: '#f0fdf4', color: '#166534' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {relatorioExibicao.map((item) => {
                const chk = checklist[item.idItem] || { comprado: false, qtd: 1, preco: 0, bloqueado: false };
                const cores = getCorOrigem(item.origemItem || 'Geral');
                
                const rowStyle = chk.bloqueado 
                  ? { backgroundColor: '#f3f4f6', opacity: 0.6 } 
                  : chk.comprado 
                    ? { backgroundColor: '#f0fdf4', opacity: 0.85 } 
                    : { backgroundColor: '#ffffff' };

                const textStyle = chk.bloqueado || chk.comprado 
                  ? { textDecoration: 'line-through', color: '#9ca3af' } 
                  : { fontWeight: '600', color: '#1f2937' };

                return (
                  <tr key={item.idItem} style={rowStyle}>
                    <td style={styles.td}>
                      <span style={{ 
                        fontSize: '11px', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold', 
                        backgroundColor: cores.bg, color: cores.color, border: `1px solid ${cores.border}` 
                      }}>
                        {item.origemItem || 'Geral'}
                      </span>
                    </td>

                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ ...textStyle, fontSize: '14px' }}>
                          {getNomeExibicao(item.nomeProduto)}
                        </span>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            copiarParaAreaTransferencia(getNomeExibicao(item.nomeProduto), item.idItem);
                          }} 
                          title="Copiar Nome do Produto" 
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: copiadoId === item.idItem ? '#10b981' : '#9ca3af' }}
                        >
                          {copiadoId === item.idItem ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </td>

                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <input 
                        type="number" 
                        min="0" 
                        value={chk.qtd} 
                        onChange={(e) => setChecklist({ ...checklist, [item.idItem]: { ...chk, qtd: Number(e.target.value) } })}
                        onFocus={(e) => e.target.select()}
                        style={{ ...styles.inputEdicao, width: '70px', textAlign: 'center', fontWeight: 'bold' }}
                        disabled={chk.comprado || chk.bloqueado}
                      />
                    </td>

                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      <input 
                        type="number" 
                        step="0.01"
                        min="0" 
                        value={chk.preco} 
                        onChange={(e) => setChecklist({ ...checklist, [item.idItem]: { ...chk, preco: Number(e.target.value) } })}
                        onFocus={(e) => e.target.select()}
                        style={{ ...styles.inputEdicao, width: '90px', textAlign: 'right', fontWeight: 'bold' }}
                        disabled={chk.comprado || chk.bloqueado}
                      />
                    </td>

                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: 'bold', color: (chk.comprado && !chk.bloqueado) ? '#166534' : '#6b7280' }}>
                      {fMoney(chk.qtd * chk.preco)}
                    </td>

                    <td style={{ ...styles.td, textAlign: 'center', backgroundColor: chk.bloqueado ? '#e5e7eb' : chk.comprado ? '#dcfce7' : 'transparent', borderLeft: '1px dashed #d1d5db' }}>
                      {chk.bloqueado ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#4b5563' }}>
                            Já Pedido
                          </span>
                          <button 
                            type="button"
                            onClick={() => reatribuirItem(item.idItem)} 
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}
                          >
                            <RefreshCcw size={10} /> Reatribuir
                          </button>
                        </div>
                      ) : (
                        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', height: '100%' }}>
                          <input 
                            type="checkbox" 
                            checked={chk.comprado}
                            onChange={(e) => setChecklist({ ...checklist, [item.idItem]: { ...chk, comprado: e.target.checked } })}
                            style={{ transform: 'scale(1.5)', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '13px', fontWeight: 'bold', color: chk.comprado ? '#166534' : '#6b7280' }}>
                            {chk.comprado ? 'Marcado' : 'Marcar'}
                          </span>
                        </label>
                      )}
                    </td>

                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button type="button" onClick={handleSalvarRegistroManual} disabled={salvandoPedidos} style={{ ...styles.btnVoltar, backgroundColor: '#10b981', fontSize: '15px', padding: '12px 24px', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.4)' }}>
            <Save size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> 
            {salvandoPedidos ? 'Registrando...' : 'Finalizar Registro e Gerar Pedidos'}
          </button>
        </div>

      </div>
    );
  };

  const renderTabela = () => {
    const isComparativo = modoVisualizacao === 'comparativo';
    const isItens = modoVisualizacao === 'itens';

    return (
      <div style={styles.card}>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, cursor: 'pointer', userSelect: 'none', minWidth: '250px', position: 'sticky', left: 0, zIndex: 20, boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }} onClick={() => requestSort('nomeProduto')}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>Produto <SortIcon sortKey="nomeProduto" /></div>
                </th>
                
                {colunasVisiveis.quantidade && (
                  <th style={{ ...styles.th, cursor: 'pointer', userSelect: 'none', minWidth: '130px' }} onClick={() => requestSort('quantidade')}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>Qtd. Solicitada <SortIcon sortKey="quantidade" /></div>
                  </th>
                )}
                
                {colunasVisiveis.estoque && (
                  <th style={{ ...styles.th, cursor: 'pointer', userSelect: 'none', minWidth: '130px' }} onClick={() => requestSort('estoque')}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>Estoque Atual <SortIcon sortKey="estoque" /></div>
                  </th>
                )}
                
                {isItens && (
                  <>
                    {colunasVisiveis.vendidoNoMes && (
                      <th style={{ ...styles.th, cursor: 'pointer', userSelect: 'none', minWidth: '140px' }} onClick={() => requestSort('vendidoNoMes')}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>Vendido no Mês <SortIcon sortKey="vendidoNoMes" /></div>
                      </th>
                    )}
                    {colunasVisiveis.vendidoAposUltCompra && (
                      <th style={{ ...styles.th, cursor: 'pointer', userSelect: 'none', minWidth: '160px' }} onClick={() => requestSort('vendidoAposUltCompra')}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>Vend. pós Últ. Compra <SortIcon sortKey="vendidoAposUltCompra" /></div>
                      </th>
                    )}
                    {colunasVisiveis.ultCompraData && <th style={{...styles.th, minWidth: '130px'}}>Data Últ. Compra</th>}
                    {colunasVisiveis.ultCompraQtde && <th style={{...styles.th, minWidth: '130px'}}>Qtd. Últ. Compra</th>}
                    {colunasVisiveis.ultVendaData && <th style={{...styles.th, minWidth: '130px'}}>Data Últ. Venda</th>}
                  </>
                )}

                {colunasVisiveis.ultimoPreco && (
                  <th style={{ ...styles.th, color: '#4f46e5', textAlign: 'right', cursor: 'pointer', userSelect: 'none', minWidth: '150px' }} onClick={() => requestSort('ultimoPreco')}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>Preço Últ. Compra <SortIcon sortKey="ultimoPreco" /></div>
                  </th>
                )}

                {isComparativo && fornecedores.map((f) => (
                  <th key={f} style={{ ...styles.th, backgroundColor: '#f9fafb', textAlign: 'center', borderLeft: '1px solid #e5e7eb', minWidth: '180px' }}>
                    {f}
                  </th>
                ))}
                {isItens && <th style={{ ...styles.th, textAlign: 'center', minWidth: '100px' }}>Ações</th>}
              </tr>
            </thead>
            <tbody>
              {relatorioExibicao.map((item) => {
                const cores = getCorOrigem(item.origemItem || 'Geral');
                const isBloqueado = itensJaComprados.includes(item.idItem);
                const textStyle = isBloqueado ? { textDecoration: 'line-through', color: '#9ca3af' } : {};

                return (
                <tr key={item.idItem} style={{ backgroundColor: '#ffffff' }}>
                  <td style={{ ...styles.td, position: 'sticky', left: 0, zIndex: 10, backgroundColor: 'inherit', boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }}>
                    {editandoItem === item.idItem ? (
                      <input 
                        style={{ ...styles.inputEdicao, width: '100%', minWidth: '200px' }} 
                        value={formEdicao.nome} 
                        onChange={(e) => setFormEdicao({ ...formEdicao, nome: e.target.value })} 
                        onKeyDown={(e) => e.key === 'Enter' && salvarEdicao(item.idItem)}
                      />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={textStyle}>{getNomeExibicao(item.nomeProduto)}</strong>
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              copiarParaAreaTransferencia(getNomeExibicao(item.nomeProduto), item.idItem);
                            }} 
                            title="Copiar Nome do Produto" 
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: copiadoId === item.idItem ? '#10b981' : '#9ca3af' }}
                          >
                            {copiadoId === item.idItem ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                          <span style={{ 
                            fontSize: '10px', 
                            backgroundColor: cores.bg, 
                            color: cores.color, 
                            border: `1px solid ${cores.border}`,
                            padding: '2px 8px', 
                            borderRadius: '10px', 
                            fontWeight: 'bold' 
                          }}>
                            {item.origemItem || 'Geral'}
                          </span>

                          {isBloqueado && (
                            <>
                              <span style={{ 
                                fontSize: '10px', 
                                backgroundColor: '#dcfce7', 
                                color: '#166534', 
                                border: '1px solid #86efac', 
                                padding: '2px 8px', 
                                borderRadius: '10px', 
                                fontWeight: 'bold' 
                              }}>
                                ✓ Pedido Gerado
                              </span>
                              <button 
                                type="button"
                                onClick={() => reatribuirItem(item.idItem)} 
                                title="Permitir comprar este item novamente"
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}
                              >
                                <RefreshCcw size={10} /> Reatribuir
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </td>
                  
                  {colunasVisiveis.quantidade && (
                    <td style={styles.td}>
                      {editandoItem === item.idItem ? (
                        <input 
                          type="number" 
                          style={{ ...styles.inputEdicao, width: '70px', textAlign: 'center' }} 
                          value={formEdicao.qtd} 
                          onChange={(e) => setFormEdicao({ ...formEdicao, qtd: Number(e.target.value) })} 
                          onKeyDown={(e) => e.key === 'Enter' && salvarEdicao(item.idItem)}
                          onFocus={(e) => e.target.select()}
                          autoFocus
                        />
                      ) : (
                        <span style={textStyle}>{item.quantidade} un</span>
                      )}
                    </td>
                  )}
                  
                  {colunasVisiveis.estoque && (
                    <td style={styles.td}><span style={textStyle}>{item.estoque ?? '-'}</span></td>
                  )}

                  {isItens && (
                    <>
                      {colunasVisiveis.vendidoNoMes && <td style={styles.td}><span style={textStyle}>{item.vendidoNoMes ?? '-'}</span></td>}
                      {colunasVisiveis.vendidoAposUltCompra && <td style={styles.td}><span style={textStyle}>{item.vendidoAposUltCompra ?? '-'}</span></td>}
                      {colunasVisiveis.ultCompraData && <td style={styles.td}><span style={textStyle}>{fData(item.ultCompraData)}</span></td>}
                      {colunasVisiveis.ultCompraQtde && <td style={styles.td}><span style={textStyle}>{item.ultCompraQtde ?? '-'}</span></td>}
                      {colunasVisiveis.ultVendaData && <td style={styles.td}><span style={textStyle}>{fData(item.ultVendaData)}</span></td>}
                    </>
                  )}

                  {colunasVisiveis.ultimoPreco && (
                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: '500' }}>
                      <span style={textStyle}>{item.ultimoPreco != null ? fMoney(item.ultimoPreco) : '-'}</span>
                    </td>
                  )}

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
                        onClick={() => !isBloqueado && handleSetWinner(item.idItem, f)}
                        style={{
                          ...styles.td,
                          backgroundColor: isWinner ? '#ecfdf5' : 'inherit',
                          textAlign: 'center',
                          borderLeft: '1px solid #f3f4f6',
                          border: isWinner ? '2px solid #10b981' : '1px solid #e5e7eb',
                          cursor: isBloqueado ? 'not-allowed' : 'pointer',
                          verticalAlign: 'top',
                          position: 'relative',
                          opacity: isBloqueado ? 0.6 : 1
                        }}
                      >
                        {isWinner && <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', backgroundColor: '#10b981', color: 'white', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>VENCEDOR</div>}

                        <div style={{ marginTop: '8px', fontWeight: isWinner ? 'bold' : 'normal', color: isEmFaltaOriginal ? '#dc2626' : '#374151', textDecoration: isBloqueado ? 'line-through' : 'none' }}>
                          {isEmFaltaOriginal ? 'Em falta' : fMoney(precoOriginal)}
                        </div>
                        
                        {substituto && (
                          <div 
                            onClick={(e) => { e.stopPropagation(); if(!isBloqueado) toggleTroca(item.idItem, f); }} 
                            style={{ marginTop: '8px', backgroundColor: (isTrocaAceita && isWinner) ? '#dcfce7' : '#fef3c7', padding: '6px', borderRadius: '6px', border: `1px solid ${(isTrocaAceita && isWinner) ? '#4ade80' : '#fde047'}`, textAlign: 'left' }}
                          >
                            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', cursor: isBloqueado ? 'not-allowed' : 'pointer', fontSize: '11px', color: '#111827' }}>
                              <input 
                                type="checkbox" 
                                checked={isTrocaAceita && isWinner} 
                                onChange={() => !isBloqueado && toggleTroca(item.idItem, f)} 
                                style={{ marginTop: '2px' }}
                                disabled={isBloqueado}
                              />
                              <div style={{ textDecoration: isBloqueado ? 'line-through' : 'none' }}>
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
                          <button type="button" onClick={() => salvarEdicao(item.idItem)} style={{ ...styles.btnIcon, color: '#16a34a' }}><Save size={18} /></button>
                          <button type="button" onClick={() => setEditandoItem(null)} style={{ ...styles.btnIcon, color: '#6b7280' }}><X size={18} /></button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                          <button type="button" onClick={() => iniciarEdicao(item)} style={{ ...styles.btnIcon, color: '#3b82f6' }} disabled={isBloqueado}><Edit2 size={18} opacity={isBloqueado ? 0.3 : 1}/></button>
                          <button type="button" onClick={() => deletarItem(item.idItem)} style={{ ...styles.btnIcon, color: '#ef4444' }} disabled={isBloqueado}><Trash2 size={18} opacity={isBloqueado ? 0.3 : 1}/></button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              )})}
            </tbody>
          </table>
        </div>

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
    header: { marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' },
    title: { fontSize: '24px', fontWeight: 'bold', color: '#1f2937' },
    card: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' },
    
    tableContainer: { 
      maxHeight: 'calc(100vh - 280px)', 
      overflowY: 'auto', 
      overflowX: 'auto', 
      border: '1px solid #e5e7eb', 
      borderRadius: '8px' 
    },
    
    table: { width: '100%', borderCollapse: 'collapse', marginTop: 0 },
    
    th: { 
      textAlign: 'left', 
      padding: '12px', 
      borderBottom: '2px solid #e5e7eb', 
      color: '#4b5563', 
      fontSize: '13px', 
      whiteSpace: 'nowrap', 
      position: 'sticky',
      top: 0,
      backgroundColor: '#ffffff',
      zIndex: 10
    },
    
    td: { 
      padding: '12px', 
      borderBottom: '1px solid #e5e7eb', 
      color: '#374151', 
      fontSize: '13px',
      wordBreak: 'break-word', 
      whiteSpace: 'normal'     
    },

    btnVoltar: { padding: '10px 20px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' },
    toggleContainer: { display: 'flex', gap: '10px', marginBottom: '20px', backgroundColor: '#e5e7eb', padding: '4px', borderRadius: '8px', width: 'fit-content', flexWrap: 'wrap' },
    toggleBtn: (ativo) => ({ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '600', backgroundColor: ativo ? 'white' : 'transparent', color: ativo ? '#111827' : '#6b7280', boxShadow: ativo ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }),
    inputEdicao: { padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' },
    btnIcon: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '95%', maxWidth: '1000px', maxHeight: '85vh', overflowY: 'auto' },
    
    // ESTILOS MENU DE COLUNAS
    menuColunas: { position: 'absolute', top: '110%', right: 0, backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px', zIndex: 50, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '10px' }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Cotação #{id}</h1>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          
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

          <button type="button" style={{ ...styles.btnVoltar, backgroundColor: Object.keys(decisaoCompra).length > 0 ? '#16a34a' : '#9ca3af', cursor: Object.keys(decisaoCompra).length > 0 ? 'pointer' : 'not-allowed', display: modoVisualizacao === 'manual' ? 'none' : 'flex' }} onClick={handleGerarPedidos} disabled={Object.keys(decisaoCompra).length === 0}>
            <ShoppingCart size={18} /> Gerar Pedidos
          </button>
          <button type="button" style={{ ...styles.btnVoltar, display: modoVisualizacao === 'manual' ? 'none' : 'flex' }} onClick={baixarRelatorioGeral}>
            <FileText size={18} /> Baixar PDF
          </button>
          <button type="button" style={styles.btnVoltar} onClick={() => navigate('/cotacoes')}>Voltar ao Painel</button>
        </div>
      </div>

      <div style={styles.toggleContainer}>
        <button type="button" style={styles.toggleBtn(modoVisualizacao === 'itens')} onClick={() => setModoVisualizacao('itens')}><List size={18} /> Detalhes da Cotação</button>
        <button type="button" style={styles.toggleBtn(modoVisualizacao === 'comparativo')} onClick={() => setModoVisualizacao('comparativo')}><BarChart2 size={18} /> Comparativo de Preços</button>
        
        <button type="button" style={styles.toggleBtn(modoVisualizacao === 'manual')} onClick={() => setModoVisualizacao('manual')}>
          <ClipboardCheck size={18} color={modoVisualizacao === 'manual' ? '#10b981' : '#6b7280'} /> Registro Manual (Checklist)
        </button>
      </div>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #d1d5db', padding: '8px 12px', borderRadius: '6px' }}>
          <Search size={18} color="#6b7280" />
          <input 
            type="text" 
            placeholder="Filtrar por produto..." 
            value={termoBusca} 
            onChange={e => setTermoBusca(e.target.value)}
            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px' }}
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#4b5563' }}>Origem:</span>
          <select 
            value={filtroOrigem} 
            onChange={e => setFiltroOrigem(e.target.value)}
            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', fontSize: '14px', cursor: 'pointer' }}
          >
            <option value="TODOS">Todas as Origens</option>
            <option value="Falta Manual">Falta Manual</option>
            <option value="Sugestão">Sugestão</option>
            <option value="Falta e Sugestão">Falta e Sugestão</option>
            <option value="Geral">Geral</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#4b5563' }}>Status (Propostas):</span>
          <select 
            value={filtroPropostas} 
            onChange={e => setFiltroPropostas(e.target.value)}
            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', fontSize: '14px', cursor: 'pointer' }}
          >
            <option value="TODOS">Todos os Produtos</option>
            <option value="COM_PROPOSTAS">Com Propostas</option>
            <option value="SEM_PROPOSTAS">Sem Propostas (Falta Geral)</option>
          </select>
        </div>

        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowColunasDropdown(!showColunasDropdown)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: showColunasDropdown ? '#f1f5f9' : 'white', cursor: 'pointer', fontWeight: '600', color: '#4b5563', fontSize: '14px' }}
          >
            <Settings2 size={16} /> Colunas
          </button>
          
          {showColunasDropdown && (
            <div style={styles.menuColunas}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '4px' }}>Exibir na Tabela</div>
              {Object.entries({
                quantidade: 'Qtd. Solicitada',
                estoque: 'Estoque Atual',
                vendidoNoMes: 'Vendido no Mês',
                vendidoAposUltCompra: 'Vend. pós Últ. Compra',
                ultCompraData: 'Data Últ. Compra',
                ultCompraQtde: 'Qtd. Últ. Compra',
                ultVendaData: 'Data Últ. Venda',
                ultimoPreco: 'Preço Últ. Compra'
              }).map(([key, label]) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#374151' }}>
                  <input 
                    type="checkbox" 
                    checked={colunasVisiveis[key]}
                    onChange={(e) => setColunasVisiveis(prev => ({ ...prev, [key]: e.target.checked }))}
                    style={{ transform: 'scale(1.1)' }}
                  />
                  {label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? <p>Carregando dados...</p> : (
        <>
          {modoVisualizacao === 'manual' ? renderChecklistManual() : renderTabela()}
        </>
      )}

      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1f2937' }}>Resumo de Pedidos</h2>
              <button type="button" onClick={() => setShowModal(false)} style={styles.btnIcon}><X size={24} color="#4b5563" /></button>
            </div>
            
            {pedidosGerados.map((pedido, index) => {
              const promosDesteFornecedor = promocoes.filter(p => p.fornecedorNome === pedido.fornecedorNome);
              const promosNaoAdicionadas = promosDesteFornecedor.filter(p => !pedido.itens.some(i => i.isExtra && i.promocaoId === p.id));

              return (
                <div key={index} style={{ marginBottom: '24px', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f9fafb', overflowX: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>{pedido.fornecedorNome}</h3>
                  </div>
                  
                  <table style={{ ...styles.table, backgroundColor: 'white', minWidth: '600px' }}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Produto</th>
                        <th style={{...styles.th, textAlign: 'center'}}>Qtd</th>
                        <th style={styles.th}>Preço Unit.</th>
                        <th style={styles.th}>Subtotal</th>
                        
                        <th style={{...styles.th, textAlign: 'center', minWidth: '150px'}}>Mover / Trocar</th>
                        
                        <th style={styles.th}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {pedido.itens.map((item, idx) => {
                        const nomeProdutoBusca = getNomeRealSempre(item.nomeProduto).toUpperCase().trim();
                        const duplicatasSet = avisosDuplicidade[nomeProdutoBusca];

                        return (
                          <tr key={idx} style={{ backgroundColor: item.isExtra ? '#eff6ff' : 'white' }}>
                            <td style={styles.td}>
                              <span style={{ fontWeight: '500', color: '#111827', display: 'block' }}>{item.nomeProduto}</span>
                              {item.nomeOriginal && <span style={{ fontSize: '11px', color: '#b45309', display: 'block' }}>Troca de: {item.nomeOriginal}</span>}
                              {item.isExtra && <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 'bold', display: 'block' }}>Oferta Extra</span>}
                              {item.observacao && <span style={{ fontSize: '11px', color: '#475569', fontStyle: 'italic', display: 'block' }}>Obs: {item.observacao}</span>}
                              
                              {duplicatasSet && duplicatasSet.size > 0 && (
                                <span style={{ fontSize: '11px', color: '#d97706', fontWeight: 'bold', display: 'block', marginTop: '4px' }}>
                                  ⚠️ Já pedido na(s) Cotação(ões): {Array.from(duplicatasSet).join(', ')}
                                </span>
                              )}
                            </td>
                            <td style={{...styles.td, textAlign: 'center'}}>
                              <input 
                                type="number" min="1" value={item.quantidadePedida}
                                onFocus={(e) => e.target.select()}
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
                              {!item.isExtra && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <ArrowRightLeft size={12} color="#64748b" />
                                    <select 
                                      style={{...styles.inputEdicao, width: '130px', fontSize: '11px', padding: '2px 4px'}}
                                      value={pedido.fornecedorNome}
                                      onChange={(e) => moverItemParaFornecedor(pedido.fornecedorNome, idx, e.target.value)}
                                    >
                                      {fornecedores.map(f => (
                                        <option key={f} value={f}>{f}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <button 
                                    type="button" 
                                    onClick={() => irParaProximoMenorPreco(pedido.fornecedorNome, idx)}
                                    title="Busca o próximo fornecedor mais barato"
                                    style={{ fontSize: '10px', backgroundColor: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}
                                  >
                                    Próximo Menor $
                                  </button>
                                </div>
                              )}
                            </td>

                            <td style={{...styles.td, textAlign: 'center'}}>
                              <button type="button" onClick={() => removerItemDoPedido(pedido.fornecedorNome, idx)} style={{ ...styles.btnIcon, color: '#ef4444' }}>
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="3" style={{ ...styles.td, textAlign: 'right', fontWeight: 'bold' }}>Total:</td>
                        <td colSpan="3" style={{ ...styles.td, fontWeight: 'bold', color: '#16a34a', fontSize: '16px' }}>{fMoney(pedido.total)}</td>
                      </tr>
                    </tfoot>
                  </table>

                  {promosNaoAdicionadas.length > 0 && (
                    <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
                      <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#166534', fontWeight: '600' }}>Fornecedor ofereceu itens extras. Incluir no pedido?</p>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {promosNaoAdicionadas.map(promo => (
                          <button type="button" key={promo.id} onClick={() => adicionarPromocaoAoPedido(pedido.fornecedorNome, promo)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: 'white', border: '1px solid #22c55e', color: '#16a34a', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
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
              <button type="button" onClick={() => setShowModal(false)} style={styles.btnVoltar} disabled={salvandoPedidos}>Cancelar</button>
              <button type="button" onClick={salvarPedidosNoBanco} style={{ ...styles.btnVoltar, backgroundColor: '#16a34a' }} disabled={salvandoPedidos}>
                {salvandoPedidos ? 'Salvando...' : 'Salvar Pedidos no Sistema'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}