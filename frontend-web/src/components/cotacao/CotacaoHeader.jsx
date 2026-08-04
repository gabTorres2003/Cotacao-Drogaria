import React from 'react';
import { Plus, RefreshCcw, Users, MessageCircle, ShoppingCart, FileText, Check, Loader2 } from 'lucide-react';

export default function CotacaoHeader({
  id, isEncerrada, setIsAddItemModalOpen, setIsUploadModalOpen, 
  mostrarNomeReal, setMostrarNomeReal, setShowVinculosModal, setIsEnviarModalOpen, 
  decisaoCompra, handleGerarPedidos, isProcessandoPedidos, modoVisualizacao, 
  baixarRelatorioGeral, alterarStatusCotacao, navigate
}) {
  const btnVoltar = { padding: '10px 20px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' };

  return (
    <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
        Cotação #{id}
        {isEncerrada && <span style={{ marginLeft: '12px', fontSize: '14px', backgroundColor: '#fee2e2', color: '#dc2626', padding: '4px 10px', borderRadius: '20px', verticalAlign: 'middle', fontWeight: 'bold' }}>ENCERRADA (Histórico)</span>}
      </h1>
      
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        {!isEncerrada && (
          <>
            <button type="button" style={{ ...btnVoltar, backgroundColor: '#8b5cf6' }} onClick={() => setIsAddItemModalOpen(true)}>
              <Plus size={18} /> Adicionar Produto Extra
            </button>
            <button type="button" style={{ ...btnVoltar, backgroundColor: '#3b82f6' }} onClick={() => setIsUploadModalOpen(true)}>
              <RefreshCcw size={18} /> Atualizar Importação DNA
            </button>
          </>
        )}

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', backgroundColor: 'white', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', marginRight: '10px' }}>
          <input type="checkbox" checked={mostrarNomeReal} onChange={(e) => setMostrarNomeReal(e.target.checked)} style={{ transform: 'scale(1.1)' }} />
          <span style={{ fontSize: '13px', color: '#374151', fontWeight: '600' }}>Alternar Nome Diversos/Real</span>
        </label>

        {!isEncerrada && (
          <>
            <button type="button" style={{ ...btnVoltar, backgroundColor: '#64748b' }} onClick={() => setShowVinculosModal(true)}>
              <Users size={18} /> Fornecedores Notificados
            </button>
            <button type="button" style={{ ...btnVoltar, backgroundColor: '#f59e0b' }} onClick={() => setIsEnviarModalOpen(true)}>
              <MessageCircle size={18} /> Enviar / Cobrar 
            </button>
            <button 
              type="button" 
              style={{ ...btnVoltar, backgroundColor: Object.keys(decisaoCompra).length > 0 ? '#16a34a' : '#9ca3af', cursor: Object.keys(decisaoCompra).length > 0 ? 'pointer' : 'not-allowed', display: modoVisualizacao === 'manual' ? 'none' : 'flex' }} 
              onClick={handleGerarPedidos} 
              disabled={Object.keys(decisaoCompra).length === 0 || isProcessandoPedidos}
            >
              {isProcessandoPedidos ? <Loader2 size={18} className="animate-spin" /> : <ShoppingCart size={18} />} 
              {isProcessandoPedidos ? 'Processando...' : 'Gerar Pedidos'}
            </button>
          </>
        )}
        
        <button type="button" style={{ ...btnVoltar, display: modoVisualizacao === 'manual' ? 'none' : 'flex' }} onClick={baixarRelatorioGeral}>
          <FileText size={18} /> Baixar PDF
        </button>

        {isEncerrada ? (
          <button type="button" style={{ ...btnVoltar, backgroundColor: '#f59e0b' }} onClick={() => alterarStatusCotacao('ABERTA')}>
            <RefreshCcw size={18} /> Reabrir Cotação
          </button>
        ) : (
          <button type="button" style={{ ...btnVoltar, backgroundColor: '#dc2626' }} onClick={() => alterarStatusCotacao('FINALIZADA')}>
            <Check size={18} /> Encerrar Cotação
          </button>
        )}
        
        <button type="button" style={btnVoltar} onClick={() => navigate('/cotacoes')}>Voltar ao Painel</button>
      </div>
    </div>
  );
}