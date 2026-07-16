import { useState } from 'react';
import api from '../../services/api';
import { X } from 'lucide-react';

const GRUPOS_DISPONIVEIS = [
  "Alimentos", "Etico", "Gen Antibi", "Generico", "Generico 2", "Liberados", "Oficinais", "Perfumaria"
];

export default function UploadModal({ onClose, onSuccess }) {
  const [gruposSelecionados, setGruposSelecionados] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleGrupo = (grupo) => {
    setGruposSelecionados(prev => 
      prev.includes(grupo) ? prev.filter(g => g !== grupo) : [...prev, grupo]
    );
  };

  const handleImportarDNA = async () => {
    if (gruposSelecionados.length === 0) {
      alert('Selecione pelo menos um grupo!'); return;
    }
    setLoading(true);
    try {
      await api.post('/api/cotacao/importar-dna', gruposSelecionados);
      alert('Cotação criada com sucesso!');
      onSuccess();
      onClose();
    } catch (error) {
      alert('Erro ao importar do DNA.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Importar Faltas do DNA</h3>
          <button onClick={onClose} className="btn-icon"><X size={20} /></button>
        </div>
        <div className="modal-body">
          <p>Selecione os grupos que deseja incluir nesta cotação:</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px' }}>
            {GRUPOS_DISPONIVEIS.map(grupo => (
              <label key={grupo} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="checkbox" 
                  checked={gruposSelecionados.includes(grupo)}
                  onChange={() => toggleGrupo(grupo)}
                />
                {grupo}
              </label>
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={handleImportarDNA} disabled={loading} className="btn-primary">
            {loading ? 'Sincronizando...' : 'Gerar Cotação'}
          </button>
        </div>
      </div>
    </div>
  );
}