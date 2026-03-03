import React, { useEffect, useState } from 'react';
import { X, Send, User, Users, CheckCircle } from 'lucide-react';
import api from '../services/api';

export default function EnviarLinkModal({ idCotacao, onClose, onStatusUpdate }) {
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estado que guarda quem já recebeu o link
  const [enviados, setEnviados] = useState(() => {
    const salvos = localStorage.getItem(`link_enviado_cotacao_${idCotacao}`);
    return salvos ? JSON.parse(salvos) : [];
  });

  useEffect(() => {
    carregarFornecedores();
  }, []);

  // Salva no navegador sempre que a lista de enviados mudar
  useEffect(() => {
    localStorage.setItem(`link_enviado_cotacao_${idCotacao}`, JSON.stringify(enviados));
  }, [enviados, idCotacao]);

  const carregarFornecedores = async () => {
    try {
      const response = await api.get('/api/fornecedor');
      setFornecedores(response.data);
    } catch (error) {
      console.error('Erro ao listar fornecedores', error);
    } finally {
      setLoading(false);
    }
  };

  const atualizarStatusCotacao = async () => {
    try {
      // Muda a cotação para PENDENTE (a aguardar respostas)
      await api.put(`/api/cotacao/${idCotacao}/status`, { status: 'PENDENTE' });
      if (onStatusUpdate) onStatusUpdate(); // Atualiza os cards no Dashboard
    } catch (error) {
      console.error("Erro ao atualizar status", error);
    }
  };

  // ENVIO INDIVIDUAL
  const enviarZap = (fornecedor) => {
    if (!enviados.includes(fornecedor.id)) {
      setEnviados([...enviados, fornecedor.id]);
      atualizarStatusCotacao();
    }

    const link = `${window.location.origin}/responder-cotacao/${idCotacao}`;
    const mensagem = `Olá ${fornecedor.nome}, segue o link para a cotação da Drogaria Torres Farma: ${link} \n\n🔒 *Aceda utilizando o seu E-mail e Senha cadastrados connosco.*`;
    
    // Com telefone: Vai direto para o contato
    const url = `https://api.whatsapp.com/send?phone=${fornecedor.telefone}&text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  };

  // ENVIO GERAL (LISTA DE TRANSMISSÃO)
  const enviarParaLista = () => {
    // Pega no ID de TODOS os fornecedores e marca como "Enviado"
    const todosIds = fornecedores.map(f => f.id);
    setEnviados(todosIds);
    atualizarStatusCotacao();

    const link = `${window.location.origin}/responder-cotacao/${idCotacao}`;
    const mensagem = `Olá prezados! Segue o link para a nova cotação da Drogaria Torres Farma: ${link} \n\n🔒 *Acessem utilizando o E-mail e Senha cadastrados com a gente.*`;
    
    // Sem telefone: O WhatsApp abre o ecrã para escolher os contatos ou Listas de Transmissão
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  };

  // ESTILOS DO MODAL
  const styles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modal: { backgroundColor: 'white', padding: '25px', borderRadius: '12px', width: '90%', maxWidth: '500px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '20px' },
    title: { margin: 0, fontSize: '20px', color: '#1f2937' },
    closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' },
    listaContainer: { overflowY: 'auto', flex: 1, paddingRight: '5px' },
    fornecedorItem: (jaEnviado) => ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', border: '1px solid', borderColor: jaEnviado ? '#bbf7d0' : '#e5e7eb', backgroundColor: jaEnviado ? '#f0fdf4' : 'white', borderRadius: '8px', marginBottom: '10px' }),
    infoArea: { display: 'flex', alignItems: 'center', gap: '12px' },
    iconBox: (jaEnviado) => ({ background: jaEnviado ? '#22c55e' : '#f3f4f6', color: jaEnviado ? 'white' : '#9ca3af', padding: '8px', borderRadius: '50%' }),
    nomeFornecedor: { fontWeight: '600', color: '#374151', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' },
    telefone: { fontSize: '13px', color: '#6b7280', margin: 0 },
    btnSendItem: (jaEnviado) => ({ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 15px', backgroundColor: jaEnviado ? 'transparent' : '#2563eb', color: jaEnviado ? '#22c55e' : 'white', border: jaEnviado ? '1px solid #22c55e' : 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }),
    
    // Botão Lista de Transmissão
    btnListaGeral: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '14px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '20px', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)' }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Solicitar Cotações</h2>
          <button style={styles.closeBtn} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* BOTÃO GERAL DE LISTA DE TRANSMISSÃO */}
        <button style={styles.btnListaGeral} onClick={enviarParaLista}>
          <Users size={20} />
          Enviar para Lista de Transmissão (Todos)
        </button>

        <div style={{ marginBottom: '10px', fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
          Ou envie individualmente:
        </div>

        <div style={styles.listaContainer}>
          {loading ? (
            <p style={{ textAlign: 'center', color: '#6b7280' }}>A carregar fornecedores...</p>
          ) : fornecedores.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#6b7280' }}>Nenhum fornecedor cadastrado. Vá a "Fornecedores" no menu para cadastrar.</p>
          ) : (
            fornecedores.map((fornecedor) => {
              const jaEnviado = enviados.includes(fornecedor.id);

              return (
                <div key={fornecedor.id} style={styles.fornecedorItem(jaEnviado)}>
                  <div style={styles.infoArea}>
                    <div style={styles.iconBox(jaEnviado)}>
                      <User size={18} />
                    </div>
                    <div>
                      <h4 style={styles.nomeFornecedor}>
                        {fornecedor.nome}
                        {jaEnviado && <CheckCircle size={16} color="#22c55e" />}
                      </h4>
                      <p style={styles.telefone}>{fornecedor.telefone || 'Sem telefone'}</p>
                    </div>
                  </div>

                  <button 
                    style={styles.btnSendItem(jaEnviado)}
                    onClick={() => enviarZap(fornecedor)}
                  >
                    {jaEnviado ? 'Reenviar Link' : <><Send size={16} /> Enviar Link</>}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}