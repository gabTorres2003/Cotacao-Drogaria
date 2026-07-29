import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, PackageSearch, FileText, CheckCircle } from 'lucide-react'
import api from '../services/api'

export default function FornecedorDashboard() {
  const [cotacoes, setCotacoes] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('cotacoes') 
  
  const navigate = useNavigate()
  const nomeUsuario = localStorage.getItem('nomeUsuario') || 'Fornecedor'
  const usuarioId = localStorage.getItem('usuarioId')

  useEffect(() => {
    const registrarNavegacao = async () => {
      if (nomeUsuario && nomeUsuario !== 'Fornecedor') {
        try {
          await api.post('/api/auditoria/registrar', {
            nomeUsuario: nomeUsuario,
            tipoUsuario: 'FORNECEDOR',
            acao: 'NAVEGACAO',
            detalhes: `Acessou o Painel do Fornecedor (Aba: ${activeTab.toUpperCase()})`
          });
        } catch (error) { console.error("Erro ao registrar navegação", error); }
      }
    };
    registrarNavegacao();
  }, [activeTab, nomeUsuario]);

  useEffect(() => {
    fetchDados()
  }, [usuarioId, activeTab])

  const fetchDados = async () => {
    setLoading(true)
    try {
      if (usuarioId) {
        if (activeTab === 'cotacoes') {
          const response = await api.get(`/api/cotacao-fornecedor/fornecedor/${usuarioId}`)
          setCotacoes(response.data)
        } else {
          const response = await api.get(`/api/pedidos/fornecedor/${usuarioId}`)
          setPedidos(response.data)
        }
      }
    } catch (error) {
      console.error(`Erro ao buscar ${activeTab}`, error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await api.post('/api/auditoria/registrar', {
        nomeUsuario: nomeUsuario,
        tipoUsuario: 'FORNECEDOR',
        acao: 'LOGOUT',
        detalhes: 'Fornecedor encerrou a sessão no sistema.'
      });
    } catch (error) { console.error(error); }

    localStorage.clear()
    navigate('/')
  }

  // TEXTOS DE CONFIRMAÇÃO ATUALIZADOS AQUI
  const handleConfirmarFabrica = async (pedidoId) => {
    if(window.confirm("Confirmar o processamento deste pedido na fábrica/distribuidora? A farmácia será notificada e ficará aguardando a entrega.")) {
      try {
        await api.patch(`/api/pedidos/${pedidoId}/status`, { status: "CONFIRMADO_FORNECEDOR" })
        
        try {
          await api.post('/api/auditoria/registrar', {
            nomeUsuario: nomeUsuario,
            tipoUsuario: 'FORNECEDOR',
            acao: 'CONFIRMACAO_PEDIDO',
            detalhes: `Fornecedor confirmou o processamento na fábrica do Pedido #${pedidoId}.`
          });
        } catch(e) {}

        alert("Pedido marcado como CONFIRMADO com sucesso!")
        fetchDados()
      } catch(error) {
        alert("Erro ao confirmar o pedido.")
      }
    }
  }

  const formatarDataHora = (dataIso) => {
    if (!dataIso) return 'Data não informada'
    const data = new Date(dataIso)
    if (isNaN(data.getTime())) return dataIso

    return (
      data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' às ' +
      data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    )
  }

  const fMoney = (v) => v != null ? Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'

  const styles = {
    tabButton: (isActive) => ({
      padding: '12px 24px',
      fontSize: '15px',
      fontWeight: '600',
      border: 'none',
      borderBottom: isActive ? '3px solid #2563eb' : '3px solid transparent',
      backgroundColor: 'transparent',
      color: isActive ? '#2563eb' : '#64748b',
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    })
  }

  const getBadgeFornecedor = (status) => {
    if (status === 'PENDENTE_ENTREGA') return null;
    if (status === 'CONFIRMADO_FORNECEDOR') {
      return <span style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={14} /> CONFIRMADO NA FÁBRICA</span>;
    }

    if (status.includes('ENTREGUE') || status.includes('DIVERGENCIA') || status.includes('VALORES') || status.includes('DEVOLUCAO')) {
      return <span style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#dcfce7', color: '#166534', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={14} /> ENTREGUE NA FARMÁCIA</span>;
    }

    return <span style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#f3f4f6', color: '#4b5563' }}>{status}</span>;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', fontFamily: "'Segoe UI', sans-serif" }}>
      <style>{`
        @media (max-width: 768px) {
          .dash-header { padding: 12px 16px !important; flex-direction: column; gap: 12px; align-items: flex-start !important; }
          .dash-main { padding: 16px !important; }
          .table-container { display: none !important; }
          .mobile-cards { display: flex !important; flex-direction: column; gap: 12px; }
          .pedido-scroll { overflow-x: auto; }
        }
        @media (min-width: 769px) { .mobile-cards { display: none !important; } }
      `}</style>

      <header className="dash-header" style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/assets/logo-torres.png" alt="Drogaria Torres Farma" style={{ height: '32px' }} />
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Portal do Fornecedor</h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
            Olá, <strong style={{ color: '#0f172a' }}>{nomeUsuario}</strong>
          </span>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#ef4444', fontWeight: '600', cursor: 'pointer' }}>
            <LogOut size={18} /> Sair
          </button>
        </div>
      </header>

      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 32px' }}>
        <div style={{ display: 'flex', gap: '20px', maxWidth: '1200px', margin: '0 auto', overflowX: 'auto' }}>
          <button style={styles.tabButton(activeTab === 'cotacoes')} onClick={() => setActiveTab('cotacoes')}>
            <FileText size={18} /> Cotações
          </button>
          <button style={styles.tabButton(activeTab === 'pedidos')} onClick={() => setActiveTab('pedidos')}>
            <PackageSearch size={18} /> Meus Pedidos
          </button>
        </div>
      </div>

      <main className="dash-main" style={{ flex: 1, padding: '32px', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 8px 0' }}>
            {activeTab === 'cotacoes' ? 'Cotações Ativas' : 'Meus Pedidos'}
          </h2>
          <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>
            {activeTab === 'cotacoes' ? 'Visualize as cotações enviadas pela Drogaria Torres Farma para você.' : 'Gerencie os pedidos gerados a partir das cotações e confirme as entregas.'}
          </p>
        </div>

        {loading ? (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '40px', textAlign: 'center', color: '#64748b' }}>
            Buscando dados...
          </div>
        ) : (
          activeTab === 'cotacoes' ? (
            cotacoes.length === 0 ? (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '40px 24px', textAlign: 'center', color: '#64748b' }}>
                <FileText size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
                <p style={{ margin: 0, fontSize: '16px' }}>Nenhuma cotação ativa enviada para você no momento.</p>
              </div>
            ) : (
              <>
                <div className="table-container" style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
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
                      {cotacoes.map((vinculo) => {
                        const idCotacao = vinculo.cotacao ? vinculo.cotacao.id : vinculo.id
                        const dataEnvio = vinculo.cotacao ? vinculo.cotacao.dataCriacao || vinculo.dataEnvio : vinculo.dataEnvio
                        const status = vinculo.status || 'PENDENTE'
                        const isRespondida = status === 'RESPONDIDA'

                        return (
                          <tr key={vinculo.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '16px 24px', fontWeight: '600', color: '#334155' }}>#{idCotacao}</td>
                            <td style={{ padding: '16px 24px', color: '#64748b' }}>{formatarDataHora(dataEnvio)}</td>
                            <td style={{ padding: '16px 24px' }}>
                              <span style={{ padding: '4px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: '600', backgroundColor: isRespondida ? '#dcfce7' : '#fef3c7', color: isRespondida ? '#15803d' : '#b45309' }}>
                                {isRespondida ? 'Respondida' : 'Pendente'}
                              </span>
                            </td>
                            <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                              <button onClick={() => navigate(`/responder-cotacao/${idCotacao}`)} style={{ backgroundColor: isRespondida ? '#2563eb' : '#16a34a', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: '600', cursor: 'pointer' }}>
                                {isRespondida ? 'Ver / Editar' : 'Responder'}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mobile-cards">
                  {cotacoes.map((vinculo) => {
                    const idCotacao = vinculo.cotacao ? vinculo.cotacao.id : vinculo.id
                    const dataEnvio = vinculo.cotacao ? vinculo.cotacao.dataCriacao || vinculo.dataEnvio : vinculo.dataEnvio
                    const status = vinculo.status || 'PENDENTE'
                    const isRespondida = status === 'RESPONDIDA'

                    return (
                      <div key={vinculo.id} style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', boxSizing: 'border-box' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#1e293b' }}>Cotação #{idCotacao}</span>
                          <span style={{ padding: '4px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: '600', backgroundColor: isRespondida ? '#dcfce7' : '#fef3c7', color: isRespondida ? '#15803d' : '#b45309' }}>
                            {isRespondida ? 'Respondida' : 'Pendente'}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>Enviada em: {formatarDataHora(dataEnvio)}</div>
                        <div>
                          <button onClick={() => navigate(`/responder-cotacao/${idCotacao}`)} style={{ width: '100%', backgroundColor: isRespondida ? '#2563eb' : '#16a34a', color: 'white', padding: '10px', borderRadius: '6px', border: 'none', fontWeight: '600', cursor: 'pointer', textAlign: 'center' }}>
                            {isRespondida ? 'Ver / Editar Proposta' : 'Responder Cotação'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )
          ) : (
            pedidos.length === 0 ? (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '40px 24px', textAlign: 'center', color: '#64748b' }}>
                <PackageSearch size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
                <p style={{ margin: 0, fontSize: '16px' }}>A farmácia ainda não aprovou nenhum pedido de compra para você.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {pedidos.map((pedido) => {
                  const badge = getBadgeFornecedor(pedido.status);

                  return (
                    <div key={pedido.id} style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                      <div style={{ backgroundColor: '#f8fafc', padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <h3 style={{ margin: 0, color: '#0f172a', fontSize: '18px' }}>Pedido #{pedido.id}</h3>
                          <span style={{ fontSize: '13px', color: '#64748b' }}>Data: {formatarDataHora(pedido.dataCriacao)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#16a34a' }}>{fMoney(pedido.valorTotalPedido)}</span>
                          
                          {badge === null ? (
                            // BOTÃO DO FORNECEDOR ATUALIZADO AQUI
                            <button onClick={() => handleConfirmarFabrica(pedido.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#10b981', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: '600', cursor: 'pointer' }}>
                              <CheckCircle size={16} /> Confirmar Pedido
                            </button>
                          ) : (
                            badge
                          )}
                        </div>
                      </div>
                      
                      <div className="pedido-scroll" style={{ padding: '16px 24px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
                          <thead>
                            <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                              <th style={{ padding: '12px', color: '#64748b', fontSize: '13px' }}>Produto Solicitado</th>
                              <th style={{ padding: '12px', color: '#64748b', fontSize: '13px', textAlign: 'center' }}>Qtd</th>
                              <th style={{ padding: '12px', color: '#64748b', fontSize: '13px', textAlign: 'right' }}>Unitário</th>
                              <th style={{ padding: '12px', color: '#64748b', fontSize: '13px', textAlign: 'right' }}>Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pedido.itens.map(item => (
                              <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '12px', color: '#334155', fontWeight: '500' }}>{item.nomeProduto}</td>
                                <td style={{ padding: '12px', textAlign: 'center', color: '#334155' }}>{item.quantidadePedida} un</td>
                                <td style={{ padding: '12px', textAlign: 'right', color: '#64748b' }}>{fMoney(item.valorUnitarioPedido)}</td>
                                <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#334155' }}>{fMoney(item.quantidadePedida * item.valorUnitarioPedido)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          )
        )}
      </main>
    </div>
  )
}