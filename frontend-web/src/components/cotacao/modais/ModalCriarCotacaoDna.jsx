import React, { useState, useEffect } from 'react';
import { X, Search, Check, Save, Loader2, FileText, AlertTriangle, Trash2 } from 'lucide-react';
import api from '../../../services/api';
import { useNavigate } from 'react-router-dom';

export default function ModalCriarCotacaoDna({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [textoDna, setTextoDna] = useState('');
  const [dicionarioDna, setDicionarioDna] = useState({});
  const [listaProcessada, setListaProcessada] = useState([]);
  const [isProcessando, setIsProcessando] = useState(false);
  const [isSalvando, setIsSalvando] = useState(false);
  
  // NOME PADRÃO DA COTAÇÃO
  const dataHoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
  const [nomeCotacao, setNomeCotacao] = useState(`Pedido via Códigos - ${dataHoje}`);

  useEffect(() => {
    if (isOpen && Object.keys(dicionarioDna).length === 0) {
      const carregarDicionario = async () => {
        try {
          const res = await api.get('/api/diversos');
          const mapa = {};
          res.data.forEach(d => {
            if (d.codigoDiversos) mapa[String(d.codigoDiversos).trim().toUpperCase()] = d.produto;
          });
          setDicionarioDna(mapa);
        } catch (error) {
          console.error("Erro ao carregar dicionário de DNA:", error);
        }
      };
      carregarDicionario();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const processarTexto = () => {
    setIsProcessando(true);
    
    // Separa o texto por vírgulas, espaços ou quebras de linha
    const regexSeparador = /[,\s\n]+/;
    const codigosExtraidos = textoDna.split(regexSeparador).filter(c => c.trim() !== '');

    const novosItens = [];
    codigosExtraidos.forEach(codigo => {
      const codUpper = codigo.toUpperCase();
      if (dicionarioDna[codUpper]) {
        novosItens.push({
          idTemp: Math.random().toString(36).substr(2, 9),
          codigo: codUpper,
          nomeProduto: dicionarioDna[codUpper],
          quantidade: 1
        });
      }
    });

    if (novosItens.length === 0) {
        alert("Nenhum código válido encontrado na base de dados.");
    } else {
        setListaProcessada(novosItens);
    }
    
    setIsProcessando(false);
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
      <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '90%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
        
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
              <h2 style={{ margin: 0, fontSize: '20px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText color="#3b82f6"/> Criar Cotação via Códigos DNA
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Cole os códigos separados por vírgula, espaço ou linhas.</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={24} /></button>
        </div>

        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {listaProcessada.length === 0 ? (
                <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#334155', marginBottom: '8px' }}>Área de Transferência (Cole os códigos aqui):</label>
                    <textarea 
                        value={textoDna}
                        onChange={(e) => setTextoDna(e.target.value)}
                        placeholder="Ex: 50244, 21855, 90332..."
                        style={{ width: '100%', height: '150px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'monospace' }}
                    />
                    <button 
                        onClick={processarTexto}
                        disabled={isProcessando || textoDna.trim() === ''}
                        style={{ marginTop: '12px', padding: '12px 24px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Search size={18} /> Traduzir Códigos para Produtos
                    </button>
                </div>
            ) : (
                <>
                    <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '12px 16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ color: '#1e40af', fontWeight: '600', fontSize: '14px' }}>
                            <CheckCircle size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                            {listaProcessada.length} produtos validados e prontos para cotar.
                        </div>
                        <button onClick={() => { setListaProcessada([]); setTextoDna(''); }} style={{ background: 'none', border: 'none', color: '#3b82f6', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold' }}>
                            Limpar e recomeçar
                        </button>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#334155', marginBottom: '8px' }}>Título da Cotação / Origem:</label>
                        <input 
                            type="text" 
                            value={nomeCotacao}
                            onChange={(e) => setNomeCotacao(e.target.value)}
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                <tr>
                                    <th style={{ padding: '12px 16px', fontSize: '12px', color: '#64748b' }}>CÓD. DNA</th>
                                    <th style={{ padding: '12px 16px', fontSize: '12px', color: '#64748b' }}>PRODUTO</th>
                                    <th style={{ padding: '12px 16px', fontSize: '12px', color: '#64748b', textAlign: 'center', width: '100px' }}>QTD</th>
                                    <th style={{ padding: '12px 16px', width: '50px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {listaProcessada.map((item) => (
                                    <tr key={item.idTemp} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>{item.codigo}</td>
                                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>{item.nomeProduto}</td>
                                        <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                                            <input 
                                                type="number" 
                                                min="1" 
                                                value={item.quantidade} 
                                                onChange={(e) => handleAlterarQtd(item.idTemp, e.target.value)}
                                                style={{ width: '60px', padding: '6px', textAlign: 'center', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                            />
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                            <button onClick={() => handleRemoverItem(item.idTemp)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
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
        </div>

        {listaProcessada.length > 0 && (
            <div style={{ padding: '20px 24px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: '12px', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
                <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', fontWeight: 'bold', cursor: 'pointer' }}>Cancelar</button>
                <button onClick={handleCriarCotacao} disabled={isSalvando} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isSalvando ? <><Loader2 size={18} className="animate-spin" /> Gerando Cotação...</> : <><Save size={18} /> Gerar Nova Cotação</>}
                </button>
            </div>
        )}
      </div>
    </div>
  );
}