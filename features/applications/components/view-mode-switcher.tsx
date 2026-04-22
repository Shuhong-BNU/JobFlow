'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { GitBranch, LayoutList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n/client';

export type ListViewMode = 'table' | 'progress';

/**
 * List 页的视图切换器。走 URL query（?view=progress），与 FilterBar 的
 * 其它 param 一起持久化在 URL 里，不新建路由层级。
 * 没设置 view 参数时默认 table，避免首次进入变成进度视图（破坏老用户预期）。
 */
export function ViewModeSwitcher() {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const current: ListViewMode = params.get('view') === 'progress' ? 'progress' : 'table';

  function pushView(next: ListViewMode) {
    if (next === current) return;
    const qs = new URLSearchParams(params.toString());
    if (next === 'table') {
      qs.delete('view');
    } else {
      qs.set('view', next);
    }
    const s = qs.toString();
    startTransition(() => router.replace(s ? `${pathname}?${s}` : pathname));
  }

  const items: { mode: ListViewMode; label: string; Icon: typeof LayoutList }[] = [
    { mode: 'table', label: t.list.view.table, Icon: LayoutList },
    { mode: 'progress', label: t.list.view.progress, Icon: GitBranch },
  ];

  return (
    <div
      className="inline-flex items-center gap-1 rounded-md border bg-card p-0.5"
      role="tablist"
      aria-label={t.list.view.label}
    >
      {items.map(({ mode, label, Icon }) => {
        const active = mode === current;
        return (
          <button
            key={mode}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => pushView(mode)}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded px-2.5 text-xs font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
