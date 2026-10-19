import { useEffect, useId, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

export default function LeitorCodigoBarras({ onDetected }) {
  const scannerRef = useRef(null);
  const containerId = `leitor-codigo-${useId().replace(/:/g, '')}`;
  const ultimoCodigoRef = useRef('');
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!aberto) return undefined;

    let ativo = true;
    const iniciar = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setErro('A câmera não está disponível. Digite o código manualmente.');
        return;
      }
      try {
        const scanner = new Html5Qrcode(containerId);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 280, height: 120 }, aspectRatio: 1.777778 },
          (codigo) => {
            const codigoNormalizado = codigo?.trim();
            if (!ativo || !codigoNormalizado || codigoNormalizado === ultimoCodigoRef.current) return;
            ultimoCodigoRef.current = codigoNormalizado;
            onDetected(codigoNormalizado);
            fechar();
          },
          () => {}
        );
      } catch {
        setErro('Não foi possível iniciar a câmera ou ler o código. Verifique a permissão e tente novamente ou digite o código manualmente.');
      }
    };

    iniciar();
    return () => {
      ativo = false;
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner) {
        scanner.stop()
          .catch(() => {})
          .finally(() => scanner.clear().catch(() => {}));
      }
    };
  }, [aberto, containerId, onDetected]);

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
          <div id={containerId} style={{ width: '100%', overflow: 'hidden', borderRadius: '6px', background: '#111827' }} />
          {erro && <p style={{ color: '#b91c1c', fontSize: '12px', margin: '6px 0 0' }}>{erro}</p>}
        </div>
      )}
    </div>
  );
}
