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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MATERIAL_TYPES } from '@/lib/enums';
import { useT } from '@/lib/i18n/client';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import { materialFormSchema, type MaterialFormInput, type MaterialFormValues } from '../schema';
import { createMaterial, updateMaterial } from '../actions';

function translateActionError(code: string, t: Dictionary): string {
  const common = t.common as Record<string, string>;
  return common[code] ?? code;
}

type Props = {
  materialId?: string;
  defaultValues?: Partial<MaterialFormInput>;
  onDone?: () => void;
};

export function MaterialForm({ materialId, defaultValues, onDone }: Props) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const isEdit = Boolean(materialId);

  const form = useForm<MaterialFormInput>({
    resolver: zodResolver(materialFormSchema) as never,
    defaultValues: {
      type: defaultValues?.type ?? 'resume',
      name: defaultValues?.name ?? '',
      version: defaultValues?.version ?? '',
      fileUrl: defaultValues?.fileUrl ?? '',
      tags: defaultValues?.tags ?? '',
      notes: defaultValues?.notes ?? '',
    },
  });

  const { register, handleSubmit, formState, setValue, watch } = form;

  function onSubmit(values: MaterialFormValues) {
    startTransition(async () => {
      const result = isEdit
        ? await updateMaterial(materialId!, values as MaterialFormInput)
        : await createMaterial(values as MaterialFormInput);
      if (!result.ok) {
        toast.error(translateActionError(result.error, t));
        return;
      }
      toast.success(isEdit ? t.materialsPage.toast.saved : t.materialsPage.toast.created);
      router.refresh();
      onDone?.();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit as never)} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.materialsPage.fields.type}>
          <Select
            value={watch('type')}
            onValueChange={(v) => setValue('type', v as never, { shouldDirty: true })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MATERIAL_TYPES.map((m) => (
                <SelectItem key={m} value={m}>
                  {t.materialType[m]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label={t.materialsPage.fields.name}>
          <Input
            placeholder={t.materialsPage.placeholders.name}
            aria-invalid={Boolean(formState.errors.name)}
            {...register('name')}
          />
          {formState.errors.name && (
            <p className="text-xs text-destructive">{t.form.errors.required}</p>
          )}
        </Field>
        <Field label={t.materialsPage.fields.version} optional optionalText={t.form.hints.optional}>
          <Input placeholder={t.materialsPage.placeholders.version} {...register('version')} />
        </Field>
        <Field label={t.materialsPage.fields.fileUrl} optional optionalText={t.form.hints.optional}>
          <Input
            placeholder={t.materialsPage.placeholders.fileUrl}
            aria-invalid={Boolean(formState.errors.fileUrl)}
            {...register('fileUrl')}
          />
          {formState.errors.fileUrl && (
            <p className="text-xs text-destructive">{t.materialsPage.errors.invalidUrl}</p>
          )}
        </Field>
      </div>

      <Field label={t.materialsPage.fields.tags} optional optionalText={t.materialsPage.hints.tags}>
        <Input placeholder={t.materialsPage.placeholders.tags} {...register('tags')} />
      </Field>

      <Field label={t.materialsPage.fields.notes} optional optionalText={t.form.hints.optional}>
        <Textarea rows={3} placeholder={t.materialsPage.placeholders.notes} {...register('notes')} />
      </Field>

      <div className="flex items-center justify-end gap-2">
        {onDone && (
          <Button type="button" variant="outline" onClick={onDone}>
            {t.form.actions.cancel}
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? t.form.actions.saving : isEdit ? t.form.actions.save : t.common.add}
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
