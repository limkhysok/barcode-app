import api from "./api";
import type { AuthTokens, LoginPayload, RegisterPayload, User } from "@/src/types/auth.types";

export async function login(payload: LoginPayload): Promise<AuthTokens> {
  const { data } = await api.post<AuthTokens>("/api/users/login", payload);
  return data;
}

export async function register(payload: RegisterPayload): Promise<User> {
  const { data } = await api.post<User>("/api/users/register", payload);
  return data;
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>("/api/users/me");
  return data;
}

export async function refreshToken(refresh: string): Promise<{ access: string }> {
  const { data } = await api.post<{ access: string }>("/api/users/token/refresh", { refresh });
  return data;
}
