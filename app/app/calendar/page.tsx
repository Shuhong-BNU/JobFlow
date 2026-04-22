import { addMonths, format, startOfMonth } from 'date-fns';
import { requireUser } from '@/lib/auth-helpers';
import { listCalendarItems } from '@/features/calendar/queries';
import { CalendarMonth } from '@/features/calendar/components/calendar-month';
import { getServerDictionary } from '@/lib/i18n/server';

/**
 * 解析 `?m=yyyy-MM` 为月份锚点。非法值/缺省值一律回退到当月，保证 URL 脏数据
 * 不会 404。
 */
function resolveAnchor(param: string | undefined): Date {
  if (!param) return startOfMonth(new Date());
  const m = /^(\d{4})-(\d{2})$/.exec(param);
  if (!m) return startOfMonth(new Date());
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (month < 1 || month > 12) return startOfMonth(new Date());
  return new Date(year, month - 1, 1);
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const user = await requireUser();
  const t = getServerDictionary();

  const mParam = typeof searchParams.m === 'string' ? searchParams.m : undefined;
  const anchor = resolveAnchor(mParam);
  const from = anchor;
  const to = addMonths(anchor, 1);

  const items = await listCalendarItems(user.id, from, to);

  return (
    <div className="px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{t.calendarPage.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.calendarPage.subtitle}</p>
      </header>

      <CalendarMonth anchorISO={format(anchor, 'yyyy-MM-dd')} items={items} />
    </div>
  );
}
