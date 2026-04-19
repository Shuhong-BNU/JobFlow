import "server-only";

import { addDays, differenceInCalendarDays, isAfter, isBefore, startOfDay } from "date-fns";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { applications, offers } from "@/db/schema";
import { applicationStatuses } from "@/lib/constants";
import { applicationSourceLabels, applicationStatusLabels } from "@/lib/labels";

export type AnalyticsOverview = {
  totalApplications: number;
  upcomingDeadlineCount: number;
  averageWaitingDays: number;
  offerCount: number;
  rejectionCount: number;
  statusBreakdown: Array<{
    status: (typeof applicationStatuses)[number];
    label: string;
    count: number;
    ratio: number;
  }>;
  sourceBreakdown: Array<{
    source: keyof typeof applicationSourceLabels;
    label: string;
    count: number;
    ratio: number;
  }>;
};

export async function getAnalyticsOverview(userId: string): Promise<AnalyticsOverview> {
  const db = getDb();
  const [applicationRows, offerRows] = await Promise.all([
    db
      .select({
        currentStatus: applications.currentStatus,
        source: applications.source,
        appliedAt: applications.appliedAt,
        deadlineAt: applications.deadlineAt,
      })
      .from(applications)
      .where(eq(applications.userId, userId)),
    db
      .select({
        decisionStatus: offers.decisionStatus,
      })
      .from(offers)
      .where(eq(offers.userId, userId)),
  ]);

  const totalApplications = applicationRows.length;
  const now = new Date();
  const nextSevenDays = addDays(now, 7);
  const activeWaitingRows = applicationRows.filter(
    (item) =>
      item.appliedAt &&
      ["applied", "oa", "interview", "hr"].includes(item.currentStatus),
  );
  const averageWaitingDays =
    activeWaitingRows.length > 0
      ? Math.round(
          activeWaitingRows.reduce((sum, item) => {
            return sum + differenceInCalendarDays(now, new Date(item.appliedAt!));
          }, 0) / activeWaitingRows.length,
        )
      : 0;

  const statusCounts = new Map<string, number>();
  const sourceCounts = new Map<string, number>();

  for (const row of applicationRows) {
    statusCounts.set(row.currentStatus, (statusCounts.get(row.currentStatus) ?? 0) + 1);
    sourceCounts.set(row.source, (sourceCounts.get(row.source) ?? 0) + 1);
  }

  const upcomingDeadlineCount = applicationRows.filter((item) => {
    if (!item.deadlineAt) {
      return false;
    }

    const deadline = new Date(item.deadlineAt);
    return (
      isAfter(deadline, startOfDay(now)) &&
      isBefore(deadline, addDays(nextSevenDays, 1)) &&
      !["rejected", "archived"].includes(item.currentStatus)
    );
  }).length;

  return {
    totalApplications,
    upcomingDeadlineCount,
    averageWaitingDays,
    offerCount: offerRows.length,
    rejectionCount: statusCounts.get("rejected") ?? 0,
    statusBreakdown: applicationStatuses.map((status) => {
      const count = statusCounts.get(status) ?? 0;
      return {
        status,
        label: applicationStatusLabels[status],
        count,
        ratio: totalApplications > 0 ? count / totalApplications : 0,
      };
    }),
    sourceBreakdown: Object.entries(applicationSourceLabels).map(([source, label]) => {
      const count = sourceCounts.get(source) ?? 0;
      return {
        source: source as keyof typeof applicationSourceLabels,
        label,
        count,
        ratio: totalApplications > 0 ? count / totalApplications : 0,
      };
    }),
  };
}
