import React, { useState, useRef, useEffect } from 'react';
import { 
  Wrench, X, Plus, RefreshCcw, Users, MessageCircle, ShoppingCart, 
  FileText, Check, PackageOpen, Download, ChevronDown, Settings2,
  ArrowLeft, Loader2
} from 'lucide-react';

export default function FloatingToolsMenu({
  isEncerrada, setIsAddItemModalOpen, setIsUploadModalOpen,
  setIsEnviarModalOpen, setShowVinculosModal,
  decisaoCompra, handleGerarPedidos, isProcessandoPedidos,
  baixarRelatorioGeral, alterarStatusCotacao, navigate,
  setIsEncomendasModalOpen, setIsImportarItensModalOpen,
  termoBusca, setTermoBusca, filtroOrigem, setFiltroOrigem,
  filtroPropostas, setFiltroPropostas,
  showColunasDropdown, setShowColunasDropdown, colunasVisiveis, setColunasVisiveis,
  fornecedores, fornecedoresVisiveis, setFornecedoresVisiveis,
  modoVisualizacao, subAbaItens, setSubAbaItens
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
        setActiveSection(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const btnStyle = (color = '#6b7280') => ({
    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px',
    backgroundColor: color, color: 'white', border: 'none', borderRadius: '8px',
    cursor: 'pointer', fontWeight: '600', fontSize: '13px', width: '100%',
    textAlign: 'left', transition: 'all 0.15s ease'
  });

  const sectionBtnStyle = (active) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 14px', backgroundColor: active ? '#f1f5f9' : 'white',
    border: active ? '1px solid #cbd5e1' : '1px solid #e5e7eb', borderRadius: '8px',
    cursor: 'pointer', fontWeight: '600', fontSize: '13px', color: '#374151',
    width: '100%', textAlign: 'left', transition: 'all 0.15s ease'
  });

  return (
    <div ref={menuRef} style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000 }}>
      {/* Menu Panel */}
      {isOpen && (
        <div style={{
          position: 'absolute', bottom: '60px', right: 0, width: '320px',
          backgroundColor: 'white', borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb', overflow: 'hidden', maxHeight: '70vh',
          display: 'flex', flexDirection: 'column'
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px', backgroundColor: '#1f2937', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '14px' }}>
              <Wrench size={16} /> Ferramentas
            </div>
            <button onClick={() => { setIsOpen(false); setActiveSection(null); }}
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}>
              <X size={18} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '8px' }}>
            {/* Ações Principais */}
            <button style={btnStyle('#6b7280')} onClick={() => navigate('/cotacoes')}>
              <ArrowLeft size={16} /> Voltar ao Painel
            </button>

            {!isEncerrada && (
              <>
                <div style={{ height: '6px' }} />
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
              </>
            )}

            <div style={{ height: '6px' }} />
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

            {/* Filtros Section */}
            {modoVisualizacao !== 'manual' && (
              <>
                <div style={{ height: '6px' }} />
                <button style={sectionBtnStyle(activeSection === 'filtros')} onClick={() => toggleSection('filtros')}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Settings2 size={16} /> Filtros e Colunas
                  </span>
                  <ChevronDown size={16} style={{ transform: activeSection === 'filtros' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                </button>
                {activeSection === 'filtros' && (
                  <div style={{ padding: '8px', backgroundColor: '#f8fafc', borderRadius: '0 0 8px 8px', border: '1px solid #e5e7eb', borderTop: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(modoVisualizacao === 'itens' || modoVisualizacao === 'comparativo') && (
                      <div style={{ display: 'flex', gap: '4px', backgroundColor: '#e5e7eb', padding: '3px', borderRadius: '6px' }}>
                        <button onClick={() => setSubAbaItens('todos')} style={{ flex: 1, padding: '6px 8px', border: 'none', borderRadius: '4px', fontWeight: '600', fontSize: '11px', cursor: 'pointer', backgroundColor: subAbaItens === 'todos' ? 'white' : 'transparent', color: subAbaItens === 'todos' ? '#4f46e5' : '#64748b', boxShadow: subAbaItens === 'todos' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none' }}>
                          Todos
                        </button>
                        <button onClick={() => setSubAbaItens('pendentes')} style={{ flex: 1, padding: '6px 8px', border: 'none', borderRadius: '4px', fontWeight: '600', fontSize: '11px', cursor: 'pointer', backgroundColor: subAbaItens === 'pendentes' ? 'white' : 'transparent', color: subAbaItens === 'pendentes' ? '#2563eb' : '#64748b', boxShadow: subAbaItens === 'pendentes' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none' }}>
                          Pendentes
                        </button>
                        <button onClick={() => setSubAbaItens('comprados')} style={{ flex: 1, padding: '6px 8px', border: 'none', borderRadius: '4px', fontWeight: '600', fontSize: '11px', cursor: 'pointer', backgroundColor: subAbaItens === 'comprados' ? 'white' : 'transparent', color: subAbaItens === 'comprados' ? '#16a34a' : '#64748b', boxShadow: subAbaItens === 'comprados' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none' }}>
                          Comprados
                        </button>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #d1d5db', padding: '6px 10px', borderRadius: '6px', backgroundColor: 'white' }}>
                      <input type="text" placeholder="Filtrar por produto..." value={termoBusca}
                        onChange={e => setTermoBusca(e.target.value)}
                        style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13px' }} />
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '100px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Origem:</label>
                        <select value={filtroOrigem} onChange={e => setFiltroOrigem(e.target.value)}
                          style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none' }}>
                          <option value="TODOS">Todas</option>
                          <option value="Extra Manual">Extra Manual</option>
                          <option value="Nova Importação">Atualização DNA</option>
                          <option value="Falta Manual">Falta Manual</option>
                          <option value="Sugestão">Sugestão</option>
                          <option value="Falta e Sugestão">Falta e Sugestão</option>
                          <option value="Geral">Geral</option>
                        </select>
                      </div>
                      <div style={{ flex: 1, minWidth: '100px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Propostas:</label>
                        <select value={filtroPropostas} onChange={e => setFiltroPropostas(e.target.value)}
                          style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none' }}>
                          <option value="TODOS">Todas</option>
                          <option value="COM_PROPOSTAS">Com Propostas</option>
                          <option value="SEM_PROPOSTAS">Sem Propostas</option>
                        </select>
                      </div>
                    </div>

                    <button onClick={() => setShowColunasDropdown(!showColunasDropdown)}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: showColunasDropdown ? '#f1f5f9' : 'white', cursor: 'pointer', fontWeight: '600', color: '#4b5563', fontSize: '12px', width: '100%', justifyContent: 'center' }}>
                      <Settings2 size={14} /> Colunas da Tabela
                    </button>
                    {showColunasDropdown && (
                      <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                        <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase' }}>Exibir</div>
                        {Object.entries({ quantidade: 'Qtd', estoque: 'Estoque', vendidoNoMes: 'Vendido Mês', vendidoAposUltCompra: 'Vend. pós Últ.', ultCompraData: 'Data Últ. Compra', ultCompraQtde: 'Qtd Últ. Compra', ultVendaData: 'Data Últ. Venda', ultimoPreco: 'Preço Últ. Compra', codBarras: 'Cód. Barras' }).map(([key, label]) => (
                          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11px', color: '#374151' }}>
                            <input type="checkbox" checked={colunasVisiveis[key]} onChange={(e) => setColunasVisiveis(prev => ({ ...prev, [key]: e.target.checked }))} style={{ transform: 'scale(1.1)' }} />
                            {label}
                          </label>
                        ))}
                        {fornecedores.length > 0 && (
                          <>
                            <div style={{ borderTop: '1px solid #e5e7eb', margin: '4px 0' }}></div>
                            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase' }}>Fornecedores</div>
                            {fornecedores.map(f => (
                              <label key={f} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11px', color: '#374151' }}>
                                <input type="checkbox" checked={fornecedoresVisiveis[f] ?? true} onChange={(e) => setFornecedoresVisiveis(prev => ({ ...prev, [f]: e.target.checked }))} style={{ transform: 'scale(1.1)' }} />
                                {f}
                              </label>
                            ))}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={() => { setIsOpen(!isOpen); if (isOpen) setActiveSection(null); }}
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
