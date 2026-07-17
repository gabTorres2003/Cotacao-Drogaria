import React, { useState, useEffect } from 'react';
import { UserPlus, Edit, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '../services/api';

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const response = await api.get('/usuarios');
        setUsuarios(response.data);
      } catch (error) {
        console.error("Erro ao buscar usuários:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsuarios();
  }, []);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', color: '#1f2937' }}>Gestão de Usuários</h1>
        <button style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#2563eb', color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '500' }}>
          <UserPlus size={20} /> Novo Usuário
        </button>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            <tr>
              <th style={{ padding: '12px 24px', color: '#6b7280', fontWeight: '500' }}>Nome</th>
              <th style={{ padding: '12px 24px', color: '#6b7280', fontWeight: '500' }}>Usuário</th>
              <th style={{ padding: '12px 24px', color: '#6b7280', fontWeight: '500' }}>Status</th>
              <th style={{ padding: '12px 24px', color: '#6b7280', fontWeight: '500', textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" style={{ padding: '24px', textAlign: 'center' }}>Carregando...</td></tr>
            ) : usuarios.length === 0 ? (
              <tr><td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>Nenhum usuário encontrado.</td></tr>
            ) : (
              usuarios.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px 24px' }}>{user.nome}</td>
                  <td style={{ padding: '12px 24px' }}>{user.username}</td>
                  <td style={{ padding: '12px 24px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '9999px', fontSize: '12px', backgroundColor: user.ativo ? '#d1fae5' : '#fee2e2', color: user.ativo ? '#065f46' : '#991b1b' }}>
                      {user.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 24px', textAlign: 'right' }}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', marginRight: '8px' }}><Edit size={18} /></button>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563' }}>
                      {user.ativo ? <ToggleRight size={18} color="#059669" /> : <ToggleLeft size={18} color="#dc2626" />}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}