import { NextRequest, NextResponse } from "next/server";
import { chamados, escolas, users } from "@/db/schema";
import { db } from "@/db";
import { eq, and, gte, lte, desc, sql, ilike, count } from "drizzle-orm";
import { verifyToken } from "@/lib/auth";
import { createLog } from "@/lib/logs";

async function getNextTicketNumber(): Promise<number> {
  const result = await db.select({ maxNumero: sql<number>`coalesce(max(${chamados.numero}), 0)` }).from(chamados);
  return (result[0]?.maxNumero ?? 0) + 1;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const user = verifyToken(token);

    if (!token || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const escolaId = searchParams.get("escolaId");
    const categoria = searchParams.get("categoria");
    const prioridade = searchParams.get("prioridade");
    const dataInicio = searchParams.get("dataInicio");
    const dataFim = searchParams.get("dataFim");
    const busca = searchParams.get("busca");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = (page - 1) * limit;

    const conditions = [];

    if (status) conditions.push(eq(chamados.status, status as any));
    if (escolaId) conditions.push(eq(chamados.escolaId, parseInt(escolaId)));
    if (categoria) conditions.push(eq(chamados.categoria, categoria as any));
    if (prioridade) conditions.push(eq(chamados.prioridade, prioridade as any));
    if (dataInicio) conditions.push(gte(chamados.dataAbertura, new Date(dataInicio)));
    if (dataFim) conditions.push(lte(chamados.dataAbertura, new Date(dataFim + "T23:59:59")));
    if (user.perfil === "monitoramento") {
      conditions.push(eq(chamados.monitoramentoId, user.userId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [chamadosResult, countResult] = await Promise.all([
      db
        .select({
          id: chamados.id,
          numero: chamados.numero,
          escolaId: chamados.escolaId,
          escolaNome: escolas.nome,
          categoria: chamados.categoria,
          prioridade: chamados.prioridade,
          descricao: chamados.descricao,
          localOcorrencia: chamados.localOcorrencia,
          status: chamados.status,
          monitoramentoId: chamados.monitoramentoId,
          monitoramentoNome: users.nome,
          taticoId: chamados.taticoId,
          dataAbertura: chamados.dataAbertura,
          createdAt: chamados.createdAt,
        })
        .from(chamados)
        .leftJoin(escolas, eq(chamados.escolaId, escolas.id))
        .leftJoin(users, eq(chamados.monitoramentoId, users.id))
        .where(whereClause)
        .orderBy(desc(chamados.dataAbertura))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: count() })
        .from(chamados)
        .where(whereClause),
    ]);

    if (busca) {
      const buscaLower = busca.toLowerCase();
      const filtered = chamadosResult.filter((c) =>
        c.descricao?.toLowerCase().includes(buscaLower) ||
        c.escolaNome?.toLowerCase().includes(buscaLower) ||
        String(c.numero).includes(busca)
      );
      return NextResponse.json({
        chamados: filtered,
        pagination: { page, limit, total: filtered.length, pages: 1 },
      });
    }

    const total = countResult[0]?.total ?? 0;

    return NextResponse.json({
      chamados: chamadosResult,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error("Error fetching chamados:", error);
    return NextResponse.json({ error: "Erro ao buscar chamados" }, { status: 500 });
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

    if (user.perfil !== "administrador" && user.perfil !== "monitoramento") {
      return NextResponse.json(
        { error: "Apenas administradores ou monitoramento podem criar chamados" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { escolaId, categoria, prioridade, descricao, localOcorrencia, latitude, longitude } = body;

    if (!escolaId || !categoria || !descricao) {
      return NextResponse.json({ error: "Escola, categoria e descrição são obrigatórios" }, { status: 400 });
    }

    const numero = await getNextTicketNumber();

    const result = await db.insert(chamados).values({
      numero,
      escolaId,
      categoria,
      prioridade: prioridade || "media",
      descricao,
      localOcorrencia,
      latitude,
      longitude,
      monitoramentoId: user.userId,
      criadoPor: user.userId,
      status: "novo",
    }).returning();

    await createLog(user.userId, user.nome, "CREATE_CHAMADO", `Chamado #${numero} aberto`, "chamado", result[0]?.id);

    return NextResponse.json({ success: true, chamado: result[0], message: `Chamado #${numero} criado com sucesso!` }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating chamado:", error);
    return NextResponse.json({ error: "Erro ao criar chamado" }, { status: 500 });
  }
}
