"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { applicationStatuses, type ApplicationStatus } from "@/lib/constants";
import { applicationStatusMeta } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { moveApplicationStatusAction } from "@/features/applications/server/actions";
import type { ApplicationListItem } from "@/features/applications/types";
import { ApplicationCard } from "@/features/applications/components/application-card";

export function ApplicationBoard({
  applications,
}: {
  applications: ApplicationListItem[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(applications);
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const activeApplication = useMemo(
    () => items.find((item) => item.id === activeId) ?? null,
    [activeId, items],
  );

  const itemsByStatus = useMemo(() => {
    return applicationStatuses.reduce<Record<ApplicationStatus, ApplicationListItem[]>>(
      (acc, status) => {
        acc[status] = items.filter((item) => item.currentStatus === status);
        return acc;
      },
      {} as Record<ApplicationStatus, ApplicationListItem[]>,
    );
  }, [items]);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const overStatus = event.over?.id as ApplicationStatus | undefined;
    const applicationId = String(event.active.id);

    if (!overStatus) {
      return;
    }

    const currentApplication = items.find((item) => item.id === applicationId);

    if (!currentApplication || currentApplication.currentStatus === overStatus) {
      return;
    }

    const previousItems = items;
    const nextItems = items.map((item) =>
      item.id === applicationId ? { ...item, currentStatus: overStatus } : item,
    );

    setItems(nextItems);

    startTransition(async () => {
      const result = await moveApplicationStatusAction({
        applicationId,
        status: overStatus,
      });

      if (!result.ok) {
        setItems(previousItems);
        return;
      }

      router.refresh();
    });
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-5">
        {applicationStatuses.map((status) => (
          <BoardSection key={status} status={status} items={itemsByStatus[status]} />
        ))}
      </div>

      <DragOverlay>
        {activeApplication ? <ApplicationCard application={activeApplication} dragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function BoardSection({
  status,
  items,
}: {
  status: ApplicationStatus;
  items: ApplicationListItem[];
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: status,
  });
  const meta = applicationStatusMeta[status];

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "surface-soft rounded-[28px] px-5 py-5",
        isOver && "ring-2 ring-primary/30",
      )}
    >
      <div className="flex flex-col gap-3 border-b border-border/70 pb-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <span className={cn("status-dot mt-1 shrink-0", meta.color)} />
          <div className="space-y-1">
            <h3 className="text-base font-semibold">{meta.label}</h3>
            <p className="text-sm leading-6 text-muted-foreground">{meta.description}</p>
          </div>
        </div>
        <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-muted px-3 text-sm font-medium text-muted-foreground">
          {items.length}
        </span>
      </div>

      <div className="mt-4">
        {items.length > 0 ? (
          <div className="grid gap-3 xl:grid-cols-2">
            {items.map((application) => (
              <DraggableApplicationCard key={application.id} application={application} />
            ))}
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-border/80 px-4 py-6 text-sm text-muted-foreground">
            将申请拖到这个分区，保持流程推进清晰可读。
          </div>
        )}
      </div>
    </section>
  );
}

function DraggableApplicationCard({
  application,
}: {
  application: ApplicationListItem;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: application.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(isDragging && "opacity-40")}
      {...listeners}
      {...attributes}
    >
      <ApplicationCard application={application} />
    </div>
  );
}
