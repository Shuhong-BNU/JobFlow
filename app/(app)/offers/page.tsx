import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { listApplicationOptions } from "@/features/applications/server/queries";
import { OfferForm } from "@/features/offers/components/offer-form";
import { OffersCompare } from "@/features/offers/components/offers-compare";
import { deleteOfferAction, saveOfferAction } from "@/features/offers/server/actions";
import { listOffers } from "@/features/offers/server/queries";
import { offerDecisionStatuses } from "@/lib/constants";
import {
  applicationStatusLabels,
  formatSalaryNumber,
  offerDecisionStatusLabels,
} from "@/lib/labels";
import { formatDate } from "@/lib/utils";
import { requireUser } from "@/server/permissions";

type OffersPageProps = {
  searchParams: Promise<{
    decisionStatus?: string;
    offer?: string;
    compare?: string | string[];
  }>;
};

export default async function OffersPage({ searchParams }: OffersPageProps) {
  const user = await requireUser();
  const params = await searchParams;
  const decisionStatus =
    typeof params.decisionStatus === "string" &&
    offerDecisionStatuses.includes(params.decisionStatus as never)
      ? (params.decisionStatus as (typeof offerDecisionStatuses)[number])
      : "all";

  const [offers, applicationOptions] = await Promise.all([
    listOffers(user.id, { decisionStatus }),
    listApplicationOptions(user.id),
  ]);

  const selectedOffer = offers.find((offer) => offer.id === params.offer) ?? null;
  const compareIds = normalizeCompareIds(params.compare);
  const compareOffers = offers.filter((offer) => compareIds.includes(offer.id));

  const buildQuery = (overrides: Record<string, string | null | undefined>) => {
    const query = new URLSearchParams();
    if (decisionStatus !== "all") {
      query.set("decisionStatus", decisionStatus);
    }

    for (const [key, value] of Object.entries(overrides)) {
      if (!value) {
        query.delete(key);
      } else {
        query.set(key, value);
      }
    }

    const result = query.toString();
    return result ? `/offers?${result}` : "/offers";
  };

  return (
    <>
      <PageHeader
        eyebrow="Phase 2"
        title="Offers"
        description="这里集中维护 Offer 记录，并支持多 Offer 并排对比。保存 Offer 后，对应岗位状态会自动进入 `offer`。"
      />

      <Card className="bg-card/86">
        <CardTitle>筛选</CardTitle>
        <CardDescription className="mt-2">
          可以先按决策状态筛，再在下方列表中勾选需要对比的 Offer。
        </CardDescription>
        <form className="mt-6 flex flex-wrap gap-4">
          <div className="min-w-56 space-y-2">
            <label className="text-sm font-medium">决策状态</label>
            <Select name="decisionStatus" defaultValue={decisionStatus}>
              <option value="all">全部</option>
              {offerDecisionStatuses.map((status) => (
                <option key={status} value={status}>
                  {offerDecisionStatusLabels[status]}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-end gap-3">
            <Button type="submit">应用筛选</Button>
            <Button asChild type="button" variant="ghost">
              <Link href="/offers">清空</Link>
            </Button>
          </div>
        </form>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <Card className="bg-card/86">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Offer 列表</CardTitle>
              <CardDescription className="mt-2">
                勾选后提交即可在页面底部生成对比视图。
              </CardDescription>
            </div>
          </div>

          <form className="mt-6 space-y-3">
            {decisionStatus !== "all" ? (
              <input type="hidden" name="decisionStatus" value={decisionStatus} />
            ) : null}
            {offers.length > 0 ? (
              offers.map((offer) => (
                <label
                  key={offer.id}
                  className="flex cursor-pointer gap-4 rounded-[24px] border border-border bg-muted/55 px-4 py-4"
                >
                  <input
                    type="checkbox"
                    name="compare"
                    value={offer.id}
                    defaultChecked={compareIds.includes(offer.id)}
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                        {offerDecisionStatusLabels[offer.decisionStatus]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {applicationStatusLabels[offer.applicationStatus]}
                      </span>
                    </div>
                    <p className="text-sm font-medium">
                      {offer.companyName} / {offer.applicationTitle}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      基础薪资 {formatSalaryNumber(offer.baseSalary)} · 奖金 {formatSalaryNumber(offer.bonus)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {offer.location || "未填写地点"} · 截止 {formatDate(offer.responseDeadlineAt)}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <a href={buildQuery({ offer: offer.id })} className="text-sm text-primary hover:underline">
                        编辑
                      </a>
                      <Link
                        href={`/applications/${offer.applicationId}`}
                        className="text-sm text-primary hover:underline"
                      >
                        打开岗位详情
                      </Link>
                    </div>
                  </div>
                </label>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                还没有 Offer 记录。可以先在右侧录入一个 Offer。
              </div>
            )}
            {offers.length > 0 ? (
              <div className="flex gap-3">
                <Button type="submit">更新对比</Button>
                <Button asChild type="button" variant="ghost">
                  <a href={buildQuery({ offer: params.offer ?? null })}>清空对比</a>
                </Button>
              </div>
            ) : null}
          </form>
        </Card>

        <div className="space-y-4">
          <OfferForm
            title={selectedOffer ? "编辑 Offer" : "新建 Offer"}
            description="支持直接选择岗位录入 Offer；如果该岗位已有 Offer，会自动更新原记录。"
            action={saveOfferAction}
            applications={applicationOptions}
            redirectTo={buildQuery({ offer: null })}
            defaultValues={
              selectedOffer
                ? {
                    applicationId: selectedOffer.applicationId,
                    baseSalary: selectedOffer.baseSalary ? String(selectedOffer.baseSalary) : "",
                    bonus: selectedOffer.bonus ? String(selectedOffer.bonus) : "",
                    location: selectedOffer.location ?? "",
                    team: selectedOffer.team ?? "",
                    responseDeadlineAt: selectedOffer.responseDeadlineAt as never,
                    decisionStatus: selectedOffer.decisionStatus,
                    pros: selectedOffer.pros ?? "",
                    cons: selectedOffer.cons ?? "",
                  }
                : undefined
            }
            submitLabel={selectedOffer ? "更新 Offer" : "保存 Offer"}
          />

          {selectedOffer ? (
            <form action={deleteOfferAction}>
              <input type="hidden" name="applicationId" value={selectedOffer.applicationId} />
              <input type="hidden" name="redirectTo" value={buildQuery({ offer: null })} />
              <Button type="submit" variant="destructive">
                删除当前 Offer
              </Button>
            </form>
          ) : null}
        </div>
      </div>

      <OffersCompare offers={compareOffers} />
    </>
  );
}

function normalizeCompareIds(input: string | string[] | undefined) {
  if (!input) {
    return [];
  }

  if (Array.isArray(input)) {
    return input;
  }

  return input.includes(",") ? input.split(",").filter(Boolean) : [input];
}
