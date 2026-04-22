'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useT, useLocale } from '@/lib/i18n/client';
import { formatDate } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { OfferDecision } from '@/lib/enums';
import { OfferForm } from './offer-form';
import { deleteOffer } from '../actions';
import type { OfferFormInput } from '../schema';

/**
 * 详情页 Offer tab 的主容器。三态：
 *  - 没 offer：显示"添加 offer"按钮，点击切到表单。
 *  - 有 offer（非编辑）：概览 + 编辑 / 删除按钮。
 *  - 编辑模式：展开表单，取消可回到概览。
 * 复用 offer-form，不做两套 UI。
 */
export function OfferPanel({
  applicationId,
  offer,
}: {
  applicationId: string;
  offer: {
    baseSalary: string | null;
    bonus: string | null;
    location: string | null;
    team: string | null;
    responseDeadlineAt: Date | null;
    decisionStatus: OfferDecision;
    pros: string | null;
    cons: string | null;
  } | null;
}) {
  const t = useT();
  const [mode, setMode] = useState<'view' | 'edit'>(offer ? 'view' : 'edit');
  const [creating, setCreating] = useState(!offer);

  // 没 offer 且用户还没点"添加"按钮：先展示空态
  if (!offer && !creating) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
          <p className="text-sm text-muted-foreground">{t.offers.empty.desc}</p>
          <Button onClick={() => setCreating(true)}>
            <Plus className="mr-1 h-4 w-4" /> {t.offers.empty.action}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (mode === 'edit' || !offer) {
    return (
      <Card>
        <CardContent className="p-6">
          <OfferForm
            applicationId={applicationId}
            defaultValues={offer ? toDefaults(offer) : undefined}
            onDone={() => {
              setMode('view');
              setCreating(true); // 已经有 offer，不会再回空态
            }}
          />
        </CardContent>
      </Card>
    );
  }

  return <OfferView applicationId={applicationId} offer={offer} onEdit={() => setMode('edit')} />;
}

function toDefaults(offer: NonNullable<Parameters<typeof OfferPanel>[0]['offer']>): Partial<OfferFormInput> {
  return {
    baseSalary: offer.baseSalary ?? '',
    bonus: offer.bonus ?? '',
    location: offer.location ?? '',
    team: offer.team ?? '',
    responseDeadlineAt: offer.responseDeadlineAt ?? undefined,
    decisionStatus: offer.decisionStatus,
    pros: offer.pros ?? '',
    cons: offer.cons ?? '',
  };
}

function OfferView({
  applicationId,
  offer,
  onEdit,
}: {
  applicationId: string;
  offer: NonNullable<Parameters<typeof OfferPanel>[0]['offer']>;
  onEdit: () => void;
}) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onDelete() {
    if (!confirm(t.offers.confirmDelete)) return;
    startTransition(async () => {
      const result = await deleteOffer(applicationId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(t.offers.toast.deleted);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="space-y-5 p-6">
        <div className="flex items-start justify-between gap-3">
          <DecisionPill decision={offer.decisionStatus} />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Pencil className="mr-1 h-3.5 w-3.5" /> {t.detail.edit}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={onDelete}
              disabled={pending}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" /> {t.detail.delete}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <KV label={t.offers.fields.baseSalary} value={offer.baseSalary} />
          <KV label={t.offers.fields.bonus} value={offer.bonus} />
          <KV label={t.offers.fields.location} value={offer.location} />
          <KV label={t.offers.fields.team} value={offer.team} />
          <KV
            label={t.offers.fields.responseDeadlineAt}
            value={
              offer.responseDeadlineAt
                ? formatDate(offer.responseDeadlineAt, undefined, locale)
                : null
            }
          />
        </div>

        {(offer.pros || offer.cons) && (
          <div className="grid gap-4 sm:grid-cols-2">
            <KV label={t.offers.fields.pros} value={offer.pros} multiline />
            <KV label={t.offers.fields.cons} value={offer.cons} multiline />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function KV({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string | null | undefined;
  multiline?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={cn('text-sm', multiline && 'whitespace-pre-wrap', !value && 'text-muted-foreground')}>
        {value || '-'}
      </p>
    </div>
  );
}

/** 决策徽章。颜色借用 Tailwind 色板，与 APPLICATION_STATUS_TONE 同风格。 */
function DecisionPill({ decision }: { decision: OfferDecision }) {
  const t = useT();
  const tone: Record<OfferDecision, string> = {
    pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
    accepted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200',
    declined: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300',
    expired: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-200',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        tone[decision]
      )}
    >
      {t.offers.decision[decision]}
    </span>
  );
}

export { DecisionPill };
