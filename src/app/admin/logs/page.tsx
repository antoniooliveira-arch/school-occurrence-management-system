"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import AuthCheck from "@/components/AuthCheck";
import Sidebar, { MobileMenuButton } from "@/components/Sidebar";
import { authFetch } from "@/lib/api";
import {
  ScrollText,
  RefreshCw,
  Search,
} from "lucide-react";

interface LogEntry {
  id: number;
  usuarioId?: number | null;
  usuarioNome: string;
  acao: string;
  descricao?: string | null;
  entidade?: string | null;
  entidadeId?: number | null;
  ip?: string | null;
  createdAt: string;
}

export default function AdminLogsPage() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchLogs = useCallback(async () => {
    try {
      const response = await authFetch("/api/logs");
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await authFetch("/api/logs");
        if (!cancelled && response.ok) {
          const data = await response.json();
          setLogs(data.logs || []);
        }
      } catch (err) {
        console.error("Error fetching logs:", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const getActionColor = (acao: string): string => {
    if (acao.includes("LOGIN") || acao.includes("LOGOUT")) return "text-blue-600 bg-blue-50";
    if (acao.includes("CREATE")) return "text-green-600 bg-green-50";
    if (acao.includes("UPDATE") || acao.includes("EDIT")) return "text-orange-600 bg-orange-50";
    if (acao.includes("DELETE")) return "text-red-600 bg-red-50";
    if (acao.includes("FECHAR")) return "text-emerald-600 bg-emerald-50";
    if (acao.includes("REABRIR")) return "text-purple-600 bg-purple-50";
    if (acao.includes("UPLOAD")) return "text-cyan-600 bg-cyan-50";
    return "text-slate-600 bg-slate-50";
  };

  const getEntityIcon = (entidade?: string | null): string => {
    switch (entidade) {
      case "chamado": return "📋";
      case "usuario": return "👤";
      case "escola": return "🏫";
      case "anexo": return "📎";
      default: return "📝";
    }
  };

  const filteredLogs = logs.filter(
    l =>
      l.acao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.usuarioNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.descricao && l.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("pt-BR");
  };

  return (
    <AuthCheck requiredProfile="administrador">
      <div className="min-h-screen bg-[#f0f2f5]">
        <MobileMenuButton onClick={() => setSidebarOpen(true)} />
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)} />

        <main className="lg:ml-[260px] p-4 lg:p-6 xl:p-8 pt-16 lg:pt-6 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <ScrollText className="w-3.5 h-3.5" />
                <span>Administração</span>
              </div>
              <h1 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">Logs do Sistema</h1>
              <p className="text-slate-500 text-sm mt-1">Histórico de ações e eventos do sistema</p>
            </div>

            <button
              onClick={fetchLogs}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </button>
          </div>

          {/* Search */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-6 card-hover">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar logs por ação, usuário ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Logs List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center card-hover">
              <ScrollText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">Nenhum registro encontrado</h3>
              <p className="text-slate-500 text-sm">{searchTerm ? "Tente ajustar os filtros" : "Os logs serão exibidos aqui"}</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden card-hover">
              <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/80 border-b border-slate-100 sticky top-0">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Data/Hora</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Usuário</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ação</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Descrição</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Entidade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-[13px] text-slate-500">{formatDate(log.createdAt)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-800 text-[13px]">{log.usuarioNome}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-mono font-medium ${getActionColor(log.acao)}`}>
                            {log.acao}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-[13px] text-slate-500 line-clamp-2">{log.descricao || "-"}</span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="inline-flex items-center gap-1.5 text-[13px]">
                            <span>{getEntityIcon(log.entidade)}</span>
                            <span className="capitalize text-slate-500">{log.entidade || "-"}</span>
                            {log.entidadeId && (
                              <span className="text-slate-400">#{log.entidadeId}</span>
                            )}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100">
                <p className="text-[13px] text-slate-500">Exibindo {filteredLogs.length} registro(s)</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </AuthCheck>
  );
}
