import 'server-only';
import { and, asc, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { applicationEvents, applicationNotes, applications, companies } from '@/db/schema';
import type { ApplicationStatus, EventType, EventStatus } from '@/lib/enums';
import type { ListFilters } from './schema';

export type ApplicationCard = {
  id: string;
  title: string;
  companyId: string;
  companyName: string;
  location: string | null;
  sourceUrl: string | null;
  currentStatus: ApplicationStatus;
  priority: 'low' | 'medium' | 'high';
  deadlineAt: Date | null;
  appliedAt: Date | null;
  boardOrder: number;
  updatedAt: Date;
};

const baseSelect = {
  id: applications.id,
  title: applications.title,
  companyId: applications.companyId,
  companyName: companies.name,
  location: applications.location,
  sourceUrl: applications.sourceUrl,
  currentStatus: applications.currentStatus,
  priority: applications.priority,
  deadlineAt: applications.deadlineAt,
  appliedAt: applications.appliedAt,
  boardOrder: applications.boardOrder,
  updatedAt: applications.updatedAt,
} as const;

export async function listApplicationsForBoard(userId: string): Promise<ApplicationCard[]> {
  const rows = await db
    .select(baseSelect)
    .from(applications)
    .innerJoin(companies, eq(applications.companyId, companies.id))
    .where(eq(applications.userId, userId))
    .orderBy(asc(applications.currentStatus), asc(applications.boardOrder));
  return rows;
}

export async function listApplications(
  userId: string,
  filters: ListFilters
): Promise<ApplicationCard[]> {
  const where = [eq(applications.userId, userId)];
  if (filters.status) where.push(eq(applications.currentStatus, filters.status));
  if (filters.priority) where.push(eq(applications.priority, filters.priority));
  if (filters.q) {
    const like = `%${filters.q}%`;
    where.push(or(ilike(companies.name, like), ilike(applications.title, like))!);
  }

  // Drizzle 的 `asc()/desc()` 会在传入的 SQL 末尾再拼一次方向关键字，导致
  // `asc(sql\`... nulls last\`)` 渲染成 `... nulls last asc` —— Postgres
  // 语法顺序是 `ASC/DESC NULLS LAST`，位置反了就 "syntax error at or near \"asc\""。
  // 这里直接用原生 sql 片段，方向 + NULLS 顺序明确。
  const order = (() => {
    switch (filters.sort) {
      case 'deadline_asc':
        return sql`${applications.deadlineAt} asc nulls last`;
      case 'deadline_desc':
        return sql`${applications.deadlineAt} desc nulls last`;
      case 'created_desc':
        return desc(applications.createdAt);
      case 'updated_desc':
      default:
        return desc(applications.updatedAt);
    }
  })();

  return db
    .select(baseSelect)
    .from(applications)
    .innerJoin(companies, eq(applications.companyId, companies.id))
    .where(and(...where))
    .orderBy(order);
}

export type ApplicationDetail = Awaited<ReturnType<typeof getApplicationById>>;

export async function getApplicationById(userId: string, id: string) {
  const [row] = await db
    .select({
      application: applications,
      company: companies,
    })
    .from(applications)
    .innerJoin(companies, eq(applications.companyId, companies.id))
    .where(and(eq(applications.id, id), eq(applications.userId, userId)))
    .limit(1);
  if (!row) return null;

  const events = await db
    .select()
    .from(applicationEvents)
    .where(eq(applicationEvents.applicationId, id))
    .orderBy(asc(applicationEvents.startsAt));

  const notes = await db
    .select()
    .from(applicationNotes)
    .where(eq(applicationNotes.applicationId, id))
    .orderBy(desc(applicationNotes.createdAt));

  return { ...row, events, notes };
}

export async function getStatusCounts(userId: string) {
  const rows = await db
    .select({
      status: applications.currentStatus,
      count: sql<number>`count(*)::int`,
    })
    .from(applications)
    .where(eq(applications.userId, userId))
    .groupBy(applications.currentStatus);
  return rows;
}

export async function getUpcomingDeadlines(userId: string, withinDays = 7) {
  return db
    .select({ ...baseSelect })
    .from(applications)
    .innerJoin(companies, eq(applications.companyId, companies.id))
    .where(
      and(
        eq(applications.userId, userId),
        sql`${applications.deadlineAt} is not null`,
        sql`${applications.deadlineAt} <= now() + ${`${withinDays} days`}::interval`,
        sql`${applications.deadlineAt} >= now() - interval '1 day'`
      )
    )
    .orderBy(asc(applications.deadlineAt))
    .limit(10);
}

export async function getRecentlyUpdated(userId: string, limit = 5) {
  return db
    .select(baseSelect)
    .from(applications)
    .innerJoin(companies, eq(applications.companyId, companies.id))
    .where(eq(applications.userId, userId))
    .orderBy(desc(applications.updatedAt))
    .limit(limit);
}

/**
 * 进度视图专用事件摘要。只取画"进度节点时间戳"需要的字段，
 * 避免把 description / reminderAt 这类不在 UI 中展示的字段也拉到前端。
 */
export type ApplicationEventSummary = {
  applicationId: string;
  eventType: EventType;
  startsAt: Date | null;
  status: EventStatus;
};

/**
 * 进度视图数据源：复用 listApplications 的筛选与排序语义，再额外批量取
 * 每条申请的关键事件（oa / interview / offer_response）。避免 N+1，
 * 所以这里用一次 inArray 拉全部 events，前端按 applicationId 分桶。
 *
 * 即便某条申请没有事件，也不会被 inArray 过滤掉——事件列表只影响附加
 * 时间戳展示，不影响卡片本身是否渲染。
 */
export async function listApplicationsWithEvents(
  userId: string,
  filters: ListFilters
): Promise<{
  cards: ApplicationCard[];
  eventsByApplicationId: Map<string, ApplicationEventSummary[]>;
}> {
  const cards = await listApplications(userId, filters);
  if (cards.length === 0) {
    return { cards, eventsByApplicationId: new Map() };
  }

  const ids = cards.map((c) => c.id);
  const events = await db
    .select({
      applicationId: applicationEvents.applicationId,
      eventType: applicationEvents.eventType,
      startsAt: applicationEvents.startsAt,
      status: applicationEvents.status,
    })
    .from(applicationEvents)
    .where(inArray(applicationEvents.applicationId, ids))
    .orderBy(asc(applicationEvents.startsAt));

  const eventsByApplicationId = new Map<string, ApplicationEventSummary[]>();
  for (const ev of events) {
    const bucket = eventsByApplicationId.get(ev.applicationId) ?? [];
    bucket.push(ev);
    eventsByApplicationId.set(ev.applicationId, bucket);
  }

  return { cards, eventsByApplicationId };
}
