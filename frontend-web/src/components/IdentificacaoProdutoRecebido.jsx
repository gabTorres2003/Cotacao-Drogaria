import { useEffect, useRef, useState } from 'react';
import api from '../services/api';
import LeitorCodigoBarras from './LeitorCodigoBarras';
import { validarCodigoLido } from '../utils/codigoBarras';
import { Barcode, Camera, CheckCircle2, Keyboard, MessageSquare, PackageSearch, PencilLine, Pill, Search, X } from 'lucide-react';

const estiloOpcao = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '12px',
  border: '1px solid #fbbf24',
  borderRadius: '8px',
  background: 'white',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: '600',
  color: '#92400e',
  textAlign: 'left',
  minHeight: '48px',
  flex: '1 1 200px'
};

const estiloBotaoSecundario = {
  padding: '8px 11px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  background: 'white',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '12px',
  fontWeight: '600',
  color: '#374151',
  minHeight: '40px'
};

const estiloPainel = {
  padding: '10px',
  border: '1px solid #fde68a',
  borderRadius: '8px',
  backgroundColor: '#fffdf5'
};

const estiloCampo = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '14px',
  backgroundColor: 'white',
  boxSizing: 'border-box'
};

const estiloAba = (ativa) => ({
  padding: '8px 10px',
  border: `1px solid ${ativa ? '#f59e0b' : '#d1d5db'}`,
  borderRadius: '6px',
  background: ativa ? '#fef3c7' : 'white',
  color: ativa ? '#92400e' : '#475569',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  fontSize: '12px',
  fontWeight: '600',
  flex: '1 1 160px',
  justifyContent: 'center',
  minHeight: '40px'
});

export default function IdentificacaoProdutoRecebido({
  codigo = '',
  nome = '',
  observacao = '',
  codigoDna = '',
  onCampo = () => {},
  disabled = false,
  cameraPermitida = false,
  onSolicitarCamera,
  onFecharCamera
}) {
  const temDados = Boolean(String(codigo).trim() || String(codigoDna).trim() || String(nome).trim());
  const [modo, setModo] = useState(temDados ? 'RESUMO' : null);
  const [tipoCodigo, setTipoCodigo] = useState('EAN');
  const [observacoesAbertas, setObservacoesAbertas] = useState(Boolean(String(observacao).trim()));
  const [consultando, setConsultando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [termoTexto, setTermoTexto] = useState('');
  const [buscandoTexto, setBuscandoTexto] = useState(false);
  const [resultadosTexto, setResultadosTexto] = useState([]);
  const [truncadoTexto, setTruncadoTexto] = useState(false);
  const codigoAceitoRef = useRef(false);
  const emAndamentoRef = useRef({ codigo: false, texto: false });
  const onFecharCameraRef = useRef(onFecharCamera);

  useEffect(() => {
    onFecharCameraRef.current = onFecharCamera;
  }, [onFecharCamera]);

  useEffect(() => {
    if (!disabled) return;
    if (modo === 'CAMERA') {
      onFecharCameraRef.current?.();
    }
    const alvo = temDados ? 'RESUMO' : null;
    if (modo !== alvo) setModo(alvo);
  }, [disabled, modo, temDados]);

  useEffect(() => {
    if (disabled) return;
    if (modo === 'CAMERA' && !cameraPermitida) {
      setModo(temDados ? 'RESUMO' : null);
    }
  }, [cameraPermitida, modo, temDados, disabled]);

  const valorEan = String(codigo || '');
  const valorDna = String(codigoDna || '');

  const abrirCamera = () => {
    if (disabled) return;
    onSolicitarCamera?.();
    setResultado(null);
    setModo('CAMERA');
  };

  const fecharCamera = () => {
    onFecharCamera?.();
    if (codigoAceitoRef.current) {
      codigoAceitoRef.current = false;
      return;
    }
    setModo(temDados ? 'RESUMO' : null);
  };

  const consultarCodigo = async (valor, tipo) => {
    const codigoTexto = String(valor ?? '').trim();
    if (!codigoTexto) {
      setResultado({ tipo: 'erro', texto: 'Informe o código para consultar.' });
      return;
    }

    if (tipo === 'EAN') {
      const validacao = validarCodigoLido(codigoTexto);
      if (!validacao.valido) {
        setResultado({ tipo: 'erro', texto: validacao.motivo });
        return;
      }
    }

    // Enter repetido não dispara outra consulta enquanto a anterior roda.
    if (emAndamentoRef.current.codigo) return;

    setConsultando(true);
    emAndamentoRef.current.codigo = true;
    setResultado(null);
    try {
      const resposta = await api.get('/api/produtos/buscar', {
        params: { q: codigoTexto, tipo }
      });
      const produto = resposta.data || {};
      const nomeEncontrado = produto.nome || produto.descricao || produto.name || '';

      if (tipo === 'DNA') {
        onCampo('codigoDnaRecebido', codigoTexto);
        if (produto.codbarras) onCampo('codigoBarrasRecebido', String(produto.codbarras));
      } else {
        onCampo('codigoBarrasRecebido', codigoTexto);
      }

      if (nomeEncontrado) {
        onCampo('produtoRecebido', nomeEncontrado);
      }

      setResultado({ tipo: 'sucesso', produto, nome: nomeEncontrado, consultadoComo: tipo });
    } catch (erro) {
      if (erro.response?.status === 404) {
        setResultado({
          tipo: 'nao_encontrado',
          texto: 'Código não encontrado no DNA. Informe o nome do produto recebido manualmente.'
        });
      } else {
        setResultado({
          tipo: 'erro',
          texto: 'Não foi possível consultar o DNA agora. Informe o nome do produto recebido manualmente.'
        });
      }
    } finally {
      emAndamentoRef.current.codigo = false;
      setConsultando(false);
    }
  };

  const buscarPorTexto = async () => {
    const termo = termoTexto.trim();
    if (termo.length < 2) {
      setResultado({ tipo: 'erro', texto: 'Informe pelo menos 2 caracteres para pesquisar.' });
      return;
    }

    // Enter repetido não dispara outra consulta enquanto a anterior roda.
    if (emAndamentoRef.current.texto) return;

    setBuscandoTexto(true);
    emAndamentoRef.current.texto = true;
    setResultado(null);
    setResultadosTexto([]);
    setTruncadoTexto(false);
    try {
      const resposta = await api.get('/api/produtos/pesquisar', {
        params: { q: termo, tipo: tipoCodigo === 'PRINCIPIO' ? 'principio' : 'descricao' }
      });
      const resultados = Array.isArray(resposta.data?.resultados) ? resposta.data.resultados : [];
      setResultadosTexto(resultados);
      setTruncadoTexto(Boolean(resposta.data?.truncado));
      if (resultados.length === 0) {
        setResultado({
          tipo: 'nao_encontrado',
          texto: 'Nenhum produto encontrado no DNA para esta pesquisa. Tente outro termo ou informe o nome manualmente.'
        });
      }
    } catch (erro) {
      setResultado({
        tipo: 'erro',
        texto: erro.response?.status === 503
          ? 'Consulta ao DNA indisponível. Tente novamente em instantes.'
          : 'Não foi possível pesquisar no DNA agora. Informe o nome do produto recebido manualmente.'
      });
    } finally {
      emAndamentoRef.current.texto = false;
      setBuscandoTexto(false);
    }
  };

  /** Aplica o item escolhido na lista; nunca seleciona automaticamente. */
  const aplicarResultadoTexto = (produto) => {
    if (!produto) return;
    onCampo('codigoDnaRecebido', produto.codigo != null ? String(produto.codigo) : '');
    onCampo('codigoBarrasRecebido', produto.codbarras ? String(produto.codbarras) : '');
    onCampo('produtoRecebido', produto.descricao || '');
    setResultado({
      tipo: 'sucesso',
      produto,
      nome: produto.descricao || '',
      consultadoComo: tipoCodigo
    });
    setResultadosTexto([]);
    setTruncadoTexto(false);
    setModo('RESUMO');
  };

  const handleCodigoLido = (codigoLido) => {
    codigoAceitoRef.current = true;
    onCampo('codigoBarrasRecebido', codigoLido);
    setTipoCodigo('EAN');
    setModo('CODIGO');
    onFecharCamera?.();
    consultarCodigo(codigoLido, 'EAN');
  };

  if (disabled) {
    return (
      <div style={{ ...estiloPainel, backgroundColor: '#fffbeb' }}>
        <Linha titulo="Produto identificado" valor={nome || 'Não informado'} />
        <Linha titulo="EAN / código de barras" valor={codigo || 'Não informado'} />
        {codigoDna && <Linha titulo="Código DNA" valor={codigoDna} />}
        <Linha titulo="Observações" valor={observacao || 'Nenhuma'} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {!String(nome).trim() && (
        <div style={{ fontSize: '11px', color: '#b45309', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '7px 9px' }}>
          Informe o nome do produto recebido para confirmar este item.
        </div>
      )}

      {modo === null && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button type="button" onClick={abrirCamera} style={estiloOpcao}>
            <Camera size={18} /> Ler código de barras ou DNA
          </button>
          <button type="button" onClick={() => setModo('MANUAL')} style={estiloOpcao}>
            <PencilLine size={18} /> Inserir nome manualmente
          </button>
          <button
            type="button"
            onClick={() => { setTipoCodigo('DESCRICAO'); setModo('CODIGO'); }}
            style={estiloOpcao}
          >
            <Search size={18} /> Buscar por descrição ou princípio ativo
          </button>
        </div>
      )}

      {modo === 'CAMERA' && !observacoesAbertas && (
        <LeitorCodigoBarras autoIniciar onDetected={handleCodigoLido} onClose={fecharCamera} />
      )}

      {modo === 'CAMERA' && observacoesAbertas && (
        <div style={{ ...estiloPainel, fontSize: '12px', color: '#92400e' }}>
          Câmera pausada enquanto você preenche as observações.
        </div>
      )}

      {(modo === 'CAMERA' || modo === 'MANUAL' || modo === 'CODIGO') && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {modo !== 'CODIGO' && (
            <button type="button" onClick={() => setModo('CODIGO')} style={estiloBotaoSecundario}>
              <Keyboard size={15} /> Digitar código (barras ou DNA)
            </button>
          )}
          {modo !== 'MANUAL' && (
            <button type="button" onClick={() => setModo('MANUAL')} style={estiloBotaoSecundario}>
              <PencilLine size={15} /> Inserir nome manualmente
            </button>
          )}
          {modo === 'CAMERA' && (
            <button type="button" onClick={fecharCamera} style={estiloBotaoSecundario}>
              <X size={15} /> Fechar câmera
            </button>
          )}
        </div>
      )}

      {modo === 'CODIGO' && (
        <div style={estiloPainel}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
            <button
              type="button"
              onClick={() => { setTipoCodigo('EAN'); setResultado(null); setResultadosTexto([]); }}
              style={estiloAba(tipoCodigo === 'EAN')}
            >
              <Barcode size={14} /> Código de barras (EAN/UPC)
            </button>
            <button
              type="button"
              onClick={() => { setTipoCodigo('DNA'); setResultado(null); setResultadosTexto([]); }}
              style={estiloAba(tipoCodigo === 'DNA')}
            >
              <PackageSearch size={14} /> Código interno DNA
            </button>
            <button
              type="button"
              onClick={() => { setTipoCodigo('DESCRICAO'); setResultado(null); setResultadosTexto([]); }}
              style={estiloAba(tipoCodigo === 'DESCRICAO')}
            >
              <Search size={14} /> Descrição
            </button>
            <button
              type="button"
              onClick={() => { setTipoCodigo('PRINCIPIO'); setResultado(null); setResultadosTexto([]); }}
              style={estiloAba(tipoCodigo === 'PRINCIPIO')}
            >
              <Pill size={14} /> Princípio ativo
            </button>
          </div>

          {(tipoCodigo === 'EAN' || tipoCodigo === 'DNA') ? (
            <>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#92400e', marginBottom: '4px' }}>
                {tipoCodigo === 'EAN' ? 'Código de barras do produto recebido:' : 'Código interno do DNA:'}
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={tipoCodigo === 'EAN' ? valorEan : valorDna}
                  onChange={e => onCampo(tipoCodigo === 'EAN' ? 'codigoBarrasRecebido' : 'codigoDnaRecebido', e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      consultarCodigo(tipoCodigo === 'EAN' ? valorEan : valorDna, tipoCodigo);
                    }
                  }}
                  placeholder={tipoCodigo === 'EAN' ? 'Ex.: 7891234567890' : 'Ex.: 12345'}
                  style={{ ...estiloCampo, flex: '1 1 200px' }}
                />
                <button
                  type="button"
                  onClick={() => consultarCodigo(tipoCodigo === 'EAN' ? valorEan : valorDna, tipoCodigo)}
                  disabled={consultando}
                  style={{ padding: '9px 14px', backgroundColor: consultando ? '#94a3b8' : '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', cursor: consultando ? 'wait' : 'pointer', fontSize: '13px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px', minHeight: '42px' }}
                >
                  <Search size={15} /> {consultando ? 'Consultando...' : 'Consultar DNA'}
                </button>
              </div>

              <button
                type="button"
                onClick={abrirCamera}
                style={{ marginTop: '8px', background: 'none', border: 'none', color: '#b45309', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline', padding: 0 }}
              >
                Ler com a câmera
              </button>
            </>
          ) : (
            <>
              <label htmlFor="identificacao_texto_dna" style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#92400e', marginBottom: '4px' }}>
                {tipoCodigo === 'DESCRICAO' ? 'Descrição do produto:' : 'Princípio ativo:'}
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input
                  id="identificacao_texto_dna"
                  type="text"
                  autoComplete="off"
                  value={termoTexto}
                  onChange={e => setTermoTexto(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      buscarPorTexto();
                    }
                  }}
                  placeholder={tipoCodigo === 'DESCRICAO' ? 'Ex.: dipirona 500mg' : 'Ex.: dipirona sódica'}
                  maxLength={40}
                  style={{ ...estiloCampo, flex: '1 1 200px' }}
                />
                <button
                  type="button"
                  onClick={buscarPorTexto}
                  disabled={buscandoTexto || termoTexto.trim().length < 2}
                  style={{ padding: '9px 14px', backgroundColor: buscandoTexto ? '#94a3b8' : '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', cursor: buscandoTexto ? 'wait' : 'pointer', fontSize: '13px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px', minHeight: '42px' }}
                >
                  <Search size={15} /> {buscandoTexto ? 'Buscando...' : 'Buscar no DNA'}
                </button>
              </div>

              <span style={{ display: 'block', marginTop: '6px', fontSize: '11px', color: '#92400e' }}>
                Pesquisa feita no DNA. Se houver muitos resultados, refine o termo.
              </span>

              {buscandoTexto && (
                <div role="status" aria-live="polite" style={{ marginTop: '8px', fontSize: '12px', color: '#92400e' }}>
                  Buscando produtos no DNA...
                </div>
              )}

              {resultadosTexto.length > 0 && (
                <ul style={{ listStyle: 'none', margin: '8px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '320px', overflowY: 'auto' }}>
                  {resultadosTexto.map(item => (
                    <li key={`${item.codigo}-${item.codbarras || ''}`}>
                      <button
                        type="button"
                        onClick={() => aplicarResultadoTexto(item)}
                        style={{ width: '100%', textAlign: 'left', padding: '9px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '3px' }}
                      >
                        <strong style={{ fontSize: '12px', color: '#1f2937' }}>{item.descricao || 'Produto sem descrição'}</strong>
                        <span style={{ fontSize: '11px', color: '#4b5563' }}>
                          {[item.principioAtivo, item.apresentacao, item.fabricante].filter(Boolean).join(' · ') || 'Sem informações complementares'}
                        </span>
                        <span style={{ fontSize: '11px', color: '#6b7280' }}>
                          Código DNA: {item.codigo ?? '-'} · EAN: {item.codbarras || '-'}
                          {item.inativo === 'S' ? ' · Inativo no DNA' : ''}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {truncadoTexto && (
                <div style={{ marginTop: '8px', padding: '8px 10px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', fontSize: '11px', color: '#92400e' }}>
                  Existem mais resultados do que os exibidos. Refine a pesquisa para encontrar o produto certo.
                </div>
              )}
            </>
          )}

          {resultado && <FeedbackConsulta resultado={resultado} onManual={() => setModo('MANUAL')} onCamera={abrirCamera} />}
        </div>
      )}

      {modo === 'MANUAL' && (
        <div style={estiloPainel}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#92400e', marginBottom: '4px' }}>
            Nome do produto recebido:
          </label>
          <input
            type="text"
            value={nome}
            onChange={e => onCampo('produtoRecebido', e.target.value)}
            placeholder="Digite o nome do produto"
            style={estiloCampo}
          />
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
            <button type="button" onClick={abrirCamera} style={estiloBotaoSecundario}>
              <Camera size={15} /> Ler código de barras ou DNA
            </button>
            <button type="button" onClick={() => setModo('CODIGO')} style={estiloBotaoSecundario}>
              <Keyboard size={15} /> Digitar código
            </button>
          </div>
        </div>
      )}

      {modo === 'RESUMO' && (
        <div style={estiloPainel}>
          <Linha titulo="Produto identificado" valor={nome || 'Não informado'} />
          <Linha titulo="EAN / código de barras" valor={codigo || 'Não informado'} />
          {codigoDna && <Linha titulo="Código DNA" valor={codigoDna} />}
          <button
            type="button"
            onClick={() => { setModo(null); setResultado(null); }}
            style={{ marginTop: '8px', background: 'none', border: 'none', color: '#b45309', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline', padding: 0 }}
          >
            Alterar identificação
          </button>
        </div>
      )}

      <div>
        <button
          type="button"
          onClick={() => setObservacoesAbertas(v => !v)}
          style={{ background: 'none', border: 'none', color: '#92400e', cursor: 'pointer', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px', padding: 0 }}
        >
          <MessageSquare size={14} />
          {observacoesAbertas
            ? 'Fechar observações'
            : (String(observacao).trim() ? 'Observações preenchidas' : 'Adicionar observações')}
        </button>
        {observacoesAbertas && (
          <textarea
            value={observacao}
            onChange={e => onCampo('observacaoIncorreto', e.target.value)}
            maxLength={500}
            rows={2}
            placeholder="Detalhes sobre o produto recebido (opcional)"
            style={{ ...estiloCampo, marginTop: '6px', resize: 'vertical', fontFamily: 'inherit' }}
          />
        )}
      </div>
    </div>
  );
}

function Linha({ titulo, valor }) {
  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', fontSize: '12px', color: '#78350f', marginBottom: '3px' }}>
      <strong style={{ fontWeight: '700' }}>{titulo}:</strong>
      <span>{valor}</span>
    </div>
  );
}

function FeedbackConsulta({ resultado, onManual, onCamera }) {
  if (resultado.tipo === 'sucesso') {
    const produto = resultado.produto || {};
    const nome = resultado.nome || produto.descricao || produto.nome || 'Produto';
    return (
      <div style={{ marginTop: '8px', padding: '9px 10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '12px', color: '#166534' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '700', marginBottom: '3px' }}>
          <CheckCircle2 size={14} /> Produto encontrado no DNA
        </div>
        <div>{nome}</div>
        <div style={{ color: '#166534', marginTop: '3px' }}>
          Código DNA: {produto.codigo ?? '-'} · EAN: {produto.codbarras || '-'}
        </div>
      </div>
    );
  }

  const naoEncontrado = resultado.tipo === 'nao_encontrado';
  return (
    <div style={{ marginTop: '8px', padding: '9px 10px', backgroundColor: naoEncontrado ? '#fffbeb' : '#fef2f2', border: `1px solid ${naoEncontrado ? '#fde68a' : '#fecaca'}`, borderRadius: '6px', fontSize: '12px', color: naoEncontrado ? '#92400e' : '#991b1b' }}>
      <div style={{ marginBottom: '6px', lineHeight: 1.4 }}>{resultado.texto}</div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button type="button" onClick={onManual} style={{ ...estiloBotaoSecundario, minHeight: '36px', padding: '6px 10px' }}>
          <PencilLine size={14} /> Inserir nome manualmente
        </button>
        <button type="button" onClick={onCamera} style={{ ...estiloBotaoSecundario, minHeight: '36px', padding: '6px 10px' }}>
          <Camera size={14} /> Tentar pela câmera
        </button>
      </div>
    </div>
  );
}
