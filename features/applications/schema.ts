import { z } from 'zod';
import {
  APPLICATION_STATUSES,
  EMPLOYMENT_TYPES,
  PRIORITIES,
} from '@/lib/enums';

const optionalString = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .or(z.literal('').transform(() => undefined));

const optionalUrl = z
  .string()
  .trim()
  .max(2000)
  .url()
  .optional()
  .or(z.literal('').transform(() => undefined));

/**
 * 同时接受客户端的原始字符串与 react-hook-form + zodResolver 已经 transform 过的
 * Date 对象。之前只声明成 `.string().transform(...)`，导致 server action 再次
 * safeParse 时拿到 Date 对象会在 `.string()` 层失败，然后整表单被误判为
 * "invalidInput" — 这就是"新建申请总是显示输入有误"的根因。
 */
const optionalDate = z
  .union([z.string(), z.date()])
  .optional()
  .transform((v, ctx) => {
    if (v === undefined || v === null) return undefined;
    if (v instanceof Date) {
      if (Number.isNaN(v.getTime())) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'invalidDate' });
        return z.NEVER;
      }
      return v;
    }
    const trimmed = v.trim();
    if (!trimmed) return undefined;
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'invalidDate' });
      return z.NEVER;
    }
    return parsed;
  });

export const applicationFormSchema = z.object({
  companyName: z.string().trim().min(1, 'companyRequired').max(200),
  title: z.string().trim().min(1, 'titleRequired').max(200),
  department: optionalString,
  location: optionalString,
  source: optionalString,
  sourceUrl: optionalUrl,
  employmentType: z.enum(EMPLOYMENT_TYPES).default('fulltime'),
  currentStatus: z.enum(APPLICATION_STATUSES).default('wishlist'),
  priority: z.enum(PRIORITIES).default('medium'),
  deadlineAt: optionalDate,
  appliedAt: optionalDate,
  salaryRange: optionalString,
  referralName: optionalString,
  notes: optionalString,
});

export type ApplicationFormInput = z.input<typeof applicationFormSchema>;
export type ApplicationFormValues = z.output<typeof applicationFormSchema>;

export const moveStatusSchema = z.object({
  applicationId: z.string().uuid(),
  status: z.enum(APPLICATION_STATUSES),
  /** Insert before this neighbor; null = end of column. */
  beforeId: z.string().uuid().nullable().optional(),
});

export const listFiltersSchema = z.object({
  q: z.string().trim().max(200).optional(),
  status: z.enum(APPLICATION_STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  sort: z.enum(['deadline_asc', 'deadline_desc', 'updated_desc', 'created_desc']).default(
    'updated_desc'
  ),
});
export type ListFilters = z.infer<typeof listFiltersSchema>;
