import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowDown, Megaphone } from 'lucide-react'
import api from '../../services/api'

function chaveVistas() {
  const perfil = localStorage.getItem('tipoUsuario') || 'USUARIO'
  const nome = localStorage.getItem('nomeUsuario') || 'anon'
  return `mensagensVistasAte:${perfil}:${nome}`
}

function dataMensagem(mensagem) {
  const valor = mensagem?.dataPublicacao || mensagem?.dataCriacao
  const data = valor ? new Date(valor) : null
  return data && !Number.isNaN(data.getTime()) ? data : null
}

export default function AvisoFlutuante() {
  const navigate = useNavigate()
  const location = useLocation()
  const [visivel, setVisivel] = useState(false)
  const [quantidade, setQuantidade] = useState(0)
  const [ultimaMensagem, setUltimaMensagem] = useState(null)

  useEffect(() => {
    let ativo = true

    api
      .get('/api/mensagens-menu')
      .then((resposta) => {
        if (!ativo) return
        const mensagens = Array.isArray(resposta.data) ? resposta.data : []
        if (mensagens.length === 0) {
          setVisivel(false)
          return
        }

        const maisRecente = mensagens.reduce((maior, mensagem) => {
          const data = dataMensagem(mensagem)
          if (!data) return maior
          return !maior || data > maior ? data : maior
        }, null)

        if (!maisRecente) {
          setVisivel(false)
          return
        }

        const vistoEm = localStorage.getItem(chaveVistas())
        const visto = vistoEm ? new Date(vistoEm) : null
        const naoLidas = !visto || maisRecente > visto
        const totalNaoLidas = mensagens.filter((mensagem) => {
          const data = dataMensagem(mensagem)
          return data && (!visto || data > visto)
        }).length

        setUltimaMensagem(maisRecente)
        setQuantidade(totalNaoLidas || mensagens.length)
        setVisivel(naoLidas)
      })
      .catch(() => {
        if (ativo) setVisivel(false)
      })

    return () => {
      ativo = false
    }
  }, [])

  useEffect(() => {
    const aoMarcarVistas = () => setVisivel(false)
    window.addEventListener('mensagens-vistas', aoMarcarVistas)
    return () => window.removeEventListener('mensagens-vistas', aoMarcarVistas)
  }, [])

  const abrirMensagens = () => {
    if (ultimaMensagem) {
      localStorage.setItem(chaveVistas(), ultimaMensagem.toISOString())
    }
    setVisivel(false)
    window.dispatchEvent(new Event('mensagens-vistas'))

    if (location.pathname === '/inicio') {
      document.getElementById('mensagens-menu')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      navigate('/inicio?scroll=mensagens')
    }
  }

  if (!visivel) return null

  return (
    <div className="aviso-flutuante-wrap">
      <button
        type="button"
        className="aviso-flutuante"
        onClick={abrirMensagens}
        title="Você tem novos avisos. Clique para ver as mensagens de menu."
        aria-label={`Você tem ${quantidade} novo(s) aviso(s). Clique para ver as mensagens de menu.`}
      >
        <span className="aviso-flutuante-icone">
          <Megaphone size={20} />
          {quantidade > 0 && <span className="aviso-flutuante-badge">{quantidade > 99 ? '99+' : quantidade}</span>}
        </span>
        <span className="aviso-flutuante-texto">
          <strong>Novos avisos</strong>
          <small>Toque para ver as mensagens</small>
        </span>
        <span className="aviso-flutuante-seta" aria-hidden="true">
          <ArrowDown size={20} />
        </span>
      </button>
    </div>
  )
}
