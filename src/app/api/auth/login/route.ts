import { NextRequest, NextResponse } from "next/server";
import { authenticate, generateToken } from "@/lib/auth";
import { createLog } from "@/lib/logs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, senha } = body;

    if (!email || !senha) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    const user = await authenticate(email, senha);

    if (!user) {
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    const token = generateToken(user);

    // Create login log
    await createLog(
      user.userId,
      user.nome,
      "LOGIN",
      `Usuário ${user.nome} realizou login`
    );

    const response = NextResponse.json({
      success: true,
      user,
      token,
      message: "Login realizado com sucesso!",
    });

    // Set HTTP-only cookie
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 28800, // 8 hours
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao realizar login" },
      { status: 500 }
    );
  }
}
