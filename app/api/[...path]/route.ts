import type { NextRequest } from "next/server";

const DJANGO = process.env.DJANGO_INTERNAL_URL ?? "http://127.0.0.1:8000";

async function proxy(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const search = req.nextUrl.search;
  const target = `${DJANGO}/api/${path.join("/")}${search}`;

  const headers = new Headers(req.headers);
  headers.delete("host");

  const hasBody = req.method !== "GET" && req.method !== "HEAD";

  const upstream = await fetch(target, {
    method: req.method,
    headers,
    ...(hasBody ? { body: req.body, duplex: "half" } : {}),
  } as RequestInit);

  const resHeaders = new Headers(upstream.headers);
  // Strip hop-by-hop headers that can't be forwarded
  resHeaders.delete("transfer-encoding");
  resHeaders.delete("connection");

  return new Response(upstream.body, {
    status: upstream.status,
    headers: resHeaders,
  });
}

export const GET    = proxy;
export const POST   = proxy;
export const PUT    = proxy;
export const PATCH  = proxy;
export const DELETE = proxy;
