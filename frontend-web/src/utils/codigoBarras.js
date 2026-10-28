import { Html5QrcodeSupportedFormats as Formatos } from 'html5-qrcode';

// Formatos efetivamente usados nas etiquetas da operação. Restringir os
// formatos aumenta a precisão e reduz leituras aleatórias de outros códigos.
export const FORMATOS_LEITURA = [
  Formatos.EAN_13,
  Formatos.EAN_8,
  Formatos.UPC_A,
  Formatos.UPC_E,
  Formatos.CODE_128,
  Formatos.CODE_39,
  Formatos.ITF
];

const NOMES_FORMATO = {
  [Formatos.EAN_13]: 'EAN-13',
  [Formatos.EAN_8]: 'EAN-8',
  [Formatos.UPC_A]: 'UPC-A',
  [Formatos.UPC_E]: 'UPC-E',
  [Formatos.CODE_128]: 'Code 128',
  [Formatos.CODE_39]: 'Code 39',
  [Formatos.ITF]: 'ITF'
};

export const nomeFormato = (formato) => NOMES_FORMATO[formato] || 'Código';

export const apenasDigitos = (valor) => /^\d+$/.test(String(valor || ''));

const calcularDigitoMod10 = (corpo) => {
  let soma = 0;
  for (let i = 0; i < corpo.length; i++) {
    const peso = (corpo.length - i) % 2 === 1 ? 3 : 1;
    soma += Number(corpo[i]) * peso;
  }
  return (10 - (soma % 10)) % 10;
};

// Confere o dígito verificador GS1 (EAN-8, UPC-A, EAN-13, GTIN-14).
export const validarDigitoGs1 = (codigo) => {
  if (!apenasDigitos(codigo) || codigo.length < 2) return false;
  const corpo = codigo.slice(0, -1);
  return calcularDigitoMod10(corpo) === Number(codigo.slice(-1));
};

// UPC-E é a forma comprimida do UPC-A: expandimos para validar o mesmo
// dígito verificador, sem alterar o código que será enviado ao backend.
const expandirUpcE = (codigo) => {
  if (!/^\d{8}$/.test(codigo)) return null;
  const d = codigo.split('').map(Number);
  const [n, s1, s2, s3, s4, s5, s6] = d;
  let corpo;
  if (s6 <= 2) corpo = `${n}${s1}${s2}${s6}0000${s3}${s4}${s5}`;
  else if (s6 === 3) corpo = `${n}${s1}${s2}${s3}00000${s4}${s5}`;
  else if (s6 === 4) corpo = `${n}${s1}${s2}${s3}${s4}00000${s5}`;
  else corpo = `${n}${s1}${s2}${s3}${s4}${s5}0000${s6}`;
  return `${corpo}${d[7]}`;
};

const falha = (motivo) => ({ valido: false, motivo });

const sucesso = (codigo, formato) => ({
  valido: true,
  codigo,
  formatoNome: nomeFormato(formato)
});

const FALHA_DIGITO = 'Dígito verificador inválido. Aproxime o código e tente novamente.';

/**
 * Valida a leitura antes de consultar o produto.
 * Retorna o código exatamente como foi lido (sem converter para número,
 * preservando zeros à esquerda).
 */
export const validarCodigoLido = (codigoBruto, formato) => {
  const codigo = String(codigoBruto ?? '').trim();
  if (!codigo) return falha('Nenhum código foi lido. Tente novamente.');

  switch (formato) {
    case Formatos.EAN_13:
      if (!/^\d{13}$/.test(codigo)) return falha('O EAN-13 lido não tem 13 dígitos.');
      return validarDigitoGs1(codigo) ? sucesso(codigo, formato) : falha(FALHA_DIGITO);

    case Formatos.EAN_8:
      if (!/^\d{8}$/.test(codigo)) return falha('O EAN-8 lido não tem 8 dígitos.');
      return validarDigitoGs1(codigo) ? sucesso(codigo, formato) : falha(FALHA_DIGITO);

    case Formatos.UPC_A:
      if (!/^\d{12}$/.test(codigo)) return falha('O UPC-A lido não tem 12 dígitos.');
      return validarDigitoGs1(codigo) ? sucesso(codigo, formato) : falha(FALHA_DIGITO);

    case Formatos.UPC_E: {
      if (!/^\d{8}$/.test(codigo)) return falha('O UPC-E lido não tem 8 dígitos.');
      const expandido = expandirUpcE(codigo);
      return expandido && validarDigitoGs1(expandido)
        ? sucesso(codigo, formato)
        : falha(FALHA_DIGITO);
    }

    case Formatos.CODE_128:
      if (codigo.length < 4 || codigo.length > 48) return falha('Código Code 128 fora do tamanho esperado.');
      if (!/^[\x20-\x7E]+$/.test(codigo)) return falha('O código lido contém caracteres inválidos.');
      return sucesso(codigo, formato);

    case Formatos.CODE_39:
      if (!/^[A-Z0-9\-. $/+%]+$/.test(codigo)) return falha('O código lido contém caracteres inválidos.');
      return sucesso(codigo, formato);

    case Formatos.ITF:
      if (!apenasDigitos(codigo) || codigo.length % 2 !== 0 || codigo.length < 6 || codigo.length > 14) {
        return falha('Código ITF fora do padrão.');
      }
      if ((codigo.length === 12 || codigo.length === 14) && !validarDigitoGs1(codigo)) {
        return falha(FALHA_DIGITO);
      }
      return sucesso(codigo, formato);

    default: {
      // Sem informação de formato: aplica validação por tamanho, sem
      // completar nem alterar o código.
      if (apenasDigitos(codigo)) {
        if ([8, 12, 13, 14].includes(codigo.length) && !validarDigitoGs1(codigo)) {
          return falha(FALHA_DIGITO);
        }
        if (codigo.length >= 4 && codigo.length <= 48) {
          return { valido: true, codigo, formatoNome: 'Código numérico' };
        }
        return falha('Código numérico fora do tamanho esperado.');
      }
      if (codigo.length >= 4 && codigo.length <= 48 && /^[\x20-\x7E]+$/.test(codigo)) {
        return { valido: true, codigo, formatoNome: 'Código' };
      }
      return falha('Formato de código não reconhecido.');
    }
  }
};
