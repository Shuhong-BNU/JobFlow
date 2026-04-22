import 'server-only';
import { and, asc, eq, gte, isNotNull, lt } from 'drizzle-orm';
import { db } from '@/db/client';
import { applications, applicationEvents, companies } from '@/db/schema';
import type { EventType } from '@/lib/enums';

/**
 * Calendar v1 的显示单元。两个源：
 *   - deadline：applications.deadlineAt —— 虚拟成一条 eventType='deadline' 的条目
 *   - event：applicationEvents（oa / interview / offer_response / custom / deadline）
 *
 * 合并后按天分桶，前端直接按 `yyyy-mm-dd` 取条目列表。
 */
export type CalendarItem = {
  /** 合成稳定 key，前端列表 key 用；deadline 条目走 `deadline-<appId>` */
  key: string;
  applicationId: string;
  applicationTitle: string;
  companyName: string;
  eventType: EventType;
  /** 本条目在日历上归属的日期 */
  at: Date;
  /** event.title 或 "Deadline" 合成标题 */
  title: string;
};

/**
 * 取某个用户在 [from, to) 半开区间里的所有日历条目。调用方通常传"当前展示月
 * 的首日/次月首日"；这样月视图里前后填充的非本月日期不会被误拉进来，也省了
 * 前端二次过滤。
 */
export async function listCalendarItems(
  userId: string,
  from: Date,
  to: Date
): Promise<CalendarItem[]> {
  // 1. deadlines
  const deadlines = await db
    .select({
      applicationId: applications.id,
      applicationTitle: applications.title,
      companyName: companies.name,
      at: applications.deadlineAt,
    })
    .from(applications)
    .innerJoin(companies, eq(applications.companyId, companies.id))
    .where(
      and(
        eq(applications.userId, userId),
        isNotNull(applications.deadlineAt),
        gte(applications.deadlineAt, from),
        lt(applications.deadlineAt, to)
      )
    );

  // 2. events（通过 applications 做 ownership 过滤，直接复用 application 的 userId 约束）
  const events = await db
    .select({
      id: applicationEvents.id,
      applicationId: applicationEvents.applicationId,
      applicationTitle: applications.title,
      companyName: companies.name,
      eventType: applicationEvents.eventType,
      startsAt: applicationEvents.startsAt,
      title: applicationEvents.title,
    })
    .from(applicationEvents)
    .innerJoin(applications, eq(applicationEvents.applicationId, applications.id))
    .innerJoin(companies, eq(applications.companyId, companies.id))
    .where(
      and(
        eq(applications.userId, userId),
        gte(applicationEvents.startsAt, from),
        lt(applicationEvents.startsAt, to)
      )
    )
    .orderBy(asc(applicationEvents.startsAt));

  const out: CalendarItem[] = [];

  for (const d of deadlines) {
    if (!d.at) continue; // 类型收紧，不可能为 null
    out.push({
      key: `deadline-${d.applicationId}`,
      applicationId: d.applicationId,
      applicationTitle: d.applicationTitle,
      companyName: d.companyName,
      eventType: 'deadline',
      at: d.at,
      title: d.applicationTitle,
    });
  }

  for (const e of events) {
    out.push({
      key: `event-${e.id}`,
      applicationId: e.applicationId,
      applicationTitle: e.applicationTitle,
      companyName: e.companyName,
      eventType: e.eventType,
      at: e.startsAt,
      title: e.title,
    });
  }

  // 同一天里按时间升序，保证格子里事件按发生顺序排列
  out.sort((a, b) => a.at.getTime() - b.at.getTime());
  return out;
}
