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

// --- Conversão entre unidade pedida (pacote/caixa) e unidade física ----------
// MULTIPLICAR: 1 unidade pedida contém N unidades físicas.
// DIVIDIR: N unidades pedidas formam 1 unidade física (divisão exata).
// O backend valida e recalcula tudo; estas funções servem para pré-visualização
// e para montar o payload sem duplicar regra de negócio.

export const SENTIDOS_CONVERSAO = ['MULTIPLICAR', 'DIVIDIR'];

export const calcularConversao = (quantidadePedida, fator, sentido) => {
  const q = Number(quantidadePedida);
  const f = Number(fator);
  const s = String(sentido || '').toUpperCase();

  if (!Number.isInteger(f) || f <= 1) {
    return { valido: false, erro: 'Informe um fator de conversão inteiro maior que 1.' };
  }
  if (!SENTIDOS_CONVERSAO.includes(s)) {
    return { valido: false, erro: 'Escolha o sentido da conversão: multiplicar ou dividir.' };
  }
  if (!Number.isFinite(q) || q <= 0) {
    return { valido: false, erro: 'A quantidade pedida precisa ser maior que zero para converter.' };
  }
  if (s === 'DIVIDIR' && q % f !== 0) {
    return {
      valido: false,
      erro: `A quantidade pedida (${q}) não é divisível pelo fator (${f}). Ajuste o fator para uma divisão exata.`
    };
  }

  const quantidadeEsperada = s === 'MULTIPLICAR' ? q * f : q / f;
  return {
    valido: true,
    sentido: s,
    fator: f,
    quantidadePedida: q,
    quantidadeEsperada
  };
};

/**
 * Quantidade esperada em unidades físicas, considerando a conversão persistida.
 * Sem conversão, a quantidade pedida já é a referência física.
 */
export const quantidadeEsperadaItem = (item) => {
  const informada = Number(item?.quantidadeEsperada);
  if (Number.isFinite(informada) && informada > 0) return informada;

  const calc = calcularConversao(item?.quantidadePedida, item?.fatorConversao, item?.sentidoConversao);
  if (calc.valido) return calc.quantidadeEsperada;

  const pedida = Number(item?.quantidadePedida);
  return Number.isFinite(pedida) && pedida > 0 ? pedida : 0;
};

/**
 * Valor unitário previsto por unidade física. O valor gravado no pedido é por
 * unidade pedida (pacote/caixa); a conversão deriva o valor físico.
 */
export const valorUnitarioFisico = (item) => {
  const base = Number(item?.valorUnitarioPedido);
  if (!Number.isFinite(base) || base <= 0) return 0;

  const fator = Number(item?.fatorConversao);
  const sentido = String(item?.sentidoConversao || '').toUpperCase();
  if (!Number.isInteger(fator) || fator <= 1) return base;

  if (sentido === 'MULTIPLICAR') return Math.round((base / fator) * 100) / 100;
  if (sentido === 'DIVIDIR') return Math.round((base * fator) * 100) / 100;
  return base;
};

/** Campos de conversão que devem ser enviados ao backend (ou undefined). */
export const conversaoParaEnvio = (item) => {
  const fator = Number(item?.fatorConversao);
  const sentido = String(item?.sentidoConversao || '').toUpperCase();
  if (!Number.isInteger(fator) || fator < 1) {
    return { fatorConversao: undefined, sentidoConversao: undefined };
  }
  if (fator === 1) {
    // Fator 1 é o contrato usado para remover uma conversão persistida.
    return { fatorConversao: 1, sentidoConversao: 'MULTIPLICAR' };
  }
  if (!SENTIDOS_CONVERSAO.includes(sentido)) {
    return { fatorConversao: undefined, sentidoConversao: undefined };
  }
  return { fatorConversao: fator, sentidoConversao: sentido };
};

/**
 * Monta o item enviado na conferência parcial.
 * `incluirValorFinanceiro: false` garante que o Conferente nunca persista
 * valores financeiros, mesmo que o estado local contenha algum resquício.
 */
export const montarItemRecebido = (item, observacaoDevolucao, opcoes = {}) => {
  const incluirValorFinanceiro = opcoes.incluirValorFinanceiro !== false;
  const valor = Number(item?.valorUnitarioReal);
  const payload = {
    id: item.id,
    quantidadeRecebidaAgora: item.quantidadeRecebidaAgora === '' || item.quantidadeRecebidaAgora === undefined
      ? 0 : Number(item.quantidadeRecebidaAgora),
    quantidadeAvariadaAgora: item.statusRecebimento === 'AVARIADO'
      ? Number(item.quantidadeAvariadaAgora || 0) : 0,
    statusRecebimento: item.statusRecebimento,
    codigoBarrasRecebido: item.codigoBarrasRecebido || '',
    nomeProdutoRecebido: item.produtoRecebido || '',
    observacaoDevolucao,
    ...conversaoParaEnvio(item)
  };

  if (incluirValorFinanceiro) {
    payload.valorUnitarioReal = Number.isFinite(valor) && valor > 0 ? valor : undefined;
  }
  return payload;
};

/** Normaliza nome de produto para comparação de duplicidade. */
export const normalizarNomeProduto = (nome) => String(nome || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim()
  .replace(/\s+/g, ' ');

/** Chaves usadas para detectar produto repetido (EAN e nome). */
export const chavesProdutoNaoSolicitado = (item) => {
  const chaves = [];
  const digitos = String(item?.codigoBarrasRecebido || '').replace(/\D/g, '');
  if (digitos) chaves.push(`EAN:${digitos}`);
  const nome = normalizarNomeProduto(item?.nomeProduto || item?.nomeProdutoRecebido);
  if (nome) chaves.push(`NOME:${nome}`);
  return chaves;
};

/**
 * Retorna os nomes dos produtos repetidos no lote ou já existentes na
 * conferência. A mesma regra é aplicada no backend antes de gravar.
 */
export const encontrarDuplicadosNaoSolicitados = (novos = [], existentes = []) => {
  const vistos = new Set();
  (existentes || []).forEach(item => {
    chavesProdutoNaoSolicitado(item).forEach(chave => vistos.add(chave));
  });

  const duplicados = [];
  (novos || []).forEach((item, indice) => {
    const chaves = chavesProdutoNaoSolicitado(item);
    const repetido = chaves.some(chave => vistos.has(chave));
    if (repetido) {
      duplicados.push(item?.nomeProduto || `Item ${indice + 1}`);
    }
    chaves.forEach(chave => vistos.add(chave));
  });
  return duplicados;
};

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
      fatorConversao: c.fatorConversao ?? item.fatorConversao ?? '',
      sentidoConversao: c.sentidoConversao ?? item.sentidoConversao ?? 'MULTIPLICAR',
      quantidadeEsperada: c.quantidadeEsperada ?? item.quantidadeEsperada ?? '',
      conversaoAberta: false,
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
