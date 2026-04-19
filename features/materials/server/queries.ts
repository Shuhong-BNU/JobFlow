import "server-only";

import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
import { getDb } from "@/db";
import { applicationMaterials, applications, companies, materials } from "@/db/schema";
import type {
  MaterialAttachmentItem,
  MaterialDetail,
  MaterialListFilter,
  MaterialListItem,
} from "@/features/materials/types";

export async function listMaterials(
  userId: string,
  filters: MaterialListFilter = {},
): Promise<MaterialListItem[]> {
  const db = getDb();
  const whereConditions = [eq(materials.userId, userId)];

  if (filters.query) {
    whereConditions.push(
      or(
        ilike(materials.name, `%${filters.query}%`),
        ilike(materials.version, `%${filters.query}%`),
      )!,
    );
  }

  if (filters.type && filters.type !== "all") {
    whereConditions.push(eq(materials.type, filters.type));
  }

  return db
    .select({
      id: materials.id,
      type: materials.type,
      name: materials.name,
      fileUrl: materials.fileUrl,
      version: materials.version,
      tags: materials.tags,
      notes: materials.notes,
      createdAt: materials.createdAt,
      updatedAt: materials.updatedAt,
    })
    .from(materials)
    .where(and(...whereConditions))
    .orderBy(desc(materials.updatedAt), asc(materials.name));
}

export async function getMaterialDetail(
  userId: string,
  materialId: string,
): Promise<MaterialDetail | null> {
  const db = getDb();
  const [material] = await db
    .select({
      id: materials.id,
      type: materials.type,
      name: materials.name,
      fileUrl: materials.fileUrl,
      version: materials.version,
      tags: materials.tags,
      notes: materials.notes,
      createdAt: materials.createdAt,
      updatedAt: materials.updatedAt,
    })
    .from(materials)
    .where(and(eq(materials.id, materialId), eq(materials.userId, userId)))
    .limit(1);

  if (!material) {
    return null;
  }

  return {
    ...material,
    attachments: await listMaterialAttachments(userId, materialId),
  };
}

export async function listApplicationMaterials(
  userId: string,
  applicationId: string,
): Promise<MaterialAttachmentItem[]> {
  const db = getDb();

  return db
    .select({
      id: applicationMaterials.id,
      applicationId: applicationMaterials.applicationId,
      materialId: applicationMaterials.materialId,
      purpose: applicationMaterials.purpose,
      createdAt: applicationMaterials.createdAt,
      materialName: materials.name,
      materialType: materials.type,
      version: materials.version,
      fileUrl: materials.fileUrl,
      tags: materials.tags,
    })
    .from(applicationMaterials)
    .innerJoin(materials, eq(materials.id, applicationMaterials.materialId))
    .where(
      and(
        eq(applicationMaterials.applicationId, applicationId),
        eq(applicationMaterials.userId, userId),
      ),
    )
    .orderBy(desc(applicationMaterials.createdAt));
}

export async function listMaterialAttachments(
  userId: string,
  materialId: string,
): Promise<MaterialAttachmentItem[]> {
  const db = getDb();

  return db
    .select({
      id: applicationMaterials.id,
      applicationId: applicationMaterials.applicationId,
      materialId: applicationMaterials.materialId,
      purpose: applicationMaterials.purpose,
      createdAt: applicationMaterials.createdAt,
      materialName: materials.name,
      materialType: materials.type,
      version: materials.version,
      fileUrl: materials.fileUrl,
      tags: materials.tags,
      applicationTitle: applications.title,
      companyName: companies.name,
    })
    .from(applicationMaterials)
    .innerJoin(materials, eq(materials.id, applicationMaterials.materialId))
    .innerJoin(applications, eq(applications.id, applicationMaterials.applicationId))
    .innerJoin(companies, eq(companies.id, applications.companyId))
    .where(
      and(eq(applicationMaterials.materialId, materialId), eq(applicationMaterials.userId, userId)),
    )
    .orderBy(desc(applicationMaterials.createdAt));
}
