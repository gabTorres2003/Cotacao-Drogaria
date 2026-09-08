import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const baixarRelatorioGeral = (id, relatorioOrdenado, itensJaComprados, getNomeRealSempre) => {
  try {
    if (!relatorioOrdenado || relatorioOrdenado.length === 0) {
      alert('Essa cotação ainda não tem itens processados.');
      return;
    }

    const itensAgrupados = {};
    let totalGeral = 0;

    relatorioOrdenado.forEach(item => {
      const comprado = itensJaComprados[item.idItem];
      const vencedor = comprado ? comprado.fornecedor : (item.fornecedorVencedor || 'Produtos em Falta');
      const preco = comprado ? comprado.preco : (item.menorPrecoEncontrado || 0);
      const qtd = comprado ? comprado.quantidade : (item.quantidade || 0);
      const total = preco * qtd;
      const nomeCorreto = getNomeRealSempre(item.nomeProduto);

      if (!itensAgrupados[vencedor]) {
        itensAgrupados[vencedor] = { itens: [], totalFornecedor: 0 };
      }

      itensAgrupados[vencedor].itens.push([
        nomeCorreto,
        `${qtd} un`,
        preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      ]);
      itensAgrupados[vencedor].totalFornecedor += total;
      totalGeral += total;
    });

    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height; 
    doc.setFontSize(18);
    doc.text(`Relatório de Fechamento - Cotação #${id}`, 14, 20);
    doc.setFontSize(12);
    doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, 14, 30);

    let currentY = 40;

    const fornecedoresList = Object.keys(itensAgrupados).sort((a, b) => {
        if (a === 'Produtos em Falta') return 1;
        if (b === 'Produtos em Falta') return -1;
        return a.localeCompare(b);
    });

    fornecedoresList.forEach(fornecedor => {
      const data = itensAgrupados[fornecedor];

      if (currentY > pageHeight - 40) {
          doc.addPage();
          currentY = 20;
      }

      doc.setFontSize(14);
      if (fornecedor === 'Produtos em Falta') {
          doc.setTextColor(220, 38, 38); 
      } else {
          doc.setTextColor(22, 163, 74);
      }
      doc.text(`Fornecedor: ${fornecedor}`, 14, currentY);
      currentY += 5;

      autoTable(doc, {
        startY: currentY,
        head: [['Produto', 'Qtd', 'Unitário', 'Total']],
        body: data.itens,
        foot: [
          ['', '', 'TOTAL FORNECEDOR', data.totalFornecedor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })]
        ],
        theme: 'striped',
        headStyles: { fillColor: fornecedor === 'Produtos em Falta' ? [220, 38, 38] : [71, 85, 105] }, 
        footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42] },
        pageBreak: 'avoid',
        margin: { bottom: 20 },
      });

      currentY = doc.lastAutoTable.finalY + 15;
    });

    if (currentY > pageHeight - 20) {
        doc.addPage();
        currentY = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`TOTAL GERAL DA COTAÇÃO: ${totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 14, currentY);

    doc.save(`Relatorio_Fechamento_Cotacao_${id}.pdf`);
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    alert('Erro ao gerar o relatório.');
  }
};

export const gerarEspelhoResposta = (id, relatorioOrdenado, fornecedoresVisiveis, supplierOrder, getNomeRealSempre) => {
  try {
    if (!relatorioOrdenado || relatorioOrdenado.length === 0) {
      alert('Essa cotação ainda não tem itens para gerar o espelho.');
      return;
    }

    const fornecedoresAtivos = supplierOrder.filter(f => (fornecedoresVisiveis[f] ?? true));
    if (fornecedoresAtivos.length === 0) {
      alert('Nenhum fornecedor visível para gerar o espelho.');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape' });
    const pageWidth = doc.internal.pageSize.width;

    doc.setFontSize(16);
    doc.text(`Espelho da Resposta - Cotação #${id}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, 14, 22);

    const head = [['Produto', 'Qtd', ...fornecedoresAtivos.map(f => f.length > 18 ? f.substring(0, 16) + '..' : f)]];
    const body = [];
    const foot = [['', 'TOTAL', ...fornecedoresAtivos.map(() => '')]];

    const totaisPorForn = {};
    fornecedoresAtivos.forEach(f => { totaisPorForn[f] = 0; });

    relatorioOrdenado.forEach(item => {
      const nome = getNomeRealSempre(item.nomeProduto);
      const qtd = item.quantidade || 0;
      const row = [nome, qtd];

      let melhorPreco = Infinity;
      let melhorForn = null;

      fornecedoresAtivos.forEach(f => {
        const preco = item.precosPorFornecedor?.[f] || 0;
        row.push(preco > 0 ? preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-');
        if (preco > 0 && preco < melhorPreco) {
          melhorPreco = preco;
          melhorForn = f;
        }
      });

      if (melhorForn && totaisPorForn[melhorForn] !== undefined) {
        totaisPorForn[melhorForn] += melhorPreco * qtd;
      }

      body.push(row);
    });

    fornecedoresAtivos.forEach((f, i) => {
      foot[0][i + 2] = totaisPorForn[f].toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    });

    const columnStyles = {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 15, halign: 'center' },
    };
    fornecedoresAtivos.forEach((f, i) => {
      columnStyles[i + 2] = { halign: 'center', cellWidth: Math.floor((pageWidth - 60) / fornecedoresAtivos.length) };
    });

    autoTable(doc, {
      startY: 28,
      head,
      body,
      foot,
      theme: 'grid',
      headStyles: { fillColor: [71, 85, 105], fontSize: 8, halign: 'center' },
      bodyStyles: { fontSize: 7 },
      footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 8 },
      columnStyles,
      margin: { left: 14, right: 14 },
    });

    doc.save(`Espelho_Resposta_Cotacao_${id}.pdf`);
  } catch (error) {
    console.error('Erro ao gerar espelho PDF:', error);
    alert('Erro ao gerar o espelho de resposta.');
  }
};

export const gerarMensagemWhatsApp = (id, relatorioOrdenado, getNomeRealSempre) => {
  if (!relatorioOrdenado || relatorioOrdenado.length === 0) {
    alert('Essa cotação ainda não tem itens.');
    return null;
  }

  let msg = `*Resumo da Cotação #${id}*\n`;
  msg += `Data: ${new Date().toLocaleDateString('pt-BR')}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;

  let totalGeral = 0;

  relatorioOrdenado.forEach((item, idx) => {
    const nome = getNomeRealSempre(item.nomeProduto);
    const qtd = item.quantidade || 0;
    const vencedor = item.fornecedorVencedor || '-';
    const preco = item.menorPrecoEncontrado || 0;
    const total = preco * qtd;
    totalGeral += total;

    msg += `${idx + 1}. *${nome}*\n`;
    msg += `   Qtd: ${qtd} | Vencedor: ${vencedor}\n`;
    if (preco > 0) {
      msg += `   Valor: ${preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (Total: ${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})\n`;
    } else {
      msg += `   *SEM PROPOSTA*\n`;
    }
    msg += `\n`;
  });

  msg += `━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `*TOTAL GERAL: ${totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}*\n`;

  return msg;
};

export const gerarEspelhoRespostaFornecedor = (idCotacao, nomeFornecedor, itens, precos, quantidades, getNomeReal) => {
  try {
    if (!itens || itens.length === 0) {
      alert('Nenhum item disponível para gerar o espelho.');
      return;
    }

    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;

    doc.setFontSize(16);
    doc.text(`Espelho da Resposta`, 14, 15);
    doc.setFontSize(11);
    doc.text(`Cotação #${idCotacao} — ${nomeFornecedor}`, 14, 23);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, 14, 29);
    doc.setTextColor(0);

    const head = [['Produto', 'Qtd Solic.', 'Qtd Disp.', 'Preço Unit.', 'Total']];
    const body = [];
    let totalGeral = 0;

    itens.forEach(item => {
      const nome = getNomeReal(item.nomeProduto);
      const qtdSolicitada = item.quantidade || 0;
      const preco = precos[item.idItem] || 0;
      const qtdDisp = quantidades[item.idItem] !== undefined ? quantidades[item.idItem] : qtdSolicitada;
      const total = preco * qtdDisp;
      totalGeral += total;

      body.push([
        nome,
        `${qtdSolicitada} un`,
        `${qtdDisp} un`,
        preco > 0 ? preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-',
        preco > 0 ? total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'
      ]);
    });

    autoTable(doc, {
      startY: 34,
      head,
      body,
      foot: [['', '', '', 'TOTAL', totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })]],
      theme: 'grid',
      headStyles: { fillColor: [71, 85, 105], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 9 },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          doc.setFontSize(10);
          doc.text(`Espelho da Resposta — Cotação #${idCotacao} — ${nomeFornecedor} (página ${data.pageNumber})`, 14, 10);
        }
      }
    });

    doc.save(`Espelho_Resposta_Cotacao_${idCotacao}_${nomeFornecedor.replace(/\s+/g, '_')}.pdf`);
  } catch (error) {
    console.error('Erro ao gerar espelho do fornecedor:', error);
    alert('Erro ao gerar o espelho de resposta.');
  }
};

export const gerarMensagemEspelhoWhatsApp = (idCotacao, nomeFornecedor, itens, precos, quantidades, getNomeReal) => {
  if (!itens || itens.length === 0) {
    alert('Nenhum item disponível.');
    return null;
  }

  let msg = `*Proposta — Cotação #${idCotacao}*\n`;
  msg += `Fornecedor: *${nomeFornecedor}*\n`;
  msg += `Data: ${new Date().toLocaleDateString('pt-BR')}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;

  let totalGeral = 0;

  itens.forEach((item, idx) => {
    const nome = getNomeReal(item.nomeProduto);
    const qtd = item.quantidade || 0;
    const preco = precos[item.idItem] || 0;
    const qtdDisp = quantidades[item.idItem] !== undefined ? quantidades[item.idItem] : qtd;
    const total = preco * qtdDisp;
    totalGeral += total;

    msg += `${idx + 1}. *${nome}*\n`;
    msg += `   Qtd: ${qtd} | Disp: ${qtdDisp}\n`;
    if (preco > 0) {
      msg += `   Valor: ${preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (Total: ${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})\n`;
    } else {
      msg += `   *SEM PREÇO*\n`;
    }
    msg += `\n`;
  });

  msg += `━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `*TOTAL: ${totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}*\n`;

  return msg;
};