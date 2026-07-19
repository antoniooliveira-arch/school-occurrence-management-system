import { NextRequest, NextResponse } from "next/server";
import { users } from "@/db/schema";
import { db } from "@/db";
import { eq, desc, sql, and, ilike } from "drizzle-orm";
import { verifyToken, hashPassword } from "@/lib/auth";
import { createLog } from "@/lib/logs";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const user = verifyToken(token);

    if (!token || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (user.perfil !== "administrador") {
      return NextResponse.json({ error: "Apenas administradores podem ver usuários" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const busca = searchParams.get("busca");

    let query = db
      .select({
        id: users.id,
        nome: users.nome,
        email: users.email,
        perfil: users.perfil,
        ativo: users.ativo,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    if (busca) {
      query = query.where(
        and(
          ilike(users.nome, `%${busca}%`)
        )
      ) as any;
    }

    const result = await query;

    return NextResponse.json({ users: result });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Erro ao buscar usuários" }, { status: 500 });
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
      return NextResponse.json({ error: "Apenas administradores podem criar usuários" }, { status: 403 });
    }

    const body = await request.json();
    const { nome, email, senha, perfil } = body;

    if (!nome || !email || !senha || !perfil) {
      return NextResponse.json({ error: "Nome, email, senha e perfil são obrigatórios" }, { status: 400 });
    }

    const existingUsers = await db.select().from(users).where(eq(users.email, email));
    if (existingUsers.length > 0) {
      return NextResponse.json({ error: "Email já cadastrado" }, { status: 400 });
    }

    const hashedPassword = await hashPassword(senha);
    const result = await db.insert(users).values({ nome, email, senha: hashedPassword, perfil }).returning();

    await createLog(user.userId, user.nome, "CREATE_USER", `Usuário ${nome} criado com perfil ${perfil}`, "usuario", result[0]?.id);

    const { senha: _, ...safeUser } = result[0];
    return NextResponse.json({ success: true, usuario: safeUser, message: "Usuário criado com sucesso!" }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Erro ao criar usuário" }, { status: 500 });
  }
}
