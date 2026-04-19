import "server-only";

import { z } from "zod";

type StructuredGenerationInput<TSchema extends z.ZodTypeAny> = {
  systemPrompt: string;
  userPrompt: string;
  responseSchema: TSchema;
  temperature?: number;
};

type StructuredGenerationOutput<TSchema extends z.ZodTypeAny> = {
  object: z.infer<TSchema>;
  rawText: string;
  provider: string;
  model: string;
};

export class AiProviderUnavailableError extends Error {}

export async function generateStructuredObject<TSchema extends z.ZodTypeAny>(
  input: StructuredGenerationInput<TSchema>,
): Promise<StructuredGenerationOutput<TSchema>> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new AiProviderUnavailableError("未配置 OPENAI_API_KEY，改走 fallback。");
  }

  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(
    /\/$/,
    "",
  );
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: input.temperature ?? 0.2,
      messages: [
        {
          role: "system",
          content: input.systemPrompt,
        },
        {
          role: "user",
          content: `${input.userPrompt}\n\n请只返回一个 JSON 对象，不要使用 Markdown 代码块。`,
        },
      ],
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`AI provider 请求失败：${response.status}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string | null;
      };
    }>;
  };

  const rawText = payload.choices?.[0]?.message?.content?.trim();

  if (!rawText) {
    throw new Error("AI provider 未返回可解析内容。");
  }

  const object = input.responseSchema.parse(extractJson(rawText));

  return {
    object,
    rawText,
    provider: "openai-compatible",
    model,
  };
}

function extractJson(rawText: string) {
  const cleaned = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  return JSON.parse(cleaned);
}
