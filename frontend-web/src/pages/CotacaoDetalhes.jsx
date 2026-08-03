import React, { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import UploadModal from '../components/layout/UploadModal'
import EnviarLinkModal from '../components/EnviarLinkModal'
import { MessageCircle, FileText, ShoppingCart, BarChart2, Trash2, Save, X, List, Tag, Plus, ClipboardCheck, Search, ArrowUpDown, ChevronUp, ChevronDown, RefreshCcw, Copy, Check, ArrowRightLeft, Settings2, Eye, Loader2, ArrowDown, Users } from 'lucide-react'

export default function CotacaoDetalhes() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [statusCotacao, setStatusCotacao] = useState('ABERTA') 
  const [relatorio, setRelatorio] = useState([])
  const [fornecedores, setFornecedores] = useState([])
  const [promocoes, setPromocoes] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [modoVisualizacao, setModoVisualizacao] = useState('itens') 
  const [subAbaItens, setSubAbaItens] = useState('pendentes') 

  const [decisaoCompra, setDecisaoCompra] = useState({})
  const [aceitesTroca, setAceitesTroca] = useState({})

  const [showModal, setShowModal] = useState(false)
  const [pedidosGerados, setPedidosGerados] = useState([])
  const [salvandoPedidos, setSalvandoPedidos] = useState(false)
  const [acaoPosPedido, setAcaoPosPedido] = useState('ABERTA') 

  const [confirmManualModal, setConfirmManualModal] = useState(false)
  const [mensagemConfirmacaoManual, setMensagemConfirmacaoManual] = useState('')
  const [payloadManualData, setPayloadManualData] = useState(null)

  const [editandoItem, setEditandoItem] = useState(null)
  const [formEdicao, setFormEdicao] = useState({ nome: '', qtd: 1 })

  const [mostrarNomeReal, setMostrarNomeReal] = useState(false)
  const [dicionarioDiversos, setDicionarioDiversos] = useState({})

  const [fornecedoresLista, setFornecedoresLista] = useState([])
  const [checklist, setChecklist] = useState({})

  const [itensJaComprados, setItensJaComprados] = useState({}) 

  const [termoBusca, setTermoBusca] = useState('')
  const [filtroOrigem, setFiltroOrigem] = useState('TODOS')
  const [filtroPropostas, setFiltroPropostas] = useState('TODOS')
  const [sortConfig, setSortConfig] = useState({ key: 'nomeProduto', direction: 'asc' })

  const [copiadoId, setCopiadoId] = useState(null)
  const [avisosDuplicidade, setAvisosDuplicidade] = useState({})

  const [isProcessandoPedidos, setIsProcessandoPedidos] = useState(false)

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
  
  const [fornecedoresVisiveis, setFornecedoresVisiveis] = useState({})

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false)
  const [isEnviarModalOpen, setIsEnviarModalOpen] = useState(false)
  
  const [novoItemManual, setNovoItemManual] = useState({ nomeProduto: '', quantidade: 1, origemItem: 'Extra Manual' })
  const [salvandoItemManual, setSalvandoItemManual] = useState(false)

  const [vinculos, setVinculos] = useState([])
  const [showVinculosModal, setShowVinculosModal] = useState(false)

  const isEncerrada = statusCotacao === 'FINALIZADA'

  useEffect(() => {
    if (isEncerrada && modoVisualizacao === 'manual') {
      setModoVisualizacao('itens');
    }
  }, [isEncerrada, modoVisualizacao]);

  useEffect(() => {
    carregarCotacao()
    carregarRelatorio()
    carregarDicionarioDiversos() 
    carregarFornecedores()
    carregarPedidosDaCotacao()
    carregarVinculos()
  }, [id])

  useEffect(() => {
    setFornecedoresVisiveis(prev => {
        const novoEstado = { ...prev };
        let changed = false;
        fornecedores.forEach(f => {
            if (novoEstado[f] === undefined) {
                novoEstado[f] = true;
                changed = true;
            }
        });
        return changed ? novoEstado : prev; 
    });
  }, [fornecedores]);

  const carregarCotacao = async () => {
      try {
          const res = await api.get(`/api/cotacao/${id}`);
          if(res.data) setStatusCotacao(res.data.status || 'ABERTA');
      } catch (error) {
          console.error("Erro ao carregar status da cotação", error);
      }
  };

  const carregarVinculos = async () => {
    try {
        const res = await api.get(`/api/cotacao-fornecedor/cotacao/${id}`);
        setVinculos(res.data || []);
    } catch (error) {
        console.error("Erro ao carregar vínculos", error);
    }
  }

  const removerVinculo = async (idVinculo) => {
    if (window.confirm("Remover o acesso deste fornecedor a esta cotação? Ele não poderá mais visualizar ou responder.")) {
        try {
            await api.delete(`/api/cotacao-fornecedor/${idVinculo}`);
            carregarVinculos();
        } catch (error) {
            alert("Erro ao remover vínculo.");
        }
    }
  };

  const carregarPedidosDaCotacao = async () => {
    try {
      const response = await api.get(`/api/pedidos/cotacao/${id}`)
      const pedidos = Array.isArray(response.data) ? response.data : [];
      const mapComprados = {}
      pedidos.forEach(p => {
        if(p.status === 'CANCELADO') return; 
        (p.itens || []).forEach(item => {
          const idItemCotacao = item.itemCotacao?.id || item.itemCotacaoId;
          if (idItemCotacao) {
            mapComprados[idItemCotacao] = {
                id: p.id,
                fornecedor: p.fornecedor?.nome || p.fornecedorNome || 'Pedido Manual',
                preco: item.valorUnitarioPedido,
                quantidade: item.quantidadePedida
            };
          }
        })
      })
      setItensJaComprados(mapComprados)
    } catch (error) {
      console.error("Erro ao carregar pedidos da cotação", error)
    }
  }

  const carregarFornecedores = async () => {
    try {
      const response = await api.get('/api/fornecedor')
      setFornecedoresLista(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error("Erro ao carregar lista de fornecedores gerais", error)
    }
  }

  useEffect(() => {
    if (relatorio.length > 0) {
      setChecklist(prevChecklist => {
        const newChecklist = { ...prevChecklist };
        let changed = false;

        relatorio.forEach(item => {
          const dadosComprado = itensJaComprados[item.idItem];
          const isBloqueado = !!dadosComprado;
          const qtdRelatorio = item.quantidade || 1;

          if (!newChecklist[item.idItem]) {
            newChecklist[item.idItem] = {
              comprado: isBloqueado,
              qtd: qtdRelatorio,
              preco: item.ultimoPreco || 0,
              bloqueado: isBloqueado,
              falta: false,
              fornecedor: isBloqueado ? dadosComprado.fornecedor : ''
            };
            changed = true;
          } else {
            if (isBloqueado && !newChecklist[item.idItem].bloqueado) {
              newChecklist[item.idItem].comprado = true;
              newChecklist[item.idItem].falta = false;
              newChecklist[item.idItem].bloqueado = true;
              newChecklist[item.idItem].fornecedor = dadosComprado.fornecedor;
              changed = true;
            }
            if (!newChecklist[item.idItem].comprado && newChecklist[item.idItem].qtd !== qtdRelatorio) {
              newChecklist[item.idItem].qtd = qtdRelatorio;
              changed = true;
            }
          }
        });
        return changed ? newChecklist : prevChecklist;
      });
    }
  }, [relatorio, itensJaComprados])

  const carregarDicionarioDiversos = async () => {
    try {
      const response = await api.get('/api/diversos')
      const mapDiversos = {}
      ;(Array.isArray(response.data) ? response.data : []).forEach(item => {
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
    setLoading(true)
    try {
      const response = await api.get(`/api/comparativo/relatorio/${id}`)
      const data = Array.isArray(response.data) ? response.data : [];
      setRelatorio(data)

      const nomes = new Set()
      const decisaoInicial = {}

      data.forEach((item) => {
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
        setPromocoes(Array.isArray(resPromos.data) ? resPromos.data : []);
      } catch (err) {
        console.warn('Sem promoções extras.');
      }
    } catch (error) {
      console.error("Erro ao carregar detalhes", error);
    } finally {
      setLoading(false)
    }
  }

  const alterarStatusCotacao = async (novoStatus) => {
    const acao = novoStatus === 'FINALIZADA' ? 'encerrar' : 'reabrir';
    if(window.confirm(`Deseja realmente ${acao} esta cotação?`)) {
        try {
            await api.put(`/api/cotacao/${id}/status`, { status: novoStatus });
            setStatusCotacao(novoStatus);
            
            if (novoStatus === 'FINALIZADA') {
                const itensRuptura = relatorio.filter(item => {
                    const semProposta = !item.fornecedorVencedor || item.fornecedorVencedor === 'Sem ofertas';
                    const compradoManual = itensJaComprados[item.idItem];
                    const chk = checklist[item.idItem];
                    const marcadoFalta = chk && chk.falta;
                    return (semProposta && !compradoManual) || marcadoFalta;
                });
                console.log("Itens mapeados como Ruptura/Falta prontos para o futuro relatório:", itensRuptura);
            }
            
            alert(`Cotação ${acao} com sucesso!`);
        } catch (error) {
            alert(`Erro ao ${acao} a cotação.`);
        }
    }
  };

  const handleSalvarItemManual = async () => {
    if (!novoItemManual.nomeProduto) return alert('O nome do produto é obrigatório.');
    setSalvandoItemManual(true);
    try {
      await api.post(`/api/cotacao/${id}/item`, {
        nomeProduto: novoItemManual.nomeProduto,
        quantidade: novoItemManual.quantidade,
        origemItem: novoItemManual.origemItem
      });
      alert('Produto adicionado com sucesso!');
      setIsAddItemModalOpen(false);
      
      setNovoItemManual({ nomeProduto: '', quantidade: 1, origemItem: 'Extra Manual' });
      carregarRelatorio();
    } catch (error) {
      alert('Erro ao adicionar produto.');
    } finally {
      setSalvandoItemManual(false);
    }
  };

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
      const isComprado = !!itensJaComprados[item.idItem];
      
      if (modoVisualizacao === 'itens' || modoVisualizacao === 'comparativo') {
          if (subAbaItens === 'pendentes' && isComprado) return false;
          if (subAbaItens === 'comprados' && !isComprado) return false;
      }

      const matchBusca = getNomeExibicao(item.nomeProduto).toLowerCase().includes(termoBusca.toLowerCase());
      
      const origemSegura = String(item.origemItem || 'Geral').toUpperCase();
      const filtroOrigemUpper = filtroOrigem.toUpperCase();
      const matchOrigem = filtroOrigem === 'TODOS' || origemSegura.includes(filtroOrigemUpper);
      
      const precos = Object.values(item.precosPorFornecedor || {});
      const temPropostaValida = precos.some(p => p > 0);
      const matchPropostas = 
        filtroPropostas === 'TODOS' || 
        (filtroPropostas === 'COM_PROPOSTAS' && temPropostaValida) || 
        (filtroPropostas === 'SEM_PROPOSTAS' && !temPropostaValida);

      return matchBusca && matchOrigem && matchPropostas;
    });
  }, [relatorioOrdenado, termoBusca, filtroOrigem, filtroPropostas, itensJaComprados, modoVisualizacao, subAbaItens]);

  const SortIcon = ({ sortKey }) => {
    if (sortConfig.key !== sortKey) return <ArrowUpDown size={14} color="#9ca3af" style={{ marginLeft: '6px' }} />;
    return sortConfig.direction === 'asc' 
      ? <ChevronUp size={14} color="#2563eb" style={{ marginLeft: '6px' }} />
      : <ChevronDown size={14} color="#2563eb" style={{ marginLeft: '6px' }} />;
  };

  const handleSetWinner = (idItem, fornecedorNome) => {
    if (isEncerrada) return;
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
    if (isEncerrada) return;
    const isAtivando = !aceitesTroca[idItem];
    setAceitesTroca(prev => ({ ...prev, [idItem]: isAtivando }));

    if (isAtivando) {
      setDecisaoCompra(prev => ({ ...prev, [idItem]: fornecedorNome }));
    } else {
      const itemRelatorio = relatorio.find(r => r.idItem === idItem);
      if (itemRelatorio) {
        const precoOriginal = itemRelatorio.precosPorFornecedor?.[fornecedorNome] || 0;
        
        if (!precoOriginal || precoOriginal <= 0) {
          let menorPreco = Infinity;
          let vencedorOriginal = 'Sem ofertas';
          
          Object.entries(itemRelatorio.precosPorFornecedor || {}).forEach(([forn, p]) => {
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

  const iniciarEdicao = (item, campo) => {
    const isBloqueado = !!itensJaComprados[item.idItem];
    if (isBloqueado || isEncerrada) return;
    setEditandoItem(`${item.idItem}-${campo}`);
    setFormEdicao({ nome: item.nomeProduto, qtd: item.quantidade });
  }

  const salvarEdicao = async (idItem) => {
    const itemOriginal = relatorio.find(i => i.idItem === idItem);
    
    if (itemOriginal && itemOriginal.nomeProduto === formEdicao.nome && itemOriginal.quantidade === formEdicao.qtd) {
       setEditandoItem(null);
       return;
    }

    try {
      const payloadNome = formEdicao.nome;
      const payloadQtd = Number(formEdicao.qtd);
      setEditandoItem(null);

      await api.put(`/api/cotacao/item/${idItem}`, { nomeProduto: payloadNome, quantidade: payloadQtd })
      
      setRelatorio(prev => prev.map(item => 
        item.idItem === idItem 
          ? { ...item, nomeProduto: payloadNome, quantidade: payloadQtd } 
          : item
      ))
    } catch (error) {
      alert('Erro ao atualizar produto.');
      carregarRelatorio(); 
    }
  }

  const deletarItem = async (idItem) => {
    if (window.confirm('Tem certeza que deseja remover este produto da cotação?')) {
      try {
        await api.delete(`/api/cotacao/item/${idItem}`)
        setRelatorio(prev => prev.filter(item => item.idItem !== idItem));
      } catch (error) {
        alert('Erro ao remover produto.')
      }
    }
  }

  const reatribuirItem = (idItem) => {
    if (isEncerrada) return;
    if (window.confirm("Deseja reatribuir este item para comprar novamente? (O pedido existente NÃO será apagado do sistema)")) {
      setItensJaComprados(prev => {
          const newMap = { ...prev };
          delete newMap[idItem];
          return newMap;
      });
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
      const pendentes = (Array.isArray(response.data) ? response.data : []).filter(p => p.status === 'PENDENTE_ENTREGA' && (p.cotacao?.id !== Number(id) && p.cotacaoId !== Number(id)));

      const mapa = {};
      pendentes.forEach(p => {
        const cId = p.cotacao?.id || p.cotacaoId || '?';
        (p.itens || []).forEach(i => {
          if (!i.nomeProduto) return;
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
    setIsProcessandoPedidos(true)
    
    setTimeout(async () => {
      const pedidosPorFornecedor = {}

      relatorioOrdenado.forEach(itemRelatorio => {
        const idItem = itemRelatorio.idItem;
        if (itensJaComprados[idItem]) return; 

        const fornecedorNome = decisaoCompra[idItem];
        if (!fornecedorNome || fornecedorNome === 'Sem ofertas') return;

        if (!pedidosPorFornecedor[fornecedorNome]) {
          pedidosPorFornecedor[fornecedorNome] = { fornecedorNome: fornecedorNome, itens: [], total: 0 }
        }

        const isTrocaAceita = aceitesTroca[idItem];
        const nomeSubstituto = itemRelatorio.substitutosPorFornecedor?.[fornecedorNome];

        let preco = itemRelatorio.precosPorFornecedor?.[fornecedorNome] || 0;
        let qtd = itemRelatorio.quantidade || 0;
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
        setIsProcessandoPedidos(false)
        return
      }

      const mapaDuplicatas = await mapearDuplicatas();
      setAvisosDuplicidade(mapaDuplicatas);

      setPedidosGerados(pedidosArray)
      setShowModal(true)
      setIsProcessandoPedidos(false)
    }, 100);
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

  const copiarFornecedorParaBaixo = (fornecedorNome, currentIndex) => {
    if (!fornecedorNome) return;
    setChecklist(prev => {
        const newState = { ...prev };
        relatorioExibicao.forEach((item, idx) => {
            if (idx > currentIndex) {
                const atual = newState[item.idItem] || { comprado: false, qtd: item.quantidade || 1, preco: item.ultimoPreco || 0, bloqueado: false, falta: false, fornecedor: '' };
                if (!atual.bloqueado) { 
                    newState[item.idItem] = { ...atual, fornecedor: fornecedorNome };
                }
            }
        });
        return newState;
    });
  };

  const handlePrepararRegistroManual = async () => {
    const itensComprados = [];
    let erroFornecedorFaltando = false;

    relatorioOrdenado.forEach(itemRelatorio => {
      const idItem = itemRelatorio.idItem;
      const chk = checklist[idItem];
      
      if (chk && chk.comprado && !chk.bloqueado && chk.qtd > 0) {
        if (!chk.fornecedor) {
          erroFornecedorFaltando = true;
        }
        itensComprados.push({
          itemCotacaoId: idItem,
          quantidadePedida: chk.qtd,
          valorUnitarioPedido: chk.preco,
          nomeProduto: getNomeRealSempre(itemRelatorio.nomeProduto),
          fornecedorNome: chk.fornecedor
        });
      }
    });

    if (itensComprados.length === 0) {
      alert('Marque pelo menos um produto como "Comprar" e selecione o Fornecedor na tabela para gerar o registro.');
      return;
    }

    if (erroFornecedorFaltando) {
      alert('Atenção: Você marcou itens para compra, mas esqueceu de selecionar o Fornecedor em um ou mais deles na tabela.');
      return;
    }

    setIsProcessandoPedidos(true);

    try {
      const pedidosAgrupados = {};
      itensComprados.forEach(item => {
          if (!pedidosAgrupados[item.fornecedorNome]) {
              pedidosAgrupados[item.fornecedorNome] = [];
          }
          pedidosAgrupados[item.fornecedorNome].push(item);
      });

      const payload = Object.keys(pedidosAgrupados).map(forn => ({
          cotacaoId: Number(id),
          fornecedorNome: forn,
          itens: pedidosAgrupados[forn]
      }));

      const mapaDuplicatas = await mapearDuplicatas();
      const itensDuplicados = itensComprados.filter(i => mapaDuplicatas[getNomeRealSempre(i.nomeProduto).toUpperCase().trim()]);

      let mensagemConfirmacao = `Confirma o registro de pedidos manuais para ${Object.keys(pedidosAgrupados).length} fornecedor(es)?\n\n`;
      Object.keys(pedidosAgrupados).forEach(f => {
          mensagemConfirmacao += `- ${f}: ${pedidosAgrupados[f].length} item(ns)\n`;
      });

      if (itensDuplicados.length > 0) {
        mensagemConfirmacao += `\n⚠️ AVISO DE DUPLICIDADE ⚠️\nOs seguintes itens já possuem pedidos pendentes em outras cotações:\n`;
        itensDuplicados.forEach(i => {
          const cots = Array.from(mapaDuplicatas[getNomeRealSempre(i.nomeProduto).toUpperCase().trim()]).join(', ');
          mensagemConfirmacao += `- ${i.nomeProduto} (Cotações: ${cots})\n`;
        });
        mensagemConfirmacao += `\nDeseja gerar os pedidos mesmo assim?`;
      }

      setMensagemConfirmacaoManual(mensagemConfirmacao);
      setPayloadManualData(payload);
      setConfirmManualModal(true);
    } finally {
      setIsProcessandoPedidos(false);
    }
  }

  const processarRegistroManual = async () => {
      setSalvandoPedidos(true);
      try {
          await api.post('/api/pedidos/registro-manual', payloadManualData);
          
          if (acaoPosPedido === 'ENCERRADA') {
              await api.put(`/api/cotacao/${id}/status`, { status: 'FINALIZADA' });
              setStatusCotacao('FINALIZADA');
          }

          alert('Pedidos manuais registrados com sucesso!');
          setConfirmManualModal(false);
          carregarPedidosDaCotacao();
          
          if (acaoPosPedido === 'ENCERRADA') navigate('/cotacoes');
      } catch (error) {
          alert('Erro ao registrar pedido manual: ' + (error.response?.data?.message || error.message));
      } finally {
          setSalvandoPedidos(false);
      }
  };

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
      
      if (acaoPosPedido === 'ENCERRADA') {
          await api.put(`/api/cotacao/${id}/status`, { status: 'FINALIZADA' });
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
      if (!relatorioOrdenado || relatorioOrdenado.length === 0) {
        alert('Essa cotação ainda não tem itens processados.')
        return
      }

      const itensAgrupados = {};
      let totalGeral = 0;

      relatorioOrdenado.forEach(item => {
        const comprado = itensJaComprados[item.idItem];
        const vencedor = comprado ? comprado.fornecedor : (item.fornecedorVencedor || 'Sem Oferta');
        const preco = comprado ? comprado.preco : (item.menorPrecoEncontrado || 0);
        const qtd = comprado ? comprado.quantidade : (item.quantidade || 0);
        const total = preco * qtd;
        const nomeCorreto = getNomeRealSempre(item.nomeProduto);

        if (!itensAgrupados[vencedor]) {
          itensAgrupados[vencedor] = { itens: [], totalFornecedor: 0 };
        }

        itensAgrupados[vencedor].itens.push([
          nomeCorreto,
          qtd,
          preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
          total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        ]);
        itensAgrupados[vencedor].totalFornecedor += total;
        totalGeral += total;
      });

      const doc = new jsPDF()
      doc.setFontSize(18)
      doc.text(`Relatório de Fechamento - Cotação #${id}`, 14, 20)
      doc.setFontSize(12)
      doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, 14, 30)

      let currentY = 40;

      Object.keys(itensAgrupados).sort().forEach(fornecedor => {
         const data = itensAgrupados[fornecedor];

         doc.setFontSize(14);
         doc.setTextColor(22, 163, 74);
         doc.text(`Fornecedor: ${fornecedor}`, 14, currentY);
         currentY += 5;

         autoTable(doc, {
            startY: currentY,
            head: [['Produto', 'Qtd', 'Unitário', 'Total']],
            body: data.itens,
            foot: [
              ['', '', 'TOTAL FORNECEDOR', data.totalFornecedor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })]
            ],
            theme: 'striped',
            headStyles: { fillColor: [71, 85, 105] }, 
            footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42] },
            margin: { bottom: 20 }
         });

         currentY = doc.lastAutoTable.finalY + 15;
      });

      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(`TOTAL GERAL DA COTAÇÃO: ${totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 14, currentY);

      doc.save(`Relatorio_Fechamento_Cotacao_${id}.pdf`)
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      alert('Erro ao gerar o relatório.')
    }
  }

  const fMoney = (v) => v != null && v > 0 ? Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'
  const fData = (data) => data ? data : '-'; 

  const getCorOrigem = (origem) => {
    if (!origem) return { bg: '#f3f4f6', color: '#4b5563', border: '#d1d5db', label: 'Geral' };
    
    const orig = String(origem).toUpperCase();
    
    if (orig.includes('EXTRA MANUAL')) return { bg: '#fce7f3', color: '#be185d', border: '#fbcfe8', label: '➕ Inserido Manualmente' };
    if (orig.includes('NOVA IMPORTAÇÃO') || orig.includes('ATUALIZAÇÃO')) return { bg: '#f3e8ff', color: '#7e22ce', border: '#e9d5ff', label: '🔄 Atualização DNA' };
    if (orig.includes('SUGESTÃO') && orig.includes('FALTA')) return { bg: '#ffedd5', color: '#c2410c', border: '#fdba74', label: origem };
    if (orig.includes('SUGESTÃO')) return { bg: '#e0e7ff', color: '#1d4ed8', border: '#93c5fd', label: origem };
    if (orig.includes('FALTA')) return { bg: '#ffedd5', color: '#c2410c', border: '#fdba74', label: origem };
    
    return { bg: '#f3f4f6', color: '#4b5563', border: '#d1d5db', label: origem }; 
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
            <h3 style={{ margin: 0, fontSize: '18px', color: '#111827' }}>Registro de Pedidos Manuais</h3>
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>Marque os itens, ajuste os preços e vincule o fornecedor para gerar o pedido espelho.</p>
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
                <th style={{ ...styles.th, cursor: 'pointer', minWidth: '200px' }} onClick={() => requestSort('nomeProduto')}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>Produto <SortIcon sortKey="nomeProduto" /></div>
                </th>
                
                <th style={{ ...styles.th, textAlign: 'center', width: '200px', minWidth: '180px' }}>
                  Fornecedor
                </th>

                <th style={{ ...styles.th, textAlign: 'center', width: '90px', minWidth: '90px', cursor: 'pointer' }} onClick={() => requestSort('quantidade')}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Qtd <SortIcon sortKey="quantidade" /></div>
                </th>
                <th style={{ ...styles.th, textAlign: 'right', width: '110px', minWidth: '110px' }}>Custo Final (R$)</th>
                <th style={{ ...styles.th, textAlign: 'right', width: '110px', minWidth: '110px' }}>Subtotal</th>
                <th style={{ ...styles.th, textAlign: 'center', width: '120px', minWidth: '120px', backgroundColor: '#f0fdf4', color: '#166534' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {relatorioExibicao.map((item, index) => {
                const chk = checklist[item.idItem] || { comprado: false, qtd: 1, preco: 0, bloqueado: false, falta: false, fornecedor: '' };
                const cores = getCorOrigem(item.origemItem);
                
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
                        backgroundColor: cores.bg, color: cores.color, border: `1px solid ${cores.border}`, whiteSpace: 'nowrap' 
                      }}>
                        {cores.label}
                      </span>
                    </td>

                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ ...textStyle, fontSize: '13px' }}>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <select 
                          value={chk.fornecedor || ''}
                          onChange={(e) => setChecklist({ ...checklist, [item.idItem]: { ...chk, fornecedor: e.target.value } })}
                          disabled={!chk.comprado || chk.bloqueado || isEncerrada}
                          style={{ ...styles.inputEdicao, width: '100%', fontSize: '12px', padding: '6px' }}
                        >
                          <option value="">-- Selecionar --</option>
                          {fornecedoresLista.map(f => (
                            <option key={f.id} value={f.nome}>{f.nome}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => copiarFornecedorParaBaixo(chk.fornecedor, index)}
                          disabled={!chk.fornecedor || !chk.comprado || chk.bloqueado || isEncerrada}
                          title="Copiar fornecedor para os itens abaixo"
                          style={{
                            background: (!chk.fornecedor || !chk.comprado || chk.bloqueado || isEncerrada) ? '#f3f4f6' : '#e0e7ff',
                            color: (!chk.fornecedor || !chk.comprado || chk.bloqueado || isEncerrada) ? '#9ca3af' : '#4f46e5',
                            border: '1px solid',
                            borderColor: (!chk.fornecedor || !chk.comprado || chk.bloqueado || isEncerrada) ? '#d1d5db' : '#c7d2fe',
                            borderRadius: '4px',
                            padding: '4px',
                            cursor: (!chk.fornecedor || !chk.comprado || chk.bloqueado || isEncerrada) ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <ArrowDown size={14} />
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
                        style={{ ...styles.inputEdicao, width: '60px', textAlign: 'center', fontWeight: 'bold' }}
                        disabled={!chk.comprado || chk.bloqueado || isEncerrada}
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
                        style={{ ...styles.inputEdicao, width: '80px', textAlign: 'right', fontWeight: 'bold' }}
                        disabled={!chk.comprado || chk.bloqueado || isEncerrada}
                      />
                    </td>

                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: 'bold', color: (chk.comprado && !chk.bloqueado) ? '#166534' : '#6b7280' }}>
                      {fMoney(chk.qtd * chk.preco)}
                    </td>

                    <td style={{ ...styles.td, textAlign: 'center', backgroundColor: chk.bloqueado ? '#e5e7eb' : chk.comprado ? '#dcfce7' : 'transparent', borderLeft: '1px dashed #d1d5db' }}>
                      {chk.bloqueado ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#4b5563' }}>
                            Já Pedido
                          </span>
                          {!isEncerrada && (
                              <button 
                                type="button"
                                onClick={() => reatribuirItem(item.idItem)} 
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}
                              >
                                <RefreshCcw size={10} /> Reatribuir
                              </button>
                          )}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: isEncerrada ? 'not-allowed' : 'pointer' }}>
                            <input 
                              type="checkbox" 
                              checked={chk.comprado}
                              onChange={(e) => setChecklist({ ...checklist, [item.idItem]: { ...chk, comprado: e.target.checked, falta: false } })}
                              disabled={isEncerrada || chk.falta}
                            />
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: chk.comprado ? '#166534' : '#6b7280' }}>
                              Comprar
                            </span>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: isEncerrada ? 'not-allowed' : 'pointer' }}>
                            <input 
                              type="checkbox" 
                              checked={chk.falta}
                              onChange={(e) => setChecklist({ ...checklist, [item.idItem]: { ...chk, falta: e.target.checked, comprado: false } })}
                              disabled={isEncerrada || chk.comprado}
                            />
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: chk.falta ? '#dc2626' : '#6b7280' }}>
                              Ruptura / Falta
                            </span>
                          </label>
                        </div>
                      )}
                    </td>

                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button 
            type="button" 
            onClick={handlePrepararRegistroManual} 
            disabled={isProcessandoPedidos || isEncerrada} 
            style={{ ...styles.btnVoltar, backgroundColor: isEncerrada ? '#9ca3af' : '#10b981', fontSize: '15px', padding: '12px 24px', boxShadow: isEncerrada ? 'none' : '0 4px 6px -1px rgba(16, 185, 129, 0.4)' }}
          >
            {isProcessandoPedidos ? <Loader2 size={18} className="animate-spin" style={{ marginRight: '8px' }} /> : <Save size={18} style={{ marginRight: '8px' }} />}
            Finalizar Registro e Gerar Pedidos
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

                {isComparativo && fornecedores.filter(f => fornecedoresVisiveis[f] ?? true).map((f) => (
                  <th key={f} style={{ ...styles.th, backgroundColor: '#f9fafb', textAlign: 'center', borderLeft: '1px solid #e5e7eb', minWidth: '180px' }}>
                    {f}
                  </th>
                ))}
                {isItens && <th style={{ ...styles.th, textAlign: 'center', minWidth: '100px' }}>Ações</th>}
              </tr>
            </thead>
            <tbody>
              {relatorioExibicao.map((item) => {
                const cores = getCorOrigem(item.origemItem);
                const isBloqueado = !!itensJaComprados[item.idItem];
                const textStyle = isBloqueado ? { textDecoration: 'line-through', color: '#9ca3af' } : {};

                return (
                <tr key={item.idItem} style={{ backgroundColor: '#ffffff' }}>
                  <td style={{ ...styles.td, position: 'sticky', left: 0, zIndex: 10, backgroundColor: 'inherit', boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }}>
                    {editandoItem === `${item.idItem}-nome` ? (
                      <input 
                        style={{ ...styles.inputEdicao, width: '100%', minWidth: '200px' }} 
                        value={formEdicao.nome} 
                        onChange={(e) => setFormEdicao({ ...formEdicao, nome: e.target.value })} 
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') salvarEdicao(item.idItem);
                          if (e.key === 'Escape') setEditandoItem(null);
                        }}
                        onBlur={() => salvarEdicao(item.idItem)}
                        autoFocus
                      />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong 
                            style={{ ...textStyle, cursor: (!isBloqueado && !isEncerrada) ? 'pointer' : 'default', borderBottom: (!isBloqueado && !isEncerrada) ? '1px dashed #9ca3af' : 'none' }}
                            onClick={() => iniciarEdicao(item, 'nome')}
                            title={(!isBloqueado && !isEncerrada) ? "Clique para editar o nome" : ""}
                          >
                            {getNomeExibicao(item.nomeProduto)}
                          </strong>
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
                            fontWeight: 'bold',
                            whiteSpace: 'nowrap'
                          }}>
                            {cores.label}
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
                              {!isEncerrada && (
                                  <button 
                                    type="button"
                                    onClick={() => reatribuirItem(item.idItem)} 
                                    title="Permitir comprar este item novamente"
                                    style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}
                                  >
                                    <RefreshCcw size={10} /> Reatribuir
                                  </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </td>
                  
                  {colunasVisiveis.quantidade && (
                    <td style={styles.td}>
                      {editandoItem === `${item.idItem}-qtd` ? (
                        <input 
                          type="number" 
                          style={{ ...styles.inputEdicao, width: '70px', textAlign: 'center' }} 
                          value={formEdicao.qtd} 
                          onChange={(e) => setFormEdicao({ ...formEdicao, qtd: Number(e.target.value) })} 
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') salvarEdicao(item.idItem);
                            if (e.key === 'Escape') setEditandoItem(null);
                          }}
                          onBlur={() => salvarEdicao(item.idItem)}
                          onFocus={(e) => e.target.select()}
                          autoFocus
                        />
                      ) : (
                        <span 
                          style={{ ...textStyle, cursor: (!isBloqueado && !isEncerrada) ? 'pointer' : 'default', borderBottom: (!isBloqueado && !isEncerrada) ? '1px dashed #9ca3af' : 'none', display: 'inline-block', padding: '4px' }}
                          onClick={() => iniciarEdicao(item, 'qtd')}
                          title={(!isBloqueado && !isEncerrada) ? "Clique para editar a quantidade" : ""}
                        >
                          {item.quantidade} un
                        </span>
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

                  {isComparativo && fornecedores.filter(f => fornecedoresVisiveis[f] ?? true).map((f) => {
                    const precoOriginal = item.precosPorFornecedor?.[f] || 0
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
                          cursor: isBloqueado || isEncerrada ? 'not-allowed' : 'pointer',
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
                            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', cursor: isBloqueado || isEncerrada ? 'not-allowed' : 'pointer', fontSize: '11px', color: '#111827' }}>
                              <input 
                                type="checkbox" 
                                checked={isTrocaAceita && isWinner} 
                                onChange={() => !isBloqueado && toggleTroca(item.idItem, f)} 
                                style={{ marginTop: '2px' }}
                                disabled={isBloqueado || isEncerrada}
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
                      {subAbaItens === 'comprados' ? (
                          <button 
                            onClick={() => navigate(`/pedidos/${itensJaComprados[item.idItem].id}`)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', backgroundColor: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                          >
                            <Eye size={14}/> Pedido #{itensJaComprados[item.idItem].id}
                          </button>
                      ) : (
                          <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                            <button type="button" onClick={() => deletarItem(item.idItem)} style={{ ...styles.btnIcon, color: '#ef4444' }} disabled={isBloqueado || isEncerrada} title="Remover Produto">
                              <Trash2 size={18} opacity={isBloqueado || isEncerrada ? 0.3 : 1}/>
                            </button>
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
    menuColunas: { position: 'absolute', top: '110%', right: 0, backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px', zIndex: 50, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>
          Cotação #{id}
          {isEncerrada && <span style={{ marginLeft: '12px', fontSize: '14px', backgroundColor: '#fee2e2', color: '#dc2626', padding: '4px 10px', borderRadius: '20px', verticalAlign: 'middle', fontWeight: 'bold' }}>ENCERRADA (Histórico)</span>}
        </h1>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          
          {!isEncerrada && (
            <>
              <button type="button" style={{ ...styles.btnVoltar, backgroundColor: '#8b5cf6' }} onClick={() => setIsAddItemModalOpen(true)}>
                <Plus size={18} /> Adicionar Produto Extra
              </button>
              
              <button type="button" style={{ ...styles.btnVoltar, backgroundColor: '#3b82f6' }} onClick={() => setIsUploadModalOpen(true)}>
                <RefreshCcw size={18} /> Atualizar Importação DNA
              </button>
            </>
          )}

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

          {!isEncerrada && (
            <>
              <button type="button" style={{ ...styles.btnVoltar, backgroundColor: '#64748b' }} onClick={() => setShowVinculosModal(true)}>
                <Users size={18} /> Fornecedores Notificados
              </button>
              <button type="button" style={{ ...styles.btnVoltar, backgroundColor: '#f59e0b' }} onClick={() => setIsEnviarModalOpen(true)}>
                <MessageCircle size={18} /> Enviar / Cobrar 
              </button>
              <button 
                type="button" 
                style={{ ...styles.btnVoltar, backgroundColor: Object.keys(decisaoCompra).length > 0 ? '#16a34a' : '#9ca3af', cursor: Object.keys(decisaoCompra).length > 0 ? 'pointer' : 'not-allowed', display: modoVisualizacao === 'manual' ? 'none' : 'flex' }} 
                onClick={handleGerarPedidos} 
                disabled={Object.keys(decisaoCompra).length === 0 || isProcessandoPedidos}
              >
                {isProcessandoPedidos ? <Loader2 size={18} className="animate-spin" /> : <ShoppingCart size={18} />} 
                {isProcessandoPedidos ? 'Processando...' : 'Gerar Pedidos'}
              </button>
            </>
          )}
          
          <button type="button" style={{ ...styles.btnVoltar, display: modoVisualizacao === 'manual' ? 'none' : 'flex' }} onClick={baixarRelatorioGeral}>
            <FileText size={18} /> Baixar PDF
          </button>

          {isEncerrada ? (
            <button type="button" style={{ ...styles.btnVoltar, backgroundColor: '#f59e0b' }} onClick={() => alterarStatusCotacao('ABERTA')}>
              <RefreshCcw size={18} /> Reabrir Cotação
            </button>
          ) : (
            <button type="button" style={{ ...styles.btnVoltar, backgroundColor: '#dc2626' }} onClick={() => alterarStatusCotacao('FINALIZADA')}>
              <Check size={18} /> Encerrar Cotação
            </button>
          )}
          
          <button type="button" style={styles.btnVoltar} onClick={() => navigate('/cotacoes')}>Voltar ao Painel</button>
        </div>
      </div>

      <div style={styles.toggleContainer}>
        <button type="button" style={styles.toggleBtn(modoVisualizacao === 'itens')} onClick={() => setModoVisualizacao('itens')}><List size={18} /> Detalhes da Cotação</button>
        <button type="button" style={styles.toggleBtn(modoVisualizacao === 'comparativo')} onClick={() => setModoVisualizacao('comparativo')}><BarChart2 size={18} /> Comparativo de Preços</button>
        
        {!isEncerrada && (
          <button type="button" style={styles.toggleBtn(modoVisualizacao === 'manual')} onClick={() => setModoVisualizacao('manual')}>
            <ClipboardCheck size={18} color={modoVisualizacao === 'manual' ? '#10b981' : '#6b7280'} /> Registro Manual (Checklist)
          </button>
        )}
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
        
        {(modoVisualizacao === 'itens' || modoVisualizacao === 'comparativo') && (
            <div style={{ display: 'flex', gap: '10px', backgroundColor: '#f1f5f9', padding: '6px', borderRadius: '8px', width: 'fit-content' }}>
                <button 
                    onClick={() => setSubAbaItens('pendentes')} 
                    style={{ padding: '8px 16px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: subAbaItens === 'pendentes' ? 'white' : 'transparent', color: subAbaItens === 'pendentes' ? (isEncerrada ? '#dc2626' : '#2563eb') : '#64748b', boxShadow: subAbaItens === 'pendentes' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: '0.2s' }}
                >
                    {isEncerrada ? '🚨 Produtos em Falta' : '⏳ Itens Pendentes'}
                </button>
                <button 
                    onClick={() => setSubAbaItens('comprados')} 
                    style={{ padding: '8px 16px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: subAbaItens === 'comprados' ? 'white' : 'transparent', color: subAbaItens === 'comprados' ? '#16a34a' : '#64748b', boxShadow: subAbaItens === 'comprados' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: '0.2s' }}
                >
                    ✅ Já Pedidos / Comprados
                </button>
            </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#4b5563' }}>Origem:</span>
          <select 
            value={filtroOrigem} 
            onChange={e => setFiltroOrigem(e.target.value)}
            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', fontSize: '14px', cursor: 'pointer' }}
          >
            <option value="TODOS">Todas as Origens</option>
            <option value="Extra Manual">Extra Manual</option>
            <option value="Nova Importação">Atualização DNA</option>
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

              <div style={{ borderTop: '1px solid #e5e7eb', margin: '8px 0' }}></div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '4px' }}>Fornecedores</div>
              {fornecedores.map(f => (
                  <label key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#374151' }}>
                    <input 
                      type="checkbox" 
                      checked={fornecedoresVisiveis[f] ?? true} 
                      onChange={(e) => setFornecedoresVisiveis(prev => ({ ...prev, [f]: e.target.checked }))} 
                      style={{ transform: 'scale(1.1)' }} 
                    />
                    {f}
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

      {/* MODAL: FORNECEDORES VINCULADOS */}
      {showVinculosModal && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#1f2937' }}>Fornecedores Notificados</h3>
              <button onClick={() => setShowVinculosModal(false)} style={styles.btnIcon}><X size={20} color="#6b7280" /></button>
            </div>

            {vinculos.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center' }}>Nenhum fornecedor foi notificado ainda.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {vinculos.map(v => (
                  <li key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                    <div>
                      <strong style={{ display: 'block', fontSize: '14px', color: '#374151' }}>{v.fornecedor?.nome}</strong>
                      <span style={{ fontSize: '12px', color: v.status === 'RESPONDIDA' ? '#16a34a' : '#b45309', fontWeight: 'bold' }}>
                        {v.status === 'RESPONDIDA' ? 'Já Respondeu' : 'Aguardando Resposta'}
                      </span>
                    </div>
                    <button 
                      onClick={() => removerVinculo(v.id)}
                      style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}
                      title="Remover acesso deste fornecedor à cotação"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {isAddItemModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
              <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h3 style={{ margin: 0, fontSize: '18px', color: '#1f2937' }}>Adicionar Produto Extra</h3>
                      <button onClick={() => setIsAddItemModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><X size={20} /></button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>Nome do Produto</label>
                          <input type="text" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} value={novoItemManual.nomeProduto} onChange={e => setNovoItemManual({...novoItemManual, nomeProduto: e.target.value})} placeholder="Ex: Neosaldina C/ 30" />
                      </div>
                      
                      <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>Quantidade a cotar</label>
                          <input type="number" min="1" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} value={novoItemManual.quantidade} onChange={e => setNovoItemManual({...novoItemManual, quantidade: Number(e.target.value)})} onFocus={e => e.target.select()}/>
                      </div>

                      <button 
                          onClick={handleSalvarItemManual} 
                          disabled={salvandoItemManual}
                          style={{ width: '100%', padding: '12px', marginTop: '10px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                      >
                          <Save size={18} style={{ marginRight: '8px' }}/> {salvandoItemManual ? 'Adicionando...' : 'Confirmar e Adicionar'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {isUploadModalOpen && (
        <UploadModal 
          cotacaoId={id} 
          onClose={() => setIsUploadModalOpen(false)} 
          onSuccess={carregarRelatorio} 
        />
      )}

      {isEnviarModalOpen && (
        <EnviarLinkModal 
          idCotacao={id} 
          onClose={() => setIsEnviarModalOpen(false)} 
          onStatusUpdate={() => { carregarCotacao(); carregarVinculos(); }}
        />
      )}

      {confirmManualModal && (
        <div style={styles.modalOverlay}>
            <div style={{ ...styles.modalContent, maxWidth: '500px' }}>
                <h3 style={{ marginTop: 0, fontSize: '18px', color: '#1f2937' }}>Confirmação de Pedido Manual</h3>
                <p style={{ whiteSpace: 'pre-wrap', color: '#4b5563', lineHeight: '1.5', fontSize: '14px' }}>{mensagemConfirmacaoManual}</p>
                
                <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#374151' }}>Após gerar o pedido, o que deseja fazer com a cotação?</h4>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
                        <input type="radio" name="acaoPosPedidoManual" value="ABERTA" checked={acaoPosPedido === 'ABERTA'} onChange={() => setAcaoPosPedido('ABERTA')} />
                        <span style={{ fontSize: '14px', color: '#4b5563' }}>Deixar em Aberto (Aguardando outros pedidos)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input type="radio" name="acaoPosPedidoManual" value="ENCERRADA" checked={acaoPosPedido === 'ENCERRADA'} onChange={() => setAcaoPosPedido('ENCERRADA')} />
                        <span style={{ fontSize: '14px', color: '#dc2626', fontWeight: 'bold' }}>Encerrar Cotação (Mover para o Histórico)</span>
                    </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', gap: '10px' }}>
                    <button onClick={() => setConfirmManualModal(false)} style={{ padding: '10px 20px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: 'white', cursor: 'pointer', fontWeight: '500', color: '#374151' }}>Voltar</button>
                    <button onClick={processarRegistroManual} disabled={salvandoPedidos} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '6px', border: 'none', backgroundColor: '#10b981', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
                        {salvandoPedidos ? <><Loader2 size={18} className="animate-spin" /> Processando...</> : 'Confirmar e Gerar Pedido'}
                    </button>
                </div>
            </div>
        </div>
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
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                                <span style={{ fontSize: '11px', color: '#d97706', fontWeight: 'bold' }}>
                                  ⚠️ Já pedido em:
                                </span>
                                {Array.from(duplicatasSet).map((cotId) => (
                                  <button
                                    key={cotId}
                                    type="button"
                                    onClick={() => window.open(`/cotacao/${cotId}`, '_blank')}
                                    title={`Abrir Cotação #${cotId} em uma nova aba`}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '3px 8px',
                                      backgroundColor: '#fef3c7',
                                      color: '#b45309',
                                      border: '1px solid #fde047',
                                      borderRadius: '12px',
                                      fontSize: '11px',
                                      fontWeight: 'bold',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s',
                                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                    }}
                                  >
                                    <Eye size={12} /> Cotação #{cotId}
                                  </button>
                                ))}
                              </div>
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
            
            <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#374151' }}>Após gerar os pedidos, o que deseja fazer com a cotação?</h4>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
                    <input type="radio" name="acaoPosPedidoAutomatico" value="ABERTA" checked={acaoPosPedido === 'ABERTA'} onChange={() => setAcaoPosPedido('ABERTA')} />
                    <span style={{ fontSize: '14px', color: '#4b5563' }}>Deixar em Aberto (Aguardando outros pedidos)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="radio" name="acaoPosPedidoAutomatico" value="ENCERRADA" checked={acaoPosPedido === 'ENCERRADA'} onChange={() => setAcaoPosPedido('ENCERRADA')} />
                    <span style={{ fontSize: '14px', color: '#dc2626', fontWeight: 'bold' }}>Encerrar Cotação (Mover para o Histórico)</span>
                </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', gap: '12px' }}>
              <button type="button" onClick={() => setShowModal(false)} style={styles.btnVoltar} disabled={salvandoPedidos}>Cancelar</button>
              <button type="button" onClick={salvarPedidosNoBanco} style={{ ...styles.btnVoltar, backgroundColor: '#16a34a' }} disabled={salvandoPedidos}>
                {salvandoPedidos ? 'Salvando...' : 'Confirmar e Salvar Pedidos'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  )
}