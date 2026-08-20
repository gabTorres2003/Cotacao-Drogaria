import { useState } from 'react';
import api from '../../services/api';
import { X, TrendingUp, CalendarDays } from 'lucide-react';

const GRUPOS_DISPONIVEIS = [
  "Alimentos", "Etico", "Etico Anti", "Similar", "Gen Antibi", "Generico", "Generico 2", "Liberados", "Oficinais", "Perfumaria"
];

export default function UploadModal({ cotacaoId, onClose, onSuccess }) {
  const [gruposSelecionados, setGruposSelecionados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [incluirSugestao, setIncluirSugestao] = useState(false);
  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');
  const [diasSuprir, setDiasSuprir] = useState(1);
  const [setor, setSetor] = useState('AMBOS'); // NOVO: Controle de setor

  const toggleGrupo = (grupo) => {
    setGruposSelecionados(prev => 
      prev.includes(grupo) ? prev.filter(g => g !== grupo) : [...prev, grupo]
    );
  };

  const handleImportarDNA = async () => {
    if (gruposSelecionados.length === 0) {
      alert('Selecione pelo menos um grupo!'); 
      return;
    }

    if (incluirSugestao) {
      if (!dataInicial || !dataFinal) {
        alert('Para usar a sugestão, preencha a Data Inicial e Final.');
        return;
      }
      if (diasSuprir < 1) {
        alert('Os dias a suprir devem ser no mínimo 1.');
        return;
      }
      if (new Date(dataInicial) > new Date(dataFinal)) {
        alert('A Data Inicial não pode ser maior que a Data Final.');
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        grupos: gruposSelecionados,
        incluirSugestao: incluirSugestao,
        dataInicial: incluirSugestao ? dataInicial : null,
        dataFinal: incluirSugestao ? dataFinal : null,
        diasSuprir: incluirSugestao ? Number(diasSuprir) : null,
        nomeUsuario: localStorage.getItem('nomeUsuario') || 'Sistema',
        setor: setor // NOVO: Enviando o setor
      };

      if (cotacaoId) {
        await api.post(`/api/cotacao/${cotacaoId}/importar-dna`, payload);
        alert('Cotação atualizada com novos produtos do DNA com sucesso!');
      } else {
        await api.post('/api/cotacao/importar-dna', payload);
        alert('Nova cotação importada com sucesso!');
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      alert('Erro: ' + (error.response?.data || 'Falha de conexão com o banco DNA.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div className="modal-content" style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '95%', maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto' }}>
        
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '20px', color: '#1f2937' }}>
            {cotacaoId ? 'Atualizar Cotação Ativa (DNA)' : 'Importar Faltas do DNA'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="#6b7280" /></button>
        </div>

        <div className="modal-body">
          {!cotacaoId && (
              <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>Setor da Cotação *</label>
                  <select value={setor} onChange={e => setSetor(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box', backgroundColor: '#f8fafc', fontWeight: 'bold', color: '#1e293b' }}>
                      <option value="AMBOS">Medicamentos e Perfumaria (Ambos)</option>
                      <option value="MEDICAMENTOS">Apenas Medicamentos</option>
                      <option value="PERFUMARIA">Apenas Perfumaria</option>
                  </select>
              </div>
          )}

          <p style={{ fontWeight: '500', color: '#374151', marginBottom: '10px' }}>1. Selecione os grupos:</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '25px', padding: '15px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            {GRUPOS_DISPONIVEIS.map(grupo => (
              <label key={grupo} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#4b5563' }}>
                <input 
                  type="checkbox" 
                  checked={gruposSelecionados.includes(grupo)}
                  onChange={() => toggleGrupo(grupo)}
                  style={{ transform: 'scale(1.1)' }}
                />
                {grupo}
              </label>
            ))}
          </div>

          <div style={{ borderTop: '1px dashed #d1d5db', margin: '20px 0' }}></div>

          <p style={{ fontWeight: '500', color: '#374151', marginBottom: '10px' }}>2. Inteligência de Compras:</p>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '12px', backgroundColor: incluirSugestao ? '#eff6ff' : '#f9fafb', border: `1px solid ${incluirSugestao ? '#bfdbfe' : '#e5e7eb'}`, borderRadius: '8px', transition: 'all 0.2s' }}>
            <input 
              type="checkbox" 
              checked={incluirSugestao}
              onChange={(e) => setIncluirSugestao(e.target.checked)}
              style={{ transform: 'scale(1.2)' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} color={incluirSugestao ? '#2563eb' : '#9ca3af'} />
              <span style={{ fontSize: '14px', fontWeight: '600', color: incluirSugestao ? '#1e40af' : '#4b5563' }}>
                Mesclar com Sugestão de Compras (Média de Vendas)
              </span>
            </div>
          </label>

          {incluirSugestao && (
            <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#fff', border: '1px solid #bfdbfe', borderRadius: '8px', borderLeft: '4px solid #3b82f6', animation: 'fadeIn 0.3s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', color: '#1e40af', fontWeight: '500', fontSize: '13px' }}>
                <CalendarDays size={16} /> <span>Período base de cálculo das vendas:</span>
              </div>
              
              <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#4b5563', marginBottom: '4px' }}>Data Inicial</label>
                  <input 
                    type="date" 
                    value={dataInicial} 
                    onChange={(e) => setDataInicial(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#4b5563', marginBottom: '4px' }}>Data Final</label>
                  <input 
                    type="date" 
                    value={dataFinal} 
                    onChange={(e) => setDataFinal(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#4b5563', marginBottom: '4px' }}>Dias a suprir (Ex: estoque para 10 dias)</label>
                <input 
                  type="number" 
                  min="1"
                  value={diasSuprir} 
                  onChange={(e) => setDiasSuprir(e.target.value)}
                  style={{ width: '100px', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', textAlign: 'center' }}
                />
              </div>
            </div>
          )}

        </div>

        <div className="modal-footer" style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} disabled={loading} style={{ padding: '10px 20px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: 'white', color: '#374151', fontWeight: '500', cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={handleImportarDNA} disabled={loading} style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', backgroundColor: '#2563eb', color: 'white', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Importando...' : (cotacaoId ? 'Atualizar Cotação' : 'Gerar Cotação Mesclada')}
          </button>
        </div>
      </div>
    </div>
  );
}