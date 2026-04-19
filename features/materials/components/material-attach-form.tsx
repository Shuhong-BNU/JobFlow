"use client";

import { useActionState } from "react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { FormSubmitButton } from "@/components/shared/form-submit-button";
import type { ApplicationOption } from "@/features/applications/types";
import {
  type MaterialAttachActionState,
  type AttachMaterialValues,
} from "@/features/materials/schema";
import type { MaterialListItem } from "@/features/materials/types";
import { materialPurposeLabels } from "@/lib/labels";

const initialState: MaterialAttachActionState = {};

export function MaterialAttachForm({
  title,
  description,
  action,
  applications,
  materials,
  redirectTo,
  fixedApplicationId,
  fixedMaterialId,
  defaultValues,
}: {
  title: string;
  description: string;
  action: (
    prevState: MaterialAttachActionState,
    formData: FormData,
  ) => Promise<MaterialAttachActionState>;
  applications: ApplicationOption[];
  materials: MaterialListItem[];
  redirectTo: string;
  fixedApplicationId?: string;
  fixedMaterialId?: string;
  defaultValues?: Partial<AttachMaterialValues>;
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
          <Field label="岗位" error={state.fieldErrors?.applicationId?.[0]}>
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

        {fixedMaterialId ? (
          <input type="hidden" name="materialId" value={fixedMaterialId} />
        ) : (
          <Field label="材料" error={state.fieldErrors?.materialId?.[0]}>
            <Select name="materialId" defaultValue={defaultValues?.materialId ?? ""}>
              <option value="">选择材料</option>
              {materials.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.name} / {material.version}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Field label="用途" error={state.fieldErrors?.purpose?.[0]}>
          <Select name="purpose" defaultValue={defaultValues?.purpose ?? "primary_resume"}>
            {Object.entries(materialPurposeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>

        {state.error ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-950 dark:bg-rose-950/40 dark:text-rose-200">
            {state.error}
          </p>
        ) : null}

        <FormSubmitButton idleLabel="绑定材料" />
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
