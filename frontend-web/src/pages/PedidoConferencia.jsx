import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Sidebar from '../components/layout/Sidebar';
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
  const [salvarParcial, setSalvarParcial] = useState(false);

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
              totalmenteRecebido
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
            if (field === 'statusRecebimento' && value === 'FALTANTE') {
                newItem.quantidadeRecebidaAgora = 0;
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
          const qtdNova = item.quantidadeRecebidaAgora === '' || item.quantidadeRecebidaAgora === undefined ? 0 : Number(item.quantidadeRecebidaAgora);
          if (qtdNova <= 0 || item.valorUnitarioReal === '') {
            alert('Preencha a quantidade e o valor unitário da nota antes de confirmar este item.');
            return item;
          }
        }
        return { ...item, conferido: !item.conferido };
      }
      return item;
    }));
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const itensOrdenados = useMemo(() => {
    if (!pedido?.itens) return [];
    let ordenavel = [...pedido.itens];
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
  }, [pedido, sortConfig]);

  const itensHabilitados = useMemo(
    () => conferencia.filter(c => !c.totalmenteRecebido),
    [conferencia]
  );

  const enviarRecebimento = async (parcial) => {
    if (!numeroNota.trim()) {
      alert('Por favor, preencha o Número da NF antes de salvar.');
      return;
    }

    const itensParaEnviar = parcial
      ? conferencia.filter(c =>
          !c.totalmenteRecebido &&
          (c.conferido || (c.quantidadeRecebidaAgora !== undefined && c.quantidadeRecebidaAgora !== ''))
        )
      : conferencia.filter(c => c.conferido);

    if (parcial && itensParaEnviar.length === 0) {
      alert('Para salvar como entrega parcial, você precisa preencher e marcar pelo menos um item desta NF.');
      return;
    }

    if (!parcial) {
      const itensPendentes = conferencia.filter(c => !c.conferido);
      if (itensPendentes.length > 0) {
        alert(`Atenção: Você precisa confirmar (conferir) todos os itens individualmente na tabela. Restam ${itensPendentes.length} itens pendentes de conferência.`);
        return;
      }
    }

    setSalvando(true);
    setSalvarParcial(parcial);

    let teveProblemas = false;

    const payload = {
      numeroNota: numeroNota.trim(),
      itens: itensParaEnviar.map(item => {
        const qtdNova = item.quantidadeRecebidaAgora === '' || item.quantidadeRecebidaAgora === undefined
          ? 0
          : Number(item.quantidadeRecebidaAgora);

        if (item.statusRecebimento !== 'OK') teveProblemas = true;

        return {
          id: item.id,
          quantidadeReal: (item.quantidadeJaRecebida || 0) + qtdNova,
          quantidadeRecebidaAgora: qtdNova,
          valorUnitarioReal: Number(item.valorUnitarioReal),
          statusRecebimento: item.statusRecebimento,
          observacaoDevolucao: item.statusRecebimento !== 'OK' ? 'Divergência marcada na conferência cega' : ''
        };
      })
    };

    try {
      const response = await api.put(`/api/pedidos/${id}/receber`, payload);
      const novoStatus = response.data?.status;

      if (parcial) {
        alert('Entrega parcial salva com sucesso! O status do pedido foi atualizado e você poderá continuar a conferência quando chegar o próximo volume.');
        navigate(`/pedidos/${id}`);
        return;
      }

      if (teveProblemas) {
          if (window.confirm('Conferência salva com sucesso! O sistema identificou que você marcou faltas, avarias ou itens incorretos.\n\nDeseja registrar a devolução / abatimento agora mesmo?')) {
              alert('Na tela do pedido, clique no botão "Gerar / Ver Devolução" para registrar os motivos!');
              navigate(`/pedidos/${id}`);
              return;
          }
      } else {
          alert('Conferência finalizada com sucesso! Todos os itens chegaram corretamente.');
      }

      navigate(`/pedidos/${id}`);
    } catch (error) {
      console.error('Erro ao finalizar conferência:', error);
      alert('Ocorreu um erro ao processar o recebimento do pedido.');
    } finally {
      setSalvando(false);
      setSalvarParcial(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    enviarRecebimento(false);
  };

  const handleSalvarParcial = (e) => {
    e.preventDefault();
    enviarRecebimento(true);
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
                        <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: totalmenteRecebido ? '#f0fdf4' : (isConferido ? '#ecfdf5' : 'white'), transition: 'background-color 0.3s' }}>
                          <td style={styles.td}>
                            <strong style={{ color: totalmenteRecebido ? '#166534' : '#111827', display: 'block' }}>
                              {item.nomeProduto || item.itemCotacao?.nomeProduto || 'Produto Desconhecido'}
                            </strong>
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
                      );
                    })}
                  </tbody>
                </table>
            </div>

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
                  type="button"
                  onClick={handleSalvarParcial}
                  style={{ ...styles.btnSalvarParcial, opacity: salvando ? 0.7 : 1 }}
                  disabled={salvando}
                  title="Salva o que foi conferido nesta NF e mantém o pedido em ENTREGA PARCIAL para continuar depois."
                >
                  <Truck size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                  {salvando && salvarParcial ? 'Salvando...' : 'Salvar Entrega Parcial'}
                </button>
                <button
                  type="submit"
                  style={{...styles.btnSalvar, opacity: salvando ? 0.7 : 1}}
                  disabled={salvando}
                >
                  <CheckCircle size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                  {salvando && !salvarParcial ? 'Processando...' : 'Finalizar e Gravar Conferência'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
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
  btnSalvar: { padding: '12px 24px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)' },
  btnSalvarParcial: { padding: '12px 24px', backgroundColor: '#f97316', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', boxShadow: '0 2px 4px rgba(249, 115, 22, 0.2)' }
};