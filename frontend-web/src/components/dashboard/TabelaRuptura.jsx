import React from 'react';

export default function TabelaRuptura({ dados }) {
    if(!dados || dados.length === 0) return <p style={{color: 'var(--text-subtle)', fontSize: '14px'}}>Não há rupturas recentes registradas.</p>;

    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid var(--danger-border)', color: 'var(--danger-border)', fontSize: '13px' }}>
                        <th style={{ paddingBottom: '12px' }}>Produto</th>
                        <th style={{ paddingBottom: '12px', textAlign: 'center' }}>Vezes em Falta</th>
                        <th style={{ paddingBottom: '12px' }}>Último Fornecedor</th>
                    </tr>
                </thead>
                <tbody>
                    {dados.map((r, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--danger-soft)' }}>
                            <td style={{ padding: '14px 0', fontWeight: '600', color: 'var(--text)', fontSize: '14px' }}>{r.nomeProduto}</td>
                            <td style={{ padding: '14px 0', textAlign: 'center', fontWeight: 'bold', color: 'var(--danger)', fontSize: '14px' }}>{r.vezesEmFalta}x</td>
                            <td style={{ padding: '14px 0', color: 'var(--text-muted)', fontSize: '13px' }}>{r.ultimoFornecedorCotado}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}