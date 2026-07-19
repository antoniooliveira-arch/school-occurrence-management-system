import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/health"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.includes(".")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("auth_token")?.value;

  if (!token && !pathname.startsWith("/api/")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!token && pathname.startsWith("/api/") && !pathname.startsWith("/api/auth/")) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
