import api from "./api";
import type { AuthTokens, LoginPayload, RegisterPayload, User } from "@/src/types/auth.types";

export async function login(payload: LoginPayload): Promise<AuthTokens> {
  const { data } = await api.post<AuthTokens>("/api/v1/users/login", payload);
  return data;
}

export async function register(payload: RegisterPayload): Promise<User> {
  const { data } = await api.post<User>("/api/v1/users/register", payload);
  return data;
}

/**
 * Universal getter for current user. 
 * On server: Pass 'serverFetch' from "@/src/lib/server-fetch".
 * On client: Call without arguments.
 */
export async function getMe(fetcher?: <T>(path: string) => Promise<T>): Promise<User | null> {
  try {
    if (fetcher) {
      // Server-side
      return await fetcher<User>("/api/v1/users/me");
    }
    // Client-side
    const { data } = await api.get<User>("/api/v1/users/me");
    return data;
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    return null;
  }
}

export async function refreshToken(refresh: string): Promise<{ access: string }> {
  const { data } = await api.post<{ access: string }>("/api/v1/users/token/refresh", { refresh });
  return data;
}
