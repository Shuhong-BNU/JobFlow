import "server-only";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { applications, companies } from "@/db/schema";
import { getUpcomingEvents } from "@/features/applications/server/queries";
import { measureServerOperation } from "@/lib/server/logger";

const ACTIVE_STATUSES = new Set(["wishlist", "applied", "oa", "interview", "hr"]);

export async function getDashboardOverview(userId: string) {
  return measureServerOperation("dashboard.getOverview", { userId }, async () => {
    const db = getDb();

    const [allApplications, upcomingEvents, recentUpdates] = await Promise.all([
      db
        .select({
          id: applications.id,
          title: applications.title,
          currentStatus: applications.currentStatus,
          priority: applications.priority,
          deadlineAt: applications.deadlineAt,
          updatedAt: applications.updatedAt,
          companyName: companies.name,
        })
        .from(applications)
        .innerJoin(companies, eq(companies.id, applications.companyId))
        .where(eq(applications.userId, userId)),
      getUpcomingEvents(userId, 6),
      db
        .select({
          id: applications.id,
          title: applications.title,
          updatedAt: applications.updatedAt,
          currentStatus: applications.currentStatus,
          companyName: companies.name,
        })
        .from(applications)
        .innerJoin(companies, eq(companies.id, applications.companyId))
        .where(eq(applications.userId, userId))
        .orderBy(desc(applications.updatedAt))
        .limit(5),
    ]);

    const now = Date.now();
    const sevenDaysLater = now + 7 * 24 * 60 * 60 * 1000;

    const urgentDeadlines = allApplications
      .filter(
        (item) =>
          item.deadlineAt &&
          ACTIVE_STATUSES.has(item.currentStatus) &&
          item.deadlineAt.getTime() <= sevenDaysLater,
      )
      .sort((a, b) => {
        if (!a.deadlineAt || !b.deadlineAt) {
          return 0;
        }

        return a.deadlineAt.getTime() - b.deadlineAt.getTime();
      })
      .slice(0, 5);

    const overdueApplications = allApplications.filter(
      (item) =>
        item.deadlineAt &&
        ACTIVE_STATUSES.has(item.currentStatus) &&
        item.deadlineAt.getTime() < now,
    );

    const stalledApplications = allApplications.filter((item) => {
      return (
        ACTIVE_STATUSES.has(item.currentStatus) &&
        now - item.updatedAt.getTime() >= 14 * 24 * 60 * 60 * 1000
      );
    });

    const statusCount = allApplications.reduce<Record<string, number>>((acc, item) => {
      acc[item.currentStatus] = (acc[item.currentStatus] ?? 0) + 1;
      return acc;
    }, {});

    const todayTodo = upcomingEvents.filter((event) => {
      if (!event.startsAt) {
        return false;
      }

      return new Date(event.startsAt).toDateString() === new Date().toDateString();
    });

    return {
      stats: {
        totalApplications: allApplications.length,
        activeApplications: allApplications.filter((item) =>
          ACTIVE_STATUSES.has(item.currentStatus),
        ).length,
        upcomingEvents: upcomingEvents.length,
        offers: statusCount.offer ?? 0,
      },
      todayTodo,
      urgentDeadlines,
      upcomingEvents,
      risks: [
        ...overdueApplications.map((item) => ({
          type: "overdue" as const,
          title: `${item.companyName} · ${item.title}`,
          description: "截止日期已过，请尽快确认是否还能投递或转为归档。",
        })),
        ...stalledApplications.map((item) => ({
          type: "stalled" as const,
          title: `${item.companyName} · ${item.title}`,
          description: "超过 14 天没有更新，建议补跟进记录或主动发起 follow-up。",
        })),
      ].slice(0, 5),
      recentUpdates,
      statusCount,
    };
  });
}
