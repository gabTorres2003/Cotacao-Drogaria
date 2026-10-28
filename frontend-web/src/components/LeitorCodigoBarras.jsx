import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Camera, Check, Flashlight, FlashlightOff, RotateCcw, X, ZoomIn } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { FORMATOS_LEITURA, validarCodigoLido } from '../utils/codigoBarras';

// Garante uma única sessão de câmera ativa por vez, mesmo que o leitor seja
// montado em dois itens da conferência por engano.
let encerrarSessaoGlobal = null;

const registrarSessaoGlobal = (encerrar) => {
  if (encerrarSessaoGlobal && encerrarSessaoGlobal !== encerrar) {
    try { encerrarSessaoGlobal(); } catch { /* sessão anterior já encerrada */ }
  }
  encerrarSessaoGlobal = encerrar;
};

const liberarSessaoGlobal = (encerrar) => {
  if (encerrarSessaoGlobal === encerrar) encerrarSessaoGlobal = null;
};

const mensagemDeErro = (erro) => {
  const texto = String(erro?.message || erro || '');
  const nome = String(erro?.name || '');
  if (nome === 'NotAllowedError' || /permission|notallowed/i.test(texto)) {
    return 'Permissão da câmera negada. Autorize o acesso nas configurações do navegador ou digite o código manualmente.';
  }
  if (nome === 'NotFoundError' || /requested device not found|no camera/i.test(texto)) {
    return 'Nenhuma câmera foi encontrada neste dispositivo. Digite o código manualmente.';
  }
  if (nome === 'NotReadableError' || /could not start video|in use/i.test(texto)) {
    return 'A câmera está sendo usada por outro aplicativo. Feche-o e tente novamente.';
  }
  if (/secure|https/i.test(texto)) {
    return 'A câmera exige conexão segura (HTTPS). Digite o código manualmente.';
  }
  return 'Não foi possível iniciar a câmera. Verifique a permissão e tente novamente ou digite o código manualmente.';
};

export default function LeitorCodigoBarras({ onDetected, onClose, autoIniciar = false }) {
  const containerId = `leitor-codigo-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const scannerRef = useRef(null);
  const sessaoRef = useRef(null);
  const onDetectedRef = useRef(onDetected);
  const onCloseRef = useRef(onClose);
  const avisoTimeoutRef = useRef(null);
  const ultimaInvalidaRef = useRef({ codigo: '', em: 0 });
  const confirmacaoPendenteRef = useRef(false);

  const [aberto, setAberto] = useState(autoIniciar);
  const [tentativa, setTentativa] = useState(0);
  const [estado, setEstado] = useState('iniciando');
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [codigoLido, setCodigoLido] = useState(null);
  const [lanternaAtiva, setLanternaAtiva] = useState(false);
  const [lanternaSuportada, setLanternaSuportada] = useState(false);
  const [zoom, setZoom] = useState(null);

  useEffect(() => { onDetectedRef.current = onDetected; }, [onDetected]);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  const limparAviso = useCallback(() => {
    if (avisoTimeoutRef.current) {
      clearTimeout(avisoTimeoutRef.current);
      avisoTimeoutRef.current = null;
    }
    setAviso('');
  }, []);

  const mostrarAviso = useCallback((mensagem) => {
    limparAviso();
    setAviso(mensagem);
    avisoTimeoutRef.current = setTimeout(() => {
      setAviso('');
      avisoTimeoutRef.current = null;
    }, 4000);
  }, [limparAviso]);

  const pararCamera = useCallback(async (sessao) => {
    const alvo = sessao || sessaoRef.current;
    if (!alvo || alvo.parando) return;
    alvo.parando = true;
    alvo.cancelado = true;
    const scanner = alvo.scanner;
    alvo.scanner = null;
    if (scannerRef.current === scanner) scannerRef.current = null;
    if (!scanner) return;
    let escaneando = false;
    try { escaneando = scanner.isScanning; } catch { /* estado indisponível */ }
    // Se o start() ainda está em andamento, a finalização é feita logo após
    // ele resolver (ver iniciar()), evitando deixar a câmera ligada.
    if (!escaneando) return;
    try {
      await scanner.stop();
    } catch { /* câmera já encerrada */ }
    try { scanner.clear(); } catch { /* elemento já removido */ }
  }, []);

  const fechar = useCallback(() => {
    pararCamera();
    setAberto(false);
    setCodigoLido(null);
    confirmacaoPendenteRef.current = false;
    setErro('');
    limparAviso();
    onCloseRef.current?.();
  }, [limparAviso, pararCamera]);

  const aoLer = useCallback((decodedText, resultado) => {
    const sessao = sessaoRef.current;
    if (!sessao || sessao.cancelado) return;
    // Enquanto o operador confirma a leitura, não processa novas leituras.
    if (confirmacaoPendenteRef.current) return;

    const formato = resultado?.result?.format;
    const validacao = validarCodigoLido(decodedText, formato);
    if (!validacao.valido) {
      const agora = Date.now();
      const anterior = ultimaInvalidaRef.current;
      if (anterior.codigo !== decodedText || agora - anterior.em > 2500) {
        ultimaInvalidaRef.current = { codigo: decodedText, em: agora };
        mostrarAviso(validacao.motivo);
        try { if (navigator.vibrate) navigator.vibrate(60); } catch { /* sem vibração */ }
      }
      return;
    }

    try { scannerRef.current?.pause(true); } catch { /* pausa best-effort */ }
    confirmacaoPendenteRef.current = true;
    setAviso('');
    setCodigoLido({
      valor: validacao.codigo,
      formatoNome: validacao.formatoNome
    });
    try { if (navigator.vibrate) navigator.vibrate(90); } catch { /* sem vibração */ }
  }, [mostrarAviso]);

  useEffect(() => {
    if (!aberto) return undefined;

    const sessao = { cancelado: false, parando: false, scanner: null };
    sessaoRef.current = sessao;
    setEstado('iniciando');
    setErro('');
    setAviso('');
    setCodigoLido(null);
    confirmacaoPendenteRef.current = false;
    setLanternaAtiva(false);
    setLanternaSuportada(false);
    setZoom(null);

    const encerrar = () => { pararCamera(sessao); };
    registrarSessaoGlobal(encerrar);

    const iniciar = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setErro('A câmera não está disponível neste navegador ou conexão. Digite o código manualmente.');
        setEstado('erro');
        return;
      }

      let scanner;
      try {
        scanner = new Html5Qrcode(containerId, {
          formatsToSupport: FORMATOS_LEITURA,
          useBarCodeDetectorIfSupported: true,
          verbose: false
        });
      } catch {
        setErro('Não foi possível preparar o leitor de câmera. Digite o código manualmente.');
        setEstado('erro');
        return;
      }
      sessao.scanner = scanner;
      scannerRef.current = scanner;
      if (sessao.cancelado) {
        pararCamera(sessao);
        return;
      }

      try {
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 20,
            qrbox: (largura, altura) => ({
              width: Math.max(200, Math.min(Math.floor(largura * 0.92), 720)),
              height: Math.max(100, Math.min(Math.floor(altura * 0.32), 240))
            }),
            aspectRatio: 1.7777778,
            disableFlip: true,
            videoConstraints: {
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          },
          aoLer,
          () => { /* erros de leitura são esperados enquanto o código não está enquadrado */ }
        );
      } catch (e) {
        if (sessao.cancelado) {
          pararCamera(sessao);
          return;
        }
        setErro(mensagemDeErro(e));
        setEstado('erro');
        return;
      }

      if (sessao.cancelado) {
        // O componente saiu (ou a câmera foi trocada) enquanto o start()
        // ainda estava em andamento: encerra agora para não deixar a câmera ligada.
        try { if (scanner.isScanning) await scanner.stop(); } catch { /* já parada */ }
        try { scanner.clear(); } catch { /* elemento já removido */ }
        return;
      }

      setEstado('lendo');

      // Foco contínuo melhora a leitura de código de barras em movimento/reflexo.
      try {
        await scanner.applyVideoConstraints({ focusMode: 'continuous' });
      } catch { /* dispositivo sem controle de foco */ }

      try {
        if (sessao.cancelado) return;
        const capacidades = scanner.getRunningTrackCameraCapabilities?.();
        const torch = capacidades?.torchFeature?.();
        if (torch?.isSupported?.()) setLanternaSuportada(true);
        const zoomFeature = capacidades?.zoomFeature?.();
        if (zoomFeature?.isSupported?.()) {
          const minimo = Number(zoomFeature.min?.() ?? 1);
          const maximo = Number(zoomFeature.max?.() ?? minimo);
          if (maximo > minimo) {
            setZoom({
              minimo,
              maximo,
              passo: Number(zoomFeature.step?.() ?? 0.1) || 0.1,
              atual: Number(zoomFeature.value?.() ?? minimo)
            });
          }
        }
      } catch { /* capacidades opcionais */ }
    };

    iniciar();

    return () => {
      liberarSessaoGlobal(encerrar);
      pararCamera(sessao);
      sessaoRef.current = null;
    };
  }, [aberto, tentativa, containerId, aoLer, pararCamera]);

  useEffect(() => () => {
    if (avisoTimeoutRef.current) clearTimeout(avisoTimeoutRef.current);
  }, []);

  const tentarNovamente = () => {
    setErro('');
    setEstado('iniciando');
    setTentativa(t => t + 1);
  };

  const alternarLanterna = async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;
    try {
      const torch = scanner.getRunningTrackCameraCapabilities?.()?.torchFeature?.();
      if (!torch?.isSupported?.()) return;
      const novoValor = !lanternaAtiva;
      await torch.apply(novoValor);
      setLanternaAtiva(novoValor);
    } catch {
      mostrarAviso('Não foi possível controlar a lanterna neste dispositivo.');
    }
  };

  const alterarZoom = async (valor) => {
    const scanner = scannerRef.current;
    if (!scanner) return;
    const numero = Number(valor);
    setZoom(prev => (prev ? { ...prev, atual: numero } : prev));
    try {
      const zoomFeature = scanner.getRunningTrackCameraCapabilities?.()?.zoomFeature?.();
      if (zoomFeature?.isSupported?.()) await zoomFeature.apply(numero);
    } catch { /* zoom não suportado durante a leitura */ }
  };

  const confirmarCodigo = () => {
    if (!codigoLido) return;
    const codigo = codigoLido.valor;
    pararCamera();
    setAberto(false);
    setCodigoLido(null);
    confirmacaoPendenteRef.current = false;
    limparAviso();
    onDetectedRef.current?.(codigo);
    onCloseRef.current?.();
  };

  const lerNovamente = () => {
    setCodigoLido(null);
    confirmacaoPendenteRef.current = false;
    setAviso('');
    try { scannerRef.current?.resume(); } catch { /* câmera já pausada/encerrada */ }
  };

  const abrir = () => {
    setErro('');
    setAviso('');
    setCodigoLido(null);
    confirmacaoPendenteRef.current = false;
    setAberto(true);
  };

  if (!autoIniciar) {
    return (
      <div>
        <button
          type="button"
          onClick={abrir}
          style={{ padding: '9px 12px', border: '1px solid #94a3b8', borderRadius: '6px', background: 'white', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', minHeight: '42px' }}
        >
          <Camera size={16} /> Ler câmera
        </button>
        {aberto && (
          <div style={{ marginTop: '8px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#f8fafc' }}>
            <ConteudoLeitor
              containerId={containerId}
              estado={estado}
              erro={erro}
              aviso={aviso}
              codigoLido={codigoLido}
              lanternaSuportada={lanternaSuportada}
              lanternaAtiva={lanternaAtiva}
              zoom={zoom}
              onFechar={fechar}
              onTentarNovamente={tentarNovamente}
              onAlternarLanterna={alternarLanterna}
              onAlterarZoom={alterarZoom}
              onConfirmar={confirmarCodigo}
              onLerNovamente={lerNovamente}
            />
          </div>
        )}
      </div>
    );
  }

  if (!aberto) return null;

  return (
    <div style={{ marginTop: '8px', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#f8fafc' }}>
      <ConteudoLeitor
        containerId={containerId}
        estado={estado}
        erro={erro}
        aviso={aviso}
        codigoLido={codigoLido}
        lanternaSuportada={lanternaSuportada}
        lanternaAtiva={lanternaAtiva}
        zoom={zoom}
        onFechar={fechar}
        onTentarNovamente={tentarNovamente}
        onAlternarLanterna={alternarLanterna}
        onAlterarZoom={alterarZoom}
        onConfirmar={confirmarCodigo}
        onLerNovamente={lerNovamente}
      />
    </div>
  );
}

function ConteudoLeitor({
  containerId,
  estado,
  erro,
  aviso,
  codigoLido,
  lanternaSuportada,
  lanternaAtiva,
  zoom,
  onFechar,
  onTentarNovamente,
  onAlternarLanterna,
  onAlterarZoom,
  onConfirmar,
  onLerNovamente
}) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <strong style={{ fontSize: '13px', color: '#334155' }}>
          {codigoLido ? 'Confirme o código lido' : 'Aponte para o código de barras'}
        </strong>
        <button type="button" onClick={onFechar} aria-label="Fechar câmera" style={{ border: 0, background: 'transparent', cursor: 'pointer', padding: '4px' }}>
          <X size={18} />
        </button>
      </div>

      <div
        id={containerId}
        style={{ width: '100%', maxWidth: '640px', margin: '0 auto', overflow: 'hidden', borderRadius: '8px', background: '#111827', minHeight: estado === 'erro' ? 0 : '180px' }}
      />

      {estado === 'iniciando' && (
        <p style={{ fontSize: '12px', color: '#475569', margin: '8px 0 0', textAlign: 'center' }}>Iniciando a câmera...</p>
      )}

      {erro && (
        <div style={{ marginTop: '8px' }}>
          <p style={{ color: '#b91c1c', fontSize: '12px', margin: '0 0 8px', lineHeight: 1.4 }}>{erro}</p>
          <button
            type="button"
            onClick={onTentarNovamente}
            style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600' }}
          >
            <RotateCcw size={14} /> Tentar novamente
          </button>
        </div>
      )}

      {aviso && !codigoLido && (
        <p style={{ color: '#b45309', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', fontSize: '12px', margin: '8px 0 0', padding: '8px 10px', lineHeight: 1.4 }}>
          {aviso}
        </p>
      )}

      {(lanternaSuportada || zoom) && !codigoLido && estado !== 'erro' && (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', marginTop: '8px' }}>
          {lanternaSuportada && (
            <button
              type="button"
              onClick={onAlternarLanterna}
              style={{ padding: '7px 10px', border: `1px solid ${lanternaAtiva ? '#f59e0b' : '#cbd5e1'}`, borderRadius: '6px', background: lanternaAtiva ? '#fef3c7' : 'white', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: '600', color: '#334155' }}
            >
              {lanternaAtiva ? <FlashlightOff size={14} /> : <Flashlight size={14} />}
              {lanternaAtiva ? 'Desligar lanterna' : 'Lanterna'}
            </button>
          )}
          {zoom && (
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#334155', fontWeight: '600' }}>
              <ZoomIn size={14} />
              <input
                type="range"
                min={zoom.minimo}
                max={zoom.maximo}
                step={zoom.passo}
                value={zoom.atual}
                onChange={e => onAlterarZoom(e.target.value)}
                style={{ width: '110px', accentColor: '#3b82f6' }}
              />
            </label>
          )}
        </div>
      )}

      {codigoLido && (
        <div style={{ marginTop: '10px', padding: '10px', borderRadius: '8px', border: '1px solid #bbf7d0', backgroundColor: '#f0fdf4' }}>
          <div style={{ fontSize: '12px', color: '#166534', marginBottom: '4px' }}>Código lido ({codigoLido.formatoNome}):</div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#166534', letterSpacing: '0.5px', wordBreak: 'break-all' }}>
            {codigoLido.valor}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onConfirmar}
              style={{ padding: '9px 14px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', minHeight: '42px' }}
            >
              <Check size={15} /> Confirmar e consultar
            </button>
            <button
              type="button"
              onClick={onLerNovamente}
              style={{ padding: '9px 14px', backgroundColor: 'white', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', minHeight: '42px' }}
            >
              <RotateCcw size={15} /> Ler novamente
            </button>
          </div>
        </div>
      )}
    </>
  );
}
