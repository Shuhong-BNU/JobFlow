import 'server-only';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/db/client';
import { applicationMaterials, applications, materials } from '@/db/schema';
import type { MaterialType } from '@/lib/enums';

export type MaterialRow = {
  id: string;
  type: MaterialType;
  name: string;
  version: string | null;
  fileUrl: string | null;
  tags: string[];
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ApplicationMaterialBinding = {
  bindingId: string;
  material: MaterialRow;
  purpose: string | null;
  createdAt: Date;
};

const baseSelect = {
  id: materials.id,
  type: materials.type,
  name: materials.name,
  version: materials.version,
  fileUrl: materials.fileUrl,
  tags: materials.tags,
  notes: materials.notes,
  createdAt: materials.createdAt,
  updatedAt: materials.updatedAt,
} as const;

function normalize(row: {
  id: string;
  type: MaterialType;
  name: string;
  version: string | null;
  fileUrl: string | null;
  tags: unknown;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): MaterialRow {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    version: row.version,
    fileUrl: row.fileUrl,
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listMaterials(
  userId: string,
  filter?: { type?: MaterialType }
): Promise<MaterialRow[]> {
  const where = filter?.type
    ? and(eq(materials.userId, userId), eq(materials.type, filter.type))
    : eq(materials.userId, userId);
  const rows = await db.select(baseSelect).from(materials).where(where).orderBy(desc(materials.updatedAt));
  return rows.map(normalize);
}

export async function getMaterialById(
  userId: string,
  materialId: string
): Promise<MaterialRow | null> {
  const [row] = await db
    .select(baseSelect)
    .from(materials)
    .where(and(eq(materials.id, materialId), eq(materials.userId, userId)))
    .limit(1);
  return row ? normalize(row) : null;
}

/**
 * 详情页 Materials tab 用：拿当前 application 已绑定的材料。
 * 两步查：先通过 ownership 拿 bindings，再批量拉 material 元数据。
 */
export async function listBindingsForApplication(
  userId: string,
  applicationId: string
): Promise<ApplicationMaterialBinding[]> {
  const [owner] = await db
    .select({ id: applications.id })
    .from(applications)
    .where(and(eq(applications.id, applicationId), eq(applications.userId, userId)))
    .limit(1);
  if (!owner) return [];

  const bindings = await db
    .select({
      bindingId: applicationMaterials.id,
      materialId: applicationMaterials.materialId,
      purpose: applicationMaterials.purpose,
      createdAt: applicationMaterials.createdAt,
    })
    .from(applicationMaterials)
    .where(eq(applicationMaterials.applicationId, applicationId))
    .orderBy(desc(applicationMaterials.createdAt));

  if (bindings.length === 0) return [];

  const materialIds = bindings.map((b) => b.materialId);
  const materialRows = await db
    .select(baseSelect)
    .from(materials)
    .where(and(eq(materials.userId, userId), inArray(materials.id, materialIds)));
  const byId = new Map(materialRows.map((m) => [m.id, normalize(m)]));

  return bindings
    .map((b) => {
      const material = byId.get(b.materialId);
      if (!material) return null;
      return {
        bindingId: b.bindingId,
        material,
        purpose: b.purpose,
        createdAt: b.createdAt,
      } satisfies ApplicationMaterialBinding;
    })
    .filter((x): x is ApplicationMaterialBinding => x !== null);
}
