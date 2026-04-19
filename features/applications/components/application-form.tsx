"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  applicationFormSchema,
  type ApplicationFormActionState,
  type ApplicationFormValues,
} from "@/features/applications/schema";
import {
  applicationPriorities,
  applicationSources,
  applicationStatuses,
  employmentTypes,
} from "@/lib/constants";
import {
  applicationPriorityLabels,
  applicationSourceLabels,
  applicationStatusLabels,
  employmentTypeLabels,
  salaryPeriodLabels,
} from "@/lib/labels";

const initialState: ApplicationFormActionState = {};

export function ApplicationForm({
  title,
  description,
  action,
  defaultValues,
  draftValues,
  draftVersion,
  submitLabel,
}: {
  title: string;
  description: string;
  action: (
    prevState: ApplicationFormActionState,
    formData: FormData,
  ) => Promise<ApplicationFormActionState>;
  defaultValues?: Partial<ApplicationFormValues>;
  draftValues?: Partial<ApplicationFormValues>;
  draftVersion?: number;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, initialState);
  const [isPending, startTransition] = useTransition();
  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      companyName: "",
      companyWebsite: "",
      companyIndustry: "",
      companyLocation: "",
      title: "",
      department: "",
      location: "",
      source: "official_site",
      sourceUrl: "",
      employmentType: "internship",
      currentStatus: "wishlist",
      priority: "medium",
      deadlineAt: "",
      appliedAt: "",
      referralName: "",
      salaryMin: "",
      salaryMax: "",
      salaryCurrency: "CNY",
      salaryPeriod: "monthly",
      notes: "",
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (!state.fieldErrors) {
      return;
    }

    for (const [field, messages] of Object.entries(state.fieldErrors)) {
      if (!messages?.[0]) {
        continue;
      }

      form.setError(field as keyof ApplicationFormValues, {
        message: messages[0],
      });
    }
  }, [form, state.fieldErrors]);

  useEffect(() => {
    if (!draftValues || draftVersion == null) {
      return;
    }

    form.reset({
      ...form.getValues(),
      ...draftValues,
    });
  }, [draftValues, draftVersion, form]);

  const onSubmit = form.handleSubmit((values) => {
    const formData = new FormData();

    Object.entries(values).forEach(([key, value]) => {
      formData.set(key, String(value ?? ""));
    });

    startTransition(() => {
      formAction(formData);
    });
  });

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <Card className="bg-card/86">
        <div className="space-y-2">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <Section
            title="公司与岗位"
            description="先把最重要的识别信息录清楚，确保看板和详情页都可读。"
          >
            <Field label="公司名" error={form.formState.errors.companyName?.message}>
              <Input {...form.register("companyName")} />
            </Field>
            <Field label="岗位名称" error={form.formState.errors.title?.message}>
              <Input {...form.register("title")} />
            </Field>
            <Field label="部门">
              <Input {...form.register("department")} />
            </Field>
            <Field label="工作地点">
              <Input {...form.register("location")} />
            </Field>
            <Field label="公司官网">
              <Input {...form.register("companyWebsite")} />
            </Field>
            <Field label="行业">
              <Input {...form.register("companyIndustry")} />
            </Field>
            <Field label="公司所在地">
              <Input {...form.register("companyLocation")} />
            </Field>
          </Section>

          <Section
            title="状态与来源"
            description="这些字段会驱动看板分区、总览风险判断和后续分析统计。"
          >
            <Field label="当前状态">
              <Select {...form.register("currentStatus")}>
                {applicationStatuses.map((status) => (
                  <option key={status} value={status}>
                    {applicationStatusLabels[status]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="优先级">
              <Select {...form.register("priority")}>
                {applicationPriorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {applicationPriorityLabels[priority]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="来源">
              <Select {...form.register("source")}>
                {applicationSources.map((source) => (
                  <option key={source} value={source}>
                    {applicationSourceLabels[source]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="来源链接">
              <Input {...form.register("sourceUrl")} />
            </Field>
            <Field label="岗位类型">
              <Select {...form.register("employmentType")}>
                {employmentTypes.map((type) => (
                  <option key={type} value={type}>
                    {employmentTypeLabels[type]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="内推人">
              <Input {...form.register("referralName")} />
            </Field>
          </Section>

          <Section
            title="时间与薪资"
            description="先把 deadline、投递时间和薪资预期记录下来，方便日历与后续 offer 对比复用。"
          >
            <Field label="截止日期">
              <Input type="date" {...form.register("deadlineAt")} />
            </Field>
            <Field label="投递日期">
              <Input type="date" {...form.register("appliedAt")} />
            </Field>
            <Field label="薪资下限">
              <Input type="number" {...form.register("salaryMin")} />
            </Field>
            <Field label="薪资上限">
              <Input type="number" {...form.register("salaryMax")} />
            </Field>
            <Field label="币种">
              <Input {...form.register("salaryCurrency")} />
            </Field>
            <Field label="薪资周期">
              <Select {...form.register("salaryPeriod")}>
                {Object.entries(salaryPeriodLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
          </Section>

          <Section
            title="备注"
            description="记下你为什么投、当前风险点和下一步计划，详情页会直接复用这里的信息。"
            className="xl:col-span-2"
          >
            <Field label="岗位备注">
              <Textarea {...form.register("notes")} />
            </Field>
          </Section>
        </div>

        {state.error ? (
          <p className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-950 dark:bg-rose-950/40 dark:text-rose-200">
            {state.error}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "保存中..." : submitLabel}
          </Button>
          <Button type="button" variant="ghost" onClick={() => history.back()}>
            返回上一页
          </Button>
        </div>
      </Card>
    </form>
  );
}

function Section({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">{children}</div>
    </div>
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
