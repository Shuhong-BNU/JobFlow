import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { ApplicationForm } from "@/features/applications/components/application-form";
import { updateApplicationAction } from "@/features/applications/server/actions";
import { getApplicationEditDefaults } from "@/features/applications/server/queries";
import { requireUser } from "@/server/permissions";

type EditApplicationPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditApplicationPage({
  params,
}: EditApplicationPageProps) {
  const user = await requireUser();
  const { id } = await params;
  const defaultValues = await getApplicationEditDefaults(user.id, id);

  if (!defaultValues) {
    notFound();
  }

  return (
    <>
      <PageHeader
        eyebrow="Edit"
        title="编辑申请"
        description="这里修改的字段会同步影响看板、Dashboard、deadline 事件和详情页展示。"
      />
      <ApplicationForm
        title="更新申请信息"
        description="尽量保持状态、截止日期与真实流程一致，这样后续 Dashboard 和 Analytics 才可靠。"
        action={updateApplicationAction.bind(null, id)}
        defaultValues={defaultValues}
        submitLabel="保存修改"
      />
    </>
  );
}
