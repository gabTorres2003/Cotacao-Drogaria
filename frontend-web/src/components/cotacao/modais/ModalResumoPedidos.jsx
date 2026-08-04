import React from 'react';
import { X, Eye, ArrowRightLeft, Trash2, Plus } from 'lucide-react';

export default function ModalResumoPedidos({
  isOpen,
  onClose,
  pedidosGerados,
  setPedidosGerados,
  promocoes,
  avisosDuplicidade,
  fornecedores,
  adicionarPromocaoAoPedido,
  removerItemDoPedido,
  moverItemParaFornecedor,
  irParaProximoMenorPreco,
  acaoPosPedido,
  setAcaoPosPedido,
  salvarPedidosNoBanco,
  salvandoPedidos,
  getNomeRealSempre,
  fMoney
}) {
  if (!isOpen) return null;

  const styles = {
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '95%', maxWidth: '1000px', maxHeight: '85vh', overflowY: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: 0 },
    th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #e5e7eb', color: '#4b5563', fontSize: '13px', whiteSpace: 'nowrap' },
    td: { padding: '12px', borderBottom: '1px solid #e5e7eb', color: '#374151', fontSize: '13px' },
    inputEdicao: { padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' },
    btnIcon: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px' },
    btnVoltar: { padding: '10px 20px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1f2937' }}>Resumo de Pedidos</h2>
          <button type="button" onClick={onClose} style={styles.btnIcon}><X size={24} color="#4b5563" /></button>
        </div>
        
        {pedidosGerados.map((pedido, index) => {
          const promosDesteFornecedor = promocoes.filter(p => p.fornecedorNome === pedido.fornecedorNome);
          const promosNaoAdicionadas = promosDesteFornecedor.filter(p => !pedido.itens.some(i => i.isExtra && i.promocaoId === p.id));

          return (
            <div key={index} style={{ marginBottom: '24px', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f9fafb', overflowX: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>{pedido.fornecedorNome}</h3>
              </div>
              
              <table style={{ ...styles.table, backgroundColor: 'white', minWidth: '600px' }}>
                <thead>
                  <tr>
                    <th style={styles.th}>Produto</th>
                    <th style={{...styles.th, textAlign: 'center'}}>Qtd</th>
                    <th style={styles.th}>Preço Unit.</th>
                    <th style={styles.th}>Subtotal</th>
                    <th style={{...styles.th, textAlign: 'center', minWidth: '150px'}}>Mover / Trocar</th>
                    <th style={styles.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {pedido.itens.map((item, idx) => {
                    const nomeProdutoBusca = getNomeRealSempre(item.nomeProduto).toUpperCase().trim();
                    const duplicatasSet = avisosDuplicidade[nomeProdutoBusca];

                    return (
                      <tr key={idx} style={{ backgroundColor: item.isExtra ? '#eff6ff' : 'white' }}>
                        <td style={styles.td}>
                          <span style={{ fontWeight: '500', color: '#111827', display: 'block' }}>{item.nomeProduto}</span>
                          {item.nomeOriginal && <span style={{ fontSize: '11px', color: '#b45309', display: 'block' }}>Troca de: {item.nomeOriginal}</span>}
                          {item.isExtra && <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 'bold', display: 'block' }}>Oferta Extra</span>}
                          {item.observacao && <span style={{ fontSize: '11px', color: '#475569', fontStyle: 'italic', display: 'block' }}>Obs: {item.observacao}</span>}
                          
                          {duplicatasSet && duplicatasSet.size > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                            <span style={{ fontSize: '11px', color: '#d97706', fontWeight: 'bold' }}>⚠️ Já pedido em:</span>
                            {Array.from(duplicatasSet).map((cotId) => (
                              <button
                                key={cotId}
                                type="button"
                                onClick={() => window.open(`/cotacao/${cotId}`, '_blank')}
                                title={`Abrir Cotação #${cotId} em uma nova aba`}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde047', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                              >
                                <Eye size={12} /> Cotação #{cotId}
                              </button>
                            ))}
                          </div>
                        )}
                        </td>
                        <td style={{...styles.td, textAlign: 'center'}}>
                          <input 
                            type="number" min="1" value={item.quantidadePedida}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const q = Number(e.target.value) || 1;
                              setPedidosGerados(prev => prev.map(p => {
                                if (p.fornecedorNome === pedido.fornecedorNome) {
                                  const nitens = [...p.itens];
                                  nitens[idx] = { ...nitens[idx], quantidadePedida: q, subtotal: q * nitens[idx].valorUnitarioPedido };
                                  return { ...p, itens: nitens, total: nitens.reduce((a, b) => a + b.subtotal, 0) };
                                }
                                return p;
                              }));
                            }}
                            style={{ ...styles.inputEdicao, width: '60px', textAlign: 'center' }}
                          />
                        </td>
                        <td style={styles.td}>{fMoney(item.valorUnitarioPedido)}</td>
                        <td style={styles.td}>{fMoney(item.subtotal)}</td>
                        
                        <td style={{...styles.td, textAlign: 'center'}}>
                          {!item.isExtra && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <ArrowRightLeft size={12} color="#64748b" />
                                <select 
                                  style={{...styles.inputEdicao, width: '130px', fontSize: '11px', padding: '2px 4px'}}
                                  value={pedido.fornecedorNome}
                                  onChange={(e) => moverItemParaFornecedor(pedido.fornecedorNome, idx, e.target.value)}
                                >
                                  {fornecedores.map(f => (
                                    <option key={f} value={f}>{f}</option>
                                  ))}
                                </select>
                              </div>
                              <button 
                                type="button" 
                                onClick={() => irParaProximoMenorPreco(pedido.fornecedorNome, idx)}
                                title="Busca o próximo fornecedor mais barato"
                                style={{ fontSize: '10px', backgroundColor: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}
                              >
                                Próximo Menor $
                              </button>
                            </div>
                          )}
                        </td>

                        <td style={{...styles.td, textAlign: 'center'}}>
                          <button type="button" onClick={() => removerItemDoPedido(pedido.fornecedorNome, idx)} style={{ ...styles.btnIcon, color: '#ef4444' }}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" style={{ ...styles.td, textAlign: 'right', fontWeight: 'bold' }}>Total:</td>
                    <td colSpan="3" style={{ ...styles.td, fontWeight: 'bold', color: '#16a34a', fontSize: '16px' }}>{fMoney(pedido.total)}</td>
                  </tr>
                </tfoot>
              </table>

              {promosNaoAdicionadas.length > 0 && (
                <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#166534', fontWeight: '600' }}>Fornecedor ofereceu itens extras. Incluir no pedido?</p>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {promosNaoAdicionadas.map(promo => (
                      <button type="button" key={promo.id} onClick={() => adicionarPromocaoAoPedido(pedido.fornecedorNome, promo)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: 'white', border: '1px solid #22c55e', color: '#16a34a', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
                        <Plus size={14} /> Add {getNomeRealSempre(promo.nomeProduto)} ({fMoney(promo.preco)})
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#374151' }}>Após gerar os pedidos, o que deseja fazer com a cotação?</h4>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
                <input type="radio" name="acaoPosPedidoAutomatico" value="ABERTA" checked={acaoPosPedido === 'ABERTA'} onChange={() => setAcaoPosPedido('ABERTA')} />
                <span style={{ fontSize: '14px', color: '#4b5563' }}>Deixar em Aberto (Aguardando outros pedidos)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="radio" name="acaoPosPedidoAutomatico" value="ENCERRADA" checked={acaoPosPedido === 'ENCERRADA'} onChange={() => setAcaoPosPedido('ENCERRADA')} />
                <span style={{ fontSize: '14px', color: '#dc2626', fontWeight: 'bold' }}>Encerrar Cotação (Mover para o Histórico)</span>
            </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', gap: '12px' }}>
          <button type="button" onClick={onClose} style={styles.btnVoltar} disabled={salvandoPedidos}>Cancelar</button>
          <button type="button" onClick={salvarPedidosNoBanco} style={{ ...styles.btnVoltar, backgroundColor: '#16a34a' }} disabled={salvandoPedidos}>
            {salvandoPedidos ? 'Salvando...' : 'Confirmar e Salvar Pedidos'}
          </button>
        </div>
      </div>
    </div>
  );
}