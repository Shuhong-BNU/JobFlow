'use server';

import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { applicationMaterials, applications, materials } from '@/db/schema';
import { requireUser } from '@/lib/auth-helpers';
import { materialFormSchema, parseTags, type MaterialFormInput } from './schema';

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function createMaterial(
  input: MaterialFormInput
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = materialFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'invalidInput', fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const v = parsed.data;

  const [row] = await db
    .insert(materials)
    .values({
      userId: user.id,
      type: v.type,
      name: v.name,
      version: v.version,
      fileUrl: v.fileUrl,
      tags: parseTags(v.tags),
      notes: v.notes,
    })
    .returning({ id: materials.id });

  revalidatePath('/app/materials');
  return { ok: true, data: { id: row!.id } };
}

export async function updateMaterial(
  id: string,
  input: MaterialFormInput
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = materialFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'invalidInput', fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const v = parsed.data;

  const [existing] = await db
    .select({ id: materials.id })
    .from(materials)
    .where(and(eq(materials.id, id), eq(materials.userId, user.id)))
    .limit(1);
  if (!existing) return { ok: false, error: 'notFound' };

  const [row] = await db
    .update(materials)
    .set({
      type: v.type,
      name: v.name,
      version: v.version,
      fileUrl: v.fileUrl,
      tags: parseTags(v.tags),
      notes: v.notes,
      updatedAt: new Date(),
    })
    .where(eq(materials.id, id))
    .returning({ id: materials.id });

  revalidatePath('/app/materials');
  // 被绑定的申请页也需要失效
  const links = await db
    .select({ applicationId: applicationMaterials.applicationId })
    .from(applicationMaterials)
    .where(eq(applicationMaterials.materialId, id));
  for (const link of links) {
    revalidatePath(`/app/applications/${link.applicationId}`);
  }
  return { ok: true, data: { id: row!.id } };
}

export async function deleteMaterial(id: string): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const [existing] = await db
    .select({ id: materials.id })
    .from(materials)
    .where(and(eq(materials.id, id), eq(materials.userId, user.id)))
    .limit(1);
  if (!existing) return { ok: false, error: 'notFound' };

  // 先抓所有绑定，用于后续 revalidate
  const links = await db
    .select({ applicationId: applicationMaterials.applicationId })
    .from(applicationMaterials)
    .where(eq(applicationMaterials.materialId, id));

  // schema 里 application_materials.material_id 是 cascade，直接删主表即可
  await db.delete(materials).where(eq(materials.id, id));

  revalidatePath('/app/materials');
  for (const link of links) {
    revalidatePath(`/app/applications/${link.applicationId}`);
  }
  return { ok: true, data: { id } };
}

/**
 * 把已有的 material 绑到某条申请上。purpose 允许为空（"submitted"/"revised" 是
 * 常见语义但不是必须）。数据库层有 (applicationId, materialId, purpose) 唯一
 * 约束 —— 同一条材料用同一 purpose 只能绑一次。
 */
export async function attachMaterialToApplication(params: {
  applicationId: string;
  materialId: string;
  purpose?: string;
}): Promise<ActionResult<{ bindingId: string }>> {
  const user = await requireUser();
  const { applicationId, materialId, purpose } = params;

  // 两侧 ownership 同时校验：application 属于 user，material 也属于 user
  const [parent] = await db
    .select({ id: applications.id })
    .from(applications)
    .where(and(eq(applications.id, applicationId), eq(applications.userId, user.id)))
    .limit(1);
  if (!parent) return { ok: false, error: 'notFound' };

  const [mat] = await db
    .select({ id: materials.id })
    .from(materials)
    .where(and(eq(materials.id, materialId), eq(materials.userId, user.id)))
    .limit(1);
  if (!mat) return { ok: false, error: 'notFound' };

  const normalizedPurpose = purpose?.trim() ? purpose.trim() : null;

  // 幂等：同 (applicationId, materialId, purpose) 三元组已存在时直接返回，避免
  // 触发 unique 约束异常。不同 purpose 算不同绑定，下面 insert 会继续。
  const existing = await db
    .select({ id: applicationMaterials.id, purpose: applicationMaterials.purpose })
    .from(applicationMaterials)
    .where(
      and(
        eq(applicationMaterials.applicationId, applicationId),
        eq(applicationMaterials.materialId, materialId)
      )
    );
  const dup = existing.find((r) => (r.purpose ?? null) === normalizedPurpose);
  if (dup) {
    return { ok: true, data: { bindingId: dup.id } };
  }

  const [created] = await db
    .insert(applicationMaterials)
    .values({
      applicationId,
      materialId,
      purpose: normalizedPurpose,
    })
    .returning({ id: applicationMaterials.id });

  revalidatePath(`/app/applications/${applicationId}`);
  revalidatePath('/app/materials');
  return { ok: true, data: { bindingId: created!.id } };
}

export async function detachMaterialFromApplication(
  bindingId: string
): Promise<ActionResult<{ bindingId: string }>> {
  const user = await requireUser();

  // ownership：通过 application → user 绕一圈
  const [row] = await db
    .select({
      id: applicationMaterials.id,
      applicationId: applicationMaterials.applicationId,
      userId: applications.userId,
    })
    .from(applicationMaterials)
    .innerJoin(applications, eq(applicationMaterials.applicationId, applications.id))
    .where(eq(applicationMaterials.id, bindingId))
    .limit(1);
  if (!row || row.userId !== user.id) return { ok: false, error: 'notFound' };

  await db.delete(applicationMaterials).where(eq(applicationMaterials.id, bindingId));
  revalidatePath(`/app/applications/${row.applicationId}`);
  revalidatePath('/app/materials');
  return { ok: true, data: { bindingId } };
}
