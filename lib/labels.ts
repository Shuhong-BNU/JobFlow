import type {
  ApplicationPriority,
  ApplicationSource,
  ApplicationStatus,
  EventStatus,
  EventType,
  MaterialPurpose,
  MaterialType,
  NoteType,
  OfferDecisionStatus,
  EmploymentType,
} from "@/lib/constants";
import { getAppLocale, type AppLocale } from "@/lib/i18n";

type LocalizedText = {
  "zh-CN": string;
  en: string;
};

type LocalizedStatusMeta = {
  label: LocalizedText;
  description: LocalizedText;
  color: string;
};

const locale = getAppLocale();

function pickLabel<T extends string>(
  map: Record<T, LocalizedText>,
  currentLocale: AppLocale = locale,
) {
  return Object.fromEntries(
    Object.entries(map).map(([key, value]) => [key, value[currentLocale]]),
  ) as Record<T, string>;
}

const applicationStatusContent: Record<ApplicationStatus, LocalizedStatusMeta> = {
  wishlist: {
    label: { "zh-CN": "待投递", en: "Wishlist" },
    description: {
      "zh-CN": "已收集岗位，但材料或投递策略还未准备完成。",
      en: "Saved roles that still need materials or application prep.",
    },
    color: "bg-slate-400",
  },
  applied: {
    label: { "zh-CN": "已投递", en: "Applied" },
    description: {
      "zh-CN": "材料已发出，等待后续反馈。",
      en: "Application submitted and waiting for follow-up.",
    },
    color: "bg-sky-500",
  },
  oa: {
    label: { "zh-CN": "笔试中", en: "Online Assessment" },
    description: {
      "zh-CN": "已收到在线测评、编程题或笔试任务。",
      en: "OA, coding challenge, or written test is in progress.",
    },
    color: "bg-cyan-500",
  },
  interview: {
    label: { "zh-CN": "面试中", en: "Interview" },
    description: {
      "zh-CN": "技术面、业务面正在推进。",
      en: "Interview rounds are actively moving forward.",
    },
    color: "bg-amber-500",
  },
  hr: {
    label: { "zh-CN": "HR 面", en: "HR Round" },
    description: {
      "zh-CN": "已进入 HR、终面或谈薪阶段。",
      en: "In HR round, final round, or compensation discussion.",
    },
    color: "bg-indigo-500",
  },
  offer: {
    label: { "zh-CN": "Offer", en: "Offer" },
    description: {
      "zh-CN": "已获得 offer 或正在等待答复。",
      en: "Offer received or waiting for decision.",
    },
    color: "bg-emerald-500",
  },
  rejected: {
    label: { "zh-CN": "未通过", en: "Rejected" },
    description: {
      "zh-CN": "流程结束，可保留复盘记录。",
      en: "Process ended and can be kept for review notes.",
    },
    color: "bg-rose-500",
  },
  archived: {
    label: { "zh-CN": "已归档", en: "Archived" },
    description: {
      "zh-CN": "阶段性完成，不再占据主看板焦点。",
      en: "Closed out and moved away from the active workflow.",
    },
    color: "bg-zinc-500",
  },
};

const applicationPriorityContent: Record<
  ApplicationPriority,
  { label: LocalizedText; tone: string }
> = {
  low: {
    label: { "zh-CN": "低", en: "Low" },
    tone: "text-slate-600",
  },
  medium: {
    label: { "zh-CN": "中", en: "Medium" },
    tone: "text-sky-600",
  },
  high: {
    label: { "zh-CN": "高", en: "High" },
    tone: "text-amber-600",
  },
  critical: {
    label: { "zh-CN": "紧急", en: "Critical" },
    tone: "text-rose-600",
  },
};

const employmentTypeContent: Record<EmploymentType, LocalizedText> = {
  internship: { "zh-CN": "实习", en: "Internship" },
  full_time: { "zh-CN": "全职", en: "Full-time" },
  part_time: { "zh-CN": "兼职", en: "Part-time" },
  contract: { "zh-CN": "合同制", en: "Contract" },
  campus_program: { "zh-CN": "校招项目", en: "Campus Program" },
};

const applicationSourceContent: Record<ApplicationSource, LocalizedText> = {
  official_site: { "zh-CN": "官网", en: "Official Site" },
  referral: { "zh-CN": "内推", en: "Referral" },
  job_board: { "zh-CN": "招聘平台", en: "Job Board" },
  campus: { "zh-CN": "校园渠道", en: "Campus Channel" },
  headhunter: { "zh-CN": "猎头", en: "Headhunter" },
  other: { "zh-CN": "其他", en: "Other" },
};

const eventTypeContent: Record<EventType, LocalizedText> = {
  deadline: { "zh-CN": "截止日期", en: "Deadline" },
  oa: { "zh-CN": "笔试 / 测评", en: "OA / Assessment" },
  interview: { "zh-CN": "面试", en: "Interview" },
  offer_response: { "zh-CN": "Offer 回复", en: "Offer Response" },
  follow_up: { "zh-CN": "跟进", en: "Follow-up" },
  reminder: { "zh-CN": "提醒", en: "Reminder" },
  task: { "zh-CN": "自定义任务", en: "Custom Task" },
};

const eventStatusContent: Record<EventStatus, LocalizedText> = {
  scheduled: { "zh-CN": "待执行", en: "Scheduled" },
  done: { "zh-CN": "已完成", en: "Done" },
  cancelled: { "zh-CN": "已取消", en: "Cancelled" },
};

const materialTypeContent: Record<MaterialType, LocalizedText> = {
  resume: { "zh-CN": "简历", en: "Resume" },
  cover_letter: { "zh-CN": "求职信", en: "Cover Letter" },
  portfolio: { "zh-CN": "作品集", en: "Portfolio" },
  transcript: { "zh-CN": "成绩单", en: "Transcript" },
  certificate: { "zh-CN": "证书", en: "Certificate" },
  other: { "zh-CN": "其他", en: "Other" },
};

const materialPurposeContent: Record<MaterialPurpose, LocalizedText> = {
  primary_resume: { "zh-CN": "主简历", en: "Primary Resume" },
  cover_letter: { "zh-CN": "求职信", en: "Cover Letter" },
  portfolio: { "zh-CN": "作品集", en: "Portfolio" },
  supplementary: { "zh-CN": "补充材料", en: "Supplementary Material" },
};

const noteTypeContent: Record<NoteType, LocalizedText> = {
  general: { "zh-CN": "通用备注", en: "General Note" },
  interview_feedback: { "zh-CN": "面试反馈", en: "Interview Feedback" },
  follow_up: { "zh-CN": "跟进记录", en: "Follow-up Note" },
  risk: { "zh-CN": "风险提醒", en: "Risk Note" },
};

const offerDecisionStatusContent: Record<OfferDecisionStatus, LocalizedText> = {
  pending: { "zh-CN": "待决定", en: "Pending" },
  accepted: { "zh-CN": "已接受", en: "Accepted" },
  declined: { "zh-CN": "已拒绝", en: "Declined" },
  expired: { "zh-CN": "已过期", en: "Expired" },
};

const salaryPeriodContent = {
  monthly: { "zh-CN": "月薪", en: "Monthly" },
  yearly: { "zh-CN": "年薪", en: "Yearly" },
} as const;

const sortOptionContent = {
  deadline_asc: { "zh-CN": "截止日期升序", en: "Deadline: Earliest First" },
  deadline_desc: { "zh-CN": "截止日期降序", en: "Deadline: Latest First" },
  updated_desc: { "zh-CN": "最近更新优先", en: "Recently Updated" },
} as const;

export const applicationStatusMeta = Object.fromEntries(
  Object.entries(applicationStatusContent).map(([status, value]) => [
    status,
    {
      label: value.label[locale],
      description: value.description[locale],
      color: value.color,
    },
  ]),
) as Record<ApplicationStatus, { label: string; description: string; color: string }>;

export const applicationStatusLabels = pickLabel(applicationStatusContentAsLabels());
export const applicationSourceLabels = pickLabel(applicationSourceContent);
export const applicationPriorityLabels = pickLabel(applicationPriorityContentAsLabels());
export const employmentTypeLabels = pickLabel(employmentTypeContent);
export const eventTypeLabels = pickLabel(eventTypeContent);
export const editableEventTypeLabels = pickLabel({
  oa: eventTypeContent.oa,
  interview: eventTypeContent.interview,
  offer_response: eventTypeContent.offer_response,
  follow_up: eventTypeContent.follow_up,
  reminder: eventTypeContent.reminder,
  task: eventTypeContent.task,
});
export const eventStatusLabels = pickLabel(eventStatusContent);
export const materialTypeLabels = pickLabel(materialTypeContent);
export const materialPurposeLabels = pickLabel(materialPurposeContent);
export const noteTypeLabels = pickLabel(noteTypeContent);
export const offerDecisionStatusLabels = pickLabel(offerDecisionStatusContent);
export const salaryPeriodLabels = pickLabel(salaryPeriodContent);
export const applicationSortLabels = pickLabel(sortOptionContent);
export const priorityToneMap = Object.fromEntries(
  Object.entries(applicationPriorityContent).map(([priority, value]) => [
    priority,
    value.tone,
  ]),
) as Record<ApplicationPriority, string>;

export function formatSalaryNumber(value: number | null | undefined) {
  if (value == null) {
    return locale === "en" ? "Not set" : "未填写";
  }

  return new Intl.NumberFormat(locale === "en" ? "en-US" : "zh-CN").format(value);
}

function applicationStatusContentAsLabels() {
  return Object.fromEntries(
    Object.entries(applicationStatusContent).map(([status, value]) => [status, value.label]),
  ) as Record<ApplicationStatus, LocalizedText>;
}

function applicationPriorityContentAsLabels() {
  return Object.fromEntries(
    Object.entries(applicationPriorityContent).map(([priority, value]) => [
      priority,
      value.label,
    ]),
  ) as Record<ApplicationPriority, LocalizedText>;
}

