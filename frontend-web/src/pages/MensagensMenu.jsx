import React, { useEffect, useState } from 'react'
import {
  AlertTriangle,
  CalendarDays,
  Megaphone,
  Pencil,
  Plus,
  Star,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import Sidebar from '../components/layout/Sidebar'
import api from '../services/api'

const CATEGORIAS = [
  { value: 'COMUNICADO', label: 'Comunicado' },
  { value: 'AVISO', label: 'Aviso' },
  { value: 'ATUALIZACAO', label: 'Atualização' },
  { value: 'ORIENTACAO', label: 'Orientação' },
  { value: 'INFORMATIVO', label: 'Informativo' },
]

const DESTINATARIOS = [
  { value: 'ADM', label: 'ADM' },
  { value: 'CONFERENTE', label: 'Conferente' },
  { value: 'FORNECEDOR', label: 'Fornecedor' },
]

const ROTULOS_CATEGORIA = CATEGORIAS.reduce((acc, item) => {
  acc[item.value] = item.label
  return acc
}, {})

const ROTULOS_DESTINATARIO = DESTINATARIOS.reduce((acc, item) => {
  acc[item.value] = item.label
  return acc
}, {})

const FORM_INICIAL = {
  titulo: '',
  conteudo: '',
  categoria: 'COMUNICADO',
  destinatarios: ['ADM', 'CONFERENTE', 'FORNECEDOR'],
  ativa: true,
  destaque: false,
  dataPublicacao: '',
  dataExpiracao: '',
}

function paraInputDateTime(valor) {
  if (!valor) return ''
  return String(valor).slice(0, 16)
}

function formatarDataHora(valor) {
  if (!valor) return ''
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return ''
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function mensagemParaFormulario(mensagem) {
  return {
    titulo: mensagem.titulo || '',
    conteudo: mensagem.conteudo || '',
    categoria: mensagem.categoria || 'COMUNICADO',
    destinatarios: Array.isArray(mensagem.destinatarios) ? mensagem.destinatarios : [],
    ativa: Boolean(mensagem.ativa),
    destaque: Boolean(mensagem.destaque),
    dataPublicacao: paraInputDateTime(mensagem.dataPublicacao),
    dataExpiracao: paraInputDateTime(mensagem.dataExpiracao),
  }
}

export default function MensagensMenu() {
  const [mensagens, setMensagens] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erroLista, setErroLista] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [mensagemEditando, setMensagemEditando] = useState(null)
  const [form, setForm] = useState(FORM_INICIAL)
  const [erroForm, setErroForm] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [processandoId, setProcessandoId] = useState(null)

  useEffect(() => {
    carregarMensagens()
  }, [])

  const carregarMensagens = async () => {
    setCarregando(true)
    setErroLista('')
    try {
      const resposta = await api.get('/api/mensagens-menu/admin')
      setMensagens(Array.isArray(resposta.data) ? resposta.data : [])
    } catch (erro) {
      console.error('Erro ao carregar mensagens de menu:', erro)
      setErroLista('Não foi possível carregar as mensagens cadastradas.')
    } finally {
      setCarregando(false)
    }
  }

  const abrirNovaMensagem = () => {
    setMensagemEditando(null)
    setForm(FORM_INICIAL)
    setErroForm('')
    setModalAberto(true)
  }

  const abrirEdicao = (mensagem) => {
    setMensagemEditando(mensagem)
    setForm(mensagemParaFormulario(mensagem))
    setErroForm('')
    setModalAberto(true)
  }

  const fecharModal = () => {
    if (salvando) return
    setModalAberto(false)
    setMensagemEditando(null)
    setErroForm('')
  }

  const atualizarCampo = (campo, valor) => {
    setForm((atual) => ({ ...atual, [campo]: valor }))
  }

  const alternarDestinatario = (perfil) => {
    setForm((atual) => {
      const jaSelecionado = atual.destinatarios.includes(perfil)
      return {
        ...atual,
        destinatarios: jaSelecionado
          ? atual.destinatarios.filter((item) => item !== perfil)
          : [...atual.destinatarios, perfil],
      }
    })
  }

  const salvarMensagem = async (event) => {
    event.preventDefault()
    setErroForm('')

    const titulo = form.titulo.trim()
    const conteudo = form.conteudo.trim()

    if (!titulo) {
      setErroForm('Informe o título da mensagem.')
      return
    }
    if (!conteudo) {
      setErroForm('Informe o conteúdo da mensagem.')
      return
    }
    if (form.destinatarios.length === 0) {
      setErroForm('Selecione ao menos um destinatário.')
      return
    }
    if (form.dataPublicacao && form.dataExpiracao) {
      const publicacao = new Date(form.dataPublicacao)
      const expiracao = new Date(form.dataExpiracao)
      if (expiracao <= publicacao) {
        setErroForm('A data de expiração deve ser posterior à data de publicação.')
        return
      }
    }

    const payload = {
      titulo,
      conteudo,
      categoria: form.categoria,
      destinatarios: form.destinatarios,
      ativa: form.ativa,
      destaque: form.destaque,
      dataPublicacao: form.dataPublicacao || null,
      dataExpiracao: form.dataExpiracao || null,
    }

    setSalvando(true)
    try {
      if (mensagemEditando) {
        await api.put(`/api/mensagens-menu/${mensagemEditando.id}`, payload)
      } else {
        await api.post('/api/mensagens-menu', payload)
      }
      setModalAberto(false)
      setMensagemEditando(null)
      await carregarMensagens()
    } catch (erro) {
      const detalhe = erro.response?.data?.message || erro.response?.data?.error
      setErroForm(detalhe || 'Não foi possível salvar a mensagem. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  const alternarStatus = async (mensagem) => {
    setProcessandoId(mensagem.id)
    try {
      const resposta = await api.patch(`/api/mensagens-menu/${mensagem.id}/status`)
      setMensagens((atuais) =>
        atuais.map((item) => (item.id === mensagem.id ? resposta.data : item)),
      )
    } catch (erro) {
      console.error('Erro ao alterar status da mensagem:', erro)
      alert('Não foi possível alterar o status da mensagem.')
    } finally {
      setProcessandoId(null)
    }
  }

  const excluirMensagem = async (mensagem) => {
    if (!window.confirm(`Excluir a mensagem "${mensagem.titulo}"? Esta ação não pode ser desfeita.`)) {
      return
    }

    setProcessandoId(mensagem.id)
    try {
      await api.delete(`/api/mensagens-menu/${mensagem.id}`)
      setMensagens((atuais) => atuais.filter((item) => item.id !== mensagem.id))
    } catch (erro) {
      console.error('Erro ao excluir mensagem:', erro)
      alert('Não foi possível excluir a mensagem.')
    } finally {
      setProcessandoId(null)
    }
  }

  return (
    <div className="layout">
      <Sidebar />

      <main className="main-content">
        <header className="page-header">
          <div>
            <h1 className="page-title">
              <Megaphone size={22} /> Mensagens de Menu
            </h1>
            <p className="page-subtitle">
              Cadastre comunicados e avisos exibidos nas páginas iniciais de ADM,
              Conferente e Fornecedor.
            </p>
          </div>
          <button type="button" className="btn-primary" onClick={abrirNovaMensagem}>
            <Plus size={18} /> Nova mensagem
          </button>
        </header>

        {erroLista && (
          <div className="error-msg" role="alert">
            {erroLista}
          </div>
        )}

        {carregando ? (
          <div className="empty-state">Carregando mensagens...</div>
        ) : mensagens.length === 0 ? (
          <div className="empty-state">
            Nenhuma mensagem cadastrada. Use “Nova mensagem” para criar o primeiro
            comunicado.
          </div>
        ) : (
          <div className="mensagens-admin-lista">
            {mensagens.map((mensagem) => {
              const categoria = String(mensagem.categoria || 'INFORMATIVO').toLowerCase()
              const emProcessamento = processandoId === mensagem.id

              return (
                <article
                  key={mensagem.id}
                  className={`mensagem-admin-card ${mensagem.ativa ? '' : 'inativa'} ${mensagem.destaque ? 'destaque' : ''}`}
                >
                  <div className="mensagem-admin-conteudo">
                    <div className="mensagem-card-top">
                      <span className={`mensagem-categoria cat-${categoria}`}>
                        {ROTULOS_CATEGORIA[mensagem.categoria] || 'Informativo'}
                      </span>
                      <div className="mensagem-admin-badges">
                        {mensagem.destaque && (
                          <span className="mensagem-destaque-badge">
                            <Star size={12} /> Destaque
                          </span>
                        )}
                        <span className={`mensagem-status ${mensagem.ativa ? 'ativa' : 'inativa'}`}>
                          {mensagem.ativa ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>
                    </div>

                    <h2>{mensagem.titulo}</h2>
                    <p className="mensagem-conteudo">{mensagem.conteudo}</p>

                    <div className="mensagem-admin-meta">
                      <span>
                        <Users size={13} />{' '}
                        {(mensagem.destinatarios || [])
                          .map((perfil) => ROTULOS_DESTINATARIO[perfil] || perfil)
                          .join(', ') || 'Sem destinatários'}
                      </span>
                      <span>
                        <CalendarDays size={13} />{' '}
                        {mensagem.dataPublicacao
                          ? `Publicação: ${formatarDataHora(mensagem.dataPublicacao)}`
                          : 'Publicação imediata'}
                      </span>
                      <span>
                        <CalendarDays size={13} />{' '}
                        {mensagem.dataExpiracao
                          ? `Expira: ${formatarDataHora(mensagem.dataExpiracao)}`
                          : 'Sem expiração'}
                      </span>
                    </div>
                  </div>

                  <div className="mensagem-admin-acoes">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => abrirEdicao(mensagem)}
                      disabled={emProcessamento}
                    >
                      <Pencil size={16} /> Editar
                    </button>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => alternarStatus(mensagem)}
                      disabled={emProcessamento}
                    >
                      {mensagem.ativa ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      {mensagem.ativa ? 'Desativar' : 'Ativar'}
                    </button>
                    <button
                      type="button"
                      className="btn-danger"
                      onClick={() => excluirMensagem(mensagem)}
                      disabled={emProcessamento}
                    >
                      <Trash2 size={16} /> Excluir
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {modalAberto && (
          <div
            className="modal-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) fecharModal()
            }}
          >
            <div
              className="modal-content mensagem-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="titulo-modal-mensagem"
            >
              <div className="modal-header">
                <h2 id="titulo-modal-mensagem">
                  {mensagemEditando ? 'Editar mensagem' : 'Nova mensagem'}
                </h2>
                <button
                  type="button"
                  className="icon-button"
                  onClick={fecharModal}
                  aria-label="Fechar"
                  disabled={salvando}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={salvarMensagem}>
                <div className="modal-body">
                  {erroForm && (
                    <div className="error-msg" role="alert">
                      <AlertTriangle size={15} /> {erroForm}
                    </div>
                  )}

                  <div className="form-field">
                    <label htmlFor="mensagem-titulo">Título</label>
                    <input
                      id="mensagem-titulo"
                      type="text"
                      className="form-input"
                      maxLength={150}
                      value={form.titulo}
                      onChange={(event) => atualizarCampo('titulo', event.target.value)}
                      placeholder="Ex.: Atualização no fluxo de conferência"
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="mensagem-conteudo">Conteúdo</label>
                    <textarea
                      id="mensagem-conteudo"
                      className="form-input mensagem-textarea"
                      rows={5}
                      maxLength={5000}
                      value={form.conteudo}
                      onChange={(event) => atualizarCampo('conteudo', event.target.value)}
                      placeholder="Escreva o comunicado que será exibido na página inicial."
                      required
                    />
                  </div>

                  <div className="mensagem-form-grid">
                    <div className="form-field">
                      <label htmlFor="mensagem-categoria">Categoria</label>
                      <select
                        id="mensagem-categoria"
                        className="form-input"
                        value={form.categoria}
                        onChange={(event) => atualizarCampo('categoria', event.target.value)}
                      >
                        {CATEGORIAS.map((categoria) => (
                          <option key={categoria.value} value={categoria.value}>
                            {categoria.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-field">
                      <label>Status</label>
                      <label className="form-check">
                        <input
                          type="checkbox"
                          checked={form.ativa}
                          onChange={(event) => atualizarCampo('ativa', event.target.checked)}
                        />
                        Mensagem ativa
                      </label>
                    </div>
                  </div>

                  <div className="form-field">
                    <label>Destinatários</label>
                    <div className="form-check-group">
                      {DESTINATARIOS.map((destinatario) => (
                        <label key={destinatario.value} className="form-check">
                          <input
                            type="checkbox"
                            checked={form.destinatarios.includes(destinatario.value)}
                            onChange={() => alternarDestinatario(destinatario.value)}
                          />
                          {destinatario.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="mensagem-form-grid">
                    <div className="form-field">
                      <label htmlFor="mensagem-publicacao">Data de publicação</label>
                      <input
                        id="mensagem-publicacao"
                        type="datetime-local"
                        className="form-input"
                        value={form.dataPublicacao}
                        onChange={(event) => atualizarCampo('dataPublicacao', event.target.value)}
                      />
                      <small className="form-hint">Em branco para publicar imediatamente.</small>
                    </div>

                    <div className="form-field">
                      <label htmlFor="mensagem-expiracao">Data de expiração</label>
                      <input
                        id="mensagem-expiracao"
                        type="datetime-local"
                        className="form-input"
                        value={form.dataExpiracao}
                        onChange={(event) => atualizarCampo('dataExpiracao', event.target.value)}
                      />
                      <small className="form-hint">Em branco para não expirar.</small>
                    </div>
                  </div>

                  <div className="form-field">
                    <label className="form-check">
                      <input
                        type="checkbox"
                        checked={form.destaque}
                        onChange={(event) => atualizarCampo('destaque', event.target.checked)}
                      />
                      Destacar esta mensagem na página inicial
                    </label>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={fecharModal}
                    disabled={salvando}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary" disabled={salvando}>
                    {salvando ? 'Salvando...' : 'Salvar mensagem'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
