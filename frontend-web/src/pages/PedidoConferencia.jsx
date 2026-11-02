import { useState, useEffect, useMemo, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Sidebar from '../components/layout/Sidebar';
import DevolucaoModal from '../components/DevolucaoModal';
import ModalProdutoNaoSolicitado from '../components/ModalProdutoNaoSolicitado';
import IdentificacaoProdutoRecebido from '../components/IdentificacaoProdutoRecebido';
import FotosConferencia from '../components/FotosConferencia';
import { ArrowLeft, CheckCircle, ArrowUpDown, Edit2, Check, FileText, Tag, AlertTriangle, Package, Truck, Search } from 'lucide-react';
import {
  nomeExibicaoProduto,
  separarItensConferencia,
  calcularConversao,
  quantidadeEsperadaItem,
  valorUnitarioFisico,
  conversaoParaEnvio,
  montarItemRecebido,
  mesclarCacheNaConferencia
} from '../utils/conferenciaUtils';

const CHAVE_CACHE_CONFERENCIA = (pedidoId) => `conferencia_pedido_${pedidoId}`;

const lerCacheConferencia = (pedidoId) => {
  try {
    const raw = localStorage.getItem(CHAVE_CACHE_CONFERENCIA(pedidoId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const salvarCacheConferencia = (pedidoId, dados) => {
  try {
    localStorage.setItem(CHAVE_CACHE_CONFERENCIA(pedidoId), JSON.stringify(dados));
  } catch { /* armazenamento indisponível */ }
};

const limparCacheConferencia = (pedidoId) => {
  try {
    localStorage.removeItem(CHAVE_CACHE_CONFERENCIA(pedidoId));
  } catch { /* armazenamento indisponível */ }
};

const extrairObservacaoIncorreto = (item) => {
  const persistida = String(item.observacaoDevolucao || '');
  if (item.statusRecebimento !== 'INCORRETO') return persistida;
  const nome = String(item.nomeProdutoRecebido || item.produtoRecebido || '').trim();
  let observacao = persistida;
  if (nome) {
    const prefixo = `Produto errado: ${nome}.`;
    if (observacao.startsWith(prefixo)) observacao = observacao.slice(prefixo.length);
    else if (observacao.trim() === nome) observacao = '';
  }
  observacao = observacao.replace(/\s*Código DNA:\s*[^.]+\.?\s*$/i, '');
  return observacao.trim();
};

// Produtos aceitos por sugestão de troca são identificados pela diferença entre
// o nome gravado no pedido e o nome do ItemCotacao original: "Substituto (Original)".
// A implementação está em ../utils/conferenciaUtils (compartilhada e testada).

export default function PedidoConferencia() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pedido, setPedido] = useState(null);
  const [conferencia, setConferencia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'nomeProduto', direction: 'asc' });
  const [buscaProduto, setBuscaProduto] = useState('');
  const [numeroNota, setNumeroNota] = useState('');
  const [showModalDestinoFaltantes, setShowModalDestinoFaltantes] = useState(false);
  const [showDevolucaoModal, setShowDevolucaoModal] = useState(false);
  const [showProdutoNaoSolicitadoModal, setShowProdutoNaoSolicitadoModal] = useState(false);
  const [itemCameraAberta, setItemCameraAberta] = useState(null);
  const [fotos, setFotos] = useState([]);
  const isConferente = localStorage.getItem('tipoUsuario') === 'CONFERENTE';
  // Trava persistida: após o Conferente finalizar a etapa física, a edição só
  // volta quando o ADM liberar expressamente pelo detalhe do pedido.
  const bloqueadoConferente = isConferente
    && !!pedido?.conferenciaFisicaFinalizada
    && !pedido?.conferenciaEdicaoLiberada;

  useEffect(() => {
    carregarPedido();
  }, [id]);

  // Salva o preenchimento automaticamente em cache a cada alteração,
  // para não perder o progresso em caso de falha ou atualização da página.
  // O status do pedido é gravado junto para descartar cache de uma etapa anterior
  // (ex.: cache criado antes de o conferente salvar a conferência).
  useEffect(() => {
    if (loading || conferencia.length === 0 || !pedido) return;
    salvarCacheConferencia(id, { numeroNota, conferencia, pedidoStatus: pedido.status, salvoEm: Date.now() });
  }, [conferencia, numeroNota, loading, id, pedido]);

  const carregarPedido = async () => {
    try {
      const response = await api.get(`/api/pedidos/${id}`);
      setPedido(response.data);
      if (response.data.itens) {
        const continuidadeAdministrativa = !isConferente
          && response.data.status === 'CONFERENCIA_INICIADA';
        const bloqueado = isConferente
          && !!response.data.conferenciaFisicaFinalizada
          && !response.data.conferenciaEdicaoLiberada;
        // Após a liberação do ADM, o Conferente corrige a quantidade já
        // persistida (o backend substitui, não soma outro volume).
        const editandoAposLiberacao = isConferente && !!response.data.conferenciaEdicaoLiberada;
        // Itens "Não Veio" que retornaram à cotação não participam mais da conferência;
        // eles aparecem na tabela apenas em modo de leitura, destacados.
        const base = separarItensConferencia(response.data.itens).editaveis.map(item => {
            const qtdJaRecebida = item.quantidadeReal > 0 ? item.quantidadeReal : 0;
            const esperada = quantidadeEsperadaItem(item);
            const totalmenteRecebido = qtdJaRecebida >= esperada;
            const valorInformado = item.valorUnitarioReal != null && Number(item.valorUnitarioReal) > 0;
            // Na continuidade administrativa ou na trava do Conferente, só trava
            // o que realmente já foi persistido.
            const quantidadeJaPersistida = (continuidadeAdministrativa || bloqueado) && qtdJaRecebida > 0;
            const avariadaJaPersistida = (continuidadeAdministrativa || bloqueado)
              && (item.quantidadeAvariada || 0) > 0;
            return {
              id: item.id,
              quantidadePedida: item.quantidadePedida,
              valorUnitarioPedido: item.valorUnitarioPedido,
              itemCotacao: item.itemCotacao,
              quantidadeJaRecebida: qtdJaRecebida,
              quantidadeRecebidaAgora: editandoAposLiberacao
                ? qtdJaRecebida
                : (quantidadeJaPersistida ? qtdJaRecebida : ''),
              quantidadeRecebidaPersistida: quantidadeJaPersistida,
              quantidadeAvariada: item.quantidadeAvariada || 0,
              quantidadeAvariadaAgora: editandoAposLiberacao
                ? (item.quantidadeAvariada || 0)
                : (avariadaJaPersistida ? (item.quantidadeAvariada || 0) : 0),
              quantidadeAvariadaPersistida: avariadaJaPersistida,
              valorUnitarioReal: isConferente
                ? ''
                : (item.valorUnitarioReal > 0 ? item.valorUnitarioReal : ''),
              statusRecebimento: item.statusRecebimento || 'OK',
              // Faltas de uma etapa anterior precisam ser confirmadas de novo (com valor),
              // pois o produto pode ter chegado no volume atual.
              conferido: bloqueado
                ? true
                : (editandoAposLiberacao
                  ? false
                  : (isConferente
                    ? totalmenteRecebido || (item.statusRecebimento && item.statusRecebimento !== 'OK')
                    : valorInformado && (totalmenteRecebido
                      || (item.statusRecebimento && item.statusRecebimento !== 'OK'
                        && item.statusRecebimento !== 'FALTANTE')))),
              totalmenteRecebido,
              codigoBarrasRecebido: item.codigoBarrasRecebido || '',
              produtoRecebido: item.nomeProdutoRecebido || item.produtoRecebido || '',
              observacaoIncorreto: extrairObservacaoIncorreto(item),
              foiCobrado: (item.observacaoDevolucao || '').includes('Cobrado na nota'),
              fatorConversao: item.fatorConversao ?? '',
              sentidoConversao: item.sentidoConversao || 'MULTIPLICAR',
              quantidadeEsperada: item.quantidadeEsperada ?? '',
              conversaoAberta: false
            };
          });

        // Recupera preenchimento salvo em cache (falha ou atualização da página).
        // Ignora cache de uma etapa anterior do pedido: ele pode estar com quantidades
        // zeradas e itens já confirmados de antes de o conferente salvar.
        const cache = lerCacheConferencia(id);
        const cacheValido = cache
          && Array.isArray(cache.conferencia)
          && cache.conferencia.length > 0
          && cache.pedidoStatus === response.data.status;
        if (cacheValido) {
          setNumeroNota(cache.numeroNota || response.data.numeroNota || '');
          // Restaura o preenchimento salvo (inclusive marcações de conversão).
          setConferencia(mesclarCacheNaConferencia(base, cache, isConferente));
        } else {
          if (cache) limparCacheConferencia(id);
          setNumeroNota(response.data.numeroNota || '');
          setConferencia(base);
        }
        try {
          const fotosResponse = await api.get(`/api/pedidos/${id}/conferencia/fotos`);
          setFotos(fotosResponse.data || []);
        } catch (fotosError) {
          console.warn('Fotos da conferência não puderam ser carregadas:', fotosError.response?.status || fotosError.message);
          setFotos([]);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar pedido para conferência:', error);
      alert('Erro ao carregar dados do pedido.');
    } finally {
      setLoading(false);
    }
  };

  const montarObservacaoIncorreto = (item) => {
    const partes = [`Produto errado: ${item.produtoRecebido || 'não informado'}.`];
    if (String(item.observacaoIncorreto || '').trim()) partes.push(String(item.observacaoIncorreto).trim());
    if (String(item.codigoDnaRecebido || '').trim()) partes.push(`Código DNA: ${String(item.codigoDnaRecebido).trim()}.`);
    return partes.join(' ').trim();
  };

  const montarObservacaoNaoSolicitado = (item) => {
    const partes = [item.classificacaoNaoSolicitado || 'Produto Não Solicitado'];
    if (String(item.codigoDnaRecebido || '').trim()) partes.push(`Código DNA: ${String(item.codigoDnaRecebido).trim()}`);
    if (String(item.observacaoIncorreto || '').trim()) partes.push(`Obs.: ${String(item.observacaoIncorreto).trim()}`);
    return partes.join(' | ');
  };

  const adicionarFoto = (foto) => setFotos(prev => [...prev, foto]);

  const handleInputChange = (idItem, field, value) => {
    if (bloqueadoConferente) return;
    setConferencia(prev => prev.map(item => {
        if (item.id === idItem) {
            let newItem = { ...item, [field]: value };
            if (field === 'statusRecebimento') {
                if (value === 'FALTANTE') {
                    newItem.quantidadeRecebidaAgora = 0;
                }
                if (value !== 'AVARIADO') {
                    newItem.quantidadeAvariadaAgora = 0;
                }
                if (value !== 'FALTANTE') {
                    newItem.foiCobrado = false;
                }
                if (value !== 'INCORRETO') {
                    newItem.codigoBarrasRecebido = '';
                    newItem.codigoDnaRecebido = '';
                    newItem.produtoRecebido = '';
                    newItem.observacaoIncorreto = '';
                }
            }
            return newItem;
        }
        return item;
    }));
  };

  const toggleConferido = (idItem) => {
    if (bloqueadoConferente) return;
    setConferencia(prev => prev.map(item => {
      if (item.id === idItem) {
        if (!item.conferido) {
          const isFaltante = item.statusRecebimento === 'FALTANTE';
          const qtdNova = item.quantidadeRecebidaAgora === '' || item.quantidadeRecebidaAgora === undefined
            ? Number(item.quantidadeJaRecebida || 0)
            : Number(item.quantidadeRecebidaAgora);
          const qtdAvariada = Number(item.quantidadeAvariadaAgora || 0);
          if (item.statusRecebimento === 'AVARIADO' && (qtdAvariada <= 0 || qtdAvariada > qtdNova)) {
            alert('Informe a quantidade avariada, sem ultrapassar a quantidade recebida nesta NF.');
            return item;
          }
          if (item.statusRecebimento === 'INCORRETO' && !String(item.produtoRecebido || '').trim()) {
            alert('Informe o nome do produto recebido antes de confirmar este item.');
            return item;
          }
          if (!isFaltante && !isConferente) {
            if (qtdNova <= 0 || item.valorUnitarioReal === ''
              || !Number.isFinite(Number(item.valorUnitarioReal))
              || Number(item.valorUnitarioReal) <= 0) {
              alert('Preencha a quantidade e o valor unitário da nota antes de confirmar este item.');
              return item;
            }
          }
        }
        return { ...item, conferido: !item.conferido };
      }
      return item;
    }));
  };

  // --- Conversão entre unidade pedida e unidade física ---------------------------
  // MULTIPLICAR: 1 unidade pedida contém N unidades físicas.
  // DIVIDIR: N unidades pedidas formam 1 unidade física (divisão exata).
  // O Conferente só lida com quantidades; valores financeiros ficam com o ADM.
  // A validação e o cálculo puro ficam em ../utils/conferenciaUtils (testados).
  const abrirConversao = (idItem) => {
    if (bloqueadoConferente) return;
    setConferencia(prev => prev.map(item => item.id === idItem
      ? { ...item, conversaoAberta: !item.conversaoAberta }
      : item));
  };

  const aplicarConversaoItem = (idItem) => {
    if (bloqueadoConferente) return;
    const item = conferencia.find(c => c.id === idItem);
    if (!item) return;

    const calc = calcularConversao(item.quantidadePedida, item.fatorConversao, item.sentidoConversao);
    if (!calc.valido) {
      alert(calc.erro);
      return;
    }

    const valorFisico = valorUnitarioFisico({
      ...item,
      fatorConversao: calc.fator,
      sentidoConversao: calc.sentido
    });
    const sinal = calc.sentido === 'MULTIPLICAR' ? '×' : '÷';
    const linhas = [
      'Confirmar conversão deste produto?',
      '',
      `Quantidade: ${calc.quantidadePedida} un pedidas → ${calc.quantidadeEsperada} un físicas (${sinal} ${calc.fator})`
    ];
    if (!isConferente) {
      linhas.push(`Valor por unidade pedida: ${fMoney(item.valorUnitarioPedido)}`);
      linhas.push(`Valor por unidade física: ${fMoney(valorFisico)}`);
    }
    const confirmar = window.confirm(linhas.join('\n'));
    if (!confirmar) return;

    setConferencia(prev => prev.map(c => c.id === idItem
      ? {
          ...c,
          fatorConversao: calc.fator,
          sentidoConversao: calc.sentido,
          quantidadeEsperada: calc.quantidadeEsperada,
          quantidadeRecebidaAgora: calc.quantidadeEsperada,
          // O Conferente nunca recebe valor financeiro. O ADM usa o valor
          // derivado por unidade física como referência e pode corrigir na NF.
          valorUnitarioReal: isConferente
            ? c.valorUnitarioReal
            : (valorFisico > 0 ? valorFisico : c.valorUnitarioReal),
          conversaoAberta: false
        }
      : c));
  };

  const removerConversao = (idItem) => {
    if (bloqueadoConferente) return;
    setConferencia(prev => prev.map(c => c.id === idItem
      ? {
          ...c,
          // Fator 1 é o contrato do backend para limpar a conversão persistida.
          fatorConversao: 1,
          sentidoConversao: 'MULTIPLICAR',
          quantidadeEsperada: '',
          conversaoAberta: false
        }
      : c));
  };

  const adicionarProdutosNaoSolicitados = (lista) => {
    if (bloqueadoConferente) return;
    const agora = Date.now();
    const novos = (lista || []).map((dados, indice) => ({
      id: `extra_${agora}_${indice}`,
      nomeProduto: dados.nomeProduto,
      quantidadePedida: 0,
      quantidadeJaRecebida: 0,
      valorUnitarioReal: isConferente ? '' : (dados.valorUnitario || ''),
      valorUnitarioPedido: 0,
      statusRecebimento: 'OK',
      conferido: true,
      totalmenteRecebido: false,
      quantidadeRecebidaAgora: dados.quantidade,
      codigoBarrasRecebido: dados.codigoBarrasRecebido || '',
      codigoDnaRecebido: dados.codigoDnaRecebido || '',
      produtoRecebido: dados.nomeProdutoRecebido || '',
      observacaoIncorreto: dados.observacao || '',
      foiCobrado: false,
      isNaoSolicitado: true,
      classificacaoNaoSolicitado: dados.classificacao,
      fatorConversao: '',
      sentidoConversao: 'MULTIPLICAR',
      quantidadeEsperada: dados.quantidade,
      conversaoAberta: false
    }));
    setConferencia(prev => [...prev, ...novos]);
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const itensOrdenados = useMemo(() => {
    if (!pedido?.itens) return [];
    const itensNormais = [...pedido.itens];
    const itensExtras = conferencia.filter(c => c.isNaoSolicitado).map(c => ({
      id: c.id,
      nomeProduto: c.nomeProduto,
      quantidadePedida: 0,
      quantidadeReal: 0,
      valorUnitarioPedido: 0,
      valorUnitarioReal: c.valorUnitarioReal,
      statusRecebimento: c.statusRecebimento,
      isNaoSolicitado: true
    }));
    let ordenavel = [...itensNormais, ...itensExtras].filter(item =>
      nomeExibicaoProduto(item)
        .toLowerCase()
        .includes(buscaProduto.toLowerCase())
    );
    ordenavel.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];

      if (sortConfig.key === 'nomeProduto') {
        valA = nomeExibicaoProduto(a);
        valB = nomeExibicaoProduto(b);
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return ordenavel;
  }, [pedido, sortConfig, conferencia, buscaProduto]);

  const itensHabilitados = useMemo(
    () => conferencia.filter(c => !c.totalmenteRecebido),
    [conferencia]
  );

  const itensNaoConferidos = useMemo(
    () => conferencia.filter(c => !c.conferido && !c.isNaoSolicitado),
    [conferencia]
  );

  const conferirTodos = () => {
    if (bloqueadoConferente) return;
    let confirmados = 0;
    let pendentes = 0;
    setConferencia(prev => prev.map(item => {
      if (item.conferido || item.isNaoSolicitado) return item;
      if (item.statusRecebimento === 'INCORRETO' && !String(item.produtoRecebido || '').trim()) {
        pendentes++;
        return item;
      }
      const quantidadePreenchida = item.totalmenteRecebido
        ? Number(item.quantidadeJaRecebida) > 0
        : item.quantidadeRecebidaAgora !== ''
        && item.quantidadeRecebidaAgora !== undefined
        && item.quantidadeRecebidaAgora !== null
        && Number.isFinite(Number(item.quantidadeRecebidaAgora))
        && (item.statusRecebimento === 'FALTANTE'
          ? Number(item.quantidadeRecebidaAgora) >= 0
          : Number(item.quantidadeRecebidaAgora) > 0);
      const valorPreenchido = isConferente
        || (item.valorUnitarioReal !== ''
          && item.valorUnitarioReal !== undefined
          && Number.isFinite(Number(item.valorUnitarioReal))
          && Number(item.valorUnitarioReal) > 0);
      if (!quantidadePreenchida || !valorPreenchido) {
        pendentes++;
        return item;
      }
      confirmados++;
      return { ...item, conferido: true };
    }));
    if (pendentes > 0) {
      alert(`${confirmados} item(ns) marcado(s) como conferido(s). ${pendentes} item(ns) permanecem pendentes porque faltam dados obrigatórios (quantidade, valor ou identificação do produto recebido).`);
    } else if (confirmados > 0) {
      alert(`${confirmados} item(ns) marcado(s) como conferido(s).`);
    }
  };

  // Itens que ficaram sem destino após esta conferência (não recebidos integralmente,
  // não cobrados e sem divergência de devolução). Exigem escolha ao finalizar.
  const getItensSemDestino = () => {
    if (!pedido?.itens) return [];
    return conferencia.filter(c => {
      if (c.isNaoSolicitado || c.totalmenteRecebido || c.foiCobrado) return false;
      if (c.statusRecebimento === 'INCORRETO'
        || c.statusRecebimento === 'AVARIADO'
        || c.statusRecebimento === 'PROXIMO_VENCIMENTO') return false;
      const itemPedido = pedido.itens.find(i => i.id === c.id);
      if (!itemPedido) return false;
      const pedida = itemPedido.quantidadePedida || 0;
      const jaRecebida = c.quantidadeJaRecebida || 0;
      const agora = (c.quantidadeRecebidaAgora === '' || c.quantidadeRecebidaAgora === undefined)
        ? 0
        : Number(c.quantidadeRecebidaAgora);
      return (jaRecebida + agora) < pedida;
    });
  };

  const getNomeItemConferencia = (c) => {
    const itemPedido = pedido?.itens?.find(i => i.id === c.id);
    if (itemPedido) return nomeExibicaoProduto(itemPedido);
    return c.nomeProduto || 'Produto Desconhecido';
  };

  const montarItensNaoSolicitadosPayload = () => conferencia
    .filter(c => c.isNaoSolicitado && c.conferido)
    .map(c => ({
      nomeProduto: c.nomeProduto,
      quantidade: Number(c.quantidadeRecebidaAgora || 0),
      // O Conferente nunca envia valor financeiro; o backend também ignora.
      valorUnitarioReal: isConferente ? undefined : Number(c.valorUnitarioReal || 0),
      codigoBarrasRecebido: c.codigoBarrasRecebido || '',
      codigoDnaRecebido: c.codigoDnaRecebido || '',
      nomeProdutoRecebido: c.produtoRecebido || c.nomeProduto || '',
      observacaoDevolucao: montarObservacaoNaoSolicitado(c)
    }));

  const salvarConferenciaParcial = async () => {
    if (bloqueadoConferente) {
      alert('A conferência física deste pedido já foi finalizada. Aguarde o ADM liberar a edição.');
      return;
    }
    if (!numeroNota.trim()) {
      alert('Por favor, preencha o Número da NF antes de salvar.');
      return;
    }
    const incorretosSemNome = conferencia.filter(c => c.conferido && !c.isNaoSolicitado
      && c.statusRecebimento === 'INCORRETO' && !String(c.produtoRecebido || '').trim());
    if (incorretosSemNome.length > 0) {
      alert('Informe o nome do produto recebido nos itens marcados como Produto Errado antes de salvar.');
      return;
    }
    setSalvando(true);
    try {
      // Itens físicos e produtos não solicitados são gravados na mesma
      // requisição/transação: ou tudo é salvo, ou nada é salvo.
      await api.patch(`/api/pedidos/${id}/conferencia/parcial`, {
        numeroNota: numeroNota.trim(),
        itens: conferencia.filter(item => item.conferido && !item.isNaoSolicitado).map(item =>
          montarItemRecebido(item,
            item.statusRecebimento === 'INCORRETO'
              ? montarObservacaoIncorreto(item)
              : (item.statusRecebimento !== 'OK'
                  ? (item.observacaoIncorreto || item.statusRecebimento)
                  : ''),
            { incluirValorFinanceiro: !isConferente })
        ),
        itensNaoSolicitados: montarItensNaoSolicitadosPayload()
      });

      limparCacheConferencia(id);
      alert('Conferência física salva. O pedido voltou para a conferência financeira do ADM.');
      navigate(`/pedidos/${id}`);
    } catch (error) {
      alert(error.response?.data?.message || 'Não foi possível salvar a conferência física. Nenhum item foi gravado.');
    } finally {
      setSalvando(false);
    }
  };

  const enviarRecebimento = async (acao) => {
    if (!numeroNota.trim()) {
      alert('Por favor, preencha o Número da NF antes de salvar.');
      return;
    }

    const incorretosSemNome = conferencia.filter(c => c.conferido && !c.isNaoSolicitado
      && c.statusRecebimento === 'INCORRETO' && !String(c.produtoRecebido || '').trim());
    if (incorretosSemNome.length > 0) {
      alert('Informe o nome do produto recebido nos itens marcados como Produto Errado antes de finalizar.');
      return;
    }

    const itensPendentes = conferencia.filter(c => !c.conferido && !c.isNaoSolicitado);
    if (itensPendentes.length > 0) {
      alert(`Atenção: preencha os valores pendentes e use "Conferir todos os produtos" antes de finalizar. Restam ${itensPendentes.length} itens pendentes.`);
      return;
    }

    const semDestino = getItensSemDestino();
    const qtdSemDestino = semDestino.length;

    const itensParaEnviar = conferencia.filter(c => c.conferido && !c.isNaoSolicitado);

    setSalvando(true);

    let teveProblemas = false;

    const payload = {
      numeroNota: numeroNota.trim(),
      acaoItensFaltantes: acao || null,
      itensNaoSolicitados: montarItensNaoSolicitadosPayload(),
      itens: itensParaEnviar.map(item => {
        const qtdNova = item.quantidadeRecebidaAgora === '' || item.quantidadeRecebidaAgora === undefined
          ? 0
          : (item.quantidadeRecebidaPersistida ? 0 : Number(item.quantidadeRecebidaAgora));

        if (item.statusRecebimento === 'INCORRETO' || item.statusRecebimento === 'AVARIADO' || item.statusRecebimento === 'PROXIMO_VENCIMENTO' ||
            (item.statusRecebimento === 'FALTANTE' && item.foiCobrado)) {
          teveProblemas = true;
        }

        return {
          id: item.id,
          quantidadeReal: (item.quantidadeJaRecebida || 0) + qtdNova,
          quantidadeRecebidaAgora: qtdNova,
          quantidadeAvariadaAgora: item.statusRecebimento === 'AVARIADO'
            ? (item.quantidadeAvariadaPersistida ? 0 : Number(item.quantidadeAvariadaAgora || 0)) : 0,
          valorUnitarioReal: Number(item.valorUnitarioReal),
          statusRecebimento: item.statusRecebimento,
          codigoBarrasRecebido: item.codigoBarrasRecebido || '',
          nomeProdutoRecebido: item.produtoRecebido || '',
          foiCobrado: !!item.foiCobrado,
          observacaoDevolucao: item.statusRecebimento !== 'OK'
            ? (item.statusRecebimento === 'INCORRETO'
                ? montarObservacaoIncorreto(item)
                : (item.foiCobrado
                    ? 'Faturado mas não entregue - Cobrado na nota'
                    : (acao === 'AGUARDAR'
                        ? 'Aguardando entrega - Entrega Parcial'
                        : 'Divergência marcada na conferência cega')))
            : '',
          ...conversaoParaEnvio(item)
        };

      })
    };

    try {
      await api.put(`/api/pedidos/${id}/receber`, payload);

      // Conferência gravada: descarta o cache de preenchimento
      limparCacheConferencia(id);

      if (teveProblemas) {
          const detalhes = [];
          if (acao === 'AGUARDAR') detalhes.push(`${qtdSemDestino} produto(s) faltante(s) ficaram em aguardo (Entrega Parcial).`);
          if (acao === 'RETORNAR_COTACAO' && qtdSemDestino > 0) detalhes.push(`${qtdSemDestino} produto(s) faltante(s) retornaram para a cotação de origem.`);
          const msgDetalhes = detalhes.length > 0 ? `\n\n${detalhes.join('\n')}` : '';
          if (window.confirm(`Conferência salva com sucesso! O sistema identificou que você marcou faltas, avarias ou itens incorretos.${msgDetalhes}\n\nDeseja registrar a devolução / abatimento agora?`)) {
              setShowDevolucaoModal(true);
              return;
          }
      } else if (acao === 'AGUARDAR') {
          alert(`Entrega parcial registrada com sucesso!\n\n${qtdSemDestino} produto(s) ficaram em aguardo e o pedido permanece em "Entrega Parcial".\n\nQuando o volume chegar, finalize a conferência normalmente; se não chegar, confirme a falta para retornar os produtos à cotação de origem automaticamente.`);
      } else if (acao === 'RETORNAR_COTACAO') {
          alert(`Conferência finalizada com sucesso!\n\n${qtdSemDestino} produto(s) retornaram automaticamente para a cotação de origem (ela poderá estar encerrada ou não).`);
      } else {
          alert('Conferência finalizada com sucesso! Todos os itens chegaram corretamente.');
      }

      navigate(`/pedidos/${id}`);
    } catch (error) {
      console.error('Erro ao finalizar conferência:', error);
      alert(error.response?.data?.message || 'Ocorreu um erro ao processar o recebimento do pedido.');
    } finally {
      setSalvando(false);
      setShowModalDestinoFaltantes(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (bloqueadoConferente) {
      alert('A conferência física deste pedido já foi finalizada. Aguarde o ADM liberar a edição.');
      return;
    }
    if (isConferente) {
      salvarConferenciaParcial();
      return;
    }
    if (!numeroNota.trim()) {
      alert('Por favor, preencha o Número da NF antes de salvar.');
      return;
    }
    const itensPendentes = conferencia.filter(c => !c.conferido && !c.isNaoSolicitado);
    if (itensPendentes.length > 0) {
      alert(`Atenção: Você precisa confirmar (conferir) todos os itens individualmente na tabela. Restam ${itensPendentes.length} itens pendentes de conferência.`);
      return;
    }
    if (getItensSemDestino().length > 0) {
      setShowModalDestinoFaltantes(true);
      return;
    }
    enviarRecebimento(null);
  };

  const confirmarDestinoFaltantes = (acao) => {
    setShowModalDestinoFaltantes(false);
    enviarRecebimento(acao);
  };

  // Enter age como Tab: avança para o próximo campo de preenchimento em vez de
  // disparar o envio do formulário (que finalizaria/salvaria a conferência).
  const handleEnterComoTab = (e) => {
    if (e.key !== 'Enter' || e.defaultPrevented) return;
    const alvo = e.target;
    if (!alvo) return;
    // Enter em um botão aciona o próprio botão normalmente.
    if (alvo.tagName === 'BUTTON') return;
    if (alvo.tagName !== 'INPUT' && alvo.tagName !== 'SELECT' && alvo.tagName !== 'TEXTAREA') return;
    // Impede a submissão implícita do formulário (Enter nunca finaliza a conferência).
    e.preventDefault();
    if (alvo.type === 'checkbox' || alvo.type === 'radio' || alvo.type === 'file' || alvo.type === 'submit' || alvo.type === 'image') return;

    const campos = Array.from(e.currentTarget.querySelectorAll('input, select, textarea'))
      .filter(c => !c.disabled && c.type !== 'hidden' && c.getClientRects().length > 0);
    const indice = campos.indexOf(alvo);
    if (indice === -1 || !campos[indice + 1]) return;
    const proximo = campos[indice + 1];
    proximo.focus();
    if (typeof proximo.select === 'function') proximo.select();
  };

  const fMoney = (valor) => {
    if (valor == null) return '-';
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const fDataHora = (dataIso) => !dataIso
    ? '-'
    : new Date(dataIso).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });

  if (loading) return <div className="layout"><Sidebar /><main className="main-content"><p>Carregando...</p></main></div>;
  if (!pedido) return <div className="layout"><Sidebar /><main className="main-content"><p>Pedido não encontrado.</p></main></div>;

  const fornecedorNome = pedido.fornecedor?.nome || pedido.fornecedorNome || 'Fornecedor Desconhecido';
  const isEntregaParcial = pedido.status === 'ENTREGA_PARCIAL';
  const nfAnterior = pedido.numeroNota;

  return (
    <div className="layout conferencia-page">
      <style>{`
        .conferencia-page .conferencia-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 30px;
        }
        .conferencia-page .conferencia-tabela-wrap {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        /* Computador (>768px): apenas os botões dentro da página (Voltar, Cancelar e Salvar). */
        .conferencia-page .conferencia-acoes-mobile {
          display: none;
        }
        @media (max-width: 768px) {
          .conferencia-page .main-content {
            padding: 14px 10px;
            width: 100%;
            max-width: 100%;
            overflow-x: hidden;
            -webkit-text-size-adjust: 100%;
            padding-bottom: 150px;
          }
          .conferencia-page .conferencia-header {
            align-items: stretch;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 18px;
          }
          .conferencia-page .conferencia-header h1 {
            font-size: 20px !important;
            line-height: 1.25;
          }
          .conferencia-page .conferencia-header p {
            font-size: 13px;
          }
          /* Celular: os botões fixos do rodapé substituem os botões dentro da página. */
          .conferencia-page .conferencia-header button {
            display: none !important;
          }
          .conferencia-page .conferencia-card {
            padding: 12px !important;
            border-radius: 8px !important;
          }
          .conferencia-page .conferencia-alerta {
            padding: 10px 12px !important;
            font-size: 12px;
          }
          .conferencia-page .conferencia-tabela-wrap {
            overflow: visible;
          }
          .conferencia-page .conferencia-tabela {
            display: block;
            min-width: 0 !important;
          }
          .conferencia-page .conferencia-tabela thead {
            display: none;
          }
          .conferencia-page .conferencia-tabela tbody,
          .conferencia-page .conferencia-tabela tr,
          .conferencia-page .conferencia-tabela td {
            display: block;
            width: auto !important;
          }
          .conferencia-page .conferencia-tabela tr {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 10px;
            margin-bottom: 12px;
            padding: 8px;
          }
          .conferencia-page .conferencia-tabela td {
            display: grid;
            grid-template-columns: minmax(105px, 38%) 1fr;
            align-items: center;
            gap: 8px;
            padding: 8px 4px !important;
            border-bottom: 1px solid var(--surface-muted);
            text-align: left !important;
          }
          .conferencia-page .conferencia-tabela td:last-child {
            border-bottom: 0;
          }
          .conferencia-page .conferencia-tabela td::before {
            content: attr(data-label);
            color: var(--text-muted);
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
          }
          .conferencia-page .conferencia-tabela td:first-child {
            display: block;
          }
          .conferencia-page .conferencia-tabela td:first-child::before {
            display: none;
          }
          .conferencia-page .conferencia-tabela input,
          .conferencia-page .conferencia-tabela select {
            min-height: 40px;
            font-size: 16px !important;
            -webkit-text-size-adjust: 100%;
          }
          .conferencia-page .conferencia-tabela td:last-child {
            display: flex;
            justify-content: flex-end;
          }
          .conferencia-page .conferencia-tabela td:last-child::before {
            display: none;
          }
          .conferencia-page .conferencia-botoes {
            flex-direction: column-reverse;
            align-items: stretch !important;
          }
          .conferencia-page .conferencia-botoes button {
            width: 100%;
            justify-content: center;
          }
          .conferencia-page .conferencia-botoes-internos {
            display: none !important;
          }
          .conferencia-page .conferencia-acoes-mobile {
            display: flex;
          }
        }
      `}</style>
      <Sidebar />
      <main className="main-content">
        <header className="conferencia-header">
          <div>
            <h1 style={{ fontSize: '24px', marginBottom: '5px' }}>Conferência de Entrega (Cega)</h1>
            <p style={{ color: 'var(--text-muted)' }}>Pedido #{pedido.id} - {fornecedorNome}</p>
          </div>
          <button
            style={styles.btnVoltar}
            onClick={() => navigate(`/pedidos/${id}`)}
          >
            <ArrowLeft size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            Voltar aos Detalhes
          </button>
        </header>

        {pedido.conferenciaIniciadaPor && (
          <div style={{ backgroundColor: 'var(--purple-soft)', border: '1px solid var(--purple-border)', color: 'var(--purple-text)', padding: '14px 18px', borderRadius: '8px', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <strong>Iniciada por {pedido.conferenciaIniciadaPor}</strong>
            {!isConferente && <span style={{ fontSize: '13px' }}>Continuar conferência da nota</span>}
          </div>
        )}

        {pedido.conferenciaFisicaFinalizada && !pedido.conferenciaEdicaoLiberada && (
          <div style={{ backgroundColor: isConferente ? 'var(--warning-soft)' : 'var(--info-soft)', border: `1px solid ${isConferente ? 'var(--warning-border)' : 'var(--info-border)'}`, color: isConferente ? 'var(--warning-text)' : 'var(--info-text)', padding: '14px 18px', borderRadius: '8px', marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <strong>
              Conferência física finalizada
              {pedido.conferenciaFisicaFinalizadaPor ? ` por ${pedido.conferenciaFisicaFinalizadaPor}` : ''}
              {pedido.dataFinalizacaoConferenciaFisica ? ` em ${fDataHora(pedido.dataFinalizacaoConferenciaFisica)}` : ''}.
            </strong>
            <span style={{ fontSize: '13px' }}>
              {isConferente
                ? 'Aguardando a conferência financeira do ADM. A edição está bloqueada até o ADM liberar.'
                : 'Finalize a conferência financeira para concluir o recebimento. Se precisar que o Conferente corrija quantidades, use "Liberar edição" nos detalhes do pedido.'}
            </span>
          </div>
        )}

        {pedido.conferenciaEdicaoLiberada && (
          <div style={{ backgroundColor: 'var(--success-soft)', border: '1px solid var(--success-border)', color: 'var(--success-text)', padding: '14px 18px', borderRadius: '8px', marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <strong>
              Edição liberada pelo ADM
              {pedido.conferenciaEdicaoLiberadaPor ? ` (${pedido.conferenciaEdicaoLiberadaPor})` : ''}
              {pedido.conferenciaEdicaoLiberadaEm ? ` em ${fDataHora(pedido.conferenciaEdicaoLiberadaEm)}` : ''}.
            </strong>
            <span style={{ fontSize: '13px' }}>
              {isConferente
                ? 'Corrija as quantidades necessárias e salve novamente. Após salvar, o pedido volta a aguardar a conferência financeira do ADM.'
                : 'O Conferente pode corrigir as quantidades. Finalize a conferência financeira quando estiver tudo certo.'}
            </span>
          </div>
        )}

        <div className="conferencia-card" style={styles.card}>
          {isEntregaParcial && (
            <div style={{ backgroundColor: 'var(--warning-soft)', borderLeft: '4px solid var(--warning)', padding: '12px 16px', marginBottom: '20px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <Truck size={20} color="var(--warning-text)" />
              <div style={{ flex: 1, fontSize: '14px', color: 'var(--warning-text)' }}>
                <strong>Entrega Parcial em andamento.</strong>
                {nfAnterior && (<span> NF(ns) já registrada(s): <strong>{nfAnterior}</strong>. </span>)}
                <span>Continue lançando o próximo volume abaixo — os itens já totalmente recebidos ficam desabilitados.</span>
              </div>
            </div>
          )}

          <div className="conferencia-alerta" style={{ backgroundColor: 'var(--warning-soft)', borderLeft: '4px solid var(--warning)', padding: '12px 16px', marginBottom: '20px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--warning-text)', fontWeight: '500' }}>
              <strong>Atenção:</strong> {isConferente
                ? 'Informe somente as quantidades recebidas e selecione a condição encontrada no recebimento.'
                : 'Digite a quantidade deste volume e o valor unitário exatamente como constam na NF. Caso haja algum problema com o produto (Falta, Avariado), selecione o Status correto ao lado.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} onKeyDown={handleEnterComoTab}>
            <div style={{ backgroundColor: 'var(--surface-muted)', border: '1px solid var(--border)', padding: '20px', borderRadius: '8px', marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="var(--info)"/> Dados da Nota Fiscal Recebida
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px', color: 'var(--text-secondary)' }}>Número da NF *</label>
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    enterkeyHint="next"
                    placeholder="Ex: 895886"
                    value={numeroNota}
                    onChange={e => setNumeroNota(e.target.value)}
                    disabled={bloqueadoConferente}
                    style={styles.inputTexto}
                  />
                </div>
              </div>
            </div>

            <div className="conferencia-tabela-wrap" style={{ overflowX: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '0 4px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid var(--border-strong)', borderRadius: '7px', padding: '6px 9px', background: 'var(--surface)', flex: '1 1 220px' }}>
                      <Search size={16} color="var(--text-muted)" />
                      <input
                        type="text"
                        value={buscaProduto}
                        onChange={(e) => setBuscaProduto(e.target.value)}
                        placeholder="Buscar produto..."
                        style={{ border: 0, outline: 0, width: '100%', minWidth: 0, fontSize: '14px' }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => requestSort('nomeProduto')}
                      style={{ padding: '8px 10px', background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-strong)', borderRadius: '7px', fontWeight: '600', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <ArrowUpDown size={14} /> {sortConfig.direction === 'asc' ? 'A-Z' : 'Z-A'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500', whiteSpace: 'nowrap' }}>
                      {itensNaoConferidos.length > 0 ? `${itensNaoConferidos.length} pendente(s)` : 'Todos conferidos'}
                    </span>
                  </div>
                </div>
                <table className="conferencia-tabela" style={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ ...styles.th, cursor: 'pointer', userSelect: 'none', minWidth: '200px' }} onClick={() => requestSort('nomeProduto')}>
                        Produto <ArrowUpDown size={14} style={{ verticalAlign: 'middle', marginLeft: '4px', color: 'var(--text-subtle)' }} />
                      </th>
                      <th style={{ ...styles.th, width: '100px', textAlign: 'center', backgroundColor: 'var(--surface-muted)', color: 'var(--text)' }}>Qtd (Pedida)</th>
                      <th style={{ ...styles.th, width: '140px', textAlign: 'center', backgroundColor: 'var(--info-soft)', color: 'var(--info-text)' }}>Já Recebido</th>
                      <th style={{ ...styles.th, width: '130px', textAlign: 'center', backgroundColor: 'var(--success-soft)', color: 'var(--success-text)' }}>Qtd nesta NF</th>
                      {!isConferente && <th style={{ ...styles.th, width: '130px', textAlign: 'center', backgroundColor: 'var(--success-soft)', color: 'var(--success-text)' }}>Unitário (NF)</th>}
                      <th style={{ ...styles.th, width: '220px', textAlign: 'center' }}>Condição / Problema</th>
                      <th style={{ ...styles.th, width: '120px', textAlign: 'center' }}>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itensOrdenados.map((item) => {
                      const confState = conferencia.find(c => c.id === item.id) || {};
                      const isConferido = confState.conferido;
                      const hasProblema = confState.statusRecebimento !== 'OK';
                      const totalmenteRecebido = confState.totalmenteRecebido;
                      const qtdJaRecebida = confState.quantidadeJaRecebida || 0;
                      const isExtra = confState.isNaoSolicitado
                        || (Number(item.quantidadePedida) === 0
                          && !item.itemCotacao
                          && Boolean(confState.produtoRecebido || confState.observacaoIncorreto || confState.codigoBarrasRecebido));

                      // Item "Não Veio" que retornou à cotação: permanece visível,
                      // destacado e sem campos de preenchimento.
                      if (item.retornadoCotacao) {
                        return (
                          <tr key={item.id} style={{ borderBottom: '1px solid var(--danger-border)', backgroundColor: 'var(--danger-soft)' }}>
                            <td data-label="Produto" style={styles.td}>
                              <strong style={{ color: 'var(--danger-text)', display: 'block' }}>{nomeExibicaoProduto(item)}</strong>
                              <div style={{ fontSize: '10px', color: 'var(--danger-text)', backgroundColor: 'var(--danger-soft)', padding: '2px 6px', borderRadius: '4px', marginTop: '4px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px', border: '1px solid var(--danger-border)' }}>
                                <AlertTriangle size={10} /> Não entregue — retornou à cotação de origem
                              </div>
                            </td>
                            <td data-label="Qtd. pedida" style={{ ...styles.td, textAlign: 'center', padding: '10px 6px', color: 'var(--danger-text)', fontWeight: '600' }}>
                              {item.quantidadePedida} un
                            </td>
                            <td data-label="Já recebido" style={{ ...styles.td, textAlign: 'center', padding: '10px 6px', color: 'var(--danger-text)' }}>-</td>
                            <td data-label="Qtd. nesta NF" style={{ ...styles.td, textAlign: 'center', padding: '10px 6px' }}>-</td>
                            {!isConferente && <td data-label="Valor unitário" style={{ ...styles.td, textAlign: 'center', padding: '10px 6px' }}>-</td>}
                            <td data-label="Condição" style={{ ...styles.td, textAlign: 'center', padding: '10px 6px', color: 'var(--danger-text)', fontWeight: 'bold' }}>Não Veio</td>
                            <td data-label="Ação" style={{ ...styles.td, textAlign: 'center' }}>
                              <span style={{ padding: '6px 10px', backgroundColor: 'var(--danger-soft)', color: 'var(--danger-text)', border: '1px solid var(--danger-border)', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                                Não entregue
                              </span>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <Fragment key={item.id}>
                        <tr style={{ borderBottom: '1px solid var(--surface-muted)', backgroundColor: totalmenteRecebido ? 'var(--success-soft)' : (isConferido ? 'var(--success-soft)' : 'var(--surface)'), transition: 'background-color 0.3s' }}>
                          <td data-label="Produto" style={styles.td}>
                            <strong style={{ color: totalmenteRecebido ? 'var(--success-text)' : 'var(--text)', display: 'block' }}>
                              {nomeExibicaoProduto(item)}
                            </strong>
                            {isExtra && (
                              <div style={{ marginTop: '4px' }}>
                                <div style={{ fontSize: '10px', color: 'var(--purple-text)', backgroundColor: 'var(--purple-soft)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px', border: '1px solid var(--purple-border)' }}>
                                  <Tag size={10} /> Não Solicitado
                                </div>
                                {(confState.codigoBarrasRecebido || confState.codigoDnaRecebido || confState.observacaoIncorreto) && (
                                  <div style={{ fontSize: '11px', color: 'var(--purple-text)', marginTop: '4px', lineHeight: 1.4, wordBreak: 'break-word' }}>
                                    {confState.codigoBarrasRecebido && <div>Código: {confState.codigoBarrasRecebido}</div>}
                                    {confState.codigoDnaRecebido && <div>Código DNA: {confState.codigoDnaRecebido}</div>}
                                    {confState.observacaoIncorreto && <div>Obs.: {confState.observacaoIncorreto}</div>}
                                  </div>
                                )}
                              </div>
                            )}
                            {item.condicaoAplicada && (
                              <div style={{ fontSize: '10px', color: 'var(--success-text)', backgroundColor: 'var(--success-soft)', padding: '2px 6px', borderRadius: '4px', marginTop: '4px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px', border: '1px solid var(--success-border)' }}>
                                <Tag size={10} /> Condição: {item.qtdCondicao} un por {fMoney(item.precoCondicao)}
                              </div>
                            )}
                            {totalmenteRecebido && (
                              <div style={{ fontSize: '10px', color: 'var(--success-text)', backgroundColor: 'var(--success-border)', padding: '2px 6px', borderRadius: '4px', marginTop: '4px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Package size={10} /> Totalmente recebido
                              </div>
                            )}
                            {Number(confState.fatorConversao) > 1 && (
                              <div style={{ fontSize: '10px', color: 'var(--purple-text)', backgroundColor: 'var(--purple-soft)', padding: '2px 6px', borderRadius: '4px', marginTop: '4px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px', border: '1px solid var(--purple-border)' }}>
                                <Package size={10} /> Conversão: {item.quantidadePedida} un pedidas
                                {' '}{confState.sentidoConversao === 'DIVIDIR' ? '÷' : '×'} {confState.fatorConversao}
                                {' '}= {quantidadeEsperadaItem(confState)} un físicas
                              </div>
                            )}
                            {!isExtra && !totalmenteRecebido && !isConferido && !confState.quantidadeRecebidaPersistida
                              && !bloqueadoConferente && Number(item.quantidadePedida) > 0 && (
                              <div>
                                <button
                                  type="button"
                                  onClick={() => abrirConversao(item.id)}
                                  style={{ marginTop: '4px', padding: '2px 8px', fontSize: '10px', fontWeight: 'bold', color: 'var(--purple-text)', backgroundColor: 'var(--purple-soft)', border: '1px solid var(--purple-border)', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                  title="Converter a unidade pedida (pacote/caixa) em unidades físicas"
                                >
                                  <ArrowUpDown size={10} /> Converter unidades
                                </button>
                              </div>
                            )}
                          </td>

                          <td data-label="Qtd. pedida" style={{ ...styles.td, textAlign: 'center', padding: '10px 6px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                            {item.quantidadePedida} un
                            {Number(confState.fatorConversao) > 1 && (
                              <div style={{ fontSize: '10px', color: 'var(--purple-text)', fontWeight: 'bold', marginTop: '2px' }}>
                                → {quantidadeEsperadaItem(confState)} un físicas
                              </div>
                            )}
                          </td>

                          <td data-label="Já recebido" style={{ ...styles.td, textAlign: 'center', padding: '10px 6px', backgroundColor: 'var(--info-soft)', color: 'var(--info-text)', fontWeight: 'bold' }}>
                            {qtdJaRecebida > 0 ? `${qtdJaRecebida} de ${quantidadeEsperadaItem(confState)}` : '-'}
                          </td>

                          <td data-label="Qtd. nesta NF" style={{ ...styles.td, textAlign: 'center', padding: '10px 6px' }}>
                            <input
                              type="number"
                              min="0"
                              inputMode="numeric"
                              enterkeyHint="next"
                              disabled={totalmenteRecebido || isConferido || confState.quantidadeRecebidaPersistida}
                              style={{ ...styles.inputField, backgroundColor: (totalmenteRecebido || isConferido || confState.quantidadeRecebidaPersistida) ? 'transparent' : 'var(--success-soft)', borderColor: (totalmenteRecebido || isConferido || confState.quantidadeRecebidaPersistida) ? 'transparent' : 'var(--border-strong)' }}
                              placeholder="0"
                              value={confState.quantidadeRecebidaAgora ?? ''}
                              onChange={(e) => handleInputChange(item.id, 'quantidadeRecebidaAgora', e.target.value)}
                            />
                          </td>

                          {!isConferente && <td data-label="Valor unitário" style={{ ...styles.td, textAlign: 'center', padding: '10px 6px' }}>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              inputMode="decimal"
                              enterkeyHint="next"
                              disabled={isConferente || isConferido}
                              placeholder="0,00"
                              style={{ ...styles.inputField, backgroundColor: (isConferente || isConferido) ? 'transparent' : 'var(--success-soft)', borderColor: (isConferente || isConferido) ? 'transparent' : 'var(--border-strong)' }}
                              value={confState.valorUnitarioReal ?? ''}
                              onChange={(e) => handleInputChange(item.id, 'valorUnitarioReal', e.target.value)}
                            />
                          </td>}

                          <td data-label="Condição" style={{ ...styles.td, textAlign: 'center', padding: '10px 6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', border: `1px solid ${hasProblema ? 'var(--danger-border)' : 'var(--border-strong)'}`, borderRadius: '6px', padding: '2px', backgroundColor: hasProblema ? 'var(--danger-soft)' : 'var(--surface)' }}>
                                {hasProblema && <AlertTriangle size={16} color="var(--danger)" style={{ marginLeft: '6px' }} />}
                                <select
                                    disabled={totalmenteRecebido || isConferido}
                                    style={{ width: '100%', padding: '8px', border: 'none', background: 'transparent', outline: 'none', color: hasProblema ? 'var(--danger-text)' : 'var(--text-secondary)', fontWeight: hasProblema ? 'bold' : 'normal', cursor: (totalmenteRecebido || isConferido) ? 'not-allowed' : 'pointer' }}
                                    value={confState.statusRecebimento || 'OK'}
                                    onChange={(e) => handleInputChange(item.id, 'statusRecebimento', e.target.value)}
                                >
                                    <option value="OK">Tudo Certo</option>
                                    <option value="FALTANTE">Não Veio (Falta)</option>
                                    <option value="INCORRETO">Produto Errado</option>
                                    <option value="AVARIADO">Avariado / Quebrado</option>
                                    <option value="PROXIMO_VENCIMENTO">Próximo do Vencimento</option>
                                </select>
                            </div>
                          </td>

                          <td data-label="Ação" style={{ ...styles.td, textAlign: 'center' }}>
                            {bloqueadoConferente ? (
                              <span style={{ padding: '6px 10px', backgroundColor: 'var(--surface-muted)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                                Somente leitura
                              </span>
                            ) : totalmenteRecebido && confState.statusRecebimento === 'OK'
                              && (isConferente || confState.valorUnitarioReal !== '' && confState.valorUnitarioReal != null) ? (
                              <span style={{ padding: '6px 10px', backgroundColor: 'var(--success-soft)', color: 'var(--success-text)', border: '1px solid var(--success-border)', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                                <Check size={14} /> OK
                              </span>
                            ) : isConferido ? (
                              <button
                                type="button"
                                onClick={() => toggleConferido(item.id)}
                                style={{ backgroundColor: 'var(--danger-soft)', color: 'var(--danger-text)', border: '1px solid var(--danger-border)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 'bold', width: '100%', justifyContent: 'center' }}
                              >
                                <Edit2 size={14} /> Editar
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => toggleConferido(item.id)}
                                style={{ backgroundColor: 'var(--success)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 'bold', width: '100%', justifyContent: 'center', boxShadow: '0 1px 2px rgba(16, 185, 129, 0.3)' }}
                              >
                                <Check size={14} /> Conferir
                              </button>
                            )}
                          </td>
                        </tr>
                        {confState.conversaoAberta && !bloqueadoConferente && (
                          <tr key={`${item.id}-conversao`} style={{ borderBottom: '1px solid var(--surface-muted)', backgroundColor: 'var(--purple-soft)' }}>
                            <td colSpan={isConferente ? 6 : 7} style={{ padding: '12px 14px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', color: 'var(--purple-text)', fontSize: '13px' }}>
                                <strong style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Package size={14} /> Converter unidades — unidade pedida (pacote/caixa) ↔ unidade física
                                </strong>
                                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                  <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontWeight: 600 }}>
                                    Sentido da conversão
                                    <select
                                      value={confState.sentidoConversao || 'MULTIPLICAR'}
                                      onChange={(e) => handleInputChange(item.id, 'sentidoConversao', e.target.value)}
                                      style={{ ...styles.inputField, width: '240px', backgroundColor: 'var(--surface)', borderColor: 'var(--purple-border)', color: 'var(--purple-text)', textAlign: 'left' }}
                                    >
                                      <option value="MULTIPLICAR">Multiplicar (1 pedida = N físicas)</option>
                                      <option value="DIVIDIR">Dividir (N pedidas = 1 física)</option>
                                    </select>
                                  </label>
                                  <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontWeight: 600 }}>
                                    Fator de conversão
                                    <input
                                      type="number"
                                      min="2"
                                      step="1"
                                      inputMode="numeric"
                                      enterkeyHint="next"
                                      value={confState.fatorConversao ?? ''}
                                      onChange={(e) => handleInputChange(item.id, 'fatorConversao', e.target.value)}
                                      style={{ ...styles.inputField, width: '100px', backgroundColor: 'var(--surface)', borderColor: 'var(--purple-border)', color: 'var(--purple-text)' }}
                                    />
                                  </label>
                                </div>
                                {(() => {
                                  const calc = calcularConversao(
                                    confState.quantidadePedida,
                                    confState.fatorConversao,
                                    confState.sentidoConversao
                                  );
                                  if (!calc.valido) {
                                    return (
                                      <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--warning-border)', borderRadius: '8px', padding: '10px 12px', color: 'var(--warning-text)' }}>
                                        {calc.erro}
                                      </div>
                                    );
                                  }
                                  const valorFisico = valorUnitarioFisico({
                                    ...confState,
                                    fatorConversao: calc.fator,
                                    sentidoConversao: calc.sentido
                                  });
                                  return (
                                    <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--purple-border)', borderRadius: '8px', padding: '10px 12px', lineHeight: 1.7 }}>
                                      <div>
                                        <strong>Quantidade:</strong> {calc.quantidadePedida} un pedidas
                                        {' '}{calc.sentido === 'MULTIPLICAR' ? '×' : '÷'} {calc.fator}
                                        {' '}= <strong>{calc.quantidadeEsperada} un físicas</strong>
                                      </div>
                                      {!isConferente && (
                                        <>
                                          <div><strong>Valor por unidade pedida (fornecedor):</strong> {fMoney(confState.valorUnitarioPedido)}</div>
                                          <div><strong>Valor por unidade física:</strong> <strong>{fMoney(valorFisico)}</strong></div>
                                        </>
                                      )}
                                    </div>
                                  );
                                })()}
                                <p style={{ margin: 0, fontSize: '11px', color: 'var(--purple-text)' }}>
                                  {isConferente
                                    ? 'A conversão altera apenas a quantidade esperada em unidades físicas. Os valores financeiros são conferidos pelo ADM.'
                                    : 'A conversão preenche a quantidade e o valor por unidade física. Confira os valores acima e ajuste o valor real da NF se necessário.'}
                                </p>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                  <button
                                    type="button"
                                    onClick={() => aplicarConversaoItem(item.id)}
                                    style={{ padding: '8px 14px', backgroundColor: 'var(--purple)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                  >
                                    <Check size={14} /> Aplicar conversão
                                  </button>
                                  {Number(confState.fatorConversao) > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removerConversao(item.id)}
                                      style={{ padding: '8px 14px', backgroundColor: 'var(--danger-soft)', color: 'var(--danger-text)', border: '1px solid var(--danger-border)', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
                                    >
                                      Remover conversão
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => abrirConversao(item.id)}
                                    style={{ padding: '8px 14px', backgroundColor: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--border-strong)', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                        {confState.statusRecebimento === 'AVARIADO' && (
                          <tr key={`${item.id}-qtd-avariada`} style={{ borderBottom: '1px solid var(--surface-muted)', backgroundColor: 'var(--warning-soft)' }}>
                            <td colSpan={isConferente ? 6 : 7} style={{ padding: '8px 14px' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--warning-text)', fontWeight: '600' }}>
                                Quantidade avariada nesta NF:
                                <input
                                  type="number"
                                  min="1"
                                  inputMode="numeric"
                                  enterkeyHint="next"
                                  max={Number(confState.quantidadeRecebidaAgora || confState.quantidadeJaRecebida) || 0}
                                  value={confState.quantidadeAvariadaAgora ?? ''}
                                  onChange={(e) => handleInputChange(item.id, 'quantidadeAvariadaAgora', e.target.value)}
                                  disabled={isConferido || confState.quantidadeAvariadaPersistida}
                                  style={{ ...styles.inputField, width: '90px', backgroundColor: (isConferido || confState.quantidadeAvariadaPersistida) ? 'transparent' : 'var(--surface)', borderColor: 'var(--warning)' }}
                                />
                                <span style={{ fontWeight: 'normal' }}>de {confState.quantidadeRecebidaAgora || confState.quantidadeJaRecebida || 0} recebida(s)</span>
                              </label>
                            </td>
                          </tr>
                        )}
                        {confState.statusRecebimento === 'PROXIMO_VENCIMENTO' && (
                          <tr key={`${item.id}-proximo-vencimento`} style={{ borderBottom: '1px solid var(--surface-muted)', backgroundColor: 'var(--warning-soft)' }}>
                            <td colSpan={isConferente ? 6 : 7} style={{ padding: '8px 14px' }}>
                              <FotosConferencia
                                pedidoId={id}
                                itemPedidoId={item.id}
                                ocorrencia="PROXIMO_VENCIMENTO"
                                fotos={fotos}
                                somenteLeitura={isConferido}
                                onUploaded={adicionarFoto}
                              />
                            </td>
                          </tr>
                        )}
                        {confState.statusRecebimento === 'INCORRETO' && (
                          <tr key={`${item.id}-incorreto`} style={{ borderBottom: '1px solid var(--surface-muted)', backgroundColor: 'var(--warning-soft)' }}>
                            <td colSpan={isConferente ? 6 : 7} style={{ padding: '8px 14px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <IdentificacaoProdutoRecebido
                                  codigo={confState.codigoBarrasRecebido || ''}
                                  codigoDna={confState.codigoDnaRecebido || ''}
                                  nome={confState.produtoRecebido || ''}
                                  observacao={confState.observacaoIncorreto || ''}
                                  onCampo={(campo, valor) => handleInputChange(item.id, campo, valor)}
                                  disabled={totalmenteRecebido || isConferido}
                                  cameraPermitida={itemCameraAberta === item.id}
                                  onSolicitarCamera={() => setItemCameraAberta(item.id)}
                                  onFecharCamera={() => setItemCameraAberta(prev => (prev === item.id ? null : prev))}
                                />
                                <FotosConferencia pedidoId={id} itemPedidoId={item.id} ocorrencia="PRODUTO_INCORRETO" fotos={fotos} onUploaded={adicionarFoto} />
                              </div>
                            </td>
                          </tr>
                        )}
                        {confState.statusRecebimento === 'AVARIADO' && (
                          <tr key={`${item.id}-avariado`} style={{ borderBottom: '1px solid var(--surface-muted)', backgroundColor: 'var(--warning-soft)' }}>
                            <td colSpan={isConferente ? 6 : 7} style={{ padding: '8px 14px' }}>
                              <FotosConferencia
                                pedidoId={id}
                                itemPedidoId={item.id}
                                ocorrencia="AVARIA"
                                fotos={fotos}
                                somenteLeitura={totalmenteRecebido || isConferido}
                                onUploaded={adicionarFoto}
                              />
                            </td>
                          </tr>
                        )}
                        {confState.isNaoSolicitado && (
                          <tr key={`${item.id}-fotos`} style={{ borderBottom: '1px solid var(--surface-muted)', backgroundColor: 'var(--purple-soft)' }}>
                            <td colSpan={isConferente ? 6 : 7} style={{ padding: '8px 14px' }}>
                              <FotosConferencia pedidoId={id} ocorrencia="PRODUTO_NAO_SOLICITADO" fotos={fotos} onUploaded={adicionarFoto} />
                            </td>
                          </tr>
                        )}
                        {confState.statusRecebimento === 'FALTANTE' && !totalmenteRecebido && (
                          <tr key={`${item.id}-faltante`} style={{ borderBottom: '1px solid var(--surface-muted)', backgroundColor: 'var(--warning-soft)' }}>
                            <td colSpan={7} style={{ padding: '8px 14px' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--warning-text)', fontWeight: '500' }}>
                                <input
                                  type="checkbox"
                                  checked={confState.foiCobrado || false}
                                  disabled={totalmenteRecebido || isConferido}
                                  onChange={(e) => handleInputChange(item.id, 'foiCobrado', e.target.checked)}
                                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--warning)' }}
                                />
                                Foi cobrado na nota fiscal (sem entrega)
                              </label>
                            </td>
                          </tr>
                        )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
            </div>

            {!bloqueadoConferente && (
              <div style={{ marginBottom: '20px' }}>
                <button
                  type="button"
                  onClick={() => { setItemCameraAberta(null); setShowProdutoNaoSolicitadoModal(true); }}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: 'var(--purple)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Package size={16} /> Produto Não Solicitado (veio mas não era do pedido)
                </button>
              </div>
            )}

            <ModalProdutoNaoSolicitado
              isOpen={showProdutoNaoSolicitadoModal}
              onClose={() => setShowProdutoNaoSolicitadoModal(false)}
              onConfirm={adicionarProdutosNaoSolicitados}
              ocultarValor={isConferente}
              itensExistentes={conferencia.filter(c => c.isNaoSolicitado
                || (Number(c.quantidadePedida) === 0 && !c.itemCotacao))}
            />

            <div className="conferencia-botoes" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginTop: '30px', padding: '20px 0', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {bloqueadoConferente
                  ? 'Conferência física finalizada — somente leitura até o ADM liberar a edição.'
                  : `${itensHabilitados.length} item(ns) ainda pendente(s) de recebimento.`}
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {!bloqueadoConferente && itensNaoConferidos.length > 0 && (
                  <button
                    type="button"
                    onClick={conferirTodos}
                    style={{ width: '100%', padding: '10px 14px', backgroundColor: 'var(--success)', color: 'white', border: 'none', borderRadius: '7px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', boxShadow: '0 1px 2px rgba(16, 185, 129, 0.3)' }}
                  >
                    <Check size={15} /> Conferir todos os produtos
                  </button>
                )}
                <div className="conferencia-botoes-internos" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => navigate(`/pedidos/${id}`)}
                    style={styles.btnCancelar}
                    disabled={salvando}
                  >
                    {bloqueadoConferente ? 'Voltar aos detalhes' : 'Cancelar'}
                  </button>
                  {!bloqueadoConferente && (
                    <button
                      type="submit"
                      style={{...styles.btnSalvar, opacity: salvando ? 0.7 : 1}}
                      disabled={salvando}
                    >
                      <CheckCircle size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                      {salvando ? 'Salvando...' : (isConferente ? 'Salvar conferência física' : 'Finalizar e Gravar Conferência')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
      <div className="conferencia-acoes-mobile" style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 80,
        padding: '10px 12px calc(10px + env(safe-area-inset-bottom))',
        backgroundColor: 'rgba(255, 255, 255, 0.97)',
        borderTop: '1px solid var(--border-strong)',
        boxShadow: '0 -3px 12px rgba(15, 23, 42, 0.14)',
        gap: '8px'
      }}>
        <button
          type="button"
          onClick={() => navigate(`/pedidos/${id}`)}
          disabled={salvando}
          style={{ ...styles.btnCancelar, flex: bloqueadoConferente ? 1 : '0 0 38%', padding: '12px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
        >
          <ArrowLeft size={17} /> Voltar
        </button>
        {!bloqueadoConferente && (
          <button
            type="button"
            onClick={() => document.querySelector('.conferencia-page form')?.requestSubmit()}
            disabled={salvando}
            style={{ ...styles.btnSalvar, flex: 1, justifyContent: 'center', padding: '12px 8px', opacity: salvando ? 0.7 : 1 }}
          >
            <CheckCircle size={17} />
            {salvando ? 'Salvando...' : (isConferente ? 'Salvar conferência' : 'Finalizar conferência')}
          </button>
        )}
      </div>
      {showModalDestinoFaltantes && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '560px', maxHeight: 'calc(100dvh - 32px)', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--warning-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={20} /> Produtos faltantes — defina o destino
              </h3>
              <button onClick={() => !salvando && setShowModalDestinoFaltantes(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '18px', fontWeight: 'bold' }}>
                ✕
              </button>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              Os produtos abaixo <strong>não foram recebidos integralmente</strong> e ainda não foram cobrados. Antes de finalizar, escolha uma das opções:
            </p>

            <ul style={{ backgroundColor: 'var(--warning-soft)', border: '1px solid var(--warning-border)', borderRadius: '8px', padding: '12px 12px 12px 32px', margin: '0 0 16px 0', maxHeight: '200px', overflowY: 'auto' }}>
              {getItensSemDestino().map(c => (
                <li key={c.id} style={{ fontSize: '13px', color: 'var(--warning-text)', padding: '3px 0' }}>{getNomeItemConferencia(c)}</li>
              ))}
            </ul>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={() => confirmarDestinoFaltantes('RETORNAR_COTACAO')}
                disabled={salvando}
                style={{ padding: '12px 16px', backgroundColor: 'var(--warning)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: salvando ? 'wait' : 'pointer', textAlign: 'left', opacity: salvando ? 0.7 : 1 }}
              >
                Retornar para a Cotação de Origem
                <div style={{ fontSize: '11px', fontWeight: '400', marginTop: '2px' }}>
                  Os produtos voltam para a cotação de origem (encerrada ou não) e esta conferência é finalizada.
                </div>
              </button>
              <button
                type="button"
                onClick={() => confirmarDestinoFaltantes('AGUARDAR')}
                disabled={salvando}
                style={{ padding: '12px 16px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: salvando ? 'wait' : 'pointer', textAlign: 'left', opacity: salvando ? 0.7 : 1 }}
              >
                Aguardar Produto(s) — Gerar Entrega Parcial
                <div style={{ fontSize: '11px', fontWeight: '400', marginTop: '2px' }}>
                  O pedido fica em "Entrega Parcial"; depois você recebe o volume restante ou confirma a falta.
                </div>
              </button>
              <button
                type="button"
                onClick={() => !salvando && setShowModalDestinoFaltantes(false)}
                disabled={salvando}
                style={{ padding: '10px 16px', backgroundColor: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--border-strong)', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: salvando ? 'wait' : 'pointer', alignSelf: 'flex-end' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showDevolucaoModal && (
        <DevolucaoModal
          pedidoId={id}
          itensNaoSolicitados={conferencia.filter(c => c.isNaoSolicitado)}
          onClose={() => setShowDevolucaoModal(false)}
          onSuccess={() => {
            setShowDevolucaoModal(false);
            carregarPedido();
          }}
        />
      )}
    </div>
  );
}

const styles = {
  card: { backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px' },
  th: { textAlign: 'left', padding: '14px', borderBottom: '2px solid var(--border)', color: 'var(--text-secondary)', fontSize: '13px' },
  td: { padding: '14px', color: 'var(--text-secondary)', fontSize: '14px' },
  inputTexto: { padding: '10px 12px', border: '1px solid var(--border-strong)', borderRadius: '6px', fontSize: '14px', width: '100%', outline: 'none', color: 'var(--text)', boxSizing: 'border-box' },
  inputField: { padding: '8px', border: '1px solid var(--border-strong)', borderRadius: '6px', fontSize: '14px', width: '100%', textAlign: 'center', outline: 'none', fontWeight: 'bold', color: 'var(--success-text)', transition: 'all 0.2s' },
  btnVoltar: { padding: '10px 20px', backgroundColor: 'var(--text-muted)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center' },
  btnCancelar: { padding: '12px 24px', backgroundColor: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--border-strong)', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' },
  btnSalvar: { padding: '12px 24px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)' }
};