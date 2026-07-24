import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Lock, User, Eye, EyeOff, Info } from 'lucide-react'
import api from '../services/api'

export default function Login() {
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [mostrarSenha, setMostrarSenha] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || null

  useEffect(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('tipoUsuario')
    localStorage.removeItem('primeiroAcesso')
    localStorage.removeItem('nomeUsuario')
    localStorage.removeItem('usuarioId')
  }, [])
  // -------------------------------

  const handleLogin = async (e) => {
    e.preventDefault()
    setErro('')
    setLoading(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 800))
      const response = await api.post('/auth/login', { username, pin })
      const { token, primeiroAcesso, tipoUsuario, nome, id } = response.data

      localStorage.setItem('token', token)
      localStorage.setItem('tipoUsuario', tipoUsuario)
      localStorage.setItem('primeiroAcesso', primeiroAcesso)
      localStorage.setItem('nomeUsuario', nome)
      localStorage.setItem('usuarioId', id)

      if (from) {
        navigate(from)
      } else if (tipoUsuario === 'ADMIN') {
        navigate('/cotacoes')
      } else {
        navigate('/portal-fornecedor')
      }
    } catch (error) {
      setErro(
        'Credenciais inválidas. Verifique seu login e senha e tente novamente.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f3f4f6',
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '400px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img
            src="/assets/logo-torres.png"
            alt="Drogaria Torres Farma"
            style={{
              height:
                '110px',
              objectFit: 'contain',
              marginBottom:
                '-20px' 
            }}
          />
          <h2
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#1f2937',
              margin: 0,
            }}
          >
            Portal de Cotações
          </h2>
        </div>

        <form
          onSubmit={handleLogin}
          style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#f9fafb',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              padding: '0 10px',
            }}
          >
            <User size={18} color="#9ca3af" />
            <input
              id="username"
              name="username"
              type="text"
              placeholder="Digite seu usuário ou login"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                padding: '12px',
                outline: 'none',
                fontSize: '15px',
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#f9fafb',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              padding: '0 10px',
            }}
          >
            <Lock size={18} color="#9ca3af" />
            <input
              id="pin"
              name="pin"
              type={mostrarSenha ? 'text' : 'password'}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="Senha de acesso"
              required
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                padding: '12px',
                outline: 'none',
                fontSize: '15px',
              }}
            />
            <button
              type="button"
              onClick={() => setMostrarSenha(!mostrarSenha)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                padding: '5px',
              }}
            >
              {mostrarSenha ? (
                <EyeOff size={18} color="#9ca3af" />
              ) : (
                <Eye size={18} color="#9ca3af" />
              )}
            </button>
          </div>

          {erro && (
            <span
              style={{
                color: '#dc2626',
                fontSize: '14px',
                textAlign: 'center',
                backgroundColor: '#fee2e2',
                padding: '10px',
                borderRadius: '6px',
                fontWeight: '500',
              }}
            >
              {erro}
            </span>
          )}

          <button
            type="submit"
            disabled={loading || pin.length < 4}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '16px',
              cursor: loading || pin.length < 4 ? 'not-allowed' : 'pointer',
              marginTop: '5px',
              transition: '0.2s',
              opacity: loading || pin.length < 4 ? 0.7 : 1,
            }}
          >
            {loading ? 'Autenticando...' : 'Acessar Portal'}
          </button>
        </form>

        <div
          style={{
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
            color: '#64748b',
          }}
        >
          <Info
            size={20}
            style={{ flexShrink: 0, marginTop: '2px', color: '#94a3b8' }}
          />
          <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.5' }}>
            Problemas com o acesso? Entre em contato com a Drogaria Torres Farma
            pelo WhatsApp.
          </p>
        </div>
      </div>
    </div>
  )
}