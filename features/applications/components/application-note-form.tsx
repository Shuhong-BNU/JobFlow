"use client";

import { useActionState } from "react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormSubmitButton } from "@/components/shared/form-submit-button";
import {
  type NoteFormActionState,
  type NoteFormValues,
} from "@/features/applications/note-schema";
import { noteTypeLabels } from "@/lib/labels";

const initialState: NoteFormActionState = {};

export function ApplicationNoteForm({
  title,
  description,
  action,
  applicationId,
  redirectTo,
  defaultValues,
  submitLabel,
}: {
  title: string;
  description: string;
  action: (
    prevState: NoteFormActionState,
    formData: FormData,
  ) => Promise<NoteFormActionState>;
  applicationId: string;
  redirectTo: string;
  defaultValues?: Partial<NoteFormValues>;
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
        <input type="hidden" name="applicationId" value={applicationId} />
        <input type="hidden" name="redirectTo" value={redirectTo} />

        <Field label="备注类型" error={state.fieldErrors?.noteType?.[0]}>
          <Select name="noteType" defaultValue={defaultValues?.noteType ?? "general"}>
            {Object.entries(noteTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="内容" error={state.fieldErrors?.content?.[0]}>
          <Textarea
            name="content"
            defaultValue={defaultValues?.content ?? ""}
            className="min-h-32"
          />
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
