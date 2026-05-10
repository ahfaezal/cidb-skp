"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Database,
  HardHat,
  GitBranch,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  HelpCircle,
  ImageIcon,
  FileText,
} from "lucide-react";

const menuItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "CMCS", href: "/cmcs", icon: Database },
  { label: "Trade/Tred", href: "/trades", icon: HardHat },
  { label: "Mapping", href: "/mapping", icon: GitBranch },
  { label: "Module Builder", href: "/module-builder", icon: BookOpen },
  { label: "Verification", href: "/verification", icon: CheckCircle2 },
  { label: "Assessment", href: "/assessment", icon: ClipboardList },
  { label: "Question Bank", href: "/question-bank", icon: HelpCircle },
  { label: "Visual AI", href: "/visual-ai", icon: ImageIcon },
  { label: "Generator", href: "/generator", icon: FileText },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 border-r border-slate-200 bg-white px-4 py-6">
      <div className="px-3">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
          SKP-CIDB
        </p>
        <h1 className="mt-2 text-xl font-bold text-slate-900">Builder</h1>
      </div>

      <nav className="mt-8 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition",
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              ].join(" ")}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
