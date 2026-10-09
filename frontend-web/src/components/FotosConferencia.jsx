import { useEffect, useState } from 'react';
import { Image, Upload } from 'lucide-react';
import api from '../services/api';

export default function FotosConferencia({ pedidoId, itemPedidoId, ocorrencia, fotos = [], somenteLeitura = false, onUploaded }) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [urls, setUrls] = useState({});

  useEffect(() => {
    let ativo = true;
    const carregar = async () => {
      const selecionadas = fotos.filter(foto => (foto.itemPedidoId || null) === (itemPedidoId || null));
      const entradas = await Promise.all(selecionadas.map(async foto => {
        try {
          const resposta = await api.get(`/api/pedidos/${pedidoId}/conferencia/fotos/${foto.id}/arquivo`, { responseType: 'blob' });
          return [foto.id, URL.createObjectURL(resposta.data)];
        } catch {
          return [foto.id, null];
        }
      }));
      if (ativo) setUrls(Object.fromEntries(entradas));
    };
    if (fotos.length > 0) carregar();
    return () => {
      ativo = false;
      Object.values(urls).forEach(url => url && URL.revokeObjectURL(url));
    };
  }, [fotos, pedidoId, itemPedidoId]);

  const enviar = async (event) => {
    const arquivos = Array.from(event.target.files || []);
    event.target.value = '';
    if (arquivos.length === 0) return;
    setEnviando(true);
    setErro('');
    try {
      for (const arquivo of arquivos) {
        if (arquivo.size > 10 * 1024 * 1024) throw new Error('Cada imagem deve ter no máximo 10 MB.');
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(arquivo.type)) {
          throw new Error('Formato não permitido. Use JPEG, PNG ou WebP.');
        }
        const form = new FormData();
        form.append('arquivo', arquivo);
        if (itemPedidoId) form.append('itemPedidoId', itemPedidoId);
        if (ocorrencia) form.append('ocorrencia', ocorrencia);
        const resposta = await api.post(`/api/pedidos/${pedidoId}/conferencia/fotos`, form);
        onUploaded?.(resposta.data);
      }
    } catch (error) {
      setErro(error.message || 'Não foi possível enviar a imagem.');
    } finally {
      setEnviando(false);
    }
  };

  const fotosDoItem = fotos.filter(foto => (foto.itemPedidoId || null) === (itemPedidoId || null));
  return (
    <div style={{ marginTop: '8px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#f8fafc' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <strong style={{ fontSize: '12px', color: '#475569' }}><Image size={14} style={{ verticalAlign: 'middle' }} /> Fotos da ocorrência</strong>
        {!somenteLeitura && (
          <label style={{ padding: '6px 9px', borderRadius: '6px', background: '#2563eb', color: 'white', fontSize: '12px', cursor: enviando ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Upload size={13} /> {enviando ? 'Enviando...' : 'Fotografar / escolher'}
            <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" multiple onChange={enviar} disabled={enviando} style={{ display: 'none' }} />
          </label>
        )}
      </div>
      {erro && <div style={{ color: '#b91c1c', fontSize: '12px', marginTop: '5px' }}>{erro}</div>}
      {fotosDoItem.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
          {fotosDoItem.map(foto => (
            <div key={foto.id} style={{ width: '72px' }}>
              {urls[foto.id] ? <img src={urls[foto.id]} alt={foto.nomeOriginal} style={{ width: '72px', height: '60px', objectFit: 'cover', borderRadius: '5px' }} /> : <div style={{ width: '72px', height: '60px', background: '#e2e8f0', borderRadius: '5px' }} />}
              <div style={{ fontSize: '10px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{foto.nomeOriginal}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
