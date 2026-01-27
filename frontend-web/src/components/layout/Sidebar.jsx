import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  Settings,
  Pill,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

export default function Sidebar() {
  const location = useLocation()

  const isActive = (path) =>
    location.pathname === path ? 'menu-item active' : 'menu-item'

  return (
    <aside className="sidebar">
      <div className="brand">
        <Pill size={28} /> Torres Farma
      </div>

      <nav>
        <Link
          to="/dashboard"
          className={isActive('/dashboard')}
          style={{ textDecoration: 'none' }}
        >
          <LayoutDashboard size={20} /> Dashboard
        </Link>

        <Link
          to="/fornecedores"
          className={isActive('/fornecedores')}
          style={{ textDecoration: 'none' }}
        >
          <Users size={20} /> Fornecedores
        </Link>

        <Link
          to="/relatorios"
          className={isActive('/relatorios')}
          style={{ textDecoration: 'none' }}
        >
          <FileSpreadsheet size={20} /> Relatórios
        </Link>

        <div className="menu-item">
          <Settings size={20} /> Configurações
        </div>
      </nav>
    </aside>
  )
}
