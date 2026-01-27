import { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import { FileWarning, Trophy, TrendingUp, Search, Calendar, AlertTriangle } from 'lucide-react';

export default function Relatorios() {
  const [abaAtiva, setAbaAtiva] = useState('ruptura');

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <header style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '5px' }}>Relatórios Estratégicos</h1>
          <p style={{ color: '#6b7280' }}>Análise de dados para tomada de decisão</p>
        </header>

        {/* --- NAVEGAÇÃO ENTRE RELATÓRIOS (ABAS) --- */}
        <div style={styles.tabsContainer}>
          <button 
            style={abaAtiva === 'ruptura' ? styles.tabActive : styles.tab}
            onClick={() => setAbaAtiva('ruptura')}
          >
            <FileWarning size={18} /> Relatório de Ruptura
          </button>
          
          <button 
            style={abaAtiva === 'ranking' ? styles.tabActive : styles.tab}
            onClick={() => setAbaAtiva('ranking')}
          >
            <Trophy size={18} /> Ranking de Competitividade
          </button>
          
          <button 
            style={abaAtiva === 'historico' ? styles.tabActive : styles.tab}
            onClick={() => setAbaAtiva('historico')}
          >
            <TrendingUp size={18} /> Histórico de Preços
          </button>
        </div>

        {/* --- CONTEÚDO DA ABA SELECIONADA --- */}
        <div style={styles.contentArea}>
          {abaAtiva === 'ruptura' && <RelatorioRuptura />}
          {abaAtiva === 'ranking' && <RelatorioRanking />}
          {abaAtiva === 'historico' && <RelatorioHistorico />}
        </div>
      </main>
    </div>
  );
}

// --- COMPONENTES DOS RELATÓRIOS ---

function RelatorioRuptura() {
  // DADOS SIMULADOS (Substituir por API futuramente)
  const dados = [
    { produto: 'Dipirona 500mg', faltas: 12, frequencia: 'Alta', ultimoFornecedor: 'Santa Cruz' },
    { produto: 'Losartana 50mg', faltas: 8, frequencia: 'Média', ultimoFornecedor: 'Panpharma' },
    { produto: 'Omeprazol 20mg', faltas: 5, frequencia: 'Baixa', ultimoFornecedor: 'Profarma' },
    { produto: 'Dorflex 30cp', faltas: 3, frequencia: 'Baixa', ultimoFornecedor: 'Santa Cruz' },
  ];

  return (
    <div>
      <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', padding: '15px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca'}}>
        <AlertTriangle size={24} color="#dc2626" />
        <div>
          <h3 style={{color: '#991b1b', margin: 0}}>Alerta de Estoque</h3>
          <p style={{margin: 0, fontSize: '14px', color: '#b91c1c'}}>Estes produtos foram marcados como "Em Falta" frequentemente nas últimas cotações.</p>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Produto</th>
              <th>Vezes em Falta</th>
              <th>Frequência</th>
              <th>Último Fornecedor Cotado</th>
            </tr>
          </thead>
          <tbody>
            {dados.map((d, i) => (
              <tr key={i}>
                <td style={{fontWeight: '600'}}>{d.produto}</td>
                <td style={{textAlign: 'center'}}>{d.faltas}</td>
                <td>
                  <span style={{
                    padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
                    backgroundColor: d.frequencia === 'Alta' ? '#fee2e2' : d.frequencia === 'Média' ? '#fef3c7' : '#dcfce7',
                    color: d.frequencia === 'Alta' ? '#991b1b' : d.frequencia === 'Média' ? '#92400e' : '#166534'
                  }}>
                    {d.frequencia}
                  </span>
                </td>
                <td style={{color: '#6b7280'}}>{d.ultimoFornecedor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RelatorioRanking() {
  const dados = [
    { nome: 'Distribuidora Santa Cruz', vitorias: 45, participacao: 12, taxaSucesso: '32%' },
    { nome: 'Panpharma', vitorias: 30, participacao: 10, taxaSucesso: '28%' },
    { nome: 'Profarma', vitorias: 15, participacao: 12, taxaSucesso: '15%' },
    { nome: 'Genérica Distribuidora', vitorias: 5, participacao: 5, taxaSucesso: '10%' },
  ];

  return (
    <div>
      <div style={{marginBottom: '20px', padding: '15px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #dbeafe'}}>
        <h3 style={{color: '#1e40af', margin: '0 0 5px 0'}}>Campeões de Preço</h3>
        <p style={{margin: 0, fontSize: '14px', color: '#1e3a8a'}}>Ranking baseado na quantidade de itens ganhos nas cotações finalizadas.</p>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Posição</th>
              <th>Fornecedor</th>
              <th>Itens Ganhos</th>
              <th>Cotações Participadas</th>
              <th>Taxa de Sucesso</th>
            </tr>
          </thead>
          <tbody>
            {dados.map((d, i) => (
              <tr key={i}>
                <td>
                  <div style={{
                    width: '30px', height: '30px', borderRadius: '50%', 
                    background: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : '#f3f4f6',
                    color: i > 2 ? '#6b7280' : 'white', fontWeight: 'bold',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {i + 1}º
                  </div>
                </td>
                <td style={{fontWeight: '500'}}>{d.nome}</td>
                <td style={{color: '#16a34a', fontWeight: 'bold'}}>{d.vitorias} itens</td>
                <td>{d.participacao}</td>
                <td>{d.taxaSucesso}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RelatorioHistorico() {
  const [busca, setBusca] = useState('');
  
  const dados = [
    { data: '25/01/2026', produto: 'Dipirona 500mg', preco: 2.50, fornecedor: 'Santa Cruz' },
    { data: '10/01/2026', produto: 'Dipirona 500mg', preco: 2.45, fornecedor: 'Panpharma' },
    { data: '20/12/2025', produto: 'Dipirona 500mg', preco: 2.30, fornecedor: 'Profarma' },
    { data: '25/01/2026', produto: 'Torsilax 30cp', preco: 12.90, fornecedor: 'Genérica' },
  ];

  const filtrados = dados.filter(d => d.produto.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div>
      <div style={{display: 'flex', gap: '15px', marginBottom: '20px'}}>
        <div style={{flex: 1, display: 'flex', alignItems: 'center', gap: '10px', background: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db'}}>
          <Search size={18} color="#9ca3af" />
          <input 
            type="text" 
            placeholder="Pesquisar produto (ex: Dipirona)..." 
            style={{border: 'none', outline: 'none', width: '100%', fontSize: '15px'}}
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Data da Cotação</th>
              <th>Produto</th>
              <th>Preço Pago</th>
              <th>Fornecedor</th>
              <th>Variação</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
               <tr><td colSpan="5" style={{textAlign: 'center', padding: '20px', color: '#888'}}>Digite o nome de um produto para ver o histórico.</td></tr>
            ) : (
              filtrados.map((d, i) => (
                <tr key={i}>
                  <td style={{display: 'flex', alignItems: 'center', gap: '5px', color: '#666'}}>
                    <Calendar size={14} /> {d.data}
                  </td>
                  <td style={{fontWeight: '600'}}>{d.produto}</td>
                  <td>R$ {d.preco.toFixed(2).replace('.', ',')}</td>
                  <td>{d.fornecedor}</td>
                  <td>
                    {i > 0 ? (
                      <span style={{color: d.preco > dados[i-1].preco ? '#dc2626' : '#16a34a', fontSize: '13px', fontWeight: 'bold'}}>
                        {d.preco > dados[i-1].preco ? '▲ Subiu' : '▼ Caiu'}
                      </span>
                    ) : (
                      <span style={{color: '#6b7280', fontSize: '12px'}}>-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- ESTILOS INLINE (Simples) ---
const styles = {
  tabsContainer: {
    display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px'
  },
  tab: {
    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
    background: 'transparent', border: 'none', cursor: 'pointer',
    color: '#6b7280', fontWeight: '500', fontSize: '15px', borderRadius: '6px',
    transition: 'all 0.2s'
  },
  tabActive: {
    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
    background: 'white', border: '1px solid #e5e7eb', borderBottom: '2px solid #2563eb',
    color: '#2563eb', fontWeight: '600', fontSize: '15px', borderRadius: '6px 6px 0 0',
    cursor: 'default'
  },
  contentArea: {
    backgroundColor: 'white', padding: '20px', borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)', minHeight: '400px'
  }
};