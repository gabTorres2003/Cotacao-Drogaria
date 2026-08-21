import React from 'react';
import { X, Trash2 } from 'lucide-react';

export default function ModalFornecedoresNotificados({ isOpen, onClose, vinculos, removerVinculo }) {
  if (!isOpen) return null;

  const styles = {
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '95%', maxWidth: '500px', maxHeight: '85vh', overflowY: 'auto' },
    btnIcon: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', color: '#1f2937' }}>Fornecedores Notificados</h3>
          <button onClick={onClose} style={styles.btnIcon}><X size={20} color="#6b7280" /></button>
        </div>

        {vinculos.length === 0 ? (
          <p style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center' }}>Nenhum fornecedor foi notificado ainda.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {vinculos.map(v => (
              <li key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '14px', color: '#374151' }}>
                    {v.fornecedor?.nome}
                    
                    {/* Exibição do nome da empresa ao lado */}
                    {v.fornecedor?.empresa?.nome && (
                      <span style={{ color: '#6b7280', fontWeight: 'normal', marginLeft: '6px' }}>
                        - {v.fornecedor.empresa.nome}
                      </span>
                    )}
                  </strong>
                  
                  <span style={{ fontSize: '12px', color: v.status === 'RESPONDIDA' ? '#16a34a' : '#b45309', fontWeight: 'bold' }}>
                    {v.status === 'RESPONDIDA' ? 'Já Respondeu' : 'Aguardando Resposta'}
                  </span>
                </div>
                <button 
                  onClick={() => removerVinculo(v.id)}
                  style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}
                  title="Remover acesso deste fornecedor à cotação"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}