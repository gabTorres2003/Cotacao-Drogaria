import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Lock,
  User,
  Eye,
  EyeOff,
  Info,
  Loader2,
  ShieldCheck,
  TrendingUp,
  Truck,
} from 'lucide-react'
import api from '../services/api'
import ThemeToggle from '../components/layout/ThemeToggle'

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
      } else {
        navigate('/inicio')
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
    <div className="login-page">
      <aside className="login-visual" aria-hidden="true">
        <div className="login-visual-top">
          <img
            src="/assets/logo-torres.png"
            alt=""
            className="login-logo"
          />
          <div className="login-visual-brand">
            <strong>Torres Farma</strong>
            <span>Gestão de Compras e Cotações</span>
          </div>
        </div>

        <div className="login-visual-content">
          <h1>Cotações, pedidos e fornecedores em um só lugar.</h1>
          <p>
            Centralize o processo de compras da rede: da identificação da
            necessidade até a conferência do recebimento.
          </p>

          <div className="login-features">
            <div className="login-feature">
              <span className="login-feature-icon">
                <TrendingUp size={16} />
              </span>
              Compare preços e acompanhe indicadores de compra.
            </div>
            <div className="login-feature">
              <span className="login-feature-icon">
                <Truck size={16} />
              </span>
              Receba respostas e pedidos dos fornecedores com agilidade.
            </div>
            <div className="login-feature">
              <span className="login-feature-icon">
                <ShieldCheck size={16} />
              </span>
              Acesso seguro e individual para cada perfil.
            </div>
          </div>
        </div>

        <div className="login-visual-foot">
          Drogaria Torres Farma — Todos os direitos reservados.
        </div>
      </aside>

      <section className="login-form-side">
        <div className="login-theme">
          <ThemeToggle compact />
        </div>

        <div className="login-card">
          <div className="login-mobile-brand">
            <img src="/assets/logo-torres.png" alt="Torres Farma" />
            <div>
              <strong className="brand-name">Torres Farma</strong>
              <span className="brand-subtitle">Gestão de Compras</span>
            </div>
          </div>

          <div className="login-header">
            <h2>Acessar portal</h2>
            <p>Informe seu usuário e senha de acesso para continuar.</p>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            <div>
              <label className="login-label" htmlFor="username">
                Usuário
              </label>
              <div className="login-field">
                <User size={18} />
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  placeholder="Digite seu usuário ou login"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                />
              </div>
            </div>

            <div>
              <label className="login-label" htmlFor="pin">
                Senha de acesso
              </label>
              <div className="login-field">
                <Lock size={18} />
                <input
                  id="pin"
                  name="pin"
                  type={mostrarSenha ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  autoComplete="current-password"
                  placeholder="Senha de acesso"
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                />
                <button
                  type="button"
                  className="login-field-action"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  title={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {erro && <div className="login-error">{erro}</div>}

            <button
              type="submit"
              className="login-submit"
              disabled={loading || pin.length < 4}
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? 'Autenticando...' : 'Acessar Portal'}
            </button>
          </form>

          <div className="login-info">
            <Info size={18} />
            <p>
              Problemas com o acesso? Entre em contato com a Drogaria Torres
              Farma pelo WhatsApp.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
