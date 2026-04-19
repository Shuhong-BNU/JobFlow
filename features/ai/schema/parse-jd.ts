import { z } from "zod";
import { employmentTypes } from "@/lib/constants";

export const parseJobDescriptionResponseSchema = z.object({
  companyName: z.string().trim().nullable(),
  title: z.string().trim().nullable(),
  location: z.string().trim().nullable(),
  employmentType: z.enum(employmentTypes).nullable(),
  skills: z.array(z.string().trim()).default([]),
  keywords: z.array(z.string().trim()).default([]),
  deadlineText: z.string().trim().nullable(),
  deadlineAt: z.string().trim().nullable(),
  summary: z.string().trim(),
  confidenceNotes: z.array(z.string().trim()).default([]),
});

export type ParseJobDescriptionResult = z.infer<
  typeof parseJobDescriptionResponseSchema
>;
