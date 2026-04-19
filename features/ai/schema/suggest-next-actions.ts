import { z } from "zod";

export const suggestNextActionsResponseSchema = z.object({
  nextActions: z.array(z.string().trim()).min(1),
  risks: z.array(z.string().trim()).default([]),
  reasoningSummary: z.string().trim(),
  recommendedPriority: z.enum(["keep", "raise", "watch"]),
  suggestedEventTypes: z
    .array(z.enum(["follow_up", "interview", "offer_response", "reminder"]))
    .default([]),
});

export type SuggestNextActionsResult = z.infer<
  typeof suggestNextActionsResponseSchema
>;
