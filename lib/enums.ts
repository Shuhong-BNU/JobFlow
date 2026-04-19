/**
 * Single source of truth for all domain enums.
 * Drizzle schema, Zod schemas, and UI components MUST import from here.
 * Never duplicate these values inline.
 */

export const APPLICATION_STATUSES = [
  'wishlist',
  'applied',
  'oa',
  'interview',
  'hr',
  'offer',
  'rejected',
  'archived',
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  wishlist: 'Wishlist',
  applied: 'Applied',
  oa: 'OA',
  interview: 'Interview',
  hr: 'HR',
  offer: 'Offer',
  rejected: 'Rejected',
  archived: 'Archived',
};

/** Tailwind color tokens used to tint status badges and board column headers. */
export const APPLICATION_STATUS_TONE: Record<ApplicationStatus, string> = {
  wishlist: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  applied: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200',
  oa: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  interview: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-200',
  hr: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-200',
  offer: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200',
  rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-200',
  archived: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300',
};

export const PRIORITIES = ['low', 'medium', 'high'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const PRIORITY_TONE: Record<Priority, string> = {
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  medium: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-200',
  high: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200',
};

export const EMPLOYMENT_TYPES = ['fulltime', 'intern', 'parttime', 'contract'] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];
export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  fulltime: 'Full-time',
  intern: 'Internship',
  parttime: 'Part-time',
  contract: 'Contract',
};

export const EVENT_TYPES = [
  'deadline',
  'oa',
  'interview',
  'offer_response',
  'custom',
] as const;
export type EventType = (typeof EVENT_TYPES)[number];
export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  deadline: 'Deadline',
  oa: 'Online Assessment',
  interview: 'Interview',
  offer_response: 'Offer Response',
  custom: 'Custom',
};

export const EVENT_STATUSES = ['scheduled', 'done', 'missed', 'cancelled'] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const NOTE_TYPES = ['general', 'interview_feedback', 'followup', 'risk'] as const;
export type NoteType = (typeof NOTE_TYPES)[number];
export const NOTE_TYPE_LABELS: Record<NoteType, string> = {
  general: 'Note',
  interview_feedback: 'Interview Feedback',
  followup: 'Follow-up',
  risk: 'Risk',
};

// --- Phase 2/3/4 enums (declared early so schema/types stay stable) ---

export const MATERIAL_TYPES = [
  'resume',
  'cover_letter',
  'portfolio',
  'transcript',
  'certificate',
  'other',
] as const;
export type MaterialType = (typeof MATERIAL_TYPES)[number];

export const OFFER_DECISIONS = ['pending', 'accepted', 'declined', 'expired'] as const;
export type OfferDecision = (typeof OFFER_DECISIONS)[number];

export const MAIL_TYPES = [
  'application_confirm',
  'oa_invite',
  'interview_invite',
  'rejection',
  'offer',
  'unknown',
] as const;
export type MailType = (typeof MAIL_TYPES)[number];

export const AI_TASK_TYPES = ['parse_jd', 'next_action', 'interview_prep'] as const;
export type AiTaskType = (typeof AI_TASK_TYPES)[number];

export const AI_TASK_STATUSES = ['pending', 'running', 'success', 'failed'] as const;
export type AiTaskStatus = (typeof AI_TASK_STATUSES)[number];
