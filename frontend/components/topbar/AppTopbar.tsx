"use client";

import { LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { useAuth } from "@/src/lib/auth";

type AppTopbarProps = {
  isSidebarHidden: boolean;
  onToggleSidebar: () => void;
};

export function AppTopbar({ isSidebarHidden, onToggleSidebar }: AppTopbarProps) {
  const { logout, user } = useAuth();

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-8 py-4 backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900"
            title={isSidebarHidden ? "Papar menu" : "Sembunyi menu"}
          >
            {isSidebarHidden ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>
          <div>
            <p className="text-sm font-medium text-slate-500">
              Competency-Based Module & Assessment Development Platform
            </p>
            <h2 className="text-xl font-bold text-slate-900">
              SKP-CIDB Builder
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600">
            {user?.name} / {user?.role}
          </div>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </button>
        </div>
      </div>
    </header>
  );
}
