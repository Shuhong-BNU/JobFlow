'use client';

import { useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { MATERIAL_TYPES, type MaterialType } from '@/lib/enums';
import { useT } from '@/lib/i18n/client';

/**
 * 材料库顶部的 type 过滤 chips。URL 驱动：?type=resume；"全部"对应无参数。
 * 不持久到 cookie / localStorage，保持与列表 / 看板的过滤风格一致。
 */
export function MaterialTypeFilter({ active }: { active: MaterialType | null }) {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function go(next: MaterialType | null) {
    const sp = new URLSearchParams(params.toString());
    if (next) sp.set('type', next);
    else sp.delete('type');
    const qs = sp.toString();
    startTransition(() => {
      router.replace(qs ? `/app/materials?${qs}` : '/app/materials');
    });
  }

  return (
    <div className={cn('flex flex-wrap gap-1.5', pending && 'opacity-70')}>
      <Chip label={t.materialsPage.filter.all} active={active === null} onClick={() => go(null)} />
      {MATERIAL_TYPES.map((m) => (
        <Chip
          key={m}
          label={t.materialType[m]}
          active={active === m}
          onClick={() => go(m)}
        />
      ))}
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1 text-xs transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-transparent bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
      )}
    >
      {label}
    </button>
  );
}
