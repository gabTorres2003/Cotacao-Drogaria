import { describe, it, expect } from 'vitest';
import {
  nomeExibicaoProduto,
  separarItensConferencia,
  baseFracionamento,
  calcularFracionamento,
  montarItemRecebido,
  mesclarCacheNaConferencia,
  calcularResumoDivergencias
} from './conferenciaUtils';

// ---------------------------------------------------------------------------
// Ajuste 1 — NF e divergências visíveis antes da finalização da conferência
// ---------------------------------------------------------------------------
describe('Ajuste 1: resumo de divergências antes da finalização', () => {
  it('conta faltas, avarias, incorretos e próximos do vencimento', () => {
    const itens = [
      { statusRecebimento: 'FALTANTE' },
      { statusRecebimento: 'FALTANTE' },
      { statusRecebimento: 'AVARIADO' },
      { statusRecebimento: 'INCORRETO' },
      { statusRecebimento: 'PROXIMO_VENCIMENTO' },
      { statusRecebimento: 'OK' }
    ];
    const resumo = calcularResumoDivergencias(itens);

    expect(resumo).toMatchObject({ faltas: 2, avarias: 1, incorretos: 1, vencimentos: 1 });
    expect(resumo.total).toBe(5);
    expect(resumo.lista).toBe('2 falta(s) | 1 avariado(s) | 1 incorreto(s) | 1 próximo(s) do vencimento');
  });

  it('conta como falta o item sem status mas com quantidade recebida menor que a pedida', () => {
    const resumo = calcularResumoDivergencias([
      { statusRecebimento: null, quantidadeReal: 3, quantidadePedida: 10 }
    ]);
    expect(resumo.faltas).toBe(1);
    expect(resumo.total).toBe(1);
  });

  it('retorna zero e lista vazia quando não há divergências', () => {
    const resumo = calcularResumoDivergencias([
      { statusRecebimento: 'OK', quantidadeReal: 10, quantidadePedida: 10 }
    ]);
    expect(resumo.total).toBe(0);
    expect(resumo.lista).toBe('');
    expect(calcularResumoDivergencias([]).total).toBe(0);
    expect(calcularResumoDivergencias(null).total).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Ajuste 2 — Fracionamento de produtos na conferência
// ---------------------------------------------------------------------------
describe('Ajuste 2: fracionamento de produtos', () => {
  it('divide o valor unitário e multiplica a quantidade preservando o total', () => {
    const calc = calcularFracionamento(10, 10.0, 2, 2);
    expect(calc.valido).toBe(true);
    expect(calc.novoVlrUnitario).toBe(5.0);
    expect(calc.novaQuantidade).toBe(20);
    expect(calc.totalOriginal).toBe(100.0);
    expect(calc.totalFracionado).toBe(100.0);
    expect(calc.diferenca).toBe(0);
  });

  it('sinaliza diferença de arredondamento quando o total não fecha exatamente', () => {
    // 3 un × R$ 10,00 = R$ 30,00 → 9 un × R$ 3,33 = R$ 29,97
    const calc = calcularFracionamento(3, 10.0, 3, 3);
    expect(calc.valido).toBe(true);
    expect(calc.novoVlrUnitario).toBe(3.33);
    expect(calc.novaQuantidade).toBe(9);
    expect(calc.totalOriginal).toBe(30.0);
    expect(calc.totalFracionado).toBe(29.97);
    expect(calc.diferenca).toBeCloseTo(0.03, 2);
  });

  it('rejeita partes e fator que não sejam inteiros maiores que zero', () => {
    expect(calcularFracionamento(10, 10, 0, 2).valido).toBe(false);
    expect(calcularFracionamento(10, 10, -2, 2).valido).toBe(false);
    expect(calcularFracionamento(10, 10, 1.5, 2).valido).toBe(false);
    expect(calcularFracionamento(10, 10, 'abc', 2).valido).toBe(false);
    expect(calcularFracionamento(10, 10, 2, 0).valido).toBe(false);
    expect(calcularFracionamento(10, 10, 2, -1).valido).toBe(false);
    expect(calcularFracionamento(10, 10, '', '').valido).toBe(false);
  });

  it('rejeita quantidade base ausente ou menor/igual a zero', () => {
    expect(calcularFracionamento(0, 10, 2, 2).valido).toBe(false);
    expect(calcularFracionamento(-5, 10, 2, 2).valido).toBe(false);
    expect(calcularFracionamento('', 10, 2, 2).valido).toBe(false);
    expect(calcularFracionamento(NaN, 10, 2, 2).valido).toBe(false);
  });

  it('rejeita valor unitário base ausente ou menor/igual a zero', () => {
    expect(calcularFracionamento(10, 0, 2, 2).valido).toBe(false);
    expect(calcularFracionamento(10, -1, 2, 2).valido).toBe(false);
    expect(calcularFracionamento(10, '', 2, 2).valido).toBe(false);
    expect(calcularFracionamento(10, null, 2, 2).valido).toBe(false);
  });

  it('rejeita fracionamento que zeraria o valor unitário', () => {
    const calc = calcularFracionamento(1, 0.01, 100, 1);
    expect(calc.valido).toBe(false);
    expect(calc.erro).toContain('zerado');
  });

  it('retorna mensagem de erro clara para cada inválida', () => {
    expect(calcularFracionamento(10, 10, 0, 2).erro).toContain('inteiros');
    expect(calcularFracionamento(0, 10, 2, 2).erro).toContain('quantidade');
    expect(calcularFracionamento(10, 0, 2, 2).erro).toContain('valor unitário');
  });

  it('usa quantidade pedida e valor previsto quando nada foi informado', () => {
    const base = baseFracionamento({ quantidadePedida: 12, valorUnitarioPedido: 8.5, quantidadeRecebidaAgora: '', valorUnitarioReal: '' });
    expect(base).toEqual({ qtdBase: 12, vlrBase: 8.5 });
  });

  it('prioriza quantidade e valor já informados na base de cálculo', () => {
    const base = baseFracionamento({ quantidadePedida: 12, valorUnitarioPedido: 8.5, quantidadeRecebidaAgora: 24, valorUnitarioReal: 4.25 });
    expect(base).toEqual({ qtdBase: 24, vlrBase: 4.25 });
  });

  it('persiste o valor unitário fracionado no envio da conferência parcial', () => {
    const payload = montarItemRecebido({
      id: 10,
      quantidadeRecebidaAgora: 50,
      quantidadeAvariadaAgora: 0,
      valorUnitarioReal: 2.0,
      statusRecebimento: 'OK',
      codigoBarrasRecebido: '',
      produtoRecebido: ''
    }, '');
    expect(payload.valorUnitarioReal).toBe(2.0);
    expect(payload.quantidadeRecebidaAgora).toBe(50);
  });

  it('não envia valor unitário quando nada foi informado', () => {
    const payload = montarItemRecebido({
      id: 10,
      quantidadeRecebidaAgora: '',
      valorUnitarioReal: '',
      statusRecebimento: 'OK'
    }, '');
    expect(payload.valorUnitarioReal).toBeUndefined();
    expect(payload.quantidadeRecebidaAgora).toBe(0);
  });

  it('preserva a marcação de fracionamento ao restaurar o cache após recarregar a página', () => {
    const base = [{
      id: 10,
      quantidadePedida: 10,
      valorUnitarioPedido: 10.0,
      quantidadeRecebidaAgora: '',
      valorUnitarioReal: '',
      fracionado: false,
      fracaoPartes: '',
      fracaoFator: ''
    }];
    const cache = {
      conferencia: [{
        id: 10,
        conferido: true,
        quantidadeRecebidaAgora: 50,
        valorUnitarioReal: 2.0,
        fracionado: true,
        fracaoPartes: 5,
        fracaoFator: 5
      }]
    };

    const restaurada = mesclarCacheNaConferencia(base, cache, true);
    expect(restaurada).toHaveLength(1);
    expect(restaurada[0]).toMatchObject({
      quantidadeRecebidaAgora: 50,
      valorUnitarioReal: 2.0,
      fracionado: true,
      fracaoPartes: 5,
      fracaoFator: 5,
      fracionarAberto: false
    });
  });
});

// ---------------------------------------------------------------------------
// Ajuste 3 — Produtos aceitos por sugestão de troca
// ---------------------------------------------------------------------------
describe('Ajuste 3: identificação de substitutos (troca)', () => {
  it('exibe "Substituto (Original)" quando o nome do pedido difere do ItemCotacao', () => {
    const item = {
      nomeProduto: 'Paracetamol 750mg 20 comprimidos',
      itemCotacao: { nomeProduto: 'Dipirona 500mg 10 comprimidos' }
    };
    expect(nomeExibicaoProduto(item)).toBe(
      'Paracetamol 750mg 20 comprimidos (Dipirona 500mg 10 comprimidos)'
    );
  });

  it('exibe apenas o nome quando pedido e cotação são o mesmo produto', () => {
    const item = {
      nomeProduto: 'Dipirona 500mg',
      itemCotacao: { nomeProduto: ' dipirona 500mg ' }
    };
    expect(nomeExibicaoProduto(item)).toBe('Dipirona 500mg');
  });

  it('exibe o nome do ItemCotacao quando o item de pedido não tem nome próprio', () => {
    expect(nomeExibicaoProduto({ itemCotacao: { nomeProduto: 'Ibuprofeno 600mg' } }))
      .toBe('Ibuprofeno 600mg');
  });

  it('usa o fallback quando não há nenhum nome disponível', () => {
    expect(nomeExibicaoProduto({})).toBe('Produto Desconhecido');
    expect(nomeExibicaoProduto(null, 'Produto sem nome')).toBe('Produto sem nome');
    expect(nomeExibicaoProduto(undefined)).toBe('Produto Desconhecido');
  });
});

// ---------------------------------------------------------------------------
// Ajuste 4 — Itens "Não Veio" permanecem visíveis no pedido
// ---------------------------------------------------------------------------
describe('Ajuste 4: itens retornados à cotação ("Não Veio")', () => {
  it('separa os itens retornados dos que participam da conferência', () => {
    const itens = [
      { id: 1, nomeProduto: 'A' },
      { id: 2, nomeProduto: 'B', retornadoCotacao: true },
      { id: 3, nomeProduto: 'C' },
      { id: 4, nomeProduto: 'D', retornadoCotacao: true }
    ];
    const { editaveis, naoEntregues } = separarItensConferencia(itens);

    expect(editaveis.map(i => i.id)).toEqual([1, 3]);
    expect(naoEntregues.map(i => i.id)).toEqual([2, 4]);
  });

  it('trata itens sem a marcação como editáveis (compatibilidade com dados antigos)', () => {
    const { editaveis, naoEntregues } = separarItensConferencia([{ id: 1 }, { id: 2 }]);
    expect(editaveis).toHaveLength(2);
    expect(naoEntregues).toHaveLength(0);
  });

  it('não quebra com entrada vazia ou nula', () => {
    expect(separarItensConferencia([])).toEqual({ editaveis: [], naoEntregues: [] });
    expect(separarItensConferencia(null)).toEqual({ editaveis: [], naoEntregues: [] });
    expect(separarItensConferencia(undefined)).toEqual({ editaveis: [], naoEntregues: [] });
  });
});
