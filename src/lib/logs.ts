import { logs } from "@/db/schema";
import { db } from "@/db";

export async function createLog(
  usuarioId: number | null,
  usuarioNome: string,
  acao: string,
  descricao?: string,
  entidade?: string,
  entidadeId?: number
): Promise<void> {
  try {
    await db.insert(logs).values({
      usuarioId,
      usuarioNome,
      acao,
      descricao,
      entidade,
      entidadeId,
    }).execute();
  } catch (error) {
    console.error("Error creating log:", error);
  }
}
