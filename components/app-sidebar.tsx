'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Briefcase,
  Calendar,
  KanbanSquare,
  LayoutDashboard,
  ListChecks,
  PackageOpen,
  Settings,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n/client';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  comingSoon?: boolean;
};

export function AppSidebar() {
  const pathname = usePathname();
  const t = useT();

  const PRIMARY: NavItem[] = [
    { href: '/app', label: t.shell.nav.dashboard, icon: LayoutDashboard },
    { href: '/app/board', label: t.shell.nav.board, icon: KanbanSquare },
    { href: '/app/list', label: t.shell.nav.list, icon: ListChecks },
  ];
  const SECONDARY: NavItem[] = [
    { href: '/app/calendar', label: t.shell.nav.calendar, icon: Calendar },
    { href: '/app/materials', label: t.shell.nav.materials, icon: PackageOpen },
    { href: '/app/offers', label: t.shell.nav.offers, icon: Trophy },
    { href: '/app/analytics', label: t.shell.nav.analytics, icon: BarChart3 },
  ];
  const TERTIARY: NavItem[] = [
    { href: '/app/ai', label: t.shell.nav.aiInbox, icon: Sparkles, comingSoon: true },
    { href: '/app/settings', label: t.shell.nav.settings, icon: Settings, comingSoon: true },
  ];

  return (
    <aside className="hidden w-60 shrink-0 border-r bg-muted/20 md:block">
      <div className="flex h-16 items-center gap-2 border-b px-5 text-base font-semibold">
        <Briefcase className="h-5 w-5 text-primary" />
        {t.shell.brand}
      </div>
      <nav className="flex flex-col gap-6 p-3 text-sm">
        <NavGroup items={PRIMARY} pathname={pathname} soonLabel={t.shell.nav.soon} />
        <NavGroup
          label={t.shell.nav.groupPhase2}
          items={SECONDARY}
          pathname={pathname}
          soonLabel={t.shell.nav.soon}
        />
        <NavGroup
          label={t.shell.nav.groupPhase3}
          items={TERTIARY}
          pathname={pathname}
          soonLabel={t.shell.nav.soon}
        />
      </nav>
    </aside>
  );
}

function NavGroup({
  items,
  pathname,
  label,
  soonLabel,
}: {
  items: NavItem[];
  pathname: string;
  label?: string;
  soonLabel: string;
}) {
  return (
    <div className="space-y-1">
      {label && (
        <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      )}
      {items.map((item) => {
        const active =
          item.href === '/app' ? pathname === '/app' : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
              active && 'bg-accent text-foreground'
            )}
          >
            <item.icon className="h-4 w-4" />
            <span className="flex-1">{item.label}</span>
            {item.comingSoon && (
              <span className="rounded bg-muted px-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                {soonLabel}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
