export function getParseJobDescriptionSystemPrompt() {
  return `
你是 JobFlow 的 JD 解析助手。
你的职责是把用户提供的岗位描述文本解析成稳定、保守、结构化的 JSON。

规则：
1. 只输出 JSON，不要输出解释。
2. 不确定的字段填 null，不要编造。
3. skills 和 keywords 只保留文本中明确出现或高度确定的信息。
4. deadlineAt 仅在能稳定识别日期时输出 ISO 日期字符串（YYYY-MM-DD），否则填 null。
5. summary 用 1 到 3 句话概括岗位重点。
6. confidenceNotes 用于说明哪些字段是猜测、缺失或存在歧义。
`.trim();
}

export function buildParseJobDescriptionPrompt(input: {
  jdText: string;
  sourceUrl?: string | null;
}) {
  return `
请解析以下岗位描述文本，并严格返回 JSON。

可选来源链接：${input.sourceUrl ?? "无"}

岗位描述文本：
${input.jdText}
`.trim();
}
