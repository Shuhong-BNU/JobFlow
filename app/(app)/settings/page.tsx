import { PageHeader } from "@/components/shared/page-header";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="设置"
        description="这里先放主题与后续集成入口说明。真正的 Gmail / AI 接入会按 Phase 3 / 4 单独推进。"
      />
      <Card className="bg-card/86">
        <CardTitle>后续扩展入口</CardTitle>
        <CardDescription className="mt-2 leading-7">
          当前已接入浅层主题切换。后续这里会补充 Gmail OAuth、OpenAI-compatible provider、个人偏好与提醒设置。
        </CardDescription>
      </Card>
    </>
  );
}
