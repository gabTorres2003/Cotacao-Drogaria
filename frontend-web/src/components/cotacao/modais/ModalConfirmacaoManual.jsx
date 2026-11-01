import React from 'react';
import { Loader2, Save } from 'lucide-react';

export default function ModalConfirmacaoManual({
  isOpen, 
  onClose, 
  mensagemConfirmacaoManual, 
  acaoPosPedido, 
  setAcaoPosPedido, 
  processarRegistroManual, 
  salvandoPedidos, 
  isEncerrada
}) {
  if (!isOpen) return null;

  const styles = {
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', width: '95%', maxWidth: '500px', maxHeight: '85vh', overflowY: 'auto' },
    btnVoltar: { padding: '10px 20px', backgroundColor: 'var(--text-muted)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <h3 style={{ marginTop: 0, fontSize: '18px', color: 'var(--text)' }}>Confirmação de Pedido Manual</h3>
        <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', lineHeight: '1.5', fontSize: '14px' }}>{mensagemConfirmacaoManual}</p>
        
        <div style={{ marginTop: '20px', padding: '16px', backgroundColor: 'var(--surface-muted)', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>Após gerar o pedido, o que deseja fazer com a cotação?</h4>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
            <input type="radio" name="acaoPosPedidoManual" value="ABERTA" checked={acaoPosPedido === 'ABERTA'} onChange={() => setAcaoPosPedido('ABERTA')} />
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Deixar em Aberto (Aguardando outros pedidos)</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="radio" name="acaoPosPedidoManual" value="ENCERRADA" checked={acaoPosPedido === 'ENCERRADA'} onChange={() => setAcaoPosPedido('ENCERRADA')} />
            <span style={{ fontSize: '14px', color: 'var(--danger)', fontWeight: 'bold' }}>Encerrar Cotação (Mover para o Histórico)</span>
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', gap: '10px' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: '6px', border: '1px solid var(--border-strong)', backgroundColor: 'var(--surface)', cursor: 'pointer', fontWeight: '500', color: 'var(--text-secondary)' }}>Voltar</button>
          <button 
            type="button" 
            onClick={processarRegistroManual} 
            disabled={salvandoPedidos || isEncerrada} 
            style={{ ...styles.btnVoltar, backgroundColor: isEncerrada ? 'var(--text-subtle)' : 'var(--success)', fontSize: '15px', padding: '12px 24px', boxShadow: isEncerrada ? 'none' : '0 4px 6px -1px rgba(16, 185, 129, 0.4)' }}
          >
            {salvandoPedidos ? <Loader2 size={18} className="animate-spin" style={{ marginRight: '8px' }} /> : <Save size={18} style={{ marginRight: '8px' }} />} 
            {salvandoPedidos ? 'Processando...' : 'Finalizar Registro e Gerar Pedidos'}
          </button>
        </div>
      </div>
    </div>
  );
}