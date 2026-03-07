import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabase';

export default function SessionTimeout() {
  const [mostrarAviso, setMostrarAviso] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const timeoutAvisoRef = useRef(null);
  const timeoutLogoutRef = useRef(null);

  const TEMPO_AVISO = 25 * 60 * 1000; // 25 minutos para mostrar o aviso
  const TEMPO_LOGOUT = 30 * 60 * 1000; // 30 minutos para deslogar a força
  
  const realizarLogout = async () => {
    // Limpa o token do localStorage
    localStorage.removeItem('token');
    // Encerra a sessão ativa no Supabase
    await supabase.auth.signOut();
    
    setMostrarAviso(false);
    navigate('/');
  };

  const resetarTimers = () => {
    if (mostrarAviso) return;

    clearTimeout(timeoutAvisoRef.current);
    clearTimeout(timeoutLogoutRef.current);
    timeoutAvisoRef.current = setTimeout(() => {
      setMostrarAviso(true);
    }, TEMPO_AVISO);
    timeoutLogoutRef.current = setTimeout(() => {
      realizarLogout();
    }, TEMPO_LOGOUT);
  };

  const continuarLogado = () => {
    setMostrarAviso(false);
    resetarTimers();
  };

  useEffect(() => {
    // Não ativa o monitoramento na tela de login
    if (location.pathname === '/') {
      clearTimeout(timeoutAvisoRef.current);
      clearTimeout(timeoutLogoutRef.current);
      return;
    }

    const eventos = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];    
    const manipularAtividade = () => resetarTimers();
    eventos.forEach(evento => window.addEventListener(evento, manipularAtividade));
    resetarTimers();

    return () => {
      eventos.forEach(evento => window.removeEventListener(evento, manipularAtividade));
      clearTimeout(timeoutAvisoRef.current);
      clearTimeout(timeoutLogoutRef.current);
    };
  }, [location.pathname, mostrarAviso]);

  if (!mostrarAviso) return null;

  return (
    <div className="timeout-overlay">
      <div className="timeout-modal">
        <h3>Aviso de Inatividade</h3>
        <p>Sua sessão irá expirar em breve devido à falta de atividade. Deseja continuar no sistema?</p>
        <button onClick={continuarLogado} className="login-btn" style={{ marginTop: '20px' }}>
          Continuar Logado
        </button>
      </div>
    </div>
  );
}