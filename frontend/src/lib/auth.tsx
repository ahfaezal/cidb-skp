"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { API_BASE_URL } from "@/src/lib/api";

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
    return savedUser ? (JSON.parse(savedUser) as AuthUser) : null;
  });
  const [token, setToken] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem("skpAuthToken") || "";
  });
  const isReady = true;

  const value = useMemo<AuthContextValue>(() => {
    async function login(email: string, password: string) {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
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
      router.push("/dashboard");
    }

    function logout() {
      window.localStorage.removeItem("skpAuthToken");
      window.localStorage.removeItem("skpAuthUser");
      setToken("");
      setUser(null);
      router.push("/login");
    }

    function authHeaders() {
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      return headers;
    }

    return { user, token, isReady, login, logout, authHeaders };
  }, [isReady, router, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
