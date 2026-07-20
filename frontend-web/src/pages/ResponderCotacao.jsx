import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { Lock } from 'lucide-react';

export default function ResponderCotacao() {
  const { idCotacao } = useParams();
  
  // Lê diretamente os dados salvos pelo Login Principal
  const usuarioId = localStorage.getItem('usuarioId');
  const nomeUsuario = localStorage.getItem('nomeUsuario');
  
  const [isPrimeiroAcesso, setIsPrimeiroAcesso] = useState(localStorage.getItem('primeiroAcesso') === 'true');
  const [erroLogin, setErroLogin] = useState('');
  
  const [novoPin, setNovoPin] = useState('');
  const [confirmaPin, setConfirmaPin] = useState('');

  const [itens, setItens] = useState([]);
  const [precos, setPrecos] = useState({});
  const [quantidades, setQuantidades] = useState({}); 
  const [emFalta, setEmFalta] = useState({});
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
        
        respostas.forEach(r => {
          if (r.preco === -1) {
            novasFaltas[r.idItem] = true;
            novasQtds[r.idItem] = 0;
          } else {
            novosPrecos[r.idItem] = r.preco;
            novasQtds[r.idItem] = r.quantidadeDisponivel;
          }
        });
        
        setPrecos(novosPrecos);
        setEmFalta(novasFaltas);
        setQuantidades(novasQtds);
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

  const enviarResposta = async () => {
    const temPreco = Object.keys(precos).length > 0;
    const temFalta = Object.values(emFalta).some(v => v === true);

    if (!temPreco && !temFalta) {
      alert('Preencha pelo menos um preço ou indique itens em falta antes de enviar.');
      return;
    }

    try {
      const payload = itens
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
            quantidadeDisponivel: qtdFinal 
          };
        });

      if (payload.length === 0) {
        alert("Preencha algum valor.");
        return;
      }

      await api.post('/api/fornecedor/salvar-respostas', payload);
      setEnviado(true);
    } catch (error) {
      console.error('Erro ao enviar:', error);
      alert('Erro ao enviar cotação.');
    }
  };

  const styles = {
    container: { maxWidth: '800px', margin: '40px auto', padding: '20px', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", backgroundColor: '#f9fafb', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' },
    header: { textAlign: 'center', marginBottom: '30px', color: '#1f2937' },
    successBox: { textAlign: 'center', padding: '40px', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '8px', marginTop: '50px', maxWidth: '500px', margin: '50px auto' },
    card: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '20px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', flexWrap: 'wrap', gap: '15px' },
    info: { display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '200px' },
    productName: { fontSize: '16px', fontWeight: '600', color: '#374151' },
    quantity: { fontSize: '14px', color: '#6b7280' },
    actionsArea: { display: 'flex', alignItems: 'flex-end', gap: '15px', flexWrap: 'wrap' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
    labelMini: { fontSize: '12px', color: '#6b7280', fontWeight: '600' },
    input: { padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '15px', outlineColor: '#2563eb' },
    btnFalta: (ativo) => ({ padding: '8px 12px', borderRadius: '6px', border: '1px solid', borderColor: ativo ? '#ef4444' : '#d1d5db', backgroundColor: ativo ? '#fee2e2' : 'white', color: ativo ? '#b91c1c' : '#6b7280', fontSize: '13px', fontWeight: '600', cursor: 'pointer', height: '37px' }),
    button: { width: '100%', padding: '14px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', marginTop: '20px' },
    loginBox: { maxWidth: '400px', margin: '100px auto', backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', textAlign: 'center' }
  };

  if (isPrimeiroAcesso) {
    return (
      <div style={styles.loginBox}>
        <h2 style={{color: '#1f2937', marginBottom: '10px'}}>Segurança</h2>
        <p style={{color: '#6b7280', marginBottom: '25px', fontSize: '14px'}}>
          Olá, {nomeUsuario}.<br/>Este é o seu primeiro acesso. Por favor, crie um novo PIN numérico de segurança para continuar.
        </p>
        
        <form onSubmit={handlePrimeiroAcesso} style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
          <div style={{display: 'flex', alignItems: 'center', background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '8px', padding: '0 10px'}}>
            <Lock size={18} color="#9ca3af" />
            <input 
              type="password" placeholder="Novo PIN (4 a 6 dígitos)" required
              style={{flex: 1, border: 'none', background: 'transparent', padding: '12px', outline: 'none'}}
              value={novoPin} onChange={e => setNovoPin(e.target.value)}
            />
          </div>
          
          <div style={{display: 'flex', alignItems: 'center', background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '8px', padding: '0 10px'}}>
            <Lock size={18} color="#9ca3af" />
            <input 
              type="password" placeholder="Confirme o novo PIN" required
              style={{flex: 1, border: 'none', background: 'transparent', padding: '12px', outline: 'none'}}
              value={confirmaPin} onChange={e => setConfirmaPin(e.target.value)}
            />
          </div>

          {erroLogin && <span style={{color: '#dc2626', fontSize: '13px'}}>{erroLogin}</span>}

          <button type="submit" style={{...styles.button, marginTop: '10px', backgroundColor: '#059669'}}>
            Salvar e Continuar
          </button>
        </form>
      </div>
    );
  }

  if (enviado) {
    return (
      <div style={styles.successBox}>
        <h2 style={{ marginBottom: '10px' }}>✅ Proposta Enviada!</h2>
        <p>Obrigado, <strong>{nomeUsuario}</strong>!</p>
        <p>Sua proposta foi registrada com segurança no sistema.</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px'}}>
        <h1 style={{...styles.header, margin: 0}}>Cotação #{idCotacao}</h1>
        <div style={{background: '#dbeafe', color: '#1e40af', padding: '8px 12px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold'}}>
          Olá, {nomeUsuario}
        </div>
      </div>
      
      {loading ? (
        <p style={{ textAlign: 'center', color: '#666' }}>Carregando itens...</p>
      ) : (
        <div>
          {itens.length === 0 ? (
            <p style={{ textAlign: 'center' }}>Nenhum item nesta cotação.</p>
          ) : (
            itens.map(item => {
              const isFalta = !!emFalta[item.idItem];
              const qtdNaTela = quantidades[item.idItem] !== undefined ? quantidades[item.idItem] : item.quantidade;

              return (
                <div key={item.idItem} style={styles.card}>
                  <div style={styles.info}>
                    <span style={styles.productName}>{item.nomeProduto}</span>
                    <span style={styles.quantity}>Qtd Solicitada: <strong>{item.quantidade} un</strong></span>
                  </div>

                  <div style={styles.actionsArea}>
                    
                    <div style={{...styles.inputGroup, opacity: isFalta ? 0.4 : 1}}>
                      <label style={styles.labelMini}>Qtd. Disponível</label>
                      <input 
                        type="number" min="0" max={item.quantidade}
                        style={{ ...styles.input, width: '80px', textAlign: 'center', backgroundColor: isFalta ? '#f3f4f6' : 'white' }}
                        value={qtdNaTela}
                        onChange={(e) => handleQtdChange(item.idItem, e.target.value, item.quantidade)}
                        disabled={isFalta}
                      />
                    </div>

                    <div style={{...styles.inputGroup, opacity: isFalta ? 0.4 : 1}}>
                      <label style={styles.labelMini}>Preço Unit. (R$)</label>
                      <input 
                        type="number" step="0.01" placeholder="0,00"
                        style={{ ...styles.input, width: '90px', textAlign: 'right', backgroundColor: isFalta ? '#f3f4f6' : 'white' }}
                        value={precos[item.idItem] !== undefined ? precos[item.idItem] : ''}
                        onChange={(e) => handlePrecoChange(item.idItem, e.target.value)}
                        disabled={isFalta}
                      />
                    </div>

                    <div style={styles.inputGroup}>
                       <label style={{...styles.labelMini, color: 'transparent'}}>Ação</label>
                       <button 
                         style={styles.btnFalta(isFalta)}
                         onClick={() => toggleEmFalta(item.idItem)}
                         title="Marcar produto como indisponível"
                       >
                         {isFalta ? '🚫 Em falta' : 'Falta?'}
                       </button>
                    </div>

                  </div>
                </div>
              );
            })
          )}
          
          {itens.length > 0 && (
            <button style={styles.button} onClick={enviarResposta}>
              Enviar Proposta Completa
            </button>
          )}
        </div>
      )}
    </div>
  );
}