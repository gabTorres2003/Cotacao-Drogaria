import React, { useEffect, useState } from 'react'
import { CalendarDays, Info, Megaphone, Star } from 'lucide-react'
import api from '../../services/api'

const ROTULOS_CATEGORIA = {
  COMUNICADO: 'Comunicado',
  AVISO: 'Aviso',
  ATUALIZACAO: 'Atualização',
  ORIENTACAO: 'Orientação',
  INFORMATIVO: 'Informativo',
}

function formatarData(valor) {
  if (!valor) return ''
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return ''
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function MensagemCard({ mensagem }) {
  const categoria = String(mensagem.categoria || 'INFORMATIVO').toUpperCase()
  const classeCategoria = ROTULOS_CATEGORIA[categoria] ? categoria.toLowerCase() : 'informativo'
  const dataReferencia = mensagem.dataPublicacao || mensagem.dataCriacao

  return (
    <article className={`mensagem-card ${mensagem.destaque ? 'destaque' : ''}`}>
      <div className="mensagem-card-top">
        <span className={`mensagem-categoria cat-${classeCategoria}`}>
          {ROTULOS_CATEGORIA[categoria] || 'Informativo'}
        </span>
        {mensagem.destaque && (
          <span className="mensagem-destaque-badge">
            <Star size={12} /> Destaque
          </span>
        )}
      </div>

      <h3>{mensagem.titulo}</h3>
      <p className="mensagem-conteudo">{mensagem.conteudo}</p>

      {formatarData(dataReferencia) && (
        <div className="mensagem-meta">
          <span>
            <CalendarDays size={13} /> Publicado em {formatarData(dataReferencia)}
          </span>
        </div>
      )}
    </article>
  )
}

export default function MensagensInicio() {
  const [mensagens, setMensagens] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    let ativo = true

    api
      .get('/api/mensagens-menu')
      .then((resposta) => {
        if (!ativo) return
        setMensagens(Array.isArray(resposta.data) ? resposta.data : [])
        setErro(false)
      })
      .catch(() => {
        if (!ativo) return
        setMensagens([])
        setErro(true)
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [])

  return (
    <section className="mensagens-section" aria-labelledby="mensagens-inicio-titulo">
      <h2 className="home-section-title" id="mensagens-inicio-titulo">
        <Megaphone size={15} /> Mensagens de Menu
      </h2>

      {carregando ? (
        <div className="mensagens-empty">Carregando comunicados...</div>
      ) : mensagens.length > 0 ? (
        <div className="mensagens-grid">
          {mensagens.map((mensagem) => (
            <MensagemCard key={mensagem.id} mensagem={mensagem} />
          ))}
        </div>
      ) : (
        <div className="mensagens-empty">
          <Info size={16} />
          <span>
            {erro
              ? 'Não foi possível carregar os comunicados agora.'
              : 'Nenhum comunicado disponível no momento.'}
          </span>
        </div>
      )}
    </section>
  )
}
