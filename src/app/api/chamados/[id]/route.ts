import { NextRequest, NextResponse } from "next/server";
import { chamados, users, escolas, anexos, atendimentos } from "@/db/schema";
import { db } from "@/db";
import { eq, and, sql } from "drizzle-orm";
import { verifyToken } from "@/lib/auth";
import { createLog } from "@/lib/logs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const user = verifyToken(token);

    if (!token || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const chamadoId = parseInt(id);

    const [chamadoResult, anexosResult, atendimentoResult] = await Promise.all([
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
          taticoNome: sql<string>`null`,
          dataAbertura: chamados.dataAbertura,
          dataRecebimento: chamados.dataRecebimento,
          dataDeslocamento: chamados.dataDeslocamento,
          dataInicioAtendimento: chamados.dataInicioAtendimento,
          dataResolucao: chamados.dataResolucao,
          dataFechamento: chamados.dataFechamento,
          latitude: chamados.latitude,
          longitude: chamados.longitude,
          criadoPor: chamados.criadoPor,
          atualizadoPor: chamados.atualizadoPor,
          observacoes: chamados.observacoes,
          createdAt: chamados.createdAt,
          updatedAt: chamados.updatedAt,
        })
        .from(chamados)
        .leftJoin(escolas, eq(chamados.escolaId, escolas.id))
        .leftJoin(users, eq(chamados.monitoramentoId, users.id))
        .where(eq(chamados.id, chamadoId)),
      db.select().from(anexos).where(eq(anexos.chamadoId, chamadoId)),
      db.select().from(atendimentos).where(eq(atendimentos.chamadoId, chamadoId)),
    ]);

    const chamado = chamadoResult[0];
    if (!chamado) {
      return NextResponse.json({ error: "Chamado não encontrado" }, { status: 404 });
    }

    if (user.perfil === "monitoramento" && chamado.monitoramentoId !== user.userId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    if (chamado.taticoId) {
      const taticoResult = await db.select({ nome: users.nome }).from(users).where(eq(users.id, chamado.taticoId));
      (chamado as any).taticoNome = taticoResult[0]?.nome || null;
    }

    return NextResponse.json({
      chamado,
      anexos: anexosResult,
      atendimento: atendimentoResult[0] || null,
    });
  } catch (error: any) {
    console.error("Error fetching chamado:", error);
    return NextResponse.json({ error: "Erro ao buscar chamado" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const user = verifyToken(token);

    if (!token || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const chamadoId = parseInt(id);
    const body = await request.json();

    const chamadoResult = await db.select().from(chamados).where(eq(chamados.id, chamadoId));
    const existingChamado = chamadoResult[0];

    if (!existingChamado) {
      return NextResponse.json({ error: "Chamado não encontrado" }, { status: 404 });
    }

    const updates: Record<string, any> = {
      updatedAt: new Date(),
      atualizadoPor: user.userId,
    };

    const { action, ...data } = body;

    switch (action) {
      case "aceitar":
        if (user.perfil !== "tatico") {
          return NextResponse.json({ error: "Apenas técnicos táticos podem aceitar chamados" }, { status: 403 });
        }
        updates.status = "em_deslocamento";
        updates.taticoId = user.userId;
        updates.dataRecebimento = new Date();
        break;

      case "iniciar_atendimento":
        if (user.perfil !== "tatico") {
          return NextResponse.json({ error: "Apenas técnicos táticos podem iniciar atendimento" }, { status: 403 });
        }
        updates.status = "em_atendimento";
        updates.dataInicioAtendimento = new Date();
        break;

      case "concluir":
        if (user.perfil !== "tatico") {
          return NextResponse.json({ error: "Apenas técnicos táticos podem concluir atendimentos" }, { status: 403 });
        }
        updates.status = "aguardando_fechamento";
        updates.dataResolucao = new Date();

        if (data.atendimento) {
          const existingAtend = await db.select().from(atendimentos).where(eq(atendimentos.chamadoId, chamadoId));
          const atendimentoData = {
            chamadoId,
            taticoId: user.userId,
            dataChegada: data.atendimento.dataChegada || new Date(),
            horaChegada: data.atendimento.horaChegada,
            dataSaida: data.atendimento.dataSaida || new Date(),
            horaSaida: data.atendimento.horaSaida,
            solucaoAplicada: data.atendimento.solucaoAplicada,
            equipamentosUtilizados: data.atendimento.equipamentosUtilizados,
            descricaoAtendimento: data.atendimento.descricaoAtendimento,
            updatedAt: new Date(),
          };

          if (existingAtend[0]) {
            await db.update(atendimentos).set(atendimentoData).where(eq(atendimentos.id, existingAtend[0].id));
          } else {
            await db.insert(atendimentos).values(atendimentoData);
          }
        }
        break;

      case "fechar":
        if (user.perfil !== "administrador") {
          return NextResponse.json({ error: "Apenas administradores podem fechar chamados" }, { status: 403 });
        }
        if (existingChamado.status === "finalizado") {
          return NextResponse.json({ error: "Chamado já está finalizado" }, { status: 400 });
        }
        updates.status = "finalizado";
        updates.dataFechamento = new Date();
        await createLog(user.userId, user.nome, "FECHAR_CHAMADO", `Chamado #${existingChamado.numero} finalizado`, "chamado", chamadoId);
        break;

      case "reabrir":
        if (user.perfil !== "administrador") {
          return NextResponse.json({ error: "Apenas administradores podem reabrir chamados" }, { status: 403 });
        }
        updates.status = "em_atendimento";
        updates.dataFechamento = null;
        await createLog(user.userId, user.nome, "REABRIR_CHAMADO", `Chamado #${existingChamado.numero} reaberto`, "chamado", chamadoId);
        break;

      case "cancelar":
        if (user.perfil !== "administrador") {
          return NextResponse.json({ error: "Apenas administradores podem cancelar chamados" }, { status: 403 });
        }
        updates.status = "cancelado";
        break;

      default:
        if (user.perfil !== "administrador" && user.perfil !== "monitoramento") {
          return NextResponse.json({ error: "Sem permissão para editar" }, { status: 403 });
        }
        Object.assign(updates, data);
        break;
    }

    await db.update(chamados).set(updates).where(eq(chamados.id, chamadoId));

    await createLog(
      user.userId,
      user.nome,
      `UPDATE_CHAMADO_${action ? action.toUpperCase() : "EDIT"}`,
      `Chamado #${existingChamado.numero} atualizado`,
      "chamado",
      chamadoId
    );

    const updatedResult = await db.select().from(chamados).where(eq(chamados.id, chamadoId));

    return NextResponse.json({ success: true, chamado: updatedResult[0], message: "Chamado atualizado com sucesso!" });
  } catch (error: any) {
    console.error("Error updating chamado:", error);
    return NextResponse.json({ error: "Erro ao atualizar chamado" }, { status: 500 });
  }
}
