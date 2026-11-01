import React, { useState, useRef, useEffect } from 'react';
import { 
  Wrench, X, Plus, RefreshCcw, Users, MessageCircle, ShoppingCart, 
  FileText, Check, PackageOpen, Loader2, AlertTriangle
} from 'lucide-react';

export default function FloatingToolsMenu({
  isEncerrada, setIsAddItemModalOpen, setIsUploadModalOpen,
  setIsEnviarModalOpen, setShowVinculosModal,
  decisaoCompra, handleGerarPedidos, isProcessandoPedidos,
  baixarRelatorioGeral, alterarStatusCotacao,
  setIsEncomendasModalOpen, setIsImportarItensModalOpen,
  isComparativo, destacarBaixoGiro, setDestacarBaixoGiro,
  mostrarAlertasPreco, setMostrarAlertasPreco,
  filtroTopN, setFiltroTopN
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

  const btnStyle = (color = 'var(--text-muted)') => ({
    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px',
    backgroundColor: color, color: 'white', border: 'none', borderRadius: '8px',
    cursor: 'pointer', fontWeight: '600', fontSize: '13px', width: '100%',
    textAlign: 'left', transition: 'all 0.15s ease'
  });

  const topNBtn = (ativo) => ({
    padding: '6px 10px', borderRadius: '6px', border: ativo ? 'none' : '1px solid var(--border-strong)',
    backgroundColor: ativo ? 'var(--primary)' : 'var(--surface)', color: ativo ? 'white' : 'var(--text-secondary)',
    fontWeight: 'bold', fontSize: '11px', cursor: 'pointer',
    boxShadow: ativo ? '0 2px 4px rgba(37,99,235,0.2)' : 'none', flex: 1, minWidth: '0'
  });

  const checkLabelStyle = (ativo, color = 'var(--warning)') => ({
    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px',
    backgroundColor: ativo ? `${color}1a` : 'var(--surface-muted)',
    color: ativo ? 'var(--text)' : 'var(--text-secondary)',
    border: `1px solid ${ativo ? color : 'var(--border)'}`, borderRadius: '8px',
    cursor: 'pointer', fontWeight: '600', fontSize: '13px', width: '100%',
    textAlign: 'left', userSelect: 'none', transition: 'all 0.15s ease'
  });

  const topNOptions = [
    ['TODOS', 'Sem Filtro (Ver Todos)'],
    ['TOP_1', 'Top 1 (Ganhador)'],
    ['TOP_2', 'Top 2'],
    ['TOP_3', 'Top 3'],
    ['TOP_4', 'Top 4'],
  ];

  return (
    <div ref={menuRef} style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000 }}>
      {isOpen && (
        <div style={{
          position: 'absolute', bottom: '60px', right: 0, width: '300px',
          backgroundColor: 'var(--surface)', borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
          border: '1px solid var(--border)', overflow: 'hidden', maxHeight: '70vh',
          display: 'flex', flexDirection: 'column'
        }}>
          <div style={{
            padding: '14px 16px', backgroundColor: 'var(--text)', color: 'white',
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
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '6px 8px' }}>
              Alertas
            </div>

            <label style={checkLabelStyle(destacarBaixoGiro, 'var(--danger)')}>
              <input
                type="checkbox"
                checked={destacarBaixoGiro}
                onChange={(e) => setDestacarBaixoGiro(e.target.checked)}
                style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
              />
              <AlertTriangle size={16} color={destacarBaixoGiro ? 'var(--danger)' : 'var(--text-subtle)'} />
              Destacar Risco de Excesso
            </label>

            <div style={{ height: '6px' }} />

            {isComparativo && (
              <>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '6px 8px' }}>
                  Comparativo
                </div>

                <label style={checkLabelStyle(mostrarAlertasPreco, 'var(--warning)')}>
                  <input
                    type="checkbox"
                    checked={mostrarAlertasPreco}
                    onChange={(e) => setMostrarAlertasPreco(e.target.checked)}
                    style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                  />
                  <AlertTriangle size={16} color={mostrarAlertasPreco ? 'var(--warning)' : 'var(--text-subtle)'} />
                  Destacar Preços Discrepantes
                </label>

                <div style={{ height: '10px' }} />

                <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '6px 8px' }}>
                  Filtro de Competitividade
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '0 4px 8px' }}>
                  {topNOptions.map(([valor, rotulo]) => (
                    <button
                      key={valor}
                      type="button"
                      onClick={() => setFiltroTopN(valor)}
                      style={{ ...topNBtn(filtroTopN === valor), flex: '1 1 45%' }}
                      title={rotulo}
                    >
                      {rotulo}
                    </button>
                  ))}
                </div>

                <div style={{ height: '6px', borderBottom: '1px solid var(--border)', marginBottom: '8px' }} />
              </>
            )}

            {!isEncerrada && (
              <>
                <button style={btnStyle('var(--purple)')} onClick={() => { setIsAddItemModalOpen(true); setIsOpen(false); }}>
                  <Plus size={16} /> Adicionar Produto Extra
                </button>
                <div style={{ height: '6px' }} />
                <button style={btnStyle('var(--info)')} onClick={() => { setIsUploadModalOpen(true); setIsOpen(false); }}>
                  <RefreshCcw size={16} /> Atualizar Importação DNA
                </button>
                <div style={{ height: '6px' }} />
                <button style={btnStyle('var(--purple-text)')} onClick={() => { setIsEncomendasModalOpen(true); setIsOpen(false); }}>
                  <PackageOpen size={16} /> Importar Encomendas do Balcão
                </button>
                <div style={{ height: '6px' }} />
                <button style={btnStyle('var(--primary)')} onClick={() => { setIsImportarItensModalOpen(true); setIsOpen(false); }}>
                  <PackageOpen size={16} /> Importar Produtos Não Comprados
                </button>
                <div style={{ height: '6px' }} />
                <button style={btnStyle('var(--text-muted)')} onClick={() => { setShowVinculosModal(true); setIsOpen(false); }}>
                  <Users size={16} /> Fornecedores Notificados
                </button>
                <div style={{ height: '6px' }} />
                <button style={btnStyle('var(--warning)')} onClick={() => { setIsEnviarModalOpen(true); setIsOpen(false); }}>
                  <MessageCircle size={16} /> Enviar / Cobrar
                </button>
                <div style={{ height: '6px' }} />
                <button 
                  style={btnStyle(Object.keys(decisaoCompra).length > 0 ? 'var(--success)' : 'var(--text-subtle)')}
                  onClick={handleGerarPedidos}
                  disabled={Object.keys(decisaoCompra).length === 0 || isProcessandoPedidos}
                >
                  {isProcessandoPedidos ? <Loader2 size={16} className="animate-spin" /> : <ShoppingCart size={16} />}
                  {isProcessandoPedidos ? 'Processando...' : 'Gerar Pedidos'}
                </button>
                <div style={{ height: '6px' }} />
              </>
            )}

            <button style={btnStyle('var(--text-muted)')} onClick={() => { baixarRelatorioGeral(); setIsOpen(false); }}>
              <FileText size={16} /> Baixar PDF
            </button>

            <div style={{ height: '6px' }} />
            {!isEncerrada ? (
              <button style={btnStyle('var(--danger)')} onClick={() => { alterarStatusCotacao('FINALIZADA'); setIsOpen(false); }}>
                <Check size={16} /> Encerrar Cotação
              </button>
            ) : (
              <button style={btnStyle('var(--warning)')} onClick={() => { alterarStatusCotacao('ABERTA'); setIsOpen(false); }}>
                <RefreshCcw size={16} /> Reabrir Cotação
              </button>
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '56px', height: '56px', borderRadius: '50%',
          backgroundColor: isOpen ? 'var(--danger)' : 'var(--text)',
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
