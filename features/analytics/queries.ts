import 'server-only';
import { and, desc, eq, inArray, isNotNull, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { applications } from '@/db/schema';
import type { ApplicationStatus } from '@/lib/enums';

/**
 * Analytics v1 数据口径（v1 刻意保守，不做 AI 洞察，只出基础事实）：
 *
 *  - 漏斗：按"主干阶段已累计到达多少张"统计。计算只看 applications.currentStatus，
 *    不追溯 events —— 代价是对已经转 rejected 的申请不会算入"曾经到过的阶段"。
 *    Over-count 比 under-count 危险（会制造"有 Offer 其实没有"的错觉），所以
 *    v1 选择诚实的欠估。独立再展示 rejected / archived 数量作为补充。
 *  - Source 分布：按 applications.source 分组，NULL / 空串合并成 "Unknown"。
 *  - 等待时间：currentStatus ∈ {applied, oa} 且 appliedAt 非空的申请，
 *    avg(now() - appliedAt) 作为 "still waiting" 的均值。
 */

const PROGRESS_ORDER: ApplicationStatus[] = [
  'wishlist',
  'applied',
  'oa',
  'interview',
  'hr',
  'offer',
];

export type FunnelBar = {
  stage: ApplicationStatus;
  /** 累计到达该阶段的申请数（当前状态是该阶段及之后的主干） */
  count: number;
};

export type SourceSlice = {
  source: string;
  count: number;
};

export type WaitingStats = {
  /** 当前还卡在 applied / oa 的申请数 */
  count: number;
  /** 平均等待天数（从 appliedAt 到现在） */
  avgDays: number | null;
  /** 最久的那条的天数，用于给 "overdue" 感 */
  maxDays: number | null;
};

export type AnalyticsOverview = {
  totalApplications: number;
  rejectedCount: number;
  archivedCount: number;
  funnel: FunnelBar[];
  sources: SourceSlice[];
  waiting: WaitingStats;
};

export async function getAnalyticsOverview(userId: string): Promise<AnalyticsOverview> {
  // 1. 各 status 计数（一次 group by 拿全）
  const statusRows = await db
    .select({
      status: applications.currentStatus,
      count: sql<number>`count(*)::int`,
    })
    .from(applications)
    .where(eq(applications.userId, userId))
    .groupBy(applications.currentStatus);

  const byStatus = new Map<ApplicationStatus, number>();
  for (const r of statusRows) byStatus.set(r.status, r.count);

  const totalApplications = statusRows.reduce((s, r) => s + r.count, 0);
  const rejectedCount = byStatus.get('rejected') ?? 0;
  const archivedCount = byStatus.get('archived') ?? 0;

  // 2. 漏斗：从右到左累加。例如 offer 阶段 count = byStatus[offer]；
  //    hr 阶段 count = byStatus[hr] + byStatus[offer]；以此类推。
  const funnel: FunnelBar[] = [];
  let carry = 0;
  for (let i = PROGRESS_ORDER.length - 1; i >= 0; i--) {
    const stage = PROGRESS_ORDER[i]!;
    carry += byStatus.get(stage) ?? 0;
    funnel.unshift({ stage, count: carry });
  }

  // 3. Source 分布
  const sourceRows = await db
    .select({
      source: sql<string | null>`nullif(trim(${applications.source}), '')`,
      count: sql<number>`count(*)::int`,
    })
    .from(applications)
    .where(eq(applications.userId, userId))
    .groupBy(sql`nullif(trim(${applications.source}), '')`)
    .orderBy(desc(sql`count(*)`));

  const sources: SourceSlice[] = sourceRows.map((r) => ({
    source: r.source ?? 'Unknown',
    count: r.count,
  }));

  // 4. 等待时间：只看 applied / oa 阶段且 appliedAt 非空
  const waitingRows = await db
    .select({
      count: sql<number>`count(*)::int`,
      avgDays: sql<number | null>`avg(extract(epoch from (now() - ${applications.appliedAt})) / 86400)::float`,
      maxDays: sql<number | null>`max(extract(epoch from (now() - ${applications.appliedAt})) / 86400)::float`,
    })
    .from(applications)
    .where(
      and(
        eq(applications.userId, userId),
        isNotNull(applications.appliedAt),
        inArray(applications.currentStatus, ['applied', 'oa'] as ApplicationStatus[])
      )
    );

  const w = waitingRows[0];
  const waiting: WaitingStats = {
    count: w?.count ?? 0,
    avgDays: w?.avgDays ?? null,
    maxDays: w?.maxDays ?? null,
  };

  return {
    totalApplications,
    rejectedCount,
    archivedCount,
    funnel,
    sources,
    waiting,
  };
}
