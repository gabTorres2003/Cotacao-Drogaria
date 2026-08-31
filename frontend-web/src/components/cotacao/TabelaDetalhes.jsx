import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Eye, Trash2, ArrowUpDown, ChevronUp, ChevronDown, Check, Copy, RefreshCcw, ShoppingCart, Filter, AlertTriangle, Tags, Pin, GripHorizontal, X, Pencil } from 'lucide-react';
import BadgeOrigem from './BadgeOrigem';

const parseDateSafe = (dStr) => {
    if (!dStr) return null;
    if (dStr.includes('T')) return new Date(dStr);
    if (dStr.includes('/')) {
        const parts = dStr.split('/');
        return new Date(parts[2], parts[1] - 1, parts[0]);
    }
    if (dStr.includes('-')) {
        const parts = dStr.split('-');
        return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date(dStr);
};

export default function TabelaDetalhes({
  relatorioExibicao, colunasVisiveis, fornecedoresVisiveis, fornecedores, requestSort, sortConfig,
  editandoItem, formEdicao, setFormEdicao, salvarEdicao, isEncerrada, iniciarEdicao, 
  getNomeExibicao, isDiversos, mostrarNomeReal, copiarParaAreaTransferencia, copiadoId, 
  itensJaComprados, reatribuirItem, fData, fMoney, decisaoCompra, setDecisaoCompra, aceitesTroca, 
  handleSetWinner, toggleTroca, subAbaItens, navigate, deletarItem, isComparativo, isItens,
  onAbrirAddPedidoModal,   filtroVencedor, setFiltroVencedor, filtroTopN,
  mostrarComImposto, impostoPctPorNome,
  editandoResposta, formEdicaoResposta, setFormEdicaoResposta,
  iniciarEdicaoResposta, cancelarEdicaoResposta, salvarEdicaoResposta,
  itensExcluidosLocal, retornarItem, onConfirmarFracoes
}) {
  const [mostrarAlertasPreco, setMostrarAlertasPreco] = useState(true);
  const [isHeaderPinned, setIsHeaderPinned] = useState(false);
  const [destacarBaixoGiro, setDestacarBaixoGiro] = useState(false);
  const [fracoesPorProduto, setFracoesPorProduto] = useState(() => {
      try { return JSON.parse(localStorage.getItem('fracoesPorProduto') || '{}'); } catch { return {}; }
  });
  const [fracoesConfirmadas, setFracoesConfirmadas] = useState(() => {
      try { return JSON.parse(localStorage.getItem('fracoesConfirmadas') || '{}'); } catch { return {}; }
  });
  const [impostoDesconsiderado, setImpostoDesconsiderado] = useState(() => {
      try { return JSON.parse(localStorage.getItem('impostoDesconsiderado') || '{}'); } catch { return {}; }
  });

  useEffect(() => { localStorage.setItem('fracoesPorProduto', JSON.stringify(fracoesPorProduto)); }, [fracoesPorProduto]);
  useEffect(() => { localStorage.setItem('fracoesConfirmadas', JSON.stringify(fracoesConfirmadas)); }, [fracoesConfirmadas]);
  useEffect(() => { localStorage.setItem('impostoDesconsiderado', JSON.stringify(impostoDesconsiderado)); }, [impostoDesconsiderado]);

  const [mostrarFracao, setMostrarFracao] = useState(() => {
      try { return localStorage.getItem('mostrarFracao') === 'true'; } catch { return false; }
  });
  const [fracaoDesconsiderada, setFracaoDesconsiderada] = useState(() => {
      try { return JSON.parse(localStorage.getItem('fracaoDesconsiderada') || '{}'); } catch { return {}; }
  });

  useEffect(() => { localStorage.setItem('mostrarFracao', JSON.stringify(mostrarFracao)); }, [mostrarFracao]);
  useEffect(() => { localStorage.setItem('fracaoDesconsiderada', JSON.stringify(fracaoDesconsiderada)); }, [fracaoDesconsiderada]);

  const [pinnedSuppliers, setPinnedSuppliers] = useState([]);
  const [supplierOrder, setSupplierOrder] = useState([]);
  const [draggedSupplier, setDraggedSupplier] = useState(null);
  const [pinnedStats, setPinnedStats] = useState([]);
  const [valoresIrreais, setValoresIrreais] = useState({});
  const [valoresRecusados, setValoresRecusados] = useState({});
  const [contextMenu, setContextMenu] = useState(null);

  const [pinnedRows, setPinnedRows] = useState([]);
  
  const [alertaProduto, setAlertaProduto] = useState(null);
  const [itensRiscoDesconsiderado, setItensRiscoDesconsiderado] = useState({});
  const scrollContainerRef = useRef(null);
  const decisaoCompraRef = useRef(decisaoCompra);
  decisaoCompraRef.current = decisaoCompra;
  const [balloonPositions, setBalloonPositions] = useState([]);

  useEffect(() => {
      setSupplierOrder(prev => {
          const newOrder = [...prev];
          fornecedores.forEach(f => {
              if (!newOrder.includes(f)) newOrder.push(f);
          });
          return newOrder.filter(f => fornecedores.includes(f));
      });
  }, [fornecedores]);

  useEffect(() => {
      const closeMenu = () => setContextMenu(null);
      if (contextMenu) {
          document.addEventListener('click', closeMenu);
          return () => document.removeEventListener('click', closeMenu);
      }
  }, [contextMenu]);

  const updateBalloonPositions = useCallback(() => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const scrollLeft = container.scrollLeft;
      const scrollTop = container.scrollTop;
      const cells = container.querySelectorAll('td[data-balloon]');
      const positions = [];
      cells.forEach(cell => {
          const rect = cell.getBoundingClientRect();
          const x = rect.left - containerRect.left + scrollLeft + rect.width / 2;
          const y = rect.top - containerRect.top + scrollTop - 10;
          const label = cell.getAttribute('data-balloon-label');
          const color = cell.getAttribute('data-balloon-color');
          const border = cell.getAttribute('data-balloon-border');
          const textColor = cell.getAttribute('data-balloon-textcolor');
          const fontSize = cell.getAttribute('data-balloon-fontsize');
          const padding = cell.getAttribute('data-balloon-padding');
          const shadow = cell.getAttribute('data-balloon-shadow') === 'true';
          if (label) {
              positions.push({ x, y, label, color, border, textColor, fontSize, padding, shadow });
          }
      });
      setBalloonPositions(positions);
  }, []);

  useEffect(() => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const handler = () => updateBalloonPositions();
      window.addEventListener('resize', handler);
      updateBalloonPositions();
      return () => { window.removeEventListener('resize', handler); };
  }, [updateBalloonPositions, relatorioExibicao, sortConfig, fornecedoresVisiveis, filtroVencedor, filtroTopN, fracoesPorProduto, fracoesConfirmadas, impostoDesconsiderado, mostrarComImposto, mostrarFracao, fracaoDesconsiderada]);

  const calcularOfertasValidas = (item, fracaoDesconsideradaAtual = fracaoDesconsiderada) => {
    return supplierOrder.map(forn => {
      const fracao = fracoesPorProduto[item.idItem] || fracoesConfirmadas[item.idItem] || 1;
      const isFracaoDesc = fracao > 1 && !!fracaoDesconsideradaAtual[`${item.idItem}-${forn}`];
      const precoOriginalBanco = item.precoOriginalPorFornecedor?.[forn];
      const precoEfetivoBanco = item.precosPorFornecedor?.[forn] || 0;
      const pOraw = (fracao > 1 && precoOriginalBanco > 0) ? precoOriginalBanco : precoEfetivoBanco;
      const pSraw = item.precosSubstitutosPorFornecedor?.[forn] || 0;
      const isIrreal = valoresIrreais[`${item.idItem}-${forn}`];
      const isRecusado = valoresRecusados[`${item.idItem}-${forn}`];
      const pOeff = (fracao > 1 && !isFracaoDesc && pOraw > 0) ? pOraw / fracao : pOraw;
      const pSeff = (fracao > 1 && !isFracaoDesc && pSraw > 0) ? pSraw / fracao : pSraw;
      const isImpostoDesc = !!impostoDesconsiderado[`${item.idItem}-${forn}`];
      const pctForn = (mostrarComImposto && !isImpostoDesc) ? (impostoPctPorNome?.[forn] || 0) : 0;
      const pO = pctForn > 0 && pOeff > 0 ? pOeff * (1 + pctForn / 100) : pOeff;
      const pS = pctForn > 0 && pSeff > 0 ? pSeff * (1 + pctForn / 100) : pSeff;
      const precoBaseAlerta = item.ultimoPreco || item.ultimoPrecoComprado;
      const isDiscrepante = precoBaseAlerta > 0 && pOeff > 0
        && (pOeff > precoBaseAlerta * 2.0 || pOeff < precoBaseAlerta * 0.5);
      let val = Infinity;
      if (pO > 0) val = pO;
      if (pS > 0 && pS < val) val = pS;
      if (pO <= 0 && pS > 0) val = pS;

      if (val !== Infinity && (isIrreal || isRecusado || (mostrarAlertasPreco && isDiscrepante))) val = Infinity;
      return { forn, val };
    }).filter(x => x.val !== Infinity).sort((a, b) => a.val - b.val);
  };

  const alterarFracaoDesconsiderada = (itemId, fornecedor, desconsiderar) => {
    const novaFracaoDesconsiderada = { ...fracaoDesconsiderada };
    const chave = `${itemId}-${fornecedor}`;
    if (desconsiderar) novaFracaoDesconsiderada[chave] = true;
    else delete novaFracaoDesconsiderada[chave];
    setFracaoDesconsiderada(novaFracaoDesconsiderada);
  };

  const confirmarFracao = async () => {
    if (onConfirmarFracoes) {
      const sucesso = await onConfirmarFracoes(fracoesPorProduto, fracaoDesconsiderada);
      if (sucesso) {
        setFracoesConfirmadas({ ...fracoesPorProduto });
      }
    } else {
      setFracoesConfirmadas({ ...fracoesPorProduto });
    }
  };

  useEffect(() => {
    if (!setDecisaoCompra || !isComparativo) return;
    const updates = {};
    relatorioExibicao.forEach(item => {
      if (item.excluido) return;
      const ofertasValidas = calcularOfertasValidas(item);
      if (ofertasValidas.length === 0) return;
      const bestForn = ofertasValidas[0].forn;
      const currentWinner = decisaoCompraRef.current[item.idItem];
      if (!currentWinner) {
        updates[item.idItem] = bestForn;
      } else if (!ofertasValidas.some(o => o.forn === currentWinner)) {
        updates[item.idItem] = bestForn;
      }
    });
    if (Object.keys(updates).length > 0) {
      setDecisaoCompra(prev => ({ ...prev, ...updates }));
    }
  }, [fracoesPorProduto, fracoesConfirmadas, fracaoDesconsiderada, mostrarComImposto, mostrarAlertasPreco, impostoDesconsiderado, impostoPctPorNome, relatorioExibicao, isComparativo, supplierOrder, valoresIrreais, valoresRecusados, setDecisaoCompra]);

  const toggleRowPin = (idItem) => setPinnedRows(prev => prev.includes(idItem) ? prev.filter(id => id !== idItem) : [...prev, idItem]);
  const togglePin = (f) => setPinnedSuppliers(prev => prev.includes(f) ? prev.filter(s => s !== f) : [...prev, f]);
  const togglePinStat = (stat) => setPinnedStats(prev => prev.includes(stat) ? prev.filter(s => s !== stat) : [...prev, stat]);

  const getLeftOffset = (colKey, type = 'stat') => {
      let offset = 250; 
      const statsOrder = ['quantidade', 'estoque', 'vendidoNoMes', 'vendidoAposUltCompra', 'ultCompraData', 'ultCompraQtde', 'ultVendaData', 'ultimoPreco'];
      const widths = { quantidade: 130, estoque: 130, vendidoNoMes: 140, vendidoAposUltCompra: 160, ultCompraData: 130, ultCompraQtde: 130, ultVendaData: 130, ultimoPreco: 150 };
      
      for (let stat of statsOrder) {
          if (stat === colKey && type === 'stat') break;
          if (pinnedStats.includes(stat) && colunasVisiveis[stat]) offset += widths[stat];
      }
      if (type === 'supplier') {
          for (let stat of statsOrder) {
              if (pinnedStats.includes(stat) && colunasVisiveis[stat]) offset += widths[stat];
          }
          const idx = pinnedSuppliers.indexOf(colKey);
          if (idx > -1) offset += (idx * 180); 
      }
      return offset;
  };

  const thStyle = { textAlign: 'left', padding: '12px', borderBottom: '2px solid #e5e7eb', color: '#4b5563', fontSize: '13px', whiteSpace: 'nowrap', backgroundColor: '#ffffff' };
  const tdStyle = { padding: '12px', borderBottom: '1px solid #e5e7eb', color: '#374151', fontSize: '13px', wordBreak: 'break-word', whiteSpace: 'normal' };
  const inputEdicao = { padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' };

  const SortIcon = ({ sortKey }) => {
    if (sortConfig.key !== sortKey) return <ArrowUpDown size={14} color="#9ca3af" style={{ marginLeft: '6px' }} />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} color="#2563eb" style={{ marginLeft: '6px' }} /> : <ChevronDown size={14} color="#2563eb" style={{ marginLeft: '6px' }} />;
  };

  const getHeaderStyle = (isPinnedCol, leftPos, minWidth, isRight = false) => {
      const isPinned = isHeaderPinned || isPinnedCol;
      return {
          ...thStyle, minWidth, textAlign: isRight ? 'right' : 'left',
          position: isPinned ? 'sticky' : 'relative', top: isHeaderPinned ? '0' : 'auto',
          left: isPinnedCol ? `${leftPos}px` : 'auto',
          zIndex: isHeaderPinned && isPinnedCol ? 40 : (isHeaderPinned ? 30 : (isPinnedCol ? 20 : 10)),
          backgroundColor: isPinnedCol ? '#f0fdf4' : '#ffffff',
          boxShadow: isPinnedCol ? '2px 0 5px -2px rgba(0,0,0,0.1)' : 'none'
      };
  };

  const getCellColStyle = (isPinnedCol, leftPos, isRight = false, isBold = false, color = '#374151', isPinnedRow = false, isBaixoGiro = false) => ({
      ...tdStyle, textAlign: isRight ? 'right' : 'center', fontWeight: isBold ? '500' : 'normal', color: color,
      position: isPinnedCol ? 'sticky' : 'relative', left: isPinnedCol ? `${leftPos}px` : 'auto',
      zIndex: isPinnedCol ? 15 : 1,
      backgroundColor: isPinnedRow ? (isPinnedCol ? '#e0f2fe' : '#f0f9ff') : (isPinnedCol ? (isBaixoGiro ? '#fee2e2' : '#f8fafc') : 'inherit'),
      boxShadow: isPinnedCol ? '2px 0 5px -2px rgba(0,0,0,0.1)' : 'none'
  });

  const pinnedItems = relatorioExibicao.filter(i => pinnedRows.includes(i.idItem));
  const unpinnedItems = relatorioExibicao.filter(i => !pinnedRows.includes(i.idItem));

  const fornecedoresCompetitivos = (() => {
      if (filtroTopN === 'TODOS') return null;
      const topN = filtroTopN === 'TOP_1' ? 1 : filtroTopN === 'TOP_2' ? 2 : filtroTopN === 'TOP_4' ? 4 : 3;
      const competitiveByItem = new Map();
      relatorioExibicao.forEach(item => {
          const ofertas = calcularOfertasValidas(item);
          const itemSet = new Set();
          ofertas.slice(0, topN).forEach(o => itemSet.add(o.forn));
          competitiveByItem.set(item.idItem, itemSet);
      });
      return competitiveByItem;
  })();

  const renderItemRow = (item, isPinnedRow) => {
      const isBloqueado = !!itensJaComprados[item.idItem];
      const textStyle = isBloqueado ? { textDecoration: 'line-through', color: '#9ca3af' } : {};
      const precoBaseAlerta = item.ultimoPreco || item.ultimoPrecoComprado;

      // VARIÁVEIS DA LÓGICA DE INTELIGÊNCIA
      const estoque = Number(item.estoque) || 0;
      const vendidoNoMes = Number(item.vendidoNoMes) || 0;
      const ultCompraQtde = Number(item.ultCompraQtde) || 0;
      const vendidoAposUltCompra = Number(item.vendidoAposUltCompra) || 0;
      const qtdPedida = Number(item.quantidade) || 0;

      let motivosExcesso = [];

      // 1. Giro Zero no Mês (Estoque parado sem venda)
      if (estoque > 0 && vendidoNoMes === 0) {
          motivosExcesso.push(`Produto não teve vendas nos últimos 30 dias e ainda há estoque (${estoque} un).`);
      }

      const dataCompra = parseDateSafe(item.ultCompraData);
      const dataAtual = new Date();

      if (dataCompra) {
          const diasDesdeCompra = Math.max(1, Math.floor((dataAtual - dataCompra) / (1000 * 60 * 60 * 24)));

          // 2. Compra Antiga sem giro (> 6 meses sem VENDA, não apenas sem compra)
          if (diasDesdeCompra > 180 && vendidoNoMes === 0 && estoque > 0) {
              motivosExcesso.push(`A última compra foi realizada há mais de 6 meses (${fData(item.ultCompraData)}) e o produto não teve vendas recentes.`);
          }

          // 3. Compra Encalhada
          if (ultCompraQtde > 0 && vendidoAposUltCompra === 0 && estoque > 0 && diasDesdeCompra > 30) {
              motivosExcesso.push(`Compra encalhada: você comprou ${ultCompraQtde} un há ${diasDesdeCompra} dias e não vendeu nenhuma unidade desde então.`);
          }

          // 4. Ritmo de Giro Pós-Compra
          if (vendidoAposUltCompra > 0 && diasDesdeCompra > 0 && qtdPedida > 0) {
              const diasPorUnidade = diasDesdeCompra / vendidoAposUltCompra;
              const tempoEstimadoParaVender = Math.round(qtdPedida * diasPorUnidade);

              if (tempoEstimadoParaVender > 90) {
                  motivosExcesso.push(`Giro Lento (Pós-Compra): Levou ${diasDesdeCompra} dias para vender ${vendidoAposUltCompra} un da última compra. Neste ritmo, a quantidade que você está pedindo agora (${qtdPedida} un) demorará aprox. ${tempoEstimadoParaVender} dias para sair.`);
              }
          }
      }

      // 5. Superestocagem Absoluta
      const vendaDiaria = vendidoNoMes / 30;
      if (vendaDiaria > 0.01 && qtdPedida > 0) {
          const diasCobertura = Math.round((estoque + qtdPedida) / vendaDiaria);
          if (diasCobertura > 90) {
              const msgSuper = `Superestocagem: O estoque atual somado ao pedido (${estoque + qtdPedida} un) vai gerar uma prateleira para aprox. ${diasCobertura} dias (Sua média é de ${vendaDiaria.toFixed(2)} vendas/dia).`;
              if (!motivosExcesso.some(m => m.includes('Giro Lento (Pós-Compra)'))) {
                  motivosExcesso.push(msgSuper);
              }
          }
      } else if (vendaDiaria <= 0.01 && qtdPedida > 0 && estoque === 0) {
          motivosExcesso.push(`Você está pedindo ${qtdPedida} un de um produto com vendas muito baixas ou sem venda nos últimos 30 dias.`);
      }

      const temRiscoExcesso = motivosExcesso.length > 0;
      const riscoDesconsiderado = !!itensRiscoDesconsiderado[item.idItem];
      const isBaixoGiro = destacarBaixoGiro && temRiscoExcesso && !riscoDesconsiderado;

      let rowBgColor = '#ffffff';
      if (isPinnedRow) rowBgColor = '#f0f9ff';
      else if (isBaixoGiro) rowBgColor = '#fef2f2';

      const ofertasValidas = calcularOfertasValidas(item);

      const rankMap = {};
      ofertasValidas.forEach((vo, index) => { rankMap[vo.forn] = index + 1; });

      const bestValidForn = ofertasValidas.length > 0 ? ofertasValidas[0].forn : null;
      let currentWinner = decisaoCompra[item.idItem];
      const isCurrentWinnerDisqualified = currentWinner && !ofertasValidas.some(o => o.forn === currentWinner);
      const displayWinner = isCurrentWinnerDisqualified ? bestValidForn : currentWinner;

      return (
        <tr key={item.idItem} style={{ backgroundColor: rowBgColor, opacity: item.excluido ? 0.5 : 1 }}>
          <td style={{ ...tdStyle, position: 'sticky', left: 0, zIndex: 20, backgroundColor: isPinnedRow ? '#e0f2fe' : (isBaixoGiro ? '#fee2e2' : '#ffffff'), boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)' }}>
            {editandoItem === `${item.idItem}-nome` ? (
              <input style={{ ...inputEdicao, width: '100%', minWidth: '200px' }} value={formEdicao.nome} onChange={(e) => setFormEdicao({ ...formEdicao, nome: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') salvarEdicao(item.idItem); if (e.key === 'Escape') iniciarEdicao(null); }} onBlur={() => salvarEdicao(item.idItem)} autoFocus />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  
                  <button type="button" onClick={() => toggleRowPin(item.idItem)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: isPinnedRow ? '#2563eb' : '#9ca3af' }} title={isPinnedRow ? "Descongelar Linha" : "Congelar Linha no Topo"}>
                    <Pin size={16} />
                  </button>

                  <strong style={{ ...textStyle, cursor: (!isBloqueado && !isEncerrada && !item.excluido) ? 'pointer' : 'default', borderBottom: (!isBloqueado && !isEncerrada && !item.excluido) ? '1px dashed #9ca3af' : 'none' }} onClick={() => !item.excluido && iniciarEdicao(item, 'nome')} title={(!isBloqueado && !isEncerrada && !item.excluido) ? "Clique para editar" : ""}>
                    {getNomeExibicao(item.nomeProduto)}
                  </strong>
                  
                  {isBaixoGiro && !item.excluido && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAlertaProduto({ nome: getNomeExibicao(item.nomeProduto), motivos: motivosExcesso }); }}
                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                          title="Ver os motivos do alerta de estoque"
                      >
                          <span style={{ fontSize: '10px', backgroundColor: '#fee2e2', color: '#991b1b', padding: '2px 6px', borderRadius: '4px', border: '1px solid #fecaca', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle size={10} /> Risco de Excesso
                          </span>
                      </button>
                      <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setItensRiscoDesconsiderado(prev => ({ ...prev, [item.idItem]: true })); }}
                          style={{ fontSize: '9px', backgroundColor: '#f3f4f6', color: '#6b7280', padding: '2px 5px', borderRadius: '3px', border: '1px solid #d1d5db', cursor: 'pointer', fontWeight: 'bold' }}
                          title="Desconsiderar este alerta para este produto"
                      >
                          Dispensar
                      </button>
                    </div>
                  )}

                  {isDiversos(item.nomeProduto) && !mostrarNomeReal && (<span style={{ fontSize: '10px', backgroundColor: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: '4px', border: '1px solid #fde047', fontWeight: 'bold' }}>Genérico</span>)}
                  {item.excluido && <span style={{ fontSize: '10px', backgroundColor: '#fee2e2', color: '#991b1b', padding: '2px 6px', borderRadius: '4px', border: '1px solid #fecaca', fontWeight: 'bold', marginLeft: '6px' }}>🗑️ Excluído</span>}
                  {item.editadoManual && !item.excluido && <span style={{ fontSize: '10px', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', border: '1px solid #bae6fd', fontWeight: 'bold', marginLeft: '6px' }}>✏️ Editado</span>}
                  {item.motivoRetorno && !isBloqueado && <span style={{ fontSize: '10px', backgroundColor: '#fee2e2', color: '#991b1b', padding: '2px 6px', borderRadius: '4px', border: '1px solid #fca5a5', fontWeight: 'bold', marginLeft: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><AlertTriangle size={10} /> Retornado: {item.motivoRetorno}</span>}
                  <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); copiarParaAreaTransferencia(getNomeExibicao(item.nomeProduto), item.idItem); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: copiadoId === item.idItem ? '#10b981' : '#9ca3af' }}>{copiadoId === item.idItem ? <Check size={14} /> : <Copy size={14} />}</button>
                </div>

                {isComparativo && mostrarFracao && !item.excluido && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <span style={{ fontSize: '10px', color: '#6b7280', fontWeight: '600' }}>/</span>
                    <input
                      type="number"
                      min="1"
                      className="fracao-input"
                      value={fracoesPorProduto[item.idItem] || ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? 1 : Math.max(1, Number(e.target.value));
                        setFracoesPorProduto(prev => ({ ...prev, [item.idItem]: val }));
                      }}
                      style={{ width: '50px', padding: '3px 6px', fontSize: '12px', textAlign: 'center', border: '1px solid #d1d5db', borderRadius: '3px', backgroundColor: (fracoesPorProduto[item.idItem] || 1) > 1 ? '#ede9fe' : 'white' }}
                      title="Fração para comparação (ex: 7 = preço ÷ 7)"
                    />
                    {(fracoesPorProduto[item.idItem] || 1) > 1 && (
                      <span style={{ fontSize: '9px', color: '#6d28d9', backgroundColor: '#ede9fe', padding: '1px 4px', borderRadius: '3px', border: '1px solid #c4b5fd', fontWeight: 'bold' }}>
                        / {fracoesPorProduto[item.idItem]}
                      </span>
                    )}
                  </div>
                )}
                
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
                <td style={getCellColStyle(isPinned, getLeftOffset('quantidade', 'stat'), false, false, textStyle.color, isPinnedRow, isBaixoGiro)}>
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
              return <td style={getCellColStyle(isPinned, getLeftOffset('estoque', 'stat'), false, false, textStyle.color, isPinnedRow, isBaixoGiro)}><span style={textStyle}>{item.estoque ?? '-'}</span></td>;
          })()}

          {isItens && (
            <>
              {colunasVisiveis.vendidoNoMes && <td style={{...tdStyle, backgroundColor: isPinnedRow ? '#f0f9ff' : (isBaixoGiro ? '#fef2f2' : 'inherit')}}><span style={textStyle}>{item.vendidoNoMes ?? '-'}</span></td>}
              {colunasVisiveis.vendidoAposUltCompra && <td style={{...tdStyle, backgroundColor: isPinnedRow ? '#f0f9ff' : (isBaixoGiro ? '#fef2f2' : 'inherit')}}><span style={textStyle}>{item.vendidoAposUltCompra ?? '-'}</span></td>}
              {colunasVisiveis.ultCompraData && <td style={{...tdStyle, backgroundColor: isPinnedRow ? '#f0f9ff' : (isBaixoGiro ? '#fef2f2' : 'inherit')}}><span style={textStyle}>{fData(item.ultCompraData)}</span></td>}
              {colunasVisiveis.ultCompraQtde && <td style={{...tdStyle, backgroundColor: isPinnedRow ? '#f0f9ff' : (isBaixoGiro ? '#fef2f2' : 'inherit')}}><span style={textStyle}>{item.ultCompraQtde ?? '-'}</span></td>}
              {colunasVisiveis.ultVendaData && <td style={{...tdStyle, backgroundColor: isPinnedRow ? '#f0f9ff' : (isBaixoGiro ? '#fef2f2' : 'inherit')}}><span style={textStyle}>{fData(item.ultVendaData)}</span></td>}
            </>
          )}

          {colunasVisiveis.ultimoPreco && (() => {
              const isPinned = pinnedStats.includes('ultimoPreco');
              return <td style={getCellColStyle(isPinned, getLeftOffset('ultimoPreco', 'stat'), true, true, '#4f46e5', isPinnedRow, isBaixoGiro)}><span style={textStyle}>{item.ultimoPreco != null ? fMoney(item.ultimoPreco) : '-'}</span></td>;
          })()}

          {isComparativo && supplierOrder.filter(f => (fornecedoresVisiveis[f] ?? true)).map((f) => {
            
            const rank = rankMap[f];
            const isWinner = displayWinner === f;
            const isOfertaVisivel = !fornecedoresCompetitivos || (fornecedoresCompetitivos.get(item.idItem)?.has(f) ?? false);

            const precoOriginalRaw = item.precosPorFornecedor?.[f] || 0;
            const precoOriginalBanco = item.precoOriginalPorFornecedor?.[f] || precoOriginalRaw;
            const precoOriginal = precoOriginalRaw;
            const precoSubstituto = item.precosSubstitutosPorFornecedor?.[f] || precoOriginalRaw;
            const qtdSubstituto = item.qtdsSubstitutosPorFornecedor?.[f] || item.quantidade;
            const obs = item.observacoesPorFornecedor?.[f];
            const substituto = item.substitutosPorFornecedor?.[f];
            const isTrocaAceita = aceitesTroca[item.idItem];
            const isEmFaltaOriginal = precoOriginal <= 0; 
            const temOfertaValida = !isEmFaltaOriginal || (substituto && precoSubstituto > 0);

            const isImpostoDesc = !!impostoDesconsiderado[`${item.idItem}-${f}`];
            const pctImpostoForn = (mostrarComImposto && !isImpostoDesc) ? (impostoPctPorNome?.[f] || 0) : 0;
            const ajustarPrecoExibicao = (p) => (pctImpostoForn > 0 && p > 0 ? p * (1 + pctImpostoForn / 100) : p);
            const precoOriginalAjustado = ajustarPrecoExibicao(precoOriginal);
            const precoSubstitutoAjustado = ajustarPrecoExibicao(precoSubstituto);
            const fracaoAtual = fracoesPorProduto[item.idItem] || fracoesConfirmadas[item.idItem] || 1;
            const isFracaoDesc = fracaoAtual > 1 && !!fracaoDesconsiderada[`${item.idItem}-${f}`];
            const aplicarFracao = (p) => {
              const f = fracoesPorProduto[item.idItem] || fracoesConfirmadas[item.idItem] || 1;
              const base = precoOriginalBanco > 0 ? precoOriginalBanco : p;
              return (f > 1 && !isFracaoDesc && base > 0) ? base / f : p;
            };
            
            const isIrreal = valoresIrreais[`${item.idItem}-${f}`];
            const isRecusado = valoresRecusados[`${item.idItem}-${f}`];
            let isPrecoDiscrepante = false;

            if (precoBaseAlerta > 0) {
                let precoEfetivoDiscrepancia;
                if (fracaoAtual > 1 && !isFracaoDesc && precoOriginalBanco > 0) {
                    precoEfetivoDiscrepancia = precoOriginalBanco / fracaoAtual;
                } else {
                    precoEfetivoDiscrepancia = precoOriginalRaw;
                }
                if (precoEfetivoDiscrepancia > 0 && (precoEfetivoDiscrepancia > precoBaseAlerta * 2.0 || precoEfetivoDiscrepancia < precoBaseAlerta * 0.5)) {
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

            const isPinnedCol = pinnedSuppliers.includes(f);
            const leftPos = getLeftOffset(f, 'supplier');

            return (
              <td key={f} onClick={() => isOfertaVisivel && !isBloqueado && !item.excluido && !isIrreal && !isRecusado && handleSetWinner(item.idItem, f)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (!isBloqueado && !item.excluido && !isEncerrada && precoOriginal > 0) {
                      setContextMenu({ x: e.clientX, y: e.clientY, itemId: item.idItem, fornecedor: f, preco: precoOriginal });
                    }
                  }}
                  data-balloon={isOfertaVisivel && !isIrreal && (isWinner || rank > 0) ? 'true' : undefined}
                  data-balloon-label={isOfertaVisivel && !isIrreal ? (isWinner ? 'VENCEDOR' : (rank > 0 ? `${rank}º LUGAR` : undefined)) : undefined}
                  data-balloon-color={(isWinner && !isIrreal) ? '#10b981' : (rank === 1 ? '#f59e0b' : (rank === 2 ? '#94a3b8' : (rank === 3 ? '#cd7f32' : '#fde047')))}
                  data-balloon-textcolor={(isWinner && !isIrreal) ? 'white' : (rank <= 3 ? 'white' : '#713f12')}
                  data-balloon-border={(isWinner && !isIrreal) ? '#059669' : (rank === 1 ? '#d97706' : (rank === 2 ? '#64748b' : (rank === 3 ? '#a0522d' : '#facc15')))}
                  data-balloon-fontsize={(rank <= 3 || isWinner) ? '11px' : '10px'}
                  data-balloon-padding={(rank <= 3 || isWinner) ? '3px 10px' : '2px 8px'}
                  data-balloon-shadow={(rank <= 3 || isWinner) ? 'true' : 'false'}
                  style={{ 
                      ...tdStyle, 
                      backgroundColor: isWinner ? '#ecfdf5' : (isPinnedRow ? (isPinnedCol ? '#e0f2fe' : '#f0f9ff') : (isPinnedCol ? (isBaixoGiro ? '#fee2e2' : '#f8fafc') : (isBaixoGiro ? '#fef2f2' : 'inherit'))), 
                      textAlign: 'center', 
                      borderLeft: '1px solid #f3f4f6', 
                      border: isWinner ? '2px solid #10b981' : '1px solid #e5e7eb', 
                      cursor: isBloqueado || isEncerrada || item.excluido || isIrreal ? 'not-allowed' : 'pointer', 
                      verticalAlign: 'top', 
                      position: isPinnedCol ? 'sticky' : 'relative', 
                      left: isPinnedCol ? `${leftPos}px` : 'auto',
                      zIndex: isPinnedCol ? 15 : 1,
                      boxShadow: isPinnedCol ? '2px 0 5px -2px rgba(0,0,0,0.1)' : 'none',
                      opacity: !isOfertaVisivel ? 0 : (isBloqueado ? 0.6 : (isIrreal || isRecusado ? 0.5 : (draggedSupplier === f ? 0.5 : 1))),
                      pointerEvents: !isOfertaVisivel ? 'none' : 'auto'
                  }}>
                
                <div style={{ marginTop: '8px', fontWeight: isWinner ? 'bold' : 'normal', color: isEmFaltaOriginal ? '#dc2626' : (isIrreal ? '#9ca3af' : (isPrecoDiscrepante && mostrarAlertasPreco ? '#b91c1c' : '#374151')), textDecoration: isBloqueado || isIrreal ? 'line-through' : 'none' }}>
                    {isEmFaltaOriginal ? 'Em falta' : (
                        <>
                            <span title={pctImpostoForn > 0 ? `Informado: ${fMoney(precoOriginal)} + ${pctImpostoForn}% de imposto` : undefined}>{fMoney(aplicarFracao(precoOriginalAjustado))}</span>
                            {fracaoAtual > 1 && !isFracaoDesc && <span style={{ marginLeft: '4px', fontSize: '9px', backgroundColor: '#ede9fe', color: '#6d28d9', border: '1px solid #c4b5fd', padding: '1px 4px', borderRadius: '4px', fontWeight: 'bold', verticalAlign: 'middle' }}>/ {fracaoAtual}</span>}
                            {pctImpostoForn > 0 && (
                                <span style={{ marginLeft: '4px', fontSize: '9px', backgroundColor: '#fef9c3', color: '#854d0e', border: '1px solid #fde047', padding: '1px 4px', borderRadius: '4px', fontWeight: 'bold', verticalAlign: 'middle' }}>+{pctImpostoForn}%</span>
                            )}
                        </>
                    )}
                </div>

                {mostrarComImposto && !isEmFaltaOriginal && !isIrreal && !isRecusado && impostoPctPorNome?.[f] > 0 && (
                  <div style={{ marginTop: '4px' }}>
                    {isImpostoDesc ? (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setImpostoDesconsiderado(prev => { const n = {...prev}; delete n[`${item.idItem}-${f}`]; return n; }); }}
                        style={{ fontSize: '9px', backgroundColor: '#dbeafe', color: '#1d4ed8', border: '1px solid #93c5fd', borderRadius: '3px', padding: '2px 6px', cursor: 'pointer', fontWeight: 'bold' }}
                        title="Reconsiderar imposto para este fornecedor"
                      >
                        Reconsiderar imposto
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setImpostoDesconsiderado(prev => ({ ...prev, [`${item.idItem}-${f}`]: true })); }}
                        style={{ fontSize: '9px', backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde047', borderRadius: '3px', padding: '2px 6px', cursor: 'pointer', fontWeight: 'bold' }}
                        title="Desconsiderar imposto deste fornecedor para este produto"
                      >
                        Desconsiderar imposto
                      </button>
                    )}
                  </div>
                )}

                {isComparativo && mostrarFracao && fracaoAtual > 1 && !isEmFaltaOriginal && !isIrreal && !isRecusado && (
                  <div style={{ marginTop: '4px' }}>
                    {fracaoDesconsiderada[`${item.idItem}-${f}`] ? (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); alterarFracaoDesconsiderada(item.idItem, f, false); }}
                        style={{ fontSize: '9px', backgroundColor: '#dbeafe', color: '#1d4ed8', border: '1px solid #93c5fd', borderRadius: '3px', padding: '2px 6px', cursor: 'pointer', fontWeight: 'bold' }}
                        title="Reconsiderar fração para este fornecedor"
                      >
                        Reconsiderar fração
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); alterarFracaoDesconsiderada(item.idItem, f, true); }}
                        style={{ fontSize: '9px', backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde047', borderRadius: '3px', padding: '2px 6px', cursor: 'pointer', fontWeight: 'bold' }}
                        title="Desconsiderar fração deste fornecedor para este produto"
                      >
                        Desconsiderar fração
                      </button>
                    )}
                  </div>
                )}

                {editandoResposta?.itemId === item.idItem && editandoResposta?.fornecedor === f ? (
                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '10px', color: '#6b7280', minWidth: '32px' }}>R$</span>
                      <input type="number" step="0.01" value={formEdicaoResposta.precoOfertado} onChange={(e) => setFormEdicaoResposta({ ...formEdicaoResposta, precoOfertado: e.target.value })} style={{ width: '100%', padding: '3px 4px', fontSize: '11px', border: '1px solid #93c5fd', borderRadius: '3px' }} placeholder="Preço" autoFocus />
                    </div>
                    <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                      <button onClick={(e) => { e.stopPropagation(); salvarEdicaoResposta(); }} style={{ flex: 1, padding: '3px', fontSize: '10px', fontWeight: 'bold', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Salvar</button>
                      <button onClick={(e) => { e.stopPropagation(); cancelarEdicaoResposta(); }} style={{ flex: 1, padding: '3px', fontSize: '10px', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '3px', cursor: 'pointer' }}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <>
                    {!isEmFaltaOriginal && !isBloqueado && !isEncerrada && !item.excluido && !isIrreal && item.idsPrecoPorFornecedor?.[f] && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); iniciarEdicaoResposta(item, f); }}
                        style={{ marginTop: '4px', background: 'none', border: '1px solid #d1d5db', borderRadius: '3px', padding: '2px 4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: '#6b7280' }}
                        title="Editar resposta deste fornecedor"
                      >
                        <Pencil size={10} /> Editar
                      </button>
                    )}
                  </>
                )}
                
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

                {isRecusado && !isIrreal && (
                   <div style={{ fontSize: '11px', color: '#92400e', backgroundColor: '#fef3c7', padding: '6px', borderRadius: '6px', marginTop: '6px', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', border: '1px solid #fde047' }}>
                      🚫 Valor Recusado
                      <button 
                        onClick={(e) => { e.stopPropagation(); setValoresRecusados(prev => { const n = {...prev}; delete n[`${item.idItem}-${f}`]; return n; }) }}
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
                                <Tags size={12} /> A partir de {cond.qtd} un: {fMoney(aplicarFracao(ajustarPrecoExibicao(cond.preco)))}
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
                        <span style={{ color: '#059669', fontWeight: 'bold' }}>{fMoney(aplicarFracao(precoSubstitutoAjustado))}</span>{fracaoAtual > 1 && <span style={{ fontSize: '9px', backgroundColor: '#ede9fe', color: '#6d28d9', border: '1px solid #c4b5fd', padding: '0 3px', borderRadius: '3px', fontWeight: 'bold', marginLeft: '3px' }}>/ {fracaoAtual}</span>}{pctImpostoForn > 0 && <span style={{ fontSize: '9px', backgroundColor: '#fef9c3', color: '#854d0e', border: '1px solid #fde047', padding: '0 3px', borderRadius: '3px', fontWeight: 'bold', marginLeft: '3px' }}>+{pctImpostoForn}%</span>} (Qtd: {qtdSubstituto})
                        
                        {condsArrSubst.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                              {condsArrSubst.map((cond, idx) => (
                                  <div key={idx} style={{ fontSize: '10px', color: '#166534', backgroundColor: '#dcfce7', padding: '2px 4px', borderRadius: '4px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #bbf7d0' }}>
                                      <Tags size={10} /> A partir de {cond.qtd} un: {fMoney(aplicarFracao(ajustarPrecoExibicao(cond.preco)))}
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
            <td style={{ ...tdStyle, textAlign: 'center', position: 'sticky', right: 0, zIndex: 20, backgroundColor: isPinnedRow ? '#f0f9ff' : (isBaixoGiro ? '#fee2e2' : '#ffffff'), boxShadow: '-2px 0 5px -2px rgba(0,0,0,0.1)' }}>
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
  };

  const shouldStickHead = isHeaderPinned || pinnedRows.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      
      {/* BARRA SUPERIOR DE FERRAMENTAS E FILTROS VISUAIS */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 8px', gap: '15px', flexWrap: 'wrap', marginBottom: '10px' }}>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', color: '#475569', fontWeight: 'bold', backgroundColor: '#f8fafc', padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', userSelect: 'none' }}>
              <input type="checkbox" checked={destacarBaixoGiro} onChange={(e) => setDestacarBaixoGiro(e.target.checked)} style={{ cursor: 'pointer', transform: 'scale(1.1)' }} />
              <AlertTriangle size={14} color={destacarBaixoGiro ? '#ef4444' : '#9ca3af'} />
              Destacar Risco de Excesso
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', color: '#475569', fontWeight: 'bold', backgroundColor: '#f8fafc', padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', userSelect: 'none' }}>
              <input type="checkbox" checked={isHeaderPinned} onChange={(e) => setIsHeaderPinned(e.target.checked)} style={{ cursor: 'pointer', transform: 'scale(1.1)' }} />
              <Pin size={14} color={isHeaderPinned ? '#2563eb' : '#9ca3af'} />
              Fixar Cabeçalho no Topo
          </label>
          
          {isComparativo && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', color: '#475569', fontWeight: 'bold', backgroundColor: '#f8fafc', padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', userSelect: 'none' }}>
                  <input type="checkbox" checked={mostrarAlertasPreco} onChange={(e) => setMostrarAlertasPreco(e.target.checked)} style={{ cursor: 'pointer', transform: 'scale(1.1)' }} />
                  <AlertTriangle size={14} color={mostrarAlertasPreco ? '#d97706' : '#9ca3af'} />
                  Destacar Preços Discrepantes (+100% ou -50%)
              </label>
          )}

          {isComparativo && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', color: '#475569', fontWeight: 'bold', backgroundColor: mostrarFracao ? '#ede9fe' : '#f8fafc', padding: '6px 12px', borderRadius: '6px', border: mostrarFracao ? '1px solid #c4b5fd' : '1px solid #e2e8f0', userSelect: 'none' }}>
                  <input type="checkbox" checked={mostrarFracao} onChange={(e) => setMostrarFracao(e.target.checked)} style={{ cursor: 'pointer', transform: 'scale(1.1)' }} />
                  <Tags size={14} color={mostrarFracao ? '#7c3aed' : '#9ca3af'} />
                  Adicionar Fração
              </label>
          )}

          {isComparativo && mostrarFracao && (() => {
              const temAlteracaoPendente = JSON.stringify(fracoesPorProduto) !== JSON.stringify(fracoesConfirmadas);
              return (
                  <button
                      type="button"
                      onClick={confirmarFracao}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', color: temAlteracaoPendente ? '#ffffff' : '#475569', fontWeight: 'bold', backgroundColor: temAlteracaoPendente ? '#7c3aed' : '#f8fafc', padding: '6px 12px', borderRadius: '6px', border: temAlteracaoPendente ? '1px solid #6d28d9' : '1px solid #e2e8f0', userSelect: 'none' }}
                      title={temAlteracaoPendente ? "Existem frações não confirmadas. Clique para confirmar e aplicar ao ranking e pedidos." : "Frações confirmadas. Alterações pendentes serão aplicadas ao clicar novamente."}
                  >
                      <Check size={14} color={temAlteracaoPendente ? '#ffffff' : '#9ca3af'} />
                      Confirmar Frações
                      {temAlteracaoPendente && <span style={{ fontSize: '10px', backgroundColor: '#ffffff', color: '#7c3aed', padding: '1px 6px', borderRadius: '10px', fontWeight: 'bold' }}>!</span>}
                  </button>
              );
          })()}
      </div>

      <div ref={scrollContainerRef} style={{ maxHeight: '75vh', overflowY: 'auto', overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px', position: 'relative' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 0 }}>
          
          <thead style={{ position: shouldStickHead ? 'sticky' : 'static', top: 0, zIndex: 50, backgroundColor: '#ffffff', boxShadow: shouldStickHead ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none' }}>
            <tr>
              <th style={{ ...thStyle, cursor: 'pointer', userSelect: 'none', minWidth: '250px', position: 'sticky', left: 0, top: isHeaderPinned ? 0 : 'auto', zIndex: isHeaderPinned ? 40 : 30, boxShadow: '2px 0 5px -2px rgba(0,0,0,0.1)', backgroundColor: isHeaderPinned ? '#f0fdf4' : '#ffffff' }} onClick={() => requestSort('nomeProduto')}><div style={{ display: 'flex', alignItems: 'center' }}>Produto <SortIcon sortKey="nomeProduto" /></div></th>
              
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
                              <button title={isPinned ? "Descongelar" : "Congelar"} onClick={() => togglePinStat('estoque')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, borderRadius: '4px', backgroundColor: isPinned ? '#bbf7d0' : 'transparent' }}><Pin size={12} color={isPinned ? '#166534' : '#9ca3af'} /></button>
                          </div>
                      </th>
                  );
              })()}

              {isItens && (
                <>
                  {colunasVisiveis.vendidoNoMes && <th style={getHeaderStyle(false, 0, '140px')} onClick={() => requestSort('vendidoNoMes')}><div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>Vendido no Mês <SortIcon sortKey="vendidoNoMes" /></div></th>}
                  {colunasVisiveis.vendidoAposUltCompra && <th style={getHeaderStyle(false, 0, '160px')} onClick={() => requestSort('vendidoAposUltCompra')}><div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>Vend. pós Últ. Compra <SortIcon sortKey="vendidoAposUltCompra" /></div></th>}
                  {colunasVisiveis.ultCompraData && <th style={getHeaderStyle(false, 0, '130px')}>Data Últ. Compra</th>}
                  {colunasVisiveis.ultCompraQtde && <th style={getHeaderStyle(false, 0, '130px')}>Qtd. Últ. Compra</th>}
                  {colunasVisiveis.ultVendaData && <th style={getHeaderStyle(false, 0, '130px')}>Data Últ. Venda</th>}
                </>
              )}

              {colunasVisiveis.ultimoPreco && (() => {
                  const isPinned = pinnedStats.includes('ultimoPreco');
                  return (
                      <th style={getHeaderStyle(isPinned, getLeftOffset('ultimoPreco', 'stat'), '150px', true)}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <button title={isPinned ? "Descongelar" : "Congelar"} onClick={() => togglePinStat('ultimoPreco')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, borderRadius: '4px', backgroundColor: isPinned ? '#bbf7d0' : 'transparent', marginRight: '6px' }}><Pin size={12} color={isPinned ? '#166534' : '#9ca3af'} /></button>
                              <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none', color: '#4f46e5' }} onClick={() => requestSort('ultimoPreco')}>Preço Últ. Compra <SortIcon sortKey="ultimoPreco" /></div>
                          </div>
                      </th>
                  );
              })()}
              
              {isComparativo && supplierOrder.filter(f => (fornecedoresVisiveis[f] ?? true)).map((f) => {
                  const isPinned = pinnedSuppliers.includes(f);
                  const leftPos = getLeftOffset(f, 'supplier');

                  return (
                      <th 
                        key={f} 
                        draggable
                        onDragStart={(e) => { setDraggedSupplier(f); e.dataTransfer.effectAllowed = 'move'; }}
                        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
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
                          ...getHeaderStyle(isPinned, leftPos, '180px'),
                          textAlign: 'center', borderLeft: '1px solid #e5e7eb',
                          backgroundColor: isPinned ? '#f0fdf4' : '#f9fafb',
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
                                      <button title={isPinned ? "Descongelar Coluna inteira" : "Congelar (Fixar coluna inteira na tela)"} onClick={() => togglePin(f)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, borderRadius: '4px', backgroundColor: isPinned ? '#bbf7d0' : '#e2e8f0', display: 'flex', alignItems: 'center' }}>
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
              
              {isItens && <th style={{ ...thStyle, textAlign: 'center', minWidth: '100px', position: 'sticky', right: 0, top: isHeaderPinned ? 0 : 'auto', zIndex: isHeaderPinned ? 40 : 20, boxShadow: '-2px 0 5px -2px rgba(0,0,0,0.1)' }}>Ações</th>}
            </tr>
            
            {pinnedItems.map(item => renderItemRow(item, true))}
          </thead>

          <tbody>
            {unpinnedItems.map(item => renderItemRow(item, false))}
          </tbody>

        </table>

        {balloonPositions.map((bp, idx) => (
          <div key={idx} style={{
            position: 'absolute', left: bp.x, top: bp.y, transform: 'translateX(-50%)',
            backgroundColor: bp.color, color: bp.textColor, fontSize: bp.fontSize,
            padding: bp.padding, borderRadius: '10px', fontWeight: 'bold', zIndex: 100,
            border: `1px solid ${bp.border}`, boxShadow: bp.shadow ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
            whiteSpace: 'nowrap', pointerEvents: 'none'
          }}>{bp.label}</div>
        ))}
      </div>

      {isItens && itensExcluidosLocal && itensExcluidosLocal.length > 0 && (
        <div style={{ borderTop: '2px solid #e5e7eb', padding: '12px', backgroundColor: '#fafafa', borderRadius: '8px' }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#6b7280', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            🗑️ Itens Excluídos ({itensExcluidosLocal.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {itensExcluidosLocal.map(item => (
              <div key={item.idItem} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#f3f4f6', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                <span style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'line-through' }}>{getNomeExibicao(item.nomeProduto)}</span>
                <button
                  type="button"
                  onClick={() => retornarItem(item.idItem)}
                  style={{ fontSize: '11px', fontWeight: 'bold', backgroundColor: '#dbeafe', color: '#1d4ed8', border: '1px solid #93c5fd', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <RefreshCcw size={12} /> Retornar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL COM OS MOTIVOS DO EXCESSO DE ESTOQUE */}
      {alertaProduto && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
              <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '450px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ margin: 0, fontSize: '18px', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <AlertTriangle size={20} /> Alertas de Compra
                      </h3>
                      <button onClick={() => setAlertaProduto(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><X size={20} /></button>
                  </div>
                  
                  <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #e2e8f0' }}>
                      {alertaProduto.nome}
                  </p>
                  
                  <ul style={{ paddingLeft: '20px', margin: 0, color: '#4b5563', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {alertaProduto.motivos.map((m, idx) => (
                          <li key={idx} style={{ lineHeight: '1.4' }}>{m}</li>
                      ))}
                  </ul>
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                      <button onClick={() => setAlertaProduto(null)} style={{ padding: '8px 16px', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>
                          Fechar
                      </button>
                  </div>
              </div>
          </div>
      )}

      {contextMenu && (
        <div style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, zIndex: 9999, backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', padding: '4px', minWidth: '160px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setValoresRecusados(prev => ({ ...prev, [`${contextMenu.itemId}-${contextMenu.fornecedor}`]: { preco: contextMenu.preco, data: new Date().toISOString() } }));
              setContextMenu(null);
            }}
            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: '13px', color: '#92400e', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#fef3c7'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'none'}
          >
            🚫 Recusar Valor
          </button>
          {valoresRecusados[`${contextMenu.itemId}-${contextMenu.fornecedor}`] && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setValoresRecusados(prev => { const n = {...prev}; delete n[`${contextMenu.itemId}-${contextMenu.fornecedor}`]; return n; });
                setContextMenu(null);
              }}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: '13px', color: '#374151', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'none'}
            >
              ✓ Desfazer Recusa
            </button>
          )}
        </div>
      )}
    </div>
  );
}