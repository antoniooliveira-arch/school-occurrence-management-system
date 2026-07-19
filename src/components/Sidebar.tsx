"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Users,
  School,
  ScrollText,
  LogOut,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isAdmin = user?.perfil === "administrador";

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/chamados", label: "Chamados", icon: FileText },
    { href: "/chamados/novo", label: "Novo Chamado", icon: PlusCircle },
    ...(isAdmin ? [
      { href: "/admin/usuarios", label: "Usuários", icon: Users },
      { href: "/admin/escolas", label: "Escolas", icon: School },
      { href: "/admin/logs", label: "Logs do Sistema", icon: ScrollText },
    ] : []),
  ];

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden" onClick={onToggle} />
      )}

      <aside className={`fixed left-0 top-0 h-full w-[260px] z-50 flex flex-col transform transition-all duration-300 ease-out lg:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
        style={{
          background: "linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        }}
      >
        {/* Logo */}
        <div className="px-6 py-5 flex items-center gap-3 border-b border-white/[0.06]">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-[15px] text-white tracking-tight">SGOE</h1>
            <p className="text-[11px] text-slate-400 tracking-wide">Ocorrências Escolares</p>
          </div>
          <button onClick={onToggle} className="lg:hidden ml-auto text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User */}
        <div className="px-4 pt-4 pb-2">
          <div className="px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <p className="text-[13px] font-medium text-white truncate">{user?.nome}</p>
            <p className="text-[11px] text-slate-400 capitalize mt-0.5">{user?.perfil?.replace("_", " ")}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => window.innerWidth < 1024 && onToggle()}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                <item.icon className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/[0.06]">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-[13px] font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/[0.08] transition-all duration-200"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Sair do Sistema
          </button>
        </div>
      </aside>
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden fixed top-4 left-4 z-30 p-2.5 rounded-xl bg-white shadow-lg shadow-black/[0.08] border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}
