import React, { useState } from 'react';
import { X, Search, CheckCircle } from 'lucide-react';
import api from '../../../services/api';
import PesquisaProdutoDna from '../../PesquisaProdutoDna';

export default function ModalProdutoExtra({ isOpen, onClose, novoItemManual, setNovoItemManual, handleSalvarItemManual, salvandoItemManual }) {
  const [codigoDna, setCodigoDna] = useState('');

  if (!isOpen) return null;

  const handleBuscarDna = async () => {
    if (!codigoDna) return;
    const cod = codigoDna.trim();
    try {
      const res = await api.get(`/api/produtos/buscar?q=${encodeURIComponent(cod)}`);
      if (res.data) {
        setNovoItemManual(prev => ({ ...prev, nomeProduto: res.data.descricao }));
      }
    } catch (error) {
      alert(`Código DNA ${cod} não encontrado na base de dados.`);
      setNovoItemManual(prev => ({ ...prev, nomeProduto: '' }));
    }
  };

  // Aplica um resultado da pesquisa por nome/princípio ativo no DNA.
  const selecionarProdutoPorNome = (prod) => {
    if (!prod) return;
    setCodigoDna(prod.codigo != null ? String(prod.codigo) : '');
    setNovoItemManual((anterior) => ({
      ...anterior,
      nomeProduto: prod.descricao || '',
    }));
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' }}>
      <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '450px', maxHeight: 'calc(100dvh - 32px)', overflowY: 'auto', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text)' }}>Adicionar Produto Extra</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', backgroundColor: 'var(--surface-muted)', padding: '6px', borderRadius: '8px' }}>
            <button 
                onClick={() => { setNovoItemManual({ ...novoItemManual, origemItem: 'Extra Manual', nomeProduto: '' }); setCodigoDna(''); }} 
                style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', backgroundColor: novoItemManual.origemItem === 'Extra Manual' ? 'var(--surface)' : 'transparent', color: novoItemManual.origemItem === 'Extra Manual' ? 'var(--primary)' : 'var(--text-muted)', boxShadow: novoItemManual.origemItem === 'Extra Manual' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
            >
                Por Código DNA
            </button>
            <button 
                onClick={() => { setNovoItemManual({ ...novoItemManual, origemItem: 'Manual Direto', nomeProduto: '' }); setCodigoDna(''); }} 
                style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', backgroundColor: novoItemManual.origemItem !== 'Extra Manual' ? 'var(--surface)' : 'transparent', color: novoItemManual.origemItem !== 'Extra Manual' ? 'var(--primary)' : 'var(--text-muted)', boxShadow: novoItemManual.origemItem !== 'Extra Manual' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
            >
                Digitar Manualmente
            </button>
        </div>

        <div style={{ marginBottom: '15px' }}>
          {novoItemManual.origemItem === 'Extra Manual' ? (
              <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '6px' }}>Digite o Código DNA</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ position: 'relative', flex: 1 }}>
                          <Search size={18} color="var(--text-subtle)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                          <input type="text" value={codigoDna} onChange={e => setCodigoDna(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleBuscarDna()} placeholder="Ex: 12345" style={{ width: '100%', padding: '10px 10px 10px 35px', borderRadius: '6px', border: '1px solid var(--border-strong)', outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                      <button onClick={handleBuscarDna} style={{ padding: '0 16px', backgroundColor: 'var(--info)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Buscar</button>
                  </div>
                  {novoItemManual.nomeProduto && (
                      <div style={{ marginTop: '12px', padding: '10px', backgroundColor: 'var(--success-soft)', borderRadius: '6px', border: '1px solid var(--success-border)', color: 'var(--success-text)', fontSize: '14px', fontWeight: '600' }}>
                          <CheckCircle size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                          {novoItemManual.nomeProduto}
                      </div>
                  )}

                  <div style={{ marginTop: '12px' }}>
                      <PesquisaProdutoDna
                          onSelecionar={selecionarProdutoPorNome}
                          rotulo="Não sabe o código? Busque por nome"
                      />
                  </div>
              </div>
          ) : (
              <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '6px' }}>Nome Completo do Produto</label>
                  <input type="text" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-strong)', outline: 'none', boxSizing: 'border-box' }} value={novoItemManual.nomeProduto} onChange={e => setNovoItemManual({...novoItemManual, nomeProduto: e.target.value})} placeholder="Ex: Neosaldina C/ 30" />
              </div>
          )}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '6px' }}>Quantidade</label>
          <input type="number" min="1" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-strong)', outline: 'none', boxSizing: 'border-box' }} value={novoItemManual.quantidade} onChange={e => setNovoItemManual({...novoItemManual, quantidade: e.target.value})} />
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={{ padding: '10px 16px', border: '1px solid var(--border-strong)', backgroundColor: 'var(--surface)', color: 'var(--text-secondary)', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>
            Cancelar
          </button>
          <button type="button" onClick={handleSalvarItemManual} disabled={salvandoItemManual || !novoItemManual.nomeProduto} style={{ padding: '10px 16px', backgroundColor: !novoItemManual.nomeProduto ? 'var(--text-subtle)' : 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: !novoItemManual.nomeProduto ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
            {salvandoItemManual ? 'Salvando...' : 'Adicionar Produto'}
          </button>
        </div>
      </div>
    </div>
  );
}