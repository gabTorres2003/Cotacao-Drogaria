import { useEffect, useState } from 'react';
import api from '../../../services/api';
import { X, Brain, CalendarDays, AlertTriangle } from 'lucide-react';

export default function ModalGerarListaInteligenca({ onClose, onSuccess }) {
  const [grupos, setGrupos] = useState([]);
  const [carregandoGrupos, setCarregandoGrupos] = useState(true);
  const [gruposSelecionados, setGruposSelecionados] = useState([]);
  const [incluirFaltas, setIncluirFaltas] = useState(true);
  const [diasEstoqueMinimo, setDiasEstoqueMinimo] = useState(7);
  const [diasEstoqueMaximo, setDiasEstoqueMaximo] = useState(30);
  const [diasMediaVendas, setDiasMediaVendas] = useState(90);
  const [setor, setSetor] = useState('AMBOS');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const carregarGrupos = async () => {
      try {
        const { data } = await api.get('/api/inteligencia/grupos');
        setGrupos(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Erro ao carregar grupos:', error);
        alert('Erro ao carregar os grupos do DNA.');
      } finally {
        setCarregandoGrupos(false);
      }
    };
    carregarGrupos();
  }, []);

  const toggleGrupo = (nome) => {
    setGruposSelecionados((prev) =>
      prev.includes(nome) ? prev.filter((g) => g !== nome) : [...prev, nome],
    );
  };

  const gerarLista = async () => {
    if (gruposSelecionados.length === 0) {
      alert('Selecione pelo menos um grupo!');
      return;
    }
    if (Number(diasEstoqueMinimo) < 1 || Number(diasEstoqueMaximo) < 1) {
      alert('Os dias de estoque mínimo e máximo devem ser no mínimo 1.');
      return;
    }
    if (Number(diasEstoqueMaximo) < Number(diasEstoqueMinimo)) {
      alert('O estoque máximo (dias) deve ser maior ou igual ao mínimo.');
      return;
    }
    if (Number(diasMediaVendas) < 1) {
      alert('Os dias de referência da média de vendas devem ser no mínimo 1.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        grupos: gruposSelecionados,
        diasEstoqueMinimo: Number(diasEstoqueMinimo),
        diasEstoqueMaximo: Number(diasEstoqueMaximo),
        diasMediaVendas: Number(diasMediaVendas),
        incluirFaltas: incluirFaltas,
        nomeUsuario: localStorage.getItem('nomeUsuario') || 'Sistema',
        setor: setor,
      };
      const { data } = await api.post('/api/cotacao/gerar-lista-inteligencia', payload);
      alert(data || 'Cotação gerada com sucesso!');
      onSuccess();
      onClose();
    } catch (error) {
      alert('Erro: ' + (error.response?.data || 'Falha ao gerar a lista de compra.'));
    } finally {
      setLoading(false);
    }
  };

  const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' };
  const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box', backgroundColor: '#f8fafc', fontWeight: 'bold', color: '#1e293b' };

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div className="modal-content" style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '95%', maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto' }}>

        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '20px', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Brain size={22} color="#7c3aed" /> Gerar Lista - Inteligência
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="#6b7280" /></button>
        </div>

        <div className="modal-body">
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Setor da Cotação *</label>
            <select value={setor} onChange={(e) => setSetor(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="AMBOS">Medicamentos e Perfumaria (Ambos)</option>
              <option value="MEDICAMENTOS">Apenas Medicamentos</option>
              <option value="PERFUMARIA">Apenas Perfumaria</option>
            </select>
          </div>

          <p style={{ fontWeight: '500', color: '#374151', marginBottom: '10px' }}>1. Selecione os grupos:</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '25px', padding: '15px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            {carregandoGrupos ? (
              <span style={{ fontSize: '13px', color: '#9ca3af' }}>Carregando grupos...</span>
            ) : grupos.length === 0 ? (
              <span style={{ fontSize: '13px', color: '#9ca3af' }}>Nenhum grupo encontrado.</span>
            ) : (
              grupos.map((g) => (
                <label key={g.codigo} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#4b5563' }}>
                  <input
                    type="checkbox"
                    checked={gruposSelecionados.includes(g.nome)}
                    onChange={() => toggleGrupo(g.nome)}
                    style={{ transform: 'scale(1.1)' }}
                  />
                  {g.nome}
                  {g.configurado && <span title="Grupo configurado na Inteligência" style={{ color: '#16a34a', fontSize: '11px', fontWeight: 'bold' }}>✓</span>}
                </label>
              ))
            )}
          </div>

          <p style={{ fontWeight: '500', color: '#374151', marginBottom: '10px' }}>2. Parâmetros da Inteligência:</p>
          <div style={{ padding: '15px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', color: '#5b21b6', fontWeight: '500', fontSize: '13px' }}>
              <CalendarDays size={16} />
              <span>Entram produtos com cobertura de estoque abaixo do mínimo e com vendas no período.</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ ...labelStyle, fontSize: '12px' }}>Estoque mín. (dias)</label>
                <input
                  type="number"
                  min="1"
                  value={diasEstoqueMinimo}
                  onChange={(e) => setDiasEstoqueMinimo(e.target.value)}
                  style={{ ...inputStyle, textAlign: 'center' }}
                  title="Produtos com menos dias de estoque que este valor entram na lista"
                />
              </div>
              <div>
                <label style={{ ...labelStyle, fontSize: '12px' }}>Estoque máx. (dias)</label>
                <input
                  type="number"
                  min="1"
                  value={diasEstoqueMaximo}
                  onChange={(e) => setDiasEstoqueMaximo(e.target.value)}
                  style={{ ...inputStyle, textAlign: 'center' }}
                  title="Nível máximo de estoque alvo (reposição até este valor)"
                />
              </div>
              <div>
                <label style={{ ...labelStyle, fontSize: '12px' }}>Média de vendas (dias)</label>
                <input
                  type="number"
                  min="1"
                  value={diasMediaVendas}
                  onChange={(e) => setDiasMediaVendas(e.target.value)}
                  style={{ ...inputStyle, textAlign: 'center' }}
                  title="Janela de referência para calcular a média de vendas"
                />
              </div>
            </div>
          </div>

          <p style={{ fontWeight: '500', color: '#374151', marginBottom: '10px' }}>3. Mesclagem:</p>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '12px', backgroundColor: incluirFaltas ? '#eff6ff' : '#f9fafb', border: `1px solid ${incluirFaltas ? '#bfdbfe' : '#e5e7eb'}`, borderRadius: '8px', transition: 'all 0.2s' }}>
            <input
              type="checkbox"
              checked={incluirFaltas}
              onChange={(e) => setIncluirFaltas(e.target.checked)}
              style={{ transform: 'scale(1.2)' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} color={incluirFaltas ? '#2563eb' : '#9ca3af'} />
              <span style={{ fontSize: '14px', fontWeight: '600', color: incluirFaltas ? '#1e40af' : '#4b5563' }}>
                Mesclar com as Faltas do DNA (mesmos grupos)
              </span>
            </div>
          </label>
        </div>

        <div className="modal-footer" style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} disabled={loading} style={{ padding: '10px 20px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: 'white', color: '#374151', fontWeight: '500', cursor: 'pointer' }}>
            Cancelar
          </button>
          <button
            onClick={gerarLista}
            disabled={loading || carregandoGrupos}
            style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', backgroundColor: '#7c3aed', color: 'white', fontWeight: '600', cursor: loading || carregandoGrupos ? 'not-allowed' : 'pointer', opacity: loading || carregandoGrupos ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Brain size={16} />
            {loading ? 'Gerando...' : 'Gerar Lista de Compra'}
          </button>
        </div>
      </div>
    </div>
  );
}
