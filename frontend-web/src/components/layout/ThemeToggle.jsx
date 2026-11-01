import React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export default function ThemeToggle({ compact = false, className = '' }) {
  const { isDark, toggleTheme } = useTheme()
  const rotulo = isDark ? 'Ativar tema claro' : 'Ativar tema escuro'

  return (
    <button
      type="button"
      className={`theme-toggle ${compact ? 'theme-toggle-compact' : ''} ${className}`.trim()}
      onClick={toggleTheme}
      aria-label={rotulo}
      title={rotulo}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
      {!compact && <span className="theme-toggle-label">{isDark ? 'Tema claro' : 'Tema escuro'}</span>}
    </button>
  )
}
