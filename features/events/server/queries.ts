import "server-only";

import { and, asc, eq, gte, lte } from "drizzle-orm";
import { getDb } from "@/db";
import { applicationEvents, applications, companies } from "@/db/schema";
import type { CalendarEventFilter, CalendarEventItem } from "@/features/events/types";

export async function listCalendarEvents(
  userId: string,
  filters: CalendarEventFilter,
): Promise<CalendarEventItem[]> {
  const db = getDb();
  const whereConditions = [
    eq(applicationEvents.userId, userId),
    gte(applicationEvents.startsAt, filters.month),
    lte(applicationEvents.startsAt, endOfFilterRange(filters.month)),
  ];

  if (filters.eventType && filters.eventType !== "all") {
    whereConditions.push(eq(applicationEvents.eventType, filters.eventType));
  }

  if (filters.status && filters.status !== "all") {
    whereConditions.push(eq(applicationEvents.status, filters.status));
  }

  return db
    .select({
      id: applicationEvents.id,
      applicationId: applicationEvents.applicationId,
      companyName: companies.name,
      applicationTitle: applications.title,
      currentStatus: applications.currentStatus,
      eventType: applicationEvents.eventType,
      title: applicationEvents.title,
      description: applicationEvents.description,
      startsAt: applicationEvents.startsAt,
      endsAt: applicationEvents.endsAt,
      reminderAt: applicationEvents.reminderAt,
      status: applicationEvents.status,
      createdAt: applicationEvents.createdAt,
      updatedAt: applicationEvents.updatedAt,
    })
    .from(applicationEvents)
    .innerJoin(applications, eq(applications.id, applicationEvents.applicationId))
    .innerJoin(companies, eq(companies.id, applications.companyId))
    .where(and(...whereConditions))
    .orderBy(asc(applicationEvents.startsAt), asc(applicationEvents.createdAt));
}

function endOfFilterRange(monthStart: Date) {
  const date = new Date(monthStart);
  date.setMonth(date.getMonth() + 1);
  date.setMilliseconds(date.getMilliseconds() - 1);
  return date;
}
