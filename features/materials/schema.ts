import { z } from "zod";
import { materialPurposes, materialTypes } from "@/lib/constants";

const optionalText = z.string().trim().optional().or(z.literal(""));
const optionalUrl = optionalText.refine(
  (value) => !value || z.string().url().safeParse(value).success,
  "请输入有效链接。",
);

export const materialFormSchema = z.object({
  type: z.enum(materialTypes),
  name: z.string().trim().min(2, "名称至少 2 个字符").max(180),
  version: z.string().trim().min(1, "请填写版本").max(40),
  tags: optionalText,
  notes: optionalText,
  externalFileUrl: optionalUrl,
  currentFileUrl: optionalText,
  redirectTo: optionalText,
});

export const attachMaterialSchema = z.object({
  materialId: z.string().uuid("材料信息无效"),
  applicationId: z.string().uuid("岗位信息无效"),
  purpose: z.enum(materialPurposes),
  redirectTo: optionalText,
});

export type MaterialFormValues = z.infer<typeof materialFormSchema>;
export type AttachMaterialValues = z.infer<typeof attachMaterialSchema>;

export type MaterialFormActionState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof MaterialFormValues, string[]>>;
};

export type MaterialAttachActionState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof AttachMaterialValues, string[]>>;
};

export function mapMaterialFormData(formData: FormData): MaterialFormValues {
  return {
    type: String(formData.get("type") ?? "resume") as MaterialFormValues["type"],
    name: String(formData.get("name") ?? ""),
    version: String(formData.get("version") ?? ""),
    tags: String(formData.get("tags") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    externalFileUrl: String(formData.get("externalFileUrl") ?? ""),
    currentFileUrl: String(formData.get("currentFileUrl") ?? ""),
    redirectTo: String(formData.get("redirectTo") ?? ""),
  };
}

export function mapAttachMaterialData(formData: FormData): AttachMaterialValues {
  return {
    materialId: String(formData.get("materialId") ?? ""),
    applicationId: String(formData.get("applicationId") ?? ""),
    purpose: String(formData.get("purpose") ?? "primary_resume") as AttachMaterialValues["purpose"],
    redirectTo: String(formData.get("redirectTo") ?? ""),
  };
}

export function mapMaterialFormToDbInput(values: MaterialFormValues) {
  return {
    type: values.type,
    name: values.name.trim(),
    version: values.version.trim(),
    tags: splitTags(values.tags ?? ""),
    notes: values.notes?.trim() || null,
    externalFileUrl: values.externalFileUrl?.trim() || null,
    currentFileUrl: values.currentFileUrl?.trim() || null,
    redirectTo: values.redirectTo?.trim() || null,
  };
}

export function splitTags(value: string) {
  return value
    .split(/[,\n]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}
