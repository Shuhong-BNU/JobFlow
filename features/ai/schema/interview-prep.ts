import { z } from "zod";

export const interviewPrepResponseSchema = z.object({
  coreCompetencies: z.array(z.string().trim()).default([]),
  questionDirections: z.array(z.string().trim()).default([]),
  prepChecklist: z.array(z.string().trim()).default([]),
  companyResearchAngles: z.array(z.string().trim()).default([]),
  resumeTalkingPoints: z.array(z.string().trim()).default([]),
  cautionNotes: z.array(z.string().trim()).default([]),
});

export type InterviewPrepResult = z.infer<typeof interviewPrepResponseSchema>;
