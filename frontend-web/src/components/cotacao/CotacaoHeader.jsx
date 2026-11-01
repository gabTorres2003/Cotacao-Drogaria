import React, { useState, useEffect } from 'react';
import { Tags, Edit2, X, Save, Loader2, ArrowLeft } from 'lucide-react';
import api from '../../services/api';

export default function CotacaoHeader({ id, setorCotacao = 'AMBOS', isEncerrada, onVoltar }) {
  const [setorAtual, setSetorAtual] = useState(setorCotacao);
  const [showSetorModal, setShowSetorModal] = useState(false);
  const [novoSetor, setNovoSetor] = useState('AMBOS');
  const [salvandoSetor, setSalvandoSetor] = useState(false);

  useEffect(() => {
    setSetorAtual(setorCotacao || 'AMBOS');
    setNovoSetor(setorCotacao || 'AMBOS');
  }, [setorCotacao]);

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
        <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--text)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          Cotação #{id}
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', backgroundColor: setorAtual === 'MEDICAMENTOS' ? 'var(--info-soft)' : setorAtual === 'PERFUMARIA' ? 'var(--purple-soft)' : 'var(--surface-muted)', color: setorAtual === 'MEDICAMENTOS' ? 'var(--primary)' : setorAtual === 'PERFUMARIA' ? 'var(--purple)' : 'var(--text-secondary)', padding: '4px 10px', borderRadius: '6px', border: '1px solid', borderColor: setorAtual === 'MEDICAMENTOS' ? 'var(--info-border)' : setorAtual === 'PERFUMARIA' ? 'var(--purple-border)' : 'var(--border)' }}>
            <Tags size={13} /> {setorAtual === 'AMBOS' ? 'Med / Perf' : setorAtual}
            {!isEncerrada && (
              <button onClick={() => setShowSetorModal(true)} title="Editar Setor" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', marginLeft: '4px', opacity: 0.7 }}>
                <Edit2 size={13} />
              </button>
            )}
          </div>

          {isEncerrada && <span style={{ marginLeft: '8px', fontSize: '12px', backgroundColor: 'var(--danger-soft)', color: 'var(--danger)', padding: '3px 10px', borderRadius: '20px', verticalAlign: 'middle', fontWeight: 'bold' }}>ENCERRADA</span>}
        </h1>
      </div>

      {onVoltar && (
        <button
          type="button"
          onClick={onVoltar}
          title="Voltar para a lista de cotações"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '9px 18px', backgroundColor: 'var(--surface)', color: 'var(--text-secondary)',
            border: '1px solid var(--border-strong)', borderRadius: '999px', cursor: 'pointer',
            fontWeight: '600', fontSize: '13px', letterSpacing: '0.2px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)', whiteSpace: 'nowrap',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--text)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'var(--text)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
        >
          <ArrowLeft size={16} /> Voltar
        </button>
      )}

      {showSetorModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1050 }}>
          <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text)' }}>Editar Setor da Cotação</h3>
                <button onClick={() => setShowSetorModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
             </div>
             <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '8px' }}>Selecione o novo setor:</label>
                <select value={novoSetor} onChange={e => setNovoSetor(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-strong)', backgroundColor: 'var(--surface-muted)', fontWeight: 'bold', color: 'var(--text)', outline: 'none' }}>
                    <option value="AMBOS">Medicamentos e Perfumaria</option>
                    <option value="MEDICAMENTOS">Apenas Medicamentos</option>
                    <option value="PERFUMARIA">Apenas Perfumaria</option>
                </select>
             </div>
             <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button onClick={() => setShowSetorModal(false)} style={{ padding: '10px 16px', background: 'var(--surface-muted)', border: 'none', borderRadius: '6px', fontWeight: 'bold', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancelar</button>
                <button onClick={handleSalvarSetor} disabled={salvandoSetor} style={{ padding: '10px 16px', background: 'var(--info)', border: 'none', borderRadius: '6px', fontWeight: 'bold', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {salvandoSetor ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar Alteração
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
