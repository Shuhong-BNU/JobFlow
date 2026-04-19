import { z } from "zod";
import {
  applicationPriorities,
  applicationSources,
  applicationStatuses,
  employmentTypes,
} from "@/lib/constants";

const optionalText = z.string().trim().optional().or(z.literal(""));
const optionalUrl = optionalText.refine(
  (value) => !value || z.string().url().safeParse(value).success,
  "请输入有效链接。",
);

export const applicationFormSchema = z.object({
  companyName: z.string().trim().min(2, "公司名至少 2 个字符。").max(160),
  companyWebsite: optionalUrl,
  companyIndustry: optionalText,
  companyLocation: optionalText,
  title: z.string().trim().min(2, "岗位名至少 2 个字符。").max(180),
  department: optionalText,
  location: optionalText,
  source: z.enum(applicationSources),
  sourceUrl: optionalUrl,
  employmentType: z.enum(employmentTypes),
  currentStatus: z.enum(applicationStatuses),
  priority: z.enum(applicationPriorities),
  deadlineAt: optionalText,
  appliedAt: optionalText,
  referralName: optionalText,
  salaryMin: optionalText,
  salaryMax: optionalText,
  salaryCurrency: optionalText,
  salaryPeriod: z.enum(["monthly", "yearly"]).optional().or(z.literal("")),
  notes: optionalText,
});

export type ApplicationFormValues = z.infer<typeof applicationFormSchema>;

export type ApplicationFormActionState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof ApplicationFormValues, string[]>>;
};

export function mapApplicationFormData(formData: FormData): ApplicationFormValues {
  return {
    companyName: String(formData.get("companyName") ?? ""),
    companyWebsite: String(formData.get("companyWebsite") ?? ""),
    companyIndustry: String(formData.get("companyIndustry") ?? ""),
    companyLocation: String(formData.get("companyLocation") ?? ""),
    title: String(formData.get("title") ?? ""),
    department: String(formData.get("department") ?? ""),
    location: String(formData.get("location") ?? ""),
    source: String(formData.get("source") ?? "official_site") as ApplicationFormValues["source"],
    sourceUrl: String(formData.get("sourceUrl") ?? ""),
    employmentType: String(
      formData.get("employmentType") ?? "internship",
    ) as ApplicationFormValues["employmentType"],
    currentStatus: String(
      formData.get("currentStatus") ?? "wishlist",
    ) as ApplicationFormValues["currentStatus"],
    priority: String(formData.get("priority") ?? "medium") as ApplicationFormValues["priority"],
    deadlineAt: String(formData.get("deadlineAt") ?? ""),
    appliedAt: String(formData.get("appliedAt") ?? ""),
    referralName: String(formData.get("referralName") ?? ""),
    salaryMin: String(formData.get("salaryMin") ?? ""),
    salaryMax: String(formData.get("salaryMax") ?? ""),
    salaryCurrency: String(formData.get("salaryCurrency") ?? ""),
    salaryPeriod: String(formData.get("salaryPeriod") ?? "") as ApplicationFormValues["salaryPeriod"],
    notes: String(formData.get("notes") ?? ""),
  };
}

function emptyToNull(value: string | undefined) {
  if (!value) {
    return null;
  }

  return value.trim() || null;
}

export function mapApplicationFormToDbInput(values: ApplicationFormValues) {
  const salaryMin = values.salaryMin ? Number(values.salaryMin) : undefined;
  const salaryMax = values.salaryMax ? Number(values.salaryMax) : undefined;

  return {
    companyName: values.companyName.trim(),
    companyWebsite: emptyToNull(values.companyWebsite),
    companyIndustry: emptyToNull(values.companyIndustry),
    companyLocation: emptyToNull(values.companyLocation),
    title: values.title.trim(),
    department: emptyToNull(values.department),
    location: emptyToNull(values.location),
    source: values.source,
    sourceUrl: emptyToNull(values.sourceUrl),
    employmentType: values.employmentType,
    currentStatus: values.currentStatus,
    priority: values.priority,
    deadlineAt: values.deadlineAt ? new Date(`${values.deadlineAt}T00:00:00`) : null,
    appliedAt: values.appliedAt ? new Date(`${values.appliedAt}T00:00:00`) : null,
    referralName: emptyToNull(values.referralName),
    notes: emptyToNull(values.notes),
    salaryRange:
      salaryMin || salaryMax || values.salaryCurrency || values.salaryPeriod
        ? {
            min: Number.isFinite(salaryMin) ? salaryMin : undefined,
            max: Number.isFinite(salaryMax) ? salaryMax : undefined,
            currency: emptyToNull(values.salaryCurrency) ?? undefined,
            period: values.salaryPeriod || undefined,
          }
        : null,
  };
}
