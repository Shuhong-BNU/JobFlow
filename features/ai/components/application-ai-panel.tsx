"use client";

import { useActionState } from "react";
import { Sparkles } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { FormSubmitButton } from "@/components/shared/form-submit-button";
import { generateInterviewPrepAction, suggestNextActionsAction } from "@/features/ai/server/actions";
import type {
  InterviewPrepActionState,
  SuggestNextActionsActionState,
} from "@/features/ai/types";

const nextActionsInitialState: SuggestNextActionsActionState = {};
const interviewPrepInitialState: InterviewPrepActionState = {};

export function ApplicationAiPanel({
  applicationId,
}: {
  applicationId: string;
}) {
  const [nextActionsState, nextActionsFormAction] = useActionState(
    suggestNextActionsAction.bind(null, applicationId),
    nextActionsInitialState,
  );
  const [interviewPrepState, interviewPrepFormAction] = useActionState(
    generateInterviewPrepAction.bind(null, applicationId),
    interviewPrepInitialState,
  );

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Card className="bg-card/86">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <CardTitle>AI 下一步建议</CardTitle>
          </div>
          <CardDescription>
            AI 只会给建议，不会自动改状态、写事件或写笔记。你确认后再手动执行。
          </CardDescription>
        </div>

        <form action={nextActionsFormAction} className="mt-6 space-y-4">
          <FormSubmitButton idleLabel="生成建议" pendingLabel="生成中..." />
        </form>

        {nextActionsState.error ? (
          <ErrorBox message={nextActionsState.error} />
        ) : null}

        {nextActionsState.result ? (
          <div className="mt-6 space-y-4">
            <ResultMeta
              source={nextActionsState.meta?.source}
              info={nextActionsState.meta?.info}
              taskId={nextActionsState.meta?.taskId}
            />
            <SectionList title="下一步动作" items={nextActionsState.result.nextActions} />
            <SectionList title="风险提示" items={nextActionsState.result.risks} />
            <SectionList
              title="建议补的事件类型"
              items={nextActionsState.result.suggestedEventTypes}
            />
            <div className="rounded-[24px] border border-border bg-muted/55 px-4 py-4">
              <p className="text-sm font-medium">建议说明</p>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                {nextActionsState.result.reasoningSummary}
              </p>
            </div>
          </div>
        ) : null}
      </Card>

      <Card className="bg-card/86">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <CardTitle>AI 面试准备摘要</CardTitle>
          </div>
          <CardDescription>
            适合在面试前快速整理能力点、提问方向和准备清单。不会自动写入 notes。
          </CardDescription>
        </div>

        <form action={interviewPrepFormAction} className="mt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">可选补充上下文</label>
            <Textarea
              name="extraContext"
              placeholder="例如：这轮更偏后端 / 需要准备英文自我介绍 / JD 里强调系统设计"
            />
          </div>
          <FormSubmitButton idleLabel="生成准备摘要" pendingLabel="生成中..." />
        </form>

        {interviewPrepState.error ? <ErrorBox message={interviewPrepState.error} /> : null}

        {interviewPrepState.result ? (
          <div className="mt-6 space-y-4">
            <ResultMeta
              source={interviewPrepState.meta?.source}
              info={interviewPrepState.meta?.info}
              taskId={interviewPrepState.meta?.taskId}
            />
            <SectionList title="核心能力" items={interviewPrepState.result.coreCompetencies} />
            <SectionList title="问题方向" items={interviewPrepState.result.questionDirections} />
            <SectionList title="准备清单" items={interviewPrepState.result.prepChecklist} />
            <SectionList
              title="公司 / 团队研究方向"
              items={interviewPrepState.result.companyResearchAngles}
            />
            <SectionList
              title="简历可展开点"
              items={interviewPrepState.result.resumeTalkingPoints}
            />
            <SectionList title="提醒事项" items={interviewPrepState.result.cautionNotes} />
          </div>
        ) : null}
      </Card>
    </div>
  );
}

function SectionList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="rounded-[24px] border border-border bg-muted/55 px-4 py-4">
      <p className="text-sm font-medium">{title}</p>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
        {items.map((item) => (
          <li key={`${title}-${item}`}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}

function ResultMeta({
  source,
  info,
  taskId,
}: {
  source?: "provider" | "fallback";
  info?: string;
  taskId?: string;
}) {
  return (
    <p className="text-xs text-muted-foreground">
      来源：{source === "provider" ? "AI provider" : "fallback 规则"}
      {info ? ` · ${info}` : ""}
      {taskId ? ` · task ${taskId}` : ""}
    </p>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <p className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-950 dark:bg-rose-950/40 dark:text-rose-200">
      {message}
    </p>
  );
}
