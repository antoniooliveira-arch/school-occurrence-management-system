import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { createLog } from "@/lib/logs";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    
    if (token) {
      try {
        const user = verifyToken(token);
        if (user) {
          await createLog(
            user.userId,
            user.nome,
            "LOGOUT",
            `Usuário ${user.nome} realizou logout`
          );
        }
      } catch {
        // Token invalid but still clear cookie
      }
    }

    const response = NextResponse.json({
      success: true,
      message: "Logout realizado com sucesso!",
    });

    response.cookies.set("auth_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Erro ao realizar logout" },
      { status: 500 }
    );
  }
}
