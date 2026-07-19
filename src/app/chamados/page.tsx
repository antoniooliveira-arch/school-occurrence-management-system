"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import AuthCheck from "@/components/AuthCheck";
import Sidebar, { MobileMenuButton } from "@/components/Sidebar";
import { CATEGORIAS, PRIORIDADES, STATUS_CHAMADO, getPrioridadeConfig, getStatusConfig, getCategoriaLabel } from "@/lib/constants";
import { authFetch } from "@/lib/api";
import {
  Plus,
  Search,
  Filter,
  Eye,
  ChevronDown,
  Clock,
  MapPin,
  FileText,
} from "lucide-react";

interface Chamado {
  id: number;
  numero: number;
  escolaId: number;
  escolaNome: string;
  categoria: string;
  prioridade: string;
  descricao: string;
  localOcorrencia?: string;
  status: string;
  monitoramentoId: number;
  monitoramentoNome: string;
  taticoId?: number;
  taticoNome?: string | null;
  dataAbertura: string;
  createdAt: string;
}

export default function ChamadosPage() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });

  const [filterStatus, setFilterStatus] = useState("");
  const [filterEscola, setFilterEscola] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("");
  const [filterPrioridade, setFilterPrioridade] = useState("");

  const fetchChamados = useCallback(async (page = 1) => {
    try {
      let url = `/api/chamados?page=${page}&limit=50`;
      if (filterStatus) url += `&status=${filterStatus}`;
      if (filterCategoria) url += `&categoria=${filterCategoria}`;
      if (filterPrioridade) url += `&prioridade=${filterPrioridade}`;
      if (filterEscola) url += `&escolaId=${filterEscola}`;
      if (searchTerm) url += `&busca=${encodeURIComponent(searchTerm)}`;

      const data = await authFetch(url).then(r => r.json());
      setChamados(data.chamados || []);
      setPagination(data.pagination || { page: 1, total: 0, pages: 1 });
    } catch (error) {
      console.error("Error fetching chamados:", error);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterCategoria, filterPrioridade, filterEscola, searchTerm]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true);
      fetchChamados();
    }, 300);
    return () => clearTimeout(timeout);
  }, [fetchChamados]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const clearFilters = () => {
    setFilterStatus("");
    setFilterEscola("");
    setFilterCategoria("");
    setFilterPrioridade("");
    setSearchTerm("");
  };

  const hasActiveFilters = filterStatus || filterEscola || filterCategoria || filterPrioridade || searchTerm;

  return (
    <AuthCheck>
      <div className="min-h-screen bg-[#f0f2f5]">
        <MobileMenuButton onClick={() => setSidebarOpen(true)} />
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)} />

        <main className="lg:ml-[260px] p-4 lg:p-6 xl:p-8 pt-16 lg:pt-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <FileText className="w-3.5 h-3.5" />
                <span>Ocorrências</span>
              </div>
              <h1 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">Chamados</h1>
              <p className="text-slate-500 text-sm mt-1">Gerencie todas as ocorrências</p>
            </div>
            {(user?.perfil === "monitoramento" || user?.perfil === "administrador") && (
              <Link
                href="/chamados/novo"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Novo Chamado
              </Link>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-6 card-hover">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por número, escola ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  showFilters ? "bg-blue-50 border border-blue-300 text-blue-600" : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Filter className="w-4 h-4" />
                Filtros
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
              </button>

              {hasActiveFilters && (
                <button onClick={clearFilters} className="px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl text-sm transition-colors">
                  Limpar Filtros
                </button>
              )}
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-100">
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all">
                  <option value="">Todos os Status</option>
                  {STATUS_CHAMADO.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Filtrar por escola..."
                  value={filterEscola}
                  onChange={(e) => setFilterEscola(e.target.value)}
                  className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />

                <select value={filterCategoria} onChange={(e) => setFilterCategoria(e.target.value)} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all">
                  <option value="">Todas as Categorias</option>
                  {CATEGORIAS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>

                <select value={filterPrioridade} onChange={(e) => setFilterPrioridade(e.target.value)} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all">
                  <option value="">Todas as Prioridades</option>
                  {PRIORIDADES.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : chamados.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center card-hover">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">Nenhum chamado encontrado</h3>
              <p className="text-slate-500 text-sm">
                {hasActiveFilters ? "Tente ajustar os filtros de busca" : "Comece criando um novo chamado"}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden card-hover">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/80 border-b border-slate-100">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Escola</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Categoria</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Prioridade</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden xl:table-cell">Monitoramento</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden xl:table-cell">Data</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {chamados.map((chamado) => {
                      const prioridadeConfig = getPrioridadeConfig(chamado.prioridade);
                      const statusConfig = getStatusConfig(chamado.status);

                      return (
                        <tr key={chamado.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3">
                            <span className="font-mono font-medium text-sm text-blue-600">#{chamado.numero}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-800 text-[13px] max-w-[150px] truncate">{chamado.escolaNome}</div>
                            {chamado.localOcorrencia && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate max-w-[120px]">{chamado.localOcorrencia}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="text-[13px] text-slate-600">{getCategoriaLabel(chamado.categoria)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${prioridadeConfig.color} text-white`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                              {prioridadeConfig.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden xl:table-cell">
                            <span className="text-[13px] text-slate-600">{chamado.monitoramentoNome}</span>
                          </td>
                          <td className="px-4 py-3 hidden xl:table-cell">
                            <div className="flex items-center gap-1 text-[13px] text-slate-500">
                              <Clock className="w-3.5 h-3.5" />
                              {formatDate(chamado.dataAbertura)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              href={`/chamados/${chamado.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              Ver
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
                <p className="text-[13px] text-slate-500">
                  Exibindo <strong className="text-slate-700">{chamados.length}</strong> de <strong className="text-slate-700">{pagination.total}</strong> chamado(s)
                </p>
                {pagination.pages > 1 && (
                  <div className="flex gap-2">
                    <button
                      disabled={pagination.page <= 1}
                      onClick={() => fetchChamados(pagination.page - 1)}
                      className="px-3 py-1 text-sm border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl disabled:opacity-50 transition-colors"
                    >
                      Anterior
                    </button>
                    <span className="px-3 py-1 text-sm text-slate-500">
                      {pagination.page} / {pagination.pages}
                    </span>
                    <button
                      disabled={pagination.page >= pagination.pages}
                      onClick={() => fetchChamados(pagination.page + 1)}
                      className="px-3 py-1 text-sm border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl disabled:opacity-50 transition-colors"
                    >
                      Próxima
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </AuthCheck>
  );
}
