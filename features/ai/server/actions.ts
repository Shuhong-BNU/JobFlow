"use server";

import { requireUser } from "@/server/permissions";
import {
  generateInterviewPrepWithAi,
  parseJobDescriptionWithAi,
  suggestNextActionsWithAi,
} from "@/features/ai/server/services";
import type {
  InterviewPrepActionState,
  ParseJobDescriptionActionState,
  SuggestNextActionsActionState,
} from "@/features/ai/types";

export async function parseJobDescriptionAction(
  _prevState: ParseJobDescriptionActionState,
  formData: FormData,
): Promise<ParseJobDescriptionActionState> {
  const user = await requireUser();
  const jdText = String(formData.get("jdText") ?? "").trim();
  const sourceUrl = String(formData.get("sourceUrl") ?? "").trim();

  if (!jdText) {
    return {
      error: "请先粘贴 JD 文本。",
    };
  }

  try {
    const result = await parseJobDescriptionWithAi({
      userId: user.id,
      jdText,
      sourceUrl: sourceUrl || null,
    });

    return {
      result: result.result,
      meta: {
        taskId: result.taskId,
        source: result.source,
        info: result.info,
      },
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "JD 解析失败。",
    };
  }
}

export async function suggestNextActionsAction(
  applicationId: string,
  previousState: SuggestNextActionsActionState,
  formData: FormData,
): Promise<SuggestNextActionsActionState> {
  const user = await requireUser();
  void previousState;
  void formData;

  try {
    const result = await suggestNextActionsWithAi({
      userId: user.id,
      applicationId,
    });

    return {
      result: result.result,
      meta: {
        taskId: result.taskId,
        source: result.source,
        info: result.info,
      },
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "生成下一步建议失败。",
    };
  }
}

export async function generateInterviewPrepAction(
  applicationId: string,
  _prevState: InterviewPrepActionState,
  formData: FormData,
): Promise<InterviewPrepActionState> {
  const user = await requireUser();
  const extraContext = String(formData.get("extraContext") ?? "").trim();

  try {
    const result = await generateInterviewPrepWithAi({
      userId: user.id,
      applicationId,
      extraContext: extraContext || null,
    });

    return {
      result: result.result,
      meta: {
        taskId: result.taskId,
        source: result.source,
        info: result.info,
      },
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "生成面试准备摘要失败。",
    };
  }
}
