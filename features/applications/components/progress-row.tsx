'use client';

import Link from 'next/link';
import { ArrowUpRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT, useLocale } from '@/lib/i18n/client';
import { formatDateShort, isOverdue, relativeFromNow } from '@/lib/date';
import { PriorityBadge, StatusBadge } from '@/components/status-badge';
import type { ApplicationStatus, EventType } from '@/lib/enums';
import type { ApplicationEventSummary } from '../queries';

/**
 * 进度视图里用的"主流程"6 个节点。rejected / archived 是终止分支，
 * 不在节点栏里占位；改用底部 badge 表达。
 */
const PROGRESS_ORDER = ['wishlist', 'applied', 'oa', 'interview', 'hr', 'offer'] as const;
type ProgressStage = (typeof PROGRESS_ORDER)[number];

function isProgressStage(s: ApplicationStatus): s is ProgressStage {
  return (PROGRESS_ORDER as readonly string[]).includes(s);
}

/**
 * 推导"已到达"节点的下标。
 *
 * - wishlist/applied/oa/interview/hr/offer：直接用 PROGRESS_ORDER 定位。
 * - rejected / archived：当前状态已经脱离主干，但历史上可能推进过某些
 *   节点。用 events + appliedAt 作为 fallback，尽量还原"走到哪一步被拒"。
 *
 * 推导规则（取最大值）：
 *   offer_response 事件 → hr (index 4)，保守地判断已经走到 HR / Offer 沟通阶段
 *   interview 事件     → interview (index 3)
 *   oa 事件            → oa (index 2)
 *   appliedAt 非空     → applied (index 1)
 *   否则               → 0 (wishlist)
 */
function reachedIndex(
  status: ApplicationStatus,
  appliedAt: Date | null,
  events: ApplicationEventSummary[]
): number {
  if (isProgressStage(status)) {
    return PROGRESS_ORDER.indexOf(status);
  }
  // 终止分支：尽可能还原
  let max = 0;
  if (appliedAt) max = Math.max(max, 1);
  const types = new Set(events.map((e) => e.eventType));
  if (types.has('oa')) max = Math.max(max, 2);
  if (types.has('interview')) max = Math.max(max, 3);
  if (types.has('offer_response')) max = Math.max(max, 4);
  return max;
}

/**
 * 找到某个事件类型的"代表时间戳"。有多条时取最早那条（已按 startsAt 升序），
 * 这样能看到"第一次到达该阶段"的时间点，符合进度视图语义。
 */
function firstEventAt(
  events: ApplicationEventSummary[],
  type: EventType
): Date | null {
  for (const ev of events) {
    if (ev.eventType === type && ev.startsAt) return ev.startsAt;
  }
  return null;
}

function timestampForStage(
  stage: ProgressStage,
  appliedAt: Date | null,
  events: ApplicationEventSummary[]
): Date | null {
  switch (stage) {
    case 'wishlist':
      return null;
    case 'applied':
      return appliedAt;
    case 'oa':
      return firstEventAt(events, 'oa');
    case 'interview':
      return firstEventAt(events, 'interview');
    case 'hr':
      return null; // HR 阶段没有独立事件类型，节点只表达"到达"
    case 'offer':
      return firstEventAt(events, 'offer_response');
  }
}

export function ProgressRow({
  card,
  events,
}: {
  card: {
    id: string;
    title: string;
    companyName: string;
    sourceUrl: string | null;
    currentStatus: ApplicationStatus;
    priority: 'low' | 'medium' | 'high';
    deadlineAt: Date | null;
    appliedAt: Date | null;
    updatedAt: Date;
  };
  events: ApplicationEventSummary[];
}) {
  const t = useT();
  const locale = useLocale();

  const reached = reachedIndex(card.currentStatus, card.appliedAt, events);
  const isTerminal = card.currentStatus === 'rejected' || card.currentStatus === 'archived';

  return (
    <div className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent/30">
      {/* 顶部：公司 + 岗位 + 优先级 + 外链 */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/app/applications/${card.id}`}
            className="block truncate text-sm font-semibold hover:underline"
          >
            {card.companyName}
          </Link>
          <Link
            href={`/app/applications/${card.id}`}
            className="mt-0.5 block truncate text-xs text-muted-foreground hover:underline"
          >
            {card.title}
          </Link>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <PriorityBadge priority={card.priority} />
          {card.sourceUrl && (
            <a
              href={card.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={t.list.progress.openPosting}
              title={t.list.progress.openPosting}
              onClick={(e) => e.stopPropagation()}
            >
              <ArrowUpRight className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>

      {/* 节点栏 */}
      <div className="mt-4 grid grid-cols-6 gap-0">
        {PROGRESS_ORDER.map((stage, i) => {
          const reachedThis = i <= reached;
          const isCurrent = !isTerminal && i === reached;
          const ts = timestampForStage(stage, card.appliedAt, events);
          return (
            <div key={stage} className="flex min-w-0 flex-col items-center">
              {/* 节点 + 连线 */}
              <div className="flex w-full items-center">
                <div
                  className={cn(
                    'h-0.5 flex-1',
                    i === 0
                      ? 'bg-transparent'
                      : i <= reached
                        ? 'bg-primary'
                        : 'bg-border'
                  )}
                />
                <div
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-semibold transition-colors',
                    reachedThis
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-muted-foreground',
                    isCurrent && 'ring-2 ring-primary ring-offset-2 ring-offset-card'
                  )}
                >
                  {reachedThis ? <Check className="h-3 w-3" /> : i + 1}
                </div>
                <div
                  className={cn(
                    'h-0.5 flex-1',
                    i === PROGRESS_ORDER.length - 1
                      ? 'bg-transparent'
                      : i < reached
                        ? 'bg-primary'
                        : 'bg-border'
                  )}
                />
              </div>
              {/* 标签 */}
              <div
                className={cn(
                  'mt-1.5 truncate text-[11px] font-medium',
                  reachedThis ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {t.status[stage]}
              </div>
              {/* 时间戳（可能为空） */}
              <div className="h-4 text-[10px] leading-4 text-muted-foreground">
                {ts ? formatDateShort(ts, locale) : ''}
              </div>
            </div>
          );
        })}
      </div>

      {/* 底部：终止状态、截止日、更新时间 */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        {isTerminal && <StatusBadge status={card.currentStatus} />}
        {card.deadlineAt && (
          <span
            className={cn(
              'text-muted-foreground',
              isOverdue(card.deadlineAt) && 'text-destructive'
            )}
          >
            {t.list.progress.deadlinePrefix}
            {formatDateShort(card.deadlineAt, locale)}
            {' · '}
            {relativeFromNow(card.deadlineAt, locale)}
          </span>
        )}
        <span className="ml-auto text-muted-foreground">
          {t.list.progress.updatedPrefix}
          {relativeFromNow(card.updatedAt, locale)}
        </span>
      </div>
    </div>
  );
}
