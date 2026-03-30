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
  
  // Protect all dashboard routes
  if (pathname.startsWith("/dashboard") && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect logged-in users away from auth pages
  if ((pathname === "/login" || pathname === "/register") && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // --- 2. API PROXY -----------------------------------------------------

  if (pathname.startsWith("/api/")) {
    let relativePath = pathname.replace(/^\/api/, "");
    
    // Ensure trailing slash for general endpoints, but exclude users/auth
    if (!relativePath.endsWith("/") && !search && !relativePath.includes("/users")) {
      relativePath += "/";
    }

    const target = `${DJANGO}/api${relativePath}${search}`;
    console.log(`[UNIFIED-PROXY] ${request.method} ${pathname} -> ${target}`);

    const headers = new Headers(request.headers);
    headers.delete("host");

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
    "/dashboard/:path*",
    "/login", 
    "/register",
    "/api/:path*", // Include API routes for proxying
  ],
};
