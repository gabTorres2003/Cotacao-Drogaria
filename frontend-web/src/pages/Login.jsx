import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, Info } from 'lucide-react';
import api from '../services/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      const response = await api.post('/auth/login', { username, pin });
      const { token, primeiroAcesso } = response.data;
      
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('primeiroAcesso', primeiroAcesso);
        navigate('/cotacoes');
      }
    } catch (error) {
      setErro('Usuário ou PIN inválidos. Verifique e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f3f4f6' }}>
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        
        <h2 style={{ textAlign: 'center', marginBottom: '25px', color: '#1f2937', fontSize: '22px' }}>
          Compras Drogaria Torres Farma
        </h2>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '8px', padding: '0 10px' }}>
            <User size={18} color="#9ca3af" />
            <input 
              id="username" name="username" autoComplete="username" type="text" 
              placeholder="Usuário (ex: gabriel)" required value={username} 
              onChange={e => setUsername(e.target.value.toLowerCase())}
              style={{ flex: 1, border: 'none', background: 'transparent', padding: '12px', outline: 'none', fontSize: '15px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '8px', padding: '0 10px' }}>
            <Lock size={18} color="#9ca3af" />
            <input 
              id="pin" name="pin" autoComplete="current-password" type={mostrarSenha ? "text" : "password"} 
              inputMode="numeric" pattern="[0-9]*" maxLength={6} placeholder="PIN (4 a 6 dígitos)" 
              required value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
              style={{ flex: 1, border: 'none', background: 'transparent', padding: '12px', outline: 'none', fontSize: '15px' }}
            />
            <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '5px' }}>
              {mostrarSenha ? <EyeOff size={18} color="#9ca3af" /> : <Eye size={18} color="#9ca3af" />}
            </button>
          </div>

          {erro && (
            <span style={{ color: '#dc2626', fontSize: '14px', textAlign: 'center', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '6px', fontWeight: '500' }}>
              {erro}
            </span>
          )}

          <button type="submit" disabled={loading || pin.length < 4} style={{ width: '100%', padding: '14px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: loading || pin.length < 4 ? 'not-allowed' : 'pointer', marginTop: '5px', opacity: loading || pin.length < 4 ? 0.7 : 1 }}>
            {loading ? 'Acessando...' : 'Entrar no Sistema'}
          </button>
        </form>

        {/* RODAPÉ COM AVISO DE SUPORTE */}
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '10px', alignItems: 'flex-start', color: '#64748b' }}>
          <Info size={20} style={{ flexShrink: 0, marginTop: '2px', color: '#94a3b8' }} />
          <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.5' }}>
            Em caso de dúvidas, bloqueio de acesso ou necessidade de troca de senha, entre em contato com o <strong>responsável pelo sistema</strong> da drogaria.
          </p>
        </div>

      </div>
    </div>
  );
}