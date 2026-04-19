import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ApplicationBoard } from "@/features/applications/components/application-board";
import { ApplicationFilters } from "@/features/applications/components/application-filters";
import { listApplications } from "@/features/applications/server/queries";
import type { ApplicationListFilter } from "@/features/applications/types";
import { requireUser } from "@/server/permissions";

type ApplicationsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ApplicationsPage({
  searchParams,
}: ApplicationsPageProps) {
  const user = await requireUser();
  const resolvedSearchParams = await searchParams;

  const filters: ApplicationListFilter = {
    query:
      typeof resolvedSearchParams.query === "string"
        ? resolvedSearchParams.query
        : undefined,
    status:
      typeof resolvedSearchParams.status === "string"
        ? (resolvedSearchParams.status as ApplicationListFilter["status"])
        : "all",
    priority:
      typeof resolvedSearchParams.priority === "string"
        ? (resolvedSearchParams.priority as ApplicationListFilter["priority"])
        : "all",
    sort:
      typeof resolvedSearchParams.sort === "string"
        ? (resolvedSearchParams.sort as ApplicationListFilter["sort"])
        : "deadline_asc",
  };

  const applications = await listApplications(user.id, filters);

  return (
    <>
      <PageHeader
        eyebrow="Applications"
        title="申请管理"
        description="按纵向分区查看每个阶段的岗位，先筛选、再阅读、再拖拽推进状态，信息会更适合中文求职场景。"
        actions={
          <Button asChild>
            <Link href="/applications/new">
              <PlusCircle className="mr-2 size-4" />
              新建申请
            </Link>
          </Button>
        }
      />

      <ApplicationFilters filters={filters} />

      {applications.length > 0 ? (
        <ApplicationBoard applications={applications} />
      ) : (
        <EmptyState
          title="没有可显示的申请"
          description="你可以先新建第一条申请，或者清空筛选条件重新查看全部岗位。"
          action={
            <Button asChild>
              <Link href="/applications/new">录入第一条申请</Link>
            </Button>
          }
        />
      )}
    </>
  );
}
