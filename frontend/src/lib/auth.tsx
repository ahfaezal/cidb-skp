"use client";

import { createContext, useContext, useMemo, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

import { API_BASE_URL, apiFetch } from "@/src/lib/api";

export type UserRole =
  | "Super Admin"
  | "Project Manager"
  | "Fasilitator"
  | "Pegawai CIDB"
  | "Pegawai Penilai"
  | "Ahli Panel Pembangun";

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  projectRef: string;
  isActive: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string;
  isReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  authHeaders: () => HeadersInit;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === "undefined") return null;
    const savedUser = window.localStorage.getItem("skpAuthUser");
    try { return savedUser ? (JSON.parse(savedUser) as AuthUser) : null; } catch { return null; }
  });
  const [token, setToken] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem("skpAuthToken") || "";
  });
  const [isReady, setIsReady] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const logout = useCallback(() => {
    window.localStorage.removeItem("skpAuthToken");
    window.localStorage.removeItem("skpAuthUser");
    setToken(""); setUser(null); setIsReady(true);
    router.push("/login");
  }, [router]);
  const authHeaders = useCallback((): Record<string, string> => token ? { Authorization: `Bearer ${token}` } : {}, [token]);
  useEffect(() => {
    const controller = new AbortController();
    window.addEventListener("skp-session-expired", logout);
    const timer = window.setTimeout(async () => {
      if (!token) { setIsReady(true); return; }
      try {
        const response = await apiFetch(`${API_BASE_URL}/auth/me`, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(180000)]) });
        if (!response.ok) throw new Error("Sesi tidak dapat disahkan. Muat semula untuk mencuba lagi.");
        const verified = await response.json() as AuthUser;
        if (!controller.signal.aborted) {
          setUser(verified); window.localStorage.setItem("skpAuthUser", JSON.stringify(verified)); setIsReady(true);
        }
      } catch (err) {
        if (!controller.signal.aborted) setSessionError(err instanceof Error ? err.message : "Sesi gagal disahkan.");
      }
    }, 0);
    return () => { window.clearTimeout(timer); controller.abort(); window.removeEventListener("skp-session-expired", logout); };
  }, [logout, token]);

  const value = useMemo<AuthContextValue>(() => {
    async function login(email: string, password: string) {
      const response = await apiFetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.detail || "Login gagal.");
      }

      const payload = (await response.json()) as {
        accessToken: string;
        user: AuthUser;
      };

      window.localStorage.setItem("skpAuthToken", payload.accessToken);
      window.localStorage.setItem("skpAuthUser", JSON.stringify(payload.user));
      setToken(payload.accessToken);
      setUser(payload.user);
      setIsReady(true);
      router.push(payload.user.role === "Ahli Panel Pembangun" ? "/question-bank" : "/dashboard");
    }

    return { user, token, isReady, login, logout, authHeaders };
  }, [authHeaders, isReady, logout, router, token, user]);

  if (sessionError && !isReady) return <div className="p-8"><p>{sessionError}</p><button onClick={() => window.location.reload()}>Cuba semula</button><button onClick={logout}>Log masuk semula</button></div>;
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
