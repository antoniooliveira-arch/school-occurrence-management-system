"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import AuthCheck from "@/components/AuthCheck";
import Sidebar, { MobileMenuButton } from "@/components/Sidebar";
import { authFetch } from "@/lib/api";
import {
  School,
  Plus,
  Search,
  Save,
  X,
} from "lucide-react";

interface Escola {
  id: number;
  nome: string;
  endereco?: string | null;
  telefone?: string | null;
  ativa: boolean;
  createdAt: string;
}

export default function AdminEscolasPage() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    nome: "",
    endereco: "",
    telefone: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchEscolas = useCallback(async () => {
    try {
      const response = await authFetch("/api/escolas");
      if (response.ok) {
        const data = await response.json();
        setEscolas(data.escolas || []);
      }
    } catch (err) {
      console.error("Error fetching schools:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await authFetch("/api/escolas");
        if (!cancelled && response.ok) {
          const data = await response.json();
          setEscolas(data.escolas || []);
        }
      } catch (err) {
        console.error("Error fetching schools:", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      if (!form.nome) {
        setError("O nome da escola é obrigatório");
        return;
      }

      const response = await authFetch("/api/escolas", {
        method: "POST",
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar escola");
      }

      setSuccess(`Escola ${data.escola.nome} cadastrada com sucesso!`);
      
      setForm({ nome: "", endereco: "", telefone: "" });
      setShowForm(false);
      
      fetchEscolas();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Erro ao criar escola");
    }
  };

  const filteredEscolas = escolas.filter(
    e =>
      e.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.endereco && e.endereco.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
                <School className="w-3.5 h-3.5" />
                <span>Administração</span>
              </div>
              <h1 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">Gestão de Escolas</h1>
              <p className="text-slate-500 text-sm mt-1">Cadastre e gerencie as unidades escolares</p>
            </div>

            <button
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nova Escola
            </button>
          </div>

          {/* Messages */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-center gap-2">
              <Save className="w-4 h-4" />
              {success}
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* New School Form */}
          {showForm && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6 card-hover">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Nova Escola</h2>
                <button onClick={() => setShowForm(false)} className="p-1 hover:bg-slate-50 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome da Escola *</label>
                    <input
                      type="text"
                      value={form.nome}
                      onChange={(e) => setForm(prev => ({...prev, nome: e.target.value}))}
                      required
                      placeholder="Ex: CEI LUIZ FELIPE"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Endereço</label>
                    <input
                      type="text"
                      value={form.endereco}
                      onChange={(e) => setForm(prev => ({...prev, endereco: e.target.value}))}
                      placeholder="Rua, número, bairro..."
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Telefone</label>
                    <input
                      type="text"
                      value={form.telefone}
                      onChange={(e) => setForm(prev => ({...prev, telefone: e.target.value}))}
                      placeholder="(XX) XXXX-XXXX"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors">
                    Cancelar
                  </button>
                  <button type="submit"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium shadow-sm transition-colors">
                    <Save className="w-4 h-4" /> Cadastrar Escola
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-slate-100 p-4 text-center card-hover">
              <p className="text-2xl font-bold text-blue-600">{escolas.length}</p>
              <p className="text-sm text-slate-500">Total de Unidades</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4 text-center card-hover">
              <p className="text-2xl font-bold text-green-600">{escolas.filter(e => e.ativa).length}</p>
              <p className="text-sm text-slate-500">Ativas</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4 text-center card-hover">
              <p className="text-2xl font-bold text-orange-600">{escolas.filter(e => !e.ativa).length}</p>
              <p className="text-sm text-slate-500">Inativas</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4 text-center card-hover">
              <p className="text-2xl font-bold text-purple-600">{escolas.filter(e => e.nome.startsWith("CEI")).length}</p>
              <p className="text-sm text-slate-500">CEIs</p>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-6 card-hover">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar escola por nome ou endereço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Schools Grid */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredEscolas.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center card-hover">
              <School className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">Nenhuma escola encontrada</h3>
              <p className="text-slate-500 text-sm">{searchTerm ? "Tente ajustar a busca" : "As escolas serão exibidas aqui"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEscolas.map(escola => (
                <div key={escola.id} className="bg-white rounded-2xl border border-slate-100 p-5 card-hover">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-blue-50 rounded-xl flex-shrink-0">
                        <School className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-800 text-[13px] truncate">{escola.nome}</h3>
                        {escola.endereco && (
                          <p className="text-[12px] text-slate-500 truncate mt-1">{escola.endereco}</p>
                        )}
                        {escola.telefone && (
                          <p className="text-[12px] text-slate-400 mt-0.5">{escola.telefone}</p>
                        )}
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      escola.ativa ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${escola.ativa ? "bg-green-500" : "bg-slate-400"}`}></span>
                      {escola.ativa ? "Ativa" : "Inativa"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredEscolas.length > 0 && (
            <p className="mt-4 text-[13px] text-slate-400 text-center">
              Exibindo {filteredEscolas.length} unidade(s)
            </p>
          )}
        </main>
      </div>
    </AuthCheck>
  );
}
