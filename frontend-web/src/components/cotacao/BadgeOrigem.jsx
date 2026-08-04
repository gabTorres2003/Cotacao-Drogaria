import React from 'react';

export default function BadgeOrigem({ origem }) {
  const getCorOrigem = (orig) => {
    if (!orig) return { bg: '#f3f4f6', color: '#4b5563', border: '#d1d5db', label: 'Geral' };
    const str = String(orig).toUpperCase();
    if (str.includes('EXTRA MANUAL')) return { bg: '#fce7f3', color: '#be185d', border: '#fbcfe8', label: '➕ Inserido Manualmente' };
    if (str.includes('NOVA IMPORTAÇÃO') || str.includes('ATUALIZAÇÃO')) return { bg: '#f3e8ff', color: '#7e22ce', border: '#e9d5ff', label: '🔄 Atualização DNA' };
    if (str.includes('SUGESTÃO') && str.includes('FALTA')) return { bg: '#ffedd5', color: '#c2410c', border: '#fdba74', label: orig };
    if (str.includes('SUGESTÃO')) return { bg: '#e0e7ff', color: '#1d4ed8', border: '#93c5fd', label: orig };
    if (str.includes('FALTA')) return { bg: '#ffedd5', color: '#c2410c', border: '#fdba74', label: orig };
    return { bg: '#f3f4f6', color: '#4b5563', border: '#d1d5db', label: orig };
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