import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../services/supabase';
import '../App.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      if (error) throw error;
      navigate('/dashboard');
    } catch (error) {
      setErro('E-mail ou senha inválidos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        
        <h2>Drogaria Torres Farma</h2>
        <p>Acesso Restrito</p>
        
        <form onSubmit={handleLogin}>
          
          {/* CAMPO DE E-MAIL */}
          <div className="input-group">
            <Mail className="input-icon" size={20} />
            <input 
              id="email"         
              name="email"       
              autoComplete="email"
              type="email" 
              placeholder="Seu e-mail" 
              required
              value={email} 
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          {/* CAMPO DE SENHA */}
          <div className="input-group" style={{ position: 'relative' }}>
            <Lock className="input-icon" size={20} />
            <input 
              id="senha"                      
              name="senha"                    
              autoComplete="current-password" 
              type={mostrarSenha ? "text" : "password"} 
              placeholder="Sua senha" 
              required
              value={senha} 
              onChange={e => setSenha(e.target.value)}
              style={{ paddingRight: '45px' }}
            />
            
            <button 
              type="button" 
              onClick={() => setMostrarSenha(!mostrarSenha)} 
              style={{ 
                position: 'absolute', 
                right: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                color: '#9ca3af',
                display: 'flex',
                alignItems: 'center',
                padding: '0'
              }}
              title={mostrarSenha ? "Ocultar senha" : "Ver senha"}
            >
              {mostrarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {erro && <div className="error-message">{erro}</div>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Autenticando...' : 'Entrar no Sistema'}
          </button>
        </form>
        
      </div>
    </div>
  );
}