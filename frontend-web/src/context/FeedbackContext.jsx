import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

const FeedbackContext = createContext(null);

let confirmHandler = null;
let solicitarHandler = null;

/**
 * Abre a confirmação personalizada do sistema e resolve com true/false.
 * Pode ser usado fora de componentes (ex.: hooks de serviço).
 */
export function confirmar(mensagem, opcoes = {}) {
  if (typeof confirmHandler === 'function') {
    return confirmHandler(mensagem, opcoes);
  }
  const nativo = window.__nativeConfirm || window.confirm;
  return Promise.resolve(nativo ? nativo.call(window, mensagem) : false);
}

/**
 * Abre um diálogo personalizado de entrada de texto e resolve com o valor
 * informado ou null quando o usuário cancela.
 */
export function solicitar(mensagem, opcoes = {}) {
  if (typeof solicitarHandler === 'function') {
    return solicitarHandler(mensagem, opcoes);
  }
  const nativo = window.__nativePrompt || window.prompt;
  return Promise.resolve(nativo ? nativo.call(window, mensagem, opcoes.valorInicial || '') : null);
}

const ICONES = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const CORES = {
  success: 'var(--success)',
  error: 'var(--danger)',
  warning: 'var(--warning)',
  info: 'var(--primary)',
};

function inferirTipo(mensagem) {
  const texto = String(mensagem || '').toLowerCase();
  if (/erro|falha|inválid|invalid|não foi possível|nao foi possivel|selecione|digite|preencha|informe|obrigatóri|obrigatori/.test(texto)) {
    return 'error';
  }
  if (/sucesso|salv[oa]|concluíd|concluid|enviad[oa]|atualizad[oa]|excluíd|excluid|criad[oa]|removid[oa]|cadastrad[oa]/.test(texto)) {
    return 'success';
  }
  if (/atenção|atencao|aviso|tem certeza|deseja realmente|cuidado/.test(texto)) {
    return 'warning';
  }
  return 'info';
}

export function FeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmacao, setConfirmacao] = useState(null);
  const [solicitacao, setSolicitacao] = useState(null);
  const [valorSolicitacao, setValorSolicitacao] = useState('');
  const sequencia = useRef(0);

  const removerToast = useCallback((id) => {
    setToasts((atuais) => atuais.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((mensagem, opcoes = {}) => {
    const texto = typeof mensagem === 'string' ? mensagem : mensagem?.message;
    if (!texto) return;
    const tipo = opcoes.tipo || inferirTipo(texto);
    const id = ++sequencia.current;
    const duracao = opcoes.duracao ?? (tipo === 'error' ? 7000 : 4500);
    setToasts((atuais) => [...atuais, { id, texto, tipo }]);
    if (duracao > 0) {
      window.setTimeout(() => removerToast(id), duracao);
    }
  }, [removerToast]);

  const confirmarInterno = useCallback((mensagem, opcoes = {}) => {
    return new Promise((resolve) => {
      setConfirmacao({
        mensagem: String(mensagem || ''),
        titulo: opcoes.titulo || 'Confirmar ação',
        confirmarTexto: opcoes.confirmarTexto || 'Confirmar',
        cancelarTexto: opcoes.cancelarTexto || 'Cancelar',
        tipo: opcoes.tipo || (/excluir|apagar|remover|permanentemente|desfeita/i.test(String(mensagem)) ? 'danger' : 'primary'),
        resolve,
      });
    });
  }, []);

  const finalizarConfirmacao = useCallback((resultado) => {
    setConfirmacao((atual) => {
      if (atual?.resolve) atual.resolve(resultado);
      return null;
    });
  }, []);

  const solicitarInterno = useCallback((mensagem, opcoes = {}) => {
    return new Promise((resolve) => {
      setValorSolicitacao(opcoes.valorInicial || '');
      setSolicitacao({
        mensagem: String(mensagem || ''),
        titulo: opcoes.titulo || 'Informar valor',
        confirmarTexto: opcoes.confirmarTexto || 'Confirmar',
        cancelarTexto: opcoes.cancelarTexto || 'Cancelar',
        placeholder: opcoes.placeholder || '',
        inputMode: opcoes.inputMode,
        maxLength: opcoes.maxLength,
        resolve,
      });
    });
  }, []);

  const finalizarSolicitacao = useCallback((confirmado) => {
    setSolicitacao((atual) => {
      if (atual?.resolve) atual.resolve(confirmado ? valorSolicitacao : null);
      return null;
    });
    setValorSolicitacao('');
  }, [valorSolicitacao]);

  useEffect(() => {
    confirmHandler = confirmarInterno;
    solicitarHandler = solicitarInterno;
    return () => {
      if (confirmHandler === confirmarInterno) confirmHandler = null;
      if (solicitarHandler === solicitarInterno) solicitarHandler = null;
    };
  }, [confirmarInterno, solicitarInterno]);

  // Substitui os diálogos nativos por componentes com o visual do sistema.
  useEffect(() => {
    const alertNativo = window.alert;
    window.__nativeConfirm = window.confirm;
    window.__nativePrompt = window.prompt;
    window.alert = (mensagem) => {
      toast(String(mensagem ?? ''), { tipo: inferirTipo(mensagem) });
    };
    return () => {
      window.alert = alertNativo;
    };
  }, [toast]);

  const valor = {
    toast,
    confirmar: confirmarInterno,
    solicitar: solicitarInterno,
    sucesso: (mensagem, opcoes = {}) => toast(mensagem, { ...opcoes, tipo: 'success' }),
    erro: (mensagem, opcoes = {}) => toast(mensagem, { ...opcoes, tipo: 'error' }),
    aviso: (mensagem, opcoes = {}) => toast(mensagem, { ...opcoes, tipo: 'warning' }),
    info: (mensagem, opcoes = {}) => toast(mensagem, { ...opcoes, tipo: 'info' }),
  };

  return (
    <FeedbackContext.Provider value={valor}>
      {children}

      <div
        aria-live="polite"
        style={{
          position: 'fixed', top: '18px', right: '18px', zIndex: 12000,
          display: 'flex', flexDirection: 'column', gap: '10px',
          width: 'min(380px, calc(100vw - 32px))', pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => {
          const Icone = ICONES[t.tipo] || Info;
          const cor = CORES[t.tipo] || CORES.info;
          return (
            <div
              key={t.id}
              role="status"
              style={{
                pointerEvents: 'auto', display: 'flex', alignItems: 'flex-start', gap: '10px',
                backgroundColor: 'var(--surface)', color: 'var(--text)',
                border: '1px solid var(--border-strong)',
                borderLeft: `4px solid ${cor}`,
                borderRadius: '10px', padding: '12px 12px 12px 14px',
                boxShadow: '0 12px 28px rgba(0,0,0,0.18)',
                animation: 'feedback-toast-in 0.18s ease-out',
              }}
            >
              <Icone size={20} style={{ color: cor, flexShrink: 0, marginTop: '1px' }} />
              <div style={{ flex: 1, fontSize: '13px', fontWeight: '500', lineHeight: 1.45, whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
                {t.texto}
              </div>
              <button
                type="button"
                onClick={() => removerToast(t.id)}
                aria-label="Fechar aviso"
                style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', padding: '2px', display: 'flex' }}
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>

      {confirmacao && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed', inset: 0, zIndex: 12100, padding: '16px',
            backgroundColor: 'rgba(2, 6, 23, 0.62)', backdropFilter: 'blur(2px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) finalizarConfirmacao(false);
          }}
        >
          <div style={{
            width: '100%', maxWidth: '440px', maxHeight: 'calc(100dvh - 32px)',
            overflowY: 'auto', backgroundColor: 'var(--surface)', color: 'var(--text)',
            borderRadius: '14px', border: '1px solid var(--border)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.32)', padding: '22px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: confirmacao.tipo === 'danger' ? 'var(--danger-soft)' : 'var(--primary-soft)',
                color: confirmacao.tipo === 'danger' ? 'var(--danger)' : 'var(--primary)',
              }}>
                <AlertTriangle size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: 'var(--text)' }}>
                  {confirmacao.titulo}
                </h3>
                <p style={{ margin: '8px 0 0', fontSize: '14px', lineHeight: 1.5, color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>
                  {confirmacao.mensagem}
                </p>
              </div>
              <button
                type="button"
                onClick={() => finalizarConfirmacao(false)}
                aria-label="Fechar"
                style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', padding: '2px', display: 'flex' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '22px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => finalizarConfirmacao(false)}
                style={{
                  padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600',
                  fontSize: '13px', backgroundColor: 'var(--surface-muted)', color: 'var(--text-secondary)',
                  border: '1px solid var(--border-strong)',
                }}
              >
                {confirmacao.cancelarTexto}
              </button>
              <button
                type="button"
                onClick={() => finalizarConfirmacao(true)}
                style={{
                  padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700',
                  fontSize: '13px', color: '#ffffff', border: 'none',
                  backgroundColor: confirmacao.tipo === 'danger' ? 'var(--danger)' : 'var(--primary)',
                }}
              >
                {confirmacao.confirmarTexto}
              </button>
            </div>
          </div>
        </div>
      )}

      {solicitacao && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed', inset: 0, zIndex: 12100, padding: '16px',
            backgroundColor: 'rgba(2, 6, 23, 0.62)', backdropFilter: 'blur(2px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) finalizarSolicitacao(false);
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              finalizarSolicitacao(true);
            }}
            style={{
              width: '100%', maxWidth: '440px', maxHeight: 'calc(100dvh - 32px)',
              overflowY: 'auto', backgroundColor: 'var(--surface)', color: 'var(--text)',
              borderRadius: '14px', border: '1px solid var(--border)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.32)', padding: '22px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: 'var(--primary-soft)', color: 'var(--primary)',
              }}>
                <Info size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: 'var(--text)' }}>
                  {solicitacao.titulo}
                </h3>
                <p style={{ margin: '8px 0 0', fontSize: '14px', lineHeight: 1.5, color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>
                  {solicitacao.mensagem}
                </p>
              </div>
              <button
                type="button"
                onClick={() => finalizarSolicitacao(false)}
                aria-label="Fechar"
                style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', padding: '2px', display: 'flex' }}
              >
                <X size={18} />
              </button>
            </div>

            <input
              autoFocus
              type="text"
              value={valorSolicitacao}
              onChange={(e) => setValorSolicitacao(e.target.value)}
              placeholder={solicitacao.placeholder}
              inputMode={solicitacao.inputMode}
              maxLength={solicitacao.maxLength}
              style={{
                width: '100%', boxSizing: 'border-box', marginTop: '18px',
                padding: '11px 12px', borderRadius: '8px', fontSize: '15px',
                border: '1px solid var(--border-strong)', backgroundColor: 'var(--surface-muted)',
                color: 'var(--text)', outline: 'none',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => finalizarSolicitacao(false)}
                style={{
                  padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600',
                  fontSize: '13px', backgroundColor: 'var(--surface-muted)', color: 'var(--text-secondary)',
                  border: '1px solid var(--border-strong)',
                }}
              >
                {solicitacao.cancelarTexto}
              </button>
              <button
                type="submit"
                style={{
                  padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700',
                  fontSize: '13px', color: '#ffffff', border: 'none', backgroundColor: 'var(--primary)',
                }}
              >
                {solicitacao.confirmarTexto}
              </button>
            </div>
          </form>
        </div>
      )}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const contexto = useContext(FeedbackContext);
  if (!contexto) {
    throw new Error('useFeedback deve ser usado dentro de FeedbackProvider');
  }
  return contexto;
}

export default FeedbackContext;
