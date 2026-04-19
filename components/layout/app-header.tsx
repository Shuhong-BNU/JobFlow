import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { Button } from "@/components/ui/button";

export function AppHeader({
  userName,
}: {
  userName: string | null | undefined;
}) {
  return (
    <header className="surface-soft sticky top-4 z-20 flex flex-col gap-4 rounded-[28px] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm text-muted-foreground">欢迎回来</p>
        <h2 className="text-xl font-semibold tracking-tight">
          {userName ? `${userName}，今天先处理最关键的申请。` : "今天先处理最关键的申请。"}
        </h2>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button asChild>
          <Link href="/applications/new">
            <PlusCircle className="mr-2 size-4" />
            新建申请
          </Link>
        </Button>
        <ThemeToggle />
        <SignOutButton />
      </div>
    </header>
  );
}
