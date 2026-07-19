import { JWTPayload } from "./auth";

let cachedToken: string | null = null;
let cachedUser: JWTPayload | null = null;

export function getToken(): string | null {
  if (typeof document === "undefined") return null;

  if (cachedToken) return cachedToken;

  const match = document.cookie.match(/(?:^|; )auth_token=([^;]*)/);
  if (!match) return null;

  cachedToken = decodeURIComponent(match[1]);
  return cachedToken;
}

export function clearTokenCache(): void {
  cachedToken = null;
  cachedUser = null;
}

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  if (!token) throw new Error("Não autenticado");

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    clearTokenCache();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Sessão expirada");
  }

  return response;
}

export async function authFetchJson<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await authFetch(url, options);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Erro desconhecido" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  return response.json();
}
