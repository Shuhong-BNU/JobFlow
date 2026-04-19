import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import type { AnalyticsOverview } from "@/features/analytics/server/queries";

export function AnalyticsOverviewPanel({
  analytics,
}: {
  analytics: AnalyticsOverview;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="总申请数"
          value={String(analytics.totalApplications)}
          description="当前已录入的全部岗位申请。"
        />
        <StatCard
          title="7 天内即将截止"
          value={String(analytics.upcomingDeadlineCount)}
          description="未归档、未拒绝岗位中，7 天内到期的岗位数量。"
        />
        <StatCard
          title="平均等待天数"
          value={`${analytics.averageWaitingDays} 天`}
          description="统计 applied / oa / interview / hr 且已填写投递时间的岗位。"
        />
        <StatCard
          title="Offer / Rejection"
          value={`${analytics.offerCount} / ${analytics.rejectionCount}`}
          description="帮助快速判断当前结果分布。"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <DistributionCard
          title="状态漏斗"
          description="按固定 8 列状态统计当前岗位数量。"
          items={analytics.statusBreakdown.map((item) => ({
            label: item.label,
            value: item.count,
            ratio: item.ratio,
          }))}
        />
        <DistributionCard
          title="来源统计"
          description="看哪些投递渠道更值得持续投入。"
          items={analytics.sourceBreakdown.map((item) => ({
            label: item.label,
            value: item.count,
            ratio: item.ratio,
          }))}
        />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <Card className="bg-card/86">
      <CardDescription>{title}</CardDescription>
      <CardTitle className="mt-3 text-3xl">{value}</CardTitle>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
    </Card>
  );
}

function DistributionCard({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: Array<{ label: string; value: number; ratio: number }>;
}) {
  return (
    <Card className="bg-card/86">
      <CardTitle>{title}</CardTitle>
      <CardDescription className="mt-2">{description}</CardDescription>
      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <div key={item.label} className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span>{item.label}</span>
              <span className="text-muted-foreground">{item.value}</span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary transition-all"
                style={{ width: `${Math.max(item.ratio * 100, item.value > 0 ? 8 : 0)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
