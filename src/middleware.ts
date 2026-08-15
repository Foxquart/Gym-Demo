import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth-edge";

const PROTECTED = ["/dashboard", "/checkout", "/admin"];
const GUEST_ONLY = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (session && GUEST_ONLY.some((p) => pathname.startsWith(p))) {
    const to = session.role === "ADMIN" ? "/admin" : "/dashboard";
    return NextResponse.redirect(new URL(to, request.url));
  }

  if (!session && PROTECTED.some((p) => pathname.startsWith(p))) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  // Role gate: the page also re-checks, this just avoids a wasted render.
  if (session && session.role !== "ADMIN" && pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/checkout/:path*", "/login", "/register"],
};
