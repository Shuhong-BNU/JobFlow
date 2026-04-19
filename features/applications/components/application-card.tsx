import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  applicationPriorityLabels,
  applicationSourceLabels,
  applicationStatusMeta,
  employmentTypeLabels,
  priorityToneMap,
} from "@/lib/labels";
import { cn, describeDeadline, formatDate } from "@/lib/utils";
import type { ApplicationListItem } from "@/features/applications/types";

export function ApplicationCard({
  application,
  dragging = false,
}: {
  application: ApplicationListItem;
  dragging?: boolean;
}) {
  return (
    <Link
      href={`/applications/${application.id}`}
      className={cn(
        "block rounded-[24px] border border-border bg-card px-5 py-5 shadow-sm transition-transform transition-colors hover:-translate-y-0.5 hover:bg-card/90",
        dragging && "rotate-1 shadow-lg",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <p className="text-sm text-muted-foreground">{application.companyName}</p>
          <h3 className="text-base font-semibold leading-7">{application.title}</h3>
        </div>
        <span
          className={cn(
            "status-dot mt-1 shrink-0",
            applicationStatusMeta[application.currentStatus].color,
          )}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge>{applicationStatusMeta[application.currentStatus].label}</Badge>
        <Badge variant="outline" className={priorityToneMap[application.priority]}>
          {applicationPriorityLabels[application.priority]}优先级
        </Badge>
        <Badge variant="outline">{employmentTypeLabels[application.employmentType]}</Badge>
        <Badge variant="outline">{applicationSourceLabels[application.source]}</Badge>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
        <div className="flex items-center gap-2">
          <MapPin className="size-3.5 shrink-0" />
          <span>{application.location || "地点未填写"}</span>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="size-3.5 shrink-0" />
          <span>
            {application.deadlineAt
              ? `${describeDeadline(application.deadlineAt)} · ${formatDate(application.deadlineAt)}`
              : "截止日期未填写"}
          </span>
        </div>
      </div>
    </Link>
  );
}
