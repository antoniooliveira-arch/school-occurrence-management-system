"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import AuthCheck from "@/components/AuthCheck";
import Sidebar, { MobileMenuButton } from "@/components/Sidebar";
import { PERFIS, getPerfilLabel } from "@/lib/constants";
import { authFetch } from "@/lib/api";
import {
  UserPlus,
  Trash2,
  Edit2,
  X,
  Save,
  Users,
  Search,
} from "lucide-react";

interface User {
  id: number;
  nome: string;
  email: string;
  perfil: string;
  ativo: boolean;
  createdAt: string;
}

export default function AdminUsuariosPage() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    perfil: "monitoramento",
    editId: null as number | null,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      const response = await authFetch("/api/users");

      if (response.ok) {
        const data = await response.json();
        setUsuarios(data.users || []);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await authFetch("/api/users");
        if (!cancelled && response.ok) {
          const data = await response.json();
          setUsuarios(data.users || []);
        }
      } catch (err) {
        console.error("Error fetching users:", err);
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
      if (!form.nome || !form.email || !form.senha || !form.perfil) {
        setError("Preencha todos os campos obrigatórios");
        return;
      }

      const response = await authFetch("/api/users", {
        method: "POST",
        body: JSON.stringify({
          nome: form.nome,
          email: form.email,
          senha: form.senha,
          perfil: form.perfil,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar usuário");
      }

      setSuccess(`Usuário ${data.usuario.nome} criado com sucesso!`);
      
      // Reset form
      setForm({ nome: "", email: "", senha: "", perfil: "monitoramento", editId: null });
      setShowForm(false);
      
      fetchUsers();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Erro ao criar usuário");
    }
  };

  const filteredUsers = usuarios.filter(
    (u) =>
      u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.perfil.includes(searchTerm.toLowerCase())
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
                <Users className="w-8 h-8 text-blue-600" />
                Gestão de Usuários
              </h1>
              <p className="text-gray-600 mt-1">Cadastre e gerencie os usuários do sistema</p>
            </div>

            <button
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              Novo Usuário
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

          {/* New User Form */}
          {showForm && (
            <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Novo Usuário</h2>
                <button onClick={() => setShowForm(false)}>
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    value={form.nome}
                    onChange={(e) => setForm(prev => ({...prev, nome: e.target.value}))}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm(prev => ({...prev, email: e.target.value}))}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Senha *</label>
                  <input
                    type="password"
                    value={form.senha}
                    onChange={(e) => setForm(prev => ({...prev, senha: e.target.value}))}
                    required
                    minLength={6}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Perfil *</label>
                  <select
                    value={form.perfil}
                    onChange={(e) => setForm(prev => ({...prev, perfil: e.target.value}))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {PERFIS.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2 flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    Cancelar
                  </button>
                  <button type="submit"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Save className="w-4 h-4" /> Salvar Usuário
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Search */}
          <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Users Table */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="bg-white rounded-xl p-12 shadow-sm text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Nenhum usuário encontrado</h3>
              <p className="text-gray-500">{searchTerm ? "Tente ajustar a busca" : "Comece cadastrando um novo usuário"}</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Nome</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase hidden md:table-cell">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Perfil</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase hidden lg:table-cell">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase hidden xl:table-cell">Data Cadastro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-800">{u.nome}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-gray-600 text-sm">{u.email}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          u.perfil === "administrador" 
                            ? "bg-purple-100 text-purple-800"
                            : u.perfil === "monitoramento"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-orange-100 text-orange-800"
                        }`}>
                          {getPerfilLabel(u.perfil)}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                          u.ativo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${u.ativo ? "bg-green-500" : "bg-red-500"}`}></span>
                          {u.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <span className="text-sm text-gray-500">
                          {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="px-4 py-3 bg-gray-50 border-t">
                <p className="text-sm text-gray-600">Total: {filteredUsers.length} usuário(s)</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </AuthCheck>
  );
}
