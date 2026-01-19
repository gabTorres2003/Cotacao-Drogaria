import { LayoutDashboard, FileSpreadsheet, Settings, Pill } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <Pill size={28} /> Torres Farma
      </div>
      
      <nav>
        <div className="menu-item active">
          <LayoutDashboard size={20} /> Dashboard
        </div>
        <div className="menu-item">
          <FileSpreadsheet size={20} /> Relatórios
        </div>
        <div className="menu-item">
          <Settings size={20} /> Configurações
        </div>
      </nav>
    </aside>
  );
}