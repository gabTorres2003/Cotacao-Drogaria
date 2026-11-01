import { useRef, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import api from '../services/api';

/**
 * Pesquisa de produtos no DNA por descrição ou princípio ativo.
 *
 * Componente compartilhado pelos fluxos do Cotação que já consultavam o DNA
 * por código/EAN e agora também permitem localizar o produto pelo nome.
 * A consulta é executada sempre no backend (`/api/produtos/pesquisar`), que
 * fala com o DNA/Firebird; o navegador não acessa o banco.
 *
 * Não seleciona nada automaticamente: o item só é aplicado quando o usuário
 * clica no resultado.
 */

const TIPOS = [
  { id: 'descricao', rotulo: 'Descrição do produto' },
  { id: 'principio', rotulo: 'Princípio ativo' },
];

const estiloCampo = {
  flex: '1 1 180px',
  minWidth: 0,
  padding: '9px 12px',
  borderRadius: '6px',
  border: '1px solid var(--border-strong)',
  fontSize: '13px',
  boxSizing: 'border-box',
  outline: 'none',
  backgroundColor: 'var(--surface)',
};

const estiloBotao = (desabilitado) => ({
  padding: '9px 14px',
  borderRadius: '6px',
  border: 'none',
  backgroundColor: desabilitado ? 'var(--text-subtle)' : 'var(--info)',
  color: 'white',
  fontWeight: 'bold',
  fontSize: '13px',
  cursor: desabilitado ? 'not-allowed' : 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  minHeight: '38px',
});

const estiloAba = (ativa) => ({
  padding: '6px 10px',
  borderRadius: '999px',
  border: `1px solid ${ativa ? 'var(--info)' : 'var(--border-strong)'}`,
  backgroundColor: ativa ? 'var(--primary-soft)' : 'var(--surface)',
  color: ativa ? 'var(--primary-hover)' : 'var(--text-muted)',
  cursor: 'pointer',
  fontSize: '11px',
  fontWeight: '700',
  minHeight: '30px',
});

const textoSecundario = (item) =>
  [item.principioAtivo, item.apresentacao, item.fabricante].filter(Boolean).join(' · ') ||
  'Sem informações complementares';

export default function PesquisaProdutoDna({
  onSelecionar,
  rotulo = 'Buscar por nome no DNA',
  desabilitado = false,
}) {
  const [tipo, setTipo] = useState('descricao');
  const [termo, setTermo] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [resultados, setResultados] = useState([]);
  const [truncado, setTruncado] = useState(false);
  const [pesquisou, setPesquisou] = useState(false);
  const emAndamentoRef = useRef(false);

  const limparResultados = () => {
    setResultados([]);
    setTruncado(false);
    setPesquisou(false);
    setErro('');
  };

  const pesquisar = async () => {
    // Enter repetido não dispara outra requisição enquanto a anterior roda.
    if (emAndamentoRef.current) return;

    const texto = termo.trim();

    limparResultados();

    if (texto.length < 2) {
      setErro('Informe pelo menos 2 caracteres para pesquisar.');
      return;
    }

    emAndamentoRef.current = true;
    setCarregando(true);
    try {
      const resposta = await api.get('/api/produtos/pesquisar', {
        params: { q: texto, tipo },
      });

      const encontrados = Array.isArray(resposta.data?.resultados)
        ? resposta.data.resultados
        : [];

      setResultados(encontrados);
      setTruncado(Boolean(resposta.data?.truncado));
      setPesquisou(true);
    } catch (falha) {
      const status = falha.response?.status;
      const mensagemApi = falha.response?.data?.mensagem;

      if (status === 400 && mensagemApi) {
        setErro(String(mensagemApi));
      } else if (status === 503) {
        setErro('Consulta ao DNA indisponível. Tente novamente em instantes.');
      } else {
        setErro('Não foi possível pesquisar no DNA agora. Tente novamente ou informe o produto manualmente.');
      }
    } finally {
      emAndamentoRef.current = false;
      setCarregando(false);
    }
  };

  const selecionar = (item) => {
    if (!item) return;
    onSelecionar?.(item);
    setResultados([]);
    setTruncado(false);
    setPesquisou(false);
    setErro('');
  };

  const podePesquisar = !desabilitado && termo.trim().length >= 2;

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '12px',
        backgroundColor: 'var(--surface-muted)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Search size={14} color="var(--info)" />
        <strong style={{ fontSize: '12px', color: 'var(--text)' }}>{rotulo}</strong>
      </div>

      <div role="group" aria-label="Tipo de pesquisa no DNA" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {TIPOS.map((opcao) => (
          <button
            key={opcao.id}
            type="button"
            aria-pressed={tipo === opcao.id}
            onClick={() => {
              setTipo(opcao.id);
              limparResultados();
            }}
            style={estiloAba(tipo === opcao.id)}
            disabled={desabilitado}
          >
            {opcao.rotulo}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <input
          type="text"
          autoComplete="off"
          aria-label={tipo === 'descricao' ? 'Descrição do produto no DNA' : 'Princípio ativo no DNA'}
          value={termo}
          onChange={(evento) => {
            setTermo(evento.target.value);
            if (pesquisou || erro) limparResultados();
          }}
          onKeyDown={(evento) => {
            if (evento.key === 'Enter') {
              evento.preventDefault();
              pesquisar();
            }
          }}
          placeholder={
            tipo === 'descricao' ? 'Ex.: dipirona 500mg' : 'Ex.: dipirona sódica'
          }
          maxLength={40}
          disabled={desabilitado}
          style={estiloCampo}
        />
        <button
          type="button"
          onClick={pesquisar}
          disabled={!podePesquisar || carregando}
          style={estiloBotao(!podePesquisar || carregando)}
        >
          {carregando ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          {carregando ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
        Pesquisa no DNA, com poucos resultados ordenados por relevância. Pressione Enter para buscar.
      </span>

      {erro && (
        <div role="alert" style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--danger-border)', backgroundColor: 'var(--danger-soft)', color: 'var(--danger-text)', fontSize: '12px' }}>
          {erro}
        </div>
      )}

      {carregando && (
        <div role="status" aria-live="polite" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Pesquisando produtos no DNA...
        </div>
      )}

      {!carregando && !erro && pesquisou && resultados.length === 0 && (
        <div style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--warning-border)', backgroundColor: 'var(--warning-soft)', color: 'var(--warning-text)', fontSize: '12px' }}>
          Nenhum produto encontrado no DNA. Tente outro termo ou use a busca por código.
        </div>
      )}

      {resultados.length > 0 && (
        <ul
          aria-label="Resultados da pesquisa no DNA"
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            maxHeight: '260px',
            overflowY: 'auto',
          }}
        >
          {resultados.map((item) => (
            <li key={`${item.codigo}-${item.codbarras || ''}`}>
              <button
                type="button"
                onClick={() => selecionar(item)}
                style={{
                  width: '100%',
                  minWidth: 0,
                  textAlign: 'left',
                  padding: '8px 10px',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  backgroundColor: 'var(--surface)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
              >
                <strong style={{ fontSize: '12px', color: 'var(--text)', lineHeight: 1.35 }}>
                  {item.descricao || 'Produto sem descrição'}
                  {item.inativo === 'S' ? ' (inativo no DNA)' : ''}
                </strong>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{textoSecundario(item)}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
                  Código DNA: {item.codigo ?? '-'} · EAN: {item.codbarras || '-'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {truncado && (
        <div style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--warning-border)', backgroundColor: 'var(--warning-soft)', color: 'var(--warning-text)', fontSize: '12px' }}>
          Existem mais resultados do que os exibidos. Refine a pesquisa para encontrar o produto certo.
        </div>
      )}
    </div>
  );
}
