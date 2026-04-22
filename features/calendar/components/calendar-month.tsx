'use client';

import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import {
  addMonths,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  addDays,
  isToday,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useT, useLocale } from '@/lib/i18n/client';
import type { EventType } from '@/lib/enums';
import type { CalendarItem } from '../queries';

/**
 * 月视图 v1。
 *
 * - 导航：`?m=yyyy-mm` 控制当前月；上/下月按钮更新 URL；「今天」按钮清掉 m 参数。
 * - 网格：从本月首日所在周的周一起算，画 6 行 × 7 列 = 42 格；
 *   第 6 行兜住"一个月能占满 6 周（如 2024-06）"的边界。
 * - 每格展示最多 3 条条目；超过时展示 "+N"。条目点击跳到申请详情。
 *
 * 交互刻意保守：v1 不做拖拽改期、不做事件面板，只求"节奏一眼看清"。
 */
export function CalendarMonth({
  anchorISO,
  items,
}: {
  /** 服务端已经解析好的"当前月锚点"日期 ISO，例如 2026-04-01 */
  anchorISO: string;
  items: CalendarItem[];
}) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const anchor = new Date(anchorISO);
  const monthStart = startOfMonth(anchor);
  // 周起点：锁成周一，贴合国内日历习惯。
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });

  // 按 yyyy-MM-dd 分桶
  const bucket = new Map<string, CalendarItem[]>();
  for (const it of items) {
    const k = format(it.at, 'yyyy-MM-dd');
    const arr = bucket.get(k) ?? [];
    arr.push(it);
    bucket.set(k, arr);
  }

  const cells: Date[] = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  function gotoMonth(delta: number) {
    const next = addMonths(anchor, delta);
    const qs = new URLSearchParams(params.toString());
    qs.set('m', format(next, 'yyyy-MM'));
    startTransition(() => router.push(`${pathname}?${qs.toString()}`));
  }

  function gotoToday() {
    const qs = new URLSearchParams(params.toString());
    qs.delete('m');
    startTransition(() =>
      router.push(qs.toString() ? `${pathname}?${qs.toString()}` : pathname)
    );
  }

  const monthTitle = (() => {
    const monthKey = format(anchor, 'MMM').toLowerCase() as keyof typeof t.calendar.months;
    const monthLabel = t.calendar.months[monthKey] ?? format(anchor, 'MMM');
    const year = format(anchor, 'yyyy');
    return locale === 'zh' ? `${year} 年 ${monthLabel}` : `${monthLabel} ${year}`;
  })();

  const weekdays: (keyof typeof t.calendar.weekdaysShort)[] = [
    'mon',
    'tue',
    'wed',
    'thu',
    'fri',
    'sat',
    'sun',
  ];

  return (
    <div className="rounded-lg border bg-card">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between gap-3 border-b p-3">
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            aria-label={t.calendar.prevMonth}
            onClick={() => gotoMonth(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            aria-label={t.calendar.nextMonth}
            onClick={() => gotoMonth(1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={gotoToday}>
            {t.calendarPage.today}
          </Button>
        </div>
        <h2 className="text-lg font-semibold">{monthTitle}</h2>
      </div>

      {/* 周表头 */}
      <div className="grid grid-cols-7 border-b text-xs font-medium text-muted-foreground">
        {weekdays.map((w) => (
          <div key={w} className="px-2 py-2 text-center">
            {t.calendar.weekdaysShort[w]}
          </div>
        ))}
      </div>

      {/* 网格 */}
      <div className="grid grid-cols-7 auto-rows-fr">
        {cells.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayItems = bucket.get(key) ?? [];
          const inMonth = isSameMonth(day, anchor);
          const today = isToday(day);

          return (
            <div
              key={key}
              className={cn(
                'min-h-[110px] border-b border-r p-1.5 text-xs',
                !inMonth && 'bg-muted/30 text-muted-foreground'
              )}
            >
              <div className="mb-1 flex items-center justify-between">
                <span
                  className={cn(
                    'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-medium',
                    today && 'bg-primary text-primary-foreground'
                  )}
                >
                  {format(day, 'd')}
                </span>
              </div>
              <div className="space-y-0.5">
                {dayItems.slice(0, 3).map((item) => (
                  <Pill key={item.key} item={item} />
                ))}
                {dayItems.length > 3 && (
                  <p className="px-1 text-[10px] text-muted-foreground">
                    +{dayItems.length - 3}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 图例 */}
      <div className="flex flex-wrap items-center gap-3 border-t p-3 text-[11px] text-muted-foreground">
        {(
          [
            'deadline',
            'oa',
            'interview',
            'offer_response',
            'custom',
          ] as EventType[]
        ).map((e) => (
          <div key={e} className="inline-flex items-center gap-1.5">
            <span className={cn('h-2 w-2 rounded-full', TYPE_DOT[e])} />
            <span>{t.eventType[e]}</span>
          </div>
        ))}
      </div>
    </div>
  );

}

function Pill({ item }: { item: CalendarItem }) {
  const t = useT();
  return (
    <Link
      href={`/app/applications/${item.applicationId}`}
      title={`${t.eventType[item.eventType]}: ${item.title} · ${item.companyName}`}
      className={cn(
        'block truncate rounded px-1.5 py-0.5 text-[10px] font-medium text-white hover:brightness-110',
        TYPE_BG[item.eventType]
      )}
    >
      {item.title}
    </Link>
  );
}

/** 颜色表：与 status tone 呼应但不完全一致 —— 日历要更鲜，才能一眼看见。 */
const TYPE_BG: Record<EventType, string> = {
  deadline: 'bg-rose-500 dark:bg-rose-700',
  oa: 'bg-amber-500 dark:bg-amber-700',
  interview: 'bg-purple-500 dark:bg-purple-700',
  offer_response: 'bg-emerald-500 dark:bg-emerald-700',
  custom: 'bg-slate-500 dark:bg-slate-600',
};

const TYPE_DOT: Record<EventType, string> = {
  deadline: 'bg-rose-500',
  oa: 'bg-amber-500',
  interview: 'bg-purple-500',
  offer_response: 'bg-emerald-500',
  custom: 'bg-slate-500',
};
