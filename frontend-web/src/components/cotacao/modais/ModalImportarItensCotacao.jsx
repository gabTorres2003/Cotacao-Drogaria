import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, FileDown, Loader2, X } from 'lucide-react';
import api from '../../../services/api';

const normalizarNome = (nome) => String(nome || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9]/g, '')
  .toLowerCase();

export default function ModalImportarItensCotacao({ isOpen, onClose, cotacaoId, itensAtuais, onSuccess }) {
  const [cotacoes, setCotacoes] = useState([]);
  const [cotacaoOrigem, setCotacaoOrigem] = useState('');
  const [itens, setItens] = useState([]);
  const [selecionados, setSelecionados] = useState({});
  const [quantidades, setQuantidades] = useState({});
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setCotacaoOrigem('');
    setItens([]);
    setSelecionados({});
    setQuantidades({});
    api.get('/api/cotacao')
      .then(res => setCotacoes((res.data || []).filter(c => String(c.id) !== String(cotacaoId))))
      .catch(() => setCotacoes([]));
  }, [isOpen, cotacaoId]);

  const carregarItens = async (idOrigem) => {
    setCotacaoOrigem(idOrigem);
    setItens([]);
    setSelecionados({});
    setQuantidades({});
    if (!idOrigem) return;

    setCarregando(true);
    try {
      const [cotacaoRes, relatorioRes, pedidosRes] = await Promise.all([
        api.get(`/api/cotacao/${idOrigem}`),
        api.get(`/api/comparativo/relatorio/${idOrigem}`),
        api.get(`/api/pedidos/cotacao/${idOrigem}`)
      ]);
      const idsComprados = new Set();
      (pedidosRes.data || []).forEach(pedido => {
        if (pedido.status === 'CANCELADO') return;
        (pedido.itens || []).forEach(item => {
          const idItem = item.itemCotacao?.id || item.itemCotacaoId;
          if (idItem) idsComprados.add(String(idItem));
        });
      });

      const itensOrigem = Array.isArray(relatorioRes.data) && relatorioRes.data.length > 0
        ? relatorioRes.data.map(item => ({
            ...item,
            id: item.idItem,
            nomeProduto: item.nomeProduto,
            quantidade: item.quantidade
          }))
        : (cotacaoRes.data?.itens || []);
      const disponiveis = itensOrigem
        .filter(item => !item.excluido && !idsComprados.has(String(item.id)))
        .map(item => ({ ...item, quantidadeImportar: item.quantidade || 1 }));
      const selecaoInicial = {};
      const quantidadesIniciais = {};
      disponiveis.forEach(item => {
        selecaoInicial[item.id] = false;
        quantidadesIniciais[item.id] = item.quantidade || 1;
      });
      setItens(disponiveis);
      setSelecionados(selecaoInicial);
      setQuantidades(quantidadesIniciais);
    } catch (error) {
      alert('Erro ao carregar os produtos não comprados da cotação selecionada.');
    } finally {
      setCarregando(false);
    }
  };

  const nomesAtuais = useMemo(() => {
    const mapa = {};
    (itensAtuais || []).filter(item => !item.excluido).forEach(item => {
      const nome = normalizarNome(item.nomeProduto);
      if (!mapa[nome]) mapa[nome] = item.nomeProduto;
    });
    return mapa;
  }, [itensAtuais]);

  const nomesSelecionados = useMemo(() => {
    const mapa = {};
    itens.filter(item => selecionados[item.id]).forEach(item => {
      const nome = normalizarNome(item.nomeProduto);
      mapa[nome] = (mapa[nome] || 0) + 1;
    });
    return mapa;
  }, [itens, selecionados]);

  const ehDuplicado = (item) => {
    const nome = normalizarNome(item.nomeProduto);
    return !!nomesAtuais[nome] || (nomesSelecionados[nome] || 0) > 1;
  };

  const descricaoDuplicidade = (item) => {
    const nome = normalizarNome(item.nomeProduto);
    if (nomesAtuais[nome]) return `Duplicata de: ${nomesAtuais[nome]} (já está nesta cotação).`;
    if ((nomesSelecionados[nome] || 0) > 1) return 'Duplicata de outro item selecionado desta mesma cotação de origem.';
    return '';
  };

  const alternarTodos = () => {
    const marcar = itens.some(item => !selecionados[item.id]);
    setSelecionados(prev => {
      const proximo = { ...prev };
      itens.forEach(item => { proximo[item.id] = marcar; });
      return proximo;
    });
  };

  const importar = async () => {
    const selecionadosAgora = itens.filter(item => selecionados[item.id]);
    if (selecionadosAgora.length === 0) {
      alert('Selecione pelo menos um produto para importar.');
      return;
    }
    setSalvando(true);
    try {
      for (const item of selecionadosAgora) {
        const payload = {
          nomeProduto: item.nomeProduto,
          quantidade: Number(quantidades[item.id]) || 1,
          origemItem: `Importado da Cotação #${cotacaoOrigem}`
        };
        if (item.estoque != null) payload.estoque = item.estoque;
        if (item.ultimoPreco != null) payload.ultimoPreco = item.ultimoPreco;
        if (item.vendidoNoMes != null) payload.vendidoNoMes = item.vendidoNoMes;
        if (item.ultCompraQtde != null) payload.ultCompraQtde = item.ultCompraQtde;
        if (item.vendidoAposUltCompra != null) payload.vendidoAposUltCompra = item.vendidoAposUltCompra;
        await api.post(`/api/cotacao/${cotacaoId}/item`, payload);
      }
      alert('Produtos importados com sucesso.');
      onClose();
      onSuccess();
    } catch (error) {
      alert('Erro ao importar produtos: ' + (error.response?.data?.message || error.message));
    } finally {
      setSalvando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
      <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '92%', maxWidth: '760px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, color: '#1f2937' }}><FileDown size={19} style={{ verticalAlign: 'middle', marginRight: '6px' }} />Importar produtos não comprados</h3>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px' }}>Escolha a cotação de origem e a quantidade de cada produto.</div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6b7280' }}><X size={21} /></button>
        </div>

        <div style={{ padding: '20px', overflowY: 'auto' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#374151', marginBottom: '6px' }}>Cotação de origem</label>
          <select value={cotacaoOrigem} onChange={e => carregarItens(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', marginBottom: '16px' }}>
            <option value="">-- Selecione uma cotação --</option>
            {cotacoes.map(cotacao => <option key={cotacao.id} value={cotacao.id}>#{cotacao.id} - {cotacao.descricao || cotacao.origem || 'Sem descrição'}</option>)}
          </select>

          {carregando && <div style={{ textAlign: 'center', padding: '25px', color: '#6b7280' }}><Loader2 className="animate-spin" size={24} /></div>}
          {!carregando && itens.length > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#374151' }}>
                  <input type="checkbox" checked={itens.length > 0 && itens.every(item => selecionados[item.id])} onChange={alternarTodos} style={{ marginRight: '6px' }} />
                  Selecionar todos ({itens.length})
                </label>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>{itens.filter(item => selecionados[item.id]).length} selecionado(s)</span>
              </div>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '7px', overflow: 'hidden' }}>
                {itens.map(item => {
                  const duplicado = ehDuplicado(item);
                  return (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '10px 12px', borderBottom: '1px solid #f1f5f9', backgroundColor: duplicado ? '#fff7ed' : 'white' }}>
                      <input type="checkbox" checked={!!selecionados[item.id]} onChange={() => setSelecionados(prev => ({ ...prev, [item.id]: !prev[item.id] }))} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#1f2937' }}>{item.nomeProduto}</div>
                        {duplicado && <div style={{ fontSize: '11px', color: '#c2410c', fontWeight: 'bold', marginTop: '3px' }}><AlertTriangle size={12} style={{ verticalAlign: 'middle', marginRight: '3px' }} />Repetido — {descricaoDuplicidade(item)}</div>}
                      </div>
                      <label style={{ fontSize: '11px', color: '#6b7280' }}>Qtd.
                        <input type="number" min="1" value={quantidades[item.id] || 1} onChange={e => setQuantidades(prev => ({ ...prev, [item.id]: e.target.value }))} style={{ width: '62px', marginLeft: '5px', padding: '5px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                      </label>
                    </div>
                  );
                })}
              </div>
            </>
          )}
          {!carregando && cotacaoOrigem && itens.length === 0 && <div style={{ padding: '22px', textAlign: 'center', color: '#6b7280' }}>Nenhum produto não comprado disponível nesta cotação.</div>}
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button onClick={onClose} style={{ padding: '9px 15px', border: '1px solid #d1d5db', backgroundColor: 'white', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button>
          <button onClick={importar} disabled={salvando || !cotacaoOrigem || itens.length === 0} style={{ padding: '9px 15px', border: 'none', backgroundColor: salvando ? '#9ca3af' : '#2563eb', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            {salvando ? <><Loader2 size={15} className="animate-spin" style={{ verticalAlign: 'middle', marginRight: '5px' }} />Importando...</> : <><Check size={15} style={{ verticalAlign: 'middle', marginRight: '5px' }} />Importar selecionados</>}
          </button>
        </div>
      </div>
    </div>
  );
}
