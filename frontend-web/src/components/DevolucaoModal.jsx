import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { X, Plus, Trash2, Save } from 'lucide-react';

export default function DevolucaoModal({ devolucaoId, pedidoId, onClose, onSuccess }) {
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fornecedorId: '',
    nfOrigem: '',
    protocolo: '',
    protocoloFalta: '',
    protocoloSobra: '',
    dataRecolhimento: '',
    formaAbatimento: 'PENDENTE',
    observacaoAbatimento: '',
    status: 'AGUARDANDO_RECOLHIMENTO'
  });

  const [itens, setItens] = useState([]);
  const [novoItem, setNovoItem] = useState({ nomeProduto: '', quantidade: 1, valorUnitario: 0 });

  useEffect(() => {
    carregarListas();
    if (devolucaoId) {
      carregarDevolucaoExistente(devolucaoId);
    } else if (pedidoId) {
      preencherViaPedido(pedidoId);
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
      setForm({
        fornecedorId: data.fornecedor?.id || '',
        nfOrigem: data.nfOrigem || '',
        protocolo: data.protocolo || '',
        protocoloFalta: data.protocoloFalta || '',
        protocoloSobra: data.protocoloSobra || '',
        dataRecolhimento: data.dataRecolhimento || '',
        formaAbatimento: data.formaAbatimento || 'PENDENTE',
        observacaoAbatimento: data.observacaoAbatimento || '',
        status: data.status || 'AGUARDANDO_RECOLHIMENTO'
      });
      setItens(data.itens || []);
    } catch (error) { alert("Erro ao carregar devolução"); }
  };

  const preencherViaPedido = async (idPed) => {
    try {
      const { data } = await api.get(`/api/pedidos/${idPed}`);
      setForm(prev => ({ ...prev, fornecedorId: data.fornecedor?.id }));
      
      const itensDivergentes = data.itens
        .filter(i => i.statusRecebimento === 'AVARIADO' || i.statusRecebimento === 'INCORRETO')
        .map(i => ({
          nomeProduto: i.nomeProduto,
          quantidade: i.quantidadePedida - (i.quantidadeReal || 0), 
          valorUnitario: i.valorUnitarioPedido
        }));
      
      if(itensDivergentes.length > 0) setItens(itensDivergentes);

    } catch (error) { console.error(error); }
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

  const handleSalvar = async () => {
    if (!form.fornecedorId) return alert('Selecione um Fornecedor.');
    if (itens.length === 0) return alert('Adicione pelo menos um produto na devolução.');

    setLoading(true);
    try {
      const payload = {
        fornecedor: { id: form.fornecedorId },
        pedido: pedidoId ? { id: pedidoId } : null,
        nfOrigem: form.nfOrigem,
        protocolo: form.protocolo,
        protocoloFalta: form.protocoloFalta,
        protocoloSobra: form.protocoloSobra,
        dataRecolhimento: form.dataRecolhimento || null,
        formaAbatimento: form.formaAbatimento,
        observacaoAbatimento: form.observacaoAbatimento,
        status: form.status,
        itens: itens
      };

      if (devolucaoId) {
        await api.put(`/api/devolucoes/${devolucaoId}`, payload);
      } else {
        await api.post('/api/devolucoes', payload);
      }

      onSuccess();
    } catch (error) {
      alert('Erro ao salvar devolução.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calcTotal = itens.reduce((acc, item) => acc + (item.quantidade * item.valorUnitario), 0);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '100%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
        
        {/* HEADER MODAL */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: '12px 12px 0 0' }}>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#1e293b' }}>
            {devolucaoId ? `Editar Devolução #${devolucaoId}` : 'Registrar Devolução'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={24} />
          </button>
        </div>

        {/* CORPO MODAL (SCROLL) */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            
            {/* Bloco 1: Básicos */}
            <div>
              <label style={styles.label}>Fornecedor *</label>
              <select style={styles.input} value={form.fornecedorId} onChange={e => setForm({...form, fornecedorId: e.target.value})} disabled={!!pedidoId}>
                <option value="">Selecione...</option>
                {fornecedores.map(f => <option key={f.id} value={f.id}>{f.empresa || f.nome}</option>)}
              </select>
            </div>

            <div>
              <label style={styles.label}>Número da NF</label>
              <input type="text" style={styles.input} placeholder="Ex: 895886" value={form.nfOrigem} onChange={e => setForm({...form, nfOrigem: e.target.value})} />
            </div>

            <div>
              <label style={styles.label}>Status da Devolução</label>
              <select style={styles.input} value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                <option value="AGUARDANDO_RECOLHIMENTO">Aguardando Recolhimento</option>
                <option value="AGUARDANDO_CREDITO">Recolhido (Aguard. Crédito)</option>
                <option value="CONCLUIDA">Concluída</option>
                <option value="CANCELADA">Cancelada (Vendida/Resolvida)</option>
              </select>
            </div>
            
            {/* Bloco 2: Protocolos e Recolhimento */}
            <div>
              <label style={styles.label}>Protocolo (Geral)</label>
              <input type="text" style={styles.input} value={form.protocolo} onChange={e => setForm({...form, protocolo: e.target.value})} />
            </div>

            <div>
              <label style={styles.label}>Protocolo (Falta)</label>
              <input type="text" style={styles.input} value={form.protocoloFalta} onChange={e => setForm({...form, protocoloFalta: e.target.value})} />
            </div>

            <div>
              <label style={styles.label}>Protocolo (Sobra)</label>
              <input type="text" style={styles.input} value={form.protocoloSobra} onChange={e => setForm({...form, protocoloSobra: e.target.value})} />
            </div>

            {/* Bloco 3: Financeiro / Resolução */}
            <div>
              <label style={styles.label}>Data de Recolhimento</label>
              <input type="date" style={styles.input} value={form.dataRecolhimento} onChange={e => setForm({...form, dataRecolhimento: e.target.value})} />
            </div>

            <div>
              <label style={styles.label}>Como será abatido?</label>
              <select style={styles.input} value={form.formaAbatimento} onChange={e => setForm({...form, formaAbatimento: e.target.value})}>
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
              <input type="text" style={styles.input} placeholder="Ex: Crédito no boleto com venc. 19/01/26 - Nota 1470263" value={form.observacaoAbatimento} onChange={e => setForm({...form, observacaoAbatimento: e.target.value})} />
            </div>
          </div>

          <hr style={{ borderTop: '1px dashed #cbd5e1', margin: '24px 0' }} />

          {/* LISTA DE PRODUTOS DEVOLVIDOS */}
          <h3 style={{ fontSize: '16px', color: '#1e293b', marginBottom: '16px' }}>Produtos Devolvidos</h3>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginBottom: '16px', backgroundColor: '#f1f5f9', padding: '16px', borderRadius: '8px' }}>
            <div style={{ flex: 2 }}>
              <label style={styles.label}>Nome do Produto</label>
              <input type="text" style={styles.input} value={novoItem.nomeProduto} onChange={e => setNovoItem({...novoItem, nomeProduto: e.target.value})} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>Qtd.</label>
              <input type="number" min="1" style={styles.input} value={novoItem.quantidade} onChange={e => setNovoItem({...novoItem, quantidade: Number(e.target.value)})} onFocus={e => e.target.select()} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>Vlr Unit. (R$)</label>
              <input type="number" step="0.01" style={styles.input} value={novoItem.valorUnitario} onChange={e => setNovoItem({...novoItem, valorUnitario: Number(e.target.value)})} onFocus={e => e.target.select()} />
            </div>
            <button onClick={handleAddItem} style={{ height: '38px', padding: '0 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
              <Plus size={16} /> Adicionar
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                <th style={{ padding: '8px 0', fontSize: '13px' }}>Produto</th>
                <th style={{ padding: '8px 0', fontSize: '13px', textAlign: 'center' }}>Qtd</th>
                <th style={{ padding: '8px 0', fontSize: '13px', textAlign: 'right' }}>Unitário</th>
                <th style={{ padding: '8px 0', fontSize: '13px', textAlign: 'right' }}>Subtotal</th>
                <th style={{ padding: '8px 0', width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {itens.length === 0 && (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>Nenhum produto adicionado.</td></tr>
              )}
              {itens.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 0', color: '#334155', fontWeight: '500' }}>{item.nomeProduto}</td>
                  <td style={{ padding: '12px 0', textAlign: 'center' }}>{item.quantidade}</td>
                  <td style={{ padding: '12px 0', textAlign: 'right' }}>R$ {item.valorUnitario.toFixed(2)}</td>
                  <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 'bold', color: '#16a34a' }}>R$ {(item.quantidade * item.valorUnitario).toFixed(2)}</td>
                  <td style={{ padding: '12px 0', textAlign: 'right' }}>
                    <button onClick={() => handleRemoverItem(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FOOTER MODAL */}
        <div style={{ padding: '20px 24px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', borderRadius: '0 0 12px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '18px', color: '#1e293b' }}>
            Total a Ressarcir: <strong style={{ color: '#16a34a', fontSize: '22px' }}>R$ {calcTotal.toFixed(2)}</strong>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={onClose} disabled={loading} style={{ padding: '10px 20px', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', color: '#475569' }}>
              Cancelar
            </button>
            <button onClick={handleSalvar} disabled={loading} style={{ padding: '10px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Save size={18} /> {loading ? 'Salvando...' : 'Salvar Devolução'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' },
  input: { width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box', fontSize: '14px', fontFamily: 'inherit' }
};