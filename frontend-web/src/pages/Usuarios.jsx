import React, { useState, useEffect } from 'react';
import { UserPlus, Edit2, ToggleLeft, ToggleRight, User, X } from 'lucide-react';
import api from '../services/api';
import Sidebar from '../components/layout/Sidebar'; 

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ nome: '', username: '', pin: '' });
  const [erroMsg, setErroMsg] = useState('');

  useEffect(() => {
    fetchUsuarios();
  }, []);

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

  const handleOpenModal = (user = null) => {
    setErroMsg('');
    if (user) {
      setEditingUser(user);
      setFormData({ nome: user.nome, username: user.username, pin: '' });
    } else {
      setEditingUser(null);
      setFormData({ nome: '', username: '', pin: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErroMsg('');

    try {
      if (editingUser) {
        await api.put(`/usuarios/${editingUser.id}`, formData);
      } else {
        if (formData.pin.length < 4) {
          setErroMsg('O PIN deve ter no mínimo 4 dígitos.');
          return;
        }
        await api.post('/usuarios', formData);
      }
      
      fetchUsuarios(); 
      handleCloseModal(); 
    } catch (error) {
      setErroMsg('Erro ao salvar. Verifique se o usuário já existe.');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await api.patch(`/usuarios/${id}/status`);
      fetchUsuarios(); 
    } catch (error) {
      console.error("Erro ao alterar status:", error);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      
      {/* MENU LATERAL INCLUÍDO AQUI */}
      <Sidebar />

      {/* ÁREA PRINCIPAL DA TELA */}
      <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        
        {/* CABEÇALHO PADRÃO DO SISTEMA */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 8px 0' }}>Gerenciar Usuários</h1>
            <p style={{ color: '#64748b', margin: 0 }}>Cadastre os contatos e os acessos (login) do sistema</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              backgroundColor: '#3b82f6', color: 'white',
              padding: '10px 20px', borderRadius: '8px',
              border: 'none', cursor: 'pointer', fontWeight: '500',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <UserPlus size={20} />
            Novo Usuário
          </button>
        </div>

        {/* TABELA COM ESTILO DE FORNECEDORES */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '16px 24px', color: '#64748b', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase' }}>Nome / Login</th>
                <th style={{ padding: '16px 24px', color: '#64748b', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '16px 24px', color: '#64748b', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="3" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Carregando usuários...</td></tr>
              ) : usuarios.length === 0 ? (
                <tr><td colSpan="3" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Nenhum usuário cadastrado.</td></tr>
              ) : (
                usuarios.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background-color 0.2s' }}>
                    
                    {/* COLUNA: AVATAR E NOME */}
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ backgroundColor: '#eff6ff', padding: '8px', borderRadius: '50%', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <User size={20} />
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: '#1e293b' }}>{user.nome}</div>
                          <div style={{ fontSize: '13px', color: '#64748b' }}>Login: {user.username}</div>
                        </div>
                      </div>
                    </td>

                    {/* COLUNA: STATUS */}
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: '600',
                        backgroundColor: user.ativo ? '#dcfce7' : '#fee2e2',
                        color: user.ativo ? '#166534' : '#991b1b'
                      }}>
                        {user.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>

                    {/* COLUNA: BOTÕES DE AÇÃO */}
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleOpenModal(user)}
                        title="Editar Usuário"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', marginRight: '16px', padding: '4px' }}
                      >
                        <Edit2 size={18} />
                      </button>
                      
                      <button
                        onClick={() => handleToggleStatus(user.id)}
                        title={user.ativo ? "Desativar Acesso" : "Ativar Acesso"}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: user.ativo ? '#10b981' : '#ef4444', padding: '4px' }}
                      >
                        {user.ativo ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* =========================================
            MODAL DE CRIAÇÃO / EDIÇÃO DE USUÁRIO
            ========================================= */}
        {isModalOpen && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 50
          }}>
            <div style={{
              backgroundColor: 'white', borderRadius: '12px', width: '100%', maxWidth: '400px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                  {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                </h2>
                <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSave} style={{ padding: '24px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#334155', marginBottom: '8px' }}>Nome Completo</label>
                  <input
                    type="text" required value={formData.nome}
                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}
                    placeholder="Ex: Gabriel Torres"
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#334155', marginBottom: '8px' }}>Nome de Usuário (Login)</label>
                  <input
                    type="text" required value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().trim() })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}
                    placeholder="Ex: gabriel"
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#334155', marginBottom: '8px' }}>PIN de Acesso</label>
                  <input
                    type="password" inputMode="numeric" pattern="[0-9]*" maxLength={6}
                    required={!editingUser} // Obrigatório apenas ao criar
                    value={formData.pin}
                    onChange={e => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}
                    placeholder={editingUser ? "Deixe em branco para não alterar" : "Senha numérica (4 a 6 dígitos)"}
                  />
                </div>

                {erroMsg && (
                  <div style={{ marginBottom: '16px', padding: '10px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '6px', fontSize: '14px', textAlign: 'center' }}>
                    {erroMsg}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={handleCloseModal} style={{ padding: '10px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', cursor: 'pointer', fontWeight: '500' }}>
                    Cancelar
                  </button>
                  <button type="submit" style={{ padding: '10px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#3b82f6', color: 'white', cursor: 'pointer', fontWeight: '500' }}>
                    {editingUser ? 'Atualizar Dados' : 'Criar Usuário'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}