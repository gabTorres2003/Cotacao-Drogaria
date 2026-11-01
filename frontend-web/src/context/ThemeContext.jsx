import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'theme'
const ThemeContext = createContext(null)

function obterTemaInicial() {
  if (typeof window === 'undefined') return 'light'

  const salvo = window.localStorage.getItem(STORAGE_KEY)
  if (salvo === 'light' || salvo === 'dark') return salvo

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(obterTemaInicial)

  const aplicarTema = useCallback((proximoTema) => {
    const raiz = document.documentElement
    raiz.setAttribute('data-theme', proximoTema)
    raiz.style.colorScheme = proximoTema

    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      meta.setAttribute('content', proximoTema === 'dark' ? '#0b1220' : '#f3f6fb')
    }
  }, [])

  useEffect(() => {
    aplicarTema(theme)
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme, aplicarTema])

  const setTheme = useCallback((proximoTema) => {
    setThemeState(proximoTema === 'dark' ? 'dark' : 'light')
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((atual) => (atual === 'dark' ? 'light' : 'dark'))
  }, [])

  const valor = useMemo(
    () => ({ theme, setTheme, toggleTheme, isDark: theme === 'dark' }),
    [theme, setTheme, toggleTheme],
  )

  return <ThemeContext.Provider value={valor}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const contexto = useContext(ThemeContext)
  if (!contexto) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider')
  }
  return contexto
}
