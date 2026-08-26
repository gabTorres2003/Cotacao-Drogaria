import React, { useState, useEffect } from 'react';
import { Plus, RefreshCcw, Users, MessageCircle, ShoppingCart, FileText, Check, Loader2, Tags, Edit2, X, Save } from 'lucide-react';
import api from '../../services/api';

export default function CotacaoHeader({
  id, isEncerrada, setIsAddItemModalOpen, setIsUploadModalOpen, 
  mostrarNomeReal, setMostrarNomeReal, setShowVinculosModal, setIsEnviarModalOpen, 
  mostrarComImposto, setMostrarComImposto,
  decisaoCompra, handleGerarPedidos, isProcessandoPedidos, modoVisualizacao, 
  baixarRelatorioGeral, alterarStatusCotacao, navigate
}) {
  const [setorAtual, setSetorAtual] = useState('AMBOS');
  const [showSetorModal, setShowSetorModal] = useState(false);
  const [novoSetor, setNovoSetor] = useState('AMBOS');
  const [salvandoSetor, setSalvandoSetor] = useState(false);

  useEffect(() => {
    const fetchSetor = async () => {
      try {
        const res = await api.get(`/api/cotacao/${id}`);
        setSetorAtual(res.data.setor || 'AMBOS');
        setNovoSetor(res.data.setor || 'AMBOS');
      } catch(e) {}
    };
    fetchSetor();
  }, [id]);

  const handleSalvarSetor = async () => {
    setSalvandoSetor(true);
    try {
      await api.put(`/api/cotacao/${id}/setor`, { setor: novoSetor });
      setSetorAtual(novoSetor);
      setShowSetorModal(false);
    } catch(e) {
      alert('Erro ao atualizar setor');
    } finally {
      setSalvandoSetor(false);
    }
  };

  const btnVoltar = { padding: '10px 20px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' };

  return (
    <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          Cotação #{id}
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', backgroundColor: setorAtual === 'MEDICAMENTOS' ? '#dbeafe' : setorAtual === 'PERFUMARIA' ? '#f3e8ff' : '#f1f5f9', color: setorAtual === 'MEDICAMENTOS' ? '#2563eb' : setorAtual === 'PERFUMARIA' ? '#9333ea' : '#475569', padding: '4px 10px', borderRadius: '6px', border: '1px solid', borderColor: setorAtual === 'MEDICAMENTOS' ? '#bfdbfe' : setorAtual === 'PERFUMARIA' ? '#e9d5ff' : '#e2e8f0' }}>
            <Tags size={14} /> {setorAtual === 'AMBOS' ? 'Med / Perf' : setorAtual}
            {!isEncerrada && (
              <button onClick={() => setShowSetorModal(true)} title="Editar Setor" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', marginLeft: '4px', opacity: 0.7 }}>
                <Edit2 size={14} />
              </button>
            )}
          </div>

          {isEncerrada && <span style={{ marginLeft: '12px', fontSize: '14px', backgroundColor: '#fee2e2', color: '#dc2626', padding: '4px 10px', borderRadius: '20px', verticalAlign: 'middle', fontWeight: 'bold' }}>ENCERRADA (Histórico)</span>}
        </h1>
      </div>
      
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        {!isEncerrada && (
          <>
            <button type="button" style={{ ...btnVoltar, backgroundColor: '#8b5cf6' }} onClick={() => setIsAddItemModalOpen(true)}>
              <Plus size={18} /> Adicionar Produto Extra
            </button>
            <button type="button" style={{ ...btnVoltar, backgroundColor: '#3b82f6' }} onClick={() => setIsUploadModalOpen(true)}>
              <RefreshCcw size={18} /> Atualizar Importação DNA
            </button>
          </>
        )}

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', backgroundColor: mostrarComImposto ? '#fef9c3' : 'white', padding: '8px 12px', borderRadius: '6px', border: mostrarComImposto ? '1px solid #facc15' : '1px solid #d1d5db', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', marginRight: '10px' }}>
          <input type="checkbox" checked={mostrarComImposto} onChange={(e) => setMostrarComImposto(e.target.checked)} style={{ transform: 'scale(1.1)' }} />
          <span style={{ fontSize: '13px', color: mostrarComImposto ? '#854d0e' : '#374151', fontWeight: '600' }}>
            {mostrarComImposto ? 'Valores com imposto' : 'Valores informados'}
          </span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', backgroundColor: 'white', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', marginRight: '10px' }}>
          <input type="checkbox" checked={mostrarNomeReal} onChange={(e) => setMostrarNomeReal(e.target.checked)} style={{ transform: 'scale(1.1)' }} />
          <span style={{ fontSize: '13px', color: '#374151', fontWeight: '600' }}>Alternar Nome Diversos/Real</span>
        </label>

        {!isEncerrada && (
          <>
            <button type="button" style={{ ...btnVoltar, backgroundColor: '#64748b' }} onClick={() => setShowVinculosModal(true)}>
              <Users size={18} /> Fornecedores Notificados
            </button>
            <button type="button" style={{ ...btnVoltar, backgroundColor: '#f59e0b' }} onClick={() => setIsEnviarModalOpen(true)}>
              <MessageCircle size={18} /> Enviar / Cobrar 
            </button>
            <button 
              type="button" 
              style={{ ...btnVoltar, backgroundColor: Object.keys(decisaoCompra).length > 0 ? '#16a34a' : '#9ca3af', cursor: Object.keys(decisaoCompra).length > 0 ? 'pointer' : 'not-allowed', display: modoVisualizacao === 'manual' ? 'none' : 'flex' }} 
              onClick={handleGerarPedidos} 
              disabled={Object.keys(decisaoCompra).length === 0 || isProcessandoPedidos}
            >
              {isProcessandoPedidos ? <Loader2 size={18} className="animate-spin" /> : <ShoppingCart size={18} />} 
              {isProcessandoPedidos ? 'Processando...' : 'Gerar Pedidos'}
            </button>
          </>
        )}
        
        <button type="button" style={{ ...btnVoltar, display: modoVisualizacao === 'manual' ? 'none' : 'flex' }} onClick={baixarRelatorioGeral}>
          <FileText size={18} /> Baixar PDF
        </button>

        {isEncerrada ? (
          <button type="button" style={{ ...btnVoltar, backgroundColor: '#f59e0b' }} onClick={() => alterarStatusCotacao('ABERTA')}>
            <RefreshCcw size={18} /> Reabrir Cotação
          </button>
        ) : (
          <button type="button" style={{ ...btnVoltar, backgroundColor: '#dc2626' }} onClick={() => alterarStatusCotacao('FINALIZADA')}>
            <Check size={18} /> Encerrar Cotação
          </button>
        )}
        
        <button type="button" style={btnVoltar} onClick={() => navigate('/cotacoes')}>Voltar ao Painel</button>
      </div>

      {showSetorModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1050 }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#1f2937' }}>Editar Setor da Cotação</h3>
                <button onClick={() => setShowSetorModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><X size={20} /></button>
             </div>
             <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>Selecione o novo setor:</label>
                <select value={novoSetor} onChange={e => setNovoSetor(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontWeight: 'bold', color: '#1e293b', outline: 'none' }}>
                    <option value="AMBOS">Medicamentos e Perfumaria</option>
                    <option value="MEDICAMENTOS">Apenas Medicamentos</option>
                    <option value="PERFUMARIA">Apenas Perfumaria</option>
                </select>
             </div>
             <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button onClick={() => setShowSetorModal(false)} style={{ padding: '10px 16px', background: '#f1f5f9', border: 'none', borderRadius: '6px', fontWeight: 'bold', color: '#475569', cursor: 'pointer' }}>Cancelar</button>
                <button onClick={handleSalvarSetor} disabled={salvandoSetor} style={{ padding: '10px 16px', background: '#3b82f6', border: 'none', borderRadius: '6px', fontWeight: 'bold', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {salvandoSetor ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar Alteração
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}