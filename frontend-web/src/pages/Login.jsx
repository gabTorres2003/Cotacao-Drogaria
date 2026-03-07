import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../services/supabase';

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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f3f4f6' }}>
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        
        <h2 style={{ textAlign: 'center', marginBottom: '25px', color: '#1f2937' }}>
          Drogaria Torres Farma
        </h2>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {/* CAMPO DE E-MAIL CORRIGIDO */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '8px', padding: '0 10px' }}>
            <Mail size={18} color="#9ca3af" />
            <input 
              id="email"
              name="email"
              autoComplete="email"
              type="email" 
              placeholder="Seu e-mail" 
              required
              value={email} 
              onChange={e => setEmail(e.target.value)}
              style={{ flex: 1, border: 'none', background: 'transparent', padding: '12px', outline: 'none', fontSize: '15px' }}
            />
          </div>

          {/* CAMPO DE SENHA CORRIGIDO */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '8px', padding: '0 10px' }}>
            <Lock size={18} color="#9ca3af" />
            <input 
              id="senha"
              name="senha"
              autoComplete="current-password"
              type={mostrarSenha ? "text" : "password"} 
              placeholder="Sua senha" 
              required
              value={senha} 
              onChange={e => setSenha(e.target.value)}
              style={{ flex: 1, border: 'none', background: 'transparent', padding: '12px', outline: 'none', fontSize: '15px' }}
            />
            
            <button 
              type="button" 
              onClick={() => setMostrarSenha(!mostrarSenha)} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '5px' }}
              title={mostrarSenha ? "Ocultar senha" : "Ver senha"}
            >
              {mostrarSenha ? <EyeOff size={18} color="#9ca3af" /> : <Eye size={18} color="#9ca3af" />}
            </button>
          </div>

          {/* MENSAGEM DE ERRO */}
          {erro && (
            <span style={{ color: '#dc2626', fontSize: '14px', textAlign: 'center', backgroundColor: '#fee2e2', padding: '8px', borderRadius: '6px' }}>
              {erro}
            </span>
          )}

          {/* BOTÃO ENTRAR */}
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', padding: '14px', backgroundColor: '#2563eb', color: 'white', 
              border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer', marginTop: '10px',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Autenticando...' : 'Entrar no Sistema'}
          </button>
        </form>
        
      </div>
    </div>
  );
}