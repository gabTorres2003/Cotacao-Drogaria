import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase'; 
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import '../App.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: senha,
      });

      if (error) throw error;
      localStorage.setItem('token', data.session.access_token);
      
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      setErro('Erro ao entrar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Drogaria Torres</h2>
          <p>Login no Painel de Cotações</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <User size={20} color="#666" />
            <input 
              type="email" 
              placeholder="Email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Lock size={18} color="#9ca3af" style={{ position: 'absolute', left: '10px' }} />
            
            <input 
              type={mostrarSenha ? "text" : "password"} 
              placeholder="Sua senha" 
              required
              value={senha} 
              onChange={e => setSenha(e.target.value)}
              style={{ width: '100%', padding: '12px 40px', borderRadius: '8px', border: '1px solid #d1d5db' }}
            />
            <button 
              type="button" 
              onClick={() => setMostrarSenha(!mostrarSenha)} 
              style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#9ca3af' }}
            >
              {mostrarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {erro && <p className="error-msg">{erro}</p>}
          
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}