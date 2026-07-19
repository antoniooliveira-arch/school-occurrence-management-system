"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Shield, Eye, EyeOff, AlertCircle, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const { login, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !senha) { setError("Preencha todos os campos"); return; }
    setLoading(true);
    const result = await login(email, senha);
    if (!result.success) { setError(result.error || "Erro ao fazer login"); setLoading(false); }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-blue-400"></div>
          <p className="text-sm text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)" }}>
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-[420px] relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25 mb-5">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">SGOE</h1>
          <p className="text-slate-400 text-sm mt-1.5">Sistema de Gestão de Ocorrências Escolares</p>
          <p className="text-slate-500 text-xs mt-1">Secretaria Municipal de Educação</p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.07] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-8">
          <h2 className="text-lg font-semibold text-white mb-6">Entrar na conta</h2>

          {error && (
            <div className="flex items-center gap-3 p-3.5 mb-5 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="text-sm text-red-300">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2 uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-4 py-3 bg-white/[0.06] border border-white/[0.08] rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all outline-none text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2 uppercase tracking-wider">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 bg-white/[0.06] border border-white/[0.08] rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all outline-none text-sm"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/25 mt-2 text-sm"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Entrando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  Entrar
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-xs mt-8">
          &copy; {new Date().getFullYear()} Secretaria Municipal de Educação
        </p>
      </div>
    </div>
  );
}
