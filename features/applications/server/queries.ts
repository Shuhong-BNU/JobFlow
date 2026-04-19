import "server-only";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  applicationMaterials,
  applicationEvents,
  applicationNotes,
  applications,
  companies,
  materials,
  offers,
} from "@/db/schema";
import type { ApplicationFormValues } from "@/features/applications/schema";
import { measureServerOperation } from "@/lib/server/logger";
import type {
  ApplicationDetail,
  ApplicationListFilter,
  ApplicationListItem,
  ApplicationOption,
} from "@/features/applications/types";

export async function listApplications(
  userId: string,
  filters: ApplicationListFilter,
): Promise<ApplicationListItem[]> {
  return measureServerOperation("applications.list", { userId, filters }, async () => {
    const db = getDb();
    const whereConditions = [eq(applications.userId, userId)];

    if (filters.query) {
      whereConditions.push(
        or(
          ilike(applications.title, `%${filters.query}%`),
          ilike(companies.name, `%${filters.query}%`),
        )!,
      );
    }

    if (filters.status && filters.status !== "all") {
      whereConditions.push(eq(applications.currentStatus, filters.status));
    }

    if (filters.priority && filters.priority !== "all") {
      whereConditions.push(eq(applications.priority, filters.priority));
    }

    const orderBy =
      filters.sort === "deadline_desc"
        ? sql`${applications.deadlineAt} desc nulls last`
        : filters.sort === "updated_desc"
          ? desc(applications.updatedAt)
          : sql`${applications.deadlineAt} asc nulls last`;

    return db
      .select({
        id: applications.id,
        companyId: applications.companyId,
        companyName: companies.name,
        title: applications.title,
        department: applications.department,
        location: applications.location,
        currentStatus: applications.currentStatus,
        priority: applications.priority,
        deadlineAt: applications.deadlineAt,
        appliedAt: applications.appliedAt,
        updatedAt: applications.updatedAt,
        source: applications.source,
        employmentType: applications.employmentType,
      })
      .from(applications)
      .innerJoin(companies, eq(companies.id, applications.companyId))
      .where(and(...whereConditions))
      .orderBy(orderBy);
  });
}

export async function getApplicationDetail(
  userId: string,
  applicationId: string,
): Promise<ApplicationDetail | null> {
  return measureServerOperation(
    "applications.getDetail",
    { userId, applicationId },
    async () => {
      const db = getDb();
      const [application] = await db
        .select({
          id: applications.id,
          companyId: applications.companyId,
          companyName: companies.name,
          companyWebsite: companies.website,
          companyIndustry: companies.industry,
          companyLocation: companies.location,
          title: applications.title,
          department: applications.department,
          location: applications.location,
          source: applications.source,
          sourceUrl: applications.sourceUrl,
          employmentType: applications.employmentType,
          deadlineAt: applications.deadlineAt,
          appliedAt: applications.appliedAt,
          currentStatus: applications.currentStatus,
          priority: applications.priority,
          salaryRange: applications.salaryRange,
          referralName: applications.referralName,
          notes: applications.notes,
          createdAt: applications.createdAt,
          updatedAt: applications.updatedAt,
        })
        .from(applications)
        .innerJoin(companies, eq(companies.id, applications.companyId))
        .where(and(eq(applications.id, applicationId), eq(applications.userId, userId)))
        .limit(1);

      if (!application) {
        return null;
      }

      const [events, notes, materialRows, [offerRecord]] = await Promise.all([
        db
          .select({
            id: applicationEvents.id,
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
          .where(
            and(
              eq(applicationEvents.applicationId, applicationId),
              eq(applicationEvents.userId, userId),
            ),
          )
          .orderBy(
            sql`${applicationEvents.startsAt} asc nulls last`,
            desc(applicationEvents.createdAt),
          ),
        db
          .select({
            id: applicationNotes.id,
            noteType: applicationNotes.noteType,
            content: applicationNotes.content,
            createdAt: applicationNotes.createdAt,
            updatedAt: applicationNotes.updatedAt,
          })
          .from(applicationNotes)
          .where(
            and(
              eq(applicationNotes.applicationId, applicationId),
              eq(applicationNotes.userId, userId),
            ),
          )
          .orderBy(desc(applicationNotes.createdAt)),
        db
          .select({
            id: applicationMaterials.id,
            materialId: applicationMaterials.materialId,
            purpose: applicationMaterials.purpose,
            createdAt: applicationMaterials.createdAt,
            name: materials.name,
            type: materials.type,
            version: materials.version,
            fileUrl: materials.fileUrl,
            tags: materials.tags,
            notes: materials.notes,
          })
          .from(applicationMaterials)
          .innerJoin(materials, eq(materials.id, applicationMaterials.materialId))
          .where(
            and(
              eq(applicationMaterials.applicationId, applicationId),
              eq(applicationMaterials.userId, userId),
            ),
          )
          .orderBy(desc(applicationMaterials.createdAt)),
        db
          .select({
            id: offers.id,
            location: offers.location,
            team: offers.team,
            responseDeadlineAt: offers.responseDeadlineAt,
            decisionStatus: offers.decisionStatus,
            baseSalary: offers.baseSalary,
            bonus: offers.bonus,
            pros: offers.pros,
            cons: offers.cons,
            updatedAt: offers.updatedAt,
          })
          .from(offers)
          .where(and(eq(offers.applicationId, applicationId), eq(offers.userId, userId)))
          .limit(1),
      ]);

      return {
        ...application,
        events,
        detailNotes: notes,
        materials: materialRows,
        offer: offerRecord ?? null,
      };
    },
  );
}

export async function getApplicationEditDefaults(
  userId: string,
  applicationId: string,
): Promise<ApplicationFormValues | null> {
  const detail = await getApplicationDetail(userId, applicationId);

  if (!detail) {
    return null;
  }

  return {
    companyName: detail.companyName,
    companyWebsite: detail.companyWebsite ?? "",
    companyIndustry: detail.companyIndustry ?? "",
    companyLocation: detail.companyLocation ?? "",
    title: detail.title,
    department: detail.department ?? "",
    location: detail.location ?? "",
    source: detail.source,
    sourceUrl: detail.sourceUrl ?? "",
    employmentType: detail.employmentType,
    currentStatus: detail.currentStatus,
    priority: detail.priority,
    deadlineAt: detail.deadlineAt
      ? new Date(detail.deadlineAt).toISOString().slice(0, 10)
      : "",
    appliedAt: detail.appliedAt
      ? new Date(detail.appliedAt).toISOString().slice(0, 10)
      : "",
    referralName: detail.referralName ?? "",
    salaryMin: detail.salaryRange?.min ? String(detail.salaryRange.min) : "",
    salaryMax: detail.salaryRange?.max ? String(detail.salaryRange.max) : "",
    salaryCurrency: detail.salaryRange?.currency ?? "",
    salaryPeriod: (detail.salaryRange?.period ?? "") as ApplicationFormValues["salaryPeriod"],
    notes: detail.notes ?? "",
  };
}

export async function getUpcomingEvents(userId: string, limit = 8) {
  return measureServerOperation("applications.getUpcomingEvents", { userId, limit }, async () => {
    const db = getDb();

    return db
      .select({
        id: applicationEvents.id,
        applicationId: applicationEvents.applicationId,
        title: applicationEvents.title,
        eventType: applicationEvents.eventType,
        startsAt: applicationEvents.startsAt,
        status: applicationEvents.status,
        applicationTitle: applications.title,
        companyName: companies.name,
      })
      .from(applicationEvents)
      .innerJoin(applications, eq(applications.id, applicationEvents.applicationId))
      .innerJoin(companies, eq(companies.id, applications.companyId))
      .where(
        and(
          eq(applicationEvents.userId, userId),
          eq(applicationEvents.status, "scheduled"),
          sql`${applicationEvents.startsAt} >= now()`,
        ),
      )
      .orderBy(asc(applicationEvents.startsAt))
      .limit(limit);
  });
}

export async function listApplicationOptions(userId: string): Promise<ApplicationOption[]> {
  const db = getDb();

  return db
    .select({
      id: applications.id,
      companyName: companies.name,
      title: applications.title,
      currentStatus: applications.currentStatus,
    })
    .from(applications)
    .innerJoin(companies, eq(companies.id, applications.companyId))
    .where(eq(applications.userId, userId))
    .orderBy(desc(applications.updatedAt));
}
