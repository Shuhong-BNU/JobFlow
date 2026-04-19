import 'server-only';
import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { applicationEvents, applicationNotes, applications, companies } from '@/db/schema';
import type { ApplicationStatus } from '@/lib/enums';
import type { ListFilters } from './schema';

export type ApplicationCard = {
  id: string;
  title: string;
  companyId: string;
  companyName: string;
  location: string | null;
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
