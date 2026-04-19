import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { applications, companies, offers } from "@/db/schema";
import type { OfferListFilter, OfferListItem } from "@/features/offers/types";

export async function listOffers(
  userId: string,
  filters: OfferListFilter = {},
): Promise<OfferListItem[]> {
  const db = getDb();
  const whereConditions = [eq(offers.userId, userId)];

  if (filters.decisionStatus && filters.decisionStatus !== "all") {
    whereConditions.push(eq(offers.decisionStatus, filters.decisionStatus));
  }

  return db
    .select({
      id: offers.id,
      applicationId: offers.applicationId,
      companyName: companies.name,
      applicationTitle: applications.title,
      applicationStatus: applications.currentStatus,
      baseSalary: offers.baseSalary,
      bonus: offers.bonus,
      location: offers.location,
      team: offers.team,
      responseDeadlineAt: offers.responseDeadlineAt,
      decisionStatus: offers.decisionStatus,
      pros: offers.pros,
      cons: offers.cons,
      updatedAt: offers.updatedAt,
    })
    .from(offers)
    .innerJoin(applications, eq(applications.id, offers.applicationId))
    .innerJoin(companies, eq(companies.id, applications.companyId))
    .where(and(...whereConditions))
    .orderBy(desc(offers.updatedAt));
}
