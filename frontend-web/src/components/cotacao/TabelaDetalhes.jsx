import React from 'react';
import { Eye, Trash2, ArrowUpDown, ChevronUp, ChevronDown, Check, Copy, RefreshCcw, ShoppingCart, Filter, AlertTriangle, Tags } from 'lucide-react';
import BadgeOrigem from './BadgeOrigem';

export default function TabelaDetalhes({
  relatorioExibicao, colunasVisiveis, fornecedoresVisiveis, fornecedores, requestSort, sortConfig,
  editandoItem, formEdicao, setFormEdicao, salvarEdicao, isEncerrada, iniciarEdicao, 
  getNomeExibicao, isDiversos, mostrarNomeReal, copiarParaAreaTransferencia, copiadoId, 
  itensJaComprados, reatribuirItem, fData, fMoney, decisaoCompra, aceitesTroca, 
  handleSetWinner, toggleTroca, subAbaItens, navigate, deletarItem, isComparativo, isItens,
  onAbrirAddPedidoModal, filtroVencedor, setFiltroVencedor, filtroTopN
}) {
  const thStyle = { textAlign: 'left', padding: '12px', borderBottom: '2px solid #e5e7eb', color: '#4b5563', fontSize: '13px', whiteSpace: 'nowrap', position: 'sticky', top: 0, backgroundColor: '#ffffff', zIndex: 10 };
  const tdStyle = { padding: '12px', borderBottom: '1px solid #e5e7eb', color: '#374151', fontSize: '13px', wordBreak: 'break-word', whiteSpace: 'normal' };
  const inputEdicao = { padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' };

  const SortIcon = ({ sortKey }) => {
    if (sortConfig.key !== sortKey) return <ArrowUpDown size={14} color="#9ca3af" style={{ marginLeft: '6px' }} />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} color="#2563eb" style={{ marginLeft: '6px' }} /> : <ChevronDown size={14} color="#2563eb" style={{ marginLeft: '6px' }} />;
  };

  return (
    <div style={{ maxHeight: '75vh', overflowY: 'auto', overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
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
            
            {isComparativo && fornecedores.filter(f => fornecedoresVisiveis[f] ?? true).map((f) => (
                <th key={f} style={{ ...thStyle, backgroundColor: '#f9fafb', textAlign: 'center', borderLeft: '1px solid #e5e7eb', minWidth: '180px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        {f}
                        <button
                            title={`Filtrar apenas itens ganhos por ${f}`}
                            onClick={() => setFiltroVencedor(filtroVencedor === f ? 'TODOS' : f)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, borderRadius: '4px', backgroundColor: filtroVencedor === f ? '#dbeafe' : 'transparent', display: 'flex', alignItems: 'center' }}
                        >
                            <Filter size={14} color={filtroVencedor === f ? '#2563eb' : '#9ca3af'} />
                        </button>
                    </div>
                </th>
            ))}
            
            {isItens && <th style={{ ...thStyle, textAlign: 'center', minWidth: '100px', position: 'sticky', right: 0, zIndex: 20, boxShadow: '-2px 0 5px -2px rgba(0,0,0,0.1)' }}>Ações</th>}
          </tr>
        </thead>
        <tbody>
          {relatorioExibicao.map((item) => {
            const isBloqueado = !!itensJaComprados[item.idItem];
            const textStyle = isBloqueado ? { textDecoration: 'line-through', color: '#9ca3af' } : {};

            const ofertasValidas = fornecedores.map(forn => {
                let pO = item.precosPorFornecedor?.[forn] || 0;
                let pS = item.precosSubstitutosPorFornecedor?.[forn] || 0;
                let val = Infinity;
                
                if (pO > 0) val = pO;
                if (pS > 0 && pS < val) val = pS; 
                if (pO <= 0 && pS > 0) val = pS;
                
                return { forn, val };
            }).filter(x => x.val !== Infinity).sort((a, b) => a.val - b.val);

            const rankMap = {};
            ofertasValidas.forEach((vo, index) => { rankMap[vo.forn] = index + 1; });

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
                        {item.isValorAlteradoPosPedido && (
                          <span style={{ fontSize: '10px', backgroundColor: '#fef3c7', color: '#d97706', padding: '2px 6px', borderRadius: '4px', border: '1px solid #fcd34d', fontWeight: 'bold', marginLeft: '6px' }} title="Este valor foi editado na tela de Pedidos">
                            ⚠️ Alterado no Pedido
                          </span>
                        )}
                        <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); copiarParaAreaTransferencia(getNomeExibicao(item.nomeProduto), item.idItem); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: copiadoId === item.idItem ? '#10b981' : '#9ca3af' }}>
                          {copiadoId === item.idItem ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>

                      {item.devolvidoPorAlteracaoPreco && !isBloqueado && (
                        <div style={{ marginTop: '2px' }}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); navigate(`/pedidos/${item.pedidoOrigemId}`); }}
                            style={{ 
                              display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', 
                              backgroundColor: '#fee2e2', color: '#b91c1c', padding: '2px 6px', 
                              borderRadius: '4px', border: '1px solid #fecaca', fontWeight: 'bold', 
                              cursor: 'pointer' 
                            }}
                            title="O fornecedor alterou o preço após a compra. O item foi removido do pedido por segurança."
                          >
                            <AlertTriangle size={10} /> Estorno de Preço (Ver Pedido #{item.pedidoOrigemId})
                          </button>
                        </div>
                      )}

                      {item.origemItem === 'Encomenda' && (
                        <div style={{ marginTop: '4px', fontSize: '11px', color: '#4338ca', backgroundColor: '#e0e7ff', padding: '4px 8px', borderRadius: '4px', display: 'inline-block', border: '1px solid #c7d2fe' }}>
                          📦 <b>Encomenda</b>
                          {item.fornecedorSugerido && <span> | Sugestão do Balcão: <b style={{ color: '#312e81' }}>{item.fornecedorSugerido}</b></span>}
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <BadgeOrigem origem={item.origemItem} />
                        {isBloqueado && (
                          <>
                            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/pedidos/${itensJaComprados[item.idItem].id}`); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #86efac', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                              ✓ Ver Pedido #{itensJaComprados[item.idItem].id}
                            </button>
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

                  const qtdCond = item.qtdCondicaoPorFornecedor?.[f];
                  const precoCond = item.precoCondicaoPorFornecedor?.[f];
                  const qtdCondSubst = item.qtdCondicaoSubstPorFornecedor?.[f];
                  const precoCondSubst = item.precoCondicaoSubstPorFornecedor?.[f];

                  return (
                    <td key={f} onClick={() => !isBloqueado && !item.excluido && handleSetWinner(item.idItem, f)} style={{ ...tdStyle, backgroundColor: isWinner ? '#ecfdf5' : 'inherit', textAlign: 'center', borderLeft: '1px solid #f3f4f6', border: isWinner ? '2px solid #10b981' : '1px solid #e5e7eb', cursor: isBloqueado || isEncerrada || item.excluido ? 'not-allowed' : 'pointer', verticalAlign: 'top', position: 'relative', opacity: isBloqueado ? 0.6 : 1 }}>
                      {isWinner && <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', backgroundColor: '#10b981', color: 'white', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>VENCEDOR</div>}
                      
                      <div style={{ marginTop: '8px', fontWeight: isWinner ? 'bold' : 'normal', color: isEmFaltaOriginal ? '#dc2626' : '#374151', textDecoration: isBloqueado ? 'line-through' : 'none' }}>{isEmFaltaOriginal ? 'Em falta' : fMoney(precoOriginal)}</div>
                      
                      {qtdCond && precoCond && !isEmFaltaOriginal && (
                        <div style={{ fontSize: '11px', color: '#166534', backgroundColor: '#dcfce7', padding: '4px 6px', borderRadius: '4px', marginTop: '6px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px', border: '1px solid #bbf7d0' }}>
                          <Tags size={12} /> A partir de {qtdCond} un: {fMoney(precoCond)}
                        </div>
                      )}

                      {substituto && (
                        <div onClick={(e) => { e.stopPropagation(); if(!isBloqueado && !item.excluido) toggleTroca(item.idItem, f); }} style={{ marginTop: '8px', backgroundColor: (isTrocaAceita && isWinner) ? '#dcfce7' : '#fef3c7', padding: '6px', borderRadius: '6px', border: `1px solid ${(isTrocaAceita && isWinner) ? '#4ade80' : '#fde047'}`, textAlign: 'left' }}>
                          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', cursor: isBloqueado || isEncerrada || item.excluido ? 'not-allowed' : 'pointer', fontSize: '11px', color: '#111827' }}>
                            <input type="checkbox" checked={isTrocaAceita && isWinner} onChange={() => !isBloqueado && !item.excluido && toggleTroca(item.idItem, f)} style={{ marginTop: '2px' }} disabled={isBloqueado || isEncerrada || item.excluido} />
                            <div style={{ textDecoration: isBloqueado ? 'line-through' : 'none' }}>
                              <strong style={{ color: '#b45309' }}>Troca: {getNomeExibicao(substituto)}</strong><br/>
                              <span style={{ color: '#059669', fontWeight: 'bold' }}>{fMoney(precoSubstituto)}</span> (Qtd: {qtdSubstituto})
                              
                              {qtdCondSubst && precoCondSubst && (
                                <div style={{ fontSize: '10px', color: '#166534', backgroundColor: '#dcfce7', padding: '2px 4px', borderRadius: '4px', marginTop: '4px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #bbf7d0' }}>
                                  <Tags size={10} /> A partir de {qtdCondSubst} un: {fMoney(precoCondSubst)}
                                </div>
                              )}
                            </div>
                          </label>
                        </div>
                      )}
                      {obs && <div style={{ fontSize: '11px', color: '#475569', marginTop: '8px', fontStyle: 'italic', lineHeight: '1.2' }}>Obs: {obs}</div>}

                      {temOfertaValida && !isBloqueado && !isEncerrada && !item.excluido && (
                        <div style={{ marginTop: '10px' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const isTroca = substituto && (isTrocaAceita || isEmFaltaOriginal);
                              const nomeFinal = isTroca ? substituto : item.nomeProduto;
                              const qtdFinal = isTroca ? qtdSubstituto : item.quantidade;
                              
                              let precoBase = isTroca ? precoSubstituto : precoOriginal;
                              let precoFinal = precoBase;
                              let condAplicada = false;
                              
                              const qC = isTroca ? qtdCondSubst : qtdCond;
                              const pC = isTroca ? precoCondSubst : precoCond;

                              if (qC && pC && qtdFinal >= qC) {
                                  precoFinal = pC;
                                  condAplicada = true;
                              }

                              onAbrirAddPedidoModal({
                                idItem: item.idItem,
                                nomeProduto: nomeFinal,
                                quantidade: qtdFinal,
                                ultimoPreco: precoFinal,
                                precoCustom: precoFinal,
                                precoBase: precoBase,      
                                qtdCondicao: qC,           
                                precoCondicao: pC,         
                                condicaoAplicada: condAplicada 
                              }, f);
                            }}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 'bold', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
                            title={`Adicionar ${substituto && (isTrocaAceita || isEmFaltaOriginal) ? substituto : item.nomeProduto} ao pedido de ${f}`}
                          >
                            <ShoppingCart size={12} /> + Pedido
                          </button>
                        </div>
                      )}
                    </td>
                  );
                })}

                {isItens && (
                  <td style={{ ...tdStyle, textAlign: 'center', position: 'sticky', right: 0, zIndex: 10, backgroundColor: 'inherit', boxShadow: '-2px 0 5px -2px rgba(0,0,0,0.1)' }}>
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
  );
}