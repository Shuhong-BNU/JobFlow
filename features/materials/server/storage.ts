"use server";

import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const MATERIALS_UPLOAD_ROOT = path.join(
  process.cwd(),
  "public",
  "uploads",
  "materials",
);

export async function saveMaterialFile(userId: string, file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const safeExtension = path.extname(file.name || "").slice(0, 10) || ".bin";
  const fileName = `${randomUUID()}${safeExtension}`;
  const absoluteDir = path.join(MATERIALS_UPLOAD_ROOT, userId);
  const absolutePath = path.join(absoluteDir, fileName);

  await mkdir(absoluteDir, { recursive: true });
  await writeFile(absolutePath, buffer);

  return `/uploads/materials/${userId}/${fileName}`;
}

export async function deleteMaterialFile(fileUrl: string | null | undefined) {
  if (!fileUrl || !fileUrl.startsWith("/uploads/materials/")) {
    return;
  }

  const normalized = fileUrl.replace(/^\/+/, "");
  const absolutePath = path.join(process.cwd(), "public", normalized);

  try {
    await unlink(absolutePath);
  } catch {
    // Ignore missing local files so deleting metadata never blocks the user.
  }
}
