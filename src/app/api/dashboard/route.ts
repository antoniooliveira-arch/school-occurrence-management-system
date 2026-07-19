import { NextRequest, NextResponse } from "next/server";
import { chamados, escolas } from "@/db/schema";
import { db } from "@/db";
import { eq, and, gte, lte, count, sql } from "drizzle-orm";
import { verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const user = verifyToken(token);

    if (!token || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje.getTime() + 86400000);

    const monitorFilter = user.perfil === "monitoramento" ? eq(chamados.monitoramentoId, user.userId) : undefined;

    const [
      chamadosHojeResult,
      emAtendimentoResult,
      pendentesResult,
      finalizadosResult,
      emergenciaisResult,
      aguardandoResult,
      tempoMedioResult,
      statusDistResult,
      categoriaDistResult,
      escolaDistResult,
      monthlyResult,
    ] = await Promise.all([
      db.select({ total: count() }).from(chamados)
        .where(and(
          gte(chamados.dataAbertura, hoje),
          lte(chamados.dataAbertura, amanha),
          monitorFilter
        )),
      db.select({ total: count() }).from(chamados)
        .where(and(
          sql`${chamados.status} IN ('em_deslocamento', 'em_atendimento')`,
          monitorFilter
        )),
      db.select({ total: count() }).from(chamados)
        .where(and(
          sql`${chamados.status} IN ('novo', 'recebido', 'em_deslocamento', 'em_atendimento')`,
          monitorFilter
        )),
      db.select({ total: count() }).from(chamados)
        .where(and(eq(chamados.status, "finalizado"), monitorFilter)),
      db.select({ total: count() }).from(chamados)
        .where(and(
          eq(chamados.prioridade, "emergencial"),
          sql`${chamados.status} != 'finalizado'`,
          monitorFilter
        )),
      db.select({ total: count() }).from(chamados)
        .where(and(eq(chamados.status, "aguardando_fechamento"), monitorFilter)),
      db.select({
        avg: sql<number>`coalesce(avg(extract(epoch from (${chamados.dataResolucao} - ${chamados.dataAbertura})) / 3600), 0)`,
      }).from(chamados)
        .where(and(
          eq(chamados.status, "finalizado"),
          sql`${chamados.dataResolucao} IS NOT NULL`,
          monitorFilter
        )),
      db.select({
        status: chamados.status,
        total: count(),
      }).from(chamados).where(monitorFilter).groupBy(chamados.status),
      db.select({
        categoria: chamados.categoria,
        total: count(),
      }).from(chamados).where(monitorFilter).groupBy(chamados.categoria),
      db.select({
        escolaId: chamados.escolaId,
        nome: escolas.nome,
        total: count(),
      }).from(chamados)
        .leftJoin(escolas, eq(chamados.escolaId, escolas.id))
        .where(monitorFilter)
        .groupBy(chamados.escolaId, escolas.nome),
      db.select({
        mes: sql<string>`to_char(${chamados.dataAbertura}, 'Mon')`,
        mesOrdem: sql<number>`extract(month from ${chamados.dataAbertura})`,
        total: count(),
      }).from(chamados)
        .where(and(
          gte(chamados.dataAbertura, new Date(new Date().setMonth(new Date().getMonth() - 5, 1))),
          monitorFilter
        ))
        .groupBy(sql`to_char(${chamados.dataAbertura}, 'Mon')`, sql`extract(month from ${chamados.dataAbertura})`)
        .orderBy(sql`extract(month from ${chamados.dataAbertura})`),
    ]);

    const statusLabels: Record<string, string> = {
      novo: "Novo", recebido: "Recebido", em_deslocamento: "Em Deslocamento",
      em_atendimento: "Em Atendimento", resolvido: "Resolvido",
      aguardando_fechamento: "Aguardando Fechamento", finalizado: "Finalizado", cancelado: "Cancelado",
    };

    const categoriaColors: Record<string, string> = {
      furto: "#ef4444", tentativa_furto: "#f97316", arrombamento: "#f59e0b",
      invasao: "#84cc16", vandalismo: "#22c55e", briga: "#14b8a6",
      ameaca: "#06b6d4", alarme_disparado: "#0ea5e9", cerca_danificada: "#3b82f6",
      portao_aberto: "#6366f1", janela_quebrada: "#8b5cf6", queda_energia: "#a855f7",
      camera_sem_imagem: "#d946ef", dvr_desligado: "#ec4899", internet_inoperante: "#f43f5e",
      equipamento_danificado: "#78716c", incendio: "#dc2626", emergencia_medica: "#991b1b",
      apoio_direcao: "#1d4ed8", outro: "#71717a",
    };

    const escolaTop = escolaDistResult.sort((a, b) => b.total - a.total);

    const totalChamados = pendentesResult[0]?.total ?? 0;

    return NextResponse.json({
      stats: {
        chamadosHoje: chamadosHojeResult[0]?.total ?? 0,
        emAtendimento: emAtendimentoResult[0]?.total ?? 0,
        pendentes: pendentesResult[0]?.total ?? 0,
        finalizados: finalizadosResult[0]?.total ?? 0,
        emergenciais: emergenciaisResult[0]?.total ?? 0,
        aguardandoFechamento: aguardandoResult[0]?.total ?? 0,
        tempoMedioHoras: Math.round((tempoMedioResult[0]?.avg ?? 0) * 10) / 10,
        escolaMaisOcorrencias: escolaTop[0]?.nome || "Nenhuma",
        totalChamados,
      },
      chartData: {
        meses: monthlyResult.map(r => r.mes),
        chamadosPorMes: monthlyResult.map(r => r.total),
        categorias: categoriaDistResult
          .sort((a, b) => b.total - a.total)
          .map(r => ({
            name: r.categoria.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            value: r.total,
            color: categoriaColors[r.categoria] || "#71717a",
          })),
        status: statusDistResult.map(r => ({
          name: statusLabels[r.status] || r.status,
          value: r.total,
        })),
        porEscola: escolaTop.slice(0, 10).map(r => ({ name: r.nome || "Desconhecido", value: r.total })),
      },
    });
  } catch (error: any) {
    console.error("Error fetching dashboard:", error);
    return NextResponse.json({ error: "Erro ao buscar dados do dashboard" }, { status: 500 });
  }
}
