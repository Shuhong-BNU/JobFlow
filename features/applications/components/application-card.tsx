'use client';

import Link from 'next/link';
import { CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PriorityBadge } from '@/components/status-badge';
import { formatDateShort, isOverdue, relativeFromNow } from '@/lib/date';
import { useLocale } from '@/lib/i18n/client';
import type { ApplicationCard as Card } from '../queries';

export function ApplicationCardView({
  card,
  dragging,
  asLink = true,
}: {
  card: Card;
  dragging?: boolean;
  asLink?: boolean;
}) {
  const locale = useLocale();
  const overdue = isOverdue(card.deadlineAt);
  const inner = (
    <div
      className={cn(
        'rounded-md border bg-card p-3 shadow-sm transition-colors',
        dragging && 'shadow-lg ring-2 ring-primary',
        !dragging && 'hover:border-primary/50'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{card.companyName}</p>
          <p className="mt-0.5 truncate text-sm font-medium">{card.title}</p>
        </div>
        <PriorityBadge priority={card.priority} />
      </div>

      {(card.deadlineAt || card.location) && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {card.deadlineAt && (
            <span
              className={cn('inline-flex items-center gap-1', overdue && 'text-destructive')}
            >
              <CalendarClock className="h-3 w-3" />
              {formatDateShort(card.deadlineAt, locale)} · {relativeFromNow(card.deadlineAt, locale)}
            </span>
          )}
          {card.location && <span className="truncate">{card.location}</span>}
        </div>
      )}
    </div>
  );

  if (!asLink) return inner;
  return (
    <Link href={`/app/applications/${card.id}`} className="block focus:outline-none">
      {inner}
    </Link>
  );
}
