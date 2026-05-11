"use client";

import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { AppTopbar } from "@/components/topbar/AppTopbar";
import { useAuth } from "@/src/lib/auth";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const { isReady, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);

  useEffect(() => {
    if (isReady && !user) {
      router.replace("/login");
    }
  }, [isReady, router, user]);

  useEffect(() => {
    if (
      isReady &&
      user?.role === "Ahli Panel Pembangun" &&
      !pathname.startsWith("/question-bank")
    ) {
      router.replace("/question-bank");
    }
  }, [isReady, pathname, router, user]);

  if (!isReady || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm font-semibold text-slate-600">
        Memuat sesi pengguna...
      </div>
    );
  }

  if (
    user.role === "Ahli Panel Pembangun" &&
    !pathname.startsWith("/question-bank")
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm font-semibold text-slate-600">
        Mengalihkan ke Question Bank...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {!isSidebarHidden && <AppSidebar />}

      <div
        className={[
          "min-h-screen transition-[margin] duration-200",
          isSidebarHidden ? "ml-0" : "ml-72",
        ].join(" ")}
      >
        <AppTopbar
          isSidebarHidden={isSidebarHidden}
          onToggleSidebar={() => setIsSidebarHidden((current) => !current)}
        />

        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
