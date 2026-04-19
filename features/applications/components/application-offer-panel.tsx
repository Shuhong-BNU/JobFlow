import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { OfferForm } from "@/features/offers/components/offer-form";
import { deleteOfferAction, saveOfferAction } from "@/features/offers/server/actions";
import type { ApplicationOption } from "@/features/applications/types";
import { formatSalaryNumber, offerDecisionStatusLabels } from "@/lib/labels";
import { formatDate } from "@/lib/utils";

export function ApplicationOfferPanel({
  detail,
}: {
  detail: {
    id: string;
    companyName: string;
    title: string;
    currentStatus: ApplicationOption["currentStatus"];
    offer: {
      id: string;
      location: string | null;
      team: string | null;
      responseDeadlineAt: Date | null;
      decisionStatus: keyof typeof offerDecisionStatusLabels;
      baseSalary: number | null;
      bonus: number | null;
      pros: string | null;
      cons: string | null;
    } | null;
  };
}) {
  const redirectTo = `/applications/${detail.id}`;
  const applicationOptions: ApplicationOption[] = [
    {
      id: detail.id,
      companyName: detail.companyName,
      title: detail.title,
      currentStatus: detail.currentStatus,
    },
  ];

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)]">
      <Card className="bg-card/86">
        <CardTitle>Offer 记录</CardTitle>
        <CardDescription className="mt-2">
          一条申请最多一个 Offer。保存 Offer 后，岗位状态会自动同步到 `offer`。
        </CardDescription>

        {detail.offer ? (
          <div className="mt-6 space-y-3">
            <InfoRow label="基础薪资" value={formatSalaryNumber(detail.offer.baseSalary)} />
            <InfoRow label="奖金 / 签字费" value={formatSalaryNumber(detail.offer.bonus)} />
            <InfoRow label="地点" value={detail.offer.location || "未填写"} />
            <InfoRow label="团队" value={detail.offer.team || "未填写"} />
            <InfoRow label="回复截止" value={formatDate(detail.offer.responseDeadlineAt)} />
            <InfoRow
              label="决策状态"
              value={offerDecisionStatusLabels[detail.offer.decisionStatus]}
            />
            <InfoRow label="优点" value={detail.offer.pros || "未填写"} multiline />
            <InfoRow label="顾虑" value={detail.offer.cons || "未填写"} multiline />

            <form action={deleteOfferAction} className="pt-2">
              <input type="hidden" name="applicationId" value={detail.id} />
              <input type="hidden" name="redirectTo" value={redirectTo} />
              <Button type="submit" variant="destructive">
                <Trash2 className="mr-2 size-4" />
                删除 Offer
              </Button>
            </form>
          </div>
        ) : (
          <div className="mt-6 rounded-[24px] border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
            还没有 Offer 记录。你可以在右侧直接录入，并在 `/offers` 页面做跨 Offer 对比。
          </div>
        )}
      </Card>

      <OfferForm
        title={detail.offer ? "编辑 Offer" : "录入 Offer"}
        description="录入后会同步到 Offer 列表和 Analytics。删除 Offer 时不会自动回退岗位状态。"
        action={saveOfferAction}
        applications={applicationOptions}
        fixedApplicationId={detail.id}
        redirectTo={redirectTo}
        defaultValues={
          detail.offer
            ? {
                applicationId: detail.id,
                baseSalary: detail.offer.baseSalary ? String(detail.offer.baseSalary) : "",
                bonus: detail.offer.bonus ? String(detail.offer.bonus) : "",
                location: detail.offer.location ?? "",
                team: detail.offer.team ?? "",
                responseDeadlineAt: detail.offer.responseDeadlineAt as unknown as string,
                decisionStatus: detail.offer.decisionStatus,
                pros: detail.offer.pros ?? "",
                cons: detail.offer.cons ?? "",
              }
            : {
                applicationId: detail.id,
              }
        }
        submitLabel={detail.offer ? "更新 Offer" : "保存 Offer"}
      />
    </div>
  );
}

function InfoRow({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="rounded-[24px] border border-border bg-muted/55 px-4 py-4">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className={multiline ? "mt-2 text-sm leading-6" : "mt-2 text-sm font-medium"}>{value}</p>
    </div>
  );
}
