// Funções puras compartilhadas entre as telas de pedido e conferência.
// Mantidas fora dos componentes para facilitar testes (vitest) e reuso.

/**
 * Identificação exibida do produto no pedido/conferência.
 * Produtos aceitos por sugestão de troca são gravados no pedido com o nome do
 * substituto e vinculados ao ItemCotacao do produto original solicitado na
 * cotação: nesses casos a identificação exibida é "Substituto (Original)".
 */
export const nomeExibicaoProduto = (item, fallback = 'Produto Desconhecido') => {
  const nome = item?.nomeProduto || item?.itemCotacao?.nomeProduto || null;
  const nomeOriginal = item?.itemCotacao?.nomeProduto || null;
  if (nome && nomeOriginal && nome.trim().toLowerCase() !== nomeOriginal.trim().toLowerCase()) {
    return `${nome} (${nomeOriginal})`;
  }
  return nome || fallback;
};

/**
 * Separa os itens do pedido entre os que participam da conferência (editáveis)
 * e os que retornaram à cotação de origem ("Não Veio"), que permanecem
 * visíveis apenas em modo de leitura, destacados como "Não entregue".
 */
export const separarItensConferencia = (itens = []) => ({
  editaveis: (itens || []).filter(item => !item?.retornadoCotacao),
  naoEntregues: (itens || []).filter(item => !!item?.retornadoCotacao)
});

/**
 * Base de cálculo do fracionamento: usa a quantidade recebida informada (ou a
 * quantidade pedida) e o valor unitário já informado (ou o valor previsto).
 */
export const baseFracionamento = (item) => {
  const qtdInformada = item?.quantidadeRecebidaAgora;
  const qtdBase = (qtdInformada === '' || qtdInformada === undefined || qtdInformada === null)
    ? Number(item?.quantidadePedida || 0)
    : Number(qtdInformada);
  const vlrBase = (item?.valorUnitarioReal !== '' && item?.valorUnitarioReal != null && Number(item.valorUnitarioReal) > 0)
    ? Number(item.valorUnitarioReal)
    : Number(item?.valorUnitarioPedido || 0);
  return {
    qtdBase: Number.isFinite(qtdBase) && qtdBase > 0 ? qtdBase : 0,
    vlrBase: Number.isFinite(vlrBase) && vlrBase > 0 ? vlrBase : 0
  };
};

/**
 * Valida e calcula o fracionamento de um item da conferência:
 * valor unitário ÷ partes e quantidade × fator, preservando o valor total
 * (com tolerância de arredondamento em centavos).
 *
 * Retorna { valido: false, erro } quando a entrada é inválida e
 * { valido: true, ...valores } quando pode ser aplicado.
 */
export const calcularFracionamento = (qtdBase, vlrBase, partes, fator) => {
  const p = Number(partes);
  const f = Number(fator);
  if (!Number.isInteger(p) || p <= 0 || !Number.isInteger(f) || f <= 0) {
    return {
      valido: false,
      erro: 'Informe números inteiros maiores que zero para as partes e para o fator de multiplicação.'
    };
  }

  const q = Number(qtdBase);
  if (!Number.isFinite(q) || q <= 0) {
    return { valido: false, erro: 'Informe a quantidade recebida antes de fracionar o produto.' };
  }

  const v = Number(vlrBase);
  if (!Number.isFinite(v) || v <= 0) {
    return { valido: false, erro: 'Não é possível dividir o valor unitário: nenhum valor base informado.' };
  }

  const novoVlrUnitario = Math.round((v / p) * 100) / 100;
  if (novoVlrUnitario <= 0) {
    return { valido: false, erro: 'O valor unitário fracionado ficaria zerado. Reduza o número de partes.' };
  }

  const novaQuantidade = q * f;
  const totalOriginal = Math.round(q * v * 100) / 100;
  const totalFracionado = Math.round(novaQuantidade * novoVlrUnitario * 100) / 100;
  const diferenca = Math.abs(totalFracionado - totalOriginal);

  return {
    valido: true,
    partes: p,
    fator: f,
    novoVlrUnitario,
    novaQuantidade,
    totalOriginal,
    totalFracionado,
    diferenca
  };
};

/**
 * Monta o item enviado na conferência parcial. Persiste o valor unitário
 * informado (ex.: fracionamento) para que a conferência física não perca
 * essa informação.
 */
export const montarItemRecebido = (item, observacaoDevolucao) => ({
  id: item.id,
  quantidadeRecebidaAgora: item.quantidadeRecebidaAgora === '' || item.quantidadeRecebidaAgora === undefined
    ? 0 : Number(item.quantidadeRecebidaAgora),
  quantidadeAvariadaAgora: item.statusRecebimento === 'AVARIADO'
    ? Number(item.quantidadeAvariadaAgora || 0) : 0,
  valorUnitarioReal: Number.isFinite(Number(item.valorUnitarioReal)) && Number(item.valorUnitarioReal) > 0
    ? Number(item.valorUnitarioReal)
    : undefined,
  statusRecebimento: item.statusRecebimento,
  codigoBarrasRecebido: item.codigoBarrasRecebido || '',
  nomeProdutoRecebido: item.produtoRecebido || '',
  observacaoDevolucao
});

/**
 * Restaura o preenchimento da conferência a partir do cache local (após
 * atualização/falha da página), preservando também as marcações de
 * fracionamento (quantidade, valor unitário, partes e fator).
 */
export const mesclarCacheNaConferencia = (base, cache, isConferente) => {
  const porId = {};
  (cache?.conferencia || []).forEach(c => { porId[String(c.id)] = c; });

  const mesclada = (base || []).map(item => {
    const c = porId[String(item.id)];
    if (!c) return item;
    const valorMesclado = c.valorUnitarioReal !== undefined
      ? c.valorUnitarioReal
      : item.valorUnitarioReal;
    return {
      ...item,
      quantidadeRecebidaAgora: c.quantidadeRecebidaAgora !== undefined ? c.quantidadeRecebidaAgora : item.quantidadeRecebidaAgora,
      quantidadeRecebidaPersistida: item.quantidadeRecebidaPersistida,
      quantidadeAvariada: c.quantidadeAvariada !== undefined ? c.quantidadeAvariada : item.quantidadeAvariada,
      quantidadeAvariadaAgora: c.quantidadeAvariadaAgora !== undefined
        ? c.quantidadeAvariadaAgora
        : (c.quantidadeAvariada !== undefined ? c.quantidadeAvariada : item.quantidadeAvariadaAgora),
      quantidadeAvariadaPersistida: item.quantidadeAvariadaPersistida,
      valorUnitarioReal: c.valorUnitarioReal !== undefined ? c.valorUnitarioReal : item.valorUnitarioReal,
      statusRecebimento: c.statusRecebimento || item.statusRecebimento,
      conferido: isConferente
        ? !!c.conferido
        : !!c.conferido
          && (valorMesclado != null && Number(valorMesclado) > 0),
      produtoRecebido: c.produtoRecebido || '',
      codigoBarrasRecebido: c.codigoBarrasRecebido || '',
      codigoDnaRecebido: c.codigoDnaRecebido || '',
      observacaoIncorreto: c.observacaoIncorreto || '',
      foiCobrado: !!c.foiCobrado,
      classificacaoNaoSolicitado: c.classificacaoNaoSolicitado,
      fracionado: !!c.fracionado,
      fracaoPartes: c.fracaoPartes ?? '',
      fracaoFator: c.fracaoFator ?? '',
      fracionarAberto: false
    };
  });

  const extrasCache = (cache?.conferencia || []).filter(c => c.isNaoSolicitado);
  return [...mesclada, ...extrasCache];
};

/**
 * Resumo das divergências registradas durante a conferência, útil para exibir
 * o número da NF e as divergências antes da finalização.
 */
export const calcularResumoDivergencias = (itens = []) => {
  const resumo = (itens || []).reduce((acc, item) => {
    if (item.statusRecebimento === 'AVARIADO') acc.avarias++;
    else if (item.statusRecebimento === 'INCORRETO') acc.incorretos++;
    else if (item.statusRecebimento === 'PROXIMO_VENCIMENTO') acc.vencimentos++;
    else if (item.statusRecebimento === 'FALTANTE'
      || (item.statusRecebimento == null && item.quantidadeReal != null
        && item.quantidadePedida != null && item.quantidadeReal < item.quantidadePedida)) acc.faltas++;
    return acc;
  }, { faltas: 0, avarias: 0, incorretos: 0, vencimentos: 0 });

  const total = resumo.faltas + resumo.avarias + resumo.incorretos + resumo.vencimentos;
  const lista = [
    resumo.faltas > 0 ? `${resumo.faltas} falta(s)` : null,
    resumo.avarias > 0 ? `${resumo.avarias} avariado(s)` : null,
    resumo.incorretos > 0 ? `${resumo.incorretos} incorreto(s)` : null,
    resumo.vencimentos > 0 ? `${resumo.vencimentos} próximo(s) do vencimento` : null
  ].filter(Boolean).join(' | ');

  return { ...resumo, total, lista };
};
