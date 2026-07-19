import { users } from "@/db/schema";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "sgoe-secret-key-2024";

export interface JWTPayload {
  userId: number;
  nome: string;
  email: string;
  perfil: "administrador" | "monitoramento" | "tatico";
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function getTokenFromCookies(): JWTPayload | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie.match(/(?:^|; )auth_token=([^;]*)/);
  if (!match) return null;

  try {
    const token = decodeURIComponent(match[1]);
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function setAuthCookie(token: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `auth_token=${encodeURIComponent(token)}; path=/; max-age=28800; SameSite=Lax`;
}

export function clearAuthCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = "auth_token=; path=/; max-age=0; SameSite=Lax";
}

export async function authenticate(email: string, password: string): Promise<JWTPayload | null> {
  const result = await db.select().from(users).where(eq(users.email, email));
  const user = result[0];

  if (!user) return null;

  if (!user.ativo) {
    throw new Error("Usuário inativo. Entre em contato com o administrador.");
  }

  const isValid = await verifyPassword(password, user.senha);
  if (!isValid) return null;

  return {
    userId: user.id,
    nome: user.nome,
    email: user.email,
    perfil: user.perfil,
  };
}

export async function seedDatabase(): Promise<void> {
  const existingAdmin = await db.select().from(users).where(eq(users.email, "admin@sgoe.gov"));

  if (existingAdmin.length === 0) {
    const adminPassword = await hashPassword("admin123");
    await db.insert(users).values({
      nome: "Administrador",
      email: "admin@sgoe.gov",
      senha: adminPassword,
      perfil: "administrador",
    });
    console.log("✓ Admin user created");
  }

  const { escolas } = await import("@/db/schema");
  const existingSchools = await db.select().from(escolas);

  if (existingSchools.length === 0) {
    const schoolNames = [
      "CEI LUIZ FELIPE", "CEM SÃO CRISTÓVÃO", "CEI ARCO ÍRIS", "CEI BRUNO LEONARDO",
      "CEI DOM FRANCO", "CEI MENINO JESUS", "CEI NOSSO LAR", "CEI VASCO PAPA",
      "CEI CRIANÇA FELIZ", "CEM GUILHERME", "CEM ORLANDO PEREIRA", "EM MARIA HILDA",
      "EM PAULO FREIRE", "EM JOSÉ ANCHIETA", "ERM ÁLVARES AZEVEDO", "ERM CORA CORALINA",
      "ERM EUCLIDES DA CUNHA", "ERM OSVALDO CRUZ", "ERM VINÍCIUS DE MORAES",
      "MERENDA ESCOLAR", "SME", "NISE", "ALMOXARIFADO", "LOGÍSTICA",
    ];

    for (const nome of schoolNames) {
      await db.insert(escolas).values({ nome });
    }
    console.log(`✓ ${schoolNames.length} schools created`);
  }
}
