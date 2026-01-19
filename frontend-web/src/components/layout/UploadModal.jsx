import { useState } from 'react';
import axios from 'axios';
import { X, UploadCloud } from 'lucide-react';

export default function UploadModal({ onClose, onSuccess }) {
  const [arquivo, setArquivo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const handleEnviar = async () => {
    if (!arquivo) {
      setErro("Selecione um arquivo primeiro!");
      return;
    }

    setLoading(true);
    setErro('');

    const formData = new FormData();
    formData.append('file', arquivo);

    try {
      await axios.post('http://localhost:8080/api/cotacao/importar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert("Cotação importada com sucesso!");
      onSuccess(); // Avisa o Dashboard para recarregar a lista
      onClose();   // Fecha o modal
      
    } catch (error) {
      console.error(error);
      setErro("Erro ao importar: " + (error.response?.data || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Nova Cotação</h3>
          <button onClick={onClose} className="btn-icon"><X size={20}/></button>
        </div>

        <div className="modal-body">
          <p>Selecione a planilha do ERP (.xlsx) para iniciar.</p>
          
          <div className="upload-area">
            <UploadCloud size={40} color="#2563eb" />
            <input 
              type="file" 
              accept=".xlsx, .xls"
              onChange={(e) => setArquivo(e.target.files[0])}
              style={{ marginTop: '10px' }}
            />
            {arquivo && <span className="file-name">Arquivo: {arquivo.name}</span>}
          </div>

          {erro && <div className="error-msg">{erro}</div>}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button 
            onClick={handleEnviar} 
            disabled={loading} 
            className="btn-primary"
          >
            {loading ? 'Processando...' : 'Importar Cotação'}
          </button>
        </div>
      </div>
    </div>
  );
}