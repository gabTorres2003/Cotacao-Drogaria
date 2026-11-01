import React from 'react';

export default function RankingFornecedores({ dados }) {
    if(!dados || dados.length === 0) return <p style={{color: 'var(--text-subtle)', fontSize: '14px'}}>Ainda não há histórico de compras.</p>;

    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)', fontSize: '13px' }}>
                        <th style={{ paddingBottom: '12px' }}>Fornecedor</th>
                        <th style={{ paddingBottom: '12px', textAlign: 'center' }}>Win Rate (Vitórias)</th>
                        <th style={{ paddingBottom: '12px', textAlign: 'right' }}>Total Comprado</th>
                    </tr>
                </thead>
                <tbody>
                    {dados.map((f, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--surface-muted)' }}>
                            <td style={{ padding: '14px 0', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '14px' }}>{f.nomeFornecedor}</td>
                            <td style={{ padding: '14px 0', textAlign: 'center' }}>
                                <span style={{ backgroundColor: f.winRate > 40 ? 'var(--success-soft)' : (f.winRate > 20 ? 'var(--warning-soft)' : 'var(--danger-soft)'), color: f.winRate > 40 ? 'var(--success)' : (f.winRate > 20 ? 'var(--warning)' : 'var(--danger)'), padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                                    {f.winRate.toFixed(1)}%
                                </span>
                            </td>
                            <td style={{ padding: '14px 0', textAlign: 'right', fontWeight: '600', color: 'var(--text)', fontSize: '14px' }}>
                                R$ {f.valorTotalComprado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}