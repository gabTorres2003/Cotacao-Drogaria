import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, PackageSearch, FileText } from 'lucide-react';
import api from '../services/api'; // Ajuste o caminho se necessário

export default function FornecedorDashboard() {
  const [cotacoes, setCotacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const nomeUsuario = localStorage.getItem('nomeUsuario') || 'Fornecedor';
  const nomeFornecedor = localStorage.getItem('nomeFornecedor') || 'Fornecedor';

  useEffect(() => {
    const fetchMinhasCotacoes = async () => {
      try {
        const response = await api.get('/api/cotacao-fornecedor/minhas-cotacoes');
        setCotacoes(response.data);
      } catch (error) {
        console.error('Erro ao buscar cotações', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMinhasCotacoes();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      
      {/* HEADER EXCLUSIVO DO FORNECEDOR */}
      <header style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <PackageSearch size={28} color="#16a34a" />
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
            Portal do Fornecedor
          </h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
            Olá, <strong style={{ color: '#0f172a' }}>{nomeUsuario}</strong>
          </span>
          <button 
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#ef4444', fontWeight: '600', cursor: 'pointer' }}
          >
            <LogOut size={18} /> Sair
          </button>
        </div>
      </header>

      {/* ÁREA DE CONTEÚDO */}
      <main style={{ flex: 1, padding: '32px', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 8px 0' }}>Cotações Ativas</h2>
          <p style={{ color: '#64748b', margin: 0 }}>Visualize as cotações enviadas pela Drogaria Torres Farma para você.</p>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '16px 24px', color: '#64748b', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase' }}>ID Cotação</th>
                <th style={{ padding: '16px 24px', color: '#64748b', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase' }}>Data de Envio</th>
                <th style={{ padding: '16px 24px', color: '#64748b', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '16px 24px', color: '#64748b', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', textAlign: 'right' }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Buscando cotações...</td></tr>
              ) : cotacoes.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '40px 24px', textAlign: 'center', color: '#64748b' }}>
                    <FileText size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
                    <p style={{ margin: 0, fontSize: '16px' }}>Nenhuma cotação ativa enviada para você no momento.</p>
                  </td>
                </tr>
              ) : (
                cotacoes.map(cotacao => (
                  <tr key={cotacao.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '16px 24px', fontWeight: '600', color: '#334155' }}>#{cotacao.id}</td>
                    <td style={{ padding: '16px 24px', color: '#64748b' }}>{cotacao.dataEnvio || 'Data não informada'}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: '600', backgroundColor: '#fef3c7', color: '#b45309' }}>
                        Pendente de Resposta
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <button style={{ backgroundColor: '#16a34a', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: '600', cursor: 'pointer' }}>
                        Responder
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}