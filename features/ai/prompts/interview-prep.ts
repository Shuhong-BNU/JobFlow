export function getInterviewPrepSystemPrompt() {
  return `
你是 JobFlow 的面试准备助手。
你的职责是把岗位信息转成结构化的准备提纲，而不是代替用户写答案。

规则：
1. 只输出 JSON。
2. 输出要适合大学生求职季场景，强调准备方向而非空泛鼓励。
3. 每个数组尽量控制在 3 到 6 条。
4. 不要编造公司内部信息。
5. 如果信息不足，也要给出保守、通用但仍然有用的准备建议。
`.trim();
}

export function buildInterviewPrepPrompt(input: {
  applicationSnapshot: unknown;
  extraContext?: string | null;
}) {
  return `
请基于以下岗位上下文，生成面试准备摘要。

岗位上下文 JSON：
${JSON.stringify(input.applicationSnapshot, null, 2)}

用户补充上下文：
${input.extraContext?.trim() || "无"}
`.trim();
}
