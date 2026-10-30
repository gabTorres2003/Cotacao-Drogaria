import { useEffect, useRef, useState } from 'react';
import api from '../services/api';
import { Camera, CheckCircle2, MessageSquare, Package, PackageSearch, PencilLine, Search, X } from 'lucide-react';
import LeitorCodigoBarras from './LeitorCodigoBarras';
import { validarCodigoLido } from '../utils/codigoBarras';

const estiloBotaoModo = (ativo) => ({
  padding: '10px',
  border: `1px solid ${ativo ? '#f97316' : '#d1d5db'}`,
  borderRadius: '8px',
  backgroundColor: ativo ? '#fff7ed' : 'white',
  color: ativo ? '#9a3412' : '#374151',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  fontSize: '12px',
  fontWeight: '700',
  flex: '1 1 150px',
  minHeight: '46px'
});

const estiloPainel = {
  padding: '10px',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  backgroundColor: '#f8fafc',
  marginBottom: '14px'
};

const estiloCampo = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '14px',
  boxSizing: 'border-box'
};

const estiloLink = {
  marginTop: '8px',
  background: 'none',
  border: 'none',
  color: '#2563eb',
  cursor: 'pointer',
  fontSize: '12px',
  textDecoration: 'underline',
  padding: 0
};

export default function ModalProdutoNaoSolicitado({ isOpen, onClose, onConfirm, ocultarValor = false }) {
  const [modo, setModo] = useState('ESCOLHA');
  const [codigoBarrasRecebido, setCodigoBarrasRecebido] = useState('');
  const [codigoDna, setCodigoDna] = useState('');
  const [nomeManual, setNomeManual] = useState('');
  const [nomeProdutoRecebido, setNomeProdutoRecebido] = useState('');
  const [resultadoBusca, setResultadoBusca] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [buscaNome, setBuscaNome] = useState('');
  const [buscandoNome, setBuscandoNome] = useState(false);
  const [tipoBuscaNome, setTipoBuscaNome] = useState('descricao');
  const [resultadosNome, setResultadosNome] = useState([]);
  const [truncadoNome, setTruncadoNome] = useState(false);
  const [observacao, setObservacao] = useState('');
  const [observacoesAbertas, setObservacoesAbertas] = useState(false);
  const [quantidade, setQuantidade] = useState(1);
  const [valorUnitario, setValorUnitario] = useState('');
  const [classificacao, setClassificacao] = useState('ENVIADO_POR_ENGANO');
  const codigoAceitoRef = useRef(false);
  const emAndamentoRef = useRef({ codigo: false, texto: false });

  useEffect(() => {
    if (!isOpen) {
      setModo('ESCOLHA');
      setCodigoBarrasRecebido('');
      setCodigoDna('');
      setNomeManual('');
      setNomeProdutoRecebido('');
      setResultadoBusca(null);
      setBuscando(false);
      setBuscaNome('');
      setBuscandoNome(false);
      setTipoBuscaNome('descricao');
      setResultadosNome([]);
      setTruncadoNome(false);
      setObservacao('');
      setObservacoesAbertas(false);
      setQuantidade(1);
      setValorUnitario('');
      setClassificacao('ENVIADO_POR_ENGANO');
      codigoAceitoRef.current = false;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const consultarCodigo = async (valor, tipo) => {
    const codigoTexto = String(valor ?? '').trim();
    if (!codigoTexto) {
      setResultadoBusca({ erro: true, texto: 'Informe o código para consultar.' });
      return;
    }

    if (tipo === 'EAN') {
      const validacao = validarCodigoLido(codigoTexto);
      if (!validacao.valido) {
        setResultadoBusca({ erro: true, texto: validacao.motivo });
        return;
      }
    }

    // Enter repetido não dispara outra consulta enquanto a anterior roda.
    if (emAndamentoRef.current.codigo) return;

    setBuscando(true);
    emAndamentoRef.current.codigo = true;
    setResultadoBusca(null);
    try {
      const res = await api.get('/api/produtos/buscar', { params: { q: codigoTexto, tipo } });
      const produto = res.data || {};
      const nome = produto.nome || produto.descricao || produto.name || '';
      if (tipo === 'DNA') {
        setCodigoDna(codigoTexto);
        if (produto.codbarras) setCodigoBarrasRecebido(String(produto.codbarras));
      } else {
        setCodigoBarrasRecebido(codigoTexto);
      }
      if (nome) setNomeProdutoRecebido(nome);
      setResultadoBusca({ ...produto, nome });
    } catch (erro) {
      if (erro.response?.status === 404) {
        setResultadoBusca({ erro: true, texto: 'Código não encontrado no DNA. Informe o nome do produto manualmente.' });
      } else {
        setResultadoBusca({ erro: true, texto: 'Não foi possível consultar o DNA agora. Informe o nome do produto manualmente.' });
      }
    } finally {
      emAndamentoRef.current.codigo = false;
      setBuscando(false);
    }
  };

  const buscarPorNome = async () => {
    const termo = buscaNome.trim();
    if (termo.length < 2) {
      setResultadoBusca({ erro: true, texto: 'Informe pelo menos 2 caracteres para pesquisar.' });
      return;
    }

    // Enter repetido não dispara outra pesquisa enquanto a anterior roda.
    if (emAndamentoRef.current.texto) return;

    setBuscandoNome(true);
    emAndamentoRef.current.texto = true;
    setResultadoBusca(null);
    setResultadosNome([]);
    setTruncadoNome(false);
    try {
      const res = await api.get('/api/produtos/pesquisar', {
        params: { q: termo, tipo: tipoBuscaNome }
      });
      const resultados = Array.isArray(res.data?.resultados) ? res.data.resultados : [];
      setResultadosNome(resultados);
      setTruncadoNome(Boolean(res.data?.truncado));
      if (resultados.length === 0) {
        setResultadoBusca({ erro: true, texto: 'Nenhum produto encontrado no DNA. Você pode informar o nome manualmente.' });
      }
    } catch (erro) {
      setResultadoBusca({
        erro: true,
        texto: erro.response?.status === 503
          ? 'Consulta ao DNA indisponível. Tente novamente em instantes.'
          : 'Não foi possível pesquisar no DNA agora. Você pode informar o nome manualmente.'
      });
    } finally {
      emAndamentoRef.current.texto = false;
      setBuscandoNome(false);
    }
  };

  /** Aplica o item escolhido na lista; nunca seleciona automaticamente. */
  const aplicarResultadoNome = (item) => {
    if (!item) return;
    const nome = item.descricao || '';
    setNomeProdutoRecebido(nome);
    setNomeManual(nome);
    setCodigoDna(item.codigo != null ? String(item.codigo) : '');
    setCodigoBarrasRecebido(item.codbarras ? String(item.codbarras) : '');
    setResultadoBusca({ ...item, nome });
    setResultadosNome([]);
    setTruncadoNome(false);
  };

  const handleCodigoLido = (codigoLido) => {
    codigoAceitoRef.current = true;
    setCodigoBarrasRecebido(codigoLido);
    setModo('EAN');
    consultarCodigo(codigoLido, 'EAN');
  };

  const fecharCamera = () => {
    if (codigoAceitoRef.current) {
      codigoAceitoRef.current = false;
      return;
    }
    setModo('ESCOLHA');
  };

  const abrirCamera = () => {
    setModo('CAMERA');
  };

  const handleConfirm = () => {
    const nome = (nomeManual.trim() || nomeProdutoRecebido.trim()).trim();
    if (!nome) {
      alert('Informe o nome do produto.');
      return;
    }
    if (quantidade <= 0) {
      alert('A quantidade deve ser maior que zero.');
      return;
    }
    const codigoTexto = codigoBarrasRecebido.trim();
    if (codigoTexto) {
      const validacao = validarCodigoLido(codigoTexto);
      if (!validacao.valido) {
        setModo('EAN');
        setResultadoBusca({ erro: true, texto: validacao.motivo });
        alert('O código de barras informado não é válido. Corrija ou use o código interno do DNA.');
        return;
      }
    }

    onConfirm({
      nomeProduto: nome,
      codigoBarrasRecebido: codigoTexto,
      codigoDnaRecebido: codigoDna.trim(),
      nomeProdutoRecebido: nome,
      quantidade,
      valorUnitario: valorUnitario ? Number(valorUnitario) : 0,
      classificacao,
      observacao: observacao.trim(),
      origem: 'NAO_SOLICITADO'
    });
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '10px' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', width: '560px', maxWidth: '100%', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={20} color="#f97316" />
            Produto Não Solicitado
          </h3>
          <button onClick={onClose} aria-label="Fechar" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={20} color="#6b7280" />
          </button>
        </div>

        <p style={{ fontSize: '13px', color: '#6b7280', marginTop: 0, marginBottom: '14px' }}>
          Produto que veio na entrega mas não faz parte do pedido original.
        </p>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <button type="button" onClick={abrirCamera} style={estiloBotaoModo(modo === 'CAMERA')}>
            <Camera size={16} /> Ler código de barras
          </button>
          <button type="button" onClick={() => { setModo('DNA'); }} style={estiloBotaoModo(modo === 'DNA')}>
            <PackageSearch size={16} /> Buscar código DNA
          </button>
          <button type="button" onClick={() => { setModo('MANUAL'); }} style={estiloBotaoModo(modo === 'MANUAL')}>
            <PencilLine size={16} /> Inserir manualmente
          </button>
        </div>

        {modo === 'CAMERA' && !observacoesAbertas && (
          <div style={estiloPainel}>
            <LeitorCodigoBarras autoIniciar onDetected={handleCodigoLido} onClose={fecharCamera} />
          </div>
        )}

        {modo === 'CAMERA' && observacoesAbertas && (
          <div style={{ ...estiloPainel, fontSize: '12px', color: '#92400e' }}>
            Câmera pausada enquanto você preenche as observações.
          </div>
        )}

        {(modo === 'CAMERA' || modo === 'DNA' || modo === 'MANUAL' || modo === 'EAN') && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <button type="button" onClick={() => { setModo('EAN'); }} style={{ ...estiloLink, marginTop: 0 }}>
              Digitar código de barras
            </button>
            <button type="button" onClick={() => { setModo('DNA'); }} style={{ ...estiloLink, marginTop: 0 }}>
              Código DNA
            </button>
            <button type="button" onClick={() => { setModo('MANUAL'); }} style={{ ...estiloLink, marginTop: 0 }}>
              Nome manual
            </button>
            {modo === 'CAMERA' && (
              <button type="button" onClick={() => setModo('ESCOLHA')} style={{ ...estiloLink, marginTop: 0 }}>
                Fechar câmera
              </button>
            )}
          </div>
        )}

        {modo === 'EAN' && (
          <div style={estiloPainel}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              Código de barras (EAN/UPC):
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={codigoBarrasRecebido}
                onChange={e => setCodigoBarrasRecebido(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    consultarCodigo(codigoBarrasRecebido, 'EAN');
                  }
                }}
                placeholder="Preserva zeros à esquerda"
                style={{ ...estiloCampo, flex: '1 1 200px' }}
              />
              <button
                type="button"
                onClick={() => consultarCodigo(codigoBarrasRecebido, 'EAN')}
                disabled={buscando}
                style={{ padding: '9px 14px', backgroundColor: buscando ? '#94a3b8' : '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: buscando ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '600', minHeight: '42px' }}
              >
                <Search size={14} /> {buscando ? 'Consultando...' : 'Consultar'}
              </button>
            </div>
            <button type="button" onClick={abrirCamera} style={estiloLink}>
              <Camera size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Ler com a câmera
            </button>
          </div>
        )}

        {modo === 'DNA' && (
          <div style={estiloPainel}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              Código interno do DNA:
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={codigoDna}
                onChange={e => setCodigoDna(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    consultarCodigo(codigoDna, 'DNA');
                  }
                }}
                placeholder="Ex.: 12345"
                style={{ ...estiloCampo, flex: '1 1 200px' }}
              />
              <button
                type="button"
                onClick={() => consultarCodigo(codigoDna, 'DNA')}
                disabled={buscando}
                style={{ padding: '9px 14px', backgroundColor: buscando ? '#94a3b8' : '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: buscando ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '600', minHeight: '42px' }}
              >
                <Search size={14} /> {buscando ? 'Consultando...' : 'Consultar'}
              </button>
            </div>
          </div>
        )}

        {modo === 'MANUAL' && (
          <div style={estiloPainel}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              Nome do produto:
            </label>
            <input
              type="text"
              value={nomeManual}
              onChange={e => setNomeManual(e.target.value)}
              placeholder="Digite o nome do produto"
              style={estiloCampo}
            />

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
              <select
                aria-label="Tipo de pesquisa no DNA"
                value={tipoBuscaNome}
                onChange={e => { setTipoBuscaNome(e.target.value); setResultadosNome([]); setResultadoBusca(null); }}
                style={{ ...estiloCampo, flex: '1 1 150px' }}
              >
                <option value="descricao">Descrição</option>
                <option value="principio">Princípio ativo</option>
              </select>
              <input
                type="text"
                value={buscaNome}
                onChange={e => setBuscaNome(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    buscarPorNome();
                  }
                }}
                placeholder={tipoBuscaNome === 'descricao' ? 'Descrição no DNA (opcional)' : 'Princípio ativo no DNA (opcional)'}
                maxLength={40}
                style={{ ...estiloCampo, flex: '1 1 200px' }}
              />
              <button
                type="button"
                onClick={buscarPorNome}
                disabled={buscandoNome || buscaNome.trim().length < 2}
                style={{ padding: '9px 12px', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', cursor: buscandoNome ? 'wait' : 'pointer', fontSize: '12px', fontWeight: '600', minHeight: '42px' }}
              >
                {buscandoNome ? 'Buscando...' : 'Buscar no DNA'}
              </button>
            </div>

            {buscandoNome && (
              <div role="status" aria-live="polite" style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
                Buscando produtos no DNA...
              </div>
            )}

            {resultadosNome.length > 0 && (
              <ul style={{ listStyle: 'none', margin: '10px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '260px', overflowY: 'auto' }}>
                {resultadosNome.map(item => (
                  <li key={`${item.codigo}-${item.codbarras || ''}`}>
                    <button
                      type="button"
                      onClick={() => aplicarResultadoNome(item)}
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

            {truncadoNome && (
              <div style={{ marginTop: '8px', padding: '8px 10px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', fontSize: '11px', color: '#92400e' }}>
                Existem mais resultados do que os exibidos. Refine a pesquisa.
              </div>
            )}
          </div>
        )}

        {resultadoBusca && (
          resultadoBusca.erro ? (
            <div style={{ marginBottom: '14px', padding: '9px 10px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', fontSize: '12px', color: '#92400e', lineHeight: 1.4 }}>
              {resultadoBusca.texto || 'Produto não encontrado no DNA.'}
            </div>
          ) : (
            <div style={{ marginBottom: '14px', padding: '9px 10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '12px', color: '#166534' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '700', marginBottom: '3px' }}>
                <CheckCircle2 size={14} /> Produto encontrado no DNA
              </div>
              <div>{nomeProdutoRecebido || resultadoBusca.nome || resultadoBusca.descricao || 'Produto'}</div>
              <div style={{ marginTop: '3px' }}>
                Código DNA: {resultadoBusca.codigo ?? '-'} · EAN: {resultadoBusca.codbarras || '-'}
              </div>
            </div>
          )
        )}

        {nomeProdutoRecebido && !resultadoBusca && (
          <div style={{ marginBottom: '14px', fontSize: '12px', color: '#166534' }}>
            Produto identificado: {nomeProdutoRecebido}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: ocultarValor ? '1fr' : '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Quantidade:</label>
            <input
              type="number"
              min="1"
              inputMode="numeric"
              enterkeyHint="next"
              value={quantidade}
              onChange={e => setQuantidade(Number(e.target.value))}
              style={estiloCampo}
            />
          </div>
          {!ocultarValor && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Valor unitário (NF):</label>
              <input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                enterkeyHint="next"
                value={valorUnitario}
                onChange={e => setValorUnitario(e.target.value)}
                placeholder="R$ 0,00"
                style={estiloCampo}
              />
            </div>
          )}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Situação:</label>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#374151', cursor: 'pointer', padding: '8px 12px', border: `1px solid ${classificacao === 'ENVIADO_POR_ENGANO' ? '#f97316' : '#d1d5db'}`, borderRadius: '6px', backgroundColor: classificacao === 'ENVIADO_POR_ENGANO' ? '#fff7ed' : 'white' }}>
              <input type="radio" name="classificacao" value="ENVIADO_POR_ENGANO" checked={classificacao === 'ENVIADO_POR_ENGANO'} onChange={e => setClassificacao(e.target.value)} style={{ accentColor: '#f97316' }} />
              Enviado por engano (sem cobrança)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#374151', cursor: 'pointer', padding: '8px 12px', border: `1px solid ${classificacao === 'NAO_PEDIDO' ? '#2563eb' : '#d1d5db'}`, borderRadius: '6px', backgroundColor: classificacao === 'NAO_PEDIDO' ? '#eff6ff' : 'white' }}>
              <input type="radio" name="classificacao" value="NAO_PEDIDO" checked={classificacao === 'NAO_PEDIDO'} onChange={e => setClassificacao(e.target.value)} style={{ accentColor: '#2563eb' }} />
              Não estava no pedido (com cobrança)
            </label>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <button
            type="button"
            onClick={() => setObservacoesAbertas(v => !v)}
            style={{ background: 'none', border: 'none', color: '#374151', cursor: 'pointer', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px', padding: 0, fontWeight: '600' }}
          >
            <MessageSquare size={14} />
            {observacoesAbertas ? 'Fechar observações' : (observacao.trim() ? 'Observações preenchidas' : 'Adicionar observações')}
          </button>
          {observacoesAbertas && (
            <textarea
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="Detalhes sobre o produto recebido (opcional)"
              style={{ ...estiloCampo, marginTop: '6px', resize: 'vertical', fontFamily: 'inherit' }}
            />
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '9px 16px', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', minHeight: '42px' }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            style={{ padding: '9px 16px', backgroundColor: '#f97316', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', minHeight: '42px' }}
          >
            Adicionar à Conferência
          </button>
        </div>
      </div>
    </div>
  );
}
