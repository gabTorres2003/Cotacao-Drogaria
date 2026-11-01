import React from 'react';

export default function BadgeOrigem({ origem }) {
  const getCorOrigem = (orig) => {
    if (!orig) return { bg: 'var(--bg)', color: 'var(--text-secondary)', border: 'var(--border-strong)', label: 'Geral' };
    const str = String(orig).toUpperCase();
    
    if (str.includes('ENCOMENDA')) return { bg: 'var(--purple-soft)', color: 'var(--purple-text)', border: 'var(--purple-border)', label: '📦 Encomenda Balcão' };
    if (str.includes('EXTRA MANUAL')) return { bg: '#fce7f3', color: '#be185d', border: '#fbcfe8', label: '➕ Inserido Manualmente' };
    if (str.includes('NOVA IMPORTAÇÃO') || str.includes('ATUALIZAÇÃO')) return { bg: 'var(--purple-soft)', color: 'var(--purple-text)', border: 'var(--purple-border)', label: '🔄 Atualização DNA' };
    if (str.includes('SUGESTÃO') && str.includes('FALTA')) return { bg: 'var(--warning-soft)', color: 'var(--warning-text)', border: 'var(--warning-border)', label: orig };
    if (str.includes('SUGESTÃO')) return { bg: 'var(--purple-soft)', color: 'var(--primary-hover)', border: 'var(--primary-disabled)', label: orig };
    if (str.includes('FALTA')) return { bg: 'var(--warning-soft)', color: 'var(--warning-text)', border: 'var(--warning-border)', label: orig };
    return { bg: 'var(--bg)', color: 'var(--text-secondary)', border: 'var(--border-strong)', label: orig };
  };

  const cores = getCorOrigem(origem);

  return (
    <span style={{ 
      fontSize: '10px', 
      padding: '2px 8px', 
      borderRadius: '10px', 
      fontWeight: 'bold', 
      backgroundColor: cores.bg, 
      color: cores.color, 
      border: `1px solid ${cores.border}`, 
      whiteSpace: 'nowrap' 
    }}>
      {cores.label}
    </span>
  );
}