'use client';

/**
 * 固定显示 yyyy-mm-dd HH:mm 的日期时间输入。
 * 文本框 + 日历弹层（点选日期）+ 两个下拉（小时/分钟粒度 15 分钟）。
 * 时间粒度足够覆盖 MVP 的面试/OA 事件安排；不需要秒。
 */

import * as React from 'react';
import { CalendarDays } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n/client';

type Props = {
  name?: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  required?: boolean;
  ariaInvalid?: boolean;
};

/** 尝试解析 "yyyy-mm-dd HH:mm"；失败返回 undefined。 */
function parseDateTime(s: string): { date: Date; hh: string; mm: string } | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/.exec(s.trim());
  if (!m) return undefined;
  const [, yS, moS, dS, hS, miS] = m;
  const y = Number(yS);
  const mo = Number(moS);
  const d = Number(dS);
  const h = Number(hS);
  const mi = Number(miS);
  if (h > 23 || mi > 59) return undefined;
  const dt = new Date(y, mo - 1, d, h, mi);
  if (
    dt.getFullYear() !== y ||
    dt.getMonth() !== mo - 1 ||
    dt.getDate() !== d
  ) {
    return undefined;
  }
  return { date: dt, hh: hS!, mm: miS! };
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

const HOURS = Array.from({ length: 24 }, (_, i) => pad2(i));
const MINUTES = ['00', '15', '30', '45'];

function compose(dateYmd: string, hh: string, mm: string): string {
  return `${dateYmd} ${hh}:${mm}`;
}

function ymdOf(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function DateTimePicker({
  name,
  value,
  onChange,
  onBlur,
  disabled,
  className,
  id,
  required,
  ariaInvalid,
}: Props) {
  const t = useT();
  const [open, setOpen] = React.useState(false);
  const parsed = parseDateTime(value);

  // 弹层里的临时状态：如果 value 不可解析，给默认 09:00。
  const [draftDate, setDraftDate] = React.useState<Date | undefined>(parsed?.date);
  const [draftHour, setDraftHour] = React.useState<string>(parsed?.hh ?? '09');
  const [draftMinute, setDraftMinute] = React.useState<string>(
    parsed?.mm && MINUTES.includes(parsed.mm) ? parsed.mm : '00'
  );

  // 打开时用最新的 value 初始化一次，防止旧 draft 残留。
  React.useEffect(() => {
    if (!open) return;
    setDraftDate(parsed?.date);
    setDraftHour(parsed?.hh ?? '09');
    setDraftMinute(parsed?.mm && MINUTES.includes(parsed.mm) ? parsed.mm : '00');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function commit(date: Date, hh: string, mm: string) {
    onChange(compose(ymdOf(date), hh, mm));
  }

  return (
    <div className={cn('relative', className)}>
      <Input
        id={id}
        name={name}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="yyyy-mm-dd HH:mm"
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        className="pr-10"
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            aria-label={t.calendar.pickDateTime}
            className="absolute right-0.5 top-1/2 h-9 w-9 -translate-y-1/2"
          >
            <CalendarDays className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-auto">
          <Calendar
            value={draftDate}
            onSelect={(d) => {
              setDraftDate(d);
              commit(d, draftHour, draftMinute);
            }}
          />
          <div className="mt-3 flex items-center gap-2 border-t pt-3">
            <span className="text-xs text-muted-foreground">{t.calendar.time}</span>
            <Select
              value={draftHour}
              onValueChange={(v) => {
                setDraftHour(v);
                if (draftDate) commit(draftDate, v, draftMinute);
              }}
            >
              <SelectTrigger className="h-8 w-[72px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {HOURS.map((h) => (
                  <SelectItem key={h} value={h}>
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground">:</span>
            <Select
              value={draftMinute}
              onValueChange={(v) => {
                setDraftMinute(v);
                if (draftDate) commit(draftDate, draftHour, v);
              }}
            >
              <SelectTrigger className="h-8 w-[72px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MINUTES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="ml-auto">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 px-2"
                onClick={() => setOpen(false)}
              >
                {t.calendar.done}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
