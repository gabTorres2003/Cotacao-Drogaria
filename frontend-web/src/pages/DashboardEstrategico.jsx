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
          <Loader2 size={40} className="animate-spin" color="var(--info)" />
        </main>
      </div>
    );
  }

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <header style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '24px', color: 'var(--text)', marginBottom: '5px' }}>Relatórios Estratégicos</h1>
          <p style={{ color: 'var(--text-muted)' }}>Análise de dados reais extraídos em tempo real do banco de dados.</p>
        </header>

        {/* Linha 1: Métricas Principais */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <MetricaCard
            titulo="Saving (Economia Real)"
            valor={`R$ ${resumo?.totalSaving?.toFixed(2) || '0.00'}`}
            subtexto={`${resumo?.savingPercentual?.toFixed(1) || '0'}% vs Última Compra`}
            icone={<TrendingUp size={24} color="var(--success)" />}
            corFundo="var(--success-soft)"
          />
          <MetricaCard
            titulo="Pedidos Pendentes"
            valor={resumo?.pedidosPendentes || 0}
            subtexto="Aguardando faturamento/entrega"
            icone={<Clock size={24} color="var(--warning)" />}
            corFundo="var(--warning-soft)"
          />
          <MetricaCard
            titulo="Entregas com Falta"
            valor={resumo?.entregasComFalta || 0}
            subtexto="Pedidos recebidos com divergência"
            icone={<AlertTriangle size={24} color="var(--danger)" />}
            corFundo="var(--danger-soft)"
          />
          <MetricaCard
            titulo="Devoluções (Valores Retidos)"
            valor={`R$ ${resumo?.totalDevolucoesPendentes?.toFixed(2) || '0.00'}`}
            subtexto="Aguardando crédito/boleto"
            icone={<RotateCcw size={24} color="var(--purple)" />}
            corFundo="var(--purple-soft)"
          />
        </div>

        {/* Linha 2: Tabelas e Rankings */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '30px' }}>
           <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
             <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: 'var(--text)' }}>Ranking de Competitividade</h3>
             <RankingFornecedores dados={ranking} />
           </div>
           
           <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--danger-border)', boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.1)' }}>
             <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', color: 'var(--danger-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <AlertTriangle size={18}/> Alerta de Ruptura (Faltas e Avarias)
             </h3>
             <p style={{ color: 'var(--danger)', fontSize: '13px', marginBottom: '20px' }}>Estes produtos constaram como "Em Falta" ou "Avariados" nas últimas entregas.</p>
             <TabelaRuptura dados={rupturas} />
           </div>
        </div>

      </main>
    </div>
  );
}