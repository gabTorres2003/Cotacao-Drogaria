import { useEffect, useState } from 'react';
import api from '../services/api';
import { X, Send, User, Check } from 'lucide-react';

export default function EnviarLinkModal({ idCotacao, onClose, onStatusUpdate }) {
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enviados, setEnviados] = useState([]);

  useEffect(() => {
    carregarDados();
  }, [idCotacao]);

  const carregarDados = () => {
    // 1. Carrega Fornecedores
    api.get('/api/fornecedor')
      .then((res) => {
        if (Array.isArray(res.data)) {
          setFornecedores(res.data);
        } else {
          setFornecedores([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setFornecedores([]);
        setLoading(false);
      });

    // 2. Carrega lista de enviados do LocalStorage
    const salvos = localStorage.getItem(`enviados_cotacao_${idCotacao}`);
    if (salvos) {
      setEnviados(JSON.parse(salvos));
    }
  };

  const enviarPara = async (fornecedor) => {
    if (!fornecedor.telefone) {
      alert(`O fornecedor ${fornecedor.nome} não tem telefone cadastrado!`);
      return;
    }

    try {
      const link = `${window.location.origin}/responder-cotacao/${idCotacao}?f=${fornecedor.id}`;
      const mensagem = `Olá ${fornecedor.nome}, segue o link para cotação da Drogaria Torres: ${link}`;
      const urlEncode = encodeURIComponent(mensagem);
      const whatsappUrl = `https://wa.me/55${fornecedor.telefone}?text=${urlEncode}`;

      // Abre o WhatsApp
      window.open(whatsappUrl, '_blank');

      if (!enviados.includes(fornecedor.id)) {
        // Salva no LocalStorage (Fica verde)
        const novaLista = [...enviados, fornecedor.id];
        setEnviados(novaLista);
        localStorage.setItem(`enviados_cotacao_${idCotacao}`, JSON.stringify(novaLista));

        // Atualiza status no Backend para PENDENTE
        await api.put(`/api/cotacao/${idCotacao}/status`, { status: 'PENDENTE' });
        
        // Avisa o Dashboard para atualizar a cor da etiqueta
        if (onStatusUpdate) {
          onStatusUpdate();
        }
      }
      
    } catch (error) {
      console.error("Erro ao atualizar status", error);
      alert('Erro ao processar envio.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '400px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '15px',
          }}
        >
          <h3 style={{ margin: 0 }}>Enviar Cotação #{idCotacao}</h3>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
            Selecione o fornecedor:
          </p>

          {loading ? (
            <p>Carregando...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {fornecedores.map((f) => {
                const isEnviado = enviados.includes(f.id);

                return (
                  <button
                    key={f.id}
                    onClick={() => enviarPara(f)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px',
                      border: '1px solid',
                      borderColor: isEnviado ? '#bbf7d0' : '#eee',
                      backgroundColor: isEnviado ? '#dcfce7' : '#fff', 
                      color: isEnviado ? '#166534' : 'inherit',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <User size={16} /> {f.nome}
                    </span>
                    
                    {isEnviado ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 'bold' }}>
                        <Check size={16} /> Enviado
                      </span>
                    ) : (
                      <Send size={16} color="#2563eb" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}