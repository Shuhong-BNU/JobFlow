import "server-only";

import { getApplicationDetail } from "@/features/applications/server/queries";
import { buildInterviewPrepPrompt, getInterviewPrepSystemPrompt } from "@/features/ai/prompts/interview-prep";
import { buildParseJobDescriptionPrompt, getParseJobDescriptionSystemPrompt } from "@/features/ai/prompts/parse-jd";
import { buildSuggestNextActionsPrompt, getSuggestNextActionsSystemPrompt } from "@/features/ai/prompts/suggest-next-actions";
import { interviewPrepResponseSchema } from "@/features/ai/schema/interview-prep";
import { parseJobDescriptionResponseSchema } from "@/features/ai/schema/parse-jd";
import { suggestNextActionsResponseSchema } from "@/features/ai/schema/suggest-next-actions";
import {
  buildApplicationAiSnapshot,
  buildInterviewPrepFallback,
  buildParseJobDescriptionFallback,
  buildSuggestNextActionsFallback,
} from "@/features/ai/server/fallbacks";
import { generateStructuredObject } from "@/features/ai/server/provider";
import { createAiTask, finishAiTask } from "@/features/ai/server/repository";
import { measureServerOperation } from "@/lib/server/logger";

export async function parseJobDescriptionWithAi(params: {
  userId: string;
  jdText: string;
  sourceUrl?: string | null;
}) {
  return measureServerOperation(
    "ai.parseJobDescription",
    { userId: params.userId, hasSourceUrl: Boolean(params.sourceUrl) },
    async () => {
      const task = await createAiTask({
        userId: params.userId,
        taskType: "parse_jd",
        inputPayload: {
          jdText: params.jdText,
          sourceUrl: params.sourceUrl ?? null,
        },
      });

      try {
        const providerResult = await generateStructuredObject({
          systemPrompt: getParseJobDescriptionSystemPrompt(),
          userPrompt: buildParseJobDescriptionPrompt(params),
          responseSchema: parseJobDescriptionResponseSchema,
        });

        await finishAiTask({
          taskId: task.id,
          status: "success",
          outputPayload: {
            source: "provider",
            provider: providerResult.provider,
            model: providerResult.model,
            result: providerResult.object,
          },
        });

        return {
          taskId: task.id,
          source: "provider" as const,
          result: providerResult.object,
          info: `${providerResult.provider} / ${providerResult.model}`,
        };
      } catch (error) {
        const fallback = buildParseJobDescriptionFallback(params);

        await finishAiTask({
          taskId: task.id,
          status: "success",
          outputPayload: {
            source: "fallback",
            reason: error instanceof Error ? error.message : "unknown_error",
            result: fallback,
          },
        });

        return {
          taskId: task.id,
          source: "fallback" as const,
          result: fallback,
          info: error instanceof Error ? error.message : "AI provider unavailable",
        };
      }
    },
  );
}

export async function suggestNextActionsWithAi(params: {
  userId: string;
  applicationId: string;
}) {
  return measureServerOperation(
    "ai.suggestNextActions",
    { userId: params.userId, applicationId: params.applicationId },
    async () => {
      const detail = await getApplicationDetail(params.userId, params.applicationId);

      if (!detail) {
        throw new Error("岗位不存在，无法生成 AI 建议。");
      }

      const snapshot = buildApplicationAiSnapshot(detail);
      const task = await createAiTask({
        userId: params.userId,
        taskType: "suggest_next_step",
        inputPayload: snapshot,
      });

      try {
        const providerResult = await generateStructuredObject({
          systemPrompt: getSuggestNextActionsSystemPrompt(),
          userPrompt: buildSuggestNextActionsPrompt({
            applicationSnapshot: snapshot,
          }),
          responseSchema: suggestNextActionsResponseSchema,
        });

        await finishAiTask({
          taskId: task.id,
          status: "success",
          outputPayload: {
            source: "provider",
            provider: providerResult.provider,
            model: providerResult.model,
            result: providerResult.object,
          },
        });

        return {
          taskId: task.id,
          source: "provider" as const,
          result: providerResult.object,
          info: `${providerResult.provider} / ${providerResult.model}`,
        };
      } catch (error) {
        const fallback = buildSuggestNextActionsFallback(detail);

        await finishAiTask({
          taskId: task.id,
          status: "success",
          outputPayload: {
            source: "fallback",
            reason: error instanceof Error ? error.message : "unknown_error",
            result: fallback,
          },
        });

        return {
          taskId: task.id,
          source: "fallback" as const,
          result: fallback,
          info: error instanceof Error ? error.message : "AI provider unavailable",
        };
      }
    },
  );
}

export async function generateInterviewPrepWithAi(params: {
  userId: string;
  applicationId: string;
  extraContext?: string | null;
}) {
  return measureServerOperation(
    "ai.generateInterviewPrep",
    {
      userId: params.userId,
      applicationId: params.applicationId,
      hasExtraContext: Boolean(params.extraContext),
    },
    async () => {
      const detail = await getApplicationDetail(params.userId, params.applicationId);

      if (!detail) {
        throw new Error("岗位不存在，无法生成面试准备摘要。");
      }

      const snapshot = buildApplicationAiSnapshot(detail);
      const task = await createAiTask({
        userId: params.userId,
        taskType: "interview_prep",
        inputPayload: {
          snapshot,
          extraContext: params.extraContext ?? null,
        },
      });

      try {
        const providerResult = await generateStructuredObject({
          systemPrompt: getInterviewPrepSystemPrompt(),
          userPrompt: buildInterviewPrepPrompt({
            applicationSnapshot: snapshot,
            extraContext: params.extraContext,
          }),
          responseSchema: interviewPrepResponseSchema,
        });

        await finishAiTask({
          taskId: task.id,
          status: "success",
          outputPayload: {
            source: "provider",
            provider: providerResult.provider,
            model: providerResult.model,
            result: providerResult.object,
          },
        });

        return {
          taskId: task.id,
          source: "provider" as const,
          result: providerResult.object,
          info: `${providerResult.provider} / ${providerResult.model}`,
        };
      } catch (error) {
        const fallback = buildInterviewPrepFallback({
          detail,
          extraContext: params.extraContext,
        });

        await finishAiTask({
          taskId: task.id,
          status: "success",
          outputPayload: {
            source: "fallback",
            reason: error instanceof Error ? error.message : "unknown_error",
            result: fallback,
          },
        });

        return {
          taskId: task.id,
          source: "fallback" as const,
          result: fallback,
          info: error instanceof Error ? error.message : "AI provider unavailable",
        };
      }
    },
  );
}
