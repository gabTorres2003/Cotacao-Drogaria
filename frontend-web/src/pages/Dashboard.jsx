import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Sidebar from '../components/layout/Sidebar'
import UploadModal from '../components/layout/UploadModal'
import { Upload, FileDown, MessageCircle, Eye, Search } from 'lucide-react'
import EnviarLinkModal from '../components/EnviarLinkModal'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function Dashboard() {
  const [cotacoes, setCotacoes] = useState([])
  const [modalAberto, setModalAberto] = useState(false)
  const [resumo, setResumo] = useState({ total: 0, abertas: 0, pendentes: 0, finalizadas: 0 })
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
        console.error('ERRO: A API não retornou uma lista!', response.data)
        setCotacoes([])
      }
    } catch (error) {
      console.error('Erro ao carregar cotações:', error)
      setCotacoes([])
    }
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
          [
            '', '', '',
            'TOTAL GERAL',
            totalGeral.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }),
          ],
        ],
        theme: 'striped',
        headStyles: { fillColor: [22, 163, 74] },
      })

      doc.save(`Relatorio_Geral_Cotacao_${idCotacao}.pdf`)
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      alert('Erro ao gerar o relatório. Verifique se a cotação tem respostas.')
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

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{resumo.total}</div>
            <div className="stat-label">Cotações Totais</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#eab308' }}>
              {resumo.abertas} <small style={{fontSize: '0.5em', color: '#999'}}>Abertas</small>
            </div>
             <div className="stat-label">
                {resumo.pendentes > 0 ? `+ ${resumo.pendentes} Pendentes` : 'Aguardando envio'}
             </div>
          </div>

          <div className="stat-card">
            <div className="stat-value" style={{ color: '#16a34a' }}>
              {resumo.finalizadas}
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
                      {c.status === 'ABERTA' ? 'Aberta' : 
                       c.status === 'PENDENTE' ? 'Pendente' : 
                       c.status === 'FINALIZADA' ? 'Finalizada' : c.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-icon"
                      title="Ver Detalhes"
                      onClick={() => navigate(`/cotacao/${c.id}`)}
                    >
                      <Eye size={18} />
                    </button>

                    <button
                      className="btn-icon"
                      title="Enviar por WhatsApp"
                      onClick={() => setCotacaoParaEnviar(c.id)}
                    >
                      <MessageCircle size={18} />
                    </button>
                    
                    <button
                      className="btn-icon"
                      title="Baixar Relatório Geral"
                      onClick={() => baixarRelatorioGeral(c.id)}
                    >
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
            onStatusUpdate={() => {
              carregarCotacoes() 
            }}
          />
        )}
      </main>
    </div>
  )
}