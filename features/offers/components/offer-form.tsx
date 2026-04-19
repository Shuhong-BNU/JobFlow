"use client";

import { useActionState } from "react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormSubmitButton } from "@/components/shared/form-submit-button";
import type { ApplicationOption } from "@/features/applications/types";
import {
  formatOfferDateInput,
  type OfferFormActionState,
  type OfferFormValues,
} from "@/features/offers/schema";
import { offerDecisionStatusLabels } from "@/lib/labels";

const initialState: OfferFormActionState = {};

export function OfferForm({
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
    prevState: OfferFormActionState,
    formData: FormData,
  ) => Promise<OfferFormActionState>;
  applications: ApplicationOption[];
  fixedApplicationId?: string;
  redirectTo: string;
  defaultValues?: Partial<OfferFormValues>;
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

        {fixedApplicationId ? (
          <input type="hidden" name="applicationId" value={fixedApplicationId} />
        ) : (
          <Field label="所属岗位" error={state.fieldErrors?.applicationId?.[0]}>
            <Select
              name="applicationId"
              defaultValue={defaultValues?.applicationId ?? ""}
            >
              <option value="">选择岗位</option>
              {applications.map((application) => (
                <option key={application.id} value={application.id}>
                  {application.companyName} / {application.title}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="基础薪资" error={state.fieldErrors?.baseSalary?.[0]}>
            <Input name="baseSalary" type="number" defaultValue={defaultValues?.baseSalary ?? ""} />
          </Field>
          <Field label="奖金 / 签字费" error={state.fieldErrors?.bonus?.[0]}>
            <Input name="bonus" type="number" defaultValue={defaultValues?.bonus ?? ""} />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="地点" error={state.fieldErrors?.location?.[0]}>
            <Input name="location" defaultValue={defaultValues?.location ?? ""} />
          </Field>
          <Field label="团队" error={state.fieldErrors?.team?.[0]}>
            <Input name="team" defaultValue={defaultValues?.team ?? ""} />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="回复截止日期" error={state.fieldErrors?.responseDeadlineAt?.[0]}>
            <Input
              name="responseDeadlineAt"
              type="date"
              defaultValue={formatOfferDateInput(defaultValues?.responseDeadlineAt)}
            />
          </Field>
          <Field label="决策状态" error={state.fieldErrors?.decisionStatus?.[0]}>
            <Select name="decisionStatus" defaultValue={defaultValues?.decisionStatus ?? "pending"}>
              {Object.entries(offerDecisionStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="优点" error={state.fieldErrors?.pros?.[0]}>
          <Textarea name="pros" defaultValue={defaultValues?.pros ?? ""} />
        </Field>

        <Field label="顾虑" error={state.fieldErrors?.cons?.[0]}>
          <Textarea name="cons" defaultValue={defaultValues?.cons ?? ""} />
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
