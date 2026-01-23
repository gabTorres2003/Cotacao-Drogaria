import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; 
import { Lock, User } from 'lucide-react';
import '../App.css';

export default function Login() {
  const [login, setLogin] = useState(''); 
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');

    try {
      // Chama o backend
      const response = await api.post('/auth/login', { login, senha });
      
      // Salva o token
      localStorage.setItem('token', response.data.token);
      
      // Redireciona
      navigate('/dashboard');
    } catch (error) {
      setErro('Usuário ou senha incorretos.');
      console.error(error);
    }
  };

  const styles = {
    container: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#f3f4f6',
      fontFamily: 'Segoe UI, sans-serif'
    },
    card: {
      backgroundColor: 'white',
      padding: '40px',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      width: '100%',
      maxWidth: '400px',
      textAlign: 'center'
    },
    title: { color: '#1f2937', marginBottom: '20px' },
    input: {
      width: '100%',
      padding: '12px',
      marginBottom: '15px',
      borderRadius: '6px',
      border: '1px solid #d1d5db',
      fontSize: '16px',
      boxSizing: 'border-box' 
    },
    button: {
      width: '100%',
      padding: '12px',
      backgroundColor: '#2563eb',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontSize: '16px',
      fontWeight: 'bold',
      cursor: 'pointer',
      marginTop: '10px'
    }
  };

  return (
    <div style={styles.container}>
      <form style={styles.card} onSubmit={handleLogin}>
        <h2 style={styles.title}>📦 Cotação Drogaria Torres</h2>
        <input 
          type="email" 
          placeholder="E-mail" 
          style={styles.input}
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input 
          type="password" 
          placeholder="Senha" 
          style={styles.input}
          value={senha}
          onChange={e => setSenha(e.target.value)}
        />
        <button type="submit" style={styles.button}>Entrar</button>
      </form>
    </div>
  );
}