import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, PackageSearch } from 'lucide-react'
import api from '../../services/api'

export default function AlertaNovosProdutos() {
  const [alertas, setAlertas] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let ativo = true

    const carregar = async () => {
      const usuarioId = localStorage.getItem('usuarioId')
      const nomeUsuario = localStorage.getItem('nomeUsuario')
      if (!usuarioId || !nomeUsuario) {
        setCarregando(false)
        return
      }

      try {
        const resposta = await api.get(`/api/cotacao-fornecedor/fornecedor/${usuarioId}?resumo=true`)
        const vinculos = Array.isArray(resposta.data) ? resposta.data : []
        const ativos = vinculos.filter((vinculo) => {
          const status = vinculo.cotacao?.status
          return status !== 'FINALIZADA' && status !== 'CANCELADA'
        })

        const resultados = await Promise.all(
          ativos.map(async (vinculo) => {
            const cotacaoId = vinculo.cotacao?.id
            if (!cotacaoId) return null
            try {
              const itensResposta = await api.get(`/api/comparativo/listar-itens/${cotacaoId}`)
              const itens = Array.isArray(itensResposta.data) ? itensResposta.data : []
              const novos = itens.filter((item) => {
                if (item.excluido) return false
                const ultima = item.ultimaRespostaPorFornecedor?.[nomeUsuario]
                if (!ultima || !item.dataCriacao) return false
                return new Date(item.dataCriacao) > new Date(ultima)
              }).length
              return novos > 0 ? { cotacaoId, novos } : null
            } catch (erro) {
              console.error(`Erro ao verificar novos produtos da cotação ${cotacaoId}:`, erro)
              return null
            }
          }),
        )

        if (ativo) {
          setAlertas(resultados.filter(Boolean).sort((a, b) => b.cotacaoId - a.cotacaoId))
        }
      } catch (erro) {
        console.error('Erro ao carregar alertas de novos produtos:', erro)
      } finally {
        if (ativo) setCarregando(false)
      }
    }

    carregar()

    return () => {
      ativo = false
    }
  }, [])

  if (carregando || alertas.length === 0) return null

  return (
    <section className="novos-produtos-alerta" aria-live="polite">
      <div className="novos-produtos-alerta-topo">
        <span className="novos-produtos-alerta-icone">
          <AlertTriangle size={20} />
        </span>
        <div>
          <strong>Novos produtos adicionados</strong>
          <p>
            A farmácia incluiu produtos depois do seu último envio. Responda apenas os
            itens novos para atualizar sua proposta.
          </p>
        </div>
      </div>

      <div className="novos-produtos-alerta-lista">
        {alertas.map((alerta) => (
          <Link
            key={alerta.cotacaoId}
            to={`/responder-cotacao/${alerta.cotacaoId}?novos=1`}
            className="novos-produtos-alerta-link"
          >
            <PackageSearch size={16} />
            <span>
              Cotação #{alerta.cotacaoId}
              <small>{alerta.novos} novo(s) produto(s)</small>
            </span>
            <ArrowRight size={16} />
          </Link>
        ))}
      </div>
    </section>
  )
}
