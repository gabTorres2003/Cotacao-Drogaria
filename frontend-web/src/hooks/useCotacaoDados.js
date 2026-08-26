import { useState, useEffect } from 'react';
import api from '../services/api';

export function useCotacaoDados(id) {
  const [statusCotacao, setStatusCotacao] = useState('ABERTA');
  const [setorCotacao, setSetorCotacao] = useState('AMBOS');
  const [relatorio, setRelatorio] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [promocoes, setPromocoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [decisaoCompra, setDecisaoCompra] = useState({});
  const [dicionarioDiversos, setDicionarioDiversos] = useState({});
  const [fornecedoresLista, setFornecedoresLista] = useState([]);
  const [itensJaComprados, setItensJaComprados] = useState({});
  const [vinculos, setVinculos] = useState([]);

  useEffect(() => {
    if (!id) return;
    carregarCotacao();
    carregarRelatorio();
    carregarDicionarioDiversos();
    carregarFornecedores();
    carregarPedidosDaCotacao();
    carregarVinculos();
  }, [id]);

  const carregarCotacao = async () => {
    try {
      const res = await api.get(`/api/cotacao/${id}`);
      if (res.data) {
        setStatusCotacao(res.data.status || 'ABERTA');
        setSetorCotacao(res.data.setor || 'AMBOS');
      }
    } catch (error) {
      console.error("Erro ao carregar status da cotação", error);
    }
  };

  const carregarVinculos = async () => {
    try {
      const res = await api.get(`/api/cotacao-fornecedor/cotacao/${id}`);
      setVinculos(res.data || []);
    } catch (error) {
      console.error("Erro ao carregar vínculos", error);
    }
  };

  const removerVinculo = async (idVinculo) => {
    if (window.confirm("Remover o acesso deste fornecedor a esta cotação? Ele não poderá mais visualizar ou responder.")) {
      try {
        await api.delete(`/api/cotacao-fornecedor/${idVinculo}`);
        carregarVinculos();
      } catch (error) {
        alert("Erro ao remover vínculo.");
      }
    }
  };

  const carregarPedidosDaCotacao = async () => {
    try {
      const response = await api.get(`/api/pedidos/cotacao/${id}`);
      const pedidos = Array.isArray(response.data) ? response.data : [];
      const mapComprados = {};
      
      pedidos.forEach(p => {
        if (p.status === 'CANCELADO') return;
        (p.itens || []).forEach(item => {
          const idItemCotacao = item.itemCotacao?.id || item.itemCotacaoId;
          if (idItemCotacao) {
            mapComprados[idItemCotacao] = {
              id: p.id,
              fornecedor: p.fornecedor?.nome || p.fornecedorNome || 'Pedido Manual',
              preco: item.valorUnitarioPedido,
              quantidade: item.quantidadePedida
            };
          }
        });
      });
      setItensJaComprados(mapComprados);
    } catch (error) {
      console.error("Erro ao carregar pedidos da cotação", error);
    }
  };

  const carregarFornecedores = async () => {
    try {
      const response = await api.get('/api/fornecedor');
      setFornecedoresLista(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Erro ao carregar lista de fornecedores gerais", error);
    }
  };

  const carregarDicionarioDiversos = async () => {
    try {
      const response = await api.get('/api/diversos');
      const mapDiversos = {};
      (Array.isArray(response.data) ? response.data : []).forEach(item => {
        if (item.codigoDiversos) {
          const codigoPuro = String(item.codigoDiversos).toUpperCase().replace(/\s/g, '');
          mapDiversos[codigoPuro] = item.produto;
          if (!codigoPuro.startsWith('DIVERSOS')) {
            mapDiversos[`DIVERSOS${codigoPuro}`] = item.produto;
          }
        }
      });
      setDicionarioDiversos(mapDiversos);
    } catch (error) {
      console.error("Erro ao carregar dicionário de diversos:", error);
    }
  };

  const carregarRelatorio = async () => {
    setLoading(true);
    try {
      const [response, resPromos] = await Promise.all([
        api.get(`/api/comparativo/relatorio/${id}`),
        api.get(`/api/cotacao/sugestoes/${id}`).catch(() => ({ data: [] }))
      ]);
      const data = Array.isArray(response.data) ? response.data.filter(i => !i.excluido) : [];
      setRelatorio(data);
      setPromocoes(Array.isArray(resPromos.data) ? resPromos.data : []);

      const nomes = new Set();
      const decisaoInicial = {};

      data.forEach((item) => {
        if (item.precosPorFornecedor) {
          Object.keys(item.precosPorFornecedor).forEach((n) => nomes.add(n));
        }
        if (item.fornecedorVencedor && item.fornecedorVencedor !== 'Sem ofertas') {
          decisaoInicial[item.idItem] = item.fornecedorVencedor;
        }
      });

      setFornecedores(Array.from(nomes));
      setDecisaoCompra(decisaoInicial);
    } catch (error) {
      console.error("Erro ao carregar detalhes", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    statusCotacao, setStatusCotacao,
    setorCotacao,
    relatorio, setRelatorio,
    fornecedores, setFornecedores,
    promocoes,
    loading,
    decisaoCompra, setDecisaoCompra,
    dicionarioDiversos,
    fornecedoresLista,
    itensJaComprados, setItensJaComprados,
    vinculos,
    carregarRelatorio,
    carregarCotacao,
    carregarVinculos,
    carregarPedidosDaCotacao,
    removerVinculo
  };
}