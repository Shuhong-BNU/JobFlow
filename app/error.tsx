"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("JobFlow runtime error", error);
  }, [error]);

  return (
    <div className="page-shell py-10">
      <div className="surface-soft mx-auto max-w-2xl rounded-[32px] px-6 py-8">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-amber-100 p-3 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            <AlertTriangle className="size-6" />
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Application Error</p>
              <h2 className="text-2xl font-semibold tracking-tight">页面加载时发生了服务端异常</h2>
              <p className="text-sm leading-7 text-muted-foreground">
                这通常不是数据直接丢失，而是某个服务端查询、动作或环境配置在当前请求里失败了。
                现在可以先重试；如果问题持续，请查看终端输出或
                <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">.runtime/logs/</code>
                下的运行日志。
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-muted/60 px-4 py-3 text-sm">
              <p>
                <span className="font-medium">Digest：</span>
                {error.digest ?? "未提供"}
              </p>
              <p className="mt-2 text-muted-foreground">
                建议同时记录访问页面、触发动作和出现时间，便于后续复盘。
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={() => reset()}>
                <RefreshCw className="mr-2 size-4" />
                重试当前页面
              </Button>
              <Button variant="outline" onClick={() => window.location.assign("/dashboard")}>
                返回 Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
