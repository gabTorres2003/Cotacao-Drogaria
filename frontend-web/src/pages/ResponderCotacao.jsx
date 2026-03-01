import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { Lock, Mail } from 'lucide-react';

export default function ResponderCotacao() {
  const { idCotacao } = useParams();
  
  // Controle de Login via Session Storage
  const [fornecedorLogado, setFornecedorLogado] = useState(() => {
    const salvo = sessionStorage.getItem(`fornecedor_cotacao_${idCotacao}`);
    return salvo ? JSON.parse(salvo) : null;
  });
  
  const [credenciais, setCredenciais] = useState({ email: '', senha: '' });
  const [erroLogin, setErroLogin] = useState('');

  // Estados da Cotação
  const [itens, setItens] = useState([]);
  const [precos, setPrecos] = useState({});
  const [quantidades, setQuantidades] = useState({}); 
  const [emFalta, setEmFalta] = useState({});
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  // Carrega os itens se o fornecedor estiver logado com sucesso
  useEffect(() => {
    if (fornecedorLogado) {
      carregarItens();
    }
  }, [fornecedorLogado]);

  // Função para logar o fornecedor
  const handleLogin = async (e) => {
    e.preventDefault();
    setErroLogin('');
    
    try {
      const response = await api.post('/api/fornecedor/login', credenciais);
      const fornecedor = response.data;
      
      setFornecedorLogado(fornecedor);
      sessionStorage.setItem(`fornecedor_cotacao_${idCotacao}`, JSON.stringify(fornecedor));
    } catch (error) {
      setErroLogin('E-mail ou senha incorretos. Verifique com a farmácia.');
    }
  };

  const carregarItens = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/comparativo/listar-itens/${idCotacao}`);
      setItens(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
      alert('Erro ao carregar a cotação.');
    } finally {
      setLoading(false);
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

    setQuantidades(prev => ({
      ...prev,
      [idItem]: valor
    }));
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
        .filter(item => precos[item.idItem] || emFalta[item.idItem])
        .map(item => {
          let precoFinal = 0;
          let qtdFinal = quantidades[item.idItem] !== undefined ? quantidades[item.idItem] : item.quantidade;

          if (emFalta[item.idItem]) {
            precoFinal = -1; 
            qtdFinal = 0; 
          } else {
            precoFinal = parseFloat(precos[item.idItem].replace(',', '.'));
          }

          return {
            idItem: item.idItem,
            idFornecedor: fornecedorLogado.id,
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
      // Limpar a sessão para não usar o link duas vezes 
      sessionStorage.removeItem(`fornecedor_cotacao_${idCotacao}`);
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

  // --- TELA DE LOGIN ---
  if (!fornecedorLogado && !enviado) {
    return (
      <div style={styles.loginBox}>
        <h2 style={{color: '#1f2937', marginBottom: '10px'}}>Acesso Restrito</h2>
        <p style={{color: '#6b7280', marginBottom: '25px', fontSize: '14px'}}>Cotação #{idCotacao} - Drogaria Torres</p>
        
        <form onSubmit={handleLogin} style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
          <div style={{display: 'flex', alignItems: 'center', background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '8px', padding: '0 10px'}}>
            <Mail size={18} color="#9ca3af" />
            <input 
              type="email" placeholder="Seu E-mail" required
              style={{flex: 1, border: 'none', background: 'transparent', padding: '12px', outline: 'none'}}
              value={credenciais.email} onChange={e => setCredenciais({...credenciais, email: e.target.value})}
            />
          </div>
          
          <div style={{display: 'flex', alignItems: 'center', background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '8px', padding: '0 10px'}}>
            <Lock size={18} color="#9ca3af" />
            <input 
              type="password" placeholder="Sua Senha" required
              style={{flex: 1, border: 'none', background: 'transparent', padding: '12px', outline: 'none'}}
              value={credenciais.senha} onChange={e => setCredenciais({...credenciais, senha: e.target.value})}
            />
          </div>

          {erroLogin && <span style={{color: '#dc2626', fontSize: '13px'}}>{erroLogin}</span>}

          <button type="submit" style={{...styles.button, marginTop: '10px'}}>Acessar Cotação</button>
        </form>
      </div>
    );
  }

  // --- TELA DE SUCESSO ---
  if (enviado) {
    return (
      <div style={styles.successBox}>
        <h2 style={{ marginBottom: '10px' }}>✅ Proposta Enviada!</h2>
        <p>Obrigado, <strong>{fornecedorLogado?.nome}</strong>!</p>
        <p>Sua proposta foi registrada com segurança no sistema.</p>
      </div>
    );
  }

  // --- TELA DE PREENCHIMENTO DA COTAÇÃO ---
  return (
    <div style={styles.container}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px'}}>
        <h1 style={{...styles.header, margin: 0}}>Cotação #{idCotacao}</h1>
        <div style={{background: '#dbeafe', color: '#1e40af', padding: '8px 12px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold'}}>
          Olá, {fornecedorLogado.nome}
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
                    
                    {/* Qtd Disponível */}
                    <div style={{...styles.inputGroup, opacity: isFalta ? 0.4 : 1}}>
                      <label style={styles.labelMini}>Qtd. Disponível</label>
                      <input 
                        type="number"
                        min="0"
                        max={item.quantidade}
                        style={{ ...styles.input, width: '80px', textAlign: 'center', backgroundColor: isFalta ? '#f3f4f6' : 'white' }}
                        value={qtdNaTela}
                        onChange={(e) => handleQtdChange(item.idItem, e.target.value, item.quantidade)}
                        disabled={isFalta}
                      />
                    </div>

                    {/* Preço Unitário */}
                    <div style={{...styles.inputGroup, opacity: isFalta ? 0.4 : 1}}>
                      <label style={styles.labelMini}>Preço Unit. (R$)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        placeholder="0,00"
                        style={{ ...styles.input, width: '90px', textAlign: 'right', backgroundColor: isFalta ? '#f3f4f6' : 'white' }}
                        value={precos[item.idItem] || ''}
                        onChange={(e) => handlePrecoChange(item.idItem, e.target.value)}
                        disabled={isFalta}
                      />
                    </div>

                    {/* Botão Em Falta */}
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