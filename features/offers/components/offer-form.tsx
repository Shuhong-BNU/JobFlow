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
import { OFFER_DECISIONS } from '@/lib/enums';
import { useT } from '@/lib/i18n/client';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import { offerFormSchema, type OfferFormInput, type OfferFormValues } from '../schema';
import { upsertOffer } from '../actions';

function toDateInputValue(d: Date | string | null | undefined): string {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function asDateInputValue(v: unknown): string {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (v instanceof Date) return toDateInputValue(v);
  return '';
}

function translateActionError(code: string, t: Dictionary): string {
  const common = t.common as Record<string, string>;
  return common[code] ?? code;
}

type Props = {
  applicationId: string;
  defaultValues?: Partial<OfferFormInput>;
  onDone?: () => void;
};

export function OfferForm({ applicationId, defaultValues, onDone }: Props) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const form = useForm<OfferFormInput>({
    resolver: zodResolver(offerFormSchema) as never,
    defaultValues: {
      baseSalary: defaultValues?.baseSalary ?? '',
      bonus: defaultValues?.bonus ?? '',
      location: defaultValues?.location ?? '',
      team: defaultValues?.team ?? '',
      responseDeadlineAt: toDateInputValue(defaultValues?.responseDeadlineAt as never),
      decisionStatus: defaultValues?.decisionStatus ?? 'pending',
      pros: defaultValues?.pros ?? '',
      cons: defaultValues?.cons ?? '',
    },
  });

  const { register, handleSubmit, formState, setValue, watch } = form;

  function onSubmit(values: OfferFormValues) {
    startTransition(async () => {
      const result = await upsertOffer(applicationId, values as OfferFormInput);
      if (!result.ok) {
        toast.error(translateActionError(result.error, t));
        return;
      }
      toast.success(t.offers.toast.saved);
      router.refresh();
      onDone?.();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit as never)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.offers.fields.baseSalary}>
          <Input placeholder={t.offers.placeholders.baseSalary} {...register('baseSalary')} />
        </Field>
        <Field label={t.offers.fields.bonus}>
          <Input placeholder={t.offers.placeholders.bonus} {...register('bonus')} />
        </Field>
        <Field label={t.offers.fields.location}>
          <Input placeholder={t.offers.placeholders.location} {...register('location')} />
        </Field>
        <Field label={t.offers.fields.team}>
          <Input placeholder={t.offers.placeholders.team} {...register('team')} />
        </Field>
        <Field
          label={t.offers.fields.responseDeadlineAt}
          optional
          optionalText={t.form.hints.optional}
        >
          <DatePicker
            value={asDateInputValue(watch('responseDeadlineAt'))}
            onChange={(v) =>
              setValue('responseDeadlineAt', v as never, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            ariaInvalid={Boolean(formState.errors.responseDeadlineAt)}
          />
        </Field>
        <Field label={t.offers.fields.decisionStatus}>
          <Select
            value={watch('decisionStatus')}
            onValueChange={(v) => setValue('decisionStatus', v as never, { shouldDirty: true })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OFFER_DECISIONS.map((d) => (
                <SelectItem key={d} value={d}>
                  {t.offers.decision[d]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.offers.fields.pros}>
          <Textarea rows={3} placeholder={t.offers.placeholders.pros} {...register('pros')} />
        </Field>
        <Field label={t.offers.fields.cons}>
          <Textarea rows={3} placeholder={t.offers.placeholders.cons} {...register('cons')} />
        </Field>
      </div>

      <div className="flex items-center justify-end gap-2">
        {onDone && (
          <Button type="button" variant="outline" onClick={onDone}>
            {t.form.actions.cancel}
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? t.form.actions.saving : t.form.actions.save}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  optional,
  optionalText,
  children,
}: {
  label: string;
  optional?: boolean;
  optionalText?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label>{label}</Label>
        {optional && optionalText && (
          <span className="text-[11px] text-muted-foreground">{optionalText}</span>
        )}
      </div>
      {children}
    </div>
  );
}
