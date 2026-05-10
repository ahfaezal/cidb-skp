import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { AppTopbar } from "@/components/topbar/AppTopbar";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
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