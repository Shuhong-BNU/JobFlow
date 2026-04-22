import Link from 'next/link';
import { requireUser } from '@/lib/auth-helpers';
import {
  listApplications,
  listApplicationsWithEvents,
} from '@/features/applications/queries';
import { listFiltersSchema } from '@/features/applications/schema';
import { FilterBar } from '@/features/applications/components/filter-bar';
import {
  ViewModeSwitcher,
  type ListViewMode,
} from '@/features/applications/components/view-mode-switcher';
import { ProgressRow } from '@/features/applications/components/progress-row';
import { StatusBadge, PriorityBadge } from '@/components/status-badge';
import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDateShort, isOverdue, relativeFromNow } from '@/lib/date';
import { cn } from '@/lib/utils';
import { getServerDictionary, getLocale } from '@/lib/i18n/server';

export default async function ListPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const user = await requireUser();
  const t = getServerDictionary();
  const locale = getLocale();
  const filters = listFiltersSchema.parse({
    q: typeof searchParams.q === 'string' ? searchParams.q : undefined,
    status: typeof searchParams.status === 'string' ? searchParams.status : undefined,
    priority: typeof searchParams.priority === 'string' ? searchParams.priority : undefined,
    sort: typeof searchParams.sort === 'string' ? searchParams.sort : undefined,
  });

  // view 不进 zod —— 它只影响渲染方式，不影响数据筛选，走 page 级 narrow 就够了
  const view: ListViewMode = searchParams.view === 'progress' ? 'progress' : 'table';

  // 进度视图要额外的 events；普通表格不拉，省一次 batch 查询
  const { cards, eventsByApplicationId } =
    view === 'progress'
      ? await listApplicationsWithEvents(user.id, filters)
      : { cards: await listApplications(user.id, filters), eventsByApplicationId: new Map() };

  return (
    <div className="px-6 py-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t.list.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.list.subtitle}</p>
        </div>
        <ViewModeSwitcher />
      </header>

      <div className="space-y-4">
        <FilterBar />
        {cards.length === 0 ? (
          <EmptyState
            title={t.list.empty.title}
            description={t.list.empty.desc}
            action={
              <Button asChild>
                <Link href="/app/applications/new">{t.list.empty.action}</Link>
              </Button>
            }
          />
        ) : view === 'progress' ? (
          <div className="space-y-3">
            {cards.map((card) => (
              <ProgressRow
                key={card.id}
                card={card}
                events={eventsByApplicationId.get(card.id) ?? []}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.list.table.company}</TableHead>
                  <TableHead>{t.list.table.title}</TableHead>
                  <TableHead>{t.list.table.status}</TableHead>
                  <TableHead>{t.list.table.priority}</TableHead>
                  <TableHead>{t.list.table.deadline}</TableHead>
                  <TableHead>{t.list.table.updated}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cards.map((row) => (
                  <TableRow key={row.id} className="cursor-pointer">
                    <TableCell className="font-medium">
                      <Link href={`/app/applications/${row.id}`}>{row.companyName}</Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/app/applications/${row.id}`}>{row.title}</Link>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={row.currentStatus} />
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={row.priority} />
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-sm',
                        isOverdue(row.deadlineAt) && 'text-destructive'
                      )}
                    >
                      {row.deadlineAt
                        ? `${formatDateShort(row.deadlineAt, locale)} · ${relativeFromNow(row.deadlineAt, locale)}`
                        : t.common.dash}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {relativeFromNow(row.updatedAt, locale)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
