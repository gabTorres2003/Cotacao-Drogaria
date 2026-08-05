import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

// Hooks e Utils
import { useCotacaoDados } from '../hooks/useCotacaoDados';
import { useCotacaoFiltros } from '../hooks/useCotacaoFiltros';
import { baixarRelatorioGeral } from '../utils/pdfExport';

// Componentes Visuais
import CotacaoHeader from '../components/cotacao/CotacaoHeader';
import CotacaoFiltros from '../components/cotacao/CotacaoFiltros';
import TabelaDetalhes from '../components/cotacao/TabelaDetalhes';
import TabelaRegistroManual from '../components/cotacao/TabelaRegistroManual';
import CardsSugestoes from '../components/cotacao/CardsSugestoes';
import UploadModal from '../components/layout/UploadModal';
import EnviarLinkModal from '../components/EnviarLinkModal';

// Modais
import ModalFornecedoresNotificados from '../components/cotacao/modais/ModalFornecedoresNotificados';
import ModalProdutoExtra from '../components/cotacao/modais/ModalProdutoExtra';
import ModalConfirmacaoManual from '../components/cotacao/modais/ModalConfirmacaoManual';
import ModalResumoPedidos from '../components/cotacao/modais/ModalResumoPedidos';

import { List, BarChart2, ClipboardCheck, Loader2, Save, X } from 'lucide-react';

export default function CotacaoDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    statusCotacao, setStatusCotacao, relatorio, setRelatorio, fornecedores, promocoes, loading, 
    decisaoCompra, setDecisaoCompra, dicionarioDiversos, fornecedoresLista, itensJaComprados, 
    setItensJaComprados, vinculos, carregarRelatorio, carregarCotacao, carregarVinculos, 
    carregarPedidosDaCotacao, removerVinculo
  } = useCotacaoDados(id);

  const [modoVisualizacao, setModoVisualizacao] = useState('itens');
  const [subAbaItens, setSubAbaItens] = useState('todos');

  const {
    termoBusca, setTermoBusca, filtroOrigem, setFiltroOrigem, filtroPropostas, setFiltroPropostas,
    mostrarNomeReal, setMostrarNomeReal, sortConfig, requestSort, colunasVisiveis, setColunasVisiveis,
    fornecedoresVisiveis, setFornecedoresVisiveis, relatorioOrdenado, relatorioExibicao,
    getNomeRealSempre, getNomeExibicao, isDiversos
  } = useCotacaoFiltros(relatorio, itensJaComprados, modoVisualizacao, subAbaItens, dicionarioDiversos, fornecedores);

  const [aceitesTroca, setAceitesTroca] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [pedidosGerados, setPedidosGerados] = useState([]);
  const [salvandoPedidos, setSalvandoPedidos] = useState(false);
  const [acaoPosPedido, setAcaoPosPedido] = useState('ABERTA');
  const [confirmManualModal, setConfirmManualModal] = useState(false);
  const [mensagemConfirmacaoManual, setMensagemConfirmacaoManual] = useState('');
  const [payloadManualData, setPayloadManualData] = useState(null);
  const [editandoItem, setEditandoItem] = useState(null);
  const [formEdicao, setFormEdicao] = useState({ nome: '', qtd: 1 });
  const [checklist, setChecklist] = useState({});
  const [copiadoId, setCopiadoId] = useState(null);
  const [avisosDuplicidade, setAvisosDuplicidade] = useState({});
  const [isProcessandoPedidos, setIsProcessandoPedidos] = useState(false);
  const [showColunasDropdown, setShowColunasDropdown] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isEnviarModalOpen, setIsEnviarModalOpen] = useState(false);
  const [novoItemManual, setNovoItemManual] = useState({ nomeProduto: '', quantidade: 1, origemItem: 'Extra Manual' });
  const [salvandoItemManual, setSalvandoItemManual] = useState(false);
  const [showVinculosModal, setShowVinculosModal] = useState(false);

  const [modalAddPedidoAberto, setModalAddPedidoAberto] = useState(false);
  const [itemAddPedido, setItemAddPedido] = useState(null);
  const [fornecedorTargetToModal, setFornecedorTargetToModal] = useState(null);
  const [pedidosAbertosList, setPedidosAbertosList] = useState([]);
  const [addPedidoForm, setAddPedidoForm] = useState({ pedidoId: '', qtd: '', valor: '' });
  const [loadingAddPedido, setLoadingAddPedido] = useState(false);
  const [itensGanhosFornecedor, setItensGanhosFornecedor] = useState([]);
  const [addPedidoModo, setAddPedidoModo] = useState('UNICO');

  const [filtroVencedor, setFiltroVencedor] = useState('TODOS');
  const [filtroTopN, setFiltroTopN] = useState('TODOS'); 

  const isEncerrada = statusCotacao === 'FINALIZADA';
  const isComparativo = modoVisualizacao === 'comparativo';
  const isItens = modoVisualizacao === 'itens';

  const fMoney = (v) => v != null && v > 0 ? Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-';
  const fData = (data) => data ? data : '-';

  const normalizeStr = str => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : "";

  useEffect(() => {
     const fetchAbertos = async () => {
       try {
         const res = await api.get('/api/pedidos');
         const abertos = Array.isArray(res.data) ? res.data.filter(p => p.status === 'PENDENTE_ENTREGA') : [];
         setPedidosAbertosList(abertos);
       } catch(e) {}
     };
     fetchAbertos();
  }, [showModal, modalAddPedidoAberto]);

  useEffect(() => {
    if (isEncerrada && modoVisualizacao === 'manual') setModoVisualizacao('itens');
  }, [isEncerrada, modoVisualizacao]);

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
              comprado: isBloqueado, qtd: qtdRelatorio, preco: item.ultimoPreco || 0,
              bloqueado: isBloqueado, falta: false, fornecedor: isBloqueado ? dadosComprado.fornecedor : ''
            };
            changed = true;
          } else {
            if (isBloqueado && !newChecklist[item.idItem].bloqueado) {
              newChecklist[item.idItem] = { ...newChecklist[item.idItem], comprado: true, falta: false, bloqueado: true, fornecedor: dadosComprado.fornecedor };
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
  }, [relatorio, itensJaComprados]);

  const relatorioFiltradoFinal = relatorioExibicao.filter(item => {
    if (filtroVencedor !== 'TODOS') {
        return decisaoCompra[item.idItem] === filtroVencedor;
    }
    return true;
  });

  const copiarParaAreaTransferencia = (texto, idItem) => {
    navigator.clipboard.writeText(texto).then(() => {
      setCopiadoId(idItem);
      setTimeout(() => setCopiadoId(null), 2000); 
    }).catch(err => console.error('Falha ao copiar:', err));
  };

  const handleBaixarPDF = () => baixarRelatorioGeral(id, relatorioOrdenado, itensJaComprados, getNomeRealSempre);

  const alterarStatusCotacao = async (novoStatus) => {
    const acao = novoStatus === 'FINALIZADA' ? 'encerrar' : 'reabrir';
    if(window.confirm(`Deseja realmente ${acao} esta cotação?`)) {
      try {
        await api.put(`/api/cotacao/${id}/status`, { status: novoStatus });
        setStatusCotacao(novoStatus);
        alert(`Cotação ${acao} com sucesso!`);
      } catch (error) { alert(`Erro ao ${acao} a cotação.`); }
    }
  };

  const handleSalvarItemManual = async () => {
    if (!novoItemManual.nomeProduto) return alert('O nome do produto é obrigatório.');
    setSalvandoItemManual(true);
    try {
      await api.post(`/api/cotacao/${id}/item`, novoItemManual);
      alert('Produto adicionado com sucesso!');
      setIsAddItemModalOpen(false);
      setNovoItemManual({ nomeProduto: '', quantidade: 1, origemItem: 'Extra Manual' });
      carregarRelatorio();
    } catch (error) { alert('Erro ao adicionar produto.'); } 
    finally { setSalvandoItemManual(false); }
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
            if (p > 0 && p < menorPreco) { menorPreco = p; melhorFornecedor = fNome; }
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
  };

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
            if (p > 0 && p < menorPreco) { menorPreco = p; vencedorOriginal = forn; }
          });
          setDecisaoCompra(prev => ({ ...prev, [idItem]: vencedorOriginal }));
        }
      }
    }
  };

  const iniciarEdicao = (item, campo) => {
    if (!!itensJaComprados[item.idItem] || isEncerrada) return;
    setEditandoItem(`${item.idItem}-${campo}`);
    setFormEdicao({ nome: item.nomeProduto, qtd: item.quantidade });
  };

  const salvarEdicao = async (idItem) => {
    const itemOriginal = relatorio.find(i => i.idItem === idItem);
    if (itemOriginal && itemOriginal.nomeProduto === formEdicao.nome && itemOriginal.quantidade === formEdicao.qtd) {
       setEditandoItem(null); return;
    }
    try {
      setEditandoItem(null);
      await api.put(`/api/cotacao/item/${idItem}`, { nomeProduto: formEdicao.nome, quantidade: Number(formEdicao.qtd) });
      setRelatorio(prev => prev.map(item => item.idItem === idItem ? { ...item, nomeProduto: formEdicao.nome, quantidade: Number(formEdicao.qtd), editadoManual: true } : item));
    } catch (error) { alert('Erro ao atualizar produto.'); carregarRelatorio(); }
  };

  const deletarItem = async (idItem) => {
    if (window.confirm('Tem certeza que deseja remover este produto da cotação?')) {
      try {
        await api.delete(`/api/cotacao/item/${idItem}`);
        setRelatorio(prev => prev.filter(item => item.idItem !== idItem));
      } catch (error) { alert('Erro ao remover produto.'); }
    }
  };

  const reatribuirItem = (idItem) => {
    if (isEncerrada) return;
    if (window.confirm("Deseja reatribuir este item para comprar novamente? (O pedido existente NÃO será apagado do sistema)")) {
      setItensJaComprados(prev => { const newMap = { ...prev }; delete newMap[idItem]; return newMap; });
      setChecklist(prev => { const newChecklist = { ...prev }; if (newChecklist[idItem]) { newChecklist[idItem].bloqueado = false; newChecklist[idItem].comprado = false; } return newChecklist; });
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
          if (!mapa[nomeNormalizado]) mapa[nomeNormalizado] = new Set();
          mapa[nomeNormalizado].add(cId);
        });
      });
      return mapa;
    } catch (error) { return {}; }
  };

  const handleGerarPedidos = async () => {
    setIsProcessandoPedidos(true);
    setTimeout(async () => {
      const pedidosPorFornecedor = {};
      
      // 1. Injeta os Itens Ganhos no Resumo
      relatorioOrdenado.forEach(itemRelatorio => {
        const idItem = itemRelatorio.idItem;
        if (itensJaComprados[idItem]) return; 
        const fornecedorNome = decisaoCompra[idItem];
        if (!fornecedorNome || fornecedorNome === 'Sem ofertas') return;

        if (!pedidosPorFornecedor[fornecedorNome]) pedidosPorFornecedor[fornecedorNome] = { fornecedorNome, itens: [], total: 0 };

        const isTrocaAceita = aceitesTroca[idItem];
        const nomeSubstituto = itemRelatorio.substitutosPorFornecedor?.[fornecedorNome];

        let preco = itemRelatorio.precosPorFornecedor?.[fornecedorNome] || 0;
        let qtd = itemRelatorio.quantidade || 0;
        let nomeFinal = getNomeRealSempre(itemRelatorio.nomeProduto);
        let nomeOriginal = null;

        if (isTrocaAceita && nomeSubstituto) {
          preco = itemRelatorio.precosSubstitutosPorFornecedor?.[fornecedorNome] || preco;
          qtd = itemRelatorio.qtdsSubstitutosPorFornecedor?.[fornecedorNome] || qtd;
          nomeFinal = getNomeRealSempre(nomeSubstituto); 
          nomeOriginal = getNomeRealSempre(itemRelatorio.nomeProduto); 
        }

        if (preco <= 0) return;

        pedidosPorFornecedor[fornecedorNome].itens.push({
          idItem, nomeProduto: nomeFinal, nomeOriginal, observacao: itemRelatorio.observacoesPorFornecedor?.[fornecedorNome],
          quantidadePedida: qtd, valorUnitarioPedido: preco, subtotal: qtd * preco, isExtra: false, todosDadosItem: itemRelatorio,
          selected: true 
        });
        pedidosPorFornecedor[fornecedorNome].total += (qtd * preco);
      });

      promocoes.forEach(promo => {
        const fName = promo.fornecedorNome;
        if (!pedidosPorFornecedor[fName]) {
            pedidosPorFornecedor[fName] = { fornecedorNome: fName, itens: [], total: 0 };
        }
        pedidosPorFornecedor[fName].itens.push({
            idItem: null,
            promocaoId: promo.id,
            nomeProduto: getNomeRealSempre(promo.nomeProduto),
            quantidadePedida: promo.qtdMinima,
            valorUnitarioPedido: promo.preco,
            subtotal: promo.qtdMinima * promo.preco,
            isExtra: true,
            observacao: promo.observacao,
            selected: false
        });
      });

      const pedidosArray = Object.values(pedidosPorFornecedor).filter(ped => ped.itens.length > 0);
      if (pedidosArray.length === 0) {
        alert('Nenhum item válido para processar pedido.'); setIsProcessandoPedidos(false); return;
      }

      // Pré-seleciona a ação (Gerar Novo vs Adicionar) baseado em pedidos abertos existentes
      pedidosArray.forEach(ped => {
         const fNameMatch = normalizeStr(ped.fornecedorNome);
         const pedAberto = pedidosAbertosList.find(p => {
           const emp = normalizeStr(p.fornecedor?.empresa);
           const nom = normalizeStr(p.fornecedor?.nome);
           const fNomeApi = normalizeStr(p.fornecedorNome);
           return (emp && fNameMatch.includes(emp)) || (nom && fNameMatch.includes(nom)) || (fNomeApi && fNameMatch.includes(fNomeApi));
         });
         ped.acaoFornecedor = pedAberto ? String(pedAberto.id) : 'NOVO';
      });

      setAvisosDuplicidade(await mapearDuplicatas());
      setPedidosGerados(pedidosArray);
      setShowModal(true);
      setIsProcessandoPedidos(false);
    }, 100);
  };

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
        pedDestino = { fornecedorNome: fornecedorDestino, itens: [], total: 0, acaoFornecedor: 'NOVO' };
        newState.push(pedDestino);
      }
      let novoPreco = itemToMove.todosDadosItem?.precosPorFornecedor?.[fornecedorDestino] || 0;
      if (novoPreco > 0) {
          itemToMove.valorUnitarioPedido = novoPreco; itemToMove.subtotal = itemToMove.quantidadePedida * novoPreco;
      } else {
          alert(`Aviso: O fornecedor ${fornecedorDestino} informou o preço como R$ 0,00 ou falta para este produto.`);
          itemToMove.valorUnitarioPedido = 0; itemToMove.subtotal = 0;
      }
      pedDestino.itens.push(itemToMove);
      pedDestino.total = pedDestino.itens.reduce((acc, it) => acc + it.subtotal, 0);
      return newState.filter(p => p.itens.length > 0);
    });
  };

  const irParaProximoMenorPreco = (fornecedorOrigem, indexItem) => {
    const pedOrigem = pedidosGerados.find(p => p.fornecedorNome === fornecedorOrigem);
    const precos = pedOrigem.itens[indexItem].todosDadosItem?.precosPorFornecedor || {};
    let menorPreco = Infinity, fornecedorVencedor = null;
    Object.entries(precos).forEach(([fNome, p]) => {
      if (p > 0 && p < menorPreco && fNome !== fornecedorOrigem) { menorPreco = p; fornecedorVencedor = fNome; }
    });
    if (fornecedorVencedor) moverItemParaFornecedor(fornecedorOrigem, indexItem, fornecedorVencedor);
    else alert('Não há outro fornecedor com preço cadastrado e disponível para este produto.');
  };

  const copiarFornecedorParaBaixo = (fornecedorNome, currentIndex) => {
    if (!fornecedorNome) return;
    setChecklist(prev => {
        const newState = { ...prev };
        relatorioExibicao.forEach((item, idx) => {
            if (idx > currentIndex) {
                const atual = newState[item.idItem] || { comprado: false, qtd: item.quantidade || 1, preco: item.ultimoPreco || 0, bloqueado: false, falta: false, fornecedor: '' };
                if (!atual.bloqueado) newState[item.idItem] = { ...atual, fornecedor: fornecedorNome };
            }
        });
        return newState;
    });
  };

  const handlePrepararRegistroManual = async () => {
    const itensComprados = [];
    let erroFornecedorFaltando = false;
    relatorioOrdenado.forEach(itemRelatorio => {
      const chk = checklist[itemRelatorio.idItem];
      if (chk && chk.comprado && !chk.bloqueado && chk.qtd > 0) {
        if (!chk.fornecedor) erroFornecedorFaltando = true;
        itensComprados.push({ itemCotacaoId: itemRelatorio.idItem, quantidadePedida: chk.qtd, valorUnitarioPedido: chk.preco, nomeProduto: getNomeRealSempre(itemRelatorio.nomeProduto), fornecedorNome: chk.fornecedor });
      }
    });

    if (itensComprados.length === 0) return alert('Marque pelo menos um produto como "Comprar" e selecione o Fornecedor na tabela para gerar o registro.');
    if (erroFornecedorFaltando) return alert('Atenção: Você marcou itens para compra, mas esqueceu de selecionar o Fornecedor em um ou mais deles na tabela.');

    setIsProcessandoPedidos(true);
    try {
      const pedidosAgrupados = {};
      itensComprados.forEach(item => {
          if (!pedidosAgrupados[item.fornecedorNome]) pedidosAgrupados[item.fornecedorNome] = [];
          pedidosAgrupados[item.fornecedorNome].push(item);
      });
      const payload = Object.keys(pedidosAgrupados).map(forn => ({ cotacaoId: Number(id), fornecedorNome: forn, itens: pedidosAgrupados[forn] }));
      const mapaDuplicatas = await mapearDuplicatas();
      const itensDuplicados = itensComprados.filter(i => mapaDuplicatas[getNomeRealSempre(i.nomeProduto).toUpperCase().trim()]);

      let msg = `Confirma o registro de pedidos manuais para ${Object.keys(pedidosAgrupados).length} fornecedor(es)?\n\n`;
      Object.keys(pedidosAgrupados).forEach(f => msg += `- ${f}: ${pedidosAgrupados[f].length} item(ns)\n`);
      if (itensDuplicados.length > 0) {
        msg += `\n⚠️ AVISO DE DUPLICIDADE ⚠️\nOs seguintes itens já possuem pedidos pendentes em outras cotações:\n`;
        itensDuplicados.forEach(i => msg += `- ${i.nomeProduto} (Cotações: ${Array.from(mapaDuplicatas[getNomeRealSempre(i.nomeProduto).toUpperCase().trim()]).join(', ')})\n`);
        msg += `\nDeseja gerar os pedidos mesmo assim?`;
      }
      setMensagemConfirmacaoManual(msg);
      setPayloadManualData(payload);
      setConfirmManualModal(true);
    } finally { setIsProcessandoPedidos(false); }
  };

  const processarRegistroManual = async () => {
    setSalvandoPedidos(true);
    try {
      await api.post('/api/pedidos/registro-manual', payloadManualData);
      if (acaoPosPedido === 'ENCERRADA') await api.put(`/api/cotacao/${id}/status`, { status: 'FINALIZADA' });
      alert('Pedidos manuais registrados com sucesso!');
      setConfirmManualModal(false);
      navigate('/pedidos');
    } catch (error) { alert('Erro ao registrar pedido manual: ' + (error.response?.data?.message || error.message)); } 
    finally { setSalvandoPedidos(false); }
  };

  const adicionarPromocaoAoPedido = (fornecedorNome, promo) => {
    setPedidosGerados(prev => prev.map(ped => {
      if (ped.fornecedorNome === fornecedorNome) {
        const subtotal = promo.qtdMinima * promo.preco;
        return { ...ped, itens: [...ped.itens, { idItem: null, promocaoId: promo.id, nomeProduto: getNomeRealSempre(promo.nomeProduto), observacao: promo.observacao, quantidadePedida: promo.qtdMinima, valorUnitarioPedido: promo.preco, subtotal, isExtra: true, selected: true }], total: ped.total + subtotal };
      }
      return ped;
    }));
  };

  const removerItemDoPedido = (fornecedorNome, indexItem) => {
    setPedidosGerados(prev => prev.map(ped => {
      if (ped.fornecedorNome === fornecedorNome) {
        const novosItens = [...ped.itens]; novosItens.splice(indexItem, 1);
        return { ...ped, itens: novosItens, total: novosItens.reduce((acc, it) => acc + it.subtotal, 0) };
      }
      return ped;
    }).filter(ped => ped.itens.length > 0));
  };

  // ATUALIZADO: Salva itens extras (Sugestões) de forma correta 
  const salvarPedidosNoBanco = async () => {
    setSalvandoPedidos(true);
    try {
      for (const pedido of pedidosGerados) {
        const itensSelecionados = pedido.itens.filter(i => i.selected);
        if (itensSelecionados.length === 0) continue; 

        if (pedido.acaoFornecedor === 'NOVO') {
            await api.post('/api/pedidos/gerar', {
                cotacaoId: Number(id),
                fornecedorNome: pedido.fornecedorNome,
                itens: itensSelecionados.map(item => ({
                    itemCotacaoId: item.idItem || null,
                    nomeProduto: item.nomeProduto,
                    quantidadePedida: item.quantidadePedida,
                    valorUnitarioPedido: item.valorUnitarioPedido
                }))
            });
        } else {
            for (const item of itensSelecionados) {
                await api.post(`/api/pedidos/${pedido.acaoFornecedor}/itens`, {
                    nomeProduto: item.nomeProduto,
                    quantidadePedida: item.quantidadePedida,
                    valorUnitarioPedido: item.valorUnitarioPedido,
                    itemCotacao: item.idItem ? { id: item.idItem } : null
                });
            }
        }
      }
      if (acaoPosPedido === 'ENCERRADA') await api.put(`/api/cotacao/${id}/status`, { status: 'FINALIZADA' });
      alert('Pedidos processados e gerados/atualizados com sucesso!');
      setShowModal(false); navigate('/pedidos');
    } catch (error) { 
      alert(`Falha ao salvar. Motivo: ${error.response?.data?.message || 'Erro de conexão com servidor'}`); 
    } finally { 
      setSalvandoPedidos(false); 
    }
  };

  // MODAL FLUTUANTE DE ADD PEDIDO (ÚNICO VS MASSIVO)
  const abrirModalAddPedido = async (item, fornecedorTarget = null) => {
    setItemAddPedido(item);
    setFornecedorTargetToModal(fornecedorTarget);
    setAddPedidoModo('UNICO');

    const valorInicial = item.precoCustom !== undefined ? item.precoCustom : (item.ultimoPreco || '');
    setAddPedidoForm({
      pedidoId: '',
      qtd: item.quantidade || 1,
      valor: valorInicial
    });

    if (fornecedorTarget) {
       const ganhos = relatorioOrdenado.filter(i => {
         const isBloqueado = !!itensJaComprados[i.idItem];
         const isWinner = decisaoCompra[i.idItem] === fornecedorTarget;
         return isWinner && !isBloqueado;
       });
       setItensGanhosFornecedor(ganhos);
    } else {
       setItensGanhosFornecedor([]);
    }

    setModalAddPedidoAberto(true);

    try {
      const res = await api.get('/api/pedidos');
      const abertos = Array.isArray(res.data) ? res.data.filter(p => p.status === 'PENDENTE_ENTREGA') : [];
      
      let defaultPedidoId = '';
      if (fornecedorTarget) {
        const doForn = abertos.filter(p => {
          const emp = normalizeStr(p.fornecedor?.empresa);
          const nom = normalizeStr(p.fornecedor?.nome);
          const fNomeApi = normalizeStr(p.fornecedorNome);
          const fTargetNorm = normalizeStr(fornecedorTarget);

          return (emp && fTargetNorm.includes(emp)) || 
                 (nom && fTargetNorm.includes(nom)) || 
                 (fNomeApi && fTargetNorm.includes(fNomeApi));
        }).sort((a,b) => b.id - a.id); 

        if (doForn.length > 0) {
          defaultPedidoId = String(doForn[0].id);
        }
      }

      setAddPedidoForm(prev => ({ ...prev, pedidoId: defaultPedidoId }));
      setPedidosAbertosList(abertos);
    } catch (e) {}
  };

  const handleSelectPedidoAberto = (e) => {
    const pedId = e.target.value;
    const pedObj = pedidosAbertosList.find(p => String(p.id) === String(pedId));
    let novoValor = addPedidoForm.valor;
    
    if (pedObj && itemAddPedido && itemAddPedido.precosPorFornecedor) {
      const fornecedor = pedObj.fornecedor?.nome || pedObj.fornecedorNome;
      if (fornecedor && itemAddPedido.precosPorFornecedor[fornecedor] > 0) {
        novoValor = itemAddPedido.precosPorFornecedor[fornecedor];
      }
    }
    setAddPedidoForm(prev => ({ ...prev, pedidoId: pedId, valor: novoValor }));
  };

  const confirmarAddPedido = async () => {
    if (!addPedidoForm.pedidoId) return alert("Selecione um pedido existente para prosseguir.");
    
    setLoadingAddPedido(true);
    try {
      const pedObj = pedidosAbertosList.find(p => String(p.id) === String(addPedidoForm.pedidoId));
      const fornecedor = pedObj.fornecedor?.nome || pedObj.fornecedorNome || pedObj.fornecedor?.empresa;

      if (addPedidoModo === 'UNICO') {
          if (!addPedidoForm.qtd || !addPedidoForm.valor) return alert("Preencha quantidade e valor.");
          await api.post(`/api/pedidos/${addPedidoForm.pedidoId}/itens`, {
            nomeProduto: getNomeRealSempre(itemAddPedido.nomeProduto),
            quantidadePedida: Number(addPedidoForm.qtd),
            valorUnitarioPedido: Number(addPedidoForm.valor),
            itemCotacao: itemAddPedido.idItem ? { id: itemAddPedido.idItem } : null
          });
          
          if (itemAddPedido.idItem) {
            setItensJaComprados(prev => ({
              ...prev, [itemAddPedido.idItem]: { id: Number(addPedidoForm.pedidoId), fornecedor: fornecedor, preco: Number(addPedidoForm.valor), quantidade: Number(addPedidoForm.qtd) }
            }));
          }
      } else {
          const newComprados = { ...itensJaComprados };
          for (const i of itensGanhosFornecedor) {
             const isTrocaAceita = aceitesTroca[i.idItem];
             const nomeSubstituto = i.substitutosPorFornecedor?.[fornecedorTargetToModal];
             let preco = i.precosPorFornecedor?.[fornecedorTargetToModal] || 0;
             let qtd = i.quantidade || 0;
             let nomeFinal = getNomeRealSempre(i.nomeProduto);

             if (isTrocaAceita && nomeSubstituto) {
                preco = i.precosSubstitutosPorFornecedor?.[fornecedorTargetToModal] || preco;
                qtd = i.qtdsSubstitutosPorFornecedor?.[fornecedorTargetToModal] || qtd;
                nomeFinal = getNomeRealSempre(nomeSubstituto);
             }

             if (preco > 0) {
                await api.post(`/api/pedidos/${addPedidoForm.pedidoId}/itens`, {
                  nomeProduto: nomeFinal, quantidadePedida: qtd, valorUnitarioPedido: preco, itemCotacao: { id: i.idItem }
                });
                newComprados[i.idItem] = { id: Number(addPedidoForm.pedidoId), fornecedor: fornecedor, preco: Number(preco), quantidade: Number(qtd) };
             }
          }
          setItensJaComprados(newComprados);
      }

      alert('Produto(s) injetado(s) no pedido com sucesso!');
      setModalAddPedidoAberto(false);
    } catch(e) {
      alert('Erro ao adicionar produto: ' + (e.response?.data?.message || e.message));
    } finally {
      setLoadingAddPedido(false);
    }
  };

  const totalComprado = Object.keys(checklist).reduce((acc, key) => {
    const item = checklist[key]; return (item.comprado && !item.bloqueado) ? acc + (item.qtd * item.preco) : acc;
  }, 0);

  const styles = {
    container: { padding: '20px', backgroundColor: '#f3f4f6', minHeight: '100vh', fontFamily: 'Segoe UI' },
    card: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' },
    toggleContainer: { display: 'flex', gap: '10px', marginBottom: '20px', backgroundColor: '#e5e7eb', padding: '4px', borderRadius: '8px', width: 'fit-content', flexWrap: 'wrap' },
    toggleBtn: (ativo) => ({ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '600', backgroundColor: ativo ? 'white' : 'transparent', color: ativo ? '#111827' : '#6b7280', boxShadow: ativo ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }),
    btnVoltar: { padding: '10px 20px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' },
    topNBtn: (ativo) => ({ padding: '6px 12px', borderRadius: '6px', border: ativo ? 'none' : '1px solid #cbd5e1', backgroundColor: ativo ? '#2563eb' : 'white', color: ativo ? 'white' : '#475569', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', boxShadow: ativo ? '0 2px 4px rgba(37,99,235,0.2)' : 'none' })
  };

  if (loading) return <div style={styles.container}><p>Carregando dados...</p></div>;

  return (
    <div style={styles.container}>
      <CotacaoHeader 
        id={id} isEncerrada={isEncerrada} setIsAddItemModalOpen={setIsAddItemModalOpen} setIsUploadModalOpen={setIsUploadModalOpen}
        mostrarNomeReal={mostrarNomeReal} setMostrarNomeReal={setMostrarNomeReal} setShowVinculosModal={setShowVinculosModal}
        setIsEnviarModalOpen={setIsEnviarModalOpen} decisaoCompra={decisaoCompra} handleGerarPedidos={handleGerarPedidos}
        isProcessandoPedidos={isProcessandoPedidos} modoVisualizacao={modoVisualizacao} baixarRelatorioGeral={handleBaixarPDF}
        alterarStatusCotacao={alterarStatusCotacao} navigate={navigate}
      />

      <div style={styles.toggleContainer}>
        <button type="button" style={styles.toggleBtn(modoVisualizacao === 'itens')} onClick={() => setModoVisualizacao('itens')}><List size={18} /> Detalhes da Cotação</button>
        <button type="button" style={styles.toggleBtn(modoVisualizacao === 'comparativo')} onClick={() => setModoVisualizacao('comparativo')}><BarChart2 size={18} /> Comparativo de Preços</button>
        {!isEncerrada && (
          <button type="button" style={styles.toggleBtn(modoVisualizacao === 'manual')} onClick={() => setModoVisualizacao('manual')}><ClipboardCheck size={18} color={modoVisualizacao === 'manual' ? '#10b981' : '#6b7280'} /> Registro Manual (Checklist)</button>
        )}
      </div>

      <CotacaoFiltros 
        termoBusca={termoBusca} setTermoBusca={setTermoBusca} modoVisualizacao={modoVisualizacao} subAbaItens={subAbaItens} setSubAbaItens={setSubAbaItens}
        isEncerrada={isEncerrada} filtroOrigem={filtroOrigem} setFiltroOrigem={setFiltroOrigem} filtroPropostas={filtroPropostas} setFiltroPropostas={setFiltroPropostas}
        showColunasDropdown={showColunasDropdown} setShowColunasDropdown={setShowColunasDropdown} colunasVisiveis={colunasVisiveis} setColunasVisiveis={setColunasVisiveis}
        fornecedores={fornecedores} fornecedoresVisiveis={fornecedoresVisiveis} setFornecedoresVisiveis={setFornecedoresVisiveis}
      />

      {modoVisualizacao === 'comparativo' && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569', marginRight: '8px' }}>Filtro de Competitividade:</span>
          <button onClick={() => setFiltroTopN('TODOS')} style={styles.topNBtn(filtroTopN === 'TODOS')}>Sem Filtro Top (Ver Todos)</button>
          <button onClick={() => setFiltroTopN('TOP_2')} style={styles.topNBtn(filtroTopN === 'TOP_2')}>Top 2 (Ganhador vs 2º Colocado)</button>
          <button onClick={() => setFiltroTopN('TOP_3')} style={styles.topNBtn(filtroTopN === 'TOP_3')}>Top 3 Melhores Preços</button>
        </div>
      )}

      {modoVisualizacao === 'manual' ? (
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

          <TabelaRegistroManual 
            relatorioExibicao={relatorioFiltradoFinal} checklist={checklist} setChecklist={setChecklist} fornecedoresLista={fornecedoresLista}
            isEncerrada={isEncerrada} getNomeExibicao={getNomeExibicao} isDiversos={isDiversos} mostrarNomeReal={mostrarNomeReal}
            copiarParaAreaTransferencia={copiarParaAreaTransferencia} copiadoId={copiadoId} copiarFornecedorParaBaixo={copiarFornecedorParaBaixo}
            reatribuirItem={reatribuirItem} fMoney={fMoney} requestSort={requestSort} sortConfig={sortConfig}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button type="button" onClick={handlePrepararRegistroManual} disabled={isProcessandoPedidos || isEncerrada} style={{ ...styles.btnVoltar, backgroundColor: isEncerrada ? '#9ca3af' : '#10b981', fontSize: '15px', padding: '12px 24px', boxShadow: isEncerrada ? 'none' : '0 4px 6px -1px rgba(16, 185, 129, 0.4)' }}>
              {isProcessandoPedidos ? <Loader2 size={18} className="animate-spin" style={{ marginRight: '8px' }} /> : <Save size={18} style={{ marginRight: '8px' }} />} Finalizar Registro e Gerar Pedidos
            </button>
          </div>
        </div>
      ) : (
        <div style={styles.card}>
          <TabelaDetalhes 
            relatorioExibicao={relatorioFiltradoFinal} colunasVisiveis={colunasVisiveis} fornecedoresVisiveis={fornecedoresVisiveis}
            fornecedores={fornecedores} requestSort={requestSort} sortConfig={sortConfig} editandoItem={editandoItem}
            formEdicao={formEdicao} setFormEdicao={setFormEdicao} salvarEdicao={salvarEdicao} isEncerrada={isEncerrada}
            iniciarEdicao={iniciarEdicao} getNomeExibicao={getNomeExibicao} isDiversos={isDiversos} mostrarNomeReal={mostrarNomeReal}
            copiarParaAreaTransferencia={copiarParaAreaTransferencia} copiadoId={copiadoId} itensJaComprados={itensJaComprados}
            reatribuirItem={reatribuirItem} fData={fData} fMoney={fMoney} decisaoCompra={decisaoCompra} aceitesTroca={aceitesTroca}
            handleSetWinner={handleSetWinner} toggleTroca={toggleTroca} subAbaItens={subAbaItens} navigate={navigate}
            deletarItem={deletarItem} isComparativo={isComparativo} isItens={isItens}
            onAbrirAddPedidoModal={abrirModalAddPedido}
            filtroVencedor={filtroVencedor} setFiltroVencedor={setFiltroVencedor} filtroTopN={filtroTopN}
          />
          {isComparativo && <CardsSugestoes promocoes={promocoes} getNomeExibicao={getNomeExibicao} fMoney={fMoney} />}
        </div>
      )}

      <ModalFornecedoresNotificados isOpen={showVinculosModal} onClose={() => setShowVinculosModal(false)} vinculos={vinculos} removerVinculo={removerVinculo} />
      <ModalProdutoExtra isOpen={isAddItemModalOpen} onClose={() => setIsAddItemModalOpen(false)} novoItemManual={novoItemManual} setNovoItemManual={setNovoItemManual} handleSalvarItemManual={handleSalvarItemManual} salvandoItemManual={salvandoItemManual} />
      {isUploadModalOpen && <UploadModal cotacaoId={id} onClose={() => setIsUploadModalOpen(false)} onSuccess={carregarRelatorio} />}
      {isEnviarModalOpen && <EnviarLinkModal idCotacao={id} onClose={() => setIsEnviarModalOpen(false)} onStatusUpdate={() => { carregarCotacao(); carregarVinculos(); }} />}
      <ModalConfirmacaoManual isOpen={confirmManualModal} onClose={() => setConfirmManualModal(false)} mensagemConfirmacaoManual={mensagemConfirmacaoManual} acaoPosPedido={acaoPosPedido} setAcaoPosPedido={setAcaoPosPedido} processarRegistroManual={processarRegistroManual} salvandoPedidos={salvandoPedidos} isEncerrada={isEncerrada} />
      
      <ModalResumoPedidos 
          isOpen={showModal} 
          onClose={() => setShowModal(false)} 
          pedidosGerados={pedidosGerados} 
          setPedidosGerados={setPedidosGerados} 
          promocoes={promocoes} 
          avisosDuplicidade={avisosDuplicidade} 
          fornecedores={fornecedores} 
          adicionarPromocaoAoPedido={adicionarPromocaoAoPedido} 
          removerItemDoPedido={removerItemDoPedido} 
          moverItemParaFornecedor={moverItemParaFornecedor} 
          irParaProximoMenorPreco={irParaProximoMenorPreco} 
          acaoPosPedido={acaoPosPedido} 
          setAcaoPosPedido={setAcaoPosPedido} 
          salvarPedidosNoBanco={salvarPedidosNoBanco} 
          salvandoPedidos={salvandoPedidos} 
          getNomeRealSempre={getNomeRealSempre} 
          fMoney={fMoney} 
          pedidosAbertosList={pedidosAbertosList} 
          relatorioOrdenado={relatorioOrdenado} 
      />
      
      {modalAddPedidoAberto && itemAddPedido && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1050 }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '450px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#1f2937' }}>Adicionar a Pedido Existente</h3>
                <button onClick={() => setModalAddPedidoAberto(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><X size={20} /></button>
             </div>

             <div style={{ marginBottom: '20px' }}>
               <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>Selecione o Pedido de Destino</label>
               <select style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontWeight: 'bold', color: '#1e293b' }} value={addPedidoForm.pedidoId} onChange={e => setAddPedidoForm(prev => ({ ...prev, pedidoId: e.target.value }))}>
                 <option value="">{pedidosAbertosList.length === 0 ? 'Nenhum pedido em aberto' : '-- Selecione --'}</option>
                 {pedidosAbertosList.map(p => {
                    const emp = p.fornecedor?.empresa || p.fornecedor?.nomeEmpresa || '';
                    const vend = p.fornecedor?.nome || p.fornecedorNome || '';
                    let exibicao = emp;
                    if (emp && vend && emp !== vend) exibicao += ` (${vend})`;
                    else if (!emp && vend) exibicao = vend;
                    else if (!emp && !vend) exibicao = 'Fornecedor Desconhecido';
                    return <option key={p.id} value={p.id}>Pedido #{p.id} - {exibicao}</option>;
                 })}
               </select>
             </div>

             {fornecedorTargetToModal ? (
               <div style={{ padding: '12px', backgroundColor: '#f1f5f9', borderRadius: '8px', marginBottom: '20px' }}>
                 <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#334155', marginBottom: '10px' }}>O que deseja transferir?</div>
                 
                 <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#1e293b', marginBottom: '8px' }}>
                   <input type="radio" checked={addPedidoModo === 'UNICO'} onChange={() => setAddPedidoModo('UNICO')} style={{ transform: 'scale(1.2)' }} />
                   <span>Somente este produto: <strong style={{ color: '#2563eb' }}>{getNomeExibicao(itemAddPedido.nomeProduto)}</strong></span>
                 </label>
                 
                 <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#1e293b' }}>
                   <input type="radio" checked={addPedidoModo === 'TODOS'} onChange={() => setAddPedidoModo('TODOS')} style={{ transform: 'scale(1.2)' }} disabled={itensGanhosFornecedor.length === 0} />
                   <span>Adicionar <strong>TODOS</strong> os {itensGanhosFornecedor.length} produtos pendentes que o fornecedor <strong>{fornecedorTargetToModal}</strong> ganhou.</span>
                 </label>
               </div>
             ) : (
                <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '16px' }}>Produto Selecionado: <strong>{getNomeExibicao(itemAddPedido.nomeProduto)}</strong></p>
             )}

             {addPedidoModo === 'UNICO' && (
                <div style={{ display: 'flex', gap: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>Qtd a Pedir</label>
                    <input type="number" min="1" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} value={addPedidoForm.qtd} onChange={e => setAddPedidoForm({...addPedidoForm, qtd: e.target.value})} onFocus={e => e.target.select()}/>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>Valor Unit. (R$)</label>
                    <input type="number" step="0.01" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} value={addPedidoForm.valor} onChange={e => setAddPedidoForm({...addPedidoForm, valor: e.target.value})} onFocus={e => e.target.select()}/>
                  </div>
                </div>
             )}

             <button 
               onClick={confirmarAddPedido} 
               disabled={loadingAddPedido || !addPedidoForm.pedidoId}
               style={{ width: '100%', padding: '12px', marginTop: '16px', backgroundColor: !addPedidoForm.pedidoId ? '#9ca3af' : '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: !addPedidoForm.pedidoId ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
             >
               {loadingAddPedido ? <Loader2 className="animate-spin" size={18} /> : (addPedidoModo === 'TODOS' ? 'Confirmar Adição Massiva' : 'Confirmar e Adicionar')}
             </button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .animate-spin { animation: spin 1s linear infinite; }`}</style>
    </div>
  );
}