import React from 'react';
import { ShoppingCart, Tag } from 'lucide-react';

export default function CardsSugestoes({ 
  promocoes, getNomeExibicao, fMoney, 
  onAbrirAddPedidoModal, relatorioOrdenado, getNomeRealSempre 
}) {
  if (!promocoes || promocoes.length === 0) return null;

  return (
    <div style={{ marginTop: '24px', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ backgroundColor: '#fef08a', color: '#854d0e', padding: '4px 8px', borderRadius: '6px', fontSize: '14px' }}>⭐</span>
        Sugestões Extras dos Fornecedores
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {promocoes.map((promo, idx) => {
           let rankBadge = null;
           if (relatorioOrdenado) {
               const nomeNorm = getNomeRealSempre(promo.nomeProduto).toLowerCase().trim();
               const matchItem = relatorioOrdenado.find(r => getNomeRealSempre(r.nomeProduto).toLowerCase().trim() === nomeNorm);
               
               if (matchItem) {
                   let precosArr = [];
                   Object.values(matchItem.precosPorFornecedor || {}).forEach(p => { if (p > 0) precosArr.push(p); });
                   Object.values(matchItem.precosSubstitutosPorFornecedor || {}).forEach(p => { if (p > 0) precosArr.push(p); });
                   precosArr.push(promo.preco);
                   
                   precosArr = [...new Set(precosArr)].sort((a, b) => a - b);
                   const rankIndex = precosArr.indexOf(promo.preco) + 1;
                   
                   const corFundo = rankIndex === 1 ? '#dcfce7' : (rankIndex === 2 ? '#fef08a' : '#f1f5f9');
                   const corTexto = rankIndex === 1 ? '#166534' : (rankIndex === 2 ? '#854d0e' : '#475569');
                   
                   rankBadge = (
                     <span style={{ fontSize: '12px', backgroundColor: corFundo, color: corTexto, padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Tag size={12} /> {rankIndex}º Melhor Preço
                     </span>
                   );
               } else {
                   rankBadge = <span style={{ fontSize: '12px', backgroundColor: '#e2e8f0', color: '#475569', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold' }}>Item Não Cotado (Novo)</span>;
               }
           }

           return (
              <div key={idx} style={{ backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>{promo.fornecedorNome}</div>
                  {rankBadge}
                </div>
                
                <div>
                  <strong style={{ fontSize: '15px', color: '#1e293b', display: 'block', marginBottom: '4px' }}>{getNomeExibicao(promo.nomeProduto)}</strong>
                  {promo.observacao && <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>Obs: {promo.observacao}</div>}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '10px', borderRadius: '6px' }}>
                   <div>
                     <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>Qtd Mínima</div>
                     <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: 'bold' }}>{promo.qtdMinima} un</div>
                   </div>
                   <div style={{ textAlign: 'right' }}>
                     <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>Preço Unitário</div>
                     <div style={{ fontSize: '16px', color: '#16a34a', fontWeight: '900' }}>{fMoney(promo.preco)}</div>
                   </div>
                </div>

                <button 
                  onClick={() => onAbrirAddPedidoModal({
                    idItem: null, 
                    nomeProduto: promo.nomeProduto,
                    quantidade: promo.qtdMinima,
                    ultimoPreco: promo.preco,
                    precoCustom: promo.preco
                  }, promo.fornecedorNome)}
                  style={{ padding: '10px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: 'auto' }}
                >
                  <ShoppingCart size={16} /> Incluir no Pedido
                </button>
              </div>
           )
        })}
      </div>
    </div>
  )
}