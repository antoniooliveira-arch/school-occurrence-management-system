import { NextRequest, NextResponse } from "next/server";
import { logs } from "@/db/schema";
import { db } from "@/db";
import { desc, sql } from "drizzle-orm";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const user = verifyToken(token);

    if (!token || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (user.perfil !== "administrador") {
      return NextResponse.json({ error: "Apenas administradores podem ver logs" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "200"), 500);
    const page = parseInt(searchParams.get("page") || "1");
    const offset = (page - 1) * limit;

    const result = await db
      .select()
      .from(logs)
      .orderBy(desc(logs.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ logs: result });
  } catch (error: any) {
    console.error("Error fetching logs:", error);
    return NextResponse.json({ error: "Erro ao buscar logs" }, { status: 500 });
  }
}
