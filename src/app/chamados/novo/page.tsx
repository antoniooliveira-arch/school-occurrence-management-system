"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AuthCheck from "@/components/AuthCheck";
import Sidebar, { MobileMenuButton } from "@/components/Sidebar";
import { CATEGORIAS, PRIORIDADES } from "@/lib/constants";
import { authFetch } from "@/lib/api";
import {
  ArrowLeft,
  Send,
  MapPin,
  Camera,
  Save,
  FileText,
} from "lucide-react";

interface Escola {
  id: number;
  nome: string;
}

export default function NovoChamadoPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    escolaId: "",
    categoria: "",
    prioridade: "media",
    descricao: "",
    localOcorrencia: "",
    latitude: "",
    longitude: "",
  });

  const fetchEscolas = useCallback(async () => {
    try {
      const response = await authFetch("/api/escolas");
      if (response.ok) {
        const data = await response.json();
        setEscolas(data.escolas);
      }
    } catch (err) {
      console.error("Error fetching schools:", err);
    }
  }, []);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
        }));
      },
      () => {},
      { enableHighAccuracy: true }
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await authFetch("/api/escolas");
        if (!cancelled && response.ok) {
          const data = await response.json();
          setEscolas(data.escolas);
        }
      } catch (err) {
        console.error("Error fetching schools:", err);
      }
      if (!cancelled && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setForm((prev) => ({
              ...prev,
              latitude: position.coords.latitude.toString(),
              longitude: position.coords.longitude.toString(),
            }));
          },
          () => {},
          { enableHighAccuracy: true }
        );
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (!form.escolaId || !form.categoria || !form.descricao) {
        setError("Preencha os campos obrigatórios: Escola, Categoria e Descrição");
        setLoading(false);
        return;
      }

      const response = await authFetch("/api/chamados", {
        method: "POST",
        body: JSON.stringify({
          escolaId: parseInt(form.escolaId),
          categoria: form.categoria,
          prioridade: form.prioridade,
          descricao: form.descricao,
          localOcorrencia: form.localOcorrencia || undefined,
          latitude: form.latitude || undefined,
          longitude: form.longitude || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar chamado");
      }

      setSuccess(data.message);
      
      setTimeout(() => {
        router.push(`/chamados/${data.chamado.id}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Erro ao criar chamado");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <AuthCheck>
      <div className="min-h-screen bg-[#f0f2f5]">
        <MobileMenuButton onClick={() => setSidebarOpen(true)} />
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)} />

        <main className="lg:ml-[260px] p-4 lg:p-6 xl:p-8 pt-16 lg:pt-6 animate-fade-in">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white rounded-xl transition-colors border border-slate-200"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <FileText className="w-3.5 h-3.5" />
                <span>Ocorrências</span>
              </div>
              <h1 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">Novo Chamado</h1>
              <p className="text-slate-500 text-sm mt-1">Registre uma nova ocorrência escolar</p>
            </div>
          </div>

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700 text-sm">
              <Save className="w-4 h-4" />
              {success}
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 p-6 card-hover">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Localização da Ocorrência
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="escolaId" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Escola *
                  </label>
                  <select
                    id="escolaId"
                    name="escolaId"
                    value={form.escolaId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="">Selecione uma escola</option>
                    {escolas.map((escola) => (
                      <option key={escola.id} value={escola.id}>
                        {escola.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="localOcorrencia" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Local na Ocorrência
                  </label>
                  <input
                    type="text"
                    id="localOcorrencia"
                    name="localOcorrencia"
                    value={form.localOcorrencia}
                    onChange={handleInputChange}
                    placeholder="Ex: Pátio, Sala de aula, Quadra..."
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              {(form.latitude || form.longitude) && (
                <p className="mt-3 text-sm text-slate-400 flex items-center gap-1">
                  Coordenadas GPS capturadas automaticamente
                </p>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-6 card-hover">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Detalhes da Ocorrência
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="categoria" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Categoria *
                  </label>
                  <select
                    id="categoria"
                    name="categoria"
                    value={form.categoria}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="">Selecione uma categoria</option>
                    {CATEGORIAS.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="prioridade" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Prioridade *
                  </label>
                  <select
                    id="prioridade"
                    name="prioridade"
                    value={form.prioridade}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  >
                    {PRIORIDADES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="descricao" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Descrição Detalhada *
                </label>
                <textarea
                  id="descricao"
                  name="descricao"
                  value={form.descricao}
                  onChange={handleInputChange}
                  rows={5}
                  placeholder="Descreva detalhadamente a ocorrência..."
                  required
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-y"
                ></textarea>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Abrir Chamado
                  </>
                )}
              </button>
            </div>
          </form>
        </main>
      </div>
    </AuthCheck>
  );
}
