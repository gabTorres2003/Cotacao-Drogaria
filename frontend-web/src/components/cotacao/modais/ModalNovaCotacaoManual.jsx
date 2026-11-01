import React, { useState } from 'react';
import { X, Search, CheckCircle, Save, Loader2, ListPlus, Trash2 } from 'lucide-react';
import api from '../../../services/api';
import { useNavigate } from 'react-router-dom';
import PesquisaProdutoDna from '../../PesquisaProdutoDna';

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

  // Aplica um resultado da pesquisa por nome/princípio ativo no DNA.
  const selecionarProdutoPorNome = (prod) => {
      if (!prod) return;
      const identificador = prod.codbarras
          ? String(prod.codbarras)
          : (prod.codigo != null ? String(prod.codigo) : '');
      setCodigoDna(identificador);
      setItemAtual((anterior) => ({
          ...anterior,
          nomeProduto: prod.descricao || '',
          codBarras: identificador,
      }));
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
                  codBarras: i.codBarras || null,
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
      <div style={{ backgroundColor: 'var(--surface)', borderRadius: '12px', width: '90%', maxWidth: '700px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
        
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
              <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ListPlus color="var(--info)"/> Criar Cotação (Manual / Código DNA)
              </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)' }}><X size={24} /></button>
        </div>

        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 2 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '6px' }}>Título / Identificação da Cotação *</label>
                    <input type="text" value={nomeCotacao} onChange={e => setNomeCotacao(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-strong)', boxSizing: 'border-box' }} />
                </div>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '6px' }}>Setor da Cotação *</label>
                    <select value={setor} onChange={e => setSetor(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-strong)', boxSizing: 'border-box', backgroundColor: 'var(--surface-muted)', fontWeight: 'bold', color: 'var(--text)' }}>
                        <option value="AMBOS">Medicamentos e Perfumaria</option>
                        <option value="MEDICAMENTOS">Medicamentos</option>
                        <option value="PERFUMARIA">Perfumaria</option>
                    </select>
                </div>
            </div>

            <div style={{ padding: '16px', backgroundColor: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <button onClick={() => {setAbaDna(true); setItemAtual({...itemAtual, nomeProduto: ''});}} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: abaDna === true ? 'var(--surface)' : 'transparent', color: abaDna === true ? 'var(--primary)' : 'var(--text-muted)', boxShadow: abaDna === true ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>Inserir por Código DNA</button>
                    <button onClick={() => {setAbaDna(false); setItemAtual({...itemAtual, nomeProduto: ''});}} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: abaDna === false ? 'var(--surface)' : 'transparent', color: abaDna === false ? 'var(--primary)' : 'var(--text-muted)', boxShadow: abaDna === false ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>Digitar Manualmente</button>
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
                                            style={{ width: '100%', padding: '10px 10px 10px 32px', borderRadius: '6px', border: '1px solid var(--border-strong)', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                    <button onClick={handleBuscarProdutoDna} disabled={isBuscando || !codigoDna} style={{ padding: '0 16px', backgroundColor: 'var(--info)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                                        {isBuscando ? <Loader2 size={18} className="animate-spin" /> : 'Buscar'}
                                    </button>
                                </div>

                                {itemAtual.nomeProduto && (
                                    <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--success-text)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--success-soft)', padding: '8px', borderRadius: '6px', border: '1px solid var(--success-border)' }}>
                                        <CheckCircle size={16} /> Encontrado: {itemAtual.nomeProduto}
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
                                <input type="text" value={itemAtual.nomeProduto} onChange={e => setItemAtual({...itemAtual, nomeProduto: e.target.value})} placeholder="Ex: Neosaldina C/ 30" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-strong)', boxSizing: 'border-box' }} />
                            </div>
                        )}

                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '4px' }}>Qtd. Solicitada</label>
                            <input type="number" min="1" value={itemAtual.quantidade} onChange={e => setItemAtual({...itemAtual, quantidade: e.target.value})} style={{ width: '120px', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-strong)', boxSizing: 'border-box' }} />
                        </div>
                        
                        <button onClick={adicionarALista} style={{ width: '100%', padding: '10px', backgroundColor: 'var(--text)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '4px' }}>
                            Inserir na Lista
                        </button>
                    </div>
            </div>

            {listaItens.length > 0 && (
                <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ backgroundColor: 'var(--surface-muted)', borderBottom: '2px solid var(--border)' }}>
                            <tr>
                                <th style={{ padding: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>CÓDIGO</th>
                                <th style={{ padding: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>PRODUTO</th>
                                <th style={{ padding: '10px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>QTD</th>
                                <th style={{ padding: '10px', width: '40px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {listaItens.map(item => (
                                <tr key={item.idTemp} style={{ borderBottom: '1px solid var(--surface-muted)' }}>
                                    <td style={{ padding: '10px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 'bold' }}>{item.codigo}</td>
                                    <td style={{ padding: '10px', fontSize: '13px', color: 'var(--text)', fontWeight: '600' }}>{item.nomeProduto}</td>
                                    <td style={{ padding: '10px', textAlign: 'center', fontSize: '13px', fontWeight: 'bold' }}>{item.quantidade}</td>
                                    <td style={{ padding: '10px', textAlign: 'center' }}>
                                        <button onClick={() => handleRemoverItem(item.idTemp)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>

        <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border)', backgroundColor: 'var(--surface-muted)', display: 'flex', justifyContent: 'flex-end', gap: '12px', borderRadius: '0 0 12px 12px' }}>
            <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-strong)', backgroundColor: 'var(--surface)', color: 'var(--text-secondary)', fontWeight: 'bold', cursor: 'pointer' }}>Cancelar</button>
            <button onClick={handleSalvarCotacao} disabled={isSalvando} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--primary)', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isSalvando ? <><Loader2 size={18} className="animate-spin" /> Gerando...</> : <><Save size={18} /> Salvar Cotação</>}
            </button>
        </div>
      </div>
    </div>
  );
}