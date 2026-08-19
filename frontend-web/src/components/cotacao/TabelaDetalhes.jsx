import React, { useState, useEffect } from 'react';
import { Eye, Trash2, ArrowUpDown, ChevronUp, ChevronDown, Check, Copy, RefreshCcw, ShoppingCart, Filter, AlertTriangle, Tags, Pin, GripHorizontal } from 'lucide-react';
import BadgeOrigem from './BadgeOrigem';

export default function TabelaDetalhes({
  relatorioExibicao, colunasVisiveis, fornecedoresVisiveis, fornecedores, requestSort, sortConfig,
  editandoItem, formEdicao, setFormEdicao, salvarEdicao, isEncerrada, iniciarEdicao, 
  getNomeExibicao, isDiversos, mostrarNomeReal, copiarParaAreaTransferencia, copiadoId, 
  itensJaComprados, reatribuirItem, fData, fMoney, decisaoCompra, aceitesTroca, 
  handleSetWinner, toggleTroca, subAbaItens, navigate, deletarItem, isComparativo, isItens,
  onAbrirAddPedidoModal, filtroVencedor, setFiltroVencedor, filtroTopN
}) {
  const [mostrarAlertasPreco, setMostrarAlertasPreco] = useState(true);

  // ESTADOS DE ARRASTAR, SOLTAR E CONGELAR
  const [pinnedSuppliers, setPinnedSuppliers] = useState([]);
  const [supplierOrder, setSupplierOrder] = useState([]);
  const [draggedSupplier, setDraggedSupplier] = useState(null);
  const [pinnedStats, setPinnedStats] = useState([]);

  // NOVO: Estado para armazenar os preços marcados manualmente como irreais
  const [valoresIrreais, setValoresIrreais] = useState({});

  useEffect(() => {
      setSupplierOrder(prev => {
          const newOrder = [...prev];
          fornecedores.forEach(f => {
              if (!newOrder.includes(f)) newOrder.push(f);
          });
          return newOrder.filter(f => fornecedores.includes(f));
      });
  }, [fornecedores]);

  const togglePin = (f) => setPinnedSuppliers(prev => prev.includes(f) ? prev.filter(s => s !== f) : [...prev, f]);
  const togglePinStat = (stat) => setPinnedStats(prev => prev.includes(stat) ? prev.filter(s => s !== stat) : [...prev, stat]);

  const getLeftOffset = (colKey, type = 'stat') => {
      let offset = 250; 
      const statsOrder = ['quantidade', 'estoque', 'vendidoNoMes', 'vendidoAposUltCompra', 'ultCompraData', 'ultCompraQtde', 'ultVendaData', 'ultimoPreco'];
      const widths = { quantidade: 130, estoque: 130, vendidoNoMes: 140, vendidoAposUltCompra: 160, ultCompraData: 130, ultCompraQtde: 130, ultVendaData: 130, ultimoPreco: 150 };
      
      for (let stat of statsOrder) {
          if (stat === colKey && type === 'stat') break;
          if (pinnedStats.includes(stat) && colunasVisiveis[stat]) {
              offset += widths[stat];
          }
      }
      if (type === 'supplier') {
          const idx = pinnedSuppliers.indexOf(colKey);
          if (idx > -1) offset += (idx * 180); 
      }
      return offset;
  };

  const thStyle = { textAlign: 'left', padding: '12px', borderBottom: '2px solid #e5e7eb', color: '#4b5563', fontSize: '13px', whiteSpace: 'nowrap', position: 'sticky', top: 0, backgroundColor: '#ffffff', zIndex: 10 };
  const tdStyle = { padding: '12px', borderBottom: '1px solid #e5e7eb', color: '#374151', fontSize: '13px', wordBreak: 'break-word', whiteSpace: 'normal' };
  const inputEdicao = { padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' };

  const SortIcon = ({ sortKey }) => {
    if (sortConfig.key !== sortKey) return <ArrowUpDown size={14} color="#9ca3af" style={{ marginLeft: '6px' }} />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} color="#2563eb" style={{ marginLeft: '6px' }} /> : <ChevronDown size={14} color="#2563eb" style={{ marginLeft: '6px' }} />;
  };

  const getHeaderStyle = (isPinned, leftPos, minWidth, isRight = false) => ({
      ...thStyle, minWidth, textAlign: isRight ? 'right' : 'left',
      left: isPinned ? `${leftPos}px` : 'auto', zIndex: isPinned ? 30 : 10,
      backgroundColor: isPinned ? '#f0fdf4' : '#ffffff',
      boxShadow: isPinned ? '2px 0 5px -2px rgba(0,0,0,0.1)' : 'none'
  });

  const getCellColStyle = (isPinned, leftPos, isRight = false, isBold = false, color = '#374151') => ({
      ...tdStyle, textAlign: isRight ? 'right' : 'center', fontWeight: isBold ? '500' : 'normal', color: color,
      position: isPinned ? 'sticky' : 'static', left: isPinned ? `${leftPos}px` : 'auto', zIndex: isPinned ? 15 : 1,
      backgroundColor: isPinned ? '#f8fafc' : 'inherit',
      boxShadow: isPinned ? '2px 0 5px -2px rgba(0,0,0,0.1)' : 'none'
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {isComparativo && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', color: '#475569', fontWeight: 'bold', backgroundColor: '#f8fafc', padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', userSelect: 'none' }}>
                  <input type="checkbox" checked={mostrarAlertasPreco} onChange={(e) => setMostrarAlertasPreco(e.target.checked)} style={{ cursor: 'pointer', transform: 'scale(1.1)' }} />
                  <AlertTriangle size={14} color={mostrarAlertasPreco ? '#d97706' : '#9ca3af'} />
                  Destacar Preços Discrepantes (+100% ou -50%)
              </label>
          </div>
      )}

      <div style={{ maxHeight: '75vh', overflowY: 'auto', overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 0 }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, cursor: 'pointer', userSelect: 'none', minWidth: '250px', position: 'sticky', left: 0, zIndex: 40, boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }} onClick={() => requestSort('nomeProduto')}><div style={{ display: 'flex', alignItems: 'center' }}>Produto <SortIcon sortKey="nomeProduto" /></div></th>
              
              {colunasVisiveis.quantidade && (() => {
                  const isPinned = pinnedStats.includes('quantidade');
                  return (
                      <th style={getHeaderStyle(isPinned, getLeftOffset('quantidade', 'stat'), '130px')}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }} onClick={() => requestSort('quantidade')}>Qtd. Solicitada <SortIcon sortKey="quantidade" /></div>
                              <button title={isPinned ? "Descongelar" : "Congelar Coluna"} onClick={() => togglePinStat('quantidade')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, borderRadius: '4px', backgroundColor: isPinned ? '#bbf7d0' : 'transparent' }}><Pin size={12} color={isPinned ? '#166534' : '#9ca3af'} /></button>
                          </div>
                      </th>
                  );
              })()}

              {colunasVisiveis.estoque && (() => {
                  const isPinned = pinnedStats.includes('estoque');
                  return (
                      <th style={getHeaderStyle(isPinned, getLeftOffset('estoque', 'stat'), '130px')}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }} onClick={() => requestSort('estoque')}>Estoque Atual <SortIcon sortKey="estoque" /></div>
                              <button title={isPinned ? "Descongelar" : "Congelar Coluna"} onClick={() => togglePinStat('estoque')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, borderRadius: '4px', backgroundColor: isPinned ? '#bbf7d0' : 'transparent' }}><Pin size={12} color={isPinned ? '#166534' : '#9ca3af'} /></button>
                          </div>
                      </th>
                  );
              })()}

              {isItens && (
                <>
                  {colunasVisiveis.vendidoNoMes && <th style={{ ...thStyle, cursor: 'pointer', userSelect: 'none', minWidth: '140px' }} onClick={() => requestSort('vendidoNoMes')}><div style={{ display: 'flex', alignItems: 'center' }}>Vendido no Mês <SortIcon sortKey="vendidoNoMes" /></div></th>}
                  {colunasVisiveis.vendidoAposUltCompra && <th style={{ ...thStyle, cursor: 'pointer', userSelect: 'none', minWidth: '160px' }} onClick={() => requestSort('vendidoAposUltCompra')}><div style={{ display: 'flex', alignItems: 'center' }}>Vend. pós Últ. Compra <SortIcon sortKey="vendidoAposUltCompra" /></div></th>}
                  {colunasVisiveis.ultCompraData && <th style={{...thStyle, minWidth: '130px'}}>Data Últ. Compra</th>}
                  {colunasVisiveis.ultCompraQtde && <th style={{...thStyle, minWidth: '130px'}}>Qtd. Últ. Compra</th>}
                  {colunasVisiveis.ultVendaData && <th style={{...thStyle, minWidth: '130px'}}>Data Últ. Venda</th>}
                </>
              )}

              {colunasVisiveis.ultimoPreco && (() => {
                  const isPinned = pinnedStats.includes('ultimoPreco');
                  return (
                      <th style={getHeaderStyle(isPinned, getLeftOffset('ultimoPreco', 'stat'), '150px', true)}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <button title={isPinned ? "Descongelar" : "Congelar Coluna"} onClick={() => togglePinStat('ultimoPreco')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, borderRadius: '4px', backgroundColor: isPinned ? '#bbf7d0' : 'transparent', marginRight: '6px' }}><Pin size={12} color={isPinned ? '#166534' : '#9ca3af'} /></button>
                              <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none', color: '#4f46e5' }} onClick={() => requestSort('ultimoPreco')}>Preço Últ. Compra <SortIcon sortKey="ultimoPreco" /></div>
                          </div>
                      </th>
                  );
              })()}
              
              {isComparativo && supplierOrder.filter(f => fornecedoresVisiveis[f] ?? true).map((f) => {
                  const isPinned = pinnedSuppliers.includes(f);
                  const leftPos = getLeftOffset(f, 'supplier');

                  return (
                      <th 
                        key={f} 
                        draggable
                        onDragStart={(e) => {
                            setDraggedSupplier(f);
                            e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            if (draggedSupplier && draggedSupplier !== f) {
                                const newOrder = [...supplierOrder];
                                const draggedIdx = newOrder.indexOf(draggedSupplier);
                                const targetIdx = newOrder.indexOf(f);
                                newOrder.splice(draggedIdx, 1);
                                newOrder.splice(targetIdx, 0, draggedSupplier);
                                setSupplierOrder(newOrder);
                            }
                            setDraggedSupplier(null);
                        }}
                        onDragEnd={() => setDraggedSupplier(null)}
                        style={{ 
                          ...thStyle, 
                          backgroundColor: isPinned ? '#f0fdf4' : '#f9fafb', 
                          textAlign: 'center', 
                          borderLeft: '1px solid #e5e7eb', 
                          minWidth: '180px',
                          position: isPinned ? 'sticky' : 'static',
                          left: isPinned ? `${leftPos}px` : 'auto',
                          zIndex: isPinned ? 30 : 10,
                          boxShadow: isPinned ? '2px 0 5px -2px rgba(0,0,0,0.1)' : 'none',
                          opacity: draggedSupplier === f ? 0.5 : 1,
                          cursor: 'grab'
                      }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <GripHorizontal size={14} color="#9ca3af" />
                                      <span style={{ fontWeight: 'bold', color: isPinned ? '#166534' : '#374151' }}>{f}</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <button title={isPinned ? "Descongelar Coluna" : "Congelar Coluna (Fixar na tela)"} onClick={() => togglePin(f)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, borderRadius: '4px', backgroundColor: isPinned ? '#bbf7d0' : '#e2e8f0', display: 'flex', alignItems: 'center' }}>
                                          <Pin size={14} color={isPinned ? '#166534' : '#64748b'} />
                                      </button>
                                      <button title={`Filtrar apenas itens ganhos por ${f}`} onClick={() => setFiltroVencedor(filtroVencedor === f ? 'TODOS' : f)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, borderRadius: '4px', backgroundColor: filtroVencedor === f ? '#dbeafe' : 'transparent', display: 'flex', alignItems: 'center' }}>
                                          <Filter size={14} color={filtroVencedor === f ? '#2563eb' : '#9ca3af'} />
                                      </button>
                                  </div>
                              </div>
                          </div>
                      </th>
                  );
              })}
              
              {isItens && <th style={{ ...thStyle, textAlign: 'center', minWidth: '100px', position: 'sticky', right: 0, zIndex: 20, boxShadow: '-2px 0 5px -2px rgba(0,0,0,0.1)' }}>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {relatorioExibicao.map((item) => {
              const isBloqueado = !!itensJaComprados[item.idItem];
              const textStyle = isBloqueado ? { textDecoration: 'line-through', color: '#9ca3af' } : {};

              const precoBaseAlerta = item.ultimoPreco || item.ultimoPrecoComprado;

              const ofertasValidas = supplierOrder.map(forn => {
                  let pO = item.precosPorFornecedor?.[forn] || 0;
                  let pS = item.precosSubstitutosPorFornecedor?.[forn] || 0;
                  let val = Infinity;
                  if (pO > 0) val = pO;
                  if (pS > 0 && pS < val) val = pS; 
                  if (pO <= 0 && pS > 0) val = pS;
                  
                  const isIrreal = valoresIrreais[`${item.idItem}-${forn}`];
                  let isDiscrepante = false;

                  if (precoBaseAlerta > 0 && pO > 0) {
                      if (pO > precoBaseAlerta * 2.0 || pO < precoBaseAlerta * 0.5) {
                          isDiscrepante = true;
                      }
                  }
                  
                  if (val !== Infinity) {
                      if (isIrreal) {
                          val = Infinity; // Sempre excluído se foi marcado como irreal
                      } else if (mostrarAlertasPreco && isDiscrepante) {
                          val = Infinity; // Excluído temporariamente se o alerta estiver ligado
                      }
                  }
                  
                  return { forn, val };
              }).filter(x => x.val !== Infinity).sort((a, b) => a.val - b.val);

              const rankMap = {};
              ofertasValidas.forEach((vo, index) => { rankMap[vo.forn] = index + 1; });

              return (
                <tr key={item.idItem} style={{ backgroundColor: '#ffffff', opacity: item.excluido ? 0.5 : 1 }}>
                  <td style={{ ...tdStyle, position: 'sticky', left: 0, zIndex: 20, backgroundColor: 'inherit', boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }}>
                    {editandoItem === `${item.idItem}-nome` ? (
                      <input style={{ ...inputEdicao, width: '100%', minWidth: '200px' }} value={formEdicao.nome} onChange={(e) => setFormEdicao({ ...formEdicao, nome: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') salvarEdicao(item.idItem); if (e.key === 'Escape') iniciarEdicao(null); }} onBlur={() => salvarEdicao(item.idItem)} autoFocus />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <strong style={{ ...textStyle, cursor: (!isBloqueado && !isEncerrada && !item.excluido) ? 'pointer' : 'default', borderBottom: (!isBloqueado && !isEncerrada && !item.excluido) ? '1px dashed #9ca3af' : 'none' }} onClick={() => !item.excluido && iniciarEdicao(item, 'nome')} title={(!isBloqueado && !isEncerrada && !item.excluido) ? "Clique para editar" : ""}>
                            {getNomeExibicao(item.nomeProduto)}
                          </strong>
                          {isDiversos(item.nomeProduto) && !mostrarNomeReal && (<span style={{ fontSize: '10px', backgroundColor: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: '4px', border: '1px solid #fde047', fontWeight: 'bold' }}>Genérico</span>)}
                          {item.excluido && <span style={{ fontSize: '10px', backgroundColor: '#fee2e2', color: '#991b1b', padding: '2px 6px', borderRadius: '4px', border: '1px solid #fecaca', fontWeight: 'bold', marginLeft: '6px' }}>🗑️ Excluído</span>}
                          {item.editadoManual && !item.excluido && <span style={{ fontSize: '10px', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', border: '1px solid #bae6fd', fontWeight: 'bold', marginLeft: '6px' }}>✏️ Editado</span>}
                          {item.motivoRetorno && !isBloqueado && <span style={{ fontSize: '10px', backgroundColor: '#fee2e2', color: '#991b1b', padding: '2px 6px', borderRadius: '4px', border: '1px solid #fca5a5', fontWeight: 'bold', marginLeft: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><AlertTriangle size={10} /> Retornado: {item.motivoRetorno}</span>}
                          <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); copiarParaAreaTransferencia(getNomeExibicao(item.nomeProduto), item.idItem); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: copiadoId === item.idItem ? '#10b981' : '#9ca3af' }}>{copiadoId === item.idItem ? <Check size={14} /> : <Copy size={14} />}</button>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                          <BadgeOrigem origem={item.origemItem} />
                          {isBloqueado && (
                            <>
                              <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/pedidos/${itensJaComprados[item.idItem].id}`); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #86efac', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>✓ Ver Pedido #{itensJaComprados[item.idItem].id}</button>
                              {!isEncerrada && (<button type="button" onClick={() => reatribuirItem(item.idItem)} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}><RefreshCcw size={10} /> Reatribuir</button>)}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </td>
                  
                  {colunasVisiveis.quantidade && (() => {
                      const isPinned = pinnedStats.includes('quantidade');
                      return (
                        <td style={getCellColStyle(isPinned, getLeftOffset('quantidade', 'stat'), false, false, textStyle.color)}>
                          {editandoItem === `${item.idItem}-qtd` ? (
                            <input type="number" style={{ ...inputEdicao, width: '70px', textAlign: 'center' }} value={formEdicao.qtd} onChange={(e) => setFormEdicao({ ...formEdicao, qtd: Number(e.target.value) })} onKeyDown={(e) => { if (e.key === 'Enter') salvarEdicao(item.idItem); if (e.key === 'Escape') iniciarEdicao(null); }} onBlur={() => salvarEdicao(item.idItem)} onFocus={(e) => e.target.select()} autoFocus />
                          ) : (
                            <span style={{ ...textStyle, cursor: (!isBloqueado && !isEncerrada && !item.excluido) ? 'pointer' : 'default', borderBottom: (!isBloqueado && !isEncerrada && !item.excluido) ? '1px dashed #9ca3af' : 'none', display: 'inline-block', padding: '4px' }} onClick={() => !item.excluido && iniciarEdicao(item, 'qtd')} title={(!isBloqueado && !isEncerrada && !item.excluido) ? "Clique para editar" : ""}>{item.quantidade} un</span>
                          )}
                        </td>
                      );
                  })()}
                  
                  {colunasVisiveis.estoque && (() => {
                      const isPinned = pinnedStats.includes('estoque');
                      return <td style={getCellColStyle(isPinned, getLeftOffset('estoque', 'stat'), false, false, textStyle.color)}><span style={textStyle}>{item.estoque ?? '-'}</span></td>;
                  })()}

                  {isItens && (
                    <>
                      {colunasVisiveis.vendidoNoMes && <td style={tdStyle}><span style={textStyle}>{item.vendidoNoMes ?? '-'}</span></td>}
                      {colunasVisiveis.vendidoAposUltCompra && <td style={tdStyle}><span style={textStyle}>{item.vendidoAposUltCompra ?? '-'}</span></td>}
                      {colunasVisiveis.ultCompraData && <td style={tdStyle}><span style={textStyle}>{fData(item.ultCompraData)}</span></td>}
                      {colunasVisiveis.ultCompraQtde && <td style={tdStyle}><span style={textStyle}>{item.ultCompraQtde ?? '-'}</span></td>}
                      {colunasVisiveis.ultVendaData && <td style={tdStyle}><span style={textStyle}>{fData(item.ultVendaData)}</span></td>}
                    </>
                  )}

                  {colunasVisiveis.ultimoPreco && (() => {
                      const isPinned = pinnedStats.includes('ultimoPreco');
                      return <td style={getCellColStyle(isPinned, getLeftOffset('ultimoPreco', 'stat'), true, true, '#4f46e5')}><span style={textStyle}>{item.ultimoPreco != null ? fMoney(item.ultimoPreco) : '-'}</span></td>;
                  })()}

                  {isComparativo && supplierOrder.filter(f => fornecedoresVisiveis[f] ?? true).map((f) => {
                    
                    const rank = rankMap[f];
                    const isTopN = filtroTopN === 'TODOS' || (filtroTopN === 'TOP_2' && rank <= 2) || (filtroTopN === 'TOP_3' && rank <= 3);

                    if (!isTopN) {
                        return <td key={f} style={{ ...tdStyle, backgroundColor: '#f8fafc', borderLeft: '1px solid #f3f4f6', textAlign: 'center', color: '#cbd5e1' }}>-</td>;
                    }

                    const precoOriginal = item.precosPorFornecedor?.[f] || 0;
                    const precoSubstituto = item.precosSubstitutosPorFornecedor?.[f] || precoOriginal;
                    const qtdSubstituto = item.qtdsSubstitutosPorFornecedor?.[f] || item.quantidade;
                    const obs = item.observacoesPorFornecedor?.[f];
                    const substituto = item.substitutosPorFornecedor?.[f];
                    const isWinner = decisaoCompra[item.idItem] === f;
                    const isTrocaAceita = aceitesTroca[item.idItem];
                    const isEmFaltaOriginal = precoOriginal <= 0; 
                    const temOfertaValida = !isEmFaltaOriginal || (substituto && precoSubstituto > 0);
                    
                    const isIrreal = valoresIrreais[`${item.idItem}-${f}`];
                    let isPrecoDiscrepante = false;

                    if (precoBaseAlerta > 0 && precoOriginal > 0) {
                        if (precoOriginal > precoBaseAlerta * 2.0 || precoOriginal < precoBaseAlerta * 0.5) {
                            isPrecoDiscrepante = true;
                        }
                    }

                    let condsArr = [];
                    const jsonStr = item.condicoesEscalonamentoPorFornecedor?.[f];
                    try { if (jsonStr) condsArr = JSON.parse(jsonStr); } catch(e){}
                    if (condsArr.length === 0 && item.qtdCondicaoPorFornecedor?.[f]) {
                        condsArr.push({ qtd: item.qtdCondicaoPorFornecedor[f], preco: item.precoCondicaoPorFornecedor[f] });
                    }
                    
                    let condsArrSubst = [];
                    const jsonStrSubst = item.condicoesEscalonamentoSubstPorFornecedor?.[f];
                    try { if (jsonStrSubst) condsArrSubst = JSON.parse(jsonStrSubst); } catch(e){}
                    if (condsArrSubst.length === 0 && item.qtdCondicaoSubstPorFornecedor?.[f]) {
                        condsArrSubst.push({ qtd: item.qtdCondicaoSubstPorFornecedor[f], preco: item.precoCondicaoSubstPorFornecedor[f] });
                    }

                    const isPinned = pinnedSuppliers.includes(f);
                    const leftPos = getLeftOffset(f, 'supplier');

                    return (
                      <td key={f} onClick={() => !isBloqueado && !item.excluido && !isIrreal && handleSetWinner(item.idItem, f)} 
                          style={{ 
                              ...tdStyle, 
                              backgroundColor: isWinner ? '#ecfdf5' : (isPinned ? '#f8fafc' : 'inherit'), 
                              textAlign: 'center', 
                              borderLeft: '1px solid #f3f4f6', 
                              border: isWinner ? '2px solid #10b981' : '1px solid #e5e7eb', 
                              cursor: isBloqueado || isEncerrada || item.excluido || isIrreal ? 'not-allowed' : 'pointer', 
                              verticalAlign: 'top', 
                              position: isPinned ? 'sticky' : 'relative', 
                              left: isPinned ? `${leftPos}px` : 'auto',
                              zIndex: isPinned ? 15 : 1,
                              boxShadow: isPinned ? '2px 0 5px -2px rgba(0,0,0,0.1)' : 'none',
                              opacity: isBloqueado ? 0.6 : (isIrreal ? 0.5 : (draggedSupplier === f ? 0.5 : 1))
                          }}>
                        
                        {isWinner && !isIrreal && <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', backgroundColor: '#10b981', color: 'white', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold', zIndex: 5 }}>VENCEDOR</div>}
                        
                        {rank > 0 && !isWinner && !isIrreal && <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', backgroundColor: rank === 1 ? '#4ade80' : '#fde047', color: rank === 1 ? '#064e3b' : '#713f12', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold', zIndex: 5, border: `1px solid ${rank === 1 ? '#22c55e' : '#facc15'}` }}>{rank}º LUGAR</div>}

                        <div style={{ marginTop: '8px', fontWeight: isWinner ? 'bold' : 'normal', color: isEmFaltaOriginal ? '#dc2626' : (isIrreal ? '#9ca3af' : (isPrecoDiscrepante && mostrarAlertasPreco ? '#b91c1c' : '#374151')), textDecoration: isBloqueado || isIrreal ? 'line-through' : 'none' }}>
                            {isEmFaltaOriginal ? 'Em falta' : fMoney(precoOriginal)}
                        </div>
                        
                        {isPrecoDiscrepante && !isEmFaltaOriginal && !isIrreal && mostrarAlertasPreco && (
                           <div style={{ fontSize: '10px', color: '#991b1b', backgroundColor: '#fee2e2', padding: '6px', borderRadius: '6px', marginTop: '6px', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', border: '1px solid #fca5a5' }} title="Preço muito divergente do padrão.">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <AlertTriangle size={14} /> Divergência Alta
                              </div>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setValoresIrreais(prev => ({...prev, [`${item.idItem}-${f}`]: true})); }}
                                style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 6px', fontSize: '10px', cursor: 'pointer', width: '100%', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                              >
                                Confirmar Valor Irreal
                              </button>
                           </div>
                        )}

                        {isIrreal && (
                           <div style={{ fontSize: '11px', color: '#4b5563', backgroundColor: '#f3f4f6', padding: '6px', borderRadius: '6px', marginTop: '6px', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', border: '1px solid #d1d5db' }}>
                              ❌ Valor Irreal
                              <button 
                                onClick={(e) => { e.stopPropagation(); setValoresIrreais(prev => { const n = {...prev}; delete n[`${item.idItem}-${f}`]; return n; }) }}
                                style={{ background: 'none', color: '#3b82f6', border: 'none', textDecoration: 'underline', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold' }}
                              >
                                Desfazer
                              </button>
                           </div>
                        )}
                        
                        {!isEmFaltaOriginal && condsArr.length > 0 && !isIrreal && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                                {condsArr.map((cond, idx) => (
                                    <div key={idx} style={{ fontSize: '11px', color: '#166534', backgroundColor: '#dcfce7', padding: '4px 6px', borderRadius: '4px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px', border: '1px solid #bbf7d0', justifyContent: 'center' }}>
                                        <Tags size={12} /> A partir de {cond.qtd} un: {fMoney(cond.preco)}
                                    </div>
                                ))}
                            </div>
                        )}

                        {substituto && !isIrreal && (
                          <div onClick={(e) => { e.stopPropagation(); if(!isBloqueado && !item.excluido) toggleTroca(item.idItem, f); }} style={{ marginTop: '8px', backgroundColor: (isTrocaAceita && isWinner) ? '#dcfce7' : '#fef3c7', padding: '6px', borderRadius: '6px', border: `1px solid ${(isTrocaAceita && isWinner) ? '#4ade80' : '#fde047'}`, textAlign: 'left' }}>
                            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', cursor: isBloqueado || isEncerrada || item.excluido ? 'not-allowed' : 'pointer', fontSize: '11px', color: '#111827' }}>
                              <input type="checkbox" checked={isTrocaAceita && isWinner} onChange={() => !isBloqueado && !item.excluido && toggleTroca(item.idItem, f)} style={{ marginTop: '2px' }} disabled={isBloqueado || isEncerrada || item.excluido} />
                              <div style={{ textDecoration: isBloqueado ? 'line-through' : 'none', width: '100%' }}>
                                <strong style={{ color: '#b45309' }}>Troca: {getNomeExibicao(substituto)}</strong><br/>
                                <span style={{ color: '#059669', fontWeight: 'bold' }}>{fMoney(precoSubstituto)}</span> (Qtd: {qtdSubstituto})
                                
                                {condsArrSubst.length > 0 && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                                      {condsArrSubst.map((cond, idx) => (
                                          <div key={idx} style={{ fontSize: '10px', color: '#166534', backgroundColor: '#dcfce7', padding: '2px 4px', borderRadius: '4px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #bbf7d0' }}>
                                              <Tags size={10} /> A partir de {cond.qtd} un: {fMoney(cond.preco)}
                                          </div>
                                      ))}
                                  </div>
                                )}
                              </div>
                            </label>
                          </div>
                        )}
                        {obs && !isIrreal && <div style={{ fontSize: '11px', color: '#475569', marginTop: '8px', fontStyle: 'italic', lineHeight: '1.2' }}>Obs: {obs}</div>}

                        {temOfertaValida && !isBloqueado && !isEncerrada && !item.excluido && !isIrreal && (
                          <div style={{ marginTop: '10px' }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const isTroca = substituto && (isTrocaAceita || isEmFaltaOriginal);
                                const nomeFinal = isTroca ? substituto : item.nomeProduto;
                                const qtdFinal = isTroca ? qtdSubstituto : item.quantidade;
                                const condicoesPassadas = isTroca ? condsArrSubst : condsArr;
                                let precoBase = isTroca ? precoSubstituto : precoOriginal;
                                
                                let precoFinal = precoBase;
                                let condAplicada = false;
                                let qCAplicada = null;
                                let pCAplicada = null;
                                
                                if (condicoesPassadas.length > 0) {
                                    const sorted = [...condicoesPassadas].sort((a,b) => b.qtd - a.qtd);
                                    for (let c of sorted) {
                                        if (qtdFinal >= c.qtd) {
                                            precoFinal = c.preco;
                                            qCAplicada = c.qtd;
                                            pCAplicada = c.preco;
                                            condAplicada = true;
                                            break;
                                        }
                                    }
                                }

                                onAbrirAddPedidoModal({
                                  idItem: item.idItem,
                                  nomeProduto: nomeFinal,
                                  quantidade: qtdFinal,
                                  ultimoPreco: precoFinal,
                                  precoCustom: precoFinal,
                                  precoBase: precoBase,
                                  condicoes: condicoesPassadas,     
                                  qtdCondicao: qCAplicada,     
                                  precoCondicao: pCAplicada,       
                                  condicaoAplicada: condAplicada
                                }, f);
                              }}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 'bold', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
                            >
                              <ShoppingCart size={12} /> + Pedido
                            </button>
                          </div>
                        )}
                      </td>
                    );
                  })}

                  {isItens && (
                    <td style={{ ...tdStyle, textAlign: 'center', position: 'sticky', right: 0, zIndex: 20, backgroundColor: 'inherit', boxShadow: '-2px 0 5px -2px rgba(0,0,0,0.1)' }}>
                      {subAbaItens === 'comprados' ? (
                        <button onClick={() => navigate(`/pedidos/${itensJaComprados[item.idItem].id}`)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', backgroundColor: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}><Eye size={14}/> Pedido #{itensJaComprados[item.idItem].id}</button>
                      ) : (
                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                          <button type="button" onClick={() => !item.excluido && deletarItem(item.idItem)} style={{ background: 'none', border: 'none', cursor: isBloqueado || isEncerrada || item.excluido ? 'not-allowed' : 'pointer', padding: '4px', color: '#ef4444' }} disabled={isBloqueado || isEncerrada || item.excluido} title="Remover Produto da Cotação">
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
    </div>
  );
}