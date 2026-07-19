"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

interface AuthCheckProps {
  children: React.ReactNode;
  requiredProfile?: "administrador" | "monitoramento" | "tatico";
}

export default function AuthCheck({ children, requiredProfile }: AuthCheckProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
    
    if (isLoading || !user) return;

    // Check profile requirements
    if (requiredProfile && user.perfil !== requiredProfile) {
      if (requiredProfile === "administrador") {
        router.push("/");
        return;
      }
    }
  }, [isLoading, isAuthenticated, user, requiredProfile, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-blue-600 text-xl">Carregando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredProfile && user?.perfil !== requiredProfile && requiredProfile === "administrador") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md mx-4">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Acesso Não Autorizado</h2>
          <p className="text-gray-600 mb-4">
            Você não tem permissão para acessar esta área.
            <br />
            Apenas administradores podem acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
