import { useState, useMemo, useEffect } from 'react';

export function useCotacaoFiltros(relatorio, itensJaComprados, modoVisualizacao, subAbaItens, dicionarioDiversos, fornecedores) {
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroOrigem, setFiltroOrigem] = useState('TODOS');
  const [filtroPropostas, setFiltroPropostas] = useState('TODOS');
  const [mostrarNomeReal, setMostrarNomeReal] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'idItem', direction: 'asc' });

  const [colunasVisiveis, setColunasVisiveis] = useState({
    quantidade: true,
    estoque: true,
    vendidoNoMes: true,
    vendidoAposUltCompra: true,
    ultCompraData: true,
    ultCompraQtde: true,
    ultVendaData: true,
    ultimoPreco: true
  });
  
  const [fornecedoresVisiveis, setFornecedoresVisiveis] = useState({});

  useEffect(() => {
    setFornecedoresVisiveis(prev => {
        const novoEstado = { ...prev };
        let changed = false;
        fornecedores.forEach(f => {
            if (novoEstado[f] === undefined) {
                novoEstado[f] = true;
                changed = true;
            }
        });
        return changed ? novoEstado : prev; 
    });
  }, [fornecedores]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getNomeRealSempre = (nomeProduto) => {
    if (!nomeProduto) return '';
    const codigoLimpo = String(nomeProduto).toUpperCase().replace(/\s/g, '');
    return dicionarioDiversos[codigoLimpo] || String(nomeProduto); 
  };

  const getNomeExibicao = (nomeProduto) => {
    if (!nomeProduto) return '';
    if (mostrarNomeReal) {
      return getNomeRealSempre(nomeProduto);
    }
    return nomeProduto;
  };

  const isDiversos = (nome) => nome && String(nome).toUpperCase().includes('DIVERSOS');

  const getValorOrdenacao = (item, key) => {
    if (key === 'idItem') return item.idItem || 0;
    if (key === 'nomeProduto') return getNomeExibicao(item.nomeProduto);
    if (key === 'origemItem') return item.origemItem || 'Geral';
    return item[key] ?? 0;
  };

  const relatorioOrdenado = useMemo(() => {
    let ordenavel = [...relatorio];
    ordenavel.sort((a, b) => {
      const valA = getValorOrdenacao(a, sortConfig.key);
      const valB = getValorOrdenacao(b, sortConfig.key);

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return ordenavel;
  }, [relatorio, sortConfig, dicionarioDiversos]);

  const relatorioExibicao = useMemo(() => {
    return relatorioOrdenado.filter(item => {
      const isComprado = !!itensJaComprados[item.idItem];
      
      if (modoVisualizacao === 'itens' || modoVisualizacao === 'comparativo') {
          if (subAbaItens === 'pendentes' && isComprado) return false;
          if (subAbaItens === 'comprados' && !isComprado) return false;
      }

      const matchBusca = getNomeExibicao(item.nomeProduto).toLowerCase().includes(termoBusca.toLowerCase());
      
      const origemSegura = String(item.origemItem || 'Geral').toUpperCase();
      const filtroOrigemUpper = filtroOrigem.toUpperCase();
      const matchOrigem = filtroOrigem === 'TODOS' || origemSegura.includes(filtroOrigemUpper);
      
      const precos = Object.values(item.precosPorFornecedor || {});
      const temPropostaValida = precos.some(p => p > 0);
      const matchPropostas = 
        filtroPropostas === 'TODOS' || 
        (filtroPropostas === 'COM_PROPOSTAS' && temPropostaValida) || 
        (filtroPropostas === 'SEM_PROPOSTAS' && !temPropostaValida);

      return matchBusca && matchOrigem && matchPropostas;
    });
  }, [relatorioOrdenado, termoBusca, filtroOrigem, filtroPropostas, itensJaComprados, modoVisualizacao, subAbaItens, mostrarNomeReal]);

  return {
    termoBusca, setTermoBusca,
    filtroOrigem, setFiltroOrigem,
    filtroPropostas, setFiltroPropostas,
    mostrarNomeReal, setMostrarNomeReal,
    sortConfig, requestSort,
    colunasVisiveis, setColunasVisiveis,
    fornecedoresVisiveis, setFornecedoresVisiveis,
    relatorioOrdenado,
    relatorioExibicao,
    getNomeRealSempre,
    getNomeExibicao,
    isDiversos
  };
}