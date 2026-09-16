import React, { useState, useEffect } from 'react';
import { Tags, Edit2, X, Save, Loader2 } from 'lucide-react';
import api from '../../services/api';

export default function CotacaoHeader({ id, isEncerrada, mostrarNomeReal, setMostrarNomeReal, mostrarComImposto, setMostrarComImposto }) {
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

  return (
    <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1f2937', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          Cotação #{id}
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', backgroundColor: setorAtual === 'MEDICAMENTOS' ? '#dbeafe' : setorAtual === 'PERFUMARIA' ? '#f3e8ff' : '#f1f5f9', color: setorAtual === 'MEDICAMENTOS' ? '#2563eb' : setorAtual === 'PERFUMARIA' ? '#9333ea' : '#475569', padding: '4px 10px', borderRadius: '6px', border: '1px solid', borderColor: setorAtual === 'MEDICAMENTOS' ? '#bfdbfe' : setorAtual === 'PERFUMARIA' ? '#e9d5ff' : '#e2e8f0' }}>
            <Tags size={13} /> {setorAtual === 'AMBOS' ? 'Med / Perf' : setorAtual}
            {!isEncerrada && (
              <button onClick={() => setShowSetorModal(true)} title="Editar Setor" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', marginLeft: '4px', opacity: 0.7 }}>
                <Edit2 size={13} />
              </button>
            )}
          </div>

          {isEncerrada && <span style={{ marginLeft: '8px', fontSize: '12px', backgroundColor: '#fee2e2', color: '#dc2626', padding: '3px 10px', borderRadius: '20px', verticalAlign: 'middle', fontWeight: 'bold' }}>ENCERRADA</span>}
        </h1>
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', backgroundColor: mostrarComImposto ? '#fef9c3' : 'white', padding: '6px 10px', borderRadius: '6px', border: mostrarComImposto ? '1px solid #facc15' : '1px solid #d1d5db', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <input type="checkbox" checked={mostrarComImposto} onChange={(e) => setMostrarComImposto(e.target.checked)} style={{ transform: 'scale(1.1)' }} />
          <span style={{ fontSize: '12px', color: mostrarComImposto ? '#854d0e' : '#374151', fontWeight: '600' }}>
            {mostrarComImposto ? 'Com imposto' : 'Informados'}
          </span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', backgroundColor: 'white', padding: '6px 10px', borderRadius: '6px', border: '1px solid #d1d5db', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <input type="checkbox" checked={mostrarNomeReal} onChange={(e) => setMostrarNomeReal(e.target.checked)} style={{ transform: 'scale(1.1)' }} />
          <span style={{ fontSize: '12px', color: '#374151', fontWeight: '600' }}>Nome Real</span>
        </label>
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
