import { useState, useEffect } from 'react';
import api from '../services/api';
import { Search, X, Package } from 'lucide-react';

export default function ModalProdutoNaoSolicitado({ isOpen, onClose, onConfirm }) {
  const [busca, setBusca] = useState('');
  const [resultadoBusca, setResultadoBusca] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [produtoManual, setProdutoManual] = useState(false);
  const [nomeManual, setNomeManual] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [valorUnitario, setValorUnitario] = useState('');
  const [classificacao, setClassificacao] = useState('ENVIADO_POR_ENGANO');

  useEffect(() => {
    if (!isOpen) {
      setBusca('');
      setResultadoBusca(null);
      setProdutoManual(false);
      setNomeManual('');
      setQuantidade(1);
      setValorUnitario('');
      setClassificacao('ENVIADO_POR_ENGANO');
    }
  }, [isOpen]);

  const buscarProduto = async () => {
    if (!busca.trim()) return;
    setBuscando(true);
    setResultadoBusca(null);
    try {
      const res = await api.get(`/api/produtos/buscar?q=${encodeURIComponent(busca.trim())}`);
      setResultadoBusca(res.data);
    } catch {
      setResultadoBusca({ erro: true });
    } finally {
      setBuscando(false);
    }
  };

  const handleConfirm = () => {
    const nome = resultadoBusca && !resultadoBusca.erro
      ? resultadoBusca.nome
      : (produtoManual ? nomeManual.trim() : busca.trim());

    if (!nome) {
      alert('Informe o nome do produto.');
      return;
    }
    if (quantidade <= 0) {
      alert('A quantidade deve ser maior que zero.');
      return;
    }

    onConfirm({
      nomeProduto: nome,
      quantidade,
      valorUnitario: valorUnitario ? Number(valorUnitario) : 0,
      classificacao,
      origem: 'NAO_SOLICITADO'
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', width: '500px', maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={20} color="#f97316" />
            Produto Não Solicitado
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={20} color="#6b7280" />
          </button>
        </div>

        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
          Produto que veio na entrega mas não faz parte do pedido original.
        </p>

        {!produtoManual && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              Buscar por código, barras ou nome:
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={busca}
                onChange={e => setBusca(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && buscarProduto()}
                placeholder="Ex: 7891234567890"
                style={{ flex: 1, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
              />
              <button
                type="button"
                onClick={buscarProduto}
                disabled={buscando || !busca.trim()}
                style={{ padding: '8px 14px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: buscando ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '600' }}
              >
                <Search size={14} /> {buscando ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
            {resultadoBusca && !resultadoBusca.erro && (
              <div style={{ marginTop: '8px', padding: '10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '13px', color: '#166534' }}>
                <strong>Encontrado:</strong> {resultadoBusca.nome}
              </div>
            )}
            {resultadoBusca && resultadoBusca.erro && (
              <div style={{ marginTop: '8px', padding: '10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '13px', color: '#991b1b' }}>
                Produto não encontrado no DNA.
              </div>
            )}
            <button
              type="button"
              onClick={() => setProdutoManual(true)}
              style={{ marginTop: '8px', background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline', padding: 0 }}
            >
              Digitar nome manualmente
            </button>
          </div>
        )}

        {produtoManual && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              Nome do produto:
            </label>
            <input
              type="text"
              value={nomeManual}
              onChange={e => setNomeManual(e.target.value)}
              placeholder="Digite o nome do produto"
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
            />
            <button
              type="button"
              onClick={() => { setProdutoManual(false); setResultadoBusca(null); }}
              style={{ marginTop: '8px', background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline', padding: 0 }}
            >
              Buscar no DNA
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Quantidade:</label>
            <input
              type="number"
              min="1"
              value={quantidade}
              onChange={e => setQuantidade(Number(e.target.value))}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Valor unitário (NF):</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={valorUnitario}
              onChange={e => setValorUnitario(e.target.value)}
              placeholder="R$ 0,00"
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Situação:</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#374151', cursor: 'pointer', padding: '8px 12px', border: `1px solid ${classificacao === 'ENVIADO_POR_ENGANO' ? '#f97316' : '#d1d5db'}`, borderRadius: '6px', backgroundColor: classificacao === 'ENVIADO_POR_ENGANO' ? '#fff7ed' : 'white' }}>
              <input type="radio" name="classificacao" value="ENVIADO_POR_ENGANO" checked={classificacao === 'ENVIADO_POR_ENGANO'} onChange={e => setClassificacao(e.target.value)} style={{ accentColor: '#f97316' }} />
              Enviado por engano (sem cobrança)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#374151', cursor: 'pointer', padding: '8px 12px', border: `1px solid ${classificacao === 'NAO_PEDIDO' ? '#2563eb' : '#d1d5db'}`, borderRadius: '6px', backgroundColor: classificacao === 'NAO_PEDIDO' ? '#eff6ff' : 'white' }}>
              <input type="radio" name="classificacao" value="NAO_PEDIDO" checked={classificacao === 'NAO_PEDIDO'} onChange={e => setClassificacao(e.target.value)} style={{ accentColor: '#2563eb' }} />
              Não estava no pedido (com cobrança)
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '8px 16px', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            style={{ padding: '8px 16px', backgroundColor: '#f97316', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
          >
            Adicionar à Conferência
          </button>
        </div>
      </div>
    </div>
  );
}
