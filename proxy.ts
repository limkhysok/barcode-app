import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const DJANGO = process.env.DJANGO_INTERNAL_URL ?? "http://127.0.0.1:8000";

/**
 * Next.js 16 Unified Proxy
 * Handles Auth Redirects and API Forwarding.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get("access_token")?.value;

  // --- 1. AUTH REDIRECTS -------------------------------------------------
  
  // Protect all protected routes
  const protectedPaths = ["/products", "/inventory", "/transactions", "/profile"];
  if (protectedPaths.some((p) => pathname.startsWith(p)) && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect logged-in users away from auth pages
  if ((pathname === "/login" || pathname === "/register") && token) {
    return NextResponse.redirect(new URL("/transactions", request.url));
  }

  // --- 2. API PROXY -----------------------------------------------------

  if (pathname.startsWith("/api/")) {
    let relativePath = pathname.replace(/^\/api/, "");
    
    // Ensure trailing slash for general endpoints (Django requirement)
    // Skip if already slashed, is a user endpoint, or has a file extension
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

      return new Response(upstream.body, {
        status: upstream.status,
        headers: resHeaders,
      });
    } catch (error) {
      console.error("[PROXY-ERROR]", error);
      return NextResponse.json({ error: "Upstream connection failed" }, { status: 502 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/products/:path*",
    "/inventory/:path*",
    "/transactions/:path*",
    "/profile/:path*",
    "/login",
    "/register",
    "/api/:path*",
  ],
};
