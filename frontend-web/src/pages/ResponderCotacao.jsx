import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Lock, ArrowLeft, CheckCircle, AlertCircle, Ban, Plus, Trash2, Tag, RefreshCw, Loader2 } from 'lucide-react'; 

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
  const [precoSubstituto, setPrecoSubstituto] = useState({});
  const [qtdSubstituto, setQtdSubstituto] = useState({});
  const [exibirTroca, setExibirTroca] = useState({});
  
  const [emFalta, setEmFalta] = useState({});
  const [sugestoes, setSugestoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); 

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
    try {
      await api.put(`/api/fornecedor/${usuarioId}/primeiro-acesso`, { novaSenha: novoPin });
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
        const novosPrecosSubst = {};
        const novasQtdsSubst = {};
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
            novosPrecosSubst[r.idItem] = r.precoSubstituto || r.preco;
            novasQtdsSubst[r.idItem] = r.quantidadeSubstituto || r.quantidadeDisponivel;
            novasExibicoes[r.idItem] = true;
          }
        });
        
        setPrecos(novosPrecos);
        setEmFalta(novasFaltas);
        setQuantidades(novasQtds);
        setObservacoes(novasObs);
        setProdutoSubstituto(novosSubstitutos);
        setPrecoSubstituto(novosPrecosSubst);
        setQtdSubstituto(novasQtdsSubst);
        setExibirTroca(novasExibicoes);
      }

      const resSug = await api.get(`/api/cotacao/sugestoes/${idCotacao}`);
      if (resSug.data && resSug.data.length > 0) {
        const minhasSugestoes = resSug.data
          .filter(s => s.fornecedorNome === nomeUsuario)
          .map(s => ({
            tempId: s.id || Date.now() + Math.random(),
            nomeProduto: s.nomeProduto,
            preco: s.preco,
            qtdMinima: s.qtdMinima,
            observacao: s.observacao || ''
          }));
        setSugestoes(minhasSugestoes);
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

  const adicionarSugestao = () => {
    setSugestoes(prev => [...prev, { tempId: Date.now(), nomeProduto: '', preco: '', qtdMinima: 1, observacao: '' }]);
  };

  const handleSugestaoChange = (tempId, campo, valor) => {
    setSugestoes(prev => prev.map(item => item.tempId === tempId ? { ...item, [campo]: valor } : item));
  };

  const removerSugestao = (tempId) => {
    setSugestoes(prev => prev.filter(item => item.tempId !== tempId));
  };

  const enviarResposta = async () => {
    setIsSubmitting(true); 
    try {
      const itensRespostas = itens.map(item => {
        const isFalta = !!emFalta[item.idItem];
        let precoFinal = isFalta ? -1 : (parseFloat(String(precos[item.idItem] || '0').replace(',', '.')) || 0);
        let qtdFinal = isFalta ? 0 : (quantidades[item.idItem] !== undefined ? quantidades[item.idItem] : item.quantidade);

        const temTroca = !!exibirTroca[item.idItem] && produtoSubstituto[item.idItem]?.trim() !== '';

        return {
          idItem: item.idItem,
          idFornecedor: parseInt(usuarioId),
          preco: precoFinal,
          quantidadeDisponivel: qtdFinal,
          observacao: observacoes[item.idItem] || '',
          produtoSubstituto: temTroca ? produtoSubstituto[item.idItem].trim() : '',
          precoSubstituto: temTroca ? (parseFloat(String(precoSubstituto[item.idItem] || '0').replace(',', '.')) || 0) : null,
          quantidadeSubstituto: temTroca ? (parseInt(qtdSubstituto[item.idItem] || item.quantidade, 10)) : null
        };
      });

      const sugestoesFormatadas = sugestoes
        .filter(s => s.nomeProduto.trim() !== '' && Number(s.preco) > 0)
        .map(s => ({
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
      setTimeout(() => { navigate('/portal-fornecedor'); }, 3000);

    } catch (error) {
      console.error('Erro ao enviar:', error);
      alert('Erro ao enviar cotação.');
    } finally {
      setIsSubmitting(false); 
    }
  };

  if (isPrimeiroAcesso) {
    return (
      <div style={mobileStyles.loginBox}>
        <h2 style={{ color: '#1f2937', marginBottom: '10px' }}>Segurança</h2>
        <p style={{ color: '#6b7280', marginBottom: '25px', fontSize: '14px' }}>Crie um novo PIN numérico.</p>
        <form onSubmit={handlePrimeiroAcesso} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input type="password" placeholder="Novo PIN" required style={mobileStyles.inputField} value={novoPin} onChange={e => setNovoPin(e.target.value)} />
          <input type="password" placeholder="Confirme o PIN" required style={mobileStyles.inputField} value={confirmaPin} onChange={e => setConfirmaPin(e.target.value)} />
          <button type="submit" style={{ ...mobileStyles.submitButton, backgroundColor: '#059669' }}>Salvar</button>
        </form>
      </div>
    );
  }

  if (enviado) {
    return (
      <div style={mobileStyles.successBox}>
        <CheckCircle size={48} color="#059669" style={{ margin: '0 auto 15px auto' }} />
        <h2 style={{ marginBottom: '10px' }}>Proposta Enviada!</h2>
        <p>Retornando ao painel...</p>
      </div>
    );
  }

  return (
    <div style={mobileStyles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => navigate('/portal-fornecedor')} style={mobileStyles.btnVoltar}>
          <ArrowLeft size={18} /> Voltar
        </button>
        <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Cotação #{idCotacao}</h1>
        <div style={{ background: '#dbeafe', color: '#1e40af', padding: '6px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>
          {nomeUsuario}
        </div>
      </div>
      
      {loading ? <p>Carregando itens...</p> : (
        <div>
          {itens.map(item => {
            const isFalta = !!emFalta[item.idItem];
            const qtdNaTela = quantidades[item.idItem] !== undefined ? quantidades[item.idItem] : item.quantidade;
            const temTrocaAtiva = !!exibirTroca[item.idItem];

            return (
              <div key={item.idItem} style={mobileStyles.card}>
                <div style={{ fontSize: '15px', fontWeight: '600', color: '#1f2937' }}>{item.nomeProduto}</div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>Solicitado: <strong>{item.quantidade} un</strong></div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', alignItems: 'flex-end', marginTop: '8px' }}>
                  <div>
                    <label style={mobileStyles.labelMini}>Qtd. Disp.</label>
                    <input type="number" min="0" max={item.quantidade} style={mobileStyles.inputFieldItem} value={qtdNaTela} onChange={(e) => handleQtdChange(item.idItem, e.target.value, item.quantidade)} />
                  </div>
                  <div>
                    <label style={mobileStyles.labelMini}>Preço Unit. (R$)</label>
                    <input type="number" step="0.01" placeholder="0,00" style={mobileStyles.inputFieldItem} value={precos[item.idItem] !== undefined ? precos[item.idItem] : ''} onChange={(e) => handlePrecoChange(item.idItem, e.target.value)} />
                  </div>
                  <button type="button" style={mobileStyles.btnFalta(isFalta)} onClick={() => toggleEmFalta(item.idItem)}>
                    {isFalta ? 'Em falta' : 'Falta?'}
                  </button>
                </div>

                <div style={{ marginTop: '10px' }}>
                  <button type="button" onClick={() => toggleTrocaProduto(item.idItem)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}>
                    <RefreshCw size={14} /> {temTrocaAtiva ? 'Remover Sugestão de Troca' : 'Sugerir Troca de Marca/Laboratório'}
                  </button>

                  {temTrocaAtiva && (
                    <div style={{ marginTop: '8px', padding: '10px', backgroundColor: '#eff6ff', borderRadius: '6px', border: '1px solid #bfdbfe', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div>
                        <label style={mobileStyles.labelMini}>Nome do Produto Alternativo *</label>
                        <input type="text" placeholder="Ex: Paracetamol Medley..." style={{ ...mobileStyles.inputFieldItem, backgroundColor: 'white' }} value={produtoSubstituto[item.idItem] || ''} onChange={(e) => setProdutoSubstituto(prev => ({ ...prev, [item.idItem]: e.target.value }))} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={mobileStyles.labelMini}>Qtd. Disponível (Troca)</label>
                          <input type="number" min="0" style={{ ...mobileStyles.inputFieldItem, backgroundColor: 'white' }} value={qtdSubstituto[item.idItem] !== undefined ? qtdSubstituto[item.idItem] : item.quantidade} onChange={(e) => setQtdSubstituto(prev => ({ ...prev, [item.idItem]: e.target.value }))} />
                        </div>
                        <div>
                          <label style={mobileStyles.labelMini}>Preço Unit. R$ (Troca)</label>
                          <input type="number" step="0.01" placeholder="0,00" style={{ ...mobileStyles.inputFieldItem, backgroundColor: 'white' }} value={precoSubstituto[item.idItem] !== undefined ? precoSubstituto[item.idItem] : ''} onChange={(e) => setPrecoSubstituto(prev => ({ ...prev, [item.idItem]: e.target.value }))} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '6px' }}>
                  <label style={mobileStyles.labelMini}>Observação / Validade</label>
                  <input type="text" placeholder="Ex: Lote 2027..." style={mobileStyles.inputFieldItem} value={observacoes[item.idItem] || ''} onChange={(e) => setObservacoes(prev => ({ ...prev, [item.idItem]: e.target.value }))} />
                </div>
              </div>
            );
          })}

          <div style={{ marginTop: '24px', backgroundColor: 'white', padding: '16px', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Sugestões & Promoções</h3>
              <button type="button" onClick={adicionarSugestao} style={mobileStyles.btnAddSugestao}><Plus size={14} /> Adicionar</button>
            </div>
            {sugestoes.map((sug, index) => (
              <div key={sug.tempId} style={{ padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: '#f8fafc', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#2563eb' }}>Sugestão #{index + 1}</span>
                  <button type="button" onClick={() => removerSugestao(sug.tempId)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input type="text" placeholder="Nome do Produto *" style={mobileStyles.inputFieldItem} value={sug.nomeProduto} onChange={(e) => handleSugestaoChange(sug.tempId, 'nomeProduto', e.target.value)} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <input type="number" step="0.01" placeholder="Preço R$ *" style={mobileStyles.inputFieldItem} value={sug.preco} onChange={(e) => handleSugestaoChange(sug.tempId, 'preco', e.target.value)} />
                    <input type="number" min="1" placeholder="Qtd Mínima *" style={mobileStyles.inputFieldItem} value={sug.qtdMinima} onChange={(e) => handleSugestaoChange(sug.tempId, 'qtdMinima', e.target.value)} />
                  </div>
                  <input type="text" placeholder="Observação..." style={mobileStyles.inputFieldItem} value={sug.observacao} onChange={(e) => handleSugestaoChange(sug.tempId, 'observacao', e.target.value)} />
                </div>
              </div>
            ))}
          </div>

          {/* BOTÃO DE ENVIAR COM ESTADO DE LOADING */}
          <button 
            style={{ ...mobileStyles.submitButton, opacity: isSubmitting ? 0.7 : 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }} 
            onClick={enviarResposta}
            disabled={isSubmitting} 
          >
            {isSubmitting ? <><Loader2 size={18} className="animate-spin" /> Enviando Proposta...</> : 'Enviar Proposta'}
          </button>
        </div>
      )}
      
      {/* Classe CSS para rodar a animação do loader */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}

const mobileStyles = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '12px', fontFamily: "'Segoe UI', sans-serif", backgroundColor: '#f3f4f6', minHeight: '100vh', boxSizing: 'border-box' },
  card: { backgroundColor: 'white', padding: '14px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '8px' },
  labelMini: { fontSize: '11px', color: '#6b7280', fontWeight: '600' },
  inputFieldItem: { width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '15px', boxSizing: 'border-box' },
  btnFalta: (ativo) => ({ padding: '8px 12px', borderRadius: '6px', border: '1px solid', borderColor: ativo ? '#ef4444' : '#d1d5db', backgroundColor: ativo ? '#fee2e2' : 'white', color: ativo ? '#b91c1c' : '#6b7280', fontSize: '13px', fontWeight: '600', cursor: 'pointer', height: '39px' }),
  btnAddSugestao: { padding: '6px 12px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '12px', cursor: 'pointer' },
  submitButton: { width: '100%', padding: '14px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' },
  btnVoltar: { display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', backgroundColor: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' },
  successBox: { textAlign: 'center', padding: '30px 20px', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '12px', margin: '40px auto', maxWidth: '400px' },
  loginBox: { maxWidth: '380px', margin: '60px auto', backgroundColor: 'white', padding: '24px', borderRadius: '12px', textAlign: 'center' }
};