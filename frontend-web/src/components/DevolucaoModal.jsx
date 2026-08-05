import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { X, Plus, Trash2, Save, CheckSquare, ListX, AlertCircle, Edit2, Check } from 'lucide-react';

export default function DevolucaoModal({ devolucaoId, pedidoId, onClose, onSuccess, readOnly }) {
  const navigate = useNavigate();
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(false);

  const [internalDevId, setInternalDevId] = useState(devolucaoId);
  const [pedidoOriginal, setPedidoOriginal] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    fornecedorId: '',
    nfOrigem: '',
    protocolo: '',
    protocoloFalta: '',
    protocoloSobra: '',
    dataSolicitacao: today,
    dataRecolhimento: '',
    formaAbatimento: 'PENDENTE',
    observacaoAbatimento: '',
    status: 'AGUARDANDO_RECOLHIMENTO',
    pedido: null
  });

  const [itens, setItens] = useState([]);
  const [novoItem, setNovoItem] = useState({ nomeProduto: '', quantidade: 1, valorUnitario: 0 });

  // Estados de edição de item na tabela
  const [editingIndex, setEditingIndex] = useState(null);
  const [editItemForm, setEditItemForm] = useState({ nomeProduto: '', quantidade: 1, valorUnitario: 0 });

  const [selecaoPedido, setSelecaoPedido] = useState({});

  useEffect(() => {
    carregarListas();
    if (devolucaoId) {
      carregarDevolucaoExistente(devolucaoId);
    } else if (pedidoId) {
      iniciarViaPedido(pedidoId);
    }
  }, [devolucaoId, pedidoId]);

  const carregarListas = async () => {
    try {
      const resFornecedores = await api.get('/api/fornecedor');
      setFornecedores(resFornecedores.data);
    } catch (error) { console.error(error); }
  };

  const carregarDevolucaoExistente = async (id) => {
    try {
      const { data } = await api.get(`/api/devolucoes/${id}`);
      setInternalDevId(data.id);
      setForm({
        fornecedorId: data.fornecedor?.id || '',
        nfOrigem: data.nfOrigem || '',
        protocolo: data.protocolo || '',
        protocoloFalta: data.protocoloFalta || '',
        protocoloSobra: data.protocoloSobra || '',
        dataSolicitacao: data.dataSolicitacao || today,
        dataRecolhimento: data.dataRecolhimento || '',
        formaAbatimento: data.formaAbatimento || 'PENDENTE',
        observacaoAbatimento: data.observacaoAbatimento || '',
        status: data.status || 'AGUARDANDO_RECOLHIMENTO',
        pedido: data.pedido
      });
      setItens(data.itens || []);
    } catch (error) { alert("Erro ao carregar devolução"); }
  };

  const iniciarViaPedido = async (idPed) => {
    try {
      const resDev = await api.get(`/api/devolucoes/pedido/${idPed}`);
      if (resDev.data && resDev.data.length > 0) {
        carregarDevolucaoExistente(resDev.data[0].id);
        return;
      }

      const { data } = await api.get(`/api/pedidos/${idPed}`);
      setPedidoOriginal(data);
      
      setForm(prev => ({ 
        ...prev, 
        fornecedorId: data.fornecedor?.id, 
        nfOrigem: data.numeroNota || '', 
        pedido: data 
      }));
      
      aplicarFiltroSelecao(data, 'DIVERGENCIAS'); 

    } catch (error) { console.error(error); }
  };

  const aplicarFiltroSelecao = (dadosPedido, tipo) => {
    const selecao = {};
    
    dadosPedido.itens.forEach(i => {
      const isFaltaTotal = i.quantidadeReal === 0 || i.quantidadeReal === null;
      const isFaltaParcial = i.quantidadeReal > 0 && i.quantidadeReal < i.quantidadePedida;
      const isAvariado = i.statusRecebimento === 'AVARIADO';
      const isIncorreto = i.statusRecebimento === 'INCORRETO';

      const isDivergente = isFaltaTotal || isFaltaParcial || isAvariado || isIncorreto;
      const isSelected = tipo === 'TOTAL' ? true : (tipo === 'DIVERGENCIAS' ? isDivergente : false);

      let motivoPadrao = 'Devolução Padrão';
      let qtdSugerida = i.quantidadePedida;
      let isApenasFinanceiro = false;
      let maxPermitido = i.quantidadePedida;

      if (isFaltaTotal) {
          motivoPadrao = 'Falta na Caixa (Gerar Crédito)';
          qtdSugerida = i.quantidadePedida;
          maxPermitido = i.quantidadePedida;
          isApenasFinanceiro = true;
      } else if (isAvariado) {
          motivoPadrao = 'Produto Avariado';
          qtdSugerida = i.quantidadeReal; 
          maxPermitido = i.quantidadeReal;
      } else if (isIncorreto) {
          motivoPadrao = 'Produto Incorreto/Invertido';
          qtdSugerida = i.quantidadeReal; 
          maxPermitido = i.quantidadeReal;
      } else if (isFaltaParcial && !isAvariado && !isIncorreto) {
          motivoPadrao = 'Falta Parcial (Gerar Crédito)';
          qtdSugerida = i.quantidadePedida - i.quantidadeReal;
          maxPermitido = i.quantidadePedida - i.quantidadeReal;
          isApenasFinanceiro = true;
      }

      selecao[i.id] = {
        selected: isSelected,
        nomeProduto: i.nomeProduto,
        valorUnitario: i.valorUnitarioPedido || 0,
        qtdMax: maxPermitido,
        qtd: qtdSugerida > 0 ? qtdSugerida : 1,
        motivo: isSelected ? motivoPadrao : '',
        isApenasFinanceiro: isApenasFinanceiro
      };
    });
    setSelecaoPedido(selecao);
  };

  const updateSelecao = (itemId, field, value) => {
    setSelecaoPedido(prev => {
        let valFinal = value;
        if (field === 'qtd') {
            if (valFinal > prev[itemId].qtdMax) valFinal = prev[itemId].qtdMax;
            if (valFinal < 1) valFinal = 1;
        }
        return {
            ...prev,
            [itemId]: { ...prev[itemId], [field]: valFinal }
        }
    });
  };

  const handleAddItem = () => {
    if (!novoItem.nomeProduto) return alert('Digite o nome do produto.');
    setItens([...itens, novoItem]);
    setNovoItem({ nomeProduto: '', quantidade: 1, valorUnitario: 0 }); 
  };

  const handleRemoverItem = (index) => {
    const novaLista = [...itens];
    novaLista.splice(index, 1);
    setItens(novaLista);
  };

  const iniciarEdicaoItem = (index, item) => {
    setEditingIndex(index);
    setEditItemForm({
      nomeProduto: item.nomeProduto,
      quantidade: item.quantidade,
      valorUnitario: item.valorUnitario || 0
    });
  };

  const handleSalvarEdicaoItem = async (index) => {
    const item = itens[index];
    
    if (internalDevId && item.id) {
      setLoading(true);
      try {
        await api.put(`/api/devolucoes/${internalDevId}/item/${item.id}`, editItemForm);
        await carregarDevolucaoExistente(internalDevId);
        setEditingIndex(null);
      } catch (error) {
        alert('Erro ao atualizar o item da devolução.');
      } finally {
        setLoading(false);
      }
    } else {
      const novaLista = [...itens];
      novaLista[index] = { ...novaLista[index], ...editItemForm };
      setItens(novaLista);
      setEditingIndex(null);
    }
  };

  const handleSalvar = async () => {
    if (!form.fornecedorId) return alert('Selecione um Fornecedor.');

    let itensParaSalvar = itens;

    if (pedidoOriginal && !internalDevId) {
      itensParaSalvar = Object.values(selecaoPedido)
        .filter(s => s.selected && s.qtd > 0)
        .map(s => ({
           nomeProduto: s.motivo.trim() !== '' ? `${s.nomeProduto} - Motivo: ${s.motivo}` : s.nomeProduto,
           quantidade: s.qtd,
           valorUnitario: s.valorUnitario
        }));
    }

    if (itensParaSalvar.length === 0) return alert('Você não selecionou/adicionou nenhum produto para devolver.');

    setLoading(true);
    try {
      const payload = {
        fornecedor: { id: form.fornecedorId },
        pedido: pedidoId ? { id: pedidoId } : null,
        nfOrigem: form.nfOrigem,
        protocolo: form.protocolo,
        protocoloFalta: form.protocoloFalta,
        protocoloSobra: form.protocoloSobra,
        dataSolicitacao: form.dataSolicitacao,
        dataRecolhimento: form.status === 'AGUARDANDO_RECOLHIMENTO' ? null : (form.dataRecolhimento || null),
        formaAbatimento: form.formaAbatimento,
        observacaoAbatimento: form.observacaoAbatimento,
        status: form.status,
        itens: itensParaSalvar
      };

      if (internalDevId) {
        await api.put(`/api/devolucoes/${internalDevId}`, payload);
      } else {
        await api.post('/api/devolucoes', payload);
      }

      const idPedVinculado = pedidoId || form.pedido?.id;
      if (idPedVinculado) {
          let novoStatusPedido = 'PENDENTE_DEVOLUCAO';
          if (form.status === 'CONCLUIDA' || form.status === 'CANCELADA') {
              novoStatusPedido = 'ENTREGUE_SUCESSO';
          }
          await api.patch(`/api/pedidos/${idPedVinculado}/status`, { status: novoStatusPedido });
      }

      onSuccess();
    } catch (error) {
      alert('Erro ao salvar devolução.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calcTotal = () => {
    if (pedidoOriginal && !internalDevId) {
      return Object.values(selecaoPedido)
        .filter(s => s.selected)
        .reduce((acc, s) => acc + (s.qtd * s.valorUnitario), 0);
    }
    return itens.reduce((acc, item) => acc + ((item.quantidade || 0) * (item.valorUnitario || 0)), 0);
  };

  const mostrarDataRecolhimento = form.status === 'AGUARDANDO_CREDITO' || form.status === 'CONCLUIDA' || (readOnly && form.dataRecolhimento);
  const idPedVinculado = pedidoId || form.pedido?.id;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '100%', maxWidth: '900px', maxHeight: '95vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
        
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', backgroundColor: '#f8fafc', borderRadius: '12px 12px 0 0' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', color: '#1e293b' }}>
              {readOnly ? `Detalhes da Devolução #${internalDevId}` : (internalDevId ? `Editar Devolução #${internalDevId}` : 'Registrar Nova Devolução/Falta')}
            </h2>
            
            {idPedVinculado ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', backgroundColor: '#e0e7ff', color: '#3730a3', padding: '4px 8px', borderRadius: '4px' }}>
                        Vinculado ao Pedido #{idPedVinculado}
                    </span>
                    <button type="button" onClick={(e) => { e.preventDefault(); onClose(); navigate(`/pedidos/${idPedVinculado}`); }} style={{ fontSize: '11px', background: 'white', border: '1px solid #c7d2fe', color: '#4f46e5', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                        Ir para Pedido
                    </button>
                </div>
            ) : (
                <span style={{ fontSize: '12px', fontWeight: 'bold', backgroundColor: '#f3f4f6', color: '#4b5563', padding: '4px 8px', borderRadius: '4px', marginTop: '8px', display: 'inline-block' }}>
                    Registro Manual Avulso
                </span>
            )}
          </div>
          <button type="button" onClick={(e) => { e.preventDefault(); onClose(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={26} />
          </button>
        </div>

        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={styles.label}>Fornecedor *</label>
              <select style={styles.input} value={form.fornecedorId} onChange={e => setForm({...form, fornecedorId: e.target.value})} disabled={!!idPedVinculado || readOnly}>
                <option value="">Selecione...</option>
                {fornecedores.map(f => <option key={f.id} value={f.id}>{f.empresa || f.nome}</option>)}
              </select>
            </div>

            <div>
              <label style={styles.label}>Número da NF</label>
              <input type="text" style={styles.input} placeholder="Ex: 895886" value={form.nfOrigem} onChange={e => setForm({...form, nfOrigem: e.target.value})} disabled={readOnly} />
            </div>

            <div>
              <label style={styles.label}>Status da Devolução</label>
              <select style={styles.input} value={form.status} onChange={e => setForm({...form, status: e.target.value})} disabled={readOnly}>
                <option value="AGUARDANDO_RECOLHIMENTO">Aguardando Recolhimento</option>
                <option value="AGUARDANDO_CREDITO">Recolhido (Aguard. Crédito)</option>
                <option value="CONCLUIDA">Concluída</option>
                <option value="CANCELADA">Cancelada (Vendida/Resolvida)</option>
              </select>
            </div>

            <div>
              <label style={styles.label}>Data da Solicitação *</label>
              <input type="date" style={styles.input} value={form.dataSolicitacao} onChange={e => setForm({...form, dataSolicitacao: e.target.value})} disabled={readOnly} />
            </div>
            
            <div>
              <label style={styles.label}>Protocolo (Geral)</label>
              <input type="text" style={styles.input} value={form.protocolo} onChange={e => setForm({...form, protocolo: e.target.value})} disabled={readOnly} />
            </div>

            <div>
              <label style={styles.label}>Protocolo (Falta)</label>
              <input type="text" style={styles.input} value={form.protocoloFalta} onChange={e => setForm({...form, protocoloFalta: e.target.value})} disabled={readOnly} />
            </div>

            <div>
              <label style={styles.label}>Protocolo (Sobra)</label>
              <input type="text" style={styles.input} value={form.protocoloSobra} onChange={e => setForm({...form, protocoloSobra: e.target.value})} disabled={readOnly} />
            </div>

            {mostrarDataRecolhimento && (
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <label style={styles.label}>Data de Recolhimento</label>
                <input type="date" style={styles.input} value={form.dataRecolhimento || ''} onChange={e => setForm({...form, dataRecolhimento: e.target.value})} disabled={readOnly} />
              </div>
            )}

            <div>
              <label style={styles.label}>Como será abatido?</label>
              <select style={styles.input} value={form.formaAbatimento} onChange={e => setForm({...form, formaAbatimento: e.target.value})} disabled={readOnly}>
                <option value="PENDENTE">Pendente / Não resolvido</option>
                <option value="DESCONTO_BOLETO">Desconto no Boleto</option>
                <option value="NOTA_ABATIMENTO">Nota de Abatimento</option>
                <option value="PIX">Pix na Conta</option>
                <option value="REPOSICAO_PRODUTO">Reposição do Produto</option>
                <option value="BONIFICACAO">Bonificação</option>
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={styles.label}>Detalhes do Abatimento / Observações</label>
              <input type="text" style={styles.input} placeholder="Ex: Crédito no boleto com venc. 19/01/26 - Nota 1470263" value={form.observacaoAbatimento} onChange={e => setForm({...form, observacaoAbatimento: e.target.value})} disabled={readOnly} />
            </div>
          </div>

          <hr style={{ borderTop: '1px dashed #cbd5e1', margin: '24px 0' }} />

          {pedidoOriginal && !internalDevId ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', color: '#1e293b', margin: 0 }}>Selecione os Produtos e Motivos</h3>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={(e) => { e.preventDefault(); aplicarFiltroSelecao(pedidoOriginal, 'TOTAL'); }} style={{...styles.btnFiltro, color: '#166534', backgroundColor: '#dcfce7'}}><CheckSquare size={14}/> Devolução Total</button>
                  <button type="button" onClick={(e) => { e.preventDefault(); aplicarFiltroSelecao(pedidoOriginal, 'DIVERGENCIAS'); }} style={{...styles.btnFiltro, color: '#9a3412', backgroundColor: '#ffedd5'}}><ListX size={14}/> Apenas Divergências</button>
                </div>
              </div>

              <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ backgroundColor: '#f8fafc' }}>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                      <th style={{ padding: '12px', fontSize: '13px', width: '40px', textAlign: 'center' }}></th>
                      <th style={{ padding: '12px', fontSize: '13px' }}>Produto</th>
                      <th style={{ padding: '12px', fontSize: '13px', width: '100px', textAlign: 'center' }}>Qtd Abater</th>
                      <th style={{ padding: '12px', fontSize: '13px' }}>Motivo</th>
                      <th style={{ padding: '12px', fontSize: '13px', textAlign: 'right' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedidoOriginal.itens.map(item => {
                      const sel = selecaoPedido[item.id];
                      if(!sel) return null;

                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: sel.selected ? (sel.isApenasFinanceiro ? '#fef3c7' : '#f0fdf4') : 'white', opacity: sel.selected ? 1 : 0.6 }}>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <input 
                              type="checkbox" 
                              checked={sel.selected} 
                              onChange={(e) => updateSelecao(item.id, 'selected', e.target.checked)} 
                              style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                            />
                          </td>
                          <td style={{ padding: '12px', color: '#1e293b', fontWeight: '500', fontSize: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {sel.nomeProduto}
                                {sel.selected && sel.isApenasFinanceiro && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '10px', backgroundColor: '#f59e0b', color: 'white', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }} title="Não há produto físico para devolver. Gera apenas crédito.">
                                        <AlertCircle size={10} /> FALTA (Crédito)
                                    </span>
                                )}
                            </div>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <input 
                              type="number" 
                              min="1" 
                              max={sel.qtdMax}
                              value={sel.qtd} 
                              onChange={(e) => updateSelecao(item.id, 'qtd', Number(e.target.value))} 
                              disabled={!sel.selected}
                              style={{ width: '60px', padding: '4px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                            />
                          </td>
                          <td style={{ padding: '12px' }}>
                            <input 
                              type="text" 
                              value={sel.motivo} 
                              onChange={(e) => updateSelecao(item.id, 'motivo', e.target.value)} 
                              disabled={!sel.selected}
                              style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px' }}
                            />
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: sel.selected ? '#16a34a' : '#9ca3af' }}>
                            R$ {(sel.qtd * sel.valorUnitario).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div>
              <h3 style={{ fontSize: '16px', color: '#1e293b', marginBottom: '16px' }}>Produtos Informados</h3>
              
              {!readOnly && (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginBottom: '16px', backgroundColor: '#f1f5f9', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ flex: 2 }}>
                    <label style={styles.label}>Nome do Produto / Motivo</label>
                    <input type="text" style={styles.input} placeholder="Nome do produto - Motivo" value={novoItem.nomeProduto} onChange={e => setNovoItem({...novoItem, nomeProduto: e.target.value})} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>Qtd.</label>
                    <input type="number" min="1" style={styles.input} value={novoItem.quantidade} onChange={e => setNovoItem({...novoItem, quantidade: Number(e.target.value)})} onFocus={e => e.target.select()} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>Vlr Unit. (R$)</label>
                    <input type="number" step="0.01" style={styles.input} value={novoItem.valorUnitario} onChange={e => setNovoItem({...novoItem, valorUnitario: Number(e.target.value)})} onFocus={e => e.target.select()} />
                  </div>
                  <button type="button" onClick={(e) => { e.preventDefault(); handleAddItem(); }} style={{ height: '38px', padding: '0 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                    <Plus size={16} /> Adicionar
                  </button>
                </div>
              )}

              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '8px 0', fontSize: '13px' }}>Produto / Motivo</th>
                    <th style={{ padding: '8px 0', fontSize: '13px', textAlign: 'center' }}>Qtd</th>
                    <th style={{ padding: '8px 0', fontSize: '13px', textAlign: 'right' }}>Unitário</th>
                    <th style={{ padding: '8px 0', fontSize: '13px', textAlign: 'right' }}>Subtotal</th>
                    {!readOnly && <th style={{ padding: '8px 0', width: '70px' }}></th>}
                  </tr>
                </thead>
                <tbody>
                  {itens.length === 0 && (
                    <tr><td colSpan={readOnly ? "4" : "5"} style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>Nenhum produto adicionado.</td></tr>
                  )}
                  {itens.map((item, idx) => (
                    <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      {editingIndex === idx ? (
                        <>
                          <td style={{ padding: '12px 0' }}>
                            <input 
                              type="text" 
                              style={{...styles.input, padding: '4px 8px'}} 
                              value={editItemForm.nomeProduto} 
                              onChange={e => setEditItemForm({...editItemForm, nomeProduto: e.target.value})} 
                            />
                          </td>
                          <td style={{ padding: '12px 0', textAlign: 'center' }}>
                            <input 
                              type="number" 
                              min="1" 
                              style={{...styles.input, padding: '4px 8px', width: '60px', textAlign: 'center'}} 
                              value={editItemForm.quantidade} 
                              onChange={e => setEditItemForm({...editItemForm, quantidade: Number(e.target.value)})} 
                              onFocus={e => e.target.select()}
                            />
                          </td>
                          <td style={{ padding: '12px 0', textAlign: 'right' }}>
                            <input 
                              type="number" 
                              step="0.01" 
                              style={{...styles.input, padding: '4px 8px', width: '80px', textAlign: 'right'}} 
                              value={editItemForm.valorUnitario} 
                              onChange={e => setEditItemForm({...editItemForm, valorUnitario: Number(e.target.value)})} 
                              onFocus={e => e.target.select()}
                            />
                          </td>
                          <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 'bold', color: '#16a34a' }}>
                            R$ {(editItemForm.quantidade * editItemForm.valorUnitario).toFixed(2)}
                          </td>
                          {!readOnly && (
                            <td style={{ padding: '12px 0', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSalvarEdicaoItem(idx); }} style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer' }} title="Salvar">
                                  <Check size={18} />
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingIndex(null); }} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }} title="Cancelar">
                                  <X size={18} />
                                </button>
                              </div>
                            </td>
                          )}
                        </>
                      ) : (
                        <>
                          <td style={{ padding: '12px 0', color: '#334155', fontWeight: '500' }}>{item.nomeProduto}</td>
                          <td style={{ padding: '12px 0', textAlign: 'center' }}>{item.quantidade}</td>
                          <td style={{ padding: '12px 0', textAlign: 'right' }}>R$ {(item.valorUnitario || 0).toFixed(2)}</td>
                          <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 'bold', color: '#16a34a' }}>R$ {((item.quantidade || 0) * (item.valorUnitario || 0)).toFixed(2)}</td>
                          {!readOnly && (
                            <td style={{ padding: '12px 0', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={(e) => { e.preventDefault(); iniciarEdicaoItem(idx, item); }} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer' }} title="Editar Produto">
                                  <Edit2 size={16} />
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); handleRemoverItem(idx); }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="Remover Produto">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          )}
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>

        <div style={{ padding: '20px 24px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', borderRadius: '0 0 12px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '18px', color: '#1e293b' }}>
            Total a Ressarcir: <strong style={{ color: '#16a34a', fontSize: '24px' }}>R$ {calcTotal().toFixed(2)}</strong>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" onClick={(e) => { e.preventDefault(); onClose(); }} disabled={loading} style={{ padding: '10px 20px', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', color: '#475569' }}>
              {readOnly ? 'Fechar' : 'Cancelar'}
            </button>
            {!readOnly && (
              <button type="button" onClick={(e) => { e.preventDefault(); handleSalvar(); }} disabled={loading} style={{ padding: '10px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Save size={18} /> {loading ? 'Salvando...' : 'Salvar Devolução/Crédito'}
              </button>
            )}
          </div>
        </div>

      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

const styles = {
  label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' },
  input: { width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box', fontSize: '14px', fontFamily: 'inherit' },
  btnFiltro: { display: 'flex', alignItems: 'center', gap: '4px', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }
};