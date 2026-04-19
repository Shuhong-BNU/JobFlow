import Link from "next/link";
import { BriefcaseBusiness } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-grid">
      <div className="page-shell flex min-h-screen items-center justify-center py-10">
        <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1.05fr)_480px] lg:items-center">
          <div className="hidden space-y-8 lg:block">
            <div className="inline-flex items-center gap-3 rounded-full border border-border bg-card/75 px-4 py-2 backdrop-blur">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <BriefcaseBusiness className="size-4" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                  JobFlow
                </p>
                <p className="text-sm text-muted-foreground">大学生求职季申请管理看板</p>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="max-w-xl text-5xl font-semibold leading-tight tracking-tight text-balance">
                把每一份申请、每一个截止日、每一次推进都放回一个清晰系统里。
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                这不是招聘网站，也不是自动海投机器人。JobFlow 只做一件事：帮助你把求职流程管理得像一个真正的产品项目。
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                ["可视化看板", "从 Wishlist 到 Offer，阶段一眼看清。"],
                ["强提醒", "近期截止、面试安排、风险岗位集中提示。"],
                ["可扩展", "未来再接材料中心、AI 建议和 Gmail 同步。"],
              ].map(([itemTitle, itemDesc]) => (
                <Card key={itemTitle} className="bg-card/80">
                  <CardTitle className="text-base">{itemTitle}</CardTitle>
                  <CardDescription className="mt-2 leading-6">
                    {itemDesc}
                  </CardDescription>
                </Card>
              ))}
            </div>
          </div>

          <Card className="mx-auto w-full max-w-[480px] bg-card/88">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{title}</CardTitle>
              <CardDescription className="leading-6">{description}</CardDescription>
            </div>
            <div className="mt-8">{children}</div>
            <div className="mt-6 text-sm text-muted-foreground">{footer}</div>
          </Card>
        </div>
      </div>
      <Link
        href="/"
        className="absolute left-4 top-4 rounded-full border border-border bg-card/75 px-4 py-2 text-sm text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
      >
        返回首页
      </Link>
    </div>
  );
}
