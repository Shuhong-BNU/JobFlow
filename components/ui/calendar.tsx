'use client';

/**
 * 自写的极小月视图，用来替代浏览器原生 date input 跨语言的 placeholder 混乱。
 * 只覆盖 MVP 需要的能力：按月翻页、点选一个日期。无 range、无多选、无键盘导航。
 * 文案（月名 / 星期名）走字典，保证中英一致。
 */

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useT, useLocale } from '@/lib/i18n/client';

type Props = {
  /** 选中的日期；未选则传 undefined。 */
  value?: Date;
  /** 点选某天时回调。传回的是本地时区的 `YYYY-MM-DD 00:00:00`。 */
  onSelect?: (date: Date) => void;
  className?: string;
};

const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
const MONTH_KEYS = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
] as const;

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function Calendar({ value, onSelect, className }: Props) {
  const t = useT();
  const locale = useLocale();
  const today = React.useMemo(() => new Date(), []);
  const [view, setView] = React.useState<Date>(() =>
    startOfMonth(value ?? today)
  );

  // value 变化时（比如外部清空/重设），视图跟随跳转。
  React.useEffect(() => {
    if (value) setView(startOfMonth(value));
  }, [value]);

  const year = view.getFullYear();
  const month = view.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = first.getDay(); // 0=周日
  const cells: Array<Date | null> = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel =
    locale === 'zh'
      ? `${year} 年 ${month + 1} 月`
      : `${t.calendar.months[MONTH_KEYS[month]!]} ${year}`;

  return (
    <div className={cn('w-[17rem] select-none', className)}>
      <div className="mb-2 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setView(new Date(year, month - 1, 1))}
          aria-label={t.calendar.prevMonth}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-medium">{monthLabel}</div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setView(new Date(year, month + 1, 1))}
          aria-label={t.calendar.nextMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center text-[11px] text-muted-foreground">
        {WEEKDAY_KEYS.map((k) => (
          <div key={k} className="py-1">
            {t.calendar.weekdaysShort[k]}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell) return <div key={i} className="h-8 w-8" />;
          const selected = value ? isSameDay(cell, value) : false;
          const current = isSameDay(cell, today);
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelect?.(cell)}
              className={cn(
                'mx-auto grid h-8 w-8 place-items-center rounded-md text-sm outline-none transition-colors',
                'hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring',
                selected && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
                !selected && current && 'border border-primary/50'
              )}
            >
              {cell.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
