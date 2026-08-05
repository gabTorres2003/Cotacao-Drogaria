import React from 'react';
import { Eye, Trash2, ArrowUpDown, ChevronUp, ChevronDown, Check, Copy, RefreshCcw, ShoppingCart } from 'lucide-react';
import BadgeOrigem from './BadgeOrigem';

export default function TabelaDetalhes({
  relatorioExibicao, colunasVisiveis, fornecedoresVisiveis, fornecedores, requestSort, sortConfig,
  editandoItem, formEdicao, setFormEdicao, salvarEdicao, isEncerrada, iniciarEdicao, 
  getNomeExibicao, isDiversos, mostrarNomeReal, copiarParaAreaTransferencia, copiadoId, 
  itensJaComprados, reatribuirItem, fData, fMoney, decisaoCompra, aceitesTroca, 
  handleSetWinner, toggleTroca, subAbaItens, navigate, deletarItem, isComparativo, isItens,
  onAbrirAddPedidoModal // NOVA PROP
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
            <th style={{ ...thStyle, cursor: 'pointer', userSelect: 'none', minWidth: '250px', position: 'sticky', left: 0, zIndex: 20, boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }} onClick={() => requestSort('nomeProduto')}><div style={{ display: 'flex', alignItems: 'center' }}>Produto <SortIcon sortKey="nomeProduto" /></div></th>
            {colunasVisiveis.quantidade && <th style={{ ...thStyle, cursor: 'pointer', userSelect: 'none', minWidth: '130px' }} onClick={() => requestSort('quantidade')}><div style={{ display: 'flex', alignItems: 'center' }}>Qtd. Solicitada <SortIcon sortKey="quantidade" /></div></th>}
            {colunasVisiveis.estoque && <th style={{ ...thStyle, cursor: 'pointer', userSelect: 'none', minWidth: '130px' }} onClick={() => requestSort('estoque')}><div style={{ display: 'flex', alignItems: 'center' }}>Estoque Atual <SortIcon sortKey="estoque" /></div></th>}
            {isItens && (
              <>
                {colunasVisiveis.vendidoNoMes && <th style={{ ...thStyle, cursor: 'pointer', userSelect: 'none', minWidth: '140px' }} onClick={() => requestSort('vendidoNoMes')}><div style={{ display: 'flex', alignItems: 'center' }}>Vendido no Mês <SortIcon sortKey="vendidoNoMes" /></div></th>}
                {colunasVisiveis.vendidoAposUltCompra && <th style={{ ...thStyle, cursor: 'pointer', userSelect: 'none', minWidth: '160px' }} onClick={() => requestSort('vendidoAposUltCompra')}><div style={{ display: 'flex', alignItems: 'center' }}>Vend. pós Últ. Compra <SortIcon sortKey="vendidoAposUltCompra" /></div></th>}
                {colunasVisiveis.ultCompraData && <th style={{...thStyle, minWidth: '130px'}}>Data Últ. Compra</th>}
                {colunasVisiveis.ultCompraQtde && <th style={{...thStyle, minWidth: '130px'}}>Qtd. Últ. Compra</th>}
                {colunasVisiveis.ultVendaData && <th style={{...thStyle, minWidth: '130px'}}>Data Últ. Venda</th>}
              </>
            )}
            {colunasVisiveis.ultimoPreco && <th style={{ ...thStyle, color: '#4f46e5', textAlign: 'right', cursor: 'pointer', userSelect: 'none', minWidth: '150px' }} onClick={() => requestSort('ultimoPreco')}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>Preço Últ. Compra <SortIcon sortKey="ultimoPreco" /></div></th>}
            {isComparativo && fornecedores.filter(f => fornecedoresVisiveis[f] ?? true).map((f) => <th key={f} style={{ ...thStyle, backgroundColor: '#f9fafb', textAlign: 'center', borderLeft: '1px solid #e5e7eb', minWidth: '180px' }}>{f}</th>)}
            {isItens && <th style={{ ...thStyle, textAlign: 'center', minWidth: '100px', position: 'sticky', right: 0, zIndex: 20, boxShadow: '-2px 0 5px -2px rgba(0,0,0,0.1)' }}>Ações</th>}
          </tr>
        </thead>
        <tbody>
          {relatorioExibicao.map((item) => {
            const isBloqueado = !!itensJaComprados[item.idItem];
            const textStyle = isBloqueado ? { textDecoration: 'line-through', color: '#9ca3af' } : {};

            return (
              <tr key={item.idItem} style={{ backgroundColor: '#ffffff', opacity: item.excluido ? 0.5 : 1 }}>
                <td style={{ ...tdStyle, position: 'sticky', left: 0, zIndex: 10, backgroundColor: 'inherit', boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }}>
                  {editandoItem === `${item.idItem}-nome` ? (
                    <input style={{ ...inputEdicao, width: '100%', minWidth: '200px' }} value={formEdicao.nome} onChange={(e) => setFormEdicao({ ...formEdicao, nome: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') salvarEdicao(item.idItem); if (e.key === 'Escape') iniciarEdicao(null); }} onBlur={() => salvarEdicao(item.idItem)} autoFocus />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ ...textStyle, cursor: (!isBloqueado && !isEncerrada && !item.excluido) ? 'pointer' : 'default', borderBottom: (!isBloqueado && !isEncerrada && !item.excluido) ? '1px dashed #9ca3af' : 'none' }} onClick={() => !item.excluido && iniciarEdicao(item, 'nome')} title={(!isBloqueado && !isEncerrada && !item.excluido) ? "Clique para editar" : ""}>
                          {getNomeExibicao(item.nomeProduto)}
                        </strong>
                        {isDiversos(item.nomeProduto) && !mostrarNomeReal && (<span style={{ fontSize: '10px', backgroundColor: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: '4px', border: '1px solid #fde047', fontWeight: 'bold' }}>Genérico</span>)}
                        
                        {item.excluido && (
                          <span style={{ fontSize: '10px', backgroundColor: '#fee2e2', color: '#991b1b', padding: '2px 6px', borderRadius: '4px', border: '1px solid #fecaca', fontWeight: 'bold', marginLeft: '6px' }}>
                            🗑️ Excluído (Ignorado)
                          </span>
                        )}
                        {item.editadoManual && !item.excluido && (
                          <span style={{ fontSize: '10px', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', border: '1px solid #bae6fd', fontWeight: 'bold', marginLeft: '6px' }}>
                            ✏️ Editado
                          </span>
                        )}
                        <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); copiarParaAreaTransferencia(getNomeExibicao(item.nomeProduto), item.idItem); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: copiadoId === item.idItem ? '#10b981' : '#9ca3af' }}>
                          {copiadoId === item.idItem ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <BadgeOrigem origem={item.origemItem} />
                        {isBloqueado && (
                          <>
                            <span style={{ fontSize: '10px', backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #86efac', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>✓ Pedido Gerado</span>
                            {!isEncerrada && (<button type="button" onClick={() => reatribuirItem(item.idItem)} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}><RefreshCcw size={10} /> Reatribuir</button>)}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </td>
                
                {colunasVisiveis.quantidade && (
                  <td style={tdStyle}>
                    {editandoItem === `${item.idItem}-qtd` ? (
                      <input type="number" style={{ ...inputEdicao, width: '70px', textAlign: 'center' }} value={formEdicao.qtd} onChange={(e) => setFormEdicao({ ...formEdicao, qtd: Number(e.target.value) })} onKeyDown={(e) => { if (e.key === 'Enter') salvarEdicao(item.idItem); if (e.key === 'Escape') iniciarEdicao(null); }} onBlur={() => salvarEdicao(item.idItem)} onFocus={(e) => e.target.select()} autoFocus />
                    ) : (
                      <span style={{ ...textStyle, cursor: (!isBloqueado && !isEncerrada && !item.excluido) ? 'pointer' : 'default', borderBottom: (!isBloqueado && !isEncerrada && !item.excluido) ? '1px dashed #9ca3af' : 'none', display: 'inline-block', padding: '4px' }} onClick={() => !item.excluido && iniciarEdicao(item, 'qtd')} title={(!isBloqueado && !isEncerrada && !item.excluido) ? "Clique para editar" : ""}>{item.quantidade} un</span>
                    )}
                  </td>
                )}
                
                {colunasVisiveis.estoque && <td style={tdStyle}><span style={textStyle}>{item.estoque ?? '-'}</span></td>}

                {isItens && (
                  <>
                    {colunasVisiveis.vendidoNoMes && <td style={tdStyle}><span style={textStyle}>{item.vendidoNoMes ?? '-'}</span></td>}
                    {colunasVisiveis.vendidoAposUltCompra && <td style={tdStyle}><span style={textStyle}>{item.vendidoAposUltCompra ?? '-'}</span></td>}
                    {colunasVisiveis.ultCompraData && <td style={tdStyle}><span style={textStyle}>{fData(item.ultCompraData)}</span></td>}
                    {colunasVisiveis.ultCompraQtde && <td style={tdStyle}><span style={textStyle}>{item.ultCompraQtde ?? '-'}</span></td>}
                    {colunasVisiveis.ultVendaData && <td style={tdStyle}><span style={textStyle}>{fData(item.ultVendaData)}</span></td>}
                  </>
                )}

                {colunasVisiveis.ultimoPreco && <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '500' }}><span style={textStyle}>{item.ultimoPreco != null ? fMoney(item.ultimoPreco) : '-'}</span></td>}

                {isComparativo && fornecedores.filter(f => fornecedoresVisiveis[f] ?? true).map((f) => {
                  const precoOriginal = item.precosPorFornecedor?.[f] || 0;
                  const precoSubstituto = item.precosSubstitutosPorFornecedor?.[f] || precoOriginal;
                  const qtdSubstituto = item.qtdsSubstitutosPorFornecedor?.[f] || item.quantidade;
                  const obs = item.observacoesPorFornecedor?.[f];
                  const substituto = item.substitutosPorFornecedor?.[f];
                  const isWinner = decisaoCompra[item.idItem] === f;
                  const isTrocaAceita = aceitesTroca[item.idItem];
                  const isEmFaltaOriginal = precoOriginal <= 0; 

                  return (
                    <td key={f} onClick={() => !isBloqueado && !item.excluido && handleSetWinner(item.idItem, f)} style={{ ...tdStyle, backgroundColor: isWinner ? '#ecfdf5' : 'inherit', textAlign: 'center', borderLeft: '1px solid #f3f4f6', border: isWinner ? '2px solid #10b981' : '1px solid #e5e7eb', cursor: isBloqueado || isEncerrada || item.excluido ? 'not-allowed' : 'pointer', verticalAlign: 'top', position: 'relative', opacity: isBloqueado ? 0.6 : 1 }}>
                      {isWinner && <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', backgroundColor: '#10b981', color: 'white', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>VENCEDOR</div>}
                      <div style={{ marginTop: '8px', fontWeight: isWinner ? 'bold' : 'normal', color: isEmFaltaOriginal ? '#dc2626' : '#374151', textDecoration: isBloqueado ? 'line-through' : 'none' }}>{isEmFaltaOriginal ? 'Em falta' : fMoney(precoOriginal)}</div>
                      {substituto && (
                        <div onClick={(e) => { e.stopPropagation(); if(!isBloqueado && !item.excluido) toggleTroca(item.idItem, f); }} style={{ marginTop: '8px', backgroundColor: (isTrocaAceita && isWinner) ? '#dcfce7' : '#fef3c7', padding: '6px', borderRadius: '6px', border: `1px solid ${(isTrocaAceita && isWinner) ? '#4ade80' : '#fde047'}`, textAlign: 'left' }}>
                          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', cursor: isBloqueado || isEncerrada || item.excluido ? 'not-allowed' : 'pointer', fontSize: '11px', color: '#111827' }}>
                            <input type="checkbox" checked={isTrocaAceita && isWinner} onChange={() => !isBloqueado && !item.excluido && toggleTroca(item.idItem, f)} style={{ marginTop: '2px' }} disabled={isBloqueado || isEncerrada || item.excluido} />
                            <div style={{ textDecoration: isBloqueado ? 'line-through' : 'none' }}>
                              <strong style={{ color: '#b45309' }}>Troca: {getNomeExibicao(substituto)}</strong><br/>
                              <span style={{ color: '#059669', fontWeight: 'bold' }}>{fMoney(precoSubstituto)}</span> (Qtd: {qtdSubstituto})
                            </div>
                          </label>
                        </div>
                      )}
                      {obs && <div style={{ fontSize: '11px', color: '#475569', marginTop: '8px', fontStyle: 'italic', lineHeight: '1.2' }}>Obs: {obs}</div>}
                    </td>
                  );
                })}

                {isItens && (
                  <td style={{ ...tdStyle, textAlign: 'center', position: 'sticky', right: 0, zIndex: 10, backgroundColor: 'inherit', boxShadow: '-2px 0 5px -2px rgba(0,0,0,0.1)' }}>
                    {subAbaItens === 'comprados' ? (
                      <button onClick={() => navigate(`/pedidos/${itensJaComprados[item.idItem].id}`)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', backgroundColor: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}><Eye size={14}/> Pedido #{itensJaComprados[item.idItem].id}</button>
                    ) : (
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                        {/* NOVO BOTÃO DE ADICIONAR A PEDIDO ABERTO */}
                        <button type="button" onClick={() => !item.excluido && onAbrirAddPedidoModal(item)} style={{ background: 'none', border: 'none', cursor: isBloqueado || isEncerrada || item.excluido ? 'not-allowed' : 'pointer', padding: '4px', color: '#10b981' }} disabled={isBloqueado || isEncerrada || item.excluido} title="Adicionar a um Pedido em Aberto">
                          <ShoppingCart size={18} opacity={isBloqueado || isEncerrada || item.excluido ? 0.3 : 1}/>
                        </button>
                        <button type="button" onClick={() => !item.excluido && deletarItem(item.idItem)} style={{ background: 'none', border: 'none', cursor: isBloqueado || isEncerrada || item.excluido ? 'not-allowed' : 'pointer', padding: '4px', color: '#ef4444' }} disabled={isBloqueado || isEncerrada || item.excluido} title="Remover Produto">
                          <Trash2 size={18} opacity={isBloqueado || isEncerrada || item.excluido ? 0.3 : 1}/>
                        </button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}