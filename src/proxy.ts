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
    const res = await fetch(`${DJANGO}/api/v1/auth/token/refresh/`, {
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
    const response = NextResponse.redirect(new URL("/login/", request.url));
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

  if (!refreshToken) return NextResponse.redirect(new URL("/login/", request.url));

  return tryRefresh(refreshToken, request);
}

function handleAuthPageRedirect(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  if (pathname !== "/login" && pathname !== "/register") return null;

  const token = request.cookies.get("access_token")?.value;
  if (isTokenValid(token)) return NextResponse.redirect(new URL("/transactions/", request.url));

  return null;
}

function getUpstreamUrl(pathname: string, search: string): string {
  const isProxy = pathname.startsWith("/proxy/");
  if (isProxy) {
    let relativePath = pathname.replace(/^\/proxy/, "");
    if (!relativePath.endsWith("/") && !relativePath.includes(".")) {
      relativePath += "/";
    }
    return `${DJANGO}/api${relativePath}${search}`;
  }
  return `${DJANGO}${pathname}${search}`;
}

function rewriteRedirect(location: string, requestUrl: string, targetOrigin: string, targetHost: string): string | null {
  if (!location.includes(targetHost) && !location.startsWith("/")) {
    return null;
  }
  const frontendUrl = new URL(requestUrl);
  return location.startsWith("/")
    ? `${frontendUrl.origin}${location}`
    : location.replace(targetOrigin, frontendUrl.origin);
}

async function handleApiProxy(request: NextRequest): Promise<Response | null> {
  const { pathname, search } = request.nextUrl;
  const isProxyPath = pathname.startsWith("/proxy/") || pathname.startsWith("/static/") || pathname.startsWith("/media/");
  
  if (!isProxyPath) return null;

  const target = getUpstreamUrl(pathname, search);
  const targetUrl = new URL(DJANGO);
  
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.set("X-Forwarded-Host", request.headers.get("host") || "");
  headers.set("X-Forwarded-Proto", request.nextUrl.protocol.replace(":", ""));
  
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  console.log(`[UNIFIED-PROXY] ${request.method} ${pathname} -> ${target}`);

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      ...(hasBody ? { body: request.body, duplex: "half" } : {}),
      redirect: "manual", 
    } as RequestInit);

    const resHeaders = new Headers(upstream.headers);
    resHeaders.delete("transfer-encoding");
    resHeaders.delete("connection");

    const location = resHeaders.get("Location");
    if (location) {
      const newLocation = rewriteRedirect(location, request.url, targetUrl.origin, targetUrl.host);
      if (newLocation) resHeaders.set("Location", newLocation);
    }

    return new Response(upstream.body, { status: upstream.status, headers: resHeaders });
  } catch (error) {
    console.error("[PROXY-ERROR]", error);
    return NextResponse.json({ error: "Upstream connection failed" }, { status: 502 });
  }
}

/**
 * Next.js 16 Unified Proxy Boundary
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
    "/proxy/:path*",
    "/static/:path*",
    "/media/:path*",
  ],
};
