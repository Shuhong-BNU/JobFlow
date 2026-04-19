import Link from "next/link";
import { ArrowRight, BellRing, BriefcaseBusiness, CalendarClock, FolderClock } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getDashboardOverview } from "@/features/dashboard/server/queries";
import { describeDeadline, formatDate, formatDateTime, formatRelativeTime } from "@/lib/utils";
import { requireUser } from "@/server/permissions";

export default async function DashboardPage() {
  const user = await requireUser();
  const overview = await getDashboardOverview(user.id);

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title="今天先把最关键的申请推进一步"
        description="这里集中展示你的待办、近 7 天截止岗位、近期面试安排和风险提醒。每天先看这一页，再进入看板做具体操作。"
        actions={
          <Button asChild>
            <Link href="/applications/new">
              新建申请
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="申请总数"
          value={String(overview.stats.totalApplications)}
          helper="整个求职季的申请基线。先求全量可见，再做精细优化。"
          trend="up"
        />
        <StatCard
          label="活跃申请"
          value={String(overview.stats.activeApplications)}
          helper="仍在推进或需要动作的岗位。建议每天只盯这批。"
          trend="flat"
        />
        <StatCard
          label="近期事件"
          value={String(overview.stats.upcomingEvents)}
          helper="已录入的截止、笔试、面试和提醒数量。"
          trend="up"
        />
        <StatCard
          label="Offer 数"
          value={String(overview.stats.offers)}
          helper="进入 offer 阶段的岗位数量。"
          trend={overview.stats.offers > 0 ? "up" : "flat"}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <Card className="bg-card/85">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BellRing className="size-5 text-primary" />
                风险提醒
              </CardTitle>
              <CardDescription className="mt-2">
                把最容易漏掉的岗位先提到最前面，不要让重要机会悄悄过期。
              </CardDescription>
            </div>
            <Badge variant="warning">
              {overview.risks.length > 0 ? `${overview.risks.length} 条` : "已清空"}
            </Badge>
          </div>
          <div className="mt-6 space-y-3">
            {overview.risks.length > 0 ? (
              overview.risks.map((risk) => (
                <div
                  key={`${risk.type}-${risk.title}`}
                  className="rounded-2xl border border-border bg-muted/65 px-4 py-4"
                >
                  <p className="text-sm font-medium">{risk.title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {risk.description}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                目前没有高优先级风险，接下来可以专注推进正在面试中的岗位。
              </div>
            )}
          </div>
        </Card>

        <Card className="bg-card/85">
          <CardTitle className="flex items-center gap-2">
            <FolderClock className="size-5 text-primary" />
            今日待办
          </CardTitle>
          <CardDescription className="mt-2">
            由今天的面试、提醒和紧急截止组成，建议先处理这里。
          </CardDescription>
          <div className="mt-6 space-y-3">
            {overview.todayTodo.length > 0 ? (
              overview.todayTodo.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-border bg-muted/65 px-4 py-4"
                >
                  <p className="text-sm font-medium">
                    {item.companyName} · {item.applicationTitle}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.title}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatDateTime(item.startsAt)}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                今天还没有录入待办。你可以先把近期 deadline 或面试补进申请详情。
              </div>
            )}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.95fr)]">
        <Card className="bg-card/85">
          <CardTitle className="flex items-center gap-2">
            <BriefcaseBusiness className="size-5 text-primary" />
            近 7 天截止岗位
          </CardTitle>
          <CardDescription className="mt-2">
            先处理最接近截止日期的岗位，避免到最后一天才临时改材料。
          </CardDescription>
          <div className="mt-6 space-y-3">
            {overview.urgentDeadlines.length > 0 ? (
              overview.urgentDeadlines.map((item) => (
                <Link
                  key={item.id}
                  href={`/applications/${item.id}`}
                  className="block rounded-2xl border border-border bg-muted/65 px-4 py-4 transition-colors hover:bg-muted"
                >
                  <p className="text-sm font-medium">
                    {item.companyName} · {item.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {describeDeadline(item.deadlineAt)}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    截止日期：{formatDate(item.deadlineAt)}
                  </p>
                </Link>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                近 7 天没有紧急截止岗位。
              </div>
            )}
          </div>
        </Card>

        <Card className="bg-card/85">
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="size-5 text-primary" />
            近期面试 / 事件
          </CardTitle>
          <CardDescription className="mt-2">
            这些事件来自 `application_events`，后续 Phase 2 会进一步接管日历视图。
          </CardDescription>
          <div className="mt-6 space-y-3">
            {overview.upcomingEvents.length > 0 ? (
              overview.upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="rounded-2xl border border-border bg-muted/65 px-4 py-4"
                >
                  <p className="text-sm font-medium">{event.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {event.companyName} · {event.applicationTitle}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatDateTime(event.startsAt)}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                还没有录入即将到来的事件。
              </div>
            )}
          </div>
        </Card>

        <Card className="bg-card/85">
          <CardTitle>近期更新</CardTitle>
          <CardDescription className="mt-2">
            最近被编辑过的岗位，帮助你快速回到刚处理过的上下文。
          </CardDescription>
          <div className="mt-6 space-y-3">
            {overview.recentUpdates.map((item) => (
              <Link
                key={item.id}
                href={`/applications/${item.id}`}
                className="block rounded-2xl border border-border bg-muted/65 px-4 py-4 transition-colors hover:bg-muted"
              >
                <p className="text-sm font-medium">
                  {item.companyName} · {item.title}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {formatRelativeTime(item.updatedAt)}更新
                </p>
              </Link>
            ))}
          </div>
        </Card>
      </section>
    </>
  );
}
