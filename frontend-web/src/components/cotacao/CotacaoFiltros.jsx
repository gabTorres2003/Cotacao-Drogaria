import React from 'react';
import { Search, Settings2 } from 'lucide-react';

export default function CotacaoFiltros({
  termoBusca, setTermoBusca, modoVisualizacao, subAbaItens, setSubAbaItens, isEncerrada,
  filtroOrigem, setFiltroOrigem, filtroPropostas, setFiltroPropostas,
  showColunasDropdown, setShowColunasDropdown, colunasVisiveis, setColunasVisiveis,
  fornecedores, fornecedoresVisiveis, setFornecedoresVisiveis
}) {
  return (
    <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', backgroundColor: 'var(--surface)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border)', alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid var(--border-strong)', padding: '8px 12px', borderRadius: '6px' }}>
        <Search size={18} color="var(--text-muted)" />
        <input 
          type="text" placeholder="Filtrar por produto..." value={termoBusca} 
          onChange={e => setTermoBusca(e.target.value)}
          style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px' }}
        />
      </div>
      
      {(modoVisualizacao === 'itens' || modoVisualizacao === 'comparativo') && (
        <div style={{ display: 'flex', gap: '6px', backgroundColor: 'var(--surface-muted)', padding: '6px', borderRadius: '8px', width: 'fit-content', flexWrap: 'wrap' }}>
          <button onClick={() => setSubAbaItens('todos')} style={{ padding: '8px 16px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: subAbaItens === 'todos' ? 'var(--surface)' : 'transparent', color: subAbaItens === 'todos' ? 'var(--purple)' : 'var(--text-muted)', boxShadow: subAbaItens === 'todos' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: '0.2s' }}>
            📑 Todos os Produtos
          </button>
          <button onClick={() => setSubAbaItens('pendentes')} style={{ padding: '8px 16px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: subAbaItens === 'pendentes' ? 'var(--surface)' : 'transparent', color: subAbaItens === 'pendentes' ? (isEncerrada ? 'var(--danger)' : 'var(--primary)') : 'var(--text-muted)', boxShadow: subAbaItens === 'pendentes' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: '0.2s' }}>
            {isEncerrada ? '🚨 Produtos em Falta' : '⏳ Itens Pendentes'}
          </button>
          <button onClick={() => setSubAbaItens('comprados')} style={{ padding: '8px 16px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: subAbaItens === 'comprados' ? 'var(--surface)' : 'transparent', color: subAbaItens === 'comprados' ? 'var(--success)' : 'var(--text-muted)', boxShadow: subAbaItens === 'comprados' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: '0.2s' }}>
            ✅ Já Pedidos / Comprados
          </button>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
        <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Origem:</span>
        <select value={filtroOrigem} onChange={e => setFiltroOrigem(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-strong)', outline: 'none', fontSize: '14px', cursor: 'pointer' }}>
          <option value="TODOS">Todas as Origens</option>
          <option value="Extra Manual">Extra Manual</option>
          <option value="Nova Importação">Atualização DNA</option>
          <option value="Falta Manual">Falta Manual</option>
          <option value="Sugestão">Sugestão</option>
          <option value="Falta e Sugestão">Falta e Sugestão</option>
          <option value="Geral">Geral</option>
        </select>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Status (Propostas):</span>
        <select value={filtroPropostas} onChange={e => setFiltroPropostas(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-strong)', outline: 'none', fontSize: '14px', cursor: 'pointer' }}>
          <option value="TODOS">Todos os Produtos</option>
          <option value="COM_PROPOSTAS">Com Propostas</option>
          <option value="SEM_PROPOSTAS">Sem Propostas (Falta Geral)</option>
        </select>
      </div>

      <div style={{ position: 'relative' }}>
        <button onClick={() => setShowColunasDropdown(!showColunasDropdown)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-strong)', backgroundColor: showColunasDropdown ? 'var(--surface-muted)' : 'var(--surface)', cursor: 'pointer', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '14px' }}>
          <Settings2 size={16} /> Colunas
        </button>
        {showColunasDropdown && (
          <div style={{ position: 'absolute', top: '110%', right: 0, backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px', zIndex: 50, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-subtle)', textTransform: 'uppercase', marginBottom: '4px' }}>Exibir na Tabela</div>
            {Object.entries({ quantidade: 'Qtd. Solicitada', qtdBalcao: 'Qtd. Balcão', qtdSugerida: 'Qtd. Sugerida', estoque: 'Estoque Atual', vmd: 'VMD', vendas30d: 'V30 (30 dias)', vendas60d: 'V60 (60 dias)', vendas90d: 'V90 (90 dias)', cad: 'CAD (dias)', cpd: 'CPD (dias)', vendidoAposUltCompra: 'Vend. pós Últ. Compra', ultCompraData: 'Data Últ. Compra', ultCompraQtde: 'Qtd. Últ. Compra', ultVendaData: 'Data Últ. Venda', ultimoPreco: 'Preço Últ. Compra', codBarras: 'Cód. Barras' }).map(([key, label]) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={colunasVisiveis[key]} onChange={(e) => setColunasVisiveis(prev => ({ ...prev, [key]: e.target.checked }))} style={{ transform: 'scale(1.1)' }} />
                {label}
              </label>
            ))}
            <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0' }}></div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-subtle)', textTransform: 'uppercase', marginBottom: '4px' }}>Fornecedores</div>
            {fornecedores.map(f => (
              <label key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={fornecedoresVisiveis[f] ?? true} onChange={(e) => setFornecedoresVisiveis(prev => ({ ...prev, [f]: e.target.checked }))} style={{ transform: 'scale(1.1)' }} />
                {f}
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}