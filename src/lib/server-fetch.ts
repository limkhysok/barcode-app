import { cookies } from "next/headers";
import { redirect } from "next/navigation";


const BASE = process.env.DJANGO_INTERNAL_URL ?? "http://127.0.0.1:8000";

export async function serverFetch<T>(path: string): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });
  if (!res.ok) {
    if (res.status === 401) {
      redirect("/login");
    }
    console.error(`[SERVER-FETCH] Error ${res.status} from ${url}`);
    throw new Error(`${res.status}`);
  }
  return res.json() as Promise<T>;
}
