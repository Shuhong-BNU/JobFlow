export const applicationStatuses = [
  "wishlist",
  "applied",
  "oa",
  "interview",
  "hr",
  "offer",
  "rejected",
  "archived",
] as const;

export const applicationPriorities = ["low", "medium", "high", "critical"] as const;
export const employmentTypes = [
  "internship",
  "full_time",
  "part_time",
  "contract",
  "campus_program",
] as const;
export const applicationSources = [
  "official_site",
  "referral",
  "job_board",
  "campus",
  "headhunter",
  "other",
] as const;
export const eventTypes = [
  "deadline",
  "oa",
  "interview",
  "offer_response",
  "follow_up",
  "reminder",
  "task",
] as const;
export const eventStatuses = ["scheduled", "done", "cancelled"] as const;
export const materialTypes = [
  "resume",
  "cover_letter",
  "portfolio",
  "transcript",
  "certificate",
  "other",
] as const;
export const materialPurposes = [
  "primary_resume",
  "cover_letter",
  "portfolio",
  "supplementary",
] as const;
export const noteTypes = ["general", "interview_feedback", "follow_up", "risk"] as const;
export const offerDecisionStatuses = [
  "pending",
  "accepted",
  "declined",
  "expired",
] as const;
export const mailProviders = ["gmail"] as const;
export const mailTypes = [
  "application_confirmation",
  "oa_invite",
  "interview_invite",
  "rejection",
  "offer",
  "other",
] as const;
export const aiTaskTypes = ["parse_jd", "suggest_next_step", "interview_prep"] as const;
export const aiTaskStatuses = ["queued", "success", "failed"] as const;

export type ApplicationStatus = (typeof applicationStatuses)[number];
export type ApplicationPriority = (typeof applicationPriorities)[number];
export type EmploymentType = (typeof employmentTypes)[number];
export type ApplicationSource = (typeof applicationSources)[number];
export type EventType = (typeof eventTypes)[number];
export type EventStatus = (typeof eventStatuses)[number];
export type MaterialType = (typeof materialTypes)[number];
export type MaterialPurpose = (typeof materialPurposes)[number];
export type NoteType = (typeof noteTypes)[number];
export type OfferDecisionStatus = (typeof offerDecisionStatuses)[number];
export type AiTaskType = (typeof aiTaskTypes)[number];
export type AiTaskStatus = (typeof aiTaskStatuses)[number];

export const applicationStatusMeta: Record<
  ApplicationStatus,
  { label: string; description: string; color: string }
> = {
  wishlist: {
    label: "待投递",
    description: "已收藏，但材料或策略还未准备完成。",
    color: "bg-slate-400",
  },
  applied: {
    label: "已投递",
    description: "材料已发送，等待后续反馈。",
    color: "bg-sky-500",
  },
  oa: {
    label: "笔试中",
    description: "已收到在线测评、编程题或笔试任务。",
    color: "bg-cyan-500",
  },
  interview: {
    label: "面试中",
    description: "技术面、业务面正在推进。",
    color: "bg-amber-500",
  },
  hr: {
    label: "HR 面",
    description: "已进入 HR、终面或谈薪阶段。",
    color: "bg-indigo-500",
  },
  offer: {
    label: "Offer",
    description: "已获得 offer 或待答复。",
    color: "bg-emerald-500",
  },
  rejected: {
    label: "已拒绝",
    description: "流程结束，可保留复盘记录。",
    color: "bg-rose-500",
  },
  archived: {
    label: "已归档",
    description: "阶段性完成，不再占据主看板焦点。",
    color: "bg-zinc-500",
  },
};

export const priorityMeta: Record<ApplicationPriority, { label: string; tone: string }> = {
  low: { label: "低", tone: "text-slate-600" },
  medium: { label: "中", tone: "text-sky-600" },
  high: { label: "高", tone: "text-amber-600" },
  critical: { label: "紧急", tone: "text-rose-600" },
};

export const navItems = [
  { href: "/dashboard", label: "总览", shortLabel: "总览" },
  { href: "/applications", label: "申请看板", shortLabel: "看板" },
  { href: "/calendar", label: "日历", shortLabel: "日历" },
  { href: "/materials", label: "材料中心", shortLabel: "材料" },
  { href: "/offers", label: "Offer", shortLabel: "Offer" },
  { href: "/analytics", label: "分析", shortLabel: "分析" },
  { href: "/settings", label: "设置", shortLabel: "设置" },
] as const;
