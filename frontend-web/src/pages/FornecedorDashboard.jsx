import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, PackageSearch, FileText } from 'lucide-react';
import api from '../services/api';

export default function FornecedorDashboard() {
  const [cotacoes, setCotacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const nomeUsuario = localStorage.getItem('nomeUsuario') || 'Fornecedor';
  const usuarioId = localStorage.getItem('usuarioId');

  useEffect(() => {
    const fetchMinhasCotacoes = async () => {
      try {
        if (usuarioId) {
          const response = await api.get(`/api/cotacao-fornecedor/fornecedor/${usuarioId}`);
          setCotacoes(response.data);
        }
      } catch (error) {
        console.error('Erro ao buscar cotações', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMinhasCotacoes();
  }, [usuarioId]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const formatarDataHora = (dataIso) => {
    if (!dataIso) return 'Data não informada';
    const data = new Date(dataIso);
    if (isNaN(data.getTime())) return dataIso;
    
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }) + ' às ' + data.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', fontFamily: "'Segoe UI', sans-serif" }}>
      <style>{`
        @media (max-width: 768px) {
          .dash-header { padding: 12px 16px !important; flex-direction: column; gap: 12px; align-items: flex-start !important; }
          .dash-main { padding: 16px !important; }
          .table-container { overflow-x: auto; }
          .desktop-table { display: none !important; }
          .mobile-cards { display: flex !important; flex-direction: column; gap: 12px; }
        }
        @media (min-width: 769px) {
          .mobile-cards { display: none !important; }
        }
      `}</style>

      <header className="dash-header" style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <PackageSearch size={28} color="#16a34a" />
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
            Portal do Fornecedor
          </h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
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

      <main className="dash-main" style={{ flex: 1, padding: '32px', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 8px 0' }}>Cotações Ativas</h2>
          <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>Visualize as cotações enviadas pela Drogaria Torres Farma para você.</p>
        </div>

        {loading ? (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '40px', textAlign: 'center', color: '#64748b' }}>
            Buscando cotações...
          </div>
        ) : cotacoes.length === 0 ? (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '40px 24px', textAlign: 'center', color: '#64748b' }}>
            <FileText size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
            <p style={{ margin: 0, fontSize: '16px' }}>Nenhuma cotação ativa enviada para você no momento.</p>
          </div>
        ) : (
          <>
            {/* TABELA PARA DESKTOP */}
            <div className="table-container" style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table className="desktop-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <tr>
                    <th style={{ padding: '16px 24px', color: '#64748b', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase' }}>ID Cotação</th>
                    <th style={{ padding: '16px 24px', color: '#64748b', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase' }}>Data de Envio</th>
                    <th style={{ padding: '16px 24px', color: '#64748b', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '16px 24px', color: '#64748b', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', textAlign: 'right' }}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {cotacoes.map(vinculo => {
                    const idCotacao = vinculo.cotacao ? vinculo.cotacao.id : vinculo.id;
                    const dataEnvio = vinculo.cotacao ? (vinculo.cotacao.dataCriacao || vinculo.dataEnvio) : vinculo.dataEnvio;
                    const status = vinculo.status || 'PENDENTE';
                    const isRespondida = status === 'RESPONDIDA';

                    return (
                      <tr key={vinculo.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '16px 24px', fontWeight: '600', color: '#334155' }}>#{idCotacao}</td>
                        <td style={{ padding: '16px 24px', color: '#64748b' }}>
                          {formatarDataHora(dataEnvio)}
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <span style={{ 
                            padding: '4px 10px', 
                            borderRadius: '9999px', 
                            fontSize: '12px', 
                            fontWeight: '600', 
                            backgroundColor: isRespondida ? '#dcfce7' : '#fef3c7', 
                            color: isRespondida ? '#15803d' : '#b45309' 
                          }}>
                            {isRespondida ? 'Respondida' : 'Pendente'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                          <button 
                            onClick={() => navigate(`/responder-cotacao/${idCotacao}`)}
                            style={{ backgroundColor: isRespondida ? '#2563eb' : '#16a34a', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: '600', cursor: 'pointer' }}>
                            {isRespondida ? 'Ver / Editar' : 'Responder'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* CARDS PARA MOBILE */}
            <div className="mobile-cards">
              {cotacoes.map(vinculo => {
                const idCotacao = vinculo.cotacao ? vinculo.cotacao.id : vinculo.id;
                const dataEnvio = vinculo.cotacao ? (vinculo.cotacao.dataCriacao || vinculo.dataEnvio) : vinculo.dataEnvio;
                const status = vinculo.status || 'PENDENTE';
                const isRespondida = status === 'RESPONDIDA';

                return (
                  <div key={vinculo.id} style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#1e293b' }}>Cotação #{idCotacao}</span>
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: '9999px', 
                        fontSize: '12px', 
                        fontWeight: '600', 
                        backgroundColor: isRespondida ? '#dcfce7' : '#fef3c7', 
                        color: isRespondida ? '#15803d' : '#b45309' 
                      }}>
                        {isRespondida ? 'Respondida' : 'Pendente'}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                      Enviada em: {formatarDataHora(dataEnvio)}
                    </div>
                    <div>
                      <button 
                        onClick={() => navigate(`/responder-cotacao/${idCotacao}`)}
                        style={{ width: '100%', backgroundColor: isRespondida ? '#2563eb' : '#16a34a', color: 'white', padding: '10px', borderRadius: '6px', border: 'none', fontWeight: '600', cursor: 'pointer', textAlign: 'center' }}>
                        {isRespondida ? 'Ver / Editar Proposta' : 'Responder Cotação'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}