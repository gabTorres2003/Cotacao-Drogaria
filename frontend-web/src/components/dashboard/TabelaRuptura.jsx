import React from 'react';

export default function TabelaRuptura({ dados }) {
    if(!dados || dados.length === 0) return <p style={{color: '#94a3b8', fontSize: '14px'}}>Não há rupturas recentes registradas.</p>;

    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid #fecaca', color: '#7f1d1d', fontSize: '13px' }}>
                        <th style={{ paddingBottom: '12px' }}>Produto</th>
                        <th style={{ paddingBottom: '12px', textAlign: 'center' }}>Vezes em Falta</th>
                        <th style={{ paddingBottom: '12px' }}>Último Fornecedor</th>
                    </tr>
                </thead>
                <tbody>
                    {dados.map((r, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #fef2f2' }}>
                            <td style={{ padding: '14px 0', fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>{r.nomeProduto}</td>
                            <td style={{ padding: '14px 0', textAlign: 'center', fontWeight: 'bold', color: '#ef4444', fontSize: '14px' }}>{r.vezesEmFalta}x</td>
                            <td style={{ padding: '14px 0', color: '#64748b', fontSize: '13px' }}>{r.ultimoFornecedorCotado}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}