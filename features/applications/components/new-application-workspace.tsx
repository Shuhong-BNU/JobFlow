"use client";

import { useState } from "react";
import { JdParseAssistant } from "@/features/ai/components/jd-parse-assistant";
import type { ApplicationJdDraft } from "@/features/ai/types";
import { ApplicationForm } from "@/features/applications/components/application-form";
import type {
  ApplicationFormActionState,
  ApplicationFormValues,
} from "@/features/applications/schema";

export function NewApplicationWorkspace({
  title,
  description,
  action,
  submitLabel,
}: {
  title: string;
  description: string;
  action: (
    prevState: ApplicationFormActionState,
    formData: FormData,
  ) => Promise<ApplicationFormActionState>;
  submitLabel: string;
}) {
  const [draftValues, setDraftValues] = useState<Partial<ApplicationFormValues>>();
  const [draftVersion, setDraftVersion] = useState(0);

  return (
    <div className="space-y-4">
      <JdParseAssistant
        onApplyDraft={(draft: ApplicationJdDraft) => {
          setDraftValues({
            companyName: draft.companyName,
            title: draft.title,
            location: draft.location,
            employmentType: draft.employmentType,
            deadlineAt: draft.deadlineAt,
            notes: draft.notes,
          });
          setDraftVersion((version) => version + 1);
        }}
      />

      <ApplicationForm
        title={title}
        description={description}
        action={action}
        submitLabel={submitLabel}
        draftValues={draftValues}
        draftVersion={draftVersion}
      />
    </div>
  );
}
