import React, { useState, useEffect } from 'react';
import { X, Search, CheckCircle, Save, Loader2, PackagePlus, Trash2 } from 'lucide-react';
import api from '../../../services/api';
import { useNavigate } from 'react-router-dom';
import PesquisaProdutoDna from '../../PesquisaProdutoDna';

export default function ModalPedidoManual({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [fornecedores, setFornecedores] = useState([]);
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState('');
  
  const [listaItens, setListaItens] = useState([]);
  const [codigoDna, setCodigoDna] = useState('');
  
  const [itemAtual, setItemAtual] = useState({ nomeProduto: '', quantidade: 1, valorUnitario: '', codigoDna: '' });
  
  const [isBuscando, setIsBuscando] = useState(false);
  const [isSalvando, setIsSalvando] = useState(false);
  const [abaDna, setAbaDna] = useState(true);

  useEffect(() => {
    if (isOpen) {
      api.get('/api/fornecedor').then(res => setFornecedores(res.data)).catch(e => console.error(e));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBuscarProdutoDna = async () => {
    if (!codigoDna) return;
    setIsBuscando(true);
    try {
        const res = await api.get(`/api/produtos/buscar?q=${encodeURIComponent(codigoDna.trim())}`);
        
        if (res.data && res.data.descricao) {
            const prod = res.data;
            setItemAtual({ 
              ...itemAtual, 
              nomeProduto: prod.descricao, 
              codigoDna: prod.codigo || codigoDna 
            });
        } else {
            alert(`Produto não encontrado para o código: ${codigoDna}`);
            setItemAtual({ ...itemAtual, nomeProduto: '', codigoDna: '' });
        }
    } catch (error) {
        console.error("Erro na API:", error);
        alert(`Produto não encontrado para o código: ${codigoDna}`);
        setItemAtual({ ...itemAtual, nomeProduto: '', codigoDna: '' });
    } finally {
        setIsBuscando(false);
    }
  };

  // Aplica um resultado da pesquisa por nome/princípio ativo no DNA.
  const selecionarProdutoPorNome = (prod) => {
    if (!prod) return;
    const codigo = prod.codigo != null ? String(prod.codigo) : '';
    setCodigoDna(codigo);
    setItemAtual((anterior) => ({
      ...anterior,
      nomeProduto: prod.descricao || '',
      codigoDna: codigo,
    }));
  };

  const adicionarALista = () => {
      if(!itemAtual.nomeProduto || !itemAtual.quantidade || !itemAtual.valorUnitario) {
          return alert("Preencha todos os campos obrigatórios (Nome, Qtd e Valor).");
      }
      setListaItens([{ ...itemAtual, idTemp: Date.now(), codigoDna: abaDna ? itemAtual.codigoDna : '' }, ...listaItens]);
      setItemAtual({ nomeProduto: '', quantidade: 1, valorUnitario: '', codigoDna: '' });
      setCodigoDna('');
  };

  const handleRemoverItem = (idTemp) => {
      setListaItens(listaItens.filter(i => i.idTemp !== idTemp));
  };

  const handleSalvarPedido = async () => {
      if(!fornecedorSelecionado) return alert("Selecione um Fornecedor.");
      if(listaItens.length === 0) return alert("Adicione pelo menos um produto ao pedido.");

      setIsSalvando(true);
      try {
          const fornecedorObj = fornecedores.find(f => f.nome === fornecedorSelecionado);
          if (!fornecedorObj || !fornecedorObj.id) {
              alert('Não foi possível identificar o ID do fornecedor selecionado. Verifique o cadastro de fornecedores.');
              setIsSalvando(false);
              return;
          }
          const payload = {
              cotacaoId: null,
              fornecedorId: fornecedorObj.id,
              fornecedorNome: fornecedorSelecionado,
              itens: listaItens.map(i => ({
                  nomeProduto: i.nomeProduto,
                  quantidadePedida: Number(i.quantidade),
                  valorUnitarioPedido: Number(i.valorUnitario)
              }))
          };
          const response = await api.post('/api/pedidos/gerar', payload);
          alert('Pedido manual gerado com sucesso!');
          navigate(`/pedidos/${response.data.id}`);
          onClose();
      } catch (error) {
          alert('Erro ao gerar pedido: ' + (error.response?.data?.message || error.message));
      } finally {
          setIsSalvando(false);
      }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1050 }}>
      <div style={{ backgroundColor: 'var(--surface)', borderRadius: '12px', width: '90%', maxWidth: '750px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
              <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}><PackagePlus color="var(--info)"/> Criar Pedido Manual (Avulso)</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Gere um pedido direto, sem passar por cotação.</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)' }}><X size={24} /></button>
        </div>

        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '6px' }}>Fornecedor Parceiro *</label>
                <select style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-strong)', outline: 'none' }} value={fornecedorSelecionado} onChange={e => setFornecedorSelecionado(e.target.value)}>
                    <option value="">-- Selecione o Fornecedor --</option>
                    {fornecedores.map(f => <option key={f.id || f.nome} value={f.nome}>{f.nome}</option>)}
                </select>
            </div>

            <div style={{ padding: '16px', backgroundColor: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <button onClick={() => { setAbaDna(true); setItemAtual({...itemAtual, nomeProduto: '', codigoDna: ''}); setCodigoDna(''); }} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: abaDna ? 'var(--surface)' : 'transparent', color: abaDna ? 'var(--primary)' : 'var(--text-muted)', boxShadow: abaDna ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>Por Código DNA</button>
                    <button onClick={() => { setAbaDna(false); setItemAtual({...itemAtual, nomeProduto: '', codigoDna: ''}); }} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: !abaDna ? 'var(--surface)' : 'transparent', color: !abaDna ? 'var(--primary)' : 'var(--text-muted)', boxShadow: !abaDna ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>Digitar Manualmente</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {abaDna ? (
                        <div style={{ position: 'relative' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '4px' }}>Digite o Código DNA (ou Código de Barras)</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ position: 'relative', flex: 1 }}>
                                    <Search size={16} color="var(--text-subtle)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                                    <input 
                                        type="text" 
                                        value={codigoDna} 
                                        onChange={e => setCodigoDna(e.target.value)} 
                                        onKeyDown={e => e.key === 'Enter' && handleBuscarProdutoDna()}
                                        placeholder="Ex: 24582" 
                                        style={{ width: '100%', padding: '10px 10px 10px 32px', borderRadius: '6px', border: '1px solid var(--border-strong)', boxSizing: 'border-box', outline: 'none' }}
                                    />
                                </div>
                                <button onClick={handleBuscarProdutoDna} disabled={isBuscando || !codigoDna} style={{ padding: '0 16px', backgroundColor: 'var(--info)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                                    {isBuscando ? <Loader2 size={18} className="animate-spin" /> : 'Buscar'}
                                </button>
                            </div>

                            {itemAtual.nomeProduto && abaDna && (
                                <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--success-text)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--success-soft)', padding: '8px', borderRadius: '6px', border: '1px solid var(--success-border)' }}>
                                    <CheckCircle size={16} /> Selecionado: {itemAtual.nomeProduto}
                                </div>
                            )}

                            <div style={{ marginTop: '10px' }}>
                                <PesquisaProdutoDna
                                    onSelecionar={selecionarProdutoPorNome}
                                    rotulo="Não sabe o código? Busque por nome"
                                />
                            </div>
                        </div>
                    ) : (
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '4px' }}>Nome Completo do Produto</label>
                            <input type="text" value={itemAtual.nomeProduto} onChange={e => setItemAtual({...itemAtual, nomeProduto: e.target.value})} placeholder="Ex: Neosaldina C/ 30" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-strong)', boxSizing: 'border-box', outline: 'none' }} />
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '4px' }}>Qtd. Pedida</label>
                            <input type="number" min="1" value={itemAtual.quantidade} onChange={e => setItemAtual({...itemAtual, quantidade: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-strong)', boxSizing: 'border-box', outline: 'none' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '4px' }}>Valor Unit. Previsto (R$)</label>
                            <input type="number" step="0.01" value={itemAtual.valorUnitario} onChange={e => setItemAtual({...itemAtual, valorUnitario: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-strong)', boxSizing: 'border-box', outline: 'none' }} />
                        </div>
                    </div>
                    <button onClick={adicionarALista} style={{ width: '100%', padding: '10px', backgroundColor: 'var(--text)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '4px' }}>
                        Inserir na Lista do Pedido
                    </button>
                </div>
            </div>

            {listaItens.length > 0 && (
                <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ backgroundColor: 'var(--surface-muted)', borderBottom: '2px solid var(--border)' }}>
                            <tr>
                                <th style={{ padding: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>PRODUTO</th>
                                <th style={{ padding: '10px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>CÓDIGO</th>
                                <th style={{ padding: '10px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>QTD</th>
                                <th style={{ padding: '10px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right' }}>VALOR R$</th>
                                <th style={{ padding: '10px', width: '40px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {listaItens.map(item => (
                                <tr key={item.idTemp} style={{ borderBottom: '1px solid var(--surface-muted)' }}>
                                    <td style={{ padding: '10px', fontSize: '13px', color: 'var(--text)', fontWeight: '600' }}>
                                        {item.nomeProduto}
                                    </td>
                                    <td style={{ padding: '10px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>{item.codigoDna || '-'}</td>
                                    <td style={{ padding: '10px', textAlign: 'center', fontSize: '13px', fontWeight: 'bold' }}>{item.quantidade}</td>
                                    <td style={{ padding: '10px', textAlign: 'right', fontSize: '13px' }}>{Number(item.valorUnitario).toFixed(2)}</td>
                                    <td style={{ padding: '10px', textAlign: 'center' }}><button onClick={() => handleRemoverItem(item.idTemp)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={16} /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>

        <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border)', backgroundColor: 'var(--surface-muted)', display: 'flex', justifyContent: 'flex-end', gap: '12px', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
            <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-strong)', backgroundColor: 'var(--surface)', color: 'var(--text-secondary)', fontWeight: 'bold', cursor: 'pointer' }}>Cancelar</button>
            <button onClick={handleSalvarPedido} disabled={isSalvando} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--primary)', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isSalvando ? <><Loader2 size={18} className="animate-spin" /> Gerando...</> : <><Save size={18} /> Finalizar e Criar Pedido</>}
            </button>
        </div>
      </div>
    </div>
  );
}