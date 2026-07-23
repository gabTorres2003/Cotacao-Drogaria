import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Sidebar from '../components/layout/Sidebar'
import UploadModal from '../components/layout/UploadModal'
import {
  Upload,
  FileDown,
  MessageCircle,
  Eye,
  Search,
  Filter,
  Trash2,
  ArrowUpDown,
} from 'lucide-react'
import EnviarLinkModal from '../components/EnviarLinkModal'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function Cotacoes() {
  const [cotacoes, setCotacoes] = useState([])
  const [modalAberto, setModalAberto] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('TODOS')
  const [ordemData, setOrdemData] = useState('RECENTES') 

  const [resumo, setResumo] = useState({
    total: 0,
    abertas: 0,
    pendentes: 0,
    finalizadas: 0,
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
          pendentes: response.data.filter((c) => c.status === 'PENDENTE' || c.status === 'RESPONDIDA_PARCIALMENTE').length,
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
      const textoBusca = busca.toLowerCase()
      const matchTexto =
        c.descricao?.toLowerCase().includes(textoBusca) ||
        c.id.toString().includes(textoBusca)

      const matchStatus = filtroStatus === 'TODOS' || c.status === filtroStatus

      return matchTexto && matchStatus
    })
    .sort((a, b) => {
      const dateA = new Date(a.dataCriacao)
      const dateB = new Date(b.dataCriacao)
      return ordemData === 'RECENTES' ? dateB - dateA : dateA - dateB
    })

  const formatarDataBR = (dataIso) => {
    if (!dataIso) return '--/--/--'
    return new Date(dataIso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    })
  }

  const deletarCotacao = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta cotação?')) {
      setIsDeleting(true);
      try {
        await api.delete(`/api/cotacao/${id}`);
        setCotacoes(cotacoes.filter(c => c.id !== id));
        alert('Cotação excluída com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir cotação.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

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
            '',
            '',
            '',
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
      alert('Erro ao gerar o relatório.')
    }
  }

  const renderStatus = (cotacao) => {
    let bg = '#f3f4f6', color = '#374151', label = cotacao.status;

    if (cotacao.status === 'ABERTA') {
      bg = '#dbeafe'; color = '#1e40af'; label = 'Em Aberto';
    } else if (cotacao.status === 'PENDENTE') {
      bg = '#ffedd5'; color = '#9a3412'; label = 'Aguard. Resposta';
    } else if (cotacao.status === 'RESPONDIDA_PARCIALMENTE') {
      bg = '#fef08a'; color = '#854d0e'; label = 'Resp. Parcial';
    } else if (cotacao.status === 'FINALIZADA') {
      bg = '#dcfce7'; color = '#166534'; label = 'Pronta p/ Fechar';
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
        <span style={{
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '700',
          backgroundColor: bg,
          color: color,
          whiteSpace: 'nowrap'
        }}>
          {label}
        </span>

        {/* Lista de Fornecedores Pendentes */}
        {cotacao.fornecedoresPendentes && cotacao.fornecedoresPendentes.length > 0 && (
          <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: '600', lineHeight: '1.4' }}>
            ⏳ Faltam:<br/>
            <span style={{ fontWeight: '400', color: '#6b7280' }}>
              {cotacao.fornecedoresPendentes.join(', ')}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="layout">
      <Sidebar />

      <main className="main-content">
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '30px',
          }}
        >
          <div>
            <h1 style={{ fontSize: '24px', marginBottom: '5px' }}>
              Painel de Cotações
            </h1>
            <p style={{ color: '#6b7280' }}>
              Gerencie suas compras e fornecedores
            </p>
          </div>

          <button
            className="btn-new-cotacao"
            onClick={() => setModalAberto(true)}
          >
            <Upload size={20} /> Nova Cotação
          </button>
        </header>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{resumo.total}</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#2563eb' }}>
              {resumo.abertas}
            </div>
            <div className="stat-label">Em Aberto</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#f97316' }}>
              {resumo.pendentes}
            </div>
            <div className="stat-label">Aguard. Resposta</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#16a34a' }}>
              {resumo.finalizadas}
            </div>
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Filter size={18} color="#6b7280" />
            <select
              className="filter-select"
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
            >
              <option value="TODOS">Todos os Status</option>
              <option value="ABERTA">Aberta</option>
              <option value="PENDENTE">Pendente</option>
              <option value="RESPONDIDA_PARCIALMENTE">Parcial</option>
              <option value="FINALIZADA">Pronta p/ Fechar</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                <th style={{ width: '80px' }}>ID</th>
                <th>Descrição</th>
                <th style={{ width: '120px' }}>Data</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {cotacoesFiltradas.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    style={{
                      textAlign: 'center',
                      padding: '30px',
                      color: '#6b7280',
                    }}
                  >
                    Nenhuma cotação encontrada com os filtros atuais.
                  </td>
                </tr>
              ) : (
                cotacoesFiltradas.map((c) => (
                  <tr key={c.id}>
                    <td style={{ verticalAlign: 'top', paddingTop: '16px' }}>
                      <span style={{ fontWeight: 'bold', color: '#374151' }}>
                        #{c.id}
                      </span>
                    </td>
                    <td style={{ verticalAlign: 'top', paddingTop: '16px' }}>
                      <span
                        style={{
                          fontWeight: '500',
                          color: '#111827',
                          fontSize: '15px',
                        }}
                      >
                        {c.descricao || 'Cotação Sem Nome'}
                      </span>
                    </td>

                    <td style={{ verticalAlign: 'top', paddingTop: '16px' }}>
                      <span style={{ color: '#6b7280', fontSize: '14px' }}>
                        {formatarDataBR(c.dataCriacao)}
                      </span>
                    </td>

                    {/* RENDERIZADOR DINÂMICO DE STATUS */}
                    <td style={{ verticalAlign: 'top', paddingTop: '12px' }}>
                      {renderStatus(c)}
                    </td>
                    
                    <td style={{ verticalAlign: 'top', paddingTop: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
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
                          title="Baixar Relatório"
                          onClick={() => baixarRelatorioGeral(c.id)}
                        >
                          <FileDown size={18} />
                        </button>
                        <button
                          className="btn-icon"
                          title="Excluir Cotação"
                          onClick={() => deletarCotacao(c.id)}
                        >
                          <Trash2 size={18} color="#ef4444" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
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
            onStatusUpdate={carregarCotacoes}
          />
        )}

        {isDeleting && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 9999
          }}>
            <div style={{
              backgroundColor: '#fff', padding: '20px 40px',
              borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <p style={{ fontWeight: 'bold', color: '#374151', margin: 0 }}>Excluindo cotação...</p>
              <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>Por favor, aguarde.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}