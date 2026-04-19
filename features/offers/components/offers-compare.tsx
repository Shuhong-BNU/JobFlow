import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import type { OfferListItem } from "@/features/offers/types";
import { applicationStatusLabels, formatSalaryNumber, offerDecisionStatusLabels } from "@/lib/labels";
import { formatDate } from "@/lib/utils";

export function OffersCompare({
  offers,
}: {
  offers: OfferListItem[];
}) {
  if (offers.length === 0) {
    return (
      <Card className="bg-card/86">
        <CardTitle>Offer 对比</CardTitle>
        <CardDescription className="mt-2">
          勾选 2 个及以上 Offer 后，这里会显示薪资、地点、团队和回复时限的并排对比。
        </CardDescription>
      </Card>
    );
  }

  const rows = [
    {
      label: "岗位",
      values: offers.map((offer) => `${offer.companyName} / ${offer.applicationTitle}`),
    },
    {
      label: "申请状态",
      values: offers.map((offer) => applicationStatusLabels[offer.applicationStatus]),
    },
    {
      label: "基础薪资",
      values: offers.map((offer) => formatSalaryNumber(offer.baseSalary)),
    },
    {
      label: "奖金 / 签字费",
      values: offers.map((offer) => formatSalaryNumber(offer.bonus)),
    },
    {
      label: "地点",
      values: offers.map((offer) => offer.location || "未填写"),
    },
    {
      label: "团队",
      values: offers.map((offer) => offer.team || "未填写"),
    },
    {
      label: "回复截止",
      values: offers.map((offer) => formatDate(offer.responseDeadlineAt)),
    },
    {
      label: "决策状态",
      values: offers.map((offer) => offerDecisionStatusLabels[offer.decisionStatus]),
    },
    {
      label: "优点",
      values: offers.map((offer) => offer.pros || "未填写"),
    },
    {
      label: "顾虑",
      values: offers.map((offer) => offer.cons || "未填写"),
    },
  ];

  return (
    <Card className="bg-card/86">
      <CardTitle>Offer 对比</CardTitle>
      <CardDescription className="mt-2">
        当前选中 {offers.length} 个 Offer，适合快速比较回复期限和总 package 结构。
      </CardDescription>

      <div className="mt-6 overflow-x-auto">
        <div className="min-w-[880px] rounded-[24px] border border-border">
          {rows.map((row, rowIndex) => (
            <div
              key={row.label}
              className={cnCompareRow(
                "grid grid-cols-[180px_repeat(auto-fit,minmax(220px,1fr))]",
                rowIndex !== rows.length - 1 && "border-b border-border",
              )}
            >
              <div className="bg-muted/55 px-4 py-4 text-sm font-medium">{row.label}</div>
              {row.values.map((value, index) => (
                <div key={`${row.label}-${index}`} className="px-4 py-4 text-sm leading-6">
                  {value}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function cnCompareRow(...classes: Array<string | false>) {
  return classes.filter(Boolean).join(" ");
}
