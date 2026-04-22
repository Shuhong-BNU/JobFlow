import { requireUser } from '@/lib/auth-helpers';
import { getServerDictionary } from '@/lib/i18n/server';
import { getAnalyticsOverview } from '@/features/analytics/queries';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/empty-state';
import { APPLICATION_STATUS_TONE, type ApplicationStatus } from '@/lib/enums';
import { cn } from '@/lib/utils';

/**
 * Analytics v1 页面：诚实的事实。
 *
 *  - KPI：总申请 / 等待中 / 已拒 / 归档
 *  - 漏斗：累计到达各主干阶段的申请数
 *  - Source：来源分布
 *  - Waiting：卡在 applied / oa 的申请等待均值 / 峰值
 *
 * 不做的事：
 *  - 不做环比 / 周趋势（v1 不追溯 events）
 *  - 不做 AI 建议、不做"健康度评分"
 *  - 不做空数据伪造（真的零就展示 EmptyState）
 */
export default async function AnalyticsPage() {
  const user = await requireUser();
  const t = getServerDictionary();
  const overview = await getAnalyticsOverview(user.id);

  if (overview.totalApplications === 0) {
    return (
      <div className="px-6 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">{t.analyticsPage.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.analyticsPage.subtitle}</p>
        </header>
        <EmptyState title={t.analyticsPage.empty.title} description={t.analyticsPage.empty.desc} />
      </div>
    );
  }

  const waitingAvg =
    overview.waiting.avgDays != null ? Math.round(overview.waiting.avgDays * 10) / 10 : null;
  const waitingMax =
    overview.waiting.maxDays != null ? Math.round(overview.waiting.maxDays * 10) / 10 : null;

  const funnelMax = overview.funnel.reduce((m, f) => Math.max(m, f.count), 0);
  const sourceMax = overview.sources.reduce((m, s) => Math.max(m, s.count), 0);

  return (
    <div className="px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{t.analyticsPage.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.analyticsPage.subtitle}</p>
      </header>

      {/* KPI 行 */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KPI label={t.analyticsPage.kpi.total} value={overview.totalApplications} />
        <KPI label={t.analyticsPage.kpi.waiting} value={overview.waiting.count} />
        <KPI label={t.analyticsPage.kpi.rejected} value={overview.rejectedCount} />
        <KPI label={t.analyticsPage.kpi.archived} value={overview.archivedCount} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* 漏斗 */}
        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="text-sm font-semibold">{t.analyticsPage.funnel.title}</h2>
              <p className="text-xs text-muted-foreground">{t.analyticsPage.funnel.hint}</p>
            </div>
            <div className="space-y-2.5">
              {overview.funnel.map((bar) => {
                const pct =
                  overview.totalApplications > 0
                    ? Math.round((bar.count / overview.totalApplications) * 100)
                    : 0;
                const width = funnelMax > 0 ? (bar.count / funnelMax) * 100 : 0;
                return (
                  <div key={bar.stage} className="flex items-center gap-3">
                    <div className="w-20 shrink-0 text-xs font-medium text-muted-foreground">
                      {t.status[bar.stage as ApplicationStatus]}
                    </div>
                    <div className="relative h-6 flex-1 overflow-hidden rounded bg-muted/50">
                      <div
                        className={cn(
                          'h-full rounded transition-all',
                          APPLICATION_STATUS_TONE[bar.stage as ApplicationStatus]
                        )}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                    <div className="w-28 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                      <span className="font-semibold text-foreground">{bar.count}</span>
                      <span className="ml-1">· {pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Source 分布 */}
        <Card>
          <CardContent className="p-5">
            <h2 className="mb-4 text-sm font-semibold">{t.analyticsPage.sources.title}</h2>
            {overview.sources.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t.analyticsPage.sources.empty}</p>
            ) : (
              <div className="space-y-2.5">
                {overview.sources.map((s) => {
                  const width = sourceMax > 0 ? (s.count / sourceMax) * 100 : 0;
                  return (
                    <div key={s.source} className="flex items-center gap-3">
                      <div className="w-28 shrink-0 truncate text-xs font-medium text-muted-foreground">
                        {s.source}
                      </div>
                      <div className="relative h-4 flex-1 overflow-hidden rounded bg-muted/50">
                        <div
                          className="h-full rounded bg-sky-500/70"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                      <div className="w-10 shrink-0 text-right text-xs tabular-nums font-semibold">
                        {s.count}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Waiting 明细 */}
      <Card className="mt-6">
        <CardContent className="p-5">
          <h2 className="mb-4 text-sm font-semibold">{t.analyticsPage.waiting.title}</h2>
          {overview.waiting.count === 0 ? (
            <p className="text-xs text-muted-foreground">{t.analyticsPage.waiting.empty}</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              <WaitingKV
                label={t.analyticsPage.waiting.count}
                value={String(overview.waiting.count)}
              />
              <WaitingKV
                label={t.analyticsPage.waiting.avg}
                value={
                  waitingAvg != null
                    ? `${waitingAvg} ${t.analyticsPage.kpi.daysSuffix}`
                    : t.common.dash
                }
              />
              <WaitingKV
                label={t.analyticsPage.waiting.max}
                value={
                  waitingMax != null
                    ? `${waitingMax} ${t.analyticsPage.kpi.daysSuffix}`
                    : t.common.dash
                }
              />
            </div>
          )}
          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
            {t.analyticsPage.waiting.note}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function KPI({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

function WaitingKV({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
