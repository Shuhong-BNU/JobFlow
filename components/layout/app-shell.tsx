import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { navItems } from "@/lib/constants";
import Link from "next/link";
import { requireUser } from "@/server/permissions";
import { cn } from "@/lib/utils";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="page-shell py-4 lg:py-5">
      <div className="grid gap-4 lg:grid-cols-[288px_minmax(0,1fr)]">
        <AppSidebar />
        <div className="space-y-4">
          <AppHeader userName={user.name} />
          <main className="space-y-4">{children}</main>
        </div>
      </div>

      <nav className="surface-soft fixed inset-x-4 bottom-4 z-30 grid grid-cols-4 rounded-[24px] px-3 py-2 lg:hidden">
        {navItems.slice(0, 4).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-2xl px-3 py-3 text-center text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            )}
          >
            {item.shortLabel}
          </Link>
        ))}
      </nav>
    </div>
  );
}
