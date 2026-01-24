import { useEffect, useState } from 'react';
import api from '../services/api';
import Sidebar from '../components/layout/Sidebar';
import { UserPlus, Phone, Trash2, Search, User, Pencil } from 'lucide-react';

export default function Fornecedores() {
  const [fornecedores, setFornecedores] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  
  const [form, setForm] = useState({ id: null, nome: '', telefone: '' });
  
  const [busca, setBusca] = useState('');

  useEffect(() => {
    carregarFornecedores();
  }, []);

  const carregarFornecedores = async () => {
    try {
      const response = await api.get('/api/fornecedor');
      setFornecedores(response.data);
    } catch (error) {
      console.error("Erro ao listar fornecedores", error);
    }
  };

  const abrirModalCriacao = () => {
    setForm({ id: null, nome: '', telefone: '' }); 
    setModalAberto(true);
  };

  const abrirModalEdicao = (fornecedor) => {
    setForm({ 
      id: fornecedor.id, 
      nome: fornecedor.nome, 
      telefone: fornecedor.telefone || '' 
    });
    setModalAberto(true);
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    if (!form.nome || !form.telefone) {
      alert("Preencha nome e telefone!");
      return;
    }

    try {
      const telefoneLimpo = form.telefone.replace(/\D/g, '');
      const payload = { nome: form.nome, telefone: telefoneLimpo };

      if (form.id) {
        // --- PUT ---
        await api.put(`/api/fornecedor/${form.id}`, payload);
        alert("Fornecedor atualizado com sucesso!");
      } else {
        // --- POST ---
        await api.post('/api/fornecedor', payload);
        alert("Fornecedor cadastrado com sucesso!");
      }
      
      setModalAberto(false);
      carregarFornecedores(); 
    } catch (error) {
      alert("Erro ao salvar: " + (error.response?.data || error.message));
    }
  };

  const filtrados = fornecedores.filter(f => 
    f.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (f.telefone && f.telefone.includes(busca))
  );

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '24px', marginBottom: '5px' }}>Gerenciar Fornecedores</h1>
            <p style={{ color: '#6b7280' }}>Cadastre e edite seus contatos</p>
          </div>
          
          <button className="btn-new-cotacao" onClick={abrirModalCriacao}>
            <UserPlus size={20} /> Novo Fornecedor
          </button>
        </header>

        <div className="filters-bar">
          <div className="search-input-container">
            <Search size={18} color="#9ca3af" />
            <input 
              type="text" 
              placeholder="Buscar fornecedor..." 
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{width: '60px'}}>ID</th>
                <th>Nome</th>
                <th>Telefone (WhatsApp)</th>
                <th style={{width: '100px'}}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr><td colSpan="4" style={{textAlign: 'center', padding: '20px', color: '#888'}}>Nenhum fornecedor encontrado.</td></tr>
              ) : (
                filtrados.map(f => (
                  <tr key={f.id}>
                    <td>#{f.id}</td>
                    <td>
                      <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <div style={{background: '#e0f2fe', padding: '8px', borderRadius: '50%', color: '#0284c7'}}>
                          <User size={16} />
                        </div>
                        <span style={{fontWeight: '600', color: '#374151'}}>{f.nome}</span>
                      </div>
                    </td>
                    <td>
                       <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: '#666'}}>
                        <Phone size={16} />
                        {f.telefone || 'Sem telefone'}
                       </div>
                    </td>
                    <td>
                      <div style={{display: 'flex', gap: '8px'}}>
                        <button 
                          className="btn-icon" 
                          style={{color: '#2563eb', background: '#eff6ff'}} 
                          title="Editar"
                          onClick={() => abrirModalEdicao(f)}
                        >
                          <Pencil size={18} />
                        </button>

                        <button 
                          className="btn-icon" 
                          style={{color: '#ef4444', background: '#fef2f2', opacity: 0.5, cursor: 'not-allowed'}} 
                          title="Excluir (Em breve)"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {modalAberto && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h2 style={{marginBottom: '20px'}}>
              {form.id ? 'Editar Fornecedor' : 'Novo Fornecedor'}
            </h2>
            
            <form onSubmit={handleSalvar} style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
              <div>
                <label style={styles.label}>Nome da Empresa / Vendedor</label>
                <input 
                  type="text" 
                  style={styles.input}
                  value={form.nome}
                  onChange={e => setForm({...form, nome: e.target.value})}
                  placeholder="Ex: Distribuidora Santa Cruz"
                  required
                />
              </div>

              <div>
                <label style={styles.label}>WhatsApp (com DDD)</label>
                <input 
                  type="tel" 
                  style={styles.input}
                  value={form.telefone}
                  onChange={e => setForm({...form, telefone: e.target.value})}
                  placeholder="Ex: 5522999999999"
                  required
                />
              </div>

              <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
                <button type="button" onClick={() => setModalAberto(false)} style={styles.btnCancel}>Cancelar</button>
                <button type="submit" style={styles.btnSave}>
                  {form.id ? 'Salvar Alterações' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
  },
  modal: {
    backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '400px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  },
  label: { fontSize: '14px', fontWeight: '500', marginBottom: '5px', display: 'block', color: '#374151' },
  input: {
    width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '15px', outlineColor: '#2563eb'
  },
  btnCancel: {
    flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontWeight: '500', color: '#374151'
  },
  btnSave: {
    flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#2563eb', color: 'white', fontWeight: '600', cursor: 'pointer'
  }
};