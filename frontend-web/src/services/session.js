export const SESSION_KEYS = ['token', 'tipoUsuario', 'primeiroAcesso', 'nomeUsuario', 'usuarioId']

const SESSION_EVENT_KEY = 'cotacao-drogaria-session-event'
const SESSION_CHANNEL_NAME = 'cotacao-drogaria-session'

let canal = null

function obterCanal() {
  if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return null
  if (!canal) canal = new BroadcastChannel(SESSION_CHANNEL_NAME)
  return canal
}

export function notificarSessao(tipo) {
  const evento = { tipo, em: Date.now() }
  try {
    localStorage.setItem(SESSION_EVENT_KEY, JSON.stringify(evento))
    localStorage.removeItem(SESSION_EVENT_KEY)
  } catch (error) {
    console.warn('Não foi possível notificar as outras abas sobre a sessão.', error)
  }
  obterCanal()?.postMessage(evento)
}

export function limparSessao({ notificar = true } = {}) {
  SESSION_KEYS.forEach((chave) => localStorage.removeItem(chave))
  if (notificar) notificarSessao('logout')
}

export function salvarSessao({ token, tipoUsuario, primeiroAcesso, nome, id }) {
  localStorage.setItem('token', token)
  localStorage.setItem('tipoUsuario', tipoUsuario)
  localStorage.setItem('primeiroAcesso', String(primeiroAcesso))
  localStorage.setItem('nomeUsuario', nome || '')
  localStorage.setItem('usuarioId', String(id))
  notificarSessao('login')
}

export function escutarSessao(callback) {
  const tratarEvento = (evento) => {
    if (evento.key === SESSION_EVENT_KEY) {
      try {
        callback(JSON.parse(evento.newValue || '{}').tipo)
      } catch {
        callback(null)
      }
    }
  }
  const canalAtual = obterCanal()
  const tratarMensagem = (evento) => callback(evento.data?.tipo)

  window.addEventListener('storage', tratarEvento)
  canalAtual?.addEventListener('message', tratarMensagem)

  return () => {
    window.removeEventListener('storage', tratarEvento)
    canalAtual?.removeEventListener('message', tratarMensagem)
  }
}
