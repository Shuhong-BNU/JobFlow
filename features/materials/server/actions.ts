"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { applicationMaterials, applications, materials } from "@/db/schema";
import {
  attachMaterialSchema,
  mapAttachMaterialData,
  mapMaterialFormData,
  mapMaterialFormToDbInput,
  materialFormSchema,
  type MaterialAttachActionState,
  type MaterialFormActionState,
} from "@/features/materials/schema";
import { deleteMaterialFile, saveMaterialFile } from "@/features/materials/server/storage";
import { measureServerOperation } from "@/lib/server/logger";
import { requireUser } from "@/server/permissions";

function revalidateMaterialPaths(redirectTo: string, applicationId?: string) {
  revalidatePath("/materials");
  if (applicationId) {
    revalidatePath(`/applications/${applicationId}`);
  }
  if (redirectTo.startsWith("/applications/")) {
    revalidatePath(redirectTo);
  }
}

function fallbackMaterialRedirect(materialId?: string) {
  return materialId ? `/materials?selected=${materialId}` : "/materials";
}

function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

export async function createMaterialAction(
  _prevState: MaterialFormActionState,
  formData: FormData,
): Promise<MaterialFormActionState> {
  const user = await requireUser();
  const parsed = materialFormSchema.safeParse(mapMaterialFormData(formData));

  if (!parsed.success) {
    return {
      error: "请先修正材料表单内容。",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const input = mapMaterialFormToDbInput(parsed.data);
  const fileInput = formData.get("file");

  if (!isUploadedFile(fileInput) && !input.externalFileUrl) {
    return {
      error: "请上传文件，或提供一个外部文件链接。",
    };
  }

  const fileUrl = isUploadedFile(fileInput)
    ? await saveMaterialFile(user.id, fileInput)
    : input.externalFileUrl!;

  const db = getDb();
  const [material] = await measureServerOperation(
    "materials.create",
    { userId: user.id, type: input.type, name: input.name, hasUpload: isUploadedFile(fileInput) },
    async () =>
      db
        .insert(materials)
        .values({
          userId: user.id,
          type: input.type,
          name: input.name,
          version: input.version,
          tags: input.tags,
          notes: input.notes,
          fileUrl,
        })
        .returning({ id: materials.id }),
  );

  const redirectTo = input.redirectTo ?? fallbackMaterialRedirect(material.id);
  revalidateMaterialPaths(redirectTo);
  redirect(redirectTo.includes("selected=") ? redirectTo : fallbackMaterialRedirect(material.id));
}

export async function updateMaterialAction(
  materialId: string,
  _prevState: MaterialFormActionState,
  formData: FormData,
): Promise<MaterialFormActionState> {
  const user = await requireUser();
  const parsed = materialFormSchema.safeParse(mapMaterialFormData(formData));

  if (!parsed.success) {
    return {
      error: "请先修正材料表单内容。",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const input = mapMaterialFormToDbInput(parsed.data);
  const fileInput = formData.get("file");
  const db = getDb();

  const [existing] = await db
    .select({
      id: materials.id,
      fileUrl: materials.fileUrl,
    })
    .from(materials)
    .where(and(eq(materials.id, materialId), eq(materials.userId, user.id)))
    .limit(1);

  if (!existing) {
    return {
      error: "材料不存在，或你没有权限编辑。",
    };
  }

  let fileUrl = input.currentFileUrl ?? existing.fileUrl;

  if (isUploadedFile(fileInput)) {
    fileUrl = await saveMaterialFile(user.id, fileInput);
    await deleteMaterialFile(existing.fileUrl);
  } else if (input.externalFileUrl) {
    if (existing.fileUrl !== input.externalFileUrl) {
      await deleteMaterialFile(existing.fileUrl);
    }
    fileUrl = input.externalFileUrl;
  }

  if (!fileUrl) {
    return {
      error: "请保留当前文件，或重新上传一个文件。",
    };
  }

  await measureServerOperation(
    "materials.update",
    { userId: user.id, materialId, type: input.type, name: input.name },
    async () => {
      await db
        .update(materials)
        .set({
          type: input.type,
          name: input.name,
          version: input.version,
          tags: input.tags,
          notes: input.notes,
          fileUrl,
          updatedAt: new Date(),
        })
        .where(eq(materials.id, materialId));
    },
  );

  const redirectTo = input.redirectTo ?? fallbackMaterialRedirect(materialId);
  revalidateMaterialPaths(redirectTo);
  redirect(redirectTo.includes("selected=") ? redirectTo : fallbackMaterialRedirect(materialId));
}

export async function deleteMaterialAction(formData: FormData) {
  const user = await requireUser();
  const materialId = String(formData.get("materialId") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "") || "/materials";
  const applicationId = String(formData.get("applicationId") ?? "");

  if (!materialId) {
    redirect(redirectTo);
  }

  const db = getDb();
  const [material] = await db
    .select({
      id: materials.id,
      fileUrl: materials.fileUrl,
    })
    .from(materials)
    .where(and(eq(materials.id, materialId), eq(materials.userId, user.id)))
    .limit(1);

  if (material) {
    await measureServerOperation(
      "materials.delete",
      { userId: user.id, materialId },
      async () => {
        await db
          .delete(materials)
          .where(and(eq(materials.id, materialId), eq(materials.userId, user.id)));
        await deleteMaterialFile(material.fileUrl);
      },
    );
  }

  revalidateMaterialPaths(redirectTo, applicationId || undefined);
  redirect(redirectTo);
}

export async function attachMaterialAction(
  _prevState: MaterialAttachActionState,
  formData: FormData,
): Promise<MaterialAttachActionState> {
  const user = await requireUser();
  const parsed = attachMaterialSchema.safeParse(mapAttachMaterialData(formData));

  if (!parsed.success) {
    return {
      error: "请先修正绑定信息。",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const db = getDb();
  const [application, material, existing] = await Promise.all([
    db
      .select({ id: applications.id })
      .from(applications)
      .where(and(eq(applications.id, parsed.data.applicationId), eq(applications.userId, user.id)))
      .limit(1),
    db
      .select({ id: materials.id })
      .from(materials)
      .where(and(eq(materials.id, parsed.data.materialId), eq(materials.userId, user.id)))
      .limit(1),
    db
      .select({ id: applicationMaterials.id })
      .from(applicationMaterials)
      .where(
        and(
          eq(applicationMaterials.applicationId, parsed.data.applicationId),
          eq(applicationMaterials.materialId, parsed.data.materialId),
          eq(applicationMaterials.purpose, parsed.data.purpose),
          eq(applicationMaterials.userId, user.id),
        ),
      )
      .limit(1),
  ]);

  if (!application[0] || !material[0]) {
    return {
      error: "岗位或材料不存在，无法完成绑定。",
    };
  }

  if (existing[0]) {
    return {
      error: "这个材料已经以相同用途绑定到该岗位了。",
    };
  }

  await measureServerOperation(
    "materials.attach",
    {
      userId: user.id,
      applicationId: parsed.data.applicationId,
      materialId: parsed.data.materialId,
      purpose: parsed.data.purpose,
    },
    async () => {
      await db.insert(applicationMaterials).values({
        userId: user.id,
        applicationId: parsed.data.applicationId,
        materialId: parsed.data.materialId,
        purpose: parsed.data.purpose,
      });
    },
  );

  const redirectTo = parsed.data.redirectTo || `/applications/${parsed.data.applicationId}`;
  revalidateMaterialPaths(redirectTo, parsed.data.applicationId);
  redirect(redirectTo);
}

export async function detachMaterialAction(formData: FormData) {
  const user = await requireUser();
  const attachmentId = String(formData.get("attachmentId") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "") || "/materials";
  const applicationId = String(formData.get("applicationId") ?? "");

  if (!attachmentId) {
    redirect(redirectTo);
  }

  const db = getDb();
  await measureServerOperation(
    "materials.detach",
    { userId: user.id, applicationId, attachmentId },
    async () => {
      await db
        .delete(applicationMaterials)
        .where(
          and(eq(applicationMaterials.id, attachmentId), eq(applicationMaterials.userId, user.id)),
        );
    },
  );

  revalidateMaterialPaths(redirectTo, applicationId || undefined);
  redirect(redirectTo);
}
