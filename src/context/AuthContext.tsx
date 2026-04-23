"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import type { User, LoginPayload, RegisterPayload } from "@/src/types/auth.types";
import { login as apiLogin, register as apiRegister, getMe } from "@/src/services/auth.service";

export type Role = "staff" | "boss" | "superadmin";

function getRole(user: User | null): Role {
  if (user?.is_superuser) return "superadmin";
  if (user?.is_boss) return "boss";
  return "staff";
}

interface AuthContextValue {
  user: User | null;
  role: Role;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function setSessionCookie(accessToken: string, refreshToken?: string) {
  const exp = getTokenExpiry(accessToken);
  const maxAge = exp ? Math.max(0, Math.floor((exp - Date.now()) / 1000)) : 3600;
  document.cookie = `access_token=${accessToken}; path=/; max-age=${maxAge}; SameSite=Lax`;
  if (refreshToken) {
    document.cookie = `refresh_token=${refreshToken}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
  }
}

function clearSessionCookie() {
  document.cookie = "access_token=; path=/; max-age=0; SameSite=Lax";
  document.cookie = "refresh_token=; path=/; max-age=0; SameSite=Lax";
}

/** Decode JWT expiry (ms). Returns null if unreadable. */
function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

/** Decode JWT claims for roles and user info. */
function decodeToken(token: string): Partial<User> | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      id: payload.user_id,
      username: payload.username,
      is_boss: !!payload.is_boss,
      is_staff: !!payload.is_staff,
      is_superuser: !!payload.is_superuser,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [user, setUser] = useState<User | null>(() => {
    if (globalThis.window === undefined) return null;
    try {
      const cached = localStorage.getItem("user_data");
      return cached ? (JSON.parse(cached) as User) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  const clearAuth = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_data");
    clearSessionCookie();
    setUser(null);
  }, []);

  const validateToken = useCallback(() => {
    const access = localStorage.getItem("access_token");
    if (!access) { clearAuth(); return; }
    getMe()
      .then((me) => {
        setUser(me);
        localStorage.setItem("user_data", JSON.stringify(me));
      })
      .catch((err: unknown) => {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 401) clearAuth();
      });
  }, [clearAuth]);

  // On mount: validate token
  useEffect(() => {
    const access = localStorage.getItem("access_token");
    if (!access) {
      clearAuth();
      setIsLoading(false);
      return;
    }
    const decoded = decodeToken(access);
    if (decoded) {
      // Early state from token for faster UI gating
      setUser(prev => ({ ...(prev || {} as User), ...decoded }));
    }

    getMe()
      .then((me) => {
        if (me) {
          setUser(me);
          localStorage.setItem("user_data", JSON.stringify(me));
        }
      })
      .catch((err: unknown) => {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 401) clearAuth();
      })
      .finally(() => setIsLoading(false));
  }, [clearAuth]);

  // Precise expiry timer: fires exactly when the access token expires
  useEffect(() => {
    const access = localStorage.getItem("access_token");
    if (!access) return;

    const exp = getTokenExpiry(access);
    if (!exp) return;

    const delay = exp - Date.now();
    if (delay <= 0) {
      validateToken();
      return;
    }

    const timer = setTimeout(validateToken, delay);
    return () => clearTimeout(timer);
  }, [user, validateToken]); // re-arms after login / token refresh

  // Re-validate when user returns to the tab after being away
  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        const access = localStorage.getItem("access_token");
        if (!access) return;
        const exp = getTokenExpiry(access);
        if (exp && exp < Date.now()) validateToken();
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [validateToken]);

  const login = useCallback(async (payload: LoginPayload) => {
    const tokens = await apiLogin(payload);
    localStorage.setItem("access_token", tokens.access);
    localStorage.setItem("refresh_token", tokens.refresh);
    setSessionCookie(tokens.access, tokens.refresh);
    
    // Decode and set partial user state immediately for faster UI update
    const decoded = decodeToken(tokens.access);
    if (decoded) {
      setUser(prev => ({ ...(prev || {} as User), ...decoded }));
    }

    const me = await getMe();
    if (me) {
      setUser(me);
      localStorage.setItem("user_data", JSON.stringify(me));
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    await apiRegister(payload);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  const role = useMemo(() => getRole(user), [user]);

  const value = useMemo(
    () => ({ user, role, isLoading, login, register, logout }),
    [user, role, isLoading, login, register, logout],
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
