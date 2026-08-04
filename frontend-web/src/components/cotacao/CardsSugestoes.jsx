import React from 'react';
import { Tag } from 'lucide-react';

export default function CardsSugestoes({ promocoes, getNomeExibicao, fMoney }) {
  if (!promocoes || promocoes.length === 0) return null;

  return (
    <div style={{ marginTop: '30px', borderTop: '2px dashed #e5e7eb', paddingTop: '20px' }}>
      <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Tag size={20} color="#2563eb" /> Sugestões & Ofertas Extras dos Fornecedores
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {promocoes.map(promo => (
          <div key={promo.id} style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1d4ed8', textTransform: 'uppercase' }}>{promo.fornecedorNome}</div>
            <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e3a8a', marginTop: '4px' }}>{getNomeExibicao(promo.nomeProduto)}</div>
            <div style={{ fontSize: '14px', color: '#1e40af', marginTop: '6px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{fMoney(promo.preco)}</span> <span style={{ fontSize: '12px' }}>(Mínimo: {promo.qtdMinima} un)</span>
            </div>
            {promo.observacao && <div style={{ fontSize: '12px', color: '#475569', marginTop: '8px', fontStyle: 'italic', borderTop: '1px solid #bfdbfe', paddingTop: '8px' }}>{promo.observacao}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}