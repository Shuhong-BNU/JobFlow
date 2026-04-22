'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { APPLICATION_STATUSES, EMPLOYMENT_TYPES, PRIORITIES } from '@/lib/enums';
import { useT } from '@/lib/i18n/client';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import {
  applicationFormSchema,
  type ApplicationFormInput,
  type ApplicationFormValues,
} from '../schema';
import { createApplication, updateApplication } from '../actions';

/** Zod 返回稳定错误码，界面层再映射为当前语言文案。 */
function translateError(msg: string | undefined, t: Dictionary): string | undefined {
  if (!msg) return undefined;
  const map = t.form.errors as Record<string, string>;
  return map[msg] ?? msg;
}

function translateActionError(code: string, t: Dictionary): string {
  const common = t.common as Record<string, string>;
  return common[code] ?? code;
}

/** Schema 字段名 → 字典 form.fields 下的 label key。 */
const FIELD_LABEL_KEY: Record<string, string> = {
  companyName: 'company',
  title: 'title',
  department: 'department',
  location: 'location',
  source: 'source',
  sourceUrl: 'sourceUrl',
  employmentType: 'type',
  currentStatus: 'status',
  priority: 'priority',
  deadlineAt: 'deadline',
  appliedAt: 'appliedOn',
  salaryRange: 'salaryRange',
  referralName: 'referralName',
  notes: 'notes',
};

/** 把 server action 返回的 fieldErrors 里的第一条翻成 "字段名 错误码"。 */
function firstFieldErrorLabel(
  fieldErrors: Record<string, string[] | undefined> | undefined,
  t: Dictionary
): string | undefined {
  if (!fieldErrors) return undefined;
  const fieldLabels = t.form.fields as Record<string, string>;
  const errorMap = t.form.errors as Record<string, string>;
  for (const [field, msgs] of Object.entries(fieldErrors)) {
    const msg = msgs?.[0];
    if (!msg) continue;
    const labelKey = FIELD_LABEL_KEY[field] ?? field;
    const label = fieldLabels[labelKey] ?? field;
    const translated = errorMap[msg] ?? msg;
    return `${label} ${translated}`;
  }
  return undefined;
}

type Props = {
  mode: 'create' | 'edit';
  applicationId?: string;
  defaultValues?: Partial<ApplicationFormInput>;
};

function toDateInputValue(d: Date | string | undefined): string {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

/** react-hook-form 的 `watch` 可能返回 Date（zod union 的另一分支），DatePicker 只吃 string。 */
function asDateInputValue(v: unknown): string {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (v instanceof Date) return toDateInputValue(v);
  return '';
}

export function ApplicationForm({ mode, applicationId, defaultValues }: Props) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const form = useForm<ApplicationFormInput>({
    resolver: zodResolver(applicationFormSchema) as never,
    defaultValues: {
      companyName: defaultValues?.companyName ?? '',
      title: defaultValues?.title ?? '',
      department: defaultValues?.department ?? '',
      location: defaultValues?.location ?? '',
      source: defaultValues?.source ?? '',
      sourceUrl: defaultValues?.sourceUrl ?? '',
      employmentType: defaultValues?.employmentType ?? 'fulltime',
      currentStatus: defaultValues?.currentStatus ?? 'wishlist',
      priority: defaultValues?.priority ?? 'medium',
      deadlineAt: toDateInputValue(defaultValues?.deadlineAt as never),
      appliedAt: toDateInputValue(defaultValues?.appliedAt as never),
      salaryRange: defaultValues?.salaryRange ?? '',
      referralName: defaultValues?.referralName ?? '',
      notes: defaultValues?.notes ?? '',
    },
  });

  const { register, handleSubmit, formState, setValue, watch } = form;

  function onSubmit(values: ApplicationFormValues) {
    startTransition(async () => {
      const action =
        mode === 'create'
          ? createApplication(values as ApplicationFormInput)
          : updateApplication(applicationId!, values as ApplicationFormInput);
      const result = await action;
      if (!result.ok) {
        // 把 server 返回的第一个字段错误也拼进 toast，避免笼统的"输入有误"。
        // 例如：`输入有误：截止日 日期格式不正确`
        const base = translateActionError(result.error, t);
        const first = firstFieldErrorLabel(result.fieldErrors, t);
        toast.error(first ? `${base}：${first}` : base);
        return;
      }
      toast.success(mode === 'create' ? t.form.toast.created : t.form.toast.saved);
      router.push(`/app/applications/${result.data.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit as never)} className="space-y-8">
      <FormSection title={t.form.sections.basics}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={t.form.fields.company}
            required
            error={translateError(formState.errors.companyName?.message, t)}
          >
            <Input
              placeholder={t.form.placeholders.company}
              aria-invalid={Boolean(formState.errors.companyName)}
              {...register('companyName')}
            />
          </Field>
          <Field
            label={t.form.fields.title}
            required
            error={translateError(formState.errors.title?.message, t)}
          >
            <Input
              placeholder={t.form.placeholders.title}
              aria-invalid={Boolean(formState.errors.title)}
              {...register('title')}
            />
          </Field>
          <Field label={t.form.fields.department}>
            <Input placeholder={t.form.placeholders.department} {...register('department')} />
          </Field>
          <Field label={t.form.fields.location}>
            <Input placeholder={t.form.placeholders.location} {...register('location')} />
          </Field>
        </div>
      </FormSection>

      <FormSection title={t.form.sections.pipeline}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t.form.fields.status}>
            <Select
              value={watch('currentStatus')}
              onValueChange={(v) => setValue('currentStatus', v as never, { shouldDirty: true })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {APPLICATION_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {t.status[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t.form.fields.priority}>
            <Select
              value={watch('priority')}
              onValueChange={(v) => setValue('priority', v as never, { shouldDirty: true })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {t.priority[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t.form.fields.type}>
            <Select
              value={watch('employmentType')}
              onValueChange={(v) =>
                setValue('employmentType', v as never, { shouldDirty: true })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYMENT_TYPES.map((et) => (
                  <SelectItem key={et} value={et}>
                    {t.employmentType[et]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field
            label={t.form.fields.deadline}
            optional
            optionalText={t.form.hints.optional}
            error={translateError(formState.errors.deadlineAt?.message, t)}
          >
            <DatePicker
              value={asDateInputValue(watch('deadlineAt'))}
              onChange={(v) =>
                setValue('deadlineAt', v as never, { shouldDirty: true, shouldValidate: true })
              }
              ariaInvalid={Boolean(formState.errors.deadlineAt)}
            />
          </Field>
          <Field
            label={t.form.fields.appliedOn}
            optional
            optionalText={t.form.hints.optional}
            error={translateError(formState.errors.appliedAt?.message, t)}
          >
            <DatePicker
              value={asDateInputValue(watch('appliedAt'))}
              onChange={(v) =>
                setValue('appliedAt', v as never, { shouldDirty: true, shouldValidate: true })
              }
              ariaInvalid={Boolean(formState.errors.appliedAt)}
            />
          </Field>
          <Field label={t.form.fields.salaryRange}>
            <Input placeholder={t.form.placeholders.salary} {...register('salaryRange')} />
          </Field>
        </div>
      </FormSection>

      <FormSection title={t.form.sections.source}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.form.fields.source}>
            <Input placeholder={t.form.placeholders.source} {...register('source')} />
          </Field>
          <Field
            label={t.form.fields.sourceUrl}
            error={translateError(formState.errors.sourceUrl?.message, t)}
          >
            <Input placeholder={t.form.placeholders.url} {...register('sourceUrl')} />
          </Field>
          <Field label={t.form.fields.referralName}>
            <Input placeholder={t.form.placeholders.optional} {...register('referralName')} />
          </Field>
        </div>
      </FormSection>

      <FormSection title={t.form.sections.notes}>
        <Field label={t.form.fields.notes}>
          <Textarea rows={4} placeholder={t.form.placeholders.notes} {...register('notes')} />
        </Field>
      </FormSection>

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {t.form.actions.cancel}
        </Button>
        <Button type="submit" disabled={pending}>
          {pending
            ? t.form.actions.saving
            : mode === 'create'
              ? t.form.actions.create
              : t.form.actions.save}
        </Button>
      </div>
    </form>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({
  label,
  error,
  required,
  optional,
  optionalText,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  optional?: boolean;
  optionalText?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label>
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </Label>
        {optional && optionalText && (
          <span className="text-[11px] text-muted-foreground">{optionalText}</span>
        )}
      </div>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
