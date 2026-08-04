import React from 'react';
import { ArrowDown, RefreshCcw, Check, Copy, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import BadgeOrigem from './BadgeOrigem';

export default function TabelaRegistroManual({
  relatorioExibicao, checklist, setChecklist, fornecedoresLista, isEncerrada, 
  getNomeExibicao, isDiversos, mostrarNomeReal, copiarParaAreaTransferencia, 
  copiadoId, copiarFornecedorParaBaixo, reatribuirItem, fMoney, requestSort, sortConfig
}) {
  const thStyle = { textAlign: 'left', padding: '12px', borderBottom: '2px solid #e5e7eb', color: '#4b5563', fontSize: '13px', whiteSpace: 'nowrap', position: 'sticky', top: 0, backgroundColor: '#ffffff', zIndex: 10 };
  const tdStyle = { padding: '12px', borderBottom: '1px solid #e5e7eb', color: '#374151', fontSize: '13px', wordBreak: 'break-word', whiteSpace: 'normal' };
  const inputEdicao = { padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' };

  const SortIcon = ({ sortKey }) => {
    if (sortConfig.key !== sortKey) return <ArrowUpDown size={14} color="#9ca3af" style={{ marginLeft: '6px' }} />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} color="#2563eb" style={{ marginLeft: '6px' }} /> : <ChevronDown size={14} color="#2563eb" style={{ marginLeft: '6px' }} />;
  };

  return (
    <div style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto', overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 0 }}>
        <thead>
          <tr>
            <th style={{ ...thStyle, width: '120px', minWidth: '100px', cursor: 'pointer' }} onClick={() => requestSort('origemItem')}><div style={{ display: 'flex', alignItems: 'center' }}>Origem <SortIcon sortKey="origemItem" /></div></th>
            <th style={{ ...thStyle, cursor: 'pointer', minWidth: '200px' }} onClick={() => requestSort('nomeProduto')}><div style={{ display: 'flex', alignItems: 'center' }}>Produto <SortIcon sortKey="nomeProduto" /></div></th>
            <th style={{ ...thStyle, textAlign: 'center', width: '200px', minWidth: '180px' }}>Fornecedor</th>
            <th style={{ ...thStyle, textAlign: 'center', width: '90px', minWidth: '90px', cursor: 'pointer' }} onClick={() => requestSort('quantidade')}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Qtd <SortIcon sortKey="quantidade" /></div></th>
            <th style={{ ...thStyle, textAlign: 'right', width: '110px', minWidth: '110px' }}>Custo Final (R$)</th>
            <th style={{ ...thStyle, textAlign: 'right', width: '110px', minWidth: '110px' }}>Subtotal</th>
            <th style={{ ...thStyle, textAlign: 'center', width: '120px', minWidth: '120px', backgroundColor: '#f0fdf4', color: '#166534', position: 'sticky', right: 0, zIndex: 20, boxShadow: '-2px 0 5px -2px rgba(0,0,0,0.1)' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {relatorioExibicao.map((item, index) => {
            const chk = checklist[item.idItem] || { comprado: false, qtd: 1, preco: 0, bloqueado: false, falta: false, fornecedor: '' };
            const rowStyle = chk.bloqueado ? { backgroundColor: '#f3f4f6', opacity: 0.6 } : chk.comprado ? { backgroundColor: '#f0fdf4', opacity: 0.85 } : { backgroundColor: '#ffffff' };
            const textStyle = chk.bloqueado || chk.comprado ? { textDecoration: 'line-through', color: '#9ca3af' } : { fontWeight: '600', color: '#1f2937' };

            return (
              <tr key={item.idItem} style={rowStyle}>
                <td style={tdStyle}><BadgeOrigem origem={item.origemItem} /></td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ ...textStyle, fontSize: '13px' }}>{getNomeExibicao(item.nomeProduto)}</span>
                    {isDiversos(item.nomeProduto) && !mostrarNomeReal && (<span style={{ fontSize: '10px', backgroundColor: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: '4px', border: '1px solid #fde047', fontWeight: 'bold' }}>Genérico</span>)}
                    {item.editadoManual && (<span style={{ fontSize: '10px', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', border: '1px solid #bae6fd', fontWeight: 'bold', marginLeft: '6px' }}>✏️ Editado</span>)}
                    <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); copiarParaAreaTransferencia(getNomeExibicao(item.nomeProduto), item.idItem); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: copiadoId === item.idItem ? '#10b981' : '#9ca3af' }}>
                      {copiadoId === item.idItem ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <select value={chk.fornecedor || ''} onChange={(e) => setChecklist({ ...checklist, [item.idItem]: { ...chk, fornecedor: e.target.value } })} disabled={!chk.comprado || chk.bloqueado || isEncerrada} style={{ ...inputEdicao, width: '100%', fontSize: '12px', padding: '6px' }}>
                      <option value="">-- Selecionar --</option>
                      {fornecedoresLista.map(f => <option key={f.id} value={f.nome}>{f.nome}</option>)}
                    </select>
                    <button type="button" onClick={() => copiarFornecedorParaBaixo(chk.fornecedor, index)} disabled={!chk.fornecedor || !chk.comprado || chk.bloqueado || isEncerrada} style={{ background: (!chk.fornecedor || !chk.comprado || chk.bloqueado || isEncerrada) ? '#f3f4f6' : '#e0e7ff', color: (!chk.fornecedor || !chk.comprado || chk.bloqueado || isEncerrada) ? '#9ca3af' : '#4f46e5', border: '1px solid', borderColor: (!chk.fornecedor || !chk.comprado || chk.bloqueado || isEncerrada) ? '#d1d5db' : '#c7d2fe', borderRadius: '4px', padding: '4px', cursor: (!chk.fornecedor || !chk.comprado || chk.bloqueado || isEncerrada) ? 'not-allowed' : 'pointer' }}>
                      <ArrowDown size={14} />
                    </button>
                  </div>
                </td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                  <input type="number" min="0" value={chk.qtd} onChange={(e) => setChecklist({ ...checklist, [item.idItem]: { ...chk, qtd: Number(e.target.value) } })} onFocus={(e) => e.target.select()} style={{ ...inputEdicao, width: '60px', textAlign: 'center', fontWeight: 'bold' }} disabled={!chk.comprado || chk.bloqueado || isEncerrada} />
                </td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>
                  <input type="number" step="0.01" min="0" value={chk.preco} onChange={(e) => setChecklist({ ...checklist, [item.idItem]: { ...chk, preco: Number(e.target.value) } })} onFocus={(e) => e.target.select()} style={{ ...inputEdicao, width: '80px', textAlign: 'right', fontWeight: 'bold' }} disabled={!chk.comprado || chk.bloqueado || isEncerrada} />
                </td>
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 'bold', color: (chk.comprado && !chk.bloqueado) ? '#166534' : '#6b7280' }}>
                  {fMoney(chk.qtd * chk.preco)}
                </td>
                <td style={{ ...tdStyle, textAlign: 'center', backgroundColor: chk.bloqueado ? '#e5e7eb' : chk.comprado ? '#dcfce7' : '#ffffff', borderLeft: '1px dashed #d1d5db', position: 'sticky', right: 0, zIndex: 10, boxShadow: '-2px 0 5px -2px rgba(0,0,0,0.1)' }}>
                  {chk.bloqueado ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#4b5563' }}>Já Pedido</span>
                      {!isEncerrada && (<button type="button" onClick={() => reatribuirItem(item.idItem)} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}><RefreshCcw size={10} /> Reatribuir</button>)}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: isEncerrada ? 'not-allowed' : 'pointer' }}>
                        <input type="checkbox" checked={chk.comprado} onChange={(e) => setChecklist({ ...checklist, [item.idItem]: { ...chk, comprado: e.target.checked, falta: false } })} disabled={isEncerrada || chk.falta} />
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: chk.comprado ? '#166534' : '#6b7280' }}>Comprar</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: isEncerrada ? 'not-allowed' : 'pointer' }}>
                        <input type="checkbox" checked={chk.falta} onChange={(e) => setChecklist({ ...checklist, [item.idItem]: { ...chk, falta: e.target.checked, comprado: false } })} disabled={isEncerrada || chk.comprado} />
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: chk.falta ? '#dc2626' : '#6b7280' }}>Ruptura / Falta</span>
                      </label>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}