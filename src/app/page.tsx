"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import AuthCheck from "@/components/AuthCheck";
import Sidebar, { MobileMenuButton } from "@/components/Sidebar";
import { DynamicBarChart, DynamicPieChart, DynamicHorizontalBarChart } from "@/components/Charts";
import { authFetch } from "@/lib/api";
import {
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle,
  Timer,
  Building2,
  TrendingUp,
  Activity,
} from "lucide-react";

interface DashboardStats {
  chamadosHoje: number;
  emAtendimento: number;
  pendentes: number;
  finalizados: number;
  emergenciais: number;
  aguardandoFechamento: number;
  tempoMedioHoras: number;
  escolaMaisOcorrencias: string;
  totalChamados: number;
}

interface ChartData {
  meses: string[];
  chamadosPorMes: number[];
  categorias: { name: string; value: number; color: string }[];
  status: { name: string; value: number }[];
  porEscola: { name: string; value: number }[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await authFetch("/api/dashboard").then(r => r.json());
        if (!cancelled) { setStats(data.stats); setChartData(data.chartData); }
      } catch (error) { console.error("Error fetching dashboard:", error); }
      finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const statCards = stats ? [
    { title: "Chamados Hoje", value: stats.chamadosHoje, icon: FileText, gradient: "stat-gradient-1" },
    { title: "Em Atendimento", value: stats.emAtendimento, icon: Clock, gradient: "stat-gradient-2" },
    { title: "Pendentes", value: stats.pendentes, icon: AlertTriangle, gradient: "stat-gradient-3" },
    { title: "Finalizados", value: stats.finalizados, icon: CheckCircle, gradient: "stat-gradient-4" },
    { title: "Emergenciais", value: stats.emergenciais, icon: AlertTriangle, gradient: "stat-gradient-5" },
    { title: "Aguardando Fechamento", value: stats.aguardandoFechamento, icon: Timer, gradient: "stat-gradient-6" },
    { title: "Tempo Médio (h)", value: stats.tempoMedioHoras?.toFixed(1) || "0.0", icon: TrendingUp, gradient: "stat-gradient-7" },
    { title: "Escola + Ocorrências", value: stats.escolaMaisOcorrencias || "-", icon: Building2, gradient: "stat-gradient-8" },
  ] : [];

  if (loading) {
    return (
      <AuthCheck>
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-blue-600"></div>
            <p className="text-sm text-slate-500">Carregando dashboard...</p>
          </div>
        </div>
      </AuthCheck>
    );
  }

  return (
    <AuthCheck>
      <div className="min-h-screen bg-[#f0f2f5]">
        <MobileMenuButton onClick={() => setSidebarOpen(true)} />
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)} />

        <main className="lg:ml-[260px] p-4 lg:p-6 xl:p-8 pt-16 lg:pt-6 animate-fade-in">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Activity className="w-3.5 h-3.5" />
              <span>Visão Geral</span>
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
            <p className="text-slate-500 text-sm mt-0.5">Acompanhe as ocorrências escolares em tempo real</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
            {statCards.map((card, index) => (
              <div key={index} className="bg-white rounded-2xl p-4 border border-slate-100 card-hover group">
                <div className="flex items-start justify-between mb-3">
                  <div className={`${card.gradient} w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-slate-200/50 group-hover:scale-105 transition-transform`}>
                    <card.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{card.value}</p>
                <p className="text-[12px] text-slate-500 mt-1.5 font-medium">{card.title}</p>
              </div>
            ))}
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">Chamados por Mês</h2>
              {chartData && chartData.chamadosPorMes.length > 0 ? (
                <DynamicBarChart data={chartData.meses.map((mes, i) => ({ mes, quantidade: chartData.chamadosPorMes[i] }))} />
              ) : (
                <div className="flex items-center justify-center h-[280px] text-slate-400 text-sm">Sem dados disponíveis</div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">Ocorrências por Categoria</h2>
              {chartData && chartData.categorias.length > 0 ? (
                <DynamicPieChart data={chartData.categorias} />
              ) : (
                <div className="flex items-center justify-center h-[280px] text-slate-400 text-sm">Sem dados disponíveis</div>
              )}
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">Top Escolas por Ocorrências</h2>
              {chartData && chartData.porEscola.length > 0 ? (
                <DynamicHorizontalBarChart data={chartData.porEscola} />
              ) : (
                <div className="flex items-center justify-center h-[300px] text-slate-400 text-sm">Sem dados disponíveis</div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">Distribuição por Status</h2>
              {chartData && chartData.status.length > 0 ? (
                <div className="space-y-3">
                  {chartData.status.map((item, index) => {
                    const total = chartData.status.reduce((sum, s) => sum + s.value, 0);
                    const percentage = total > 0 ? (item.value / total) * 100 : 0;
                    return (
                      <div key={index}>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[13px] text-slate-600 font-medium">{item.name}</span>
                          <span className="text-[13px] font-bold text-slate-900">{item.value}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-700 ease-out" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-slate-400 text-sm">Sem dados disponíveis</div>
              )}
            </div>
          </div>
        </main>
      </div>
    </AuthCheck>
  );
}
