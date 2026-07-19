"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AuthCheck from "@/components/AuthCheck";
import Sidebar, { MobileMenuButton } from "@/components/Sidebar";
import {
  getPrioridadeConfig,
  getStatusConfig,
  getCategoriaLabel,
  CATEGORIAS,
  PRIORIDADES,
} from "@/lib/constants";
import { authFetch, getToken } from "@/lib/api";
import {
  ArrowLeft,
  Clock,
  MapPin,
  User,
  Camera,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  XCircle,
  Send,
  FileText,
  Wrench,
  Download,
} from "lucide-react";

interface ChamadoDetail {
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
  taticoId?: number | null;
  taticoNome?: string | null;
  dataAbertura: string;
  dataRecebimento?: string | null;
  dataDeslocamento?: string | null;
  dataInicioAtendimento?: string | null;
  dataResolucao?: string | null;
  dataFechamento?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  observacoes?: string | null;
}

interface Anexo {
  id: number;
  arquivoNome: string;
  arquivoUrl: string;
  tipo?: string | null;
}

interface AtendimentoRecord {
  id?: number;
  dataChegada: string;
  horaChegada?: string | null;
  dataSaida?: string | null;
  horaSaida?: string | null;
  solucaoAplicada?: string | null;
  equipamentosUtilizados?: string | null;
  descricaoAtendimento?: string | null;
}

export default function ChamadoDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chamado, setChamado] = useState<ChamadoDetail | null>(null);
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [atendimento, setAtendimento] = useState<AtendimentoRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showSolucaoForm, setShowSolucaoForm] = useState(false);

  // Form fields for solution
  const [solucaoForm, setSolucaoForm] = useState({
    solucaoAplicada: "",
    equipamentosUtilizados: "",
    descricaoAtendimento: "",
    dataChegada: new Date().toISOString().slice(0, 10),
    horaChegada: new Date().toTimeString().slice(0, 5),
    dataSaida: new Date().toISOString().slice(0, 10),
    horaSaida: new Date().toTimeString().slice(0, 5),
  });

  const fetchChamado = useCallback(async () => {
    try {
      const response = await authFetch(`/api/chamados/${params.id}`);

      if (response.ok) {
        const data = await response.json();
        setChamado(data.chamado);
        setAnexos(data.anexos || []);
        setAtendimento(data.atendimento || null);
      } else if (response.status === 404) {
        setError("Chamado não encontrado");
      }
    } catch (err) {
      console.error("Error fetching chamado:", err);
      setError("Erro ao carregar o chamado");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await authFetch(`/api/chamados/${params.id}`);
        if (!cancelled) {
          if (response.ok) {
            const data = await response.json();
            setChamado(data.chamado);
            setAnexos(data.anexos || []);
            setAtendimento(data.atendimento || null);
          } else if (response.status === 404) {
            setError("Chamado não encontrado");
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Error fetching chamado:", err);
          setError("Erro ao carregar o chamado");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [params.id]);

  const formatDate = (dateStr: string | undefined | null) => {
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

  const handleAction = async (action: string) => {
    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      let body: Record<string, any> = { action };

      // Add solution form data for completion
      if (action === "concluir") {
        body = {
          ...body,
          atendimento: {
            ...solucaoForm,
            dataChegada: solucaoForm.dataChegada 
              ? `${solucaoForm.dataChegada}T${solucaoForm.horaChegada || "00:00"}`
              : new Date(),
            dataSaida: solucaoForm.dataSaida
              ? `${solucaoForm.dataSaida}T${solucaoForm.horaSaida || "00:00"}`
              : new Date(),
          },
        };
      }

      const response = await authFetch(`/api/chamados/${params.id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao executar ação");
      }

      setSuccess(data.message || "Ação realizada com sucesso!");
      
      setTimeout(() => {
        setSuccess("");
        setShowSolucaoForm(false);
        fetchChamado(); // Refresh data
      }, 2000);

    } catch (err: any) {
      setError(err.message || "Erro ao executar ação");
    } finally {
      setActionLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const token = getToken();
      if (!token) return;

      const formData = new FormData();
      formData.append("chamadoId", params.id as string);
      formData.append("arquivo", file);
      formData.append("tipo", "outro");

      const response = await fetch("/api/anexos", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        fetchChamado(); // Refresh to show the new attachment
      }
    } catch (err) {
      console.error("Upload error:", err);
    }

    e.target.value = "";
  };

  if (loading) {
    return (
      <AuthCheck>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AuthCheck>
    );
  }

  if (!chamado && error) {
    return (
      <AuthCheck>
        <div className="min-h-screen bg-slate-100">
          <MobileMenuButton onClick={() => setSidebarOpen(true)} />
          <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)} />
          <main className="lg:ml-64 p-8">
            <div className="text-center py-12">
              <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">{error}</h2>
              <Link href="/chamados" className="text-blue-600 hover:underline">
                Voltar para a lista
              </Link>
            </div>
          </main>
        </div>
      </AuthCheck>
    );
  }

  if (!chamado) return null;

  const prioridadeConfig = getPrioridadeConfig(chamado.prioridade);
  const statusConfig = getStatusConfig(chamado.status);

  const canAccept = user?.perfil === "tatico" && chamado.status === "novo";
  const canStartAttendance = user?.perfil === "tatico" && chamado.status === "em_deslocamento";
  const canComplete = user?.perfil === "tatico" && ["em_atendimento", "em_deslocamento"].includes(chamado.status);
  const canClose = user?.perfil === "administrador" && ["aguardando_fechamento", "resolvido", "em_atendimento"].includes(chamado.status);
  const canReopen = user?.perfil === "administrador" && chamado.status === "finalizado";

  return (
    <AuthCheck>
      <div className="min-h-screen bg-slate-100">
        <MobileMenuButton onClick={() => setSidebarOpen(true)} />
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)} />

        <main className="lg:ml-64 p-4 lg:p-8 pt-16 lg:pt-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-800">Chamado #{chamado.numero}</h1>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                    {statusConfig.label}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-white ${prioridadeConfig.color}`}>
                    {prioridadeConfig.label}
                  </span>
                </div>
                <p className="text-gray-600 mt-1">{chamado.escolaNome}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              {canAccept && (
                <button
                  onClick={() => handleAction("aceitar")}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  Aceitar Atendimento
                </button>
              )}

              {canStartAttendance && (
                <button
                  onClick={() => handleAction("iniciar_atendimento")}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  <Wrench className="w-4 h-4" />
                  Iniciar Atendimento
                </button>
              )}

              {canComplete && (
                <button
                  onClick={() => setShowSolucaoForm(!showSolucaoForm)}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  Concluir Atendimento
                </button>
              )}

              {canClose && (
                <button
                  onClick={() => handleAction("fechar")}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  Fechar Definitivamente
                </button>
              )}

              {canReopen && (
                <button
                  onClick={() => handleAction("reabrir")}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reabrir Chamado
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              ✓ {success}
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              ✗ {error}
            </div>
          )}

          {/* Solution Form */}
          {showSolucaoForm && (
            <div className="bg-white rounded-xl p-6 shadow-sm mb-6 border-l-4 border-green-500">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Registrar Solução</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data/Hora Chegada</label>
                  <input
                    type="date"
                    value={solucaoForm.dataChegada}
                    onChange={(e) => setSolucaoForm(prev => ({...prev, dataChegada: e.target.value}))}
                    className="w-full px-3 py-2 border rounded-lg mb-2"
                  />
                  <input
                    type="time"
                    value={solucaoForm.horaChegada}
                    onChange={(e) => setSolucaoForm(prev => ({...prev, horaChegada: e.target.value}))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data/Hora Saída</label>
                  <input
                    type="date"
                    value={solucaoForm.dataSaida}
                    onChange={(e) => setSolucaoForm(prev => ({...prev, dataSaida: e.target.value}))}
                    className="w-full px-3 py-2 border rounded-lg mb-2"
                  />
                  <input
                    type="time"
                    value={solucaoForm.horaSaida}
                    onChange={(e) => setSolucaoForm(prev => ({...prev, horaSaida: e.target.value}))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Solução Aplicada *</label>
                  <textarea
                    value={solucaoForm.solucaoAplicada}
                    onChange={(e) => setSolucaoForm(prev => ({...prev, solucaoAplicada: e.target.value}))}
                    rows={3}
                    placeholder="Descreva a solução aplicada..."
                    className="w-full px-3 py-2 border rounded-lg resize-y"
                    required
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Equipamentos Utilizados</label>
                  <textarea
                    value={solucaoForm.equipamentosUtilizados}
                    onChange={(e) => setSolucaoForm(prev => ({...prev, equipamentosUtilizados: e.target.value}))}
                    rows={2}
                    placeholder="Ferramentas, materiais utilizados..."
                    className="w-full px-3 py-2 border rounded-lg resize-y"
                  ></textarea>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => setShowSolucaoForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleAction("concluir")}
                  disabled={!solucaoForm.solucaoAplicada || actionLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Confirmar Conclusão
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info - Left side */}
            <div className="lg:col-span-2 space-y-6">
              {/* Occurrence Details */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Detalhes da Ocorrência
                </h2>

                <dl className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                    <dt className="text-sm font-medium text-gray-500 w-32 flex-shrink-0">Categoria:</dt>
                    <dd className="text-sm text-gray-900 font-medium">{getCategoriaLabel(chamado.categoria)}</dd>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                    <dt className="text-sm font-medium text-gray-500 w-32 flex-shrink-0">Local:</dt>
                    <dd className="text-sm text-gray-900">{chamado.localOcorrencia || "-"}</dd>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                    <dt className="text-sm font-medium text-gray-500 w-32 flex-shrink-0">Descrição:</dt>
                    <dd className="text-sm text-gray-900 whitespace-pre-wrap">{chamado.descricao}</dd>
                  </div>
                </dl>
              </div>

              {/* Attendance/Solution Details */}
              {(atendimento || chamado.dataResolucao) && (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-orange-600" />
                    Detalhes do Atendimento
                  </h2>

                  <dl className="space-y-3">
                    {atendimento && <>
                      <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                        <dt className="text-sm font-medium text-gray-500 w-36 flex-shrink-0">Técnico Tático:</dt>
                        <dd className="text-sm text-gray-900">{chamado.taticoNome || "-"}</dd>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                        <dt className="text-sm font-medium text-gray-500 w-36 flex-shrink-0">Data Chegada:</dt>
                        <dd className="text-sm text-gray-900">{formatDate(atendimento.dataChegada)}</dd>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                        <dt className="text-sm font-medium text-gray-500 w-36 flex-shrink-0">Data Saída:</dt>
                        <dd className="text-sm text-gray-900">{formatDate(atendimento.dataSaida)}</dd>
                      </div>
                      {atendimento.solucaoAplicada && (
                        <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                          <dt className="text-sm font-medium text-gray-500 w-36 flex-shrink-0">Solução Aplicada:</dt>
                          <dd className="text-sm text-gray-900 whitespace-pre-wrap">{atendimento.solucaoAplicada}</dd>
                        </div>
                      )}
                      {atendimento.equipamentosUtilizados && (
                        <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                          <dt className="text-sm font-medium text-gray-500 w-36 flex-shrink-0">Equipamentos:</dt>
                          <dd className="text-sm text-gray-900 whitespace-pre-wrap">{atendimento.equipamentosUtilizados}</dd>
                        </div>
                      )}
                      {atendimento.descricaoAtendimento && (
                        <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                          <dt className="text-sm font-medium text-gray-500 w-36 flex-shrink-0">Observações:</dt>
                          <dd className="text-sm text-gray-900 whitespace-pre-wrap">{atendimento.descricaoAtendimento}</dd>
                        </div>
                      )}
                    </>}
                  </dl>
                </div>
              )}

              {/* Attachments */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-purple-600" />
                  Anexos
                </h2>

                {/* Upload button */}
                {(user?.perfil === "monitoramento" || user?.perfil === "tatico") && chamado.status !== "finalizado" && (
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors mb-4">
                    <Camera className="w-4 h-4" />
                    Anexar Arquivo/Foto
                    <input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                )}

                {/* List of attachments */}
                {anexos.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                    {anexos.map((anexo) => (
                      <div key={anexo.id} className="border rounded-lg p-3 group hover:border-blue-300 transition-colors">
                        {anexo.arquivoUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={anexo.arquivoUrl}
                            alt={anexo.arquivoNome}
                            className="w-full h-24 object-cover rounded-md mb-2"
                          />
                        ) : (
                          <div className="w-full h-24 bg-gray-100 rounded-md mb-2 flex items-center justify-center">
                            <FileText className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        <p className="text-xs text-gray-600 truncate">{anexo.arquivoNome}</p>
                        {anexo.tipo && (
                          <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">
                            {anexo.tipo.replace("_", " ")}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Nenhum anexo disponível.</p>
                )}
              </div>
            </div>

            {/* Right sidebar with info cards */}
            <div className="space-y-6">
              {/* Timeline */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-teal-600" />
                  Timeline do Chamado
                </h2>

                <div className="relative space-y-4 before:absolute before:left-3.5 before:top-6 before:bottom-6 before:w-0.5 before:bg-gray-200">
                  {[
                    { label: "Aberto", time: chamado.dataAbertura, color: "bg-blue-500" },
                    ...(chamado.dataRecebimento ? [{ label: "Recebido", time: chamado.dataRecebimento, color: "bg-cyan-500" }] : []),
                    ...(chamado.dataDeslocamento ? [{ label: "Em Deslocamento", time: chamado.dataDeslocamento, color: "bg-indigo-500" }] : []),
                    ...(chamado.dataInicioAtendimento ? [{ label: "Início Atendimento", time: chamado.dataInicioAtendimento, color: "bg-yellow-500" }] : []),
                    ...(chamado.dataResolucao ? [{ label: "Resolvido", time: chamado.dataResolucao, color: "bg-green-500" }] : []),
                    ...(chamado.dataFechamento ? [{ label: "Fechado", time: chamado.dataFechamento, color: "bg-emerald-500" }] : []),
                  ].map((event, index) => (
                    <div key={index} className="flex gap-4 relative">
                      <div className={`w-7 h-7 rounded-full ${event.color} flex-shrink-0 z-10`}></div>
                      <div>
                        <p className="font-medium text-sm text-gray-800">{event.label}</p>
                        <p className="text-xs text-gray-500">{formatDate(event.time)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* People Involved */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-600" />
                  Envolvidos
                </h2>

                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-600 font-medium">Aberto por (Monitoramento)</p>
                    <p className="text-sm font-medium text-gray-800">{chamado.monitoramentoNome}</p>
                  </div>

                  {chamado.taticoNome && (
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <p className="text-xs text-orange-600 font-medium">Técnico Tático</p>
                      <p className="text-sm font-medium text-gray-800">{chamado.taticoNome}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Location */}
              {(chamado.latitude || chamado.longitude) && (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-red-600" />
                    Localização GPS
                  </h2>
                  
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${chamado.latitude}&mlon=${chamado.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline block"
                  >
                    Ver no mapa →
                  </a>
                  <p className="text-xs text-gray-500 mt-1">
                    Lat: {chamado.latitude}, Lng: {chamado.longitude}
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </AuthCheck>
  );
}
