"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import type { User, LoginPayload, RegisterPayload } from "@/src/types/auth.types";
import { login as apiLogin, register as apiRegister, getMe } from "@/src/services/auth.service";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function setSessionCookie(token: string) {
  document.cookie = `access_token=${token}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

function clearSessionCookie() {
  document.cookie = "access_token=; path=/; max-age=0; SameSite=Lax";
}

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [user, setUser] = useState<User | null>(() => {
    // Restore cached user immediately — no loading flash
    if (globalThis.window === undefined) return null;
    try {
      const cached = localStorage.getItem("user_data");
      return cached ? (JSON.parse(cached) as User) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  // On mount: validate the stored token in the background
  useEffect(() => {
    const access = localStorage.getItem("access_token");
    if (!access) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    getMe()
      .then((me) => {
        setUser(me);
        localStorage.setItem("user_data", JSON.stringify(me));
      })
      .catch((err: unknown) => {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 401) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("user_data");
          clearSessionCookie();
          setUser(null);
        }
        // For network/server errors: keep the cached user visible
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const tokens = await apiLogin(payload);
    localStorage.setItem("access_token", tokens.access);
    localStorage.setItem("refresh_token", tokens.refresh);
    setSessionCookie(tokens.access);
    const me = await getMe();
    setUser(me);
    localStorage.setItem("user_data", JSON.stringify(me));
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    await apiRegister(payload);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_data");
    clearSessionCookie();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, login, register, logout }),
    [user, isLoading, login, register, logout],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
