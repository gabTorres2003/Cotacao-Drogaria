import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase'; 
import { Lock, User } from 'lucide-react';
import '../App.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

          <div className="input-group">
            <Lock size={20} color="#666" />
            <input 
              type="password" 
              placeholder="Senha" 
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
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