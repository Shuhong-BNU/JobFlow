import { z } from 'zod';
import { OFFER_DECISIONS } from '@/lib/enums';

/**
 * Offer 字段全部可选 —— 现实里拿到 offer 一开始只有薪资口头承诺，
 * 其它信息分批补齐。强制必填只会堵住用户录入。decisionStatus 默认 pending。
 */
const optionalShort = z
  .string()
  .trim()
  .max(200)
  .optional()
  .or(z.literal('').transform(() => undefined));

const optionalLong = z
  .string()
  .trim()
  .max(4000)
  .optional()
  .or(z.literal('').transform(() => undefined));

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

export const offerFormSchema = z.object({
  baseSalary: optionalShort,
  bonus: optionalShort,
  location: optionalShort,
  team: optionalShort,
  responseDeadlineAt: optionalDate,
  decisionStatus: z.enum(OFFER_DECISIONS).default('pending'),
  pros: optionalLong,
  cons: optionalLong,
});

export type OfferFormInput = z.input<typeof offerFormSchema>;
export type OfferFormValues = z.output<typeof offerFormSchema>;
