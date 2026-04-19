'use client';
import { cn } from '@/lib/utils';
import {
  APPLICATION_STATUS_TONE,
  PRIORITY_TONE,
  type ApplicationStatus,
  type Priority,
} from '@/lib/enums';
import { useT } from '@/lib/i18n/client';

export function StatusBadge({
  status,
  className,
}: {
  status: ApplicationStatus;
  className?: string;
}) {
  const t = useT();
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        APPLICATION_STATUS_TONE[status],
        className
      )}
    >
      {t.status[status]}
    </span>
  );
}

export function PriorityBadge({
  priority,
  className,
}: {
  priority: Priority;
  className?: string;
}) {
  const t = useT();
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider',
        PRIORITY_TONE[priority],
        className
      )}
    >
      {t.priority[priority]}
    </span>
  );
}
