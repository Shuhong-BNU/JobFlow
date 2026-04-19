import type { ApplicationFormValues } from "@/features/applications/schema";
import type { InterviewPrepResult } from "@/features/ai/schema/interview-prep";
import type { ParseJobDescriptionResult } from "@/features/ai/schema/parse-jd";
import type { SuggestNextActionsResult } from "@/features/ai/schema/suggest-next-actions";

export type AiActionMeta = {
  source: "provider" | "fallback";
  taskId?: string;
  info?: string;
};

export type ParseJobDescriptionActionState = {
  error?: string;
  result?: ParseJobDescriptionResult;
  meta?: AiActionMeta;
};

export type SuggestNextActionsActionState = {
  error?: string;
  result?: SuggestNextActionsResult;
  meta?: AiActionMeta;
};

export type InterviewPrepActionState = {
  error?: string;
  result?: InterviewPrepResult;
  meta?: AiActionMeta;
};

export type ApplicationJdDraft = Partial<ApplicationFormValues> & {
  parsedSkills?: string[];
  parsedKeywords?: string[];
  parsedSummary?: string;
  parsedConfidenceNotes?: string[];
};
