"use client";

import { useActionState, useMemo } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormSubmitButton } from "@/components/shared/form-submit-button";
import { parseJobDescriptionAction } from "@/features/ai/server/actions";
import type { ApplicationJdDraft, ParseJobDescriptionActionState } from "@/features/ai/types";

const initialState: ParseJobDescriptionActionState = {};

export function JdParseAssistant({
  onApplyDraft,
}: {
  onApplyDraft: (draft: ApplicationJdDraft) => void;
}) {
  const [state, formAction] = useActionState(parseJobDescriptionAction, initialState);
  const draft = useMemo(() => mapResultToDraft(state.result), [state.result]);

  return (
    <Card className="bg-card/86">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <CardTitle>AI 解析 JD</CardTitle>
        </div>
        <CardDescription>
          把岗位描述粘进来，AI 会先生成结构化草稿。你确认后再手动应用到申请表单，不会直接写库。
        </CardDescription>
      </div>

      <form action={formAction} className="mt-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">可选来源链接</label>
          <Input name="sourceUrl" placeholder="https://..." />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">JD 文本</label>
          <Textarea
            name="jdText"
            className="min-h-44"
            placeholder="粘贴岗位描述、职责、要求、地点、截止日期等内容"
          />
        </div>

        {state.error ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-950 dark:bg-rose-950/40 dark:text-rose-200">
            {state.error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <FormSubmitButton idleLabel="解析 JD" pendingLabel="解析中..." />
          {state.result ? (
            <Button type="button" variant="secondary" onClick={() => onApplyDraft(draft)}>
              应用到申请表单
            </Button>
          ) : null}
        </div>
      </form>

      {state.result ? (
        <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="rounded-[24px] border border-border bg-muted/55 px-4 py-4">
            <p className="text-sm font-medium">结构化结果</p>
            <div className="mt-3 grid gap-3 text-sm">
              <ResultRow label="公司" value={state.result.companyName} />
              <ResultRow label="岗位" value={state.result.title} />
              <ResultRow label="地点" value={state.result.location} />
              <ResultRow label="岗位类型" value={state.result.employmentType} />
              <ResultRow label="截止日期" value={state.result.deadlineAt ?? state.result.deadlineText} />
            </div>
          </div>
          <div className="rounded-[24px] border border-border bg-muted/55 px-4 py-4">
            <p className="text-sm font-medium">AI 摘要</p>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {state.result.summary}
            </p>
            {state.result.skills.length > 0 ? (
              <TagSection title="识别到的技能" items={state.result.skills} />
            ) : null}
            {state.result.keywords.length > 0 ? (
              <TagSection title="关键词" items={state.result.keywords} />
            ) : null}
            <p className="mt-4 text-xs text-muted-foreground">
              {state.meta?.source === "provider" ? "来源：AI provider" : "来源：fallback 规则"}
              {state.meta?.info ? ` · ${state.meta.info}` : ""}
            </p>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function mapResultToDraft(result: ParseJobDescriptionActionState["result"]): ApplicationJdDraft {
  if (!result) {
    return {};
  }

  return {
    companyName: result.companyName ?? "",
    title: result.title ?? "",
    location: result.location ?? "",
    employmentType: result.employmentType ?? undefined,
    deadlineAt: result.deadlineAt ?? "",
    notes: result.summary || "",
    parsedSkills: result.skills,
    parsedKeywords: result.keywords,
    parsedSummary: result.summary,
    parsedConfidenceNotes: result.confidenceNotes,
  };
}

function ResultRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value || "未提取到"}</p>
    </div>
  );
}

function TagSection({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="mt-4">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={`${title}-${item}`}
            className="rounded-full bg-card px-2.5 py-1 text-xs text-muted-foreground"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
