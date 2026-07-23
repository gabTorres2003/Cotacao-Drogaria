import React, { useEffect, useState } from 'react';
import { X, Send, User, Users, CheckCircle, Clock } from 'lucide-react';
import api from '../services/api';

export default function EnviarLinkModal({ idCotacao, onClose, onStatusUpdate }) {
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const nomeUsuario = localStorage.getItem('nomeUsuario') || 'nossa equipe';
  
  const [vinculados, setVinculados] = useState([]);
  const [respondidos, setRespondidos] = useState([]);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      // Faz duas requisições simultâneas para cruzar os dados
      const [resForn, resCot] = await Promise.all([
        api.get('/api/fornecedor'),
        api.get('/api/cotacao')
      ]);
      
      setFornecedores(resForn.data);
      
      // Encontra a cotação e injeta as listas que vieram do banco de dados
      const cotacao = resCot.data.find(c => c.id === Number(idCotacao));
      if (cotacao) {
         setVinculados(cotacao.fornecedoresVinculadosIds || []);
         setRespondidos(cotacao.fornecedoresRespondidosIds || []);
      }
    } catch (error) {
      console.error('Erro ao carregar dados', error);
    } finally {
      setLoading(false);
    }
  };

  const vincularFornecedoresNoBackend = async (fornecedoresIds) => {
    try {
      await api.post(`/api/cotacao-fornecedor/vincular/${idCotacao}`, fornecedoresIds);
    } catch (error) {
      console.error("Erro ao vincular fornecedores no banco", error);
    }
  };

  const atualizarStatusCotacao = async () => {
    try {
      await api.put(`/api/cotacao/${idCotacao}/status`, { status: 'PENDENTE' });
      if (onStatusUpdate) onStatusUpdate();
    } catch (error) {
      console.error("Erro ao atualizar status", error);
    }
  };

  // ENVIO INDIVIDUAL
  const enviarZap = async (fornecedor) => {
    // Se ainda não estava vinculado no banco, nós vinculamos na hora
    if (!vinculados.includes(fornecedor.id)) {
      setVinculados(prev => [...prev, fornecedor.id]); // Atualiza a cor na hora pro usuário
      await vincularFornecedoresNoBackend([fornecedor.id]); 
      await atualizarStatusCotacao();
    }

    const link = `${window.location.origin}/responder-cotacao/${idCotacao}`;
    const mensagem = `Olá, ${fornecedor.nome}! \n\nJá liberamos a nossa nova cotação e aguardo a sua proposta. Por favor, acesse o link abaixo para preencher os valores:\n\n🔗 ${link}\n\n🔒 *Acesso rápido: utilize seu login e senha.*`;
    
    const url = `https://api.whatsapp.com/send?phone=${fornecedor.telefone}&text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  };

  // ENVIO GERAL (LISTA DE TRANSMISSÃO)
  const enviarParaLista = async () => {
    const todosIds = fornecedores.map(f => f.id);
    setVinculados(todosIds); // Atualiza todas as cores na hora
    await vincularFornecedoresNoBackend(todosIds);
    await atualizarStatusCotacao();
    
    const link = `${window.location.origin}/responder-cotacao/${idCotacao}`;
    const mensagem = `Olá, parceiros! Aqui é ${nomeUsuario} da Drogaria Torres Farma.\n\nAcabamos de liberar uma nova cotação. Aguardamos as melhores propostas de vocês!\n\n🔗 Acesse o link para preencher: ${link}\n\n🔒 *Acesso rápido: utilizem o login e senha já cadastrados.*`;
    
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  };

  // ESTILOS DO MODAL
  const styles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modal: { backgroundColor: 'white', padding: '25px', borderRadius: '12px', width: '90%', maxWidth: '550px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '20px' },
    title: { margin: 0, fontSize: '20px', color: '#1f2937', fontWeight: 'bold' },
    closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' },
    listaContainer: { overflowY: 'auto', flex: 1, paddingRight: '5px' },
    btnListaGeral: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '14px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '20px', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)', transition: '0.2s' }
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

        <button style={styles.btnListaGeral} onClick={enviarParaLista}>
          <Users size={20} />
          Enviar para Lista de Transmissão (Todos)
        </button>

        <div style={{ marginBottom: '15px', fontSize: '14px', color: '#6b7280', fontWeight: '600' }}>
          Status dos Fornecedores:
        </div>

        <div style={styles.listaContainer}>
          {loading ? (
            <p style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>Carregando dados dos fornecedores...</p>
          ) : fornecedores.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#6b7280' }}>Nenhum fornecedor cadastrado. Vá a "Fornecedores" no menu para cadastrar.</p>
          ) : (
            fornecedores.map((fornecedor) => {
              
              // LÓGICA MESTRA 100% BASEADA NO BANCO DE DADOS
              const isEnviado = vinculados.includes(fornecedor.id);
              const isRespondido = respondidos.includes(fornecedor.id);
              const isPendente = isEnviado && !isRespondido;

              let bgColor, borderColor, iconBg, iconColor, statusBadge, btnText, btnColor, btnBorder;

              if (isRespondido) {
                bgColor = '#f0fdf4'; borderColor = '#bbf7d0'; iconBg = '#22c55e'; iconColor = 'white';
                btnText = 'Reenviar Link'; btnColor = '#22c55e'; btnBorder = '1px solid #22c55e';
                statusBadge = <span style={{fontSize: '11px', padding: '3px 8px', backgroundColor: '#22c55e', color: 'white', borderRadius: '10px', fontWeight: 'bold'}}>Já Respondeu</span>;
              
              } else if (isPendente) {
                bgColor = '#fffbeb'; borderColor = '#fde68a'; iconBg = '#f59e0b'; iconColor = 'white';
                btnText = 'Cobrar Resposta'; btnColor = '#f59e0b'; btnBorder = '1px solid #f59e0b';
                statusBadge = <span style={{fontSize: '11px', padding: '3px 8px', backgroundColor: '#f59e0b', color: 'white', borderRadius: '10px', fontWeight: 'bold'}}>Aguardando</span>;
              
              } else {
                bgColor = 'white'; borderColor = '#e5e7eb'; iconBg = '#f3f4f6'; iconColor = '#9ca3af';
                btnText = 'Enviar Link'; btnColor = 'white'; btnBorder = 'none';
                statusBadge = <span style={{fontSize: '11px', padding: '3px 8px', backgroundColor: '#f3f4f6', color: '#6b7280', borderRadius: '10px', fontWeight: 'bold'}}>Não Enviado</span>;
              }

              return (
                <div key={fornecedor.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', border: `1px solid ${borderColor}`, backgroundColor: bgColor, borderRadius: '8px', marginBottom: '10px' }}>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: iconBg, color: iconColor, padding: '10px', borderRadius: '50%', display: 'flex' }}>
                      {isRespondido ? <CheckCircle size={18} /> : isPendente ? <Clock size={18} /> : <User size={18} />}
                    </div>
                    
                    <div>
                      <h4 style={{ fontWeight: '600', color: '#374151', margin: '0 0 6px 0', fontSize: '15px' }}>
                        {fornecedor.nome}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{fornecedor.telefone || 'Sem telefone'}</p>
                        {statusBadge}
                      </div>
                    </div>
                  </div>

                  <button 
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', 
                      backgroundColor: isPendente || isRespondido ? 'transparent' : '#2563eb', 
                      color: isPendente || isRespondido ? btnColor : 'white', 
                      border: btnBorder, borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px'
                    }}
                    onClick={() => enviarZap(fornecedor)}
                  >
                    {(isPendente || isRespondido) ? null : <Send size={14} />}
                    {btnText}
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