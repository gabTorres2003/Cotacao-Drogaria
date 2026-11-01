import React, { useEffect, useState } from 'react';
import { X, Send, Users, CheckCircle, Clock, AlertTriangle, User, Filter } from 'lucide-react';
import api from '../services/api';

export default function EnviarLinkModal({ idCotacao, onClose, onStatusUpdate }) {
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [setorCotacao, setSetorCotacao] = useState('AMBOS'); 

  const nomeUsuario = localStorage.getItem('nomeUsuario') || 'nossa equipe';

  const [vinculados, setVinculados] = useState([]);
  const [respondidos, setRespondidos] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmModal, setConfirmModal] = useState(null); 

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [resForn, resVinculos, resCotacao] = await Promise.all([
        api.get('/api/fornecedor'),
        api.get(`/api/cotacao-fornecedor/cotacao/${idCotacao}`),
        api.get(`/api/cotacao/${idCotacao}`) 
      ]);

      const setorAtual = (resCotacao.data.setor || resCotacao.data.setorCompra || 'AMBOS').toUpperCase();
      setSetorCotacao(setorAtual);

      // FILTRO INTELIGENTE: Cruza o setor da cotação com o setor do fornecedor
      const fornecedoresValidos = resForn.data.filter(f => {
          const setorForn = (f.setorCompra || 'AMBOS').toUpperCase();
          if (setorAtual === 'AMBOS') return true; // Cotação mista aceita todos
          if (setorForn === 'AMBOS') return true;  // Fornecedor misto atende todas as cotações
          return setorForn === setorAtual;         // Medicamentos == Medicamentos, etc.
      });

      setFornecedores(fornecedoresValidos);

      const listaVinculos = resVinculos.data || [];

      const idsVinculados = listaVinculos.map(vinculo => vinculo.fornecedor.id);
      const idsRespondidos = listaVinculos
        .filter(vinculo => vinculo.status === 'RESPONDIDA')
        .map(vinculo => vinculo.fornecedor.id);

      setVinculados(idsVinculados);
      setRespondidos(idsRespondidos);

      // Marca todos os pendentes por padrão
      const idsPendentes = fornecedoresValidos.filter(f => !idsRespondidos.includes(f.id)).map(f => f.id);
      setSelectedIds(idsPendentes);

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
      console.error("Erro ao vincular fornecedores", error);
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

  const solicitarEnvioLote = () => {
    if (selectedIds.length === 0) {
        alert('Selecione pelo menos um fornecedor para enviar a cotação.');
        return;
    }
    setConfirmModal({ type: 'LOTE' });
  };

  const solicitarEnvioIndividual = (fornecedor) => {
    setConfirmModal({ type: 'INDIVIDUAL', fornecedor });
  };

  const confirmarEnvio = async () => {
    if (confirmModal.type === 'LOTE') {
        await processarEnvioLote();
    } else {
        await processarEnvioIndividual(confirmModal.fornecedor);
    }
    setConfirmModal(null);
  };

  const processarEnvioIndividual = async (fornecedor) => {
    if (!vinculados.includes(fornecedor.id)) {
      setVinculados(prev => [...prev, fornecedor.id]);
      await vincularFornecedoresNoBackend([fornecedor.id]);
      await atualizarStatusCotacao();
    }

    const link = `${window.location.origin}/responder-cotacao/${idCotacao}`;
    const nomeExibicaoFornecedor = fornecedor.empresa ? `${fornecedor.empresa} (${fornecedor.nome})` : fornecedor.nome;
    const mensagem = `Olá, *${nomeExibicaoFornecedor}*! \n\nJá liberamos a nossa nova cotação e aguardo a sua proposta. Por favor, acesse o link abaixo para preencher os valores:\n\n🔗 ${link}\n\n🔒 *Acesso rápido: utilize seu login e senha.*`;

    let telefoneLimpo = fornecedor.telefone ? fornecedor.telefone.replace(/\D/g, '') : '';
    if (telefoneLimpo.length === 10 || telefoneLimpo.length === 11) {
      telefoneLimpo = `55${telefoneLimpo}`;
    }

    const url = `https://api.whatsapp.com/send?phone=${telefoneLimpo}&text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  };

  const processarEnvioLote = async () => {
    const idsParaVincular = selectedIds.filter(id => !vinculados.includes(id));

    if (idsParaVincular.length > 0) {
        setVinculados(prev => [...prev, ...idsParaVincular]);
        await vincularFornecedoresNoBackend(idsParaVincular);
        await atualizarStatusCotacao();
    }

    const horaAtual = new Date().getHours();
    let saudacao = 'Boa noite';
    if (horaAtual >= 5 && horaAtual < 12) {
      saudacao = 'Bom dia';
    } else if (horaAtual >= 12 && horaAtual < 18) {
      saudacao = 'Boa tarde';
    }

    const mensagem = `${saudacao}, pessoal! 🚀\n\nA cotação de hoje já está liberada no nosso portal. Fico no aguardo das propostas de vocês!\n\n🔗 *Acesse o link para preencher:* https://cotacaotorresfarma.netlify.app\n\n🟢 *A COTAÇÃO ATUAL (#${idCotacao}) ESTARÁ COM O BOTÃO VERDE "RESPONDER"*\n\n🔒 *Acesso rápido: utilizem o login e a senha (PIN) que vocês já cadastraram.*`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  };

  const handleToggleSelect = (id) => {
      setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handleSelectAll = (e) => {
      if (e.target.checked) {
          const idsPendentes = fornecedores.filter(f => !respondidos.includes(f.id)).map(f => f.id);
          setSelectedIds(idsPendentes);
      } else {
          setSelectedIds([]);
      }
  };

  const styles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modal: { backgroundColor: 'var(--surface)', padding: '25px', borderRadius: '12px', width: '90%', maxWidth: '550px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '15px', marginBottom: '20px' },
    title: { margin: 0, fontSize: '20px', color: 'var(--text)', fontWeight: 'bold' },
    closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' },
    listaContainer: { overflowY: 'auto', flex: 1, paddingRight: '5px' },
    btnListaGeral: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '14px', backgroundColor: 'var(--success)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '20px', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)', transition: '0.2s' }
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

        {!loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--surface-muted)', padding: '10px 14px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--border-strong)' }}>
            <Filter size={18} color="var(--info)" />
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Cotação de <strong>{setorCotacao === 'AMBOS' ? 'Medicamentos e Perfumaria' : setorCotacao}</strong>.<br/> 
              Exibindo apenas fornecedores compatíveis com este setor.
            </span>
          </div>
        )}

        {confirmModal ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <AlertTriangle size={48} color="var(--warning)" style={{ margin: '0 auto 15px auto' }} />
                <h3 style={{ fontSize: '18px', color: 'var(--text)', marginBottom: '10px' }}>Confirmar Envio</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '25px', lineHeight: '1.5' }}>
                    {confirmModal.type === 'LOTE'
                        ? `Você está prestes a gerar o link de transmissão e registrar no sistema o envio para ${selectedIds.length} fornecedor(es). Confirma esta ação?`
                        : `Você está prestes a registrar o envio individual para ${confirmModal.fornecedor.empresa ? confirmModal.fornecedor.empresa : confirmModal.fornecedor.nome}. Confirma esta ação?`}
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button onClick={() => setConfirmModal(null)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-strong)', backgroundColor: 'var(--surface)', color: 'var(--text-secondary)', fontWeight: 'bold', cursor: 'pointer' }}>
                        Voltar
                    </button>
                    <button onClick={confirmarEnvio} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--success)', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Send size={16} /> Confirmar e Enviar
                    </button>
                </div>
            </div>
        ) : (
            <>
                <button style={styles.btnListaGeral} onClick={solicitarEnvioLote}>
                <Users size={20} />
                Enviar para Selecionados ({selectedIds.length})
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '600' }}>
                        Lista de Fornecedores:
                    </div>
                    <label style={{ fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                        <input 
                            type="checkbox" 
                            onChange={handleSelectAll} 
                            checked={selectedIds.length > 0 && selectedIds.length === fornecedores.filter(f => !respondidos.includes(f.id)).length} 
                        />
                        Selecionar Pendentes
                    </label>
                </div>

                <div style={styles.listaContainer}>
                {loading ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>Carregando dados dos fornecedores...</p>
                ) : fornecedores.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>Nenhum fornecedor compatível com o setor desta cotação.</p>
                ) : (
                    fornecedores.map((fornecedor) => {
                    
                    const isEnviado = vinculados.includes(fornecedor.id);
                    const isRespondido = respondidos.includes(fornecedor.id);
                    const isPendente = isEnviado && !isRespondido;
                    const nomeExibicao = fornecedor.empresa ? `${fornecedor.empresa} (${fornecedor.nome})` : fornecedor.nome;

                    let bgColor, borderColor, iconBg, iconColor, statusBadge, btnText, btnColor, btnBorder;

                    if (isRespondido) {
                        bgColor = 'var(--success-soft)'; borderColor = 'var(--success-border)'; iconBg = 'var(--success)'; iconColor = 'white';
                        btnText = 'Reenviar'; btnColor = 'var(--success)'; btnBorder = '1px solid var(--success)';
                        statusBadge = <span style={{fontSize: '11px', padding: '3px 8px', backgroundColor: 'var(--success)', color: 'white', borderRadius: '10px', fontWeight: 'bold'}}>Já Respondeu</span>;
                    } else if (isPendente) {
                        bgColor = 'var(--warning-soft)'; borderColor = 'var(--warning-border)'; iconBg = 'var(--warning)'; iconColor = 'white';
                        btnText = 'Cobrar Resposta'; btnColor = 'var(--warning)'; btnBorder = '1px solid var(--warning)';
                        statusBadge = <span style={{fontSize: '11px', padding: '3px 8px', backgroundColor: 'var(--warning)', color: 'white', borderRadius: '10px', fontWeight: 'bold'}}>Aguardando</span>;
                    } else {
                        bgColor = 'var(--surface-muted)'; borderColor = 'var(--border)'; iconBg = 'var(--border-strong)'; iconColor = 'white';
                        btnText = 'Enviar Link'; btnColor = 'white'; btnBorder = 'none';
                        statusBadge = <span style={{fontSize: '11px', padding: '3px 8px', backgroundColor: 'var(--border)', color: 'var(--text-muted)', borderRadius: '10px', fontWeight: 'bold'}}>Não Enviado</span>;
                    }

                    return (
                        <div key={fornecedor.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', border: `1px solid ${borderColor}`, backgroundColor: bgColor, borderRadius: '8px', marginBottom: '10px' }}>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <input 
                                type="checkbox" 
                                checked={selectedIds.includes(fornecedor.id)} 
                                onChange={() => handleToggleSelect(fornecedor.id)} 
                                style={{ transform: 'scale(1.3)', cursor: 'pointer' }} 
                            />
                            
                            <div style={{ background: iconBg, color: iconColor, padding: '8px', borderRadius: '50%', display: 'flex' }}>
                            {isRespondido ? <CheckCircle size={16} /> : isPendente ? <Clock size={16} /> : <User size={16} />}
                            </div>
                            
                            <div>
                            <h4 style={{ fontWeight: '600', color: 'var(--text-secondary)', margin: '0 0 4px 0', fontSize: '14px' }}>
                                {nomeExibicao}
                            </h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {statusBadge}
                            </div>
                            </div>
                        </div>

                        <button 
                            style={{ 
                            display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', 
                            backgroundColor: isPendente || isRespondido ? 'transparent' : 'var(--primary)',
                            color: isPendente || isRespondido ? btnColor : 'white', 
                            border: btnBorder, borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px'
                            }}
                            onClick={() => solicitarEnvioIndividual(fornecedor)}
                        >
                            {(isPendente || isRespondido) ? null : <Send size={12} />}
                            {btnText}
                        </button>
                        
                        </div>
                    );
                    })
                )}
                </div>
            </>
        )}
      </div>
    </div>
  );
}