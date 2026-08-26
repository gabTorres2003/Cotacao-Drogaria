import React, { useState, useEffect } from 'react';
import { X, Search, CheckCircle, Save, Loader2, ListPlus, Trash2, FileDown } from 'lucide-react';
import api from '../../../services/api';
import { useNavigate } from 'react-router-dom';

export default function ModalNovaCotacaoManual({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [nomeCotacao, setNomeCotacao] = useState(`Cotação Manual - ${new Date().toLocaleDateString('pt-BR')}`);
  
  const [setor, setSetor] = useState('AMBOS'); // NOVO: Controle de setor
  
  const [listaItens, setListaItens] = useState([]);
  const [codigoDna, setCodigoDna] = useState('');
  const [itemAtual, setItemAtual] = useState({ nomeProduto: '', quantidade: 1, codBarras: '' });
  
  const [isBuscando, setIsBuscando] = useState(false);
  const [isSalvando, setIsSalvando] = useState(false);
  const [abaDna, setAbaDna] = useState(true);

  const [cotacoesAnteriores, setCotacoesAnteriores] = useState([]);
  const [cotacaoSelecionada, setCotacaoSelecionada] = useState('');
  const [itensCotacaoAnterior, setItensCotacaoAnterior] = useState([]);
  const [carregandoItens, setCarregandoItens] = useState(false);
  const [itensSelecionados, setItensSelecionados] = useState({});

  useEffect(() => {
      if (isOpen) {
          carregarCotacoesAnteriores();
      }
  }, [isOpen]);

  const carregarCotacoesAnteriores = async () => {
      try {
          const res = await api.get('/api/cotacao');
          setCotacoesAnteriores(res.data || []);
      } catch (error) {
          console.error("Erro ao carregar cotações anteriores", error);
      }
  };

  const carregarItensCotacao = async (idCotacao) => {
      if (!idCotacao) { setItensCotacaoAnterior([]); return; }
      setCarregandoItens(true);
      try {
          const res = await api.get(`/api/cotacao/${idCotacao}`);
          const cotacao = res.data;
          const itens = cotacao.itens || [];
          const pedidosRes = await api.get(`/api/pedidos/cotacao/${idCotacao}`);
          const pedidos = Array.isArray(pedidosRes.data) ? pedidosRes.data : [];
          const idsComprados = new Set();
          pedidos.forEach(p => {
              if (p.status === 'CANCELADO') return;
              (p.itens || []).forEach(item => {
                  const idItemCotacao = item.itemCotacao?.id || item.itemCotacaoId;
                  if (idItemCotacao) idsComprados.add(idItemCotacao);
              });
          });
          const itensNaoComprados = itens.filter(i => !idsComprados.has(i.id) && !i.excluido);
          setItensCotacaoAnterior(itensNaoComprados.map(i => ({
              ...i,
              idTemp: Date.now() + Math.random(),
              codigo: i.nomeOriginal || i.nomeProduto
          })));
          const mapTodos = {};
          itensNaoComprados.forEach(i => { mapTodos[i.id] = true; });
          setItensSelecionados(mapTodos);
      } catch (error) {
          console.error("Erro ao carregar itens da cotação", error);
          setItensCotacaoAnterior([]);
      } finally {
          setCarregandoItens(false);
      }
  };

  const toggleItemSelecionado = (id) => {
      setItensSelecionados(prev => {
          const next = { ...prev };
          if (next[id]) delete next[id];
          else next[id] = true;
          return next;
      });
  };

  const toggleTodosItens = () => {
      const todosMarcados = itensCotacaoAnterior.every(i => itensSelecionados[i.id]);
      if (todosMarcados) {
          setItensSelecionados({});
      } else {
          const map = {};
          itensCotacaoAnterior.forEach(i => { map[i.id] = true; });
          setItensSelecionados(map);
      }
  };

  const importarItensSelecionados = () => {
      const itensParaImportar = itensCotacaoAnterior.filter(i => itensSelecionados[i.id]);
      if (itensParaImportar.length === 0) return alert("Selecione pelo menos um item para importar.");
      const novosItens = itensParaImportar.map(i => ({
          nomeProduto: i.nomeProduto,
          quantidade: i.quantidade || 1,
          origemItem: 'Importado de Cotação #' + cotacaoSelecionada,
          estoque: i.estoque,
          ultimoPreco: i.ultimoPreco,
          vendidoNoMes: i.vendidoNoMes,
          ultCompraData: i.ultCompraData,
          ultCompraQtde: i.ultCompraQtde,
          ultVendaData: i.ultVendaData,
          vendidoAposUltCompra: i.vendidoAposUltCompra,
          codigo: i.codigo,
          idTemp: i.idTemp
      }));
      setListaItens(prev => [...novosItens, ...prev]);
      setItensCotacaoAnterior([]);
      setCotacaoSelecionada('');
      setItensSelecionados({});
  };

  if (!isOpen) return null;

  const handleBuscarProdutoDna = async () => {
    if (!codigoDna) return;
    setIsBuscando(true);
    try {
        const res = await api.get(`/api/produtos/buscar?q=${encodeURIComponent(codigoDna.trim())}`);
        if (res.data) {
            setItemAtual({ 
                ...itemAtual, 
                nomeProduto: res.data.descricao, 
                codBarras: codigoDna.trim(),
                estoque: res.data.estoque,
                ultimoPreco: res.data.ultimoPreco,
                vendidoNoMes: res.data.vendidoNoMes,
                ultCompraData: res.data.ultCompraData,
                ultCompraQtde: res.data.ultCompraQtde,
                ultVendaData: res.data.ultVendaData,
                vendidoAposUltCompra: res.data.vendidoAposUltCompra
            });
        }
    } catch (error) {
        console.error("Erro na API:", error.response || error);
        alert(`Código DNA ${codigoDna} não encontrado na base de dados.`);
        setItemAtual({ ...itemAtual, nomeProduto: '', codBarras: '' });
    } finally {
        setIsBuscando(false);
    }
  };

  const adicionarALista = () => {
      if(!itemAtual.nomeProduto || !itemAtual.quantidade) {
          return alert("O Nome do Produto e a Quantidade são obrigatórios.");
      }
      setListaItens([{ ...itemAtual, codigo: abaDna ? (itemAtual.codBarras || codigoDna) : '-', idTemp: Date.now() }, ...listaItens]);
      setItemAtual({ nomeProduto: '', quantidade: 1, codBarras: '' });
      setCodigoDna('');
  };

  const handleRemoverItem = (idTemp) => {
      setListaItens(listaItens.filter(i => i.idTemp !== idTemp));
  };

  const handleSalvarCotacao = async () => {
      if(listaItens.length === 0) return alert("Adicione pelo menos um produto à lista.");
      if(!nomeCotacao.trim()) return alert("O título da cotação é obrigatório.");

      setIsSalvando(true);
      const nomeUsuarioLogado = localStorage.getItem('nomeUsuario') || 'Sistema';

      try {
          const payload = {
              descricao: nomeCotacao,
              origem: nomeCotacao,
              nomeUsuario: nomeUsuarioLogado,
              setor: setor, // NOVO: Enviando o setor
              itens: listaItens.map(i => ({
                  nomeProduto: i.nomeProduto,
                  quantidade: Number(i.quantidade),
                  origemItem: abaDna ? 'Adição por Código' : 'Manual',
                  estoque: i.estoque,
                  ultimoPreco: i.ultimoPreco,
                  vendidoNoMes: i.vendidoNoMes,
                  ultCompraData: i.ultCompraData,
                  ultCompraQtde: i.ultCompraQtde,
                  ultVendaData: i.ultVendaData,
                  vendidoAposUltCompra: i.vendidoAposUltCompra
              }))
          };

          const response = await api.post('/api/cotacao', payload);
          alert('Cotação criada com sucesso!');
          navigate(`/cotacao/${response.data.id}`);
          onClose();
      } catch (error) {
          alert('Erro ao gerar cotação: ' + (error.response?.data?.message || error.message));
      } finally {
          setIsSalvando(false);
      }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1050 }}>
      <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '90%', maxWidth: '700px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
        
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
              <h2 style={{ margin: 0, fontSize: '20px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ListPlus color="#3b82f6"/> Criar Cotação (Manual / Código DNA)
              </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={24} /></button>
        </div>

        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 2 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>Título / Identificação da Cotação *</label>
                    <input type="text" value={nomeCotacao} onChange={e => setNomeCotacao(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>Setor da Cotação *</label>
                    <select value={setor} onChange={e => setSetor(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box', backgroundColor: '#f8fafc', fontWeight: 'bold', color: '#1e293b' }}>
                        <option value="AMBOS">Medicamentos e Perfumaria</option>
                        <option value="MEDICAMENTOS">Medicamentos</option>
                        <option value="PERFUMARIA">Perfumaria</option>
                    </select>
                </div>
            </div>

            <div style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <button onClick={() => {setAbaDna(true); setItemAtual({...itemAtual, nomeProduto: ''}); setItensCotacaoAnterior([]);}} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: abaDna === true ? 'white' : 'transparent', color: abaDna === true ? '#2563eb' : '#64748b', boxShadow: abaDna === true ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>Inserir por Código DNA</button>
                    <button onClick={() => {setAbaDna(false); setItemAtual({...itemAtual, nomeProduto: ''}); setItensCotacaoAnterior([]);}} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: abaDna === false ? 'white' : 'transparent', color: abaDna === false ? '#2563eb' : '#64748b', boxShadow: abaDna === false ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>Digitar Manualmente</button>
                    <button onClick={() => {setAbaDna('IMPORTAR'); setItensCotacaoAnterior([]);}} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: abaDna === 'IMPORTAR' ? 'white' : 'transparent', color: abaDna === 'IMPORTAR' ? '#2563eb' : '#64748b', boxShadow: abaDna === 'IMPORTAR' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><FileDown size={16}/> Importar de Cotação Anterior</button>
                </div>

                {abaDna === 'IMPORTAR' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>Selecione uma Cotação Anterior</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <select value={cotacaoSelecionada} onChange={e => { setCotacaoSelecionada(e.target.value); carregarItensCotacao(e.target.value); }} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box', backgroundColor: 'white' }}>
                                    <option value="">-- Selecione --</option>
                                    {cotacoesAnteriores.map(c => (
                                        <option key={c.id} value={c.id}>#{c.id} - {c.descricao || c.origem || 'Sem descrição'} ({c.itens?.length || 0} itens)</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        {carregandoItens && (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}><Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} /><br/>Carregando itens não comprados...</div>
                        )}
                        {itensCotacaoAnterior.length > 0 && !carregandoItens && (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>
                                        <input type="checkbox" checked={itensCotacaoAnterior.every(i => itensSelecionados[i.id])} onChange={toggleTodosItens} style={{ marginRight: '6px' }} />
                                        Selecionar Todos ({itensCotacaoAnterior.length} itens não comprados)
                                    </label>
                                    <button onClick={importarItensSelecionados} style={{ padding: '6px 12px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <FileDown size={14} /> Importar Selecionados
                                    </button>
                                </div>
                                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                                    {itensCotacaoAnterior.map(item => (
                                        <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', backgroundColor: itensSelecionados[item.id] ? '#f0fdf4' : 'white' }}>
                                            <input type="checkbox" checked={!!itensSelecionados[item.id]} onChange={() => toggleItemSelecionado(item.id)} />
                                            <span style={{ fontSize: '13px', fontWeight: '500', color: '#1e293b' }}>{item.nomeProduto}</span>
                                            <span style={{ fontSize: '11px', color: '#6b7280', marginLeft: 'auto' }}>Qtd: {item.quantidade}</span>
                                        </label>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {abaDna ? (
                            <div style={{ position: 'relative' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>Digite o Código DNA (ou Código de Barras)</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <div style={{ position: 'relative', flex: 1 }}>
                                        <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                                        <input 
                                            type="text" 
                                            value={codigoDna} 
                                            onChange={e => setCodigoDna(e.target.value)} 
                                            onKeyDown={e => e.key === 'Enter' && handleBuscarProdutoDna()}
                                            placeholder="Ex: 24582" 
                                            style={{ width: '100%', padding: '10px 10px 10px 32px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} 
                                        />
                                    </div>
                                    <button onClick={handleBuscarProdutoDna} disabled={isBuscando || !codigoDna} style={{ padding: '0 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                                        {isBuscando ? <Loader2 size={18} className="animate-spin" /> : 'Buscar'}
                                    </button>
                                </div>

                                {itemAtual.nomeProduto && (
                                    <div style={{ marginTop: '8px', fontSize: '13px', color: '#166534', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#f0fdf4', padding: '8px', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                                        <CheckCircle size={16} /> Encontrado: {itemAtual.nomeProduto}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>Nome Completo do Produto</label>
                                <input type="text" value={itemAtual.nomeProduto} onChange={e => setItemAtual({...itemAtual, nomeProduto: e.target.value})} placeholder="Ex: Neosaldina C/ 30" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                            </div>
                        )}

                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>Qtd. Solicitada</label>
                            <input type="number" min="1" value={itemAtual.quantidade} onChange={e => setItemAtual({...itemAtual, quantidade: e.target.value})} style={{ width: '120px', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                        </div>
                        
                        <button onClick={adicionarALista} style={{ width: '100%', padding: '10px', backgroundColor: '#1e293b', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '4px' }}>
                            Inserir na Lista
                        </button>
                    </div>
                )}
            </div>

            {listaItens.length > 0 && (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                            <tr>
                                <th style={{ padding: '10px', fontSize: '12px', color: '#64748b' }}>CÓDIGO</th>
                                <th style={{ padding: '10px', fontSize: '12px', color: '#64748b' }}>PRODUTO</th>
                                <th style={{ padding: '10px', fontSize: '12px', color: '#64748b', textAlign: 'center' }}>QTD</th>
                                <th style={{ padding: '10px', width: '40px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {listaItens.map(item => (
                                <tr key={item.idTemp} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '10px', fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>{item.codigo}</td>
                                    <td style={{ padding: '10px', fontSize: '13px', color: '#1e293b', fontWeight: '600' }}>{item.nomeProduto}</td>
                                    <td style={{ padding: '10px', textAlign: 'center', fontSize: '13px', fontWeight: 'bold' }}>{item.quantidade}</td>
                                    <td style={{ padding: '10px', textAlign: 'center' }}>
                                        <button onClick={() => handleRemoverItem(item.idTemp)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>

        <div style={{ padding: '20px 24px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: '12px', borderRadius: '0 0 12px 12px' }}>
            <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', fontWeight: 'bold', cursor: 'pointer' }}>Cancelar</button>
            <button onClick={handleSalvarCotacao} disabled={isSalvando} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isSalvando ? <><Loader2 size={18} className="animate-spin" /> Gerando...</> : <><Save size={18} /> Salvar Cotação</>}
            </button>
        </div>
      </div>
    </div>
  );
}