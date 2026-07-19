import { NextRequest, NextResponse } from "next/server";
import { escolas } from "@/db/schema";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { verifyToken } from "@/lib/auth";
import { createLog } from "@/lib/logs";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const user = verifyToken(token);

    if (!token || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const result = await db.select().from(escolas).where(eq(escolas.ativa, true));

    return NextResponse.json({ escolas: result });
  } catch (error: any) {
    console.error("Error fetching schools:", error);
    return NextResponse.json({ error: "Erro ao buscar escolas" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const user = verifyToken(token);

    if (!token || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (user.perfil !== "administrador") {
      return NextResponse.json({ error: "Apenas administradores podem cadastrar escolas" }, { status: 403 });
    }

    const body = await request.json();
    const { nome, endereco, telefone } = body;

    if (!nome) {
      return NextResponse.json({ error: "Nome da escola é obrigatório" }, { status: 400 });
    }

    const existing = await db.select().from(escolas).where(eq(escolas.nome, nome));
    if (existing.length > 0) {
      return NextResponse.json({ error: "Escola já cadastrada" }, { status: 400 });
    }

    const result = await db.insert(escolas).values({ nome, endereco, telefone }).returning();

    await createLog(user.userId, user.nome, "CREATE_ESCOLA", `Escola ${nome} cadastrada`, "escola", result[0]?.id);

    return NextResponse.json({ success: true, escola: result[0], message: "Escola criada com sucesso!" }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating school:", error);
    return NextResponse.json({ error: "Erro ao criar escola" }, { status: 500 });
  }
}
