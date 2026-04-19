import { PageHeader } from "@/components/shared/page-header";
import { NewApplicationWorkspace } from "@/features/applications/components/new-application-workspace";
import { createApplicationAction } from "@/features/applications/server/actions";

export default function NewApplicationPage() {
  return (
    <>
      <PageHeader
        eyebrow="New"
        title="录入新的岗位申请"
        description="你可以手动填写，也可以先让 AI 解析 JD 生成草稿，再由你确认后应用到申请表单。"
      />
      <NewApplicationWorkspace
        title="新建申请"
        description="优先把岗位识别信息、当前状态和截止日期填完整，其它字段可以后续补充。"
        action={createApplicationAction}
        submitLabel="创建申请"
      />
    </>
  );
}
