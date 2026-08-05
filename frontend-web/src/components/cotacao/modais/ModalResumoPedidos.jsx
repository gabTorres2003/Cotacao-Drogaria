import React from 'react';
import { X, ArrowRight, Loader2, Trash2 } from 'lucide-react';

export default function ModalResumoPedidos({
  isOpen, onClose, pedidosGerados, setPedidosGerados,
  removerItemDoPedido, moverItemParaFornecedor,
  irParaProximoMenorPreco, acaoPosPedido, setAcaoPosPedido,
  salvarPedidosNoBanco, salvandoPedidos, fornecedores, fMoney, pedidosAbertosList
}) {
  if (!isOpen) return null;

  const handleToggleFornecedor = (fIndex, checked) => {
     setPedidosGerados(prev => {
        const next = [...prev];
        next[fIndex].itens = next[fIndex].itens.map(i => ({...i, selected: checked}));
        return next;
     });
  };

  const handleToggleItem = (fIndex, iIndex, checked) => {
     setPedidosGerados(prev => {
        const next = [...prev];
        next[fIndex].itens[iIndex].selected = checked;
        return next;
     });
  };

  const totalGeralSelecionado = pedidosGerados.reduce((acc, ped) => {
      return acc + ped.itens.filter(i => i.selected).reduce((sum, item) => sum + item.subtotal, 0);
  }, 0);

  const hasAnySelected = pedidosGerados.some(ped => ped.itens.some(i => i.selected));

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#1e293b' }}>Resumo de Pedidos</h2>
          <button onClick={onClose} style={styles.closeBtn}><X size={24} /></button>
        </div>

        <div style={styles.content}>
          {pedidosGerados.map((pedido, fIndex) => {
            const allSelected = pedido.itens.length > 0 && pedido.itens.every(i => i.selected);
            const someSelected = pedido.itens.some(i => i.selected);
            const totalForn = pedido.itens.filter(i => i.selected).reduce((sum, i) => sum + i.subtotal, 0);

            // Busca pedidos em aberto DESSA empresa
            const ordersForn = (pedidosAbertosList || []).filter(p => {
                const n = p.fornecedor?.empresa || p.fornecedor?.nome || p.fornecedorNome;
                return n && n.toLowerCase().trim() === pedido.fornecedorNome.toLowerCase().trim();
            }).sort((a, b) => b.id - a.id); // Mais recentes primeiro

            return (
              <div key={pedido.fornecedorNome} style={{ ...styles.card, opacity: someSelected ? 1 : 0.6 }}>
                <div style={styles.cardHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={el => { if(el) el.indeterminate = !allSelected && someSelected; }}
                      onChange={e => handleToggleFornecedor(fIndex, e.target.checked)}
                      style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                    />
                    <h3 style={{ margin: 0, fontSize: '18px', color: '#1f2937' }}>{pedido.fornecedorNome}</h3>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>Ação:</span>
                    <select
                       value={pedido.acaoFornecedor || 'NOVO'}
                       onChange={e => {
                           const val = e.target.value;
                           setPedidosGerados(prev => {
                              const next = [...prev];
                              next[fIndex].acaoFornecedor = val;
                              return next;
                           });
                       }}
                       style={styles.selectAcao}
                       disabled={!someSelected}
                    >
                       <option value="NOVO">Gerar Novo Pedido</option>
                       {ordersForn.map(o => <option key={o.id} value={o.id}>Adicionar ao Pedido #{o.id}</option>)}
                    </select>
                  </div>
                </div>

                <table style={styles.table}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '13px' }}>
                      <th style={{ padding: '8px', width: '30px', textAlign: 'center' }}>✓</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Produto</th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>Qtd</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Preço Unit.</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Subtotal</th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>Mover / Trocar</th>
                      <th style={{ padding: '8px', width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedido.itens.map((item, iIndex) => {
                       const nomeExibir = item.nomeOriginal && item.nomeProduto !== item.nomeOriginal ? item.nomeProduto : item.nomeProduto;

                       return (
                         <tr key={iIndex} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: item.selected ? 'white' : '#f8fafc', opacity: item.selected ? 1 : 0.4 }}>
                           <td style={{ padding: '8px', textAlign: 'center' }}>
                              <input 
                                 type="checkbox" 
                                 checked={item.selected} 
                                 onChange={e => handleToggleItem(fIndex, iIndex, e.target.checked)}
                                 style={{ cursor: 'pointer', transform: 'scale(1.1)' }}
                              />
                           </td>
                           <td style={{ padding: '8px', fontSize: '13px', fontWeight: '500', color: '#1e293b' }}>
                             {nomeExibir}
                             {item.nomeOriginal && item.nomeProduto !== item.nomeOriginal && (
                               <div style={{ fontSize: '10px', color: '#d97706', marginTop: '2px' }}>
                                 Troca de: {item.nomeOriginal}
                               </div>
                             )}
                           </td>
                           <td style={{ padding: '8px', textAlign: 'center', fontSize: '13px' }}>{item.quantidadePedida}</td>
                           <td style={{ padding: '8px', textAlign: 'right', fontSize: '13px' }}>{fMoney(item.valorUnitarioPedido)}</td>
                           <td style={{ padding: '8px', textAlign: 'right', fontSize: '13px', fontWeight: 'bold', color: item.selected ? '#16a34a' : '#9ca3af' }}>
                             {fMoney(item.subtotal)}
                           </td>
                           <td style={{ padding: '8px', textAlign: 'center' }}>
                             {!item.isExtra && item.selected && (
                               <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                   <ArrowRight size={12} color="#6b7280" />
                                   <select 
                                     style={styles.selectSmall}
                                     value={pedido.fornecedorNome}
                                     onChange={(e) => moverItemParaFornecedor(pedido.fornecedorNome, iIndex, e.target.value)}
                                   >
                                     <option value={pedido.fornecedorNome}>{pedido.fornecedorNome}</option>
                                     {fornecedores.filter(f => f !== pedido.fornecedorNome).map(f => (
                                       <option key={f} value={f}>{f}</option>
                                     ))}
                                   </select>
                                 </div>
                                 <button onClick={() => irParaProximoMenorPreco(pedido.fornecedorNome, iIndex)} style={styles.btnSmallBlue}>
                                   Próximo Menor $
                                 </button>
                               </div>
                             )}
                           </td>
                           <td style={{ padding: '8px', textAlign: 'center' }}>
                             <button onClick={() => removerItemDoPedido(pedido.fornecedorNome, iIndex)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                               <Trash2 size={16} />
                             </button>
                           </td>
                         </tr>
                       )
                    })}
                  </tbody>
                </table>
                <div style={{ textAlign: 'right', padding: '12px 16px', borderTop: '1px solid #e2e8f0', fontSize: '14px', fontWeight: 'bold', backgroundColor: '#f8fafc', borderRadius: '0 0 8px 8px' }}>
                   Total Selecionado de {pedido.fornecedorNome}: <span style={{ color: '#16a34a', fontSize: '16px' }}>{fMoney(totalForn)}</span>
                </div>
              </div>
            )
          })}
        </div>

        <div style={styles.footer}>
          <div style={styles.footerOptions}>
            <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '14px', color: '#1e293b' }}>Após processar os pedidos, o que deseja fazer com a cotação?</p>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', color: '#2563eb', fontWeight: '500' }}>
              <input type="radio" name="acaoCotacao" checked={acaoPosPedido === 'ABERTA'} onChange={() => setAcaoPosPedido('ABERTA')} />
              Deixar em Aberto (Aguardando outros pedidos)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', color: '#dc2626', fontWeight: '500', marginTop: '4px' }}>
              <input type="radio" name="acaoCotacao" checked={acaoPosPedido === 'ENCERRADA'} onChange={() => setAcaoPosPedido('ENCERRADA')} />
              Encerrar Cotação (Mover para o Histórico)
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
             <div style={{ textAlign: 'right', marginRight: '16px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>Total Geral Selecionado</div>
                <div style={{ fontSize: '20px', color: '#16a34a', fontWeight: '900' }}>{fMoney(totalGeralSelecionado)}</div>
             </div>
            <button onClick={onClose} disabled={salvandoPedidos} style={styles.btnCancel}>Cancelar</button>
            <button onClick={salvarPedidosNoBanco} disabled={salvandoPedidos || !hasAnySelected} style={{ ...styles.btnSave, opacity: hasAnySelected ? 1 : 0.5 }}>
              {salvandoPedidos ? <><Loader2 size={16} className="animate-spin"/> Processando...</> : 'Confirmar e Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' },
  modal: { backgroundColor: '#f8fafc', borderRadius: '12px', width: '100%', maxWidth: '1000px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
  header: { padding: '20px 24px', backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' },
  content: { padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' },
  card: { backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: '0.2s' },
  cardHeader: { padding: '16px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f1f5f9', borderRadius: '8px 8px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  selectAcao: { padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 'bold', color: '#1e293b', outline: 'none', cursor: 'pointer', minWidth: '200px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  selectSmall: { padding: '2px 4px', fontSize: '11px', borderRadius: '4px', border: '1px solid #cbd5e1', maxWidth: '120px' },
  btnSmallBlue: { padding: '4px 8px', fontSize: '10px', fontWeight: 'bold', backgroundColor: '#e0e7ff', color: '#4338ca', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  footer: { padding: '20px 24px', backgroundColor: 'white', borderTop: '1px solid #e2e8f0', borderRadius: '0 0 12px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  footerOptions: { backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' },
  btnCancel: { padding: '10px 20px', backgroundColor: '#64748b', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' },
  btnSave: { padding: '10px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }
};