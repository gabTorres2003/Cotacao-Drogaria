import React from 'react';

export default function MetricaCard({ titulo, valor, subtexto, icone, corFundo }) {
    return (
        <div style={{ backgroundColor: 'var(--surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: '15px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ backgroundColor: corFundo, padding: '14px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {icone}
            </div>
            <div>
                <h4 style={{ margin: '0 0 5px 0', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>{titulo}</h4>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text)', marginBottom: '4px' }}>{valor}</div>
                <span style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>{subtexto}</span>
            </div>
        </div>
    );
}