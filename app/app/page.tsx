import Link from 'next/link';
import { AlertTriangle, CalendarClock, ListChecks, Sparkles } from 'lucide-react';
import { requireUser } from '@/lib/auth-helpers';
import {
  getRecentlyUpdated,
  getStatusCounts,
  getUpcomingDeadlines,
} from '@/features/applications/queries';
import { getRiskItems, getUpcomingEvents } from '@/features/dashboard/queries';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/status-badge';
import { EmptyState } from '@/components/empty-state';
import { formatDateShort, formatDateTime, isOverdue, relativeFromNow } from '@/lib/date';
import { cn } from '@/lib/utils';
import { APPLICATION_STATUSES } from '@/lib/enums';
import { getServerDictionary, getLocale } from '@/lib/i18n/server';

const ACTIVE_STATUSES = ['applied', 'oa', 'interview', 'hr'] as const;

export default async function DashboardPage() {
  const user = await requireUser();
  const t = getServerDictionary();
  const locale = getLocale();
  const [counts, deadlines, events, risks, recents] = await Promise.all([
    getStatusCounts(user.id),
    getUpcomingDeadlines(user.id, 7),
    getUpcomingEvents(user.id, 14),
    getRiskItems(user.id),
    getRecentlyUpdated(user.id, 5),
  ]);

  const countMap = new Map(counts.map((c) => [c.status, c.count] as const));
  const total = counts.reduce((acc, c) => acc + c.count, 0);
  const active = ACTIVE_STATUSES.reduce((acc, s) => acc + (countMap.get(s) ?? 0), 0);
  const offers = countMap.get('offer') ?? 0;
  const rejected = countMap.get('rejected') ?? 0;

  const firstName = user.name?.split(' ')[0];
  const greeting = firstName
    ? t.dashboard.greeting.replace('{name}', firstName)
    : t.dashboard.greetingFallback;

  return (
    <div className="px-6 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">{greeting}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.dashboard.subtitle}</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t.dashboard.stats.tracked} value={total} />
        <Stat label={t.dashboard.stats.inProgress} value={active} />
        <Stat label={t.dashboard.stats.offers} value={offers} tone="positive" />
        <Stat label={t.dashboard.stats.rejected} value={rejected} tone="muted" />
      </section>

      <section className="mt-6">
        <FunnelStrip counts={countMap} labels={t.status} />
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="space-y-4 p-6">
            <SectionHeader
              icon={CalendarClock}
              title={t.dashboard.thisWeek.title}
              description={t.dashboard.thisWeek.desc}
            />
            {deadlines.length === 0 && events.length === 0 ? (
              <EmptyState
                title={t.dashboard.thisWeek.quietTitle}
                description={t.dashboard.thisWeek.quietDesc}
              />
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t.dashboard.thisWeek.deadlinesTitle}
                  </p>
                  <ul className="space-y-2">
                    {deadlines.length === 0 && (
                      <li className="text-sm text-muted-foreground">
                        {t.dashboard.thisWeek.noDeadlines}
                      </li>
                    )}
                    {deadlines.map((d) => (
                      <li key={d.id}>
                        <Link
                          href={`/app/applications/${d.id}`}
                          className="flex items-center justify-between rounded-md border bg-card p-3 hover:border-primary/40"
                        >
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">{d.companyName}</p>
                            <p className="truncate text-sm font-medium">{d.title}</p>
                          </div>
                          <span
                            className={cn(
                              'text-xs',
                              isOverdue(d.deadlineAt)
                                ? 'text-destructive'
                                : 'text-muted-foreground'
                            )}
                          >
                            {d.deadlineAt
                              ? `${formatDateShort(d.deadlineAt, locale)} · ${relativeFromNow(d.deadlineAt, locale)}`
                              : ''}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t.dashboard.thisWeek.eventsTitle}
                  </p>
                  <ul className="space-y-2">
                    {events.length === 0 && (
                      <li className="text-sm text-muted-foreground">
                        {t.dashboard.thisWeek.noEvents}
                      </li>
                    )}
                    {events.map((e) => (
                      <li key={e.id}>
                        <Link
                          href={`/app/applications/${e.applicationId}`}
                          className="flex items-center justify-between rounded-md border bg-card p-3 hover:border-primary/40"
                        >
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">
                              {e.companyName} · {t.eventType[e.eventType]}
                            </p>
                            <p className="truncate text-sm font-medium">{e.title}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(e.startsAt, locale)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-3 p-6">
              <SectionHeader
                icon={AlertTriangle}
                title={t.dashboard.risks.title}
                description={t.dashboard.risks.desc}
              />
              {risks.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t.dashboard.risks.empty}</p>
              ) : (
                <ul className="space-y-2">
                  {risks.map((r) => (
                    <li key={r.id}>
                      <Link
                        href={`/app/applications/${r.id}`}
                        className="flex items-center justify-between rounded-md border bg-card p-3 hover:border-primary/40"
                      >
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">{r.companyName}</p>
                          <p className="truncate text-sm font-medium">{r.title}</p>
                        </div>
                        <span
                          className={cn(
                            'text-xs',
                            isOverdue(r.deadlineAt)
                              ? 'text-destructive'
                              : 'text-muted-foreground'
                          )}
                        >
                          {r.deadlineAt ? relativeFromNow(r.deadlineAt, locale) : ''}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-6">
              <SectionHeader
                icon={ListChecks}
                title={t.dashboard.recents.title}
                description={t.dashboard.recents.desc}
              />
              {recents.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t.dashboard.recents.empty}</p>
              ) : (
                <ul className="space-y-2">
                  {recents.map((r) => (
                    <li key={r.id}>
                      <Link
                        href={`/app/applications/${r.id}`}
                        className="flex items-center justify-between rounded-md border bg-card p-3 hover:border-primary/40"
                      >
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">{r.companyName}</p>
                          <p className="truncate text-sm font-medium">{r.title}</p>
                        </div>
                        <StatusBadge status={r.currentStatus} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <p className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="h-3 w-3" />
        {t.dashboard.aiHint}
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: 'positive' | 'muted';
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p
          className={cn(
            'mt-1 text-3xl font-semibold',
            tone === 'positive' && 'text-emerald-600 dark:text-emerald-400',
            tone === 'muted' && 'text-muted-foreground'
          )}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function FunnelStrip({
  counts,
  labels,
}: {
  counts: Map<string, number>;
  labels: Record<(typeof APPLICATION_STATUSES)[number], string>;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-lg border bg-card p-3 text-xs sm:grid-cols-4 lg:grid-cols-8">
      {APPLICATION_STATUSES.map((s) => (
        <div key={s} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
          <span className="text-muted-foreground">{labels[s]}</span>
          <span className="font-semibold">{counts.get(s) ?? 0}</span>
        </div>
      ))}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
