"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BriefcaseBusiness, LayoutDashboard, LineChart, CalendarDays, FolderKanban, Files, Settings, HandCoins } from "lucide-react";
import { navItems } from "@/lib/constants";
import { cn } from "@/lib/utils";

const iconMap = {
  "/dashboard": LayoutDashboard,
  "/applications": FolderKanban,
  "/calendar": CalendarDays,
  "/materials": Files,
  "/offers": HandCoins,
  "/analytics": LineChart,
  "/settings": Settings,
} as const;

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="surface-soft hidden min-h-[calc(100vh-2rem)] w-72 flex-col rounded-[32px] px-5 py-6 lg:flex">
      <Link href="/dashboard" className="flex items-center gap-3 px-2">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
          <BriefcaseBusiness className="size-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            JobFlow
          </p>
          <p className="text-sm text-muted-foreground">求职申请管理看板</p>
        </div>
      </Link>

      <div className="mt-10 space-y-2">
        {navItems.map((item) => {
          const Icon = iconMap[item.href];
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/15"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto rounded-[28px] bg-gradient-to-br from-primary/12 to-transparent px-4 py-5">
        <p className="text-sm font-semibold">Phase 1 已就位</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          先把申请录入、状态推进、截止提醒和总览面板做好，再往上叠 AI 与自动化。
        </p>
      </div>
    </aside>
  );
}
