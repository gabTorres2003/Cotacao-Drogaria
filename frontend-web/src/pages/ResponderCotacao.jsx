import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  Lock, 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  Ban, 
  Plus, 
  Trash2, 
  Tag, 
  RefreshCw 
} from 'lucide-react';

export default function ResponderCotacao() {
  const { idCotacao } = useParams();
  const navigate = useNavigate(); 
  
  const usuarioId = localStorage.getItem('usuarioId');
  const nomeUsuario = localStorage.getItem('nomeUsuario');
  
  const [isPrimeiroAcesso, setIsPrimeiroAcesso] = useState(localStorage.getItem('primeiroAcesso') === 'true');
  const [erroLogin, setErroLogin] = useState('');
  
  const [novoPin, setNovoPin] = useState('');
  const [confirmaPin, setConfirmaPin] = useState('');

  const [itens, setItens] = useState([]);
  const [precos, setPrecos] = useState({});
  const [quantidades, setQuantidades] = useState({}); 
  const [observacoes, setObservacoes] = useState({});
  const [produtoSubstituto, setProdutoSubstituto] = useState({});
  const [exibirTroca, setExibirTroca] = useState({});
  const [emFalta, setEmFalta] = useState({});
  
  // Estado para Promoções / Sugestões Extras
  const [sugestoes, setSugestoes] = useState([]);

  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    if (!isPrimeiroAcesso) {
      carregarItens();
    }
  }, [isPrimeiroAcesso]);

  const handlePrimeiroAcesso = async (e) => {
    e.preventDefault();
    setErroLogin('');

    if (novoPin !== confirmaPin) {
      setErroLogin('Os PINs não coincidem.');
      return;
    }
    if (!/^\d{4,6}$/.test(novoPin)) {
      setErroLogin('O novo PIN deve ter entre 4 e 6 números.');
      return;
    }

    try {
      await api.put(`/api/fornecedor/${usuarioId}/primeiro-acesso`, {
        novaSenha: novoPin
      });
      
      localStorage.setItem('primeiroAcesso', 'false');
      setIsPrimeiroAcesso(false);
    } catch (error) {
      setErroLogin('Erro ao atualizar senha. Tente novamente.');
    }
  };

  const carregarItens = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/comparativo/listar-itens/${idCotacao}`);
      const itensCarregados = Array.isArray(response.data) ? response.data : [];
      setItens(itensCarregados);

      if (itensCarregados.length > 0 && usuarioId) {
         await carregarRespostasAnteriores(usuarioId);
      }
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
      alert('Erro ao carregar a cotação.');
    } finally {
      setLoading(false);
    }
  };

  const carregarRespostasAnteriores = async (idFornecedor) => {
    try {
      const res = await api.get(`/api/fornecedor/${idFornecedor}/cotacao/${idCotacao}/respostas`);
      const respostas = res.data;
      
      if (respostas && respostas.length > 0) {
        const novosPrecos = {};
        const novasFaltas = {};
        const novasQtds = {};
        const novasObs = {};
        const novosSubstitutos = {};
        const novasExibicoes = {};
        
        respostas.forEach(r => {
          if (r.preco === -1) {
            novasFaltas[r.idItem] = true;
            novasQtds[r.idItem] = 0;
          } else {
            novosPrecos[r.idItem] = r.preco;
            novasQtds[r.idItem] = r.quantidadeDisponivel;
          }
          if (r.observacao) novasObs[r.idItem] = r.observacao;
          if (r.produtoSubstituto) {
            novosSubstitutos[r.idItem] = r.produtoSubstituto;
            novasExibicoes[r.idItem] = true;
          }
        });
        
        setPrecos(novosPrecos);
        setEmFalta(novasFaltas);
        setQuantidades(novasQtds);
        setObservacoes(novasObs);
        setProdutoSubstituto(novosSubstitutos);
        setExibirTroca(novasExibicoes);
      }
    } catch (error) {
      console.error("Erro ao carregar respostas anteriores", error);
    }
  };

  const handlePrecoChange = (idItem, valor) => {
    setEmFalta(prev => ({ ...prev, [idItem]: false }));
    setPrecos(prev => ({ ...prev, [idItem]: valor }));
  };

  const handleQtdChange = (idItem, valorStr, qtdMaxima) => {
    let valor = parseInt(valorStr, 10);
    if (isNaN(valor) || valor < 0) valor = 0;
    if (valor > qtdMaxima) valor = qtdMaxima;

    setQuantidades(prev => ({ ...prev, [idItem]: valor }));
  };

  const toggleEmFalta = (idItem) => {
    setEmFalta(prev => {
      const isFalta = !prev[idItem];
      if (isFalta) {
        setPrecos(prevPrecos => {
          const newPrecos = { ...prevPrecos };
          delete newPrecos[idItem];
          return newPrecos;
        });
      }
      return { ...prev, [idItem]: isFalta };
    });
  };

  const toggleTrocaProduto = (idItem) => {
    setExibirTroca(prev => ({ ...prev, [idItem]: !prev[idItem] }));
  };

  // --- SUGESTÕES / PROMOÇÕES EXTRAS ---
  const adicionarSugestao = () => {
    setSugestoes(prev => [
      ...prev,
      {
        tempId: Date.now(),
        nomeProduto: '',
        preco: '',
        qtdMinima: 1,
        observacao: ''
      }
    ]);
  };

  const handleSugestaoChange = (tempId, campo, valor) => {
    setSugestoes(prev => prev.map(item => 
      item.tempId === tempId ? { ...item, [campo]: valor } : item
    ));
  };

  const removerSugestao = (tempId) => {
    setSugestoes(prev => prev.filter(item => item.tempId !== tempId));
  };

  // --- VALIDAÇÃO DE REGRAS ---
  const validarFormulario = () => {
    for (const item of itens) {
      const isFalta = !!emFalta[item.idItem];
      const precoValor = precos[item.idItem];

      if (!isFalta && precoValor !== undefined && precoValor !== '') {
        const numPreco = Number(String(precoValor).replace(',', '.'));
        if (isNaN(numPreco) || numPreco <= 0) {
          alert(`O preço do produto "${item.nomeProduto}" deve ser um valor positivo maior que R$ 0,00.`);
          return false;
        }
      }
    }

    // 2. Validar sugestões/promoções extras
    for (let i = 0; i < sugestoes.length; i++) {
      const sug = sugestoes[i];
      if (!sug.nomeProduto || sug.nomeProduto.trim() === '') {
        alert(`Por favor, preencha o nome do produto na Sugestão #${i + 1}.`);
        return false;
      }

      const numPreco = Number(String(sug.preco).replace(',', '.'));
      if (isNaN(numPreco) || numPreco <= 0) {
        alert(`Informe um preço promocional válido (maior que R$ 0,00) para "${sug.nomeProduto}".`);
        return false;
      }

      if (!sug.qtdMinima || Number(sug.qtdMinima) < 1) {
        alert(`A quantidade mínima para "${sug.nomeProduto}" deve ser de no mínimo 1 unidade.`);
        return false;
      }
    }

    return true;
  };

  const enviarResposta = async () => {
    if (!validarFormulario()) return;

    const temPreco = Object.keys(precos).length > 0;
    const temFalta = Object.values(emFalta).some(v => v === true);
    const temSugestaoValida = sugestoes.length > 0;

    if (!temPreco && !temFalta && !temSugestaoValida) {
      alert('Preencha pelo menos um preço, marque uma falta ou adicione uma sugestão antes de enviar.');
      return;
    }

    try {
      const itensRespostas = itens
        .filter(item => precos[item.idItem] !== undefined || emFalta[item.idItem])
        .map(item => {
          let precoFinal = 0;
          let qtdFinal = quantidades[item.idItem] !== undefined ? quantidades[item.idItem] : item.quantidade;

          if (emFalta[item.idItem]) {
            precoFinal = -1; 
            qtdFinal = 0; 
          } else {
            const precoStr = String(precos[item.idItem] || '0').replace(',', '.');
            precoFinal = parseFloat(precoStr);
          }

          return {
            idItem: item.idItem,
            idFornecedor: parseInt(usuarioId),
            preco: precoFinal,
            quantidadeDisponivel: qtdFinal,
            observacao: observacoes[item.idItem] || '',
            produtoSubstituto: produtoSubstituto[item.idItem] || ''
          };
        });

      const sugestoesFormatadas = sugestoes.map(s => ({
        nomeProduto: s.nomeProduto.trim(),
        preco: parseFloat(String(s.preco).replace(',', '.')),
        qtdMinima: Number(s.qtdMinima) || 1,
        observacao: s.observacao || ''
      }));

      const payload = {
        cotacaoId: Number(idCotacao),
        fornecedorId: parseInt(usuarioId),
        itens: itensRespostas,
        sugestoes: sugestoesFormatadas
      };

      await api.post('/api/comparativo/salvar-respostas-completas', payload);
      setEnviado(true);
      
      setTimeout(() => {
        navigate('/portal-fornecedor');
      }, 3000);

    } catch (error) {
      console.error('Erro ao enviar:', error);
      alert('Erro ao enviar cotação.');
    }
  };

  if (isPrimeiroAcesso) {
    return (
      <div style={mobileStyles.loginBox}>
        <h2 style={{ color: '#1f2937', marginBottom: '10px' }}>Segurança</h2>
        <p style={{ color: '#6b7280', marginBottom: '25px', fontSize: '14px' }}>
          Olá, <strong>{nomeUsuario}</strong>.<br/>Este é o seu primeiro acesso. Por favor, crie um novo PIN numérico para continuar.
        </p>
        
        <form onSubmit={handlePrimeiroAcesso} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '8px', padding: '0 10px' }}>
            <Lock size={18} color="#9ca3af" />
            <input 
              type="password" placeholder="Novo PIN (4 a 6 dígitos)" required
              style={{ flex: 1, border: 'none', background: 'transparent', padding: '12px', outline: 'none', fontSize: '16px' }}
              value={novoPin} onChange={e => setNovoPin(e.target.value)}
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '8px', padding: '0 10px' }}>
            <Lock size={18} color="#9ca3af" />
            <input 
              type="password" placeholder="Confirme o novo PIN" required
              style={{ flex: 1, border: 'none', background: 'transparent', padding: '12px', outline: 'none', fontSize: '16px' }}
              value={confirmaPin} onChange={e => setConfirmaPin(e.target.value)}
            />
          </div>

          {erroLogin && <span style={{ color: '#dc2626', fontSize: '13px' }}>{erroLogin}</span>}

          <button type="submit" style={{ ...mobileStyles.submitButton, backgroundColor: '#059669' }}>
            Salvar e Continuar
          </button>
        </form>
      </div>
    );
  }

  if (enviado) {
    return (
      <div style={mobileStyles.successBox}>
        <CheckCircle size={48} color="#059669" style={{ margin: '0 auto 15px auto' }} />
        <h2 style={{ marginBottom: '10px' }}>Proposta Enviada!</h2>
        <p>Obrigado, <strong>{nomeUsuario}</strong>!</p>
        <p>Sua proposta e sugestões foram registradas com sucesso no sistema.</p>
        <p style={{ fontSize: '14px', marginTop: '15px', color: '#64748b' }}>Retornando ao painel em instantes...</p>
      </div>
    );
  }

  return (
    <div style={mobileStyles.container}>
      <style>{`
        .resp-card-row { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
        .resp-actions-area { display: flex; align-items: flex-end; gap: 12px; flex-wrap: wrap; width: auto; }
        .resp-input-field { padding: 10px 12px; border-radius: 6px; border: 1px solid #d1d5db; font-size: 15px; outline-color: #2563eb; box-sizing: border-box; }

        @media (max-width: 640px) {
          .resp-card-row { flex-direction: column; align-items: stretch; }
          .resp-actions-area { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 100%; }
          .resp-btn-falta-wrapper { grid-column: span 2; }
          .resp-btn-falta { width: 100%; justify-content: center; }
          .resp-input-field { font-size: 16px !important; width: 100% !important; }
          .sugestao-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* CABEÇALHO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => navigate('/portal-fornecedor')} style={mobileStyles.btnVoltar}>
            <ArrowLeft size={18} /> Voltar
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#1f2937' }}>
            Cotação #{idCotacao}
          </h1>
        </div>
        
        <div style={{ background: '#dbeafe', color: '#1e40af', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold' }}>
          {nomeUsuario}
        </div>
      </div>
      
      {loading ? (
        <p style={{ textAlign: 'center', color: '#666', padding: '40px 0' }}>Carregando itens da cotação...</p>
      ) : (
        <div>
          {itens.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'white', borderRadius: '8px' }}>
              <AlertCircle size={32} color="#9ca3af" style={{ margin: '0 auto 10px auto' }} />
              <p style={{ color: '#6b7280' }}>Nenhum item encontrado nesta cotação.</p>
            </div>
          ) : (
            itens.map(item => {
              const isFalta = !!emFalta[item.idItem];
              const qtdNaTela = quantidades[item.idItem] !== undefined ? quantidades[item.idItem] : item.quantidade;
              const temTrocaAtiva = !!exibirTroca[item.idItem];

              return (
                <div key={item.idItem} style={mobileStyles.card}>
                  <div className="resp-card-row">
                    <div style={{ flex: 1, minWidth: '180px' }}>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                        {item.nomeProduto}
                      </div>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>
                        Qtd Solicitada: <strong>{item.quantidade} un</strong>
                      </div>
                    </div>

                    <div className="resp-actions-area">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', opacity: isFalta ? 0.4 : 1 }}>
                        <label style={mobileStyles.labelMini}>Qtd. Disp.</label>
                        <input 
                          type="number" min="0" max={item.quantidade}
                          className="resp-input-field"
                          style={{ width: '85px', textAlign: 'center', backgroundColor: isFalta ? '#f3f4f6' : 'white' }}
                          value={qtdNaTela}
                          onChange={(e) => handleQtdChange(item.idItem, e.target.value, item.quantidade)}
                          disabled={isFalta}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', opacity: isFalta ? 0.4 : 1 }}>
                        <label style={mobileStyles.labelMini}>Preço Unit. (R$)</label>
                        <input 
                          type="number" step="0.01" placeholder="0,00"
                          className="resp-input-field"
                          style={{ width: '100px', textAlign: 'right', backgroundColor: isFalta ? '#f3f4f6' : 'white' }}
                          value={precos[item.idItem] !== undefined ? precos[item.idItem] : ''}
                          onChange={(e) => handlePrecoChange(item.idItem, e.target.value)}
                          disabled={isFalta}
                        />
                      </div>

                      <div className="resp-btn-falta-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                         <label style={{ ...mobileStyles.labelMini, visibility: 'hidden' }}>Ação</label>
                         <button 
                           type="button"
                           className="resp-btn-falta"
                           style={mobileStyles.btnFalta(isFalta)}
                           onClick={() => toggleEmFalta(item.idItem)}
                         >
                           {isFalta ? <><Ban size={15} /> Em falta</> : 'Falta?'}
                         </button>
                      </div>
                    </div>
                  </div>

                  {/* BOTÃO PARA SUGERIR TROCA DE MARCA / LABORATÓRIO */}
                  {!isFalta && (
                    <div style={{ marginTop: '4px' }}>
                      <button 
                        type="button"
                        onClick={() => toggleTrocaProduto(item.idItem)}
                        style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}
                      >
                        <RefreshCw size={14} /> {temTrocaAtiva ? 'Remover Sugestão de Troca' : 'Sugerir Troca de Marca/Laboratório'}
                      </button>

                      {temTrocaAtiva && (
                        <div style={{ marginTop: '8px' }}>
                          <label style={mobileStyles.labelMini}>Produto / Marca / Laboratório Alternativo</label>
                          <input 
                            type="text"
                            placeholder="Ex: Paracetamol Medley em vez de EMS..."
                            className="resp-input-field"
                            style={{ width: '100%', marginTop: '4px', border: '1px solid #3b82f6', backgroundColor: '#eff6ff' }}
                            value={produtoSubstituto[item.idItem] || ''}
                            onChange={(e) => setProdutoSubstituto(prev => ({ ...prev, [item.idItem]: e.target.value }))}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* CAMPO DE OBSERVAÇÃO DO PRODUTO */}
                  <div style={{ opacity: isFalta ? 0.4 : 1, marginTop: '4px' }}>
                    <label style={mobileStyles.labelMini}>Observação / Validade</label>
                    <input 
                      type="text"
                      placeholder="Ex: Lote 2027, Caixa c/ 30un..."
                      className="resp-input-field"
                      style={{ width: '100%', marginTop: '4px', backgroundColor: isFalta ? '#f3f4f6' : 'white' }}
                      value={observacoes[item.idItem] || ''}
                      onChange={(e) => setObservacoes(prev => ({ ...prev, [item.idItem]: e.target.value }))}
                      disabled={isFalta}
                    />
                  </div>
                </div>
              );
            })
          )}

          {/* SEÇÃO DE SUGESTÕES E PROMOÇÕES DE PRODUTOS */}
          <div style={{ marginTop: '32px', backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Tag size={20} color="#2563eb" /> Sugestões & Promoções de Produtos
                </h3>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0 0' }}>
                  Cadastre ofertas extras, itens promocionais ou oportunidades para a drogaria.
                </p>
              </div>

              <button type="button" onClick={adicionarSugestao} style={mobileStyles.btnAddSugestao}>
                <Plus size={16} /> Adicionar Sugestão
              </button>
            </div>

            {sugestoes.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic', margin: '10px 0 0 0' }}>
                Nenhuma promoção ou sugestão adicionada até o momento.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                {sugestoes.map((sug, index) => (
                  <div key={sug.tempId} style={{ padding: '16px', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#2563eb' }}>
                        Sugestão #{index + 1}
                      </span>
                      <button 
                        type="button" 
                        onClick={() => removerSugestao(sug.tempId)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '600' }}
                      >
                        <Trash2 size={16} /> Remover
                      </button>
                    </div>

                    <div className="sugestao-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <label style={mobileStyles.labelMini}>Nome do Produto *</label>
                        <input 
                          type="text" required
                          placeholder="Ex: Dipirona 500mg c/ 200un"
                          className="resp-input-field"
                          style={{ width: '100%', marginTop: '4px' }}
                          value={sug.nomeProduto}
                          onChange={(e) => handleSugestaoChange(sug.tempId, 'nomeProduto', e.target.value)}
                        />
                      </div>

                      <div>
                        <label style={mobileStyles.labelMini}>Preço Unit. R$ *</label>
                        <input 
                          type="number" step="0.01" min="0" required
                          placeholder="0,00"
                          className="resp-input-field"
                          style={{ width: '100%', marginTop: '4px', textAlign: 'right' }}
                          value={sug.preco}
                          onChange={(e) => handleSugestaoChange(sug.tempId, 'preco', e.target.value)}
                        />
                      </div>

                      <div>
                        <label style={mobileStyles.labelMini}>Qtd. Mínima Pedido *</label>
                        <input 
                          type="number" min="1" required
                          className="resp-input-field"
                          style={{ width: '100%', marginTop: '4px', textAlign: 'center' }}
                          value={sug.qtdMinima}
                          onChange={(e) => handleSugestaoChange(sug.tempId, 'qtdMinima', e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={mobileStyles.labelMini}>Observação / Condições da Promoção</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Preço promocional válido até fim do estoque..."
                        className="resp-input-field"
                        style={{ width: '100%', marginTop: '4px' }}
                        value={sug.observacao}
                        onChange={(e) => handleSugestaoChange(sug.tempId, 'observacao', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button style={mobileStyles.submitButton} onClick={enviarResposta}>
            Enviar Proposta Completa
          </button>
        </div>
      )}
    </div>
  );
}

const mobileStyles = {
  container: { maxWidth: '850px', margin: '0 auto', padding: '16px', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", backgroundColor: '#f3f4f6', minHeight: '100vh', boxSizing: 'border-box' },
  card: { backgroundColor: 'white', padding: '16px', marginBottom: '12px', borderRadius: '10px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '10px' },
  labelMini: { fontSize: '12px', color: '#6b7280', fontWeight: '600' },
  btnFalta: (ativo) => ({ padding: '9px 14px', borderRadius: '6px', border: '1px solid', borderColor: ativo ? '#ef4444' : '#d1d5db', backgroundColor: ativo ? '#fee2e2' : 'white', color: ativo ? '#b91c1c' : '#6b7280', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', height: '42px', boxSizing: 'border-box' }),
  btnAddSugestao: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' },
  submitButton: { width: '100%', padding: '16px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  btnVoltar: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', backgroundColor: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' },
  successBox: { textAlign: 'center', padding: '30px 20px', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '12px', margin: '40px auto', maxWidth: '450px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' },
  loginBox: { maxWidth: '400px', margin: '60px auto', backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', textAlign: 'center' }
};