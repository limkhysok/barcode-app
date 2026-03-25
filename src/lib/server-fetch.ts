import { cookies } from "next/headers";

const BASE = process.env.DJANGO_INTERNAL_URL ?? "http://127.0.0.1:8000";

export async function serverFetch<T>(path: string): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const res = await fetch(`${BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json() as Promise<T>;
}
