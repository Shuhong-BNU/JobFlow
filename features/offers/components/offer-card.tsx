'use client';

import Link from 'next/link';
import { ArrowRight, CalendarClock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useT, useLocale } from '@/lib/i18n/client';
import { formatDate, isOverdue, relativeFromNow } from '@/lib/date';
import { cn } from '@/lib/utils';
import { DecisionPill } from './offer-panel';
import type { OfferRow } from '../queries';

/**
 * Offers 总览页里的单个 offer 卡。点击直接跳到所属 application 详情 Offer tab。
 * 不做内嵌编辑 —— 详情页 Offer tab 已经承担编辑职责，避免两套入口。
 */
export function OfferCard({ offer }: { offer: OfferRow }) {
  const t = useT();
  const locale = useLocale();
  const overdue = offer.decisionStatus === 'pending' && isOverdue(offer.responseDeadlineAt);

  return (
    <Link
      href={`/app/applications/${offer.applicationId}?tab=offer`}
      className="block focus:outline-none"
    >
      <Card className="transition-colors hover:bg-accent/30">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{offer.companyName}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {offer.applicationTitle}
              </p>
            </div>
            <DecisionPill decision={offer.decisionStatus} />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <KV label={t.offers.fields.baseSalary} value={offer.baseSalary} />
            <KV label={t.offers.fields.bonus} value={offer.bonus} />
            <KV label={t.offers.fields.location} value={offer.location} />
            <KV label={t.offers.fields.team} value={offer.team} />
          </div>

          <div className="flex items-center justify-between gap-2 border-t pt-3 text-xs">
            <div
              className={cn(
                'flex items-center gap-1 text-muted-foreground',
                overdue && 'text-destructive'
              )}
            >
              {offer.responseDeadlineAt && (
                <>
                  <CalendarClock className="h-3.5 w-3.5" />
                  <span>
                    {t.offers.fields.responseDeadlineAt}:{' '}
                    {formatDate(offer.responseDeadlineAt, undefined, locale)}
                    {' · '}
                    {relativeFromNow(offer.responseDeadlineAt, locale)}
                  </span>
                </>
              )}
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function KV({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="min-w-0 space-y-0.5">
      <p className="truncate text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={cn('truncate', !value && 'text-muted-foreground')}>{value || '-'}</p>
    </div>
  );
}
