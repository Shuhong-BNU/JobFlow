import { z } from 'zod';
import { MATERIAL_TYPES } from '@/lib/enums';

/**
 * Material v1 口径（v0.4.0）：
 *
 *  - 只做"URL 登记 + 元数据"，不做字节托管。fileUrl 存外部链接（Google Drive /
 *    Dropbox / 自建主机）。这样 v1 不引入 Supabase Storage SDK，不碰 bucket /
 *    signed URL / MIME / 删除残留这些问题；一份 Storage 集成属于更晚的升级。
 *  - name 与 type 必填 —— 没有它们这条记录就没有意义。version / url / notes / tags
 *    全部选填。tags 沿用 schema 中已有的 jsonb 字段，用逗号分隔录入。
 */

const shortText = z.string().trim().min(1).max(200);
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

const optionalUrl = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .or(z.literal('').transform(() => undefined))
  .refine(
    (v) => {
      if (!v) return true;
      // 允许 http/https 或简短相对路径，但过滤 "foo bar" 这种明显无效串
      try {
        new URL(v);
        return true;
      } catch {
        return false;
      }
    },
    { message: 'invalidUrl' }
  );

/** 逗号分隔的 tag 输入，序列化阶段再切分；v1 不做多标签输入组件。 */
const tagsInput = z
  .string()
  .trim()
  .max(500)
  .optional()
  .or(z.literal('').transform(() => undefined));

export const materialFormSchema = z.object({
  type: z.enum(MATERIAL_TYPES),
  name: shortText,
  version: optionalShort,
  fileUrl: optionalUrl,
  tags: tagsInput,
  notes: optionalLong,
});

export type MaterialFormInput = z.input<typeof materialFormSchema>;
export type MaterialFormValues = z.output<typeof materialFormSchema>;

export function parseTags(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function formatTags(tags: string[] | null | undefined): string {
  if (!tags || tags.length === 0) return '';
  return tags.join(', ');
}
