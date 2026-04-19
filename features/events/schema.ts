import { format } from "date-fns";
import { z } from "zod";
import { eventStatuses } from "@/lib/constants";

export const editableEventTypes = [
  "oa",
  "interview",
  "offer_response",
  "follow_up",
  "reminder",
  "task",
] as const;

const optionalText = z.string().trim().optional().or(z.literal(""));

export const eventFormSchema = z
  .object({
    applicationId: z.string().uuid("岗位信息无效"),
    eventType: z.enum(editableEventTypes),
    title: z.string().trim().min(2, "标题至少 2 个字符").max(180),
    description: optionalText,
    startsAt: z.string().trim().min(1, "请先选择事件时间"),
    endsAt: optionalText,
    reminderAt: optionalText,
    status: z.enum(eventStatuses),
    redirectTo: z.string().trim().optional().or(z.literal("")),
  })
  .superRefine((value, ctx) => {
    if (value.endsAt && value.startsAt) {
      const start = new Date(value.startsAt);
      const end = new Date(value.endsAt);

      if (Number.isFinite(start.getTime()) && Number.isFinite(end.getTime()) && end < start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endsAt"],
          message: "结束时间不能早于开始时间",
        });
      }
    }
  });

export type EventFormValues = z.infer<typeof eventFormSchema>;

export type EventFormActionState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof EventFormValues, string[]>>;
};

export function mapEventFormData(formData: FormData): EventFormValues {
  return {
    applicationId: String(formData.get("applicationId") ?? ""),
    eventType: String(formData.get("eventType") ?? "interview") as EventFormValues["eventType"],
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    startsAt: String(formData.get("startsAt") ?? ""),
    endsAt: String(formData.get("endsAt") ?? ""),
    reminderAt: String(formData.get("reminderAt") ?? ""),
    status: String(formData.get("status") ?? "scheduled") as EventFormValues["status"],
    redirectTo: String(formData.get("redirectTo") ?? ""),
  };
}

function parseOptionalDate(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

export function mapEventFormToDbInput(values: EventFormValues) {
  return {
    applicationId: values.applicationId,
    eventType: values.eventType,
    title: values.title.trim(),
    description: values.description?.trim() || null,
    startsAt: parseOptionalDate(values.startsAt),
    endsAt: parseOptionalDate(values.endsAt ?? ""),
    reminderAt: parseOptionalDate(values.reminderAt ?? ""),
    status: values.status,
    redirectTo: values.redirectTo?.trim() || null,
  };
}

export function formatEventDateTimeInput(value: Date | string | null | undefined) {
  if (!value) {
    return "";
  }

  return format(new Date(value), "yyyy-MM-dd'T'HH:mm");
}
