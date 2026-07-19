import { NextRequest, NextResponse } from "next/server";
import { anexos } from "@/db/schema";
import { db } from "@/db";
import { verifyToken } from "@/lib/auth";
import { createLog } from "@/lib/logs";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const user = verifyToken(token);

    if (!token || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const formData = await request.formData();
    const chamadoId = parseInt(formData.get("chamadoId") as string);
    const tipo = formData.get("tipo") as string; // foto_antes, foto_depois, outro
    const file = formData.get("arquivo") as File | null;

    if (!chamadoId || !file) {
      return NextResponse.json({ error: "Chamado e arquivo são obrigatórios" }, { status: 400 });
    }

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), "public", "uploads", `chamado_${chamadoId}`);
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name;
    const extension = path.extname(originalName);
    const filename = `${timestamp}_${originalName}`;

    // Save file
    const filePath = path.join(uploadDir, filename);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Get file URL
    const arquivoUrl = `/uploads/chamado_${chamadoId}/${filename}`;

    // Save to database
    await db.insert(anexos).values({
      chamadoId,
      arquivoNome: originalName,
      arquivoUrl,
      tipo: tipo || "outro",
      uploadedBy: user.userId,
    }).execute();

    await createLog(
      user.userId,
      user.nome,
      "UPLOAD_ANEXO",
      `Arquivo ${originalName} anexado ao chamado #${chamadoId}`,
      "anexo"
    );

    return NextResponse.json({
      success: true,
      message: "Arquivo anexado com sucesso!",
      url: arquivoUrl,
    });
  } catch (error: any) {
    console.error("Error uploading file:", error);
    return NextResponse.json({ error: "Erro ao fazer upload do arquivo" }, { status: 500 });
  }
}
