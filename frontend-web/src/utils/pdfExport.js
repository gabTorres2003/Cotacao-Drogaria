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