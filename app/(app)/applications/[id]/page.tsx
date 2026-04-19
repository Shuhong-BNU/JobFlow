import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { ApplicationAiPanel } from "@/features/ai/components/application-ai-panel";
import { ApplicationMaterialsPanel } from "@/features/applications/components/application-materials-panel";
import { ApplicationOfferPanel } from "@/features/applications/components/application-offer-panel";
import { ApplicationOverview } from "@/features/applications/components/application-overview";
import { ApplicationTimeline } from "@/features/applications/components/application-timeline";
import { getApplicationDetail } from "@/features/applications/server/queries";
import { listMaterials } from "@/features/materials/server/queries";
import { requireUser } from "@/server/permissions";

type ApplicationDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ event?: string; note?: string }>;
};

export default async function ApplicationDetailPage({
  params,
  searchParams,
}: ApplicationDetailPageProps) {
  const user = await requireUser();
  const { id } = await params;
  const { event, note } = await searchParams;
  const [detail, allMaterials] = await Promise.all([
    getApplicationDetail(user.id, id),
    listMaterials(user.id),
  ]);

  if (!detail) {
    notFound();
  }

  return (
    <>
      <PageHeader
        eyebrow="Application Detail"
        title={`${detail.companyName} / ${detail.title}`}
        description="这里承载单个岗位的完整信息链：基础信息、AI 辅助、Timeline、材料绑定与 Offer 记录都会在同一页维护。"
      />
      <ApplicationOverview detail={detail} />
      <ApplicationAiPanel applicationId={detail.id} />
      <ApplicationTimeline
        detail={detail}
        selectedEventId={event}
        selectedNoteId={note}
      />
      <ApplicationMaterialsPanel detail={detail} availableMaterials={allMaterials} />
      <ApplicationOfferPanel detail={detail} />
    </>
  );
}
