import { useEffect, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';

export default function LeitorCodigoBarras({ onDetected }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  const ultimoCodigoRef = useRef('');
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!aberto) return undefined;

    let ativo = true;
    const iniciar = async () => {
      if (!('BarcodeDetector' in window)) {
        setErro('A leitura automática não é suportada neste navegador. Digite o código manualmente.');
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setErro('A câmera não está disponível. Digite o código manualmente.');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } });
        if (!ativo) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        const detector = new window.BarcodeDetector();
        const detectar = async () => {
          if (!ativo || !videoRef.current) return;
          try {
            const encontrados = await detector.detect(videoRef.current);
            const codigo = encontrados?.[0]?.rawValue?.trim();
            if (codigo && codigo !== ultimoCodigoRef.current) {
              ultimoCodigoRef.current = codigo;
              onDetected(codigo);
              fechar();
              return;
            }
          } catch {
            setErro('Não foi possível ler o código. Mantenha o produto centralizado e tente novamente.');
          }
          animationRef.current = requestAnimationFrame(detectar);
        };
        detectar();
      } catch {
        setErro('Permissão de câmera negada ou câmera indisponível. Digite o código manualmente.');
      }
    };

    iniciar();
    return () => {
      ativo = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      streamRef.current?.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    };
  }, [aberto, onDetected]);

  const fechar = () => {
    setAberto(false);
    setErro('');
  };

  return (
    <div>
      <button type="button" onClick={() => { setErro(''); setAberto(true); }} style={{ padding: '8px 10px', border: '1px solid #94a3b8', borderRadius: '6px', background: 'white', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
        <Camera size={15} /> Ler câmera
      </button>
      {aberto && (
        <div style={{ marginTop: '8px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#f8fafc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <strong style={{ fontSize: '12px' }}>Aponte para o código de barras</strong>
            <button type="button" onClick={fechar} style={{ border: 0, background: 'transparent', cursor: 'pointer' }}><X size={16} /></button>
          </div>
          <video ref={videoRef} muted playsInline style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '6px', background: '#111827' }} />
          {erro && <p style={{ color: '#b91c1c', fontSize: '12px', margin: '6px 0 0' }}>{erro}</p>}
        </div>
      )}
    </div>
  );
}
