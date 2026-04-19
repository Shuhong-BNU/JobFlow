import { format } from "date-fns";
import { z } from "zod";
import { offerDecisionStatuses } from "@/lib/constants";

const optionalText = z.string().trim().optional().or(z.literal(""));

export const offerFormSchema = z.object({
  applicationId: z.string().uuid("岗位信息无效"),
  baseSalary: optionalText,
  bonus: optionalText,
  location: optionalText,
  team: optionalText,
  responseDeadlineAt: optionalText,
  decisionStatus: z.enum(offerDecisionStatuses),
  pros: optionalText,
  cons: optionalText,
  redirectTo: optionalText,
});

export type OfferFormValues = z.infer<typeof offerFormSchema>;

export type OfferFormActionState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof OfferFormValues, string[]>>;
};

export function mapOfferFormData(formData: FormData): OfferFormValues {
  return {
    applicationId: String(formData.get("applicationId") ?? ""),
    baseSalary: String(formData.get("baseSalary") ?? ""),
    bonus: String(formData.get("bonus") ?? ""),
    location: String(formData.get("location") ?? ""),
    team: String(formData.get("team") ?? ""),
    responseDeadlineAt: String(formData.get("responseDeadlineAt") ?? ""),
    decisionStatus: String(formData.get("decisionStatus") ?? "pending") as OfferFormValues["decisionStatus"],
    pros: String(formData.get("pros") ?? ""),
    cons: String(formData.get("cons") ?? ""),
    redirectTo: String(formData.get("redirectTo") ?? ""),
  };
}

function parseOptionalInteger(value: string) {
  if (!value.trim()) {
    return null;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.round(numeric) : null;
}

export function mapOfferFormToDbInput(values: OfferFormValues) {
  return {
    applicationId: values.applicationId,
    baseSalary: parseOptionalInteger(values.baseSalary ?? ""),
    bonus: parseOptionalInteger(values.bonus ?? ""),
    location: values.location?.trim() || null,
    team: values.team?.trim() || null,
    responseDeadlineAt: values.responseDeadlineAt
      ? new Date(`${values.responseDeadlineAt}T00:00:00`)
      : null,
    decisionStatus: values.decisionStatus,
    pros: values.pros?.trim() || null,
    cons: values.cons?.trim() || null,
    redirectTo: values.redirectTo?.trim() || null,
  };
}

export function formatOfferDateInput(value: Date | string | null | undefined) {
  if (!value) {
    return "";
  }

  return format(new Date(value), "yyyy-MM-dd");
}
