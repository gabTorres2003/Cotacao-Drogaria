import { useEffect, useState } from 'react'
import api from '../services/api'
import Sidebar from '../components/layout/Sidebar'
import UploadModal from '../components/layout/UploadModal'
import { Upload, FileDown, MessageCircle, Eye, Search } from 'lucide-react'
import EnviarLinkModal from '../components/EnviarLinkModal'

export default function Dashboard() {
  const [cotacoes, setCotacoes] = useState([])
  const [modalAberto, setModalAberto] = useState(false)
  const [resumo, setResumo] = useState({ total: 0, abertas: 0 })
  const [cotacaoParaEnviar, setCotacaoParaEnviar] = useState(null)

  // Busca dados ao carregar a página
  useEffect(() => {
    carregarCotacoes()
  }, [])

  const carregarCotacoes = async () => {
    try {
      const response = await api.get('/api/cotacao')

      if (Array.isArray(response.data)) {
        setCotacoes(response.data)
      } else {
        console.error('ERRO: A API não retornou uma lista!', response.data)
        setCotacoes([])
      }
    } catch (error) {
      console.error('Erro ao carregar cotações:', error)
      setCotacoes([])
    }
  }

  // Funções de Ação
  const gerarLinkZap = async (idCotacao) => {
    const idFornecedorTeste = 1
    try {
      const response = await api.get('/api/fornecedor/gerar-link-whatsapp', {
        params: { idFornecedor: idFornecedorTeste, idCotacao },
      })
      window.open(response.data, '_blank')
    } catch (error) {
      alert(
        'Erro ao gerar Zap: ' + (error.response?.data || 'Erro desconhecido'),
      )
    }
  }

  return (
    <div className="layout">
      <Sidebar />

      <main className="main-content">
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '30px',
          }}
        >
          <h1>Painel de Cotações</h1>
          <button
            className="menu-item"
            style={{
              background: '#2563eb',
              color: 'white',
              justifyContent: 'center',
            }}
            onClick={() => setModalAberto(true)}
          >
            <Upload size={18} /> Nova Cotação
          </button>
        </header>

        {/* Cards de Resumo */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{resumo.total}</div>
            <div className="stat-label">Cotações Totais</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#eab308' }}>
              {resumo.abertas}
            </div>
            <div className="stat-label">Em Aberto</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#16a34a' }}>
              0
            </div>
            <div className="stat-label">Finalizadas</div>
          </div>
        </div>

        {/* Tabela de Cotações */}
        <div className="table-container">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h3>Histórico Recente</h3>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: '#f9fafb',
                padding: '5px 10px',
                borderRadius: '5px',
                border: '1px solid #eee',
              }}
            >
              <Search size={16} color="#999" />
              <input
                type="text"
                placeholder="Buscar..."
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Descrição / Data</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {cotacoes.map((c) => (
                <tr key={c.id}>
                  <td>#{c.id}</td>
                  <td>
                    <strong>{c.descricao || 'Cotação Sem Nome'}</strong>
                    <br />
                    <small style={{ color: '#888' }}>
                      {new Date(c.dataCriacao).toLocaleDateString()}
                    </small>
                  </td>
                  <td>
                    <span className={`status-badge status-${c.status}`}>
                      {c.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn-icon" title="Ver Detalhes">
                      <Eye size={18} />
                    </button>
                    <button
                      className="btn-icon"
                      title="Enviar por WhatsApp"
                      onClick={() => setCotacaoParaEnviar(c.id)}
                    >
                      <MessageCircle size={18} />
                    </button>
                    <button className="btn-icon" title="Baixar Pedido">
                      <FileDown size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {modalAberto && (
          <UploadModal
            onClose={() => setModalAberto(false)}
            onSuccess={carregarCotacoes}
          />
        )}
        {cotacaoParaEnviar && (
          <EnviarLinkModal
            idCotacao={cotacaoParaEnviar}
            onClose={() => setCotacaoParaEnviar(null)}
          />
        )}
      </main>
    </div>
  )
}
