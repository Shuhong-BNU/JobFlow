import Link from "next/link";
import { Search } from "lucide-react";
import { applicationPriorities, applicationStatuses } from "@/lib/constants";
import {
  applicationPriorityLabels,
  applicationSortLabels,
  applicationStatusLabels,
} from "@/lib/labels";
import type { ApplicationListFilter } from "@/features/applications/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function ApplicationFilters({
  filters,
}: {
  filters: ApplicationListFilter;
}) {
  return (
    <form className="surface-soft grid gap-3 rounded-[28px] px-4 py-4 lg:grid-cols-[minmax(0,1.2fr)_180px_180px_180px_auto]">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="query"
          defaultValue={filters.query ?? ""}
          placeholder="搜索公司名或岗位名"
          className="pl-11"
        />
      </div>
      <Select name="status" defaultValue={filters.status ?? "all"}>
        <option value="all">全部状态</option>
        {applicationStatuses.map((status) => (
          <option key={status} value={status}>
            {applicationStatusLabels[status]}
          </option>
        ))}
      </Select>
      <Select name="priority" defaultValue={filters.priority ?? "all"}>
        <option value="all">全部优先级</option>
        {applicationPriorities.map((priority) => (
          <option key={priority} value={priority}>
            {applicationPriorityLabels[priority]}
          </option>
        ))}
      </Select>
      <Select name="sort" defaultValue={filters.sort ?? "deadline_asc"}>
        {Object.entries(applicationSortLabels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>
      <div className="flex gap-2">
        <Button type="submit" variant="secondary" className="flex-1">
          应用筛选
        </Button>
        <Button asChild type="button" variant="ghost" className="flex-1">
          <Link href="/applications">重置</Link>
        </Button>
      </div>
    </form>
  );
}
