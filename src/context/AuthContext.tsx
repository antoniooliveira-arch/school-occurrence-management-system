"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { JWTPayload, verifyToken as verifyJWT } from "@/lib/auth";

interface AuthContextType {
  user: JWTPayload | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, senha: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<JWTPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", {
        headers: {
          "Authorization": `Bearer ${getCookie("auth_token")}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        removeAuthCookie();
      }
    } catch (error) {
      console.error("Auth check error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/auth/me", {
          headers: {
            "Authorization": `Bearer ${getCookie("auth_token")}`,
          },
        });
        
        if (!cancelled) {
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
          } else {
            removeAuthCookie();
          }
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const login = async (email: string, senha: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || "Erro ao fazer login" };
      }

      setUser(data.user);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Erro de conexão" };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout error:", error);
    }
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Helper to get cookie from browser
function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : "";
}

function removeAuthCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = "auth_token=; path=/; max-age=0; SameSite=Lax";
}
