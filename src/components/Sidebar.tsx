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
    {
      href: "/",
      label: "Dashboard",
      icon: LayoutDashboard,
      roles: ["administrador", "monitoramento", "tatico"],
    },
    {
      href: "/chamados",
      label: "Chamados",
      icon: FileText,
      roles: ["administrador", "monitoramento", "tatico"],
    },
    {
      href: "/chamados/novo",
      label: "Novo Chamado",
      icon: PlusCircle,
      roles: ["monitoramento", "administrador"],
    },
    ...(isAdmin ? [
      {
        href: "/admin/usuarios",
        label: "Usuários",
        icon: Users,
        roles: ["administrador"] as string[],
      },
      {
        href: "/admin/escolas",
        label: "Escolas",
        icon: School,
        roles: ["administrador"] as string[],
      },
      {
        href: "/admin/logs",
        label: "Logs do Sistema",
        icon: ScrollText,
        roles: ["administrador"] as string[],
      },
    ] : []),
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-64 bg-blue-900 text-white z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        {/* Header */}
        <div className="p-5 border-b border-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-blue-300" />
              <div>
                <h1 className="font-bold text-lg">SGOE</h1>
                <p className="text-xs text-blue-300">Ocorrências Escolares</p>
              </div>
            </div>
            <button onClick={onToggle} className="lg:hidden">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* User info */}
          <div className="mt-4 p-3 bg-blue-800/50 rounded-lg">
            <p className="text-sm font-medium truncate">{user?.nome}</p>
            <p className="text-xs text-blue-300 capitalize">{user?.perfil}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            if (!item.roles.includes(user?.perfil || "")) return null;

            const isActive = pathname === item.href || 
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => window.innerWidth < 1024 && onToggle()}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-blue-200 hover:bg-blue-800 hover:text-white"
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-blue-800">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-blue-200 hover:bg-red-600/20 hover:text-red-300 transition-all duration-200"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
}

// Mobile menu button
export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden fixed top-4 left-4 z-30 p-2 rounded-lg bg-blue-900 text-white shadow-lg"
    >
      <Menu className="w-6 h-6" />
    </button>
  );
}
