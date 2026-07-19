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

  // Form state
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
      
      // Reset form
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
      <div className="min-h-screen bg-slate-100">
        <MobileMenuButton onClick={() => setSidebarOpen(true)} />
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)} />

        <main className="lg:ml-64 p-4 lg:p-8 pt-16 lg:pt-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 flex items-center gap-3">
                <School className="w-8 h-8 text-blue-600" />
                Gestão de Escolas
              </h1>
              <p className="text-gray-600 mt-1">Cadastre e gerencie as unidades escolares</p>
            </div>

            <button
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nova Escola
            </button>
          </div>

          {/* Messages */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
              <Save className="w-5 h-5" />
              {success}
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              ✗ {error}
            </div>
          )}

          {/* New School Form */}
          {showForm && (
            <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Nova Escola</h2>
                <button onClick={() => setShowForm(false)}>
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Escola *</label>
                    <input
                      type="text"
                      value={form.nome}
                      onChange={(e) => setForm(prev => ({...prev, nome: e.target.value}))}
                      required
                      placeholder="Ex: CEI LUIZ FELIPE"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                    <input
                      type="text"
                      value={form.endereco}
                      onChange={(e) => setForm(prev => ({...prev, endereco: e.target.value}))}
                      placeholder="Rua, número, bairro..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                    <input
                      type="text"
                      value={form.telefone}
                      onChange={(e) => setForm(prev => ({...prev, telefone: e.target.value}))}
                      placeholder="(XX) XXXX-XXXX"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    Cancelar
                  </button>
                  <button type="submit"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Save className="w-4 h-4" /> Cadastrar Escola
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm text-center">
              <p className="text-2xl font-bold text-blue-600">{escolas.length}</p>
              <p className="text-sm text-gray-500">Total de Unidades</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm text-center">
              <p className="text-2xl font-bold text-green-600">{escolas.filter(e => e.ativa).length}</p>
              <p className="text-sm text-gray-500">Ativas</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm text-center">
              <p className="text-2xl font-bold text-orange-600">{escolas.filter(e => !e.ativa).length}</p>
              <p className="text-sm text-gray-500">Inativas</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm text-center">
              <p className="text-2xl font-bold text-purple-600">{escolas.filter(e => e.nome.startsWith("CEI")).length}</p>
              <p className="text-sm text-gray-500">CEIs</p>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar escola por nome ou endereço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Schools Grid */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredEscolas.length === 0 ? (
            <div className="bg-white rounded-xl p-12 shadow-sm text-center">
              <School className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Nenhuma escola encontrada</h3>
              <p className="text-gray-500">{searchTerm ? "Tente ajustar a busca" : "As escolas serão exibidas aqui"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEscolas.map(escola => (
                <div key={escola.id} className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow border-l-4 border-blue-500">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                        <School className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-800 truncate">{escola.nome}</h3>
                        {escola.endereco && (
                          <p className="text-sm text-gray-500 truncate mt-1">{escola.endereco}</p>
                        )}
                        {escola.telefone && (
                          <p className="text-sm text-gray-400 mt-0.5">{escola.telefone}</p>
                        )}
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      escola.ativa ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${escola.ativa ? "bg-green-500" : "bg-gray-400"}`}></span>
                      {escola.ativa ? "Ativa" : "Inativa"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredEscolas.length > 0 && (
            <p className="mt-4 text-sm text-gray-500 text-center">
              Exibindo {filteredEscolas.length} unidade(s)
            </p>
          )}
        </main>
      </div>
    </AuthCheck>
  );
}
