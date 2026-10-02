import { useState, useEffect, useMemo, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Sidebar from '../components/layout/Sidebar';
import DevolucaoModal from '../components/DevolucaoModal';
import ModalProdutoNaoSolicitado from '../components/ModalProdutoNaoSolicitado';
import { ArrowLeft, CheckCircle, ArrowUpDown, Edit2, Check, FileText, Tag, AlertTriangle, Package, Truck } from 'lucide-react';

export default function PedidoConferencia() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pedido, setPedido] = useState(null);
  const [conferencia, setConferencia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'nomeProduto', direction: 'asc' });
  const [numeroNota, setNumeroNota] = useState('');
  const [showModalDestinoFaltantes, setShowModalDestinoFaltantes] = useState(false);
  const [showDevolucaoModal, setShowDevolucaoModal] = useState(false);
  const [showProdutoNaoSolicitadoModal, setShowProdutoNaoSolicitadoModal] = useState(false);

  useEffect(() => {
    carregarPedido();
  }, [id]);

  const carregarPedido = async () => {
    try {
      const response = await api.get(`/api/pedidos/${id}`);
      setPedido(response.data);
      if (response.data.itens) {
        setConferencia(
          response.data.itens.map(item => {
            const qtdJaRecebida = item.quantidadeReal > 0 ? item.quantidadeReal : 0;
            const totalmenteRecebido = qtdJaRecebida >= item.quantidadePedida;
            return {
              id: item.id,
              quantidadeJaRecebida: qtdJaRecebida,
              valorUnitarioReal: item.valorUnitarioReal > 0 ? item.valorUnitarioReal : '',
              statusRecebimento: item.statusRecebimento || 'OK',
              conferido: totalmenteRecebido,
              totalmenteRecebido,
              produtoRecebido: item.produtoRecebido || '',
              observacaoIncorreto: item.observacaoDevolucao || '',
              foiCobrado: (item.observacaoDevolucao || '').includes('Cobrado na nota')
            };
          })
        );
      }
    } catch (error) {
      console.error('Erro ao carregar pedido para conferência:', error);
      alert('Erro ao carregar dados do pedido.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (idItem, field, value) => {
    setConferencia(prev => prev.map(item => {
        if (item.id === idItem) {
            let newItem = { ...item, [field]: value };
            if (field === 'statusRecebimento') {
                if (value === 'FALTANTE') {
                    newItem.quantidadeRecebidaAgora = 0;
                }
                if (value !== 'FALTANTE') {
                    newItem.foiCobrado = false;
                }
                if (value !== 'INCORRETO') {
                    newItem.produtoRecebido = '';
                    newItem.observacaoIncorreto = '';
                }
            }
            return newItem;
        }
        return item;
    }));
  };

  const toggleConferido = (idItem) => {
    setConferencia(prev => prev.map(item => {
      if (item.id === idItem) {
        if (!item.conferido) {
          const isFaltante = item.statusRecebimento === 'FALTANTE';
          if (!isFaltante) {
            const qtdNova = item.quantidadeRecebidaAgora === '' || item.quantidadeRecebidaAgora === undefined ? 0 : Number(item.quantidadeRecebidaAgora);
            if (qtdNova <= 0 || item.valorUnitarioReal === '') {
              alert('Preencha a quantidade e o valor unitário da nota antes de confirmar este item.');
              return item;
            }
          }
        }
        return { ...item, conferido: !item.conferido };
      }
      return item;
    }));
  };

  const adicionarProdutoNaoSolicitado = (dados) => {
    const novoItem = {
      id: `extra_${Date.now()}`,
      nomeProduto: dados.nomeProduto,
      quantidadePedida: 0,
      quantidadeJaRecebida: 0,
      valorUnitarioReal: dados.valorUnitario,
      valorUnitarioPedido: 0,
      statusRecebimento: 'OK',
      conferido: true,
      totalmenteRecebido: false,
      quantidadeRecebidaAgora: dados.quantidade,
      produtoRecebido: '',
      observacaoIncorreto: '',
      foiCobrado: false,
      isNaoSolicitado: true,
      classificacaoNaoSolicitado: dados.classificacao
    };
    setConferencia(prev => [...prev, novoItem]);
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const itensOrdenados = useMemo(() => {
    if (!pedido?.itens) return [];
    const itensNormais = [...pedido.itens];
    const itensExtras = conferencia.filter(c => c.isNaoSolicitado).map(c => ({
      id: c.id,
      nomeProduto: c.nomeProduto,
      quantidadePedida: 0,
      quantidadeReal: 0,
      valorUnitarioPedido: 0,
      valorUnitarioReal: c.valorUnitarioReal,
      statusRecebimento: c.statusRecebimento,
      isNaoSolicitado: true
    }));
    let ordenavel = [...itensNormais, ...itensExtras];
    ordenavel.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];

      if (sortConfig.key === 'nomeProduto') {
        valA = a.nomeProduto || a.itemCotacao?.nomeProduto || '';
        valB = b.nomeProduto || b.itemCotacao?.nomeProduto || '';
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return ordenavel;
  }, [pedido, sortConfig, conferencia]);

  const itensHabilitados = useMemo(
    () => conferencia.filter(c => !c.totalmenteRecebido),
    [conferencia]
  );

  const itensNaoConferidos = useMemo(
    () => conferencia.filter(c => !c.conferido && !c.totalmenteRecebido && !c.isNaoSolicitado),
    [conferencia]
  );

  const conferirTodos = () => {
    let confirmados = 0;
    let erros = 0;
    setConferencia(prev => prev.map(item => {
      if (item.conferido || item.totalmenteRecebido || item.isNaoSolicitado) return item;
      if (item.statusRecebimento === 'FALTANTE') {
        return { ...item, conferido: true };
      }
      const qtdNova = item.quantidadeRecebidaAgora === '' || item.quantidadeRecebidaAgora === undefined ? 0 : Number(item.quantidadeRecebidaAgora);
      if (qtdNova > 0 && item.valorUnitarioReal !== '' && item.valorUnitarioReal !== undefined) {
        confirmados++;
        return { ...item, conferido: true };
      }
      erros++;
      return item;
    }));
    if (confirmados > 0 && erros === 0) {
      alert(`${confirmados} item(ns) conferido(s) com sucesso!`);
    } else if (confirmados > 0) {
      alert(`${confirmados} item(ns) conferido(s). ${erros} item(ns) sem quantidade ou preço preenchidos foram ignorados.`);
    } else {
      alert('Nenhum item pôde ser conferido automaticamente. Preencha a quantidade e o valor unitário de pelo menos um item.');
    }
  };

  // Itens que ficaram sem destino após esta conferência (não recebidos integralmente,
  // não cobrados e sem divergência de devolução). Exigem escolha ao finalizar.
  const getItensSemDestino = () => {
    if (!pedido?.itens) return [];
    return conferencia.filter(c => {
      if (c.isNaoSolicitado || c.totalmenteRecebido || c.foiCobrado) return false;
      if (c.statusRecebimento === 'INCORRETO' || c.statusRecebimento === 'AVARIADO') return false;
      const itemPedido = pedido.itens.find(i => i.id === c.id);
      if (!itemPedido) return false;
      const pedida = itemPedido.quantidadePedida || 0;
      const jaRecebida = c.quantidadeJaRecebida || 0;
      const agora = (c.quantidadeRecebidaAgora === '' || c.quantidadeRecebidaAgora === undefined)
        ? 0
        : Number(c.quantidadeRecebidaAgora);
      return (jaRecebida + agora) < pedida;
    });
  };

  const getNomeItemConferencia = (c) => {
    const itemPedido = pedido?.itens?.find(i => i.id === c.id);
    return c.nomeProduto || itemPedido?.nomeProduto || itemPedido?.itemCotacao?.nomeProduto || 'Produto Desconhecido';
  };

  const enviarRecebimento = async (acao) => {
    if (!numeroNota.trim()) {
      alert('Por favor, preencha o Número da NF antes de salvar.');
      return;
    }

    const itensPendentes = conferencia.filter(c => !c.conferido && !c.isNaoSolicitado);
    if (itensPendentes.length > 0) {
      alert(`Atenção: Você precisa confirmar (conferir) todos os itens individualmente na tabela. Restam ${itensPendentes.length} itens pendentes de conferência.`);
      return;
    }

    const semDestino = getItensSemDestino();
    const qtdSemDestino = semDestino.length;

    const itensParaEnviar = conferencia.filter(c => c.conferido && !c.isNaoSolicitado);

    setSalvando(true);

    let teveProblemas = false;

    const payload = {
      numeroNota: numeroNota.trim(),
      acaoItensFaltantes: acao || null,
      itens: itensParaEnviar.map(item => {
        const qtdNova = item.quantidadeRecebidaAgora === '' || item.quantidadeRecebidaAgora === undefined
          ? 0
          : Number(item.quantidadeRecebidaAgora);

        if (item.statusRecebimento === 'INCORRETO' || item.statusRecebimento === 'AVARIADO' ||
            (item.statusRecebimento === 'FALTANTE' && item.foiCobrado)) {
          teveProblemas = true;
        }

        return {
          id: item.id,
          quantidadeReal: (item.quantidadeJaRecebida || 0) + qtdNova,
          quantidadeRecebidaAgora: qtdNova,
          valorUnitarioReal: Number(item.valorUnitarioReal),
          statusRecebimento: item.statusRecebimento,
          foiCobrado: !!item.foiCobrado,
          observacaoDevolucao: item.statusRecebimento !== 'OK'
            ? (item.statusRecebimento === 'INCORRETO'
                ? `Produto errado: ${item.produtoRecebido || 'não informado'}. ${item.observacaoIncorreto || ''}`.trim()
                : (item.foiCobrado
                    ? 'Faturado mas não entregue - Cobrado na nota'
                    : (acao === 'AGUARDAR'
                        ? 'Aguardando entrega - Entrega Parcial'
                        : 'Divergência marcada na conferência cega')))
            : ''
        };
      })
    };

    try {
      const response = await api.put(`/api/pedidos/${id}/receber`, payload);
      const novoStatus = response.data?.status;

      const itensNaoSolicitados = conferencia.filter(c => c.isNaoSolicitado && c.conferido);
      if (itensNaoSolicitados.length > 0) {
        try {
          const payloadNS = itensNaoSolicitados.map(c => ({
            nomeProduto: c.nomeProduto,
            quantidade: c.quantidadeRecebidaAgora || 0,
            valorUnitarioReal: c.valorUnitarioReal || 0,
            observacaoDevolucao: c.classificacaoNaoSolicitado || 'Produto Não Solicitado'
          }));
          await api.post(`/api/pedidos/${id}/itens-nao-solicitados`, payloadNS);
        } catch (eNS) {
          console.error('Erro ao salvar itens não solicitados:', eNS);
        }
      }

      if (teveProblemas) {
          const detalhes = [];
          if (acao === 'AGUARDAR') detalhes.push(`${qtdSemDestino} produto(s) faltante(s) ficaram em aguardo (Entrega Parcial).`);
          if (acao === 'RETORNAR_COTACAO' && qtdSemDestino > 0) detalhes.push(`${qtdSemDestino} produto(s) faltante(s) retornaram para a cotação de origem.`);
          const msgDetalhes = detalhes.length > 0 ? `\n\n${detalhes.join('\n')}` : '';
          if (window.confirm(`Conferência salva com sucesso! O sistema identificou que você marcou faltas, avarias ou itens incorretos.${msgDetalhes}\n\nDeseja registrar a devolução / abatimento agora?`)) {
              setShowDevolucaoModal(true);
              return;
          }
      } else if (acao === 'AGUARDAR') {
          alert(`Entrega parcial registrada com sucesso!\n\n${qtdSemDestino} produto(s) ficaram em aguardo e o pedido permanece em "Entrega Parcial".\n\nQuando o volume chegar, finalize a conferência normalmente; se não chegar, confirme a falta para retornar os produtos à cotação de origem automaticamente.`);
      } else if (acao === 'RETORNAR_COTACAO') {
          alert(`Conferência finalizada com sucesso!\n\n${qtdSemDestino} produto(s) retornaram automaticamente para a cotação de origem (ela poderá estar encerrada ou não).`);
      } else {
          alert('Conferência finalizada com sucesso! Todos os itens chegaram corretamente.');
      }

      navigate(`/pedidos/${id}`);
    } catch (error) {
      console.error('Erro ao finalizar conferência:', error);
      alert('Ocorreu um erro ao processar o recebimento do pedido.');
    } finally {
      setSalvando(false);
      setShowModalDestinoFaltantes(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!numeroNota.trim()) {
      alert('Por favor, preencha o Número da NF antes de salvar.');
      return;
    }
    const itensPendentes = conferencia.filter(c => !c.conferido && !c.isNaoSolicitado);
    if (itensPendentes.length > 0) {
      alert(`Atenção: Você precisa confirmar (conferir) todos os itens individualmente na tabela. Restam ${itensPendentes.length} itens pendentes de conferência.`);
      return;
    }
    if (getItensSemDestino().length > 0) {
      setShowModalDestinoFaltantes(true);
      return;
    }
    enviarRecebimento(null);
  };

  const confirmarDestinoFaltantes = (acao) => {
    setShowModalDestinoFaltantes(false);
    enviarRecebimento(acao);
  };

  const fMoney = (valor) => {
    if (valor == null) return '-';
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (loading) return <div className="layout"><Sidebar /><main className="main-content"><p>Carregando...</p></main></div>;
  if (!pedido) return <div className="layout"><Sidebar /><main className="main-content"><p>Pedido não encontrado.</p></main></div>;

  const fornecedorNome = pedido.fornecedor?.nome || pedido.fornecedorNome || 'Fornecedor Desconhecido';
  const isEntregaParcial = pedido.status === 'ENTREGA_PARCIAL';
  const nfAnterior = pedido.numeroNota;

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '24px', marginBottom: '5px' }}>Conferência de Entrega (Cega)</h1>
            <p style={{ color: '#6b7280' }}>Pedido #{pedido.id} - {fornecedorNome}</p>
          </div>
          <button
            style={styles.btnVoltar}
            onClick={() => navigate(`/pedidos/${id}`)}
          >
            <ArrowLeft size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            Voltar aos Detalhes
          </button>
        </header>

        <div style={styles.card}>
          {isEntregaParcial && (
            <div style={{ backgroundColor: '#fff7ed', borderLeft: '4px solid #f97316', padding: '12px 16px', marginBottom: '20px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <Truck size={20} color="#c2410c" />
              <div style={{ flex: 1, fontSize: '14px', color: '#7c2d12' }}>
                <strong>Entrega Parcial em andamento.</strong>
                {nfAnterior && (<span> NF(ns) já registrada(s): <strong>{nfAnterior}</strong>. </span>)}
                <span>Continue lançando o próximo volume abaixo — os itens já totalmente recebidos ficam desabilitados.</span>
              </div>
            </div>
          )}

          <div style={{ backgroundColor: '#fffbeb', borderLeft: '4px solid #f59e0b', padding: '12px 16px', marginBottom: '20px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#b45309', fontWeight: '500' }}>
              <strong>Atenção:</strong> Digite a quantidade deste volume e o valor unitário exatamente como constam na NF. Caso haja algum problema com o produto (Falta, Avariado), selecione o Status correto ao lado.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '8px', marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#3b82f6"/> Dados da Nota Fiscal Recebida
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px', color: '#475569' }}>Número da NF *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 895886"
                    value={numeroNota}
                    onChange={e => setNumeroNota(e.target.value)}
                    style={styles.inputTexto}
                  />
                </div>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '0 4px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
                    {itensNaoConferidos.length > 0 ? `${itensNaoConferidos.length} item(ns) pendente(s)` : 'Todos os itens conferidos'}
                  </span>
                  {itensNaoConferidos.length > 0 && (
                    <button
                      type="button"
                      onClick={conferirTodos}
                      style={{ padding: '6px 14px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 1px 2px rgba(16, 185, 129, 0.3)' }}
                    >
                      <Check size={14} /> Conferir Todos
                    </button>
                  )}
                </div>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ ...styles.th, cursor: 'pointer', userSelect: 'none', minWidth: '200px' }} onClick={() => requestSort('nomeProduto')}>
                        Produto <ArrowUpDown size={14} style={{ verticalAlign: 'middle', marginLeft: '4px', color: '#9ca3af' }} />
                      </th>
                      <th style={{ ...styles.th, width: '100px', textAlign: 'center', backgroundColor: '#f9fafb', color: '#1e293b' }}>Qtd (Pedida)</th>
                      <th style={{ ...styles.th, width: '140px', textAlign: 'center', backgroundColor: '#ecfeff', color: '#155e75' }}>Já Recebido</th>
                      <th style={{ ...styles.th, width: '130px', textAlign: 'center', backgroundColor: '#f0fdf4', color: '#166534' }}>Qtd nesta NF</th>
                      <th style={{ ...styles.th, width: '130px', textAlign: 'center', backgroundColor: '#f0fdf4', color: '#166534' }}>Unitário (NF)</th>
                      <th style={{ ...styles.th, width: '220px', textAlign: 'center' }}>Condição / Problema</th>
                      <th style={{ ...styles.th, width: '120px', textAlign: 'center' }}>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itensOrdenados.map((item) => {
                      const confState = conferencia.find(c => c.id === item.id) || {};
                      const isConferido = confState.conferido;
                      const hasProblema = confState.statusRecebimento !== 'OK';
                      const totalmenteRecebido = confState.totalmenteRecebido;
                      const qtdJaRecebida = confState.quantidadeJaRecebida || 0;

                      return (
                        <Fragment key={item.id}>
                        <tr style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: totalmenteRecebido ? '#f0fdf4' : (isConferido ? '#ecfdf5' : 'white'), transition: 'background-color 0.3s' }}>
                          <td style={styles.td}>
                            <strong style={{ color: totalmenteRecebido ? '#166534' : '#111827', display: 'block' }}>
                              {item.nomeProduto || item.itemCotacao?.nomeProduto || 'Produto Desconhecido'}
                            </strong>
                            {confState.isNaoSolicitado && (
                              <div style={{ fontSize: '10px', color: '#6b21a8', backgroundColor: '#f3e8ff', padding: '2px 6px', borderRadius: '4px', marginTop: '4px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px', border: '1px solid #d8b4fe' }}>
                                <Tag size={10} /> Não Solicitado
                              </div>
                            )}
                            {item.condicaoAplicada && (
                              <div style={{ fontSize: '10px', color: '#166534', backgroundColor: '#dcfce7', padding: '2px 6px', borderRadius: '4px', marginTop: '4px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px', border: '1px solid #bbf7d0' }}>
                                <Tag size={10} /> Condição: {item.qtdCondicao} un por {fMoney(item.precoCondicao)}
                              </div>
                            )}
                            {totalmenteRecebido && (
                              <div style={{ fontSize: '10px', color: '#166534', backgroundColor: '#bbf7d0', padding: '2px 6px', borderRadius: '4px', marginTop: '4px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Package size={10} /> Totalmente recebido
                              </div>
                            )}
                          </td>

                          <td style={{ ...styles.td, textAlign: 'center', padding: '10px 6px', color: '#475569', fontWeight: '600' }}>
                            {item.quantidadePedida} un
                          </td>

                          <td style={{ ...styles.td, textAlign: 'center', padding: '10px 6px', backgroundColor: '#ecfeff', color: '#155e75', fontWeight: 'bold' }}>
                            {qtdJaRecebida > 0 ? `${qtdJaRecebida} de ${item.quantidadePedida}` : '-'}
                          </td>

                          <td style={{ ...styles.td, textAlign: 'center', padding: '10px 6px' }}>
                            <input
                              type="number"
                              min="0"
                              disabled={totalmenteRecebido || isConferido}
                              style={{ ...styles.inputField, backgroundColor: (totalmenteRecebido || isConferido) ? 'transparent' : '#f0fdf4', borderColor: (totalmenteRecebido || isConferido) ? 'transparent' : '#cbd5e1' }}
                              placeholder="0"
                              value={confState.quantidadeRecebidaAgora ?? ''}
                              onChange={(e) => handleInputChange(item.id, 'quantidadeRecebidaAgora', e.target.value)}
                            />
                          </td>

                          <td style={{ ...styles.td, textAlign: 'center', padding: '10px 6px' }}>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              disabled={totalmenteRecebido || isConferido}
                              placeholder="0,00"
                              style={{ ...styles.inputField, backgroundColor: (totalmenteRecebido || isConferido) ? 'transparent' : '#f0fdf4', borderColor: (totalmenteRecebido || isConferido) ? 'transparent' : '#cbd5e1' }}
                              value={confState.valorUnitarioReal ?? ''}
                              onChange={(e) => handleInputChange(item.id, 'valorUnitarioReal', e.target.value)}
                            />
                          </td>

                          <td style={{ ...styles.td, textAlign: 'center', padding: '10px 6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', border: `1px solid ${hasProblema ? '#fca5a5' : '#cbd5e1'}`, borderRadius: '6px', padding: '2px', backgroundColor: hasProblema ? '#fef2f2' : 'white' }}>
                                {hasProblema && <AlertTriangle size={16} color="#ef4444" style={{ marginLeft: '6px' }} />}
                                <select
                                    disabled={totalmenteRecebido || isConferido}
                                    style={{ width: '100%', padding: '8px', border: 'none', background: 'transparent', outline: 'none', color: hasProblema ? '#b91c1c' : '#374151', fontWeight: hasProblema ? 'bold' : 'normal', cursor: (totalmenteRecebido || isConferido) ? 'not-allowed' : 'pointer' }}
                                    value={confState.statusRecebimento || 'OK'}
                                    onChange={(e) => handleInputChange(item.id, 'statusRecebimento', e.target.value)}
                                >
                                    <option value="OK">Tudo Certo</option>
                                    <option value="FALTANTE">Não Veio (Falta)</option>
                                    <option value="INCORRETO">Produto Errado</option>
                                    <option value="AVARIADO">Avariado / Quebrado</option>
                                </select>
                            </div>
                          </td>

                          <td style={{ ...styles.td, textAlign: 'center' }}>
                            {totalmenteRecebido ? (
                              <span style={{ padding: '6px 10px', backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #86efac', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                                <Check size={14} /> OK
                              </span>
                            ) : isConferido ? (
                              <button
                                type="button"
                                onClick={() => toggleConferido(item.id)}
                                style={{ backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 'bold', width: '100%', justifyContent: 'center' }}
                              >
                                <Edit2 size={14} /> Editar
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => toggleConferido(item.id)}
                                style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 'bold', width: '100%', justifyContent: 'center', boxShadow: '0 1px 2px rgba(16, 185, 129, 0.3)' }}
                              >
                                <Check size={14} /> Conferir
                              </button>
                            )}
                          </td>
                        </tr>
                        {confState.statusRecebimento === 'INCORRETO' && !totalmenteRecebido && (
                          <tr key={`${item.id}-incorreto`} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: '#fffbeb' }}>
                            <td colSpan={7} style={{ padding: '8px 14px' }}>
                              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <div style={{ flex: '1 1 200px' }}>
                                  <label style={{ fontSize: '11px', color: '#92400e', fontWeight: '600', display: 'block', marginBottom: '2px' }}>Produto recebido no lugar:</label>
                                  <input
                                    type="text"
                                    placeholder="Ex: Outra marca / laboratório"
                                    disabled={totalmenteRecebido || isConferido}
                                    value={confState.produtoRecebido || ''}
                                    onChange={(e) => handleInputChange(item.id, 'produtoRecebido', e.target.value)}
                                    style={{ ...styles.inputField, backgroundColor: (totalmenteRecebido || isConferido) ? 'transparent' : 'white', borderColor: '#fbbf24', textAlign: 'left', fontWeight: 'normal', color: '#92400e' }}
                                  />
                                </div>
                                <div style={{ flex: '1 1 200px' }}>
                                  <label style={{ fontSize: '11px', color: '#92400e', fontWeight: '600', display: 'block', marginBottom: '2px' }}>Observação:</label>
                                  <input
                                    type="text"
                                    placeholder="Detalhes sobre a divergência"
                                    disabled={totalmenteRecebido || isConferido}
                                    value={confState.observacaoIncorreto || ''}
                                    onChange={(e) => handleInputChange(item.id, 'observacaoIncorreto', e.target.value)}
                                    style={{ ...styles.inputField, backgroundColor: (totalmenteRecebido || isConferido) ? 'transparent' : 'white', borderColor: '#fbbf24', textAlign: 'left', fontWeight: 'normal', color: '#92400e' }}
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                        {confState.statusRecebimento === 'FALTANTE' && !totalmenteRecebido && (
                          <tr key={`${item.id}-faltante`} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: '#fff7ed' }}>
                            <td colSpan={7} style={{ padding: '8px 14px' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#9a3412', fontWeight: '500' }}>
                                <input
                                  type="checkbox"
                                  checked={confState.foiCobrado || false}
                                  disabled={totalmenteRecebido || isConferido}
                                  onChange={(e) => handleInputChange(item.id, 'foiCobrado', e.target.checked)}
                                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#f97316' }}
                                />
                                Foi cobrado na nota fiscal (sem entrega)
                              </label>
                            </td>
                          </tr>
                        )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => setShowProdutoNaoSolicitadoModal(true)}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Package size={16} /> Produto Não Solicitado (veio mas não era do pedido)
              </button>
            </div>

            <ModalProdutoNaoSolicitado
              isOpen={showProdutoNaoSolicitadoModal}
              onClose={() => setShowProdutoNaoSolicitadoModal(false)}
              onConfirm={adicionarProdutoNaoSolicitado}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginTop: '30px', padding: '20px 0', borderTop: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                {itensHabilitados.length} item(ns) ainda pendente(s) de recebimento.
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => navigate(`/pedidos/${id}`)}
                  style={styles.btnCancelar}
                  disabled={salvando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{...styles.btnSalvar, opacity: salvando ? 0.7 : 1}}
                  disabled={salvando}
                >
                  <CheckCircle size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                  {salvando ? 'Processando...' : 'Finalizar e Gravar Conferência'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
      {showModalDestinoFaltantes && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '560px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#9a3412', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={20} /> Produtos faltantes — defina o destino
              </h3>
              <button onClick={() => !salvando && setShowModalDestinoFaltantes(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '18px', fontWeight: 'bold' }}>
                ✕
              </button>
            </div>

            <p style={{ fontSize: '14px', color: '#475569', marginBottom: '10px' }}>
              Os produtos abaixo <strong>não foram recebidos integralmente</strong> e ainda não foram cobrados. Antes de finalizar, escolha uma das opções:
            </p>

            <ul style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', padding: '12px 12px 12px 32px', margin: '0 0 16px 0', maxHeight: '200px', overflowY: 'auto' }}>
              {getItensSemDestino().map(c => (
                <li key={c.id} style={{ fontSize: '13px', color: '#9a3412', padding: '3px 0' }}>{getNomeItemConferencia(c)}</li>
              ))}
            </ul>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={() => confirmarDestinoFaltantes('RETORNAR_COTACAO')}
                disabled={salvando}
                style={{ padding: '12px 16px', backgroundColor: '#f97316', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: salvando ? 'wait' : 'pointer', textAlign: 'left', opacity: salvando ? 0.7 : 1 }}
              >
                Retornar para a Cotação de Origem
                <div style={{ fontSize: '11px', fontWeight: '400', marginTop: '2px' }}>
                  Os produtos voltam para a cotação de origem (encerrada ou não) e esta conferência é finalizada.
                </div>
              </button>
              <button
                type="button"
                onClick={() => confirmarDestinoFaltantes('AGUARDAR')}
                disabled={salvando}
                style={{ padding: '12px 16px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: salvando ? 'wait' : 'pointer', textAlign: 'left', opacity: salvando ? 0.7 : 1 }}
              >
                Aguardar Produto(s) — Gerar Entrega Parcial
                <div style={{ fontSize: '11px', fontWeight: '400', marginTop: '2px' }}>
                  O pedido fica em "Entrega Parcial"; depois você recebe o volume restante ou confirma a falta.
                </div>
              </button>
              <button
                type="button"
                onClick={() => !salvando && setShowModalDestinoFaltantes(false)}
                disabled={salvando}
                style={{ padding: '10px 16px', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: salvando ? 'wait' : 'pointer', alignSelf: 'flex-end' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showDevolucaoModal && (
        <DevolucaoModal
          pedidoId={id}
          itensNaoSolicitados={conferencia.filter(c => c.isNaoSolicitado)}
          onClose={() => setShowDevolucaoModal(false)}
          onSuccess={() => {
            setShowDevolucaoModal(false);
            carregarPedido();
          }}
        />
      )}
    </div>
  );
}

const styles = {
  card: { backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px' },
  th: { textAlign: 'left', padding: '14px', borderBottom: '2px solid #e5e7eb', color: '#4b5563', fontSize: '13px' },
  td: { padding: '14px', color: '#374151', fontSize: '14px' },
  inputTexto: { padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', width: '100%', outline: 'none', color: '#1e293b', boxSizing: 'border-box' },
  inputField: { padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', width: '100%', textAlign: 'center', outline: 'none', fontWeight: 'bold', color: '#166534', transition: 'all 0.2s' },
  btnVoltar: { padding: '10px 20px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center' },
  btnCancelar: { padding: '12px 24px', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' },
  btnSalvar: { padding: '12px 24px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)' }
};