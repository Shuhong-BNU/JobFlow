import 'server-only';
import { and, asc, eq, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { applicationEvents, applications, companies } from '@/db/schema';

export async function getUpcomingEvents(userId: string, withinDays = 14) {
  return db
    .select({
      id: applicationEvents.id,
      title: applicationEvents.title,
      eventType: applicationEvents.eventType,
      startsAt: applicationEvents.startsAt,
      applicationId: applicationEvents.applicationId,
      applicationTitle: applications.title,
      companyName: companies.name,
    })
    .from(applicationEvents)
    .innerJoin(applications, eq(applicationEvents.applicationId, applications.id))
    .innerJoin(companies, eq(applications.companyId, companies.id))
    .where(
      and(
        eq(applications.userId, userId),
        sql`${applicationEvents.startsAt} >= now() - interval '1 day'`,
        sql`${applicationEvents.startsAt} <= now() + ${`${withinDays} days`}::interval`
      )
    )
    .orderBy(asc(applicationEvents.startsAt))
    .limit(8);
}

/**
 * Risk = applications with a deadline in the past or within 2 days that are
 * still in wishlist (not yet applied). Useful nudges on the dashboard.
 */
export async function getRiskItems(userId: string) {
  return db
    .select({
      id: applications.id,
      title: applications.title,
      deadlineAt: applications.deadlineAt,
      currentStatus: applications.currentStatus,
      companyName: companies.name,
    })
    .from(applications)
    .innerJoin(companies, eq(applications.companyId, companies.id))
    .where(
      and(
        eq(applications.userId, userId),
        eq(applications.currentStatus, 'wishlist'),
        sql`${applications.deadlineAt} is not null`,
        sql`${applications.deadlineAt} <= now() + interval '2 days'`
      )
    )
    .orderBy(asc(applications.deadlineAt))
    .limit(5);
}
