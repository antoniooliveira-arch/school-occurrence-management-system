import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const user = verifyToken(token);

    if (!user) {
      return NextResponse.json(
        { error: "Token inválido ou expirado" },
        { status: 401 }
      );
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Erro ao obter usuário" },
      { status: 500 }
    );
  }
}
