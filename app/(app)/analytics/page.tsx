import { PageHeader } from "@/components/shared/page-header";
import { AnalyticsOverviewPanel } from "@/features/analytics/components/analytics-overview";
import { getAnalyticsOverview } from "@/features/analytics/server/queries";
import { requireUser } from "@/server/permissions";

export default async function AnalyticsPage() {
  const user = await requireUser();
  const analytics = await getAnalyticsOverview(user.id);

  return (
    <>
      <PageHeader
        eyebrow="Phase 2"
        title="Analytics"
        description="这里提供最实用的一层求职分析：总申请数、状态漏斗、来源效果、等待时长和近期 deadline 风险。"
      />
      <AnalyticsOverviewPanel analytics={analytics} />
    </>
  );
}
