import React, { useState, useRef, useEffect } from 'react';
import { 
  Wrench, X, Plus, RefreshCcw, Users, MessageCircle, ShoppingCart, 
  FileText, Check, PackageOpen, Loader2, ArrowLeft
} from 'lucide-react';

export default function FloatingToolsMenu({
  isEncerrada, setIsAddItemModalOpen, setIsUploadModalOpen,
  setIsEnviarModalOpen, setShowVinculosModal,
  decisaoCompra, handleGerarPedidos, isProcessandoPedidos,
  baixarRelatorioGeral, alterarStatusCotacao,
  setIsEncomendasModalOpen, setIsImportarItensModalOpen, navigate
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const btnStyle = (color = '#6b7280') => ({
    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px',
    backgroundColor: color, color: 'white', border: 'none', borderRadius: '8px',
    cursor: 'pointer', fontWeight: '600', fontSize: '13px', width: '100%',
    textAlign: 'left', transition: 'all 0.15s ease'
  });

  return (
    <div ref={menuRef} style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000 }}>
      {isOpen && (
        <div style={{
          position: 'absolute', bottom: '60px', right: 0, width: '300px',
          backgroundColor: 'white', borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb', overflow: 'hidden', maxHeight: '70vh',
          display: 'flex', flexDirection: 'column'
        }}>
          <div style={{
            padding: '14px 16px', backgroundColor: '#1f2937', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '14px' }}>
              <Wrench size={16} /> Ferramentas
            </div>
            <button onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ overflowY: 'auto', flex: 1, padding: '8px' }}>
            {!isEncerrada && (
              <>
                <button style={btnStyle('#8b5cf6')} onClick={() => { setIsAddItemModalOpen(true); setIsOpen(false); }}>
                  <Plus size={16} /> Adicionar Produto Extra
                </button>
                <div style={{ height: '6px' }} />
                <button style={btnStyle('#3b82f6')} onClick={() => { setIsUploadModalOpen(true); setIsOpen(false); }}>
                  <RefreshCcw size={16} /> Atualizar Importação DNA
                </button>
                <div style={{ height: '6px' }} />
                <button style={btnStyle('#4338ca')} onClick={() => { setIsEncomendasModalOpen(true); setIsOpen(false); }}>
                  <PackageOpen size={16} /> Importar Encomendas do Balcão
                </button>
                <div style={{ height: '6px' }} />
                <button style={btnStyle('#2563eb')} onClick={() => { setIsImportarItensModalOpen(true); setIsOpen(false); }}>
                  <PackageOpen size={16} /> Importar Produtos Não Comprados
                </button>
                <div style={{ height: '6px' }} />
                <button style={btnStyle('#64748b')} onClick={() => { setShowVinculosModal(true); setIsOpen(false); }}>
                  <Users size={16} /> Fornecedores Notificados
                </button>
                <div style={{ height: '6px' }} />
                <button style={btnStyle('#f59e0b')} onClick={() => { setIsEnviarModalOpen(true); setIsOpen(false); }}>
                  <MessageCircle size={16} /> Enviar / Cobrar
                </button>
                <div style={{ height: '6px' }} />
                <button 
                  style={btnStyle(Object.keys(decisaoCompra).length > 0 ? '#16a34a' : '#9ca3af')} 
                  onClick={handleGerarPedidos}
                  disabled={Object.keys(decisaoCompra).length === 0 || isProcessandoPedidos}
                >
                  {isProcessandoPedidos ? <Loader2 size={16} className="animate-spin" /> : <ShoppingCart size={16} />}
                  {isProcessandoPedidos ? 'Processando...' : 'Gerar Pedidos'}
                </button>
                <div style={{ height: '6px' }} />
              </>
            )}

            <button style={btnStyle('#6b7280')} onClick={() => { baixarRelatorioGeral(); setIsOpen(false); }}>
              <FileText size={16} /> Baixar PDF
            </button>

            <div style={{ height: '6px' }} />
            {!isEncerrada ? (
              <button style={btnStyle('#dc2626')} onClick={() => { alterarStatusCotacao('FINALIZADA'); setIsOpen(false); }}>
                <Check size={16} /> Encerrar Cotação
              </button>
            ) : (
              <button style={btnStyle('#f59e0b')} onClick={() => { alterarStatusCotacao('ABERTA'); setIsOpen(false); }}>
                <RefreshCcw size={16} /> Reabrir Cotação
              </button>
            )}
            <div style={{ height: '6px' }} />
            <button style={btnStyle('#1f2937')} onClick={() => { navigate('/cotacoes'); setIsOpen(false); }}>
              <ArrowLeft size={16} /> Voltar ao Painel
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '56px', height: '56px', borderRadius: '50%',
          backgroundColor: isOpen ? '#dc2626' : '#1f2937',
          color: 'white', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2), 0 4px 6px -2px rgba(0,0,0,0.1)',
          transition: 'all 0.2s ease', transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)'
        }}
        title="Ferramentas"
      >
        {isOpen ? <X size={24} /> : <Wrench size={24} />}
      </button>
    </div>
  );
}
