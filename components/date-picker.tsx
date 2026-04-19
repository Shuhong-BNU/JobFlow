'use client';

/**
 * 固定显示 yyyy-mm-dd 的日期输入。文本框 + 右侧按钮弹出月视图。
 * 可键盘输入任意字符串，真正的格式/合法性校验交给 zod (`optionalDate`)。
 * 不依赖 <input type="date"> 的浏览器本地化 placeholder，解决跨 locale "yyyy-mm-日"。
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
  ariaInvalid?: boolean;
};

function parseYmd(s: string): Date | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return undefined;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) {
    return undefined;
  }
  return dt;
}

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

export function DatePicker({
  name,
  value,
  onChange,
  onBlur,
  disabled,
  className,
  id,
  ariaInvalid,
}: Props) {
  const t = useT();
  const [open, setOpen] = React.useState(false);
  const selected = parseYmd(value);

  return (
    <div className={cn('relative', className)}>
      <Input
        id={id}
        name={name}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="yyyy-mm-dd"
        value={value}
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
            aria-label={t.calendar.pickDate}
            className="absolute right-0.5 top-1/2 h-9 w-9 -translate-y-1/2"
          >
            <CalendarDays className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end">
          <Calendar
            value={selected}
            onSelect={(d) => {
              onChange(toYmd(d));
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
