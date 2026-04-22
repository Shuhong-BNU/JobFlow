import 'server-only';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { applications, companies, offers } from '@/db/schema';
import type { OfferDecision } from '@/lib/enums';

export type OfferRow = {
  id: string;
  applicationId: string;
  applicationTitle: string;
  companyId: string;
  companyName: string;
  baseSalary: string | null;
  bonus: string | null;
  location: string | null;
  team: string | null;
  responseDeadlineAt: Date | null;
  decisionStatus: OfferDecision;
  pros: string | null;
  cons: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const baseSelect = {
  id: offers.id,
  applicationId: offers.applicationId,
  applicationTitle: applications.title,
  companyId: applications.companyId,
  companyName: companies.name,
  baseSalary: offers.baseSalary,
  bonus: offers.bonus,
  location: offers.location,
  team: offers.team,
  responseDeadlineAt: offers.responseDeadlineAt,
  decisionStatus: offers.decisionStatus,
  pros: offers.pros,
  cons: offers.cons,
  createdAt: offers.createdAt,
  updatedAt: offers.updatedAt,
} as const;

/**
 * 总览页用。按 decisionStatus 权重 + 最近更新排序，让 pending 的 offer 先出来。
 * 权重是数据库层的 case 表达式，不让 UI 再排一次。
 */
export async function listOffers(userId: string): Promise<OfferRow[]> {
  return db
    .select(baseSelect)
    .from(offers)
    .innerJoin(applications, eq(offers.applicationId, applications.id))
    .innerJoin(companies, eq(applications.companyId, companies.id))
    .where(eq(applications.userId, userId))
    .orderBy(desc(offers.updatedAt));
}

/**
 * 详情页 Offer tab 用：一个申请至多一条 offer（表上有 unique 约束）。
 */
export async function getOfferByApplicationId(
  userId: string,
  applicationId: string
): Promise<OfferRow | null> {
  const [row] = await db
    .select(baseSelect)
    .from(offers)
    .innerJoin(applications, eq(offers.applicationId, applications.id))
    .innerJoin(companies, eq(applications.companyId, companies.id))
    .where(and(eq(offers.applicationId, applicationId), eq(applications.userId, userId)))
    .limit(1);
  return row ?? null;
}
