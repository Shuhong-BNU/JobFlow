import Link from "next/link";
import { ExternalLink, PencilLine, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { deleteApplicationAction } from "@/features/applications/server/actions";
import type { ApplicationDetail } from "@/features/applications/types";
import {
  applicationPriorityLabels,
  applicationSourceLabels,
  applicationStatusMeta,
  employmentTypeLabels,
} from "@/lib/labels";
import { describeDeadline, formatDate } from "@/lib/utils";

export function ApplicationOverview({
  detail,
}: {
  detail: ApplicationDetail;
}) {
  const deleteAction = deleteApplicationAction.bind(null, detail.id);
  const nextAction = getNextAction(detail);

  return (
    <Card className="bg-card/86">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">{detail.companyName}</p>
            <CardTitle className="mt-1 text-3xl">{detail.title}</CardTitle>
            <CardDescription className="mt-2 text-sm leading-6">
              {applicationStatusMeta[detail.currentStatus].description}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              {applicationStatusMeta[detail.currentStatus].label}
            </span>
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              {applicationPriorityLabels[detail.priority]}优先级
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href={`/applications/${detail.id}/edit`}>
              <PencilLine className="mr-2 size-4" />
              编辑
            </Link>
          </Button>
          <form action={deleteAction}>
            <Button type="submit" variant="destructive">
              <Trash2 className="mr-2 size-4" />
              删除
            </Button>
          </form>
        </div>
      </div>

      <Separator className="my-6" />

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <MetaItem label="截止日期" value={detail.deadlineAt ? formatDate(detail.deadlineAt) : "未设置"} />
        <MetaItem label="截止风险" value={describeDeadline(detail.deadlineAt)} />
        <MetaItem label="投递日期" value={detail.appliedAt ? formatDate(detail.appliedAt) : "未设置"} />
        <MetaItem label="岗位地点" value={detail.location ?? "未填写"} />
        <MetaItem label="岗位类型" value={employmentTypeLabels[detail.employmentType]} />
        <MetaItem label="申请来源" value={applicationSourceLabels[detail.source]} />
        <MetaItem label="来源链接" value={detail.sourceUrl ? "查看原链接" : "未填写"}>
          {detail.sourceUrl ? (
            <a
              href={detail.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              打开链接
              <ExternalLink className="size-3.5" />
            </a>
          ) : null}
        </MetaItem>
        <MetaItem label="部门" value={detail.department ?? "未填写"} />
        <MetaItem label="内推人" value={detail.referralName ?? "未填写"} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
        <div className="rounded-[24px] border border-border bg-muted/55 px-4 py-4">
          <p className="text-sm font-medium">岗位备注</p>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            {detail.notes ?? "还没有岗位备注。建议把投递理由、风险判断和下一步计划写在这里。"}
          </p>
        </div>

        <div className="rounded-[24px] border border-border bg-secondary/60 px-4 py-4">
          <p className="text-sm font-medium">下一步动作</p>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">{nextAction}</p>
        </div>
      </div>
    </Card>
  );
}

function MetaItem({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-border bg-muted/55 px-4 py-4">
      <p className="text-xs tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-medium">{value}</p>
      {children ? <div className="mt-3 text-sm">{children}</div> : null}
    </div>
  );
}

function getNextAction(detail: ApplicationDetail) {
  if (detail.currentStatus === "wishlist") {
    return detail.deadlineAt
      ? "优先确认材料版本并尽快完成投递，避免临近截止日期时再临时改简历。"
      : "先补齐截止日期和岗位链接，再决定是否进入正式投递。";
  }

  if (detail.currentStatus === "applied") {
    return "补录后续 reminder 或 follow-up 节点，避免投递后完全失去跟进节奏。";
  }

  if (detail.currentStatus === "oa") {
    return "确认笔试时间和准备范围，把相关事件录入时间线，避免遗漏测评窗口。";
  }

  if (detail.currentStatus === "interview") {
    return "把每轮面试记录和反馈补进时间线，确保后续复盘与准备有据可查。";
  }

  if (detail.currentStatus === "hr") {
    return "提前整理 offer 关注点、答复时间和谈薪边界，避免进入 HR 面后信息不完整。";
  }

  if (detail.currentStatus === "offer") {
    return "尽快补齐 offer 记录和答复截止日，方便在 Offer 页面做横向对比。";
  }

  if (detail.currentStatus === "rejected") {
    return "建议写一条复盘备注，再决定是否归档，方便之后回顾渠道和面试策略。";
  }

  return "当前岗位已归档，可保留历史信息并把注意力转向活跃申请。";
}
