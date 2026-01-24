import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Sidebar from '../components/layout/Sidebar'
import UploadModal from '../components/layout/UploadModal'
import { Upload, FileDown, MessageCircle, Eye, Search, Filter, ArrowUpDown } from 'lucide-react'
import EnviarLinkModal from '../components/EnviarLinkModal'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function Dashboard() {
  const [cotacoes, setCotacoes] = useState([])
  const [modalAberto, setModalAberto] = useState(false)
  
  // ESTADOS DE FILTRO
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('TODOS')
  const [ordemData, setOrdemData] = useState('RECENTES') // 'RECENTES' ou 'ANTIGAS'

  const [resumo, setResumo] = useState({ 
    total: 0, 
    abertas: 0, 
    pendentes: 0, 
    finalizadas: 0 
  })
  const [cotacaoParaEnviar, setCotacaoParaEnviar] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    carregarCotacoes()
  }, [])

  const carregarCotacoes = async () => {
    try {
      const response = await api.get('/api/cotacao')

      if (Array.isArray(response.data)) {
        setCotacoes(response.data)
        
        setResumo({
          total: response.data.length,
          abertas: response.data.filter((c) => c.status === 'ABERTA').length,
          pendentes: response.data.filter((c) => c.status === 'PENDENTE').length,
          finalizadas: response.data.filter((c) => c.status === 'FINALIZADA').length,
        })
      } else {
        setCotacoes([])
      }
    } catch (error) {
      console.error('Erro ao carregar cotações:', error)
      setCotacoes([])
    }
  }

  const cotacoesFiltradas = cotacoes
    .filter((c) => {
      // 1. Filtro de Texto 
      const textoBusca = busca.toLowerCase()
      const matchTexto = 
        c.descricao?.toLowerCase().includes(textoBusca) || 
        c.id.toString().includes(textoBusca)

      // 2. Filtro de Status
      const matchStatus = filtroStatus === 'TODOS' || c.status === filtroStatus

      return matchTexto && matchStatus
    })
    .sort((a, b) => {
      // 3. Ordenação por Data
      const dateA = new Date(a.dataCriacao)
      const dateB = new Date(b.dataCriacao)
      return ordemData === 'RECENTES' ? dateB - dateA : dateA - dateB
    })

  // FORMATADOR DE DATA (DD/MM/AA)
  const formatarDataBR = (dataIso) => {
    if (!dataIso) return '--/--/--';
    return new Date(dataIso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  }

  const baixarRelatorioGeral = async (idCotacao) => {
    try {
      const doc = new jsPDF()
      const response = await api.get(`/api/comparativo/relatorio/${idCotacao}`)
      const itens = response.data

      if (!itens || itens.length === 0) {
        alert('Essa cotação ainda não tem itens processados.')
        return
      }

      doc.setFontSize(18)
      doc.text(`Relatório de Fechamento - Cotação #${idCotacao}`, 14, 20)
      doc.setFontSize(12)
      doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, 14, 30)

      const linhas = itens.map((item) => {
        const vencedor = item.fornecedorVencedor || 'Sem Oferta'
        const preco = item.menorPrecoEncontrado || 0
        const total = preco * item.quantidade

        return [
          item.nomeProduto,
          item.quantidade,
          vencedor,
          preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
          total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        ]
      })

      const totalGeral = itens.reduce((acc, item) => {
        const preco = item.menorPrecoEncontrado || 0
        return acc + preco * item.quantidade
      }, 0)

      autoTable(doc, {
        startY: 40,
        head: [['Produto', 'Qtd', 'Vencedor', 'Unitário', 'Total']],
        body: linhas,
        foot: [
          [ '', '', '', 'TOTAL GERAL', totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })],
        ],
        theme: 'striped',
        headStyles: { fillColor: [22, 163, 74] },
      })

      doc.save(`Relatorio_Geral_Cotacao_${idCotacao}.pdf`)
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      alert('Erro ao gerar o relatório.')
    }
  }

  return (
    <div className="layout">
      <Sidebar />

      <main className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h1 style={{fontSize: '24px', marginBottom: '5px'}}>Painel de Cotações</h1>
            <p style={{color: '#6b7280'}}>Gerencie suas compras e fornecedores</p>
          </div>
          
          <button className="btn-new-cotacao" onClick={() => setModalAberto(true)}>
            <Upload size={20} /> Nova Cotação
          </button>
        </header>

        {/* Cards de Resumo */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{resumo.total}</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#2563eb' }}>{resumo.abertas}</div>
            <div className="stat-label">Em Aberto</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#f97316' }}>{resumo.pendentes}</div>
            <div className="stat-label">Aguard. Resposta</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#16a34a' }}>{resumo.finalizadas}</div>
            <div className="stat-label">Finalizadas</div>
          </div>
        </div>

        <div className="filters-bar">
          <div className="search-input-container">
            <Search size={18} color="#9ca3af" />
            <input 
              type="text" 
              placeholder="Buscar por ID ou Descrição..." 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <Filter size={18} color="#6b7280" />
            <select 
              className="filter-select"
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
            >
              <option value="TODOS">Todos os Status</option>
              <option value="ABERTA">Aberta</option>
              <option value="PENDENTE">Pendente</option>
              <option value="FINALIZADA">Finalizada</option>
            </select>
          </div>

          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <ArrowUpDown size={18} color="#6b7280" />
            <select 
              className="filter-select"
              value={ordemData}
              onChange={(e) => setOrdemData(e.target.value)}
            >
              <option value="RECENTES">Mais Recentes</option>
              <option value="ANTIGAS">Mais Antigas</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{width: '80px'}}>ID</th>
                <th>Descrição</th>
                <th style={{width: '120px'}}>Data</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {cotacoesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{textAlign: 'center', padding: '30px', color: '#6b7280'}}>
                    Nenhuma cotação encontrada com os filtros atuais.
                  </td>
                </tr>
              ) : (
                cotacoesFiltradas.map((c) => (
                  <tr key={c.id}>
                    <td><span style={{fontWeight: 'bold', color: '#374151'}}>#{c.id}</span></td>
                    <td>
                      <span style={{fontWeight: '500', color: '#111827', fontSize: '15px'}}>
                        {c.descricao || 'Cotação Sem Nome'}
                      </span>
                    </td>
                    
                    {/* DATA PADRÃO BRASILEIRO */}
                    <td>
                      <span style={{color: '#6b7280', fontSize: '14px'}}>
                        {formatarDataBR(c.dataCriacao)}
                      </span>
                    </td>

                    <td>
                      <span className={`status-badge status-${c.status}`}>
                        {c.status === 'ABERTA' ? 'Aberta' : 
                         c.status === 'PENDENTE' ? 'Pendente' : 
                         c.status === 'FINALIZADA' ? 'Finalizada' : c.status}
                      </span>
                    </td>
                    <td>
                      <div style={{display: 'flex', gap: '8px'}}>
                        <button className="btn-icon" title="Ver Detalhes" onClick={() => navigate(`/cotacao/${c.id}`)}>
                          <Eye size={18} />
                        </button>
                        <button className="btn-icon" title="Enviar por WhatsApp" onClick={() => setCotacaoParaEnviar(c.id)}>
                          <MessageCircle size={18} />
                        </button>
                        <button className="btn-icon" title="Baixar Relatório" onClick={() => baixarRelatorioGeral(c.id)}>
                          <FileDown size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {modalAberto && <UploadModal onClose={() => setModalAberto(false)} onSuccess={carregarCotacoes} />}
        
        {cotacaoParaEnviar && (
          <EnviarLinkModal
            idCotacao={cotacaoParaEnviar}
            onClose={() => setCotacaoParaEnviar(null)}
            onStatusUpdate={carregarCotacoes}
          />
        )}
      </main>
    </div>
  )
}