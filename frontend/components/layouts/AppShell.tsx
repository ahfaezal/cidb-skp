"use client";

import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { AppTopbar } from "@/components/topbar/AppTopbar";
import { useAuth } from "@/src/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const { isReady, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isReady && !user) {
      router.replace("/login");
    }
  }, [isReady, router, user]);

  if (!isReady || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm font-semibold text-slate-600">
        Memuat sesi pengguna...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <AppSidebar />

      <div className="ml-72 min-h-screen">
        <AppTopbar />

        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
