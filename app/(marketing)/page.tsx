import Link from "next/link";
import { ArrowRight, CalendarDays, Files, FolderKanban, Sparkles } from "lucide-react";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const featureCards = [
  {
    icon: FolderKanban,
    title: "申请看板",
    description: "按真实求职流程推进：Wishlist、已投递、OA、面试、Offer，全程可视化。",
  },
  {
    icon: CalendarDays,
    title: "关键节点提醒",
    description: "把 deadline、笔试、面试和 offer 回复期统一收进一个时间线。",
  },
  {
    icon: Files,
    title: "材料版本管理",
    description: "简历、Cover Letter、作品集与岗位绑定，避免投递时用错版本。",
  },
  {
    icon: Sparkles,
    title: "AI 增强但不抢主线",
    description: "先把产品本体做稳，再逐步加 JD 解析、下一步建议和面试准备。",
  },
];

export default async function MarketingPage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-grid">
      <div className="page-shell py-4 sm:py-6">
        <header className="surface-soft flex items-center justify-between rounded-[28px] px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              JobFlow
            </p>
            <p className="text-sm text-muted-foreground">面向大学生求职季的申请管理看板</p>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="ghost">
              <Link href="/sign-in">登录</Link>
            </Button>
            <Button asChild>
              <Link href={session?.user ? "/dashboard" : "/sign-up"}>
                {session?.user ? "进入控制台" : "立即开始"}
              </Link>
            </Button>
          </div>
        </header>

        <section className="grid gap-8 py-16 lg:grid-cols-[minmax(0,1.1fr)_420px] lg:items-end">
          <div className="space-y-6">
            <div className="inline-flex rounded-full border border-border bg-card/80 px-4 py-2 text-sm text-muted-foreground backdrop-blur">
              优先级顺序：产品结构正确 → 数据模型正确 → MVP 可运行 → UI 体验好
            </div>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-5xl font-semibold leading-tight tracking-tight text-balance sm:text-6xl">
                别再靠 Excel、备忘录和碎片邮件同时维护你的求职进度。
              </h1>
              <p className="max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
                JobFlow 帮你把岗位申请、截止日期、材料版本、面试流程与风险提醒收进一个产品化看板。先把流程管理做好，再自然长出 AI 和自动化。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href={session?.user ? "/dashboard" : "/sign-up"}>
                  {session?.user ? "进入 Dashboard" : "创建账户"}
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/applications">先看产品骨架</Link>
              </Button>
            </div>
          </div>

          <Card className="bg-card/86">
            <div className="space-y-5">
              <div>
                <p className="text-sm text-muted-foreground">MVP 先交付这些能力</p>
                <CardTitle className="mt-2 text-2xl">把日常求职管理跑顺</CardTitle>
              </div>
              <div className="grid gap-3">
                {[
                  "注册 / 登录 / 登出",
                  "Application CRUD",
                  "状态看板拖拽",
                  "Dashboard 总览",
                  "搜索 / 筛选 / 排序",
                  "响应式 UI",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-border bg-muted/60 px-4 py-3 text-sm"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </section>

        <section className="grid gap-4 pb-20 md:grid-cols-2 xl:grid-cols-4">
          {featureCards.map((item) => (
            <Card key={item.title} className="bg-card/82">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                <item.icon className="size-5" />
              </div>
              <CardTitle className="mt-5 text-xl">{item.title}</CardTitle>
              <CardDescription className="mt-2 leading-7">
                {item.description}
              </CardDescription>
            </Card>
          ))}
        </section>
      </div>
    </div>
  );
}
