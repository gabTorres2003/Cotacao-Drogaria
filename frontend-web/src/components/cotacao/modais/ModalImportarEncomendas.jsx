import React, { useState, useEffect } from 'react';
import { X, PackageOpen, CheckSquare, Loader2 } from 'lucide-react';
import api from '../../../services/api';

export default function ModalImportarEncomendas({ isOpen, onClose, cotacaoId, onSuccess }) {
  const [encomendas, setEncomendas] = useState([]);
  const [selecionados, setSelecionados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (isOpen) {
      carregarEncomendasPendentes();
    }
  }, [isOpen]);

  const carregarEncomendasPendentes = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/encomendas/pendentes');
      setEncomendas(response.data || []);
      setSelecionados([]);
    } catch (error) {
      alert("Erro ao buscar encomendas pendentes no servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelecionados(encomendas.map(enc => enc.id));
    } else {
      setSelecionados([]);
    }
  };

  const handleSelect = (id) => {
    setSelecionados(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleImportar = async () => {
    if (selecionados.length === 0) return alert("Selecione pelo menos uma encomenda.");
    
    setSalvando(true);
    try {
      const itensParaImportar = encomendas
        .filter(enc => selecionados.includes(enc.id))
        .map(enc => ({
          encomendaId: enc.id,
          nomeProduto: `${enc.produto} [Cliente: ${enc.cliente} | Tel: ${enc.telefone || 'N/A'} | Cód: ${enc.codigoProduto || 'N/A'}]`,
          quantidade: Number(enc.quantidade) || 1,
          fornecedorSugerido: enc.fornecedorSugerido || enc.fornecedor || null,
          origemItem: 'Encomenda'
        }));

      await api.post(`/api/cotacao/${cotacaoId}/importar-encomendas`, itensParaImportar);
      
      alert('Encomendas importadas para a cotação com sucesso!');
      onSuccess();
      onClose();
    } catch (error) {
      alert("Erro ao importar encomendas: " + (error.response?.data || error.message));
    } finally {
      setSalvando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1050 }}>
      <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '90%', maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
        
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PackageOpen color="#4338ca"/> Importar Encomendas do Balcão
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
              Selecione as encomendas pendentes registradas pelos atendentes.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', color: '#6b7280' }}>
              <Loader2 size={32} className="animate-spin" color="#4338ca" style={{ marginBottom: '10px' }} />
              Buscando encomendas...
            </div>
          ) : encomendas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
              Nenhuma encomenda pendente de compra no balcão no momento.
            </div>
          ) : (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <tr>
                    <th style={{ padding: '12px 16px', width: '40px', textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={selecionados.length === encomendas.length && encomendas.length > 0}
                        onChange={handleSelectAll}
                        style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                      />
                    </th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', color: '#64748b' }}>Datas (Enc/Prev)</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', color: '#64748b' }}>Balconista</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', color: '#64748b' }}>Cliente</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', color: '#64748b' }}>Produto</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', color: '#64748b', textAlign: 'center' }}>Qtd</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', color: '#64748b' }}>Pagamento</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', color: '#64748b' }}>Forn. Sugerido</th>
                  </tr>
                </thead>
                <tbody>
                  {encomendas.map((enc) => {
                    const dataEnc = enc.dataEncomenda ? new Date(enc.dataEncomenda).toLocaleDateString('pt-BR') : '-';
                    const dataPrev = enc.dataPrevista ? new Date(enc.dataPrevista).toLocaleDateString('pt-BR') : '-';
                    const isSelected = selecionados.includes(enc.id);
                    return (
                      <tr key={enc.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: isSelected ? '#eef2ff' : 'white', transition: '0.2s' }}>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => handleSelect(enc.id)}
                            style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                          />
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '12px', color: '#4b5563' }}>
                          <div>{dataEnc}</div>
                          <div style={{ color: '#ea580c', fontSize: '11px' }}>Prev: {dataPrev}</div>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#334155' }}>{enc.vendedor || '-'}</td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#1e293b', fontWeight: '600' }}>
                          {enc.cliente}
                          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal' }}>{enc.telefone}</div>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#1e293b', fontWeight: 'bold' }}>
                          {enc.produto}
                          <div style={{ fontSize: '11px', color: '#2563eb' }}>Cód: {enc.codigoProduto || '-'}</div>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 'bold' }}>{enc.quantidade || 1}</td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#4b5563' }}>{enc.pagamento || 'Dinheiro'}</td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#4338ca', fontWeight: '500' }}>
                          {enc.fornecedorSugerido || enc.fornecedor || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ padding: '20px 24px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '0 0 12px 12px' }}>
          <span style={{ fontSize: '14px', color: '#475569', fontWeight: '600' }}>
            {selecionados.length} selecionado(s)
          </span>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', fontWeight: 'bold', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button 
                onClick={handleImportar} 
                disabled={salvando || selecionados.length === 0} 
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#4338ca', color: 'white', fontWeight: 'bold', cursor: (salvando || selecionados.length === 0) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: (salvando || selecionados.length === 0) ? 0.6 : 1 }}
            >
              {salvando ? <><Loader2 size={18} className="animate-spin" /> Importando...</> : <><CheckSquare size={18} /> Importar Encomendas</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}