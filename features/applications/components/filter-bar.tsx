'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useRef, useTransition } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { APPLICATION_STATUSES, PRIORITIES } from '@/lib/enums';
import { useT } from '@/lib/i18n/client';

export function FilterBar() {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const q = params.get('q') ?? '';
  const status = params.get('status') ?? 'all';
  const priority = params.get('priority') ?? 'all';
  const sort = params.get('sort') ?? 'updated_desc';

  function pushParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (!value || value === 'all' || value === '') {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname));
  }

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  function onSearchChange(v: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => pushParam('q', v), 250);
  }

  const hasFilters = q || status !== 'all' || priority !== 'all' || sort !== 'updated_desc';

  const SORTS: { value: string; label: string }[] = [
    { value: 'updated_desc', label: t.filterBar.sortOptions.updatedDesc },
    { value: 'created_desc', label: t.filterBar.sortOptions.createdDesc },
    { value: 'deadline_asc', label: t.filterBar.sortOptions.deadlineAsc },
    { value: 'deadline_desc', label: t.filterBar.sortOptions.deadlineDesc },
  ];

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-3">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          key={q}
          defaultValue={q}
          placeholder={t.filterBar.searchPlaceholder}
          className="pl-9"
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <SelectGroup
        label={t.filterBar.status}
        value={status}
        onChange={(v) => pushParam('status', v)}
        options={[
          { value: 'all', label: t.filterBar.allStatuses },
          ...APPLICATION_STATUSES.map((s) => ({ value: s, label: t.status[s] })),
        ]}
      />
      <SelectGroup
        label={t.filterBar.priority}
        value={priority}
        onChange={(v) => pushParam('priority', v)}
        options={[
          { value: 'all', label: t.filterBar.any },
          ...PRIORITIES.map((p) => ({ value: p, label: t.priority[p] })),
        ]}
      />
      <SelectGroup
        label={t.filterBar.sort}
        value={sort}
        onChange={(v) => pushParam('sort', v)}
        options={SORTS}
      />
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.replace(pathname)}
          className="h-9"
        >
          <X className="mr-1 h-3.5 w-3.5" /> {t.filterBar.clear}
        </Button>
      )}
    </div>
  );
}

function SelectGroup({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="min-w-[160px] space-y-1">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
