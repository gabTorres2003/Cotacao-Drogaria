import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import {
  ArrowLeft, CheckCircle, Plus, Trash2, RefreshCw, Loader2, AlertTriangle, Search, SortAsc, ArrowUp, ArrowDown, Tags
} from 'lucide-react'

export default function ResponderCotacao() {
  const { idCotacao } = useParams()
  const navigate = useNavigate()

  const usuarioId = localStorage.getItem('usuarioId')
  const nomeUsuario = localStorage.getItem('nomeUsuario')

  const [isPrimeiroAcesso, setIsPrimeiroAcesso] = useState(
    localStorage.getItem('primeiroAcesso') === 'true',
  )
  const [erroLogin, setErroLogin] = useState('')
  const [erroGeral, setErroGeral] = useState('')

  const [novoPin, setNovoPin] = useState('')
  const [confirmaPin, setConfirmaPin] = useState('')

  const [itens, setItens] = useState([])
  const [precos, setPrecos] = useState({})
  const [quantidades, setQuantidades] = useState({})
  const [observacoes, setObservacoes] = useState({})
  
  // Condição para Itens Normais
  const [exibirCondicao, setExibirCondicao] = useState({})
  const [qtdCondicao, setQtdCondicao] = useState({})
  const [precoCondicao, setPrecoCondicao] = useState({})

  const [produtoSubstituto, setProdutoSubstituto] = useState({})
  const [precoSubstituto, setPrecoSubstituto] = useState({})
  const [qtdSubstituto, setQtdSubstituto] = useState({})
  const [exibirTroca, setExibirTroca] = useState({})
  
  // Condição para Substitutos
  const [exibirCondicaoSubst, setExibirCondicaoSubst] = useState({})
  const [qtdCondicaoSubst, setQtdCondicaoSubst] = useState({})
  const [precoCondicaoSubst, setPrecoCondicaoSubst] = useState({})

  const [emFalta, setEmFalta] = useState({})
  const [sugestoes, setSugestoes] = useState([])
  
  const [loading, setLoading] = useState(false)
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [busca, setBusca] = useState('')
  const [ordemAlfabetica, setOrdemAlfabetica] = useState(false)

  const draftKey = `cotacao_draft_${idCotacao}_${usuarioId}`

  useEffect(() => {
    if (!isPrimeiroAcesso) carregarItens()
  }, [isPrimeiroAcesso])

  useEffect(() => {
    if (isInitialLoadDone) {
      try {
        const draft = {
          precos, quantidades, observacoes, produtoSubstituto, 
          precoSubstituto, qtdSubstituto, exibirTroca, emFalta, sugestoes,
          exibirCondicao, qtdCondicao, precoCondicao,
          exibirCondicaoSubst, qtdCondicaoSubst, precoCondicaoSubst
        }
        localStorage.setItem(draftKey, JSON.stringify(draft))
      } catch (error) {
        setErroGeral('Aviso: Armazenamento local cheio. O rascunho pode não ser salvo.')
      }
    }
  }, [precos, quantidades, observacoes, produtoSubstituto, precoSubstituto, qtdSubstituto, exibirTroca, emFalta, sugestoes, exibirCondicao, qtdCondicao, precoCondicao, exibirCondicaoSubst, qtdCondicaoSubst, precoCondicaoSubst, isInitialLoadDone, draftKey])

  const handlePrimeiroAcesso = async (e) => {
    e.preventDefault()
    setErroLogin('')
    if (novoPin !== confirmaPin) return setErroLogin('Os PINs não coincidem.')
    try {
      await api.put(`/api/fornecedor/${usuarioId}/primeiro-acesso`, { novaSenha: novoPin })
      localStorage.setItem('primeiroAcesso', 'false')
      setIsPrimeiroAcesso(false)
    } catch (error) { setErroLogin('Erro ao atualizar senha.') }
  }

  const tentarCarregarRascunhoLocal = () => {
    try {
      const draftStr = localStorage.getItem(draftKey)
      if (draftStr) {
        const draft = JSON.parse(draftStr)
        setPrecos(draft.precos || {})
        setQuantidades(draft.quantidades || {})
        setObservacoes(draft.observacoes || {})
        setProdutoSubstituto(draft.produtoSubstituto || {})
        setPrecoSubstituto(draft.precoSubstituto || {})
        setQtdSubstituto(draft.qtdSubstituto || {})
        setExibirTroca(draft.exibirTroca || {})
        setEmFalta(draft.emFalta || {})
        setSugestoes(draft.sugestoes || [])
        setExibirCondicao(draft.exibirCondicao || {})
        setQtdCondicao(draft.qtdCondicao || {})
        setPrecoCondicao(draft.precoCondicao || {})
        setExibirCondicaoSubst(draft.exibirCondicaoSubst || {})
        setQtdCondicaoSubst(draft.qtdCondicaoSubst || {})
        setPrecoCondicaoSubst(draft.precoCondicaoSubst || {})
        return true
      }
    } catch (error) { console.error("Erro rascunho", error) }
    return false
  }

  const carregarItens = async () => {
    setLoading(true)
    setErroGeral('')
    try {
      const response = await api.get(`/api/comparativo/listar-itens/${idCotacao}`)
      const itensCarregados = Array.isArray(response.data) ? response.data : []
      setItens(itensCarregados)

      if (itensCarregados.length > 0 && usuarioId) {
        const temRascunho = tentarCarregarRascunhoLocal()
        if (!temRascunho) await carregarRespostasAnteriores(usuarioId)
      }
    } catch (error) {
      setErroGeral('Erro de conexão ao carregar a cotação.')
    } finally {
      setLoading(false)
      setIsInitialLoadDone(true)
    }
  }

  const carregarRespostasAnteriores = async (idFornecedor) => {
    try {
      const res = await api.get(`/api/fornecedor/${idFornecedor}/cotacao/${idCotacao}/respostas`)
      const respostas = res.data

      if (respostas && respostas.length > 0) {
        const novosPrecos = {}, novasFaltas = {}, novasQtds = {}, novasObs = {}
        const novosSubstitutos = {}, novosPrecosSubst = {}, novasQtdsSubst = {}, novasExibicoes = {}
        const nExibCond = {}, nQtdCond = {}, nPrecoCond = {}
        const nExibCondS = {}, nQtdCondS = {}, nPrecoCondS = {}

        respostas.forEach((r) => {
          if (r.preco === -1) {
            novasFaltas[r.idItem] = true
            novasQtds[r.idItem] = 0
          } else {
            novosPrecos[r.idItem] = r.preco
            novasQtds[r.idItem] = r.quantidadeDisponivel
            
            if (r.quantidadeCondicao && r.precoCondicao) {
                nExibCond[r.idItem] = true
                nQtdCond[r.idItem] = r.quantidadeCondicao
                nPrecoCond[r.idItem] = r.precoCondicao
            }
          }
          if (r.observacao) novasObs[r.idItem] = r.observacao
          if (r.produtoSubstituto) {
            novosSubstitutos[r.idItem] = r.produtoSubstituto
            novosPrecosSubst[r.idItem] = r.precoSubstituto || r.preco
            novasQtdsSubst[r.idItem] = r.quantidadeSubstituto || r.quantidadeDisponivel
            novasExibicoes[r.idItem] = true
            
            if (r.quantidadeCondicaoSubstituto && r.precoCondicaoSubstituto) {
                nExibCondS[r.idItem] = true
                nQtdCondS[r.idItem] = r.quantidadeCondicaoSubstituto
                nPrecoCondS[r.idItem] = r.precoCondicaoSubstituto
            }
          }
        })

        setPrecos(novosPrecos); setEmFalta(novasFaltas); setQuantidades(novasQtds); setObservacoes(novasObs);
        setProdutoSubstituto(novosSubstitutos); setPrecoSubstituto(novosPrecosSubst); setQtdSubstituto(novasQtdsSubst); setExibirTroca(novasExibicoes);
        setExibirCondicao(nExibCond); setQtdCondicao(nQtdCond); setPrecoCondicao(nPrecoCond);
        setExibirCondicaoSubst(nExibCondS); setQtdCondicaoSubst(nQtdCondS); setPrecoCondicaoSubst(nPrecoCondS);
      }

      const resSug = await api.get(`/api/cotacao/sugestoes/${idCotacao}`)
      if (resSug.data && resSug.data.length > 0) {
        const minhasSugestoes = resSug.data
          .filter((s) => s.fornecedorNome === nomeUsuario)
          .map((s) => ({
            tempId: s.id || Date.now() + Math.random(),
            nomeProduto: s.nomeProduto,
            preco: s.preco,
            qtdMinima: s.qtdMinima,
            observacao: s.observacao || '',
            exibirCondicao: !!s.quantidadeCondicao,
            quantidadeCondicao: s.quantidadeCondicao || '',
            precoCondicao: s.precoCondicao || ''
          }))
        setSugestoes(minhasSugestoes)
      }
    } catch (error) { console.error('Erro ao carregar respostas anteriores', error) }
  }

  const handlePrecoChange = (idItem, valor) => {
    setEmFalta((prev) => ({ ...prev, [idItem]: false }))
    setPrecos((prev) => ({ ...prev, [idItem]: valor }))
  }

  const handleQtdChange = (idItem, valorStr, qtdMaxima) => {
    let valor = parseInt(valorStr, 10)
    if (isNaN(valor) || valor < 0) valor = 0
    if (valor > qtdMaxima) valor = qtdMaxima
    setQuantidades((prev) => ({ ...prev, [idItem]: valor }))
  }

  const toggleEmFalta = (idItem) => {
    setEmFalta((prev) => {
      const isFalta = !prev[idItem]
      if (isFalta) {
        setPrecos((prevPrecos) => { const newPrecos = { ...prevPrecos }; delete newPrecos[idItem]; return newPrecos })
      }
      return { ...prev, [idItem]: isFalta }
    })
  }

  const adicionarSugestao = () => {
    setSugestoes((prev) => [
      ...prev,
      { tempId: Date.now(), nomeProduto: '', preco: '', qtdMinima: 1, observacao: '', exibirCondicao: false, quantidadeCondicao: '', precoCondicao: '' },
    ])
  }

  const handleSugestaoChange = (tempId, campo, valor) => {
    setSugestoes((prev) => prev.map((item) => item.tempId === tempId ? { ...item, [campo]: valor } : item))
  }

  const removerSugestao = (tempId) => {
    setSugestoes((prev) => prev.filter((item) => item.tempId !== tempId))
  }

  const enviarResposta = async () => {
    setIsSubmitting(true)
    setErroGeral('')
    
    try {
      const itensRespostas = itens.map((item) => {
        const isFalta = !!emFalta[item.idItem]
        let precoFinal = isFalta ? -1 : parseFloat(String(precos[item.idItem] || '0').replace(',', '.')) || 0
        let qtdFinal = isFalta ? 0 : quantidades[item.idItem] !== undefined ? quantidades[item.idItem] : item.quantidade
        const temTroca = !!exibirTroca[item.idItem] && produtoSubstituto[item.idItem]?.trim() !== ''

        return {
          idItem: item.idItem,
          idFornecedor: parseInt(usuarioId),
          preco: precoFinal,
          quantidadeDisponivel: qtdFinal,
          observacao: observacoes[item.idItem] || '',
          
          quantidadeCondicao: (!isFalta && exibirCondicao[item.idItem] && qtdCondicao[item.idItem]) ? Number(qtdCondicao[item.idItem]) : null,
          precoCondicao: (!isFalta && exibirCondicao[item.idItem] && precoCondicao[item.idItem]) ? parseFloat(String(precoCondicao[item.idItem]).replace(',', '.')) : null,
          
          produtoSubstituto: temTroca ? produtoSubstituto[item.idItem].trim() : '',
          precoSubstituto: temTroca ? parseFloat(String(precoSubstituto[item.idItem] || '0').replace(',', '.')) || 0 : null,
          quantidadeSubstituto: temTroca ? parseInt(qtdSubstituto[item.idItem] || item.quantidade, 10) : null,
          
          quantidadeCondicaoSubstituto: (temTroca && exibirCondicaoSubst[item.idItem] && qtdCondicaoSubst[item.idItem]) ? Number(qtdCondicaoSubst[item.idItem]) : null,
          precoCondicaoSubstituto: (temTroca && exibirCondicaoSubst[item.idItem] && precoCondicaoSubst[item.idItem]) ? parseFloat(String(precoCondicaoSubst[item.idItem]).replace(',', '.')) : null,
        }
      })

      const sugestoesFormatadas = sugestoes
        .filter((s) => s.nomeProduto.trim() !== '' && Number(s.preco) > 0)
        .map((s) => ({
          nomeProduto: s.nomeProduto.trim(),
          preco: parseFloat(String(s.preco).replace(',', '.')),
          qtdMinima: Number(s.qtdMinima) || 1,
          observacao: s.observacao || '',
          quantidadeCondicao: (s.exibirCondicao && s.quantidadeCondicao) ? Number(s.quantidadeCondicao) : null,
          precoCondicao: (s.exibirCondicao && s.precoCondicao) ? parseFloat(String(s.precoCondicao).replace(',', '.')) : null
        }))

      const payload = {
        cotacaoId: Number(idCotacao),
        fornecedorId: parseInt(usuarioId),
        itens: itensRespostas,
        sugestoes: sugestoesFormatadas,
      }

      await api.post('/api/comparativo/salvar-respostas-completas', payload)
      localStorage.removeItem(draftKey)
      setEnviado(true)
      setTimeout(() => navigate('/portal-fornecedor'), 3000)
    } catch (error) {
      setErroGeral(`Erro ao salvar a cotação: ${error.response?.data?.message || error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const limparRascunho = () => {
    if(window.confirm('Isso apagará todas as respostas. Tem certeza?')) {
      localStorage.removeItem(draftKey)
      window.location.reload()
    }
  }

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const scrollToBottom = () => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });

  const getNomeReal = (nomeProduto) => nomeProduto;

  const itensProcessados = itens
    .filter(item => {
      if (!busca) return true;
      return getNomeReal(item.nomeProduto).toLowerCase().includes(busca.toLowerCase());
    })
    .sort((a, b) => {
      if (ordemAlfabetica) return getNomeReal(a.nomeProduto).localeCompare(getNomeReal(b.nomeProduto));
      return 0;
    });

  if (isPrimeiroAcesso) {
    return (
      <div style={mobileStyles.loginBox}>
        <h2 style={{ color: '#1f2937', marginBottom: '10px' }}>Segurança</h2>
        <p style={{ color: '#6b7280', marginBottom: '25px', fontSize: '14px' }}>Crie um novo PIN numérico.</p>
        <form onSubmit={handlePrimeiroAcesso} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input type="password" placeholder="Novo PIN" required style={mobileStyles.inputField} value={novoPin} onChange={(e) => setNovoPin(e.target.value)} />
          <input type="password" placeholder="Confirme o PIN" required style={mobileStyles.inputField} value={confirmaPin} onChange={(e) => setConfirmaPin(e.target.value)} />
          {erroLogin && <div style={{ color: '#ef4444', fontSize: '13px', fontWeight: 'bold' }}>{erroLogin}</div>}
          <button type="submit" style={{ ...mobileStyles.submitButton, backgroundColor: '#059669' }}>Salvar</button>
        </form>
      </div>
    )
  }

  if (enviado) {
    return (
      <div style={mobileStyles.successBox}>
        <CheckCircle size={48} color="#059669" style={{ margin: '0 auto 15px auto' }} />
        <h2 style={{ marginBottom: '10px' }}>Proposta Enviada!</h2>
        <p>Retornando ao painel...</p>
      </div>
    )
  }

  return (
    <div style={mobileStyles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', position: 'sticky', top: 0, backgroundColor: '#f3f4f6', zIndex: 100, padding: '12px 0', marginTop: '-12px', borderBottom: '1px solid #e5e7eb' }}>
        <button onClick={() => navigate('/portal-fornecedor')} style={mobileStyles.btnVoltar}><ArrowLeft size={18} /> Voltar</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/assets/logo-torres.png" alt="Torres Farma" style={{ height: '24px' }} />
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Cotação #{idCotacao}</h1>
        </div>
        <div style={{ background: '#dbeafe', color: '#1e40af', padding: '6px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>{nomeUsuario}</div>
      </div>

      <div style={{ position: 'sticky', top: '56px', backgroundColor: '#f3f4f6', zIndex: 99, paddingBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input type="text" placeholder="Pesquisar produto..." value={busca} onChange={(e) => setBusca(e.target.value)} style={{ ...mobileStyles.inputFieldItem, paddingLeft: '36px' }} />
          </div>
          <button onClick={() => setOrdemAlfabetica(!ordemAlfabetica)} style={{ ...mobileStyles.btnVoltar, backgroundColor: ordemAlfabetica ? '#dbeafe' : 'white', color: ordemAlfabetica ? '#1e40af' : '#4b5563', border: '1px solid #cbd5e1' }}>
            <SortAsc size={16} /> {ordemAlfabetica ? 'A-Z' : 'Padrão'}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', color: '#6b7280' }}>
          <Loader2 size={32} className="animate-spin" color="#3b82f6" style={{ marginBottom: '10px' }} />
          <p>Carregando itens...</p>
        </div>
      ) : (
        <div>
          {itensProcessados.map((item) => {
              const isFalta = !!emFalta[item.idItem]
              const qtdNaTela = quantidades[item.idItem] !== undefined ? quantidades[item.idItem] : item.quantidade
              const temTrocaAtiva = !!exibirTroca[item.idItem]
              const condicaoAtiva = !!exibirCondicao[item.idItem]
              const condicaoSubstAtiva = !!exibirCondicaoSubst[item.idItem]

              return (
                <div key={item.idItem} style={mobileStyles.card}>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#1f2937' }}>{getNomeReal(item.nomeProduto)}</div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>Solicitado: <strong>{item.quantidade} un</strong></div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', alignItems: 'flex-end', marginTop: '8px' }}>
                    <div>
                      <label style={mobileStyles.labelMini}>Qtd. Disp.</label>
                      <input type="number" min="0" max={item.quantidade} style={mobileStyles.inputFieldItem} value={qtdNaTela} onWheel={(e) => e.target.blur()} onChange={(e) => handleQtdChange(item.idItem, e.target.value, item.quantidade) } />
                    </div>
                    <div>
                      <label style={mobileStyles.labelMini}>Preço Unit. (R$)</label>
                      <input type="number" step="0.01" placeholder="0,00" style={mobileStyles.inputFieldItem} value={precos[item.idItem] !== undefined ? precos[item.idItem] : ''} onWheel={(e) => e.target.blur()} onChange={(e) => handlePrecoChange(item.idItem, e.target.value)} />
                    </div>
                    <button type="button" style={mobileStyles.btnFalta(isFalta)} onClick={() => toggleEmFalta(item.idItem)}>{isFalta ? 'Em falta' : 'Falta?'}</button>
                  </div>

                  {/* BOX: CONDIÇÃO ITEM NORMAL */}
                  {!isFalta && (
                    <div style={{ marginTop: '8px' }}>
                      <button type="button" onClick={() => setExibirCondicao(p => ({...p, [item.idItem]: !p[item.idItem]}))} style={mobileStyles.btnLinkAdd}>
                        <Tags size={14} /> {condicaoAtiva ? 'Remover Condição' : 'Adicionar Condição / Escalonamento'}
                      </button>
                      {condicaoAtiva && (
                        <div style={mobileStyles.boxCondicao}>
                          <span style={{ fontSize: '12px', color: '#166534', fontWeight: 'bold' }}>Na compra de</span>
                          <input type="number" min="2" placeholder="Qtd" style={mobileStyles.inputMini} value={qtdCondicao[item.idItem] || ''} onChange={e => setQtdCondicao(p => ({...p, [item.idItem]: e.target.value}))}/>
                          <span style={{ fontSize: '12px', color: '#166534', fontWeight: 'bold' }}>unidades, sai por R$</span>
                          <input type="number" step="0.01" placeholder="Valor" style={mobileStyles.inputMini} value={precoCondicao[item.idItem] || ''} onChange={e => setPrecoCondicao(p => ({...p, [item.idItem]: e.target.value}))}/>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ marginTop: '10px' }}>
                    <button type="button" onClick={() => setExibirTroca((prev) => ({ ...prev, [item.idItem]: !prev[item.idItem] }))} style={mobileStyles.btnLinkAdd}>
                      <RefreshCw size={14} /> {temTrocaAtiva ? 'Remover Sugestão de Troca' : 'Sugerir Troca de Marca/Laboratório'}
                    </button>

                    {temTrocaAtiva && (
                      <div style={{ marginTop: '8px', padding: '10px', backgroundColor: '#eff6ff', borderRadius: '6px', border: '1px solid #bfdbfe', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div>
                          <label style={mobileStyles.labelMini}>Nome do Produto Alternativo *</label>
                          <input type="text" placeholder="Ex: Paracetamol 500mg C/ 20 - Medley" style={{ ...mobileStyles.inputFieldItem, backgroundColor: 'white' }} value={produtoSubstituto[item.idItem] || ''} onChange={(e) => setProdutoSubstituto((prev) => ({ ...prev, [item.idItem]: e.target.value }))} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <div>
                            <label style={mobileStyles.labelMini}>Qtd. Disp. (Troca)</label>
                            <input type="number" min="0" style={{ ...mobileStyles.inputFieldItem, backgroundColor: 'white' }} value={qtdSubstituto[item.idItem] !== undefined ? qtdSubstituto[item.idItem] : item.quantidade} onChange={(e) => setQtdSubstituto((prev) => ({ ...prev, [item.idItem]: e.target.value }))} />
                          </div>
                          <div>
                            <label style={mobileStyles.labelMini}>Preço Unit. R$ (Troca)</label>
                            <input type="number" step="0.01" placeholder="0,00" style={{ ...mobileStyles.inputFieldItem, backgroundColor: 'white' }} value={precoSubstituto[item.idItem] !== undefined ? precoSubstituto[item.idItem] : ''} onChange={(e) => setPrecoSubstituto((prev) => ({ ...prev, [item.idItem]: e.target.value }))} />
                          </div>
                        </div>

                        {/* BOX: CONDIÇÃO SUBSTITUTO */}
                        <div style={{ marginTop: '4px' }}>
                            <button type="button" onClick={() => setExibirCondicaoSubst(p => ({...p, [item.idItem]: !p[item.idItem]}))} style={mobileStyles.btnLinkAdd}>
                                <Tags size={14} /> {condicaoSubstAtiva ? 'Remover Condição' : 'Adicionar Condição na Troca'}
                            </button>
                            {condicaoSubstAtiva && (
                                <div style={mobileStyles.boxCondicao}>
                                <span style={{ fontSize: '12px', color: '#166534', fontWeight: 'bold' }}>Na compra de</span>
                                <input type="number" min="2" placeholder="Qtd" style={mobileStyles.inputMini} value={qtdCondicaoSubst[item.idItem] || ''} onChange={e => setQtdCondicaoSubst(p => ({...p, [item.idItem]: e.target.value}))}/>
                                <span style={{ fontSize: '12px', color: '#166534', fontWeight: 'bold' }}>unidades, sai por R$</span>
                                <input type="number" step="0.01" placeholder="Valor" style={mobileStyles.inputMini} value={precoCondicaoSubst[item.idItem] || ''} onChange={e => setPrecoCondicaoSubst(p => ({...p, [item.idItem]: e.target.value}))}/>
                                </div>
                            )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: '6px' }}>
                    <label style={mobileStyles.labelMini}>Observação / Validade</label>
                    <input type="text" placeholder="Ex: Lote 2027..." style={mobileStyles.inputFieldItem} value={observacoes[item.idItem] || ''} onChange={(e) => setObservacoes((prev) => ({ ...prev, [item.idItem]: e.target.value }))} />
                  </div>
                </div>
              )
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
                    <input type="number" step="0.01" placeholder="Preço R$ *" style={mobileStyles.inputFieldItem} value={sug.preco} onWheel={(e) => e.target.blur()} onChange={(e) => handleSugestaoChange(sug.tempId, 'preco', e.target.value)} />
                    <input type="number" min="1" placeholder="Qtd Mínima *" style={mobileStyles.inputFieldItem} value={sug.qtdMinima} onWheel={(e) => e.target.blur()} onChange={(e) => handleSugestaoChange(sug.tempId, 'qtdMinima', e.target.value)} />
                  </div>
                  
                  {/* BOX: CONDIÇÃO SUGESTÃO EXTRA */}
                  <div>
                      <button type="button" onClick={() => handleSugestaoChange(sug.tempId, 'exibirCondicao', !sug.exibirCondicao)} style={mobileStyles.btnLinkAdd}>
                          <Tags size={14} /> {sug.exibirCondicao ? 'Remover Condição' : 'Adicionar Condição / Escalonamento'}
                      </button>
                      {sug.exibirCondicao && (
                          <div style={mobileStyles.boxCondicao}>
                          <span style={{ fontSize: '12px', color: '#166534', fontWeight: 'bold' }}>Na compra de</span>
                          <input type="number" min="2" placeholder="Qtd" style={mobileStyles.inputMini} value={sug.quantidadeCondicao || ''} onChange={e => handleSugestaoChange(sug.tempId, 'quantidadeCondicao', e.target.value)}/>
                          <span style={{ fontSize: '12px', color: '#166534', fontWeight: 'bold' }}>unidades, sai por R$</span>
                          <input type="number" step="0.01" placeholder="Valor" style={mobileStyles.inputMini} value={sug.precoCondicao || ''} onChange={e => handleSugestaoChange(sug.tempId, 'precoCondicao', e.target.value)}/>
                          </div>
                      )}
                  </div>

                  <input type="text" placeholder="Observação..." style={mobileStyles.inputFieldItem} value={sug.observacao} onChange={(e) => handleSugestaoChange(sug.tempId, 'observacao', e.target.value)} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '30px' }}>
            {erroGeral && (<div style={mobileStyles.errorBox}><AlertTriangle size={20} style={{ flexShrink: 0 }} /><span>{erroGeral}</span></div>)}
            <button style={{ ...mobileStyles.submitButton, opacity: isSubmitting ? 0.7 : 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }} onClick={enviarResposta} disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 size={18} className="animate-spin" /> Enviando Proposta...</> : 'Enviar Proposta'}
            </button>
            <button onClick={limparRascunho} style={{ width: '100%', background: 'none', border: 'none', color: '#ef4444', fontSize: '13px', fontWeight: 'bold', marginTop: '16px', cursor: 'pointer', textDecoration: 'underline' }}>
              Apagar rascunho e recomeçar
            </button>
          </div>

          <div style={{ position: 'fixed', bottom: '24px', right: '24px', display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 1000 }}>
            <button onClick={scrollToTop} style={mobileStyles.fabButton}><ArrowUp size={24} /></button>
            <button onClick={scrollToBottom} style={mobileStyles.fabButton}><ArrowDown size={24} /></button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  )
}

const mobileStyles = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '12px', fontFamily: "'Segoe UI', sans-serif", backgroundColor: '#f3f4f6', minHeight: '100vh', boxSizing: 'border-box' },
  card: { backgroundColor: 'white', padding: '14px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '8px' },
  labelMini: { fontSize: '11px', color: '#6b7280', fontWeight: '600' },
  inputFieldItem: { width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '15px', boxSizing: 'border-box' },
  inputMini: { padding: '6px', borderRadius: '4px', border: '1px solid #86efac', fontSize: '13px', width: '70px', textAlign: 'center', outline: 'none' },
  boxCondicao: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginTop: '6px', padding: '10px', backgroundColor: '#f0fdf4', borderRadius: '6px', border: '1px dashed #4ade80' },
  btnLinkAdd: { background: 'none', border: 'none', color: '#16a34a', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 },
  btnFalta: (ativo) => ({ padding: '8px 12px', borderRadius: '6px', border: '1px solid', borderColor: ativo ? '#ef4444' : '#d1d5db', backgroundColor: ativo ? '#fee2e2' : 'white', color: ativo ? '#b91c1c' : '#6b7280', fontSize: '13px', fontWeight: '600', cursor: 'pointer', height: '39px' }),
  btnAddSugestao: { padding: '6px 12px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '12px', cursor: 'pointer' },
  submitButton: { width: '100%', padding: '14px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' },
  btnVoltar: { display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', backgroundColor: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' },
  fabButton: { width: '46px', height: '46px', borderRadius: '23px', backgroundColor: '#2563eb', color: 'white', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', cursor: 'pointer' },
  successBox: { textAlign: 'center', padding: '30px 20px', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '12px', margin: '40px auto', maxWidth: '400px' },
  loginBox: { maxWidth: '380px', margin: '60px auto', backgroundColor: 'white', padding: '24px', borderRadius: '12px', textAlign: 'center' },
  errorBox: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', backgroundColor: '#fee2e2', border: '1px solid #f87171', borderRadius: '8px', color: '#991b1b', fontSize: '14px', marginBottom: '15px', fontWeight: '600', textAlign: 'left' }
}