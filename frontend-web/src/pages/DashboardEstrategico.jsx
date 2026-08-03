import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Sidebar from '../components/layout/Sidebar';
import MetricaCard from '../components/dashboard/MetricaCard';
import TabelaRuptura from '../components/dashboard/TabelaRuptura';
import RankingFornecedores from '../components/dashboard/RankingFornecedores';
import { TrendingUp, AlertTriangle, Clock, RotateCcw, Loader2 } from 'lucide-react';

export default function DashboardEstrategico() {
  const [resumo, setResumo] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [rupturas, setRupturas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [resResumo, resRanking, resRupturas] = await Promise.all([
        api.get('/api/dashboard/resumo'),
        api.get('/api/dashboard/fornecedores/ranking'),
        api.get('/api/dashboard/ruptura/alertas')
      ]);

      setResumo(resResumo.data);
      setRanking(resRanking.data);
      setRupturas(resRupturas.data);
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="layout">
        <Sidebar />
        <main className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Loader2 size={40} className="animate-spin" color="#3b82f6" />
        </main>
      </div>
    );
  }

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <header style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '24px', color: '#1e293b', marginBottom: '5px' }}>Relatórios Estratégicos</h1>
          <p style={{ color: '#64748b' }}>Análise de dados reais extraídos em tempo real do banco de dados.</p>
        </header>

        {/* Linha 1: Métricas Principais */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <MetricaCard
            titulo="Saving (Economia Real)"
            valor={`R$ ${resumo?.totalSaving?.toFixed(2) || '0.00'}`}
            subtexto={`${resumo?.savingPercentual?.toFixed(1) || '0'}% vs Última Compra`}
            icone={<TrendingUp size={24} color="#16a34a" />}
            corFundo="#dcfce7"
          />
          <MetricaCard
            titulo="Pedidos Pendentes"
            valor={resumo?.pedidosPendentes || 0}
            subtexto="Aguardando faturamento/entrega"
            icone={<Clock size={24} color="#d97706" />}
            corFundo="#fef3c7"
          />
          <MetricaCard
            titulo="Entregas com Falta"
            valor={resumo?.entregasComFalta || 0}
            subtexto="Pedidos recebidos com divergência"
            icone={<AlertTriangle size={24} color="#dc2626" />}
            corFundo="#fee2e2"
          />
          <MetricaCard
            titulo="Devoluções (Valores Retidos)"
            valor={`R$ ${resumo?.totalDevolucoesPendentes?.toFixed(2) || '0.00'}`}
            subtexto="Aguardando crédito/boleto"
            icone={<RotateCcw size={24} color="#4f46e5" />}
            corFundo="#e0e7ff"
          />
        </div>

        {/* Linha 2: Tabelas e Rankings */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '30px' }}>
           <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
             <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#1e293b' }}>Ranking de Competitividade</h3>
             <RankingFornecedores dados={ranking} />
           </div>
           
           <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #fca5a5', boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.1)' }}>
             <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <AlertTriangle size={18}/> Alerta de Ruptura (Faltas e Avarias)
             </h3>
             <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '20px' }}>Estes produtos constaram como "Em Falta" ou "Avariados" nas últimas entregas.</p>
             <TabelaRuptura dados={rupturas} />
           </div>
        </div>

      </main>
    </div>
  );
}