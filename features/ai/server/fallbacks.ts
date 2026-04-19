import { applicationSourceLabels, applicationStatusLabels, materialTypeLabels } from "@/lib/labels";
import type { ApplicationDetail } from "@/features/applications/types";
import type { EmploymentType } from "@/lib/constants";
import type { InterviewPrepResult } from "@/features/ai/schema/interview-prep";
import type { ParseJobDescriptionResult } from "@/features/ai/schema/parse-jd";
import type { SuggestNextActionsResult } from "@/features/ai/schema/suggest-next-actions";

const commonSkillKeywords = [
  "python",
  "java",
  "javascript",
  "typescript",
  "react",
  "next.js",
  "sql",
  "machine learning",
  "数据分析",
  "算法",
  "沟通",
  "产品思维",
] as const;

export function buildParseJobDescriptionFallback(input: {
  jdText: string;
  sourceUrl?: string | null;
}): ParseJobDescriptionResult {
  const text = input.jdText.trim();
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return {
    companyName: matchAfterLabel(text, ["公司", "Company", "Employer"]),
    title: matchAfterLabel(text, ["岗位", "职位", "Title", "Role"]) ?? lines[0] ?? null,
    location: matchAfterLabel(text, ["地点", "Location", "Base"]),
    employmentType: inferEmploymentType(text),
    skills: inferSkills(text),
    keywords: inferSkills(text).slice(0, 5),
    deadlineText: matchAfterLabel(text, ["截止", "Deadline", "申请截止"]),
    deadlineAt: inferDeadlineDate(text),
    summary:
      lines.slice(0, 3).join(" ") ||
      "未能稳定提取完整 JD 摘要，建议人工确认关键信息后再创建岗位。",
    confidenceNotes: [
      "当前结果来自本地 fallback 规则，不是完整模型解析。",
      input.sourceUrl ? `原始链接：${input.sourceUrl}` : "未提供原始链接。",
    ],
  };
}

export function buildSuggestNextActionsFallback(detail: ApplicationDetail): SuggestNextActionsResult {
  const nextActions: string[] = [];
  const risks: string[] = [];
  const suggestedEventTypes: SuggestNextActionsResult["suggestedEventTypes"] = [];

  if (!detail.deadlineAt) {
    nextActions.push("先补充截止日期，避免这条申请在时间上失去管理价值。");
    risks.push("当前没有截止日期，Dashboard 与 Calendar 都无法准确提醒。");
  }

  if (detail.materials.length === 0) {
    nextActions.push("至少绑定一份主简历或补充材料，保证投递与复盘链路完整。");
  }

  if (detail.currentStatus === "wishlist") {
    nextActions.push("确认岗位来源与截止日期后，再决定是否进入正式投递。");
  }

  if (detail.currentStatus === "applied" && !hasEvent(detail, "follow_up")) {
    nextActions.push("补一个 follow-up 或 reminder 事件，避免投递后完全失去跟进节奏。");
    suggestedEventTypes.push("follow_up", "reminder");
  }

  if ((detail.currentStatus === "oa" || detail.currentStatus === "interview") && !hasEvent(detail, "interview")) {
    nextActions.push("把接下来的面试 / 测评时间补进时间线，方便在 Calendar 统一查看。");
    suggestedEventTypes.push("interview");
  }

  if (detail.currentStatus === "offer" && !detail.offer?.responseDeadlineAt) {
    nextActions.push("补录 Offer 回复截止日期，并视情况创建 offer_response 事件。");
    suggestedEventTypes.push("offer_response");
  }

  if (detail.currentStatus === "rejected") {
    nextActions.push("补一条复盘 note，沉淀这次申请的失败原因与改进点。");
  }

  if (detail.currentStatus === "archived") {
    nextActions.push("当前岗位已归档，如需继续推进请先确认是否应恢复为活跃状态。");
  }

  if (nextActions.length === 0) {
    nextActions.push("当前信息已经比较完整，优先维护 timeline、materials 和后续跟进记录。");
  }

  if (detail.priority === "critical" && !detail.deadlineAt) {
    risks.push("这是高优先级岗位，但缺少 deadline，会影响排序与提醒质量。");
  }

  return {
    nextActions: uniqueList(nextActions).slice(0, 5),
    risks: uniqueList(risks).slice(0, 4),
    reasoningSummary: `当前岗位状态为 ${applicationStatusLabels[detail.currentStatus]}，来源为 ${applicationSourceLabels[detail.source]}，fallback 规则已基于 deadline、事件、材料与 Offer 信息生成建议。`,
    recommendedPriority:
      detail.currentStatus === "offer" || detail.currentStatus === "interview"
        ? "raise"
        : detail.currentStatus === "archived" || detail.currentStatus === "rejected"
          ? "watch"
          : "keep",
    suggestedEventTypes: uniqueList(suggestedEventTypes),
  };
}

export function buildInterviewPrepFallback(params: {
  detail: ApplicationDetail;
  extraContext?: string | null;
}): InterviewPrepResult {
  const materialTypes = uniqueList(
    params.detail.materials.map((material) => materialTypeLabels[material.type]),
  );

  return {
    coreCompetencies: uniqueList([
      `${params.detail.title} 对应的岗位职责与基础能力`,
      params.detail.department ? `${params.detail.department} 相关业务理解` : "",
      params.detail.location ? `${params.detail.location} 场景下的协作适应性` : "",
    ]).slice(0, 4),
    questionDirections: uniqueList([
      "请准备 2 到 3 个最能体现你能力的项目经历。",
      params.detail.currentStatus === "interview" || params.detail.currentStatus === "hr"
        ? "结合当前流程，重点准备行为题与跨团队协作题。"
        : "围绕岗位要求准备通用能力题与项目拆解题。",
      params.extraContext?.trim() ? `补充围绕这段上下文展开：${params.extraContext.trim()}` : "",
    ]).slice(0, 5),
    prepChecklist: uniqueList([
      "重新通读岗位信息，确认核心职责和关键词。",
      materialTypes.length > 0 ? `结合已绑定材料：${materialTypes.join("、")}，整理可讲述内容。` : "准备一版可直接讲述的简历项目故事。",
      "为每个项目准备“背景 - 行动 - 结果 - 反思”四段式表达。",
      "准备 2 到 3 个反问问题，例如团队协作方式、岗位成长路径、评价标准。",
    ]).slice(0, 6),
    companyResearchAngles: uniqueList([
      `${params.detail.companyName} 的业务方向与近期公开动态`,
      "团队所在业务线的目标、用户与核心指标",
      "岗位与个人长期方向是否匹配",
    ]),
    resumeTalkingPoints: uniqueList([
      "挑 2 个最贴近岗位要求的项目，准备量化结果。",
      params.detail.materials.length > 0
        ? "确保绑定材料中的关键经历与口头表达一致。"
        : "确保简历上的关键经历都能展开成 1 到 2 分钟的讲述。",
      "提前准备一个能体现主动推进和解决问题能力的案例。",
    ]),
    cautionNotes: uniqueList([
      "当前结果来自 fallback 规则，建议结合真实 JD 再次精炼。",
      params.detail.offer ? "如果已经进入 Offer 阶段，请额外准备谈薪与决策相关问题。" : "",
      params.detail.deadlineAt ? "临近截止日期时，优先整理最有把握的准备清单。" : "",
    ]).slice(0, 4),
  };
}

export function buildApplicationAiSnapshot(detail: ApplicationDetail) {
  return {
    application: {
      id: detail.id,
      companyName: detail.companyName,
      title: detail.title,
      department: detail.department,
      location: detail.location,
      source: detail.source,
      currentStatus: detail.currentStatus,
      priority: detail.priority,
      employmentType: detail.employmentType,
      deadlineAt: detail.deadlineAt?.toISOString() ?? null,
      appliedAt: detail.appliedAt?.toISOString() ?? null,
      notes: detail.notes,
    },
    events: detail.events.map((event) => ({
      eventType: event.eventType,
      title: event.title,
      startsAt: event.startsAt?.toISOString() ?? null,
      status: event.status,
    })),
    notes: detail.detailNotes.slice(0, 5).map((note) => ({
      noteType: note.noteType,
      content: note.content,
      updatedAt: note.updatedAt.toISOString(),
    })),
    materials: detail.materials.map((material) => ({
      purpose: material.purpose,
      type: material.type,
      version: material.version,
      tags: material.tags,
    })),
    offer: detail.offer
      ? {
          decisionStatus: detail.offer.decisionStatus,
          responseDeadlineAt: detail.offer.responseDeadlineAt?.toISOString() ?? null,
          baseSalary: detail.offer.baseSalary,
          bonus: detail.offer.bonus,
        }
      : null,
  };
}

function inferEmploymentType(text: string): EmploymentType | null {
  const normalized = text.toLowerCase();

  if (normalized.includes("intern") || text.includes("实习")) {
    return "internship";
  }
  if (normalized.includes("full time") || text.includes("全职")) {
    return "full_time";
  }
  if (normalized.includes("part time") || text.includes("兼职")) {
    return "part_time";
  }
  if (normalized.includes("contract") || text.includes("合同")) {
    return "contract";
  }
  if (text.includes("校招") || text.includes("管培生")) {
    return "campus_program";
  }

  return null;
}

function inferSkills(text: string) {
  const normalized = text.toLowerCase();
  return commonSkillKeywords.filter((keyword) => normalized.includes(keyword.toLowerCase()));
}

function inferDeadlineDate(text: string) {
  const isoMatch = text.match(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/);

  if (!isoMatch) {
    return null;
  }

  const [, year, month, day] = isoMatch;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function matchAfterLabel(text: string, labels: string[]) {
  for (const label of labels) {
    const regex = new RegExp(`${label}\\s*[:：]\\s*([^\\n]+)`, "i");
    const match = text.match(regex);

    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return null;
}

function hasEvent(detail: ApplicationDetail, eventType: ApplicationDetail["events"][number]["eventType"]) {
  return detail.events.some((event) => event.eventType === eventType);
}

function uniqueList<T extends string>(values: T[]) {
  return [...new Set(values.filter(Boolean))];
}
