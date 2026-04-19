"use client";

import { useActionState } from "react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormSubmitButton } from "@/components/shared/form-submit-button";
import {
  type MaterialFormActionState,
  type MaterialFormValues,
} from "@/features/materials/schema";
import { materialTypeLabels } from "@/lib/labels";

const initialState: MaterialFormActionState = {};

export function MaterialForm({
  title,
  description,
  action,
  defaultValues,
  currentFileUrl,
  redirectTo,
  submitLabel,
}: {
  title: string;
  description: string;
  action: (
    prevState: MaterialFormActionState,
    formData: FormData,
  ) => Promise<MaterialFormActionState>;
  defaultValues?: Partial<MaterialFormValues>;
  currentFileUrl?: string | null;
  redirectTo: string;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <Card className="bg-card/86">
      <div className="space-y-2">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </div>

      <form action={formAction} className="mt-6 space-y-4">
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <input type="hidden" name="currentFileUrl" value={currentFileUrl ?? ""} />

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="材料类型" error={state.fieldErrors?.type?.[0]}>
            <Select name="type" defaultValue={defaultValues?.type ?? "resume"}>
              {Object.entries(materialTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="版本" error={state.fieldErrors?.version?.[0]}>
            <Input name="version" defaultValue={defaultValues?.version ?? "v1"} />
          </Field>
        </div>

        <Field label="材料名称" error={state.fieldErrors?.name?.[0]}>
          <Input name="name" defaultValue={defaultValues?.name ?? ""} />
        </Field>

        <Field label="标签" error={state.fieldErrors?.tags?.[0]}>
          <Input
            name="tags"
            placeholder="如：算法, 英文版, 校招"
            defaultValue={defaultValues?.tags ?? ""}
          />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="上传本地文件">
            <Input type="file" name="file" />
          </Field>

          <Field label="或填写外部文件链接" error={state.fieldErrors?.externalFileUrl?.[0]}>
            <Input
              name="externalFileUrl"
              placeholder="https://..."
              defaultValue={defaultValues?.externalFileUrl ?? ""}
            />
          </Field>
        </div>

        {currentFileUrl ? (
          <p className="text-sm text-muted-foreground">
            当前文件：
            <a
              href={currentFileUrl}
              target="_blank"
              rel="noreferrer"
              className="ml-1 text-primary hover:underline"
            >
              打开链接
            </a>
          </p>
        ) : null}

        <Field label="备注" error={state.fieldErrors?.notes?.[0]}>
          <Textarea name="notes" defaultValue={defaultValues?.notes ?? ""} />
        </Field>

        {state.error ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-950 dark:bg-rose-950/40 dark:text-rose-200">
            {state.error}
          </p>
        ) : null}

        <FormSubmitButton idleLabel={submitLabel} />
      </form>
    </Card>
  );
}

function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}
    </div>
  );
}
