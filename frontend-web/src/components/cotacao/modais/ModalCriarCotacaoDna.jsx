import React, { useState } from 'react';
import { X, Search, CheckCircle, Save, Loader2, FileText, Trash2 } from 'lucide-react';
import api from '../../../services/api';
import { useNavigate } from 'react-router-dom';
import PesquisaProdutoDna from '../../PesquisaProdutoDna';

export default function ModalCriarCotacaoDna({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [textoDna, setTextoDna] = useState('');
  const [listaProcessada, setListaProcessada] = useState([]);
  const [isProcessando, setIsProcessando] = useState(false);
  const [isSalvando, setIsSalvando] = useState(false);
  
  const dataHoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
  const [nomeCotacao, setNomeCotacao] = useState(`Pedido via Códigos - ${dataHoje}`);

  if (!isOpen) return null;

  const processarTexto = async () => {
    setIsProcessando(true);
    
    const regexSeparador = /[,\s\n]+/;
    const codigosExtraidos = textoDna.split(regexSeparador).filter(c => c.trim() !== '');

    const fetchPromises = codigosExtraidos.map(async (codigo) => {
        try {
            const res = await api.get(`/api/produtos/buscar?q=${encodeURIComponent(codigo.trim())}`);
            if (res.data) {
                return {
                    idTemp: Math.random().toString(36).substr(2, 9),
                    codigo: codigo.toUpperCase(),
                    nomeProduto: res.data.descricao,
                    quantidade: 1
                };
            }
        } catch (error) {
            return null;
        }
    });

    const resultados = await Promise.all(fetchPromises);
    const novosItens = resultados.filter(item => item !== null);

    if (novosItens.length === 0) {
        alert("Nenhum código válido encontrado na base de dados.");
    } else {
        setListaProcessada(novosItens);
    }
    
    setIsProcessando(false);
  };

  // Aplica um resultado da pesquisa por nome/princípio ativo no DNA, sem
  // duplicar itens já adicionados pelo código.
  const adicionarProdutoPesquisado = (prod) => {
    if (!prod) return;
    const codigo = prod.codigo != null ? String(prod.codigo) : (prod.codbarras || '');
    const nome = prod.descricao || '';

    setListaProcessada(prev => {
      const jaExiste = prev.some(item =>
        String(item.codigo) === codigo && (item.nomeProduto || '') === nome
      );
      if (jaExiste) return prev;

      return [...prev, {
        idTemp: Math.random().toString(36).substr(2, 9),
        codigo,
        nomeProduto: nome,
        quantidade: 1,
      }];
    });
  };

  const handleRemoverItem = (idTemp) => {
    setListaProcessada(prev => prev.filter(item => item.idTemp !== idTemp));
  };

  const handleAlterarQtd = (idTemp, novaQtd) => {
    setListaProcessada(prev => prev.map(item => item.idTemp === idTemp ? { ...item, quantidade: Number(novaQtd) || 1 } : item));
  };

  const handleCriarCotacao = async () => {
    if (listaProcessada.length === 0) return alert("A lista de produtos está vazia.");
    if (!nomeCotacao) return alert("O nome/origem da cotação é obrigatório.");

    setIsSalvando(true);
    try {
      const payload = {
        origem: nomeCotacao,
        itens: listaProcessada.map(item => ({
          nomeProduto: item.nomeProduto,
          quantidade: item.quantidade
        }))
      };

      const response = await api.post('/api/cotacao', payload);
      alert('Cotação criada com sucesso!');
      navigate(`/cotacao/${response.data.id}`);
      onClose();
    } catch (error) {
      alert("Erro ao criar a cotação. Verifique a conexão.");
    } finally {
      setIsSalvando(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1050 }}>
      <div style={{ backgroundColor: 'var(--surface)', borderRadius: '12px', width: '90%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
        
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
              <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText color="var(--info)"/> Criar Cotação via Códigos DNA
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Cole os códigos separados por vírgula, espaço ou linhas.</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)' }}><X size={24} /></button>
        </div>

        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {listaProcessada.length === 0 ? (
                <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '8px' }}>Área de Transferência (Cole os códigos aqui):</label>
                    <textarea 
                        value={textoDna}
                        onChange={(e) => setTextoDna(e.target.value)}
                        placeholder="Ex: 50244, 21855, 90332..."
                        style={{ width: '100%', height: '150px', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-strong)', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'monospace' }}
                    />
                    <button 
                        onClick={processarTexto}
                        disabled={isProcessando || textoDna.trim() === ''}
                        style={{ marginTop: '12px', padding: '12px 24px', backgroundColor: 'var(--success)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        {isProcessando ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />} Traduzir Códigos para Produtos
                    </button>
                </div>
            ) : (
                <>
                    <div style={{ backgroundColor: 'var(--primary-soft)', border: '1px solid var(--info-border)', padding: '12px 16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ color: 'var(--primary-text)', fontWeight: '600', fontSize: '14px' }}>
                            <CheckCircle size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                            {listaProcessada.length} produtos validados e prontos para cotar.
                        </div>
                        <button onClick={() => { setListaProcessada([]); setTextoDna(''); }} style={{ background: 'none', border: 'none', color: 'var(--info)', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold' }}>
                            Limpar e recomeçar
                        </button>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '8px' }}>Título da Cotação / Origem:</label>
                        <input 
                            type="text" 
                            value={nomeCotacao}
                            onChange={(e) => setNomeCotacao(e.target.value)}
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-strong)', fontSize: '14px', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ backgroundColor: 'var(--surface-muted)', borderBottom: '2px solid var(--border)' }}>
                                <tr>
                                    <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>CÓD. DNA</th>
                                    <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>PRODUTO</th>
                                    <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', width: '100px' }}>QTD</th>
                                    <th style={{ padding: '12px 16px', width: '50px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {listaProcessada.map((item) => (
                                    <tr key={item.idTemp} style={{ borderBottom: '1px solid var(--surface-muted)' }}>
                                        <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 'bold' }}>{item.codigo}</td>
                                        <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--text)', fontWeight: '600' }}>{item.nomeProduto}</td>
                                        <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                                            <input 
                                                type="number" 
                                                min="1" 
                                                value={item.quantidade} 
                                                onChange={(e) => handleAlterarQtd(item.idTemp, e.target.value)}
                                                style={{ width: '60px', padding: '6px', textAlign: 'center', borderRadius: '4px', border: '1px solid var(--border-strong)' }}
                                            />
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                            <button onClick={() => handleRemoverItem(item.idTemp)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            <div>
                <PesquisaProdutoDna
                    onSelecionar={adicionarProdutoPesquisado}
                    rotulo="Não sabe o código? Busque por nome"
                />
            </div>
        </div>

        {listaProcessada.length > 0 && (
            <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border)', backgroundColor: 'var(--surface-muted)', display: 'flex', justifyContent: 'flex-end', gap: '12px', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
                <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-strong)', backgroundColor: 'var(--surface)', color: 'var(--text-secondary)', fontWeight: 'bold', cursor: 'pointer' }}>Cancelar</button>
                <button onClick={handleCriarCotacao} disabled={isSalvando} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--primary)', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isSalvando ? <><Loader2 size={18} className="animate-spin" /> Gerando Cotação...</> : <><Save size={18} /> Gerar Nova Cotação</>}
                </button>
            </div>
        )}
      </div>
    </div>
  );
}