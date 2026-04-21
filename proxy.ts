import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const DJANGO = process.env.DJANGO_INTERNAL_URL ?? "http://127.0.0.1:8000";

const PROTECTED_PATHS = ["/products", "/inventory", "/transactions", "/profile", "/dashboard"];

function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function isTokenValid(token: string | undefined): boolean {
  if (!token) return false;
  const exp = getTokenExpiry(token);
  return exp !== null && exp > Date.now();
}

async function tryRefresh(refreshToken: string, request: NextRequest): Promise<NextResponse> {
  try {
    const res = await fetch(`${DJANGO}/api/v1/users/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!res.ok) throw new Error("refresh_failed");

    const { access } = await res.json() as { access: string };
    const exp = getTokenExpiry(access);
    const maxAge = exp ? Math.max(0, Math.floor((exp - Date.now()) / 1000)) : 3600;

    const response = NextResponse.next();
    response.cookies.set("access_token", access, { path: "/", maxAge, sameSite: "lax", httpOnly: false });
    return response;
  } catch {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("access_token");
    response.cookies.delete("refresh_token");
    return response;
  }
}

async function handleProtectedRoute(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;
  if (!PROTECTED_PATHS.some((p) => pathname.startsWith(p))) return null;

  const accessToken  = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  if (isTokenValid(accessToken)) return NextResponse.next();

  if (!refreshToken) return NextResponse.redirect(new URL("/login", request.url));

  return tryRefresh(refreshToken, request);
}

function handleAuthPageRedirect(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  if (pathname !== "/login" && pathname !== "/register") return null;

  const token = request.cookies.get("access_token")?.value;
  if (isTokenValid(token)) return NextResponse.redirect(new URL("/transactions", request.url));

  return null;
}

async function handleApiProxy(request: NextRequest): Promise<Response | null> {
  const { pathname, search } = request.nextUrl;
  if (!pathname.startsWith("/api/")) return null;

  let relativePath = pathname.replace(/^\/api/, "");
  if (!relativePath.endsWith("/") && !relativePath.includes("/users") && !relativePath.includes(".")) {
    relativePath += "/";
  }

  const target = `${DJANGO}/api${relativePath}${search}`;
  console.log(`[UNIFIED-PROXY] ${request.method} ${pathname} -> ${target}`);

  const headers = new Headers(request.headers);
  headers.set("host", "localhost");
  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      ...(hasBody ? { body: request.body, duplex: "half" } : {}),
    } as RequestInit);

    const resHeaders = new Headers(upstream.headers);
    resHeaders.delete("transfer-encoding");
    resHeaders.delete("connection");

    console.log(`[UNIFIED-PROXY] ${upstream.status} from ${target}`);
    return new Response(upstream.body, { status: upstream.status, headers: resHeaders });
  } catch (error) {
    console.error("[PROXY-ERROR]", error);
    return NextResponse.json({ error: "Upstream connection failed" }, { status: 502 });
  }
}

/**
 * Next.js 16 Unified Proxy
 * Handles Auth Redirects (with silent token refresh) and API Forwarding.
 */
export async function proxy(request: NextRequest) {
  return (
    (await handleProtectedRoute(request)) ??
    handleAuthPageRedirect(request) ??
    (await handleApiProxy(request)) ??
    NextResponse.next()
  );
}

export const config = {
  matcher: [
    "/products/:path*",
    "/inventory/:path*",
    "/transactions/:path*",
    "/profile/:path*",
    "/dashboard/:path*",
    "/login",
    "/register",
    "/api/:path*",
  ],
};
