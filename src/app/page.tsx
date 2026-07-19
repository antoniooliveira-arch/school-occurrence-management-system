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
        if (!cancelled) {
          setStats(data.stats);
          setChartData(data.chartData);
        }
      } catch (error) {
        console.error("Error fetching dashboard:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const statCards = stats ? [
    { title: "Chamados Hoje", value: stats.chamadosHoje, icon: FileText, color: "bg-blue-500", lightColor: "bg-blue-50" },
    { title: "Em Atendimento", value: stats.emAtendimento, icon: Clock, color: "bg-yellow-500", lightColor: "bg-yellow-50" },
    { title: "Pendentes", value: stats.pendentes, icon: AlertTriangle, color: "bg-orange-500", lightColor: "bg-orange-50" },
    { title: "Finalizados", value: stats.finalizados, icon: CheckCircle, color: "bg-green-500", lightColor: "bg-green-50" },
    { title: "Emergenciais", value: stats.emergenciais, icon: AlertTriangle, color: "bg-red-600", lightColor: "bg-red-50" },
    { title: "Aguardando Fechamento", value: stats.aguardandoFechamento, icon: Timer, color: "bg-purple-500", lightColor: "bg-purple-50" },
    { title: "Tempo Médio (h)", value: stats.tempoMedioHoras?.toFixed(1) || "0.0", icon: TrendingUp, color: "bg-indigo-500", lightColor: "bg-indigo-50" },
    { title: "Escola + Ocorrências", value: stats.escolaMaisOcorrencias || "-", icon: Building2, color: "bg-teal-500", lightColor: "bg-teal-50" },
  ] : [];

  if (loading) {
    return (
      <AuthCheck>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AuthCheck>
    );
  }

  return (
    <AuthCheck>
      <div className="min-h-screen bg-slate-100">
        <MobileMenuButton onClick={() => setSidebarOpen(true)} />
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)} />

        <main className="lg:ml-64 p-4 lg:p-8 pt-16 lg:pt-8">
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-600 mt-1">Visão geral das ocorrências escolares</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
            {statCards.map((card, index) => (
              <div key={index} className={`${card.lightColor} rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-600">{card.title}</span>
                  <div className={`p-2 ${card.color} rounded-lg`}>
                    <card.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-800 truncate">{card.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Chamados por Mês</h2>
              {chartData && chartData.chamadosPorMes.length > 0 ? (
                <DynamicBarChart data={chartData.meses.map((mes, i) => ({ mes, quantidade: chartData.chamadosPorMes[i] }))} />
              ) : (
                <div className="flex items-center justify-center h-[280px] text-gray-400">Sem dados disponíveis</div>
              )}
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Ocorrências por Categoria</h2>
              {chartData && chartData.categorias.length > 0 ? (
                <DynamicPieChart data={chartData.categorias} />
              ) : (
                <div className="flex items-center justify-center h-[280px] text-gray-400">Sem dados disponíveis</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Top Escolas por Ocorrências</h2>
              {chartData && chartData.porEscola.length > 0 ? (
                <DynamicHorizontalBarChart data={chartData.porEscola} />
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-400">Sem dados disponíveis</div>
              )}
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Distribuição por Status</h2>
              {chartData && chartData.status.length > 0 ? (
                <div className="space-y-3">
                  {chartData.status.map((item, index) => {
                    const total = chartData.status.reduce((sum, s) => sum + s.value, 0);
                    const percentage = total > 0 ? (item.value / total) * 100 : 0;
                    return (
                      <div key={index}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-600">{item.name}</span>
                          <span className="text-sm font-medium text-gray-800">{item.value}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-400">Sem dados disponíveis</div>
              )}
            </div>
          </div>
        </main>
      </div>
    </AuthCheck>
  );
}
