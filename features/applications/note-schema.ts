import { z } from "zod";
import { noteTypes } from "@/lib/constants";

const optionalText = z.string().trim().optional().or(z.literal(""));

export const noteFormSchema = z.object({
  applicationId: z.string().uuid("岗位信息无效"),
  noteType: z.enum(noteTypes),
  content: z.string().trim().min(2, "备注至少 2 个字符"),
  redirectTo: optionalText,
});

export type NoteFormValues = z.infer<typeof noteFormSchema>;

export type NoteFormActionState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof NoteFormValues, string[]>>;
};

export function mapNoteFormData(formData: FormData): NoteFormValues {
  return {
    applicationId: String(formData.get("applicationId") ?? ""),
    noteType: String(formData.get("noteType") ?? "general") as NoteFormValues["noteType"],
    content: String(formData.get("content") ?? ""),
    redirectTo: String(formData.get("redirectTo") ?? ""),
  };
}

export function mapNoteFormToDbInput(values: NoteFormValues) {
  return {
    applicationId: values.applicationId,
    noteType: values.noteType,
    content: values.content.trim(),
    redirectTo: values.redirectTo?.trim() || null,
  };
}
