import { useEffect, useState } from 'react';
import api from '../services/api';
import { Save, CheckCircle } from 'lucide-react';

export default function ResponderCotacao() {
  const [itens, setItens] = useState([]);
  const [precos, setPrecos] = useState({}); // Guarda os preços digitados
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(true);

  // Pega os IDs da URL 
  const params = new URLSearchParams(window.location.search);
  const idFornecedor = params.get('f');
  const idCotacao = params.get('c');

  useEffect(() => {
    carregarItens();
  }, []);

  const carregarItens = async () => {
    try {
      const response = await api.get(`/api/comparativo/${idCotacao}`);
      setItens(response.data);
      setLoading(false);
    } catch (error) {
      alert("Erro ao carregar cotação. Verifique o link.");
      setLoading(false);
    }
  };

  const handlePrecoChange = (idItem, valorTexto) => {
    setPrecos(prev => ({
      ...prev,
      [idItem]: valorTexto // Guarda como texto para permitir vírgula enquanto digita
    }));
  };

  const enviarResposta = async () => {
    
    alert("Para funcionar 100%, precisamos adicionar o ID do Item no DTO do Backend. Vamos fazer isso?");
  };

  if (enviado) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#166534' }}>
        <CheckCircle size={64} style={{ margin: '0 auto 20px' }} />
        <h1>Obrigado!</h1>
        <p>Sua cotação foi enviada com sucesso.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20, fontFamily: 'sans-serif' }}>
      <header style={{ marginBottom: 20, borderBottom: '1px solid #eee', paddingBottom: 10 }}>
        <h2 style={{ color: '#2563eb' }}>📝 Cotação Online</h2>
        <p style={{ color: '#666' }}>Preencha os valores unitários abaixo.</p>
      </header>

      {loading ? <p>Carregando produtos...</p> : (
        <form onSubmit={(e) => { e.preventDefault(); enviarResposta(); }}>
          {itens.map((item, index) => (
            <div key={index} style={{ 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '15px 0', borderBottom: '1px solid #f3f4f6' 
            }}>
              <div>
                <strong>{item.nomeProduto}</strong>
                <div style={{ fontSize: '0.8rem', color: '#888' }}>Qtd: {item.quantidade}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span>R$</span>
                <input 
                  type="text" 
                  placeholder="0,00"
                  style={{ 
                    width: 100, padding: 8, borderRadius: 4, border: '1px solid #ccc',
                    fontSize: '1rem', textAlign: 'right'
                  }}
                  onChange={(e) => console.log(e.target.value)} 
                />
              </div>
            </div>
          ))}

          <button style={{ 
            width: '100%', padding: 15, background: '#2563eb', color: 'white', 
            border: 'none', borderRadius: 8, fontSize: '1.1rem', marginTop: 30,
            cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: 10
          }}>
            <Save /> Enviar Cotação
          </button>
        </form>
      )}
    </div>
  );
}