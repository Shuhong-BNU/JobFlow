"use client";

import { useActionState } from "react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormSubmitButton } from "@/components/shared/form-submit-button";
import {
  type EventFormActionState,
  type EventFormValues,
  formatEventDateTimeInput,
} from "@/features/events/schema";
import type { ApplicationOption } from "@/features/applications/types";
import { editableEventTypeLabels, eventStatusLabels } from "@/lib/labels";

const initialState: EventFormActionState = {};

export function EventForm({
  title,
  description,
  action,
  applications,
  fixedApplicationId,
  redirectTo,
  defaultValues,
  submitLabel,
}: {
  title: string;
  description: string;
  action: (
    prevState: EventFormActionState,
    formData: FormData,
  ) => Promise<EventFormActionState>;
  applications: ApplicationOption[];
  fixedApplicationId?: string;
  redirectTo: string;
  defaultValues?: Partial<EventFormValues>;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, initialState);
  const selectedApplicationId = fixedApplicationId ?? defaultValues?.applicationId ?? "";

  return (
    <Card className="bg-card/86">
      <div className="space-y-2">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </div>

      <form action={formAction} className="mt-6 space-y-4">
        {fixedApplicationId ? (
          <input type="hidden" name="applicationId" value={fixedApplicationId} />
        ) : (
          <Field label="所属岗位" error={state.fieldErrors?.applicationId?.[0]}>
            <Select name="applicationId" defaultValue={selectedApplicationId}>
              <option value="">选择岗位</option>
              {applications.map((application) => (
                <option key={application.id} value={application.id}>
                  {application.companyName} / {application.title}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <input type="hidden" name="redirectTo" value={redirectTo} />

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="事件类型" error={state.fieldErrors?.eventType?.[0]}>
            <Select name="eventType" defaultValue={defaultValues?.eventType ?? "interview"}>
              {Object.entries(editableEventTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="状态" error={state.fieldErrors?.status?.[0]}>
            <Select name="status" defaultValue={defaultValues?.status ?? "scheduled"}>
              {Object.entries(eventStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="标题" error={state.fieldErrors?.title?.[0]}>
          <Input name="title" defaultValue={defaultValues?.title ?? ""} />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="开始时间" error={state.fieldErrors?.startsAt?.[0]}>
            <Input
              type="datetime-local"
              name="startsAt"
              defaultValue={formatEventDateTimeInput(defaultValues?.startsAt)}
            />
          </Field>
          <Field label="结束时间" error={state.fieldErrors?.endsAt?.[0]}>
            <Input
              type="datetime-local"
              name="endsAt"
              defaultValue={formatEventDateTimeInput(defaultValues?.endsAt)}
            />
          </Field>
        </div>

        <Field label="提醒时间" error={state.fieldErrors?.reminderAt?.[0]}>
          <Input
            type="datetime-local"
            name="reminderAt"
            defaultValue={formatEventDateTimeInput(defaultValues?.reminderAt)}
          />
        </Field>

        <Field label="说明" error={state.fieldErrors?.description?.[0]}>
          <Textarea name="description" defaultValue={defaultValues?.description ?? ""} />
        </Field>

        {state.error ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-950 dark:bg-rose-950/40 dark:text-rose-200">
            {state.error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <FormSubmitButton idleLabel={submitLabel} />
        </div>
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
