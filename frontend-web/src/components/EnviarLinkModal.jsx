import { useEffect, useState } from 'react'
import api from '../services/api'
import { X, Send, User } from 'lucide-react'

export default function EnviarLinkModal({ idCotacao, onClose }) {
  const [fornecedores, setFornecedores] = useState([])
  const [loading, setLoading] = useState(true)

  // Busca a lista de fornecedores assim que o modal abre
  useEffect(() => {
    api
      .get('/api/fornecedor')
      .then((res) => {
        if (Array.isArray(res.data)) {
          setFornecedores(res.data)
        } else {
          console.error('API de fornecedores retornou erro:', res.data)
          setFornecedores([])
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setFornecedores([])
        setLoading(false)
      })
  }, [])

  const enviarPara = async (fornecedor) => {
    if (!fornecedor.telefone) {
      alert(`O fornecedor ${fornecedor.nome} não tem telefone cadastrado!`)
      return
    }

    try {
      // Chama a API para gerar o link
      const response = await api.get('/api/fornecedor/gerar-link-whatsapp', {
        params: { idFornecedor: fornecedor.id, idCotacao },
      })

      // Abre o WhatsApp em nova aba
      window.open(response.data, '_blank')
      onClose() // Fecha o modal após enviar
    } catch (error) {
      alert(
        'Erro ao gerar link: ' + (error.response?.data || 'Erro desconhecido'),
      )
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '400px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '15px',
          }}
        >
          <h3 style={{ margin: 0 }}>Enviar Cotação #{idCotacao}</h3>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
            Selecione o fornecedor:
          </p>

          {loading ? (
            <p>Carregando...</p>
          ) : (
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              {fornecedores.map((f) => (
                <button
                  key={f.id}
                  onClick={() => enviarPara(f)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px',
                    border: '1px solid #eee',
                    borderRadius: '6px',
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <User size={16} /> {f.nome}
                  </span>
                  <Send size={16} color="#2563eb" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
