import React from 'react';
import { X, Save } from 'lucide-react';

export default function ModalProdutoExtra({ isOpen, onClose, novoItemManual, setNovoItemManual, handleSalvarItemManual, salvandoItemManual }) {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', color: '#1f2937' }}>Adicionar Produto Extra</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><X size={20} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>Nome do Produto</label>
            <input 
              type="text" 
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
              value={novoItemManual.nomeProduto} 
              onChange={e => setNovoItemManual({ ...novoItemManual, nomeProduto: e.target.value })} 
              placeholder="Ex: Neosaldina C/ 30" 
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>Quantidade a cotar</label>
            <input 
              type="number" 
              min="1" 
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
              value={novoItemManual.quantidade} 
              onChange={e => setNovoItemManual({ ...novoItemManual, quantidade: Number(e.target.value) })} 
              onFocus={e => e.target.select()}
            />
          </div>

          <button 
            onClick={handleSalvarItemManual} 
            disabled={salvandoItemManual}
            style={{ width: '100%', padding: '12px', marginTop: '10px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          >
            <Save size={18} style={{ marginRight: '8px' }}/> {salvandoItemManual ? 'Adicionando...' : 'Confirmar e Adicionar'}
          </button>
        </div>
      </div>
    </div>
  );
}