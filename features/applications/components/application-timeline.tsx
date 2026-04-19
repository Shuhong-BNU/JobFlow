import Link from "next/link";
import { PencilLine, Trash2 } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApplicationNoteForm } from "@/features/applications/components/application-note-form";
import {
  createApplicationNoteAction,
  deleteApplicationNoteAction,
  updateApplicationNoteAction,
} from "@/features/applications/server/actions";
import type { ApplicationDetail, ApplicationOption } from "@/features/applications/types";
import { EventForm } from "@/features/events/components/event-form";
import { createEventAction, deleteEventAction, updateEventAction } from "@/features/events/server/actions";
import { eventTypeLabels, noteTypeLabels } from "@/lib/labels";
import { formatDateTime } from "@/lib/utils";

type TimelineEntry =
  | {
      kind: "event";
      id: string;
      sortAt: Date;
      title: string;
      meta: string;
      body: string | null;
      isReadOnly: boolean;
      item: ApplicationDetail["events"][number];
    }
  | {
      kind: "note";
      id: string;
      sortAt: Date;
      title: string;
      meta: string;
      body: string;
      isReadOnly: false;
      item: ApplicationDetail["detailNotes"][number];
    };

export function ApplicationTimeline({
  detail,
  selectedEventId,
  selectedNoteId,
}: {
  detail: ApplicationDetail;
  selectedEventId?: string;
  selectedNoteId?: string;
}) {
  const redirectTo = `/applications/${detail.id}`;
  const applicationOptions: ApplicationOption[] = [
    {
      id: detail.id,
      companyName: detail.companyName,
      title: detail.title,
      currentStatus: detail.currentStatus,
    },
  ];

  const selectedEvent = detail.events.find((event) => event.id === selectedEventId) ?? null;
  const selectedNote = detail.detailNotes.find((note) => note.id === selectedNoteId) ?? null;
  const timelineEntries = buildTimelineEntries(detail);

  return (
    <div id="timeline" className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
      <Card className="bg-card/86">
        <CardTitle>Timeline</CardTitle>
        <CardDescription className="mt-2">
          这里把事件与笔记放到同一条时间线上，方便追踪每个岗位从投递到 Offer 的完整过程。
        </CardDescription>

        <div className="mt-6 space-y-3">
          {timelineEntries.length > 0 ? (
            timelineEntries.map((entry) => (
              <div
                key={`${entry.kind}-${entry.id}`}
                className="rounded-[24px] border border-border bg-muted/55 px-4 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                        {entry.kind === "event" ? "事件" : "笔记"}
                      </span>
                      <span className="text-xs text-muted-foreground">{entry.meta}</span>
                      {entry.kind === "event" && entry.isReadOnly ? (
                        <span className="text-xs text-amber-600 dark:text-amber-300">
                          自动同步，不能直接编辑
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm font-medium">{entry.title}</p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {entry.body || "暂无补充说明。"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {entry.kind === "event" ? (
                      entry.isReadOnly ? (
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/applications/${detail.id}/edit`}>去修改 deadline</Link>
                        </Button>
                      ) : (
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/applications/${detail.id}?event=${entry.id}#timeline`}>
                            <PencilLine className="mr-2 size-4" />
                            编辑事件
                          </Link>
                        </Button>
                      )
                    ) : (
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/applications/${detail.id}?note=${entry.id}#timeline`}>
                          <PencilLine className="mr-2 size-4" />
                          编辑笔记
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[24px] border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
              还没有时间线记录。你可以先补一条面试事件或跟进笔记，让岗位详情开始沉淀过程信息。
            </div>
          )}
        </div>
      </Card>

      <div className="space-y-4">
        <EventForm
          title="新增事件"
          description="录入面试、跟进、提醒或 Offer 回复等关键节点。"
          action={createEventAction}
          applications={applicationOptions}
          fixedApplicationId={detail.id}
          redirectTo={redirectTo}
          defaultValues={{ startsAt: new Date() as unknown as string }}
          submitLabel="保存事件"
        />

        {selectedEvent ? (
          selectedEvent.eventType === "deadline" ? (
            <Card className="bg-card/86">
              <CardTitle>截止日期事件只读</CardTitle>
              <CardDescription className="mt-2">
                当前 deadline 事件来自 `applications.deadline_at` 自动同步。若要调整它，请直接编辑岗位信息里的截止日期字段。
              </CardDescription>
            </Card>
          ) : (
            <Card className="bg-card/86">
              <div className="space-y-3">
                <div>
                  <CardTitle>编辑事件</CardTitle>
                  <CardDescription className="mt-2">
                    修改事件后，Calendar 与 Dashboard 的近期事件会同步刷新。
                  </CardDescription>
                </div>
                <EventForm
                  title="事件编辑"
                  description="更新事件标题、时间与状态。"
                  action={updateEventAction.bind(null, selectedEvent.id)}
                  applications={applicationOptions}
                  fixedApplicationId={detail.id}
                  redirectTo={redirectTo}
                  defaultValues={{
                    applicationId: detail.id,
                    eventType: selectedEvent.eventType as Exclude<
                      ApplicationDetail["events"][number]["eventType"],
                      "deadline"
                    >,
                    title: selectedEvent.title,
                    description: selectedEvent.description ?? "",
                    startsAt: selectedEvent.startsAt as unknown as string,
                    endsAt: selectedEvent.endsAt as unknown as string,
                    reminderAt: selectedEvent.reminderAt as unknown as string,
                    status: selectedEvent.status,
                  }}
                  submitLabel="更新事件"
                />
                <form action={deleteEventAction}>
                  <input type="hidden" name="eventId" value={selectedEvent.id} />
                  <input type="hidden" name="applicationId" value={detail.id} />
                  <input type="hidden" name="redirectTo" value={redirectTo} />
                  <Button type="submit" variant="destructive">
                    <Trash2 className="mr-2 size-4" />
                    删除事件
                  </Button>
                </form>
              </div>
            </Card>
          )
        ) : null}

        <ApplicationNoteForm
          title="新增笔记"
          description="适合补面试反馈、跟进记录、风险判断。"
          action={createApplicationNoteAction}
          applicationId={detail.id}
          redirectTo={redirectTo}
          submitLabel="保存笔记"
        />

        {selectedNote ? (
          <Card className="bg-card/86">
            <div className="space-y-3">
              <div>
                <CardTitle>编辑笔记</CardTitle>
                <CardDescription className="mt-2">
                  修改后会立即回写到当前岗位详情，适合持续维护复盘记录。
                </CardDescription>
              </div>
              <ApplicationNoteForm
                title="笔记编辑"
                description="更新内容或切换笔记类型。"
                action={updateApplicationNoteAction.bind(null, selectedNote.id)}
                applicationId={detail.id}
                redirectTo={redirectTo}
                defaultValues={{
                  applicationId: detail.id,
                  noteType: selectedNote.noteType,
                  content: selectedNote.content,
                }}
                submitLabel="更新笔记"
              />
              <form action={deleteApplicationNoteAction}>
                <input type="hidden" name="noteId" value={selectedNote.id} />
                <input type="hidden" name="applicationId" value={detail.id} />
                <input type="hidden" name="redirectTo" value={redirectTo} />
                <Button type="submit" variant="destructive">
                  <Trash2 className="mr-2 size-4" />
                  删除笔记
                </Button>
              </form>
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function buildTimelineEntries(detail: ApplicationDetail): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    ...detail.events.map((event) => ({
      kind: "event" as const,
      id: event.id,
      sortAt: event.startsAt ?? event.createdAt,
      title: event.title,
      meta: `${eventTypeLabels[event.eventType]} · ${formatDateTime(event.startsAt)}`,
      body: event.description,
      isReadOnly: event.eventType === "deadline",
      item: event,
    })),
    ...detail.detailNotes.map((note) => ({
      kind: "note" as const,
      id: note.id,
      sortAt: note.updatedAt ?? note.createdAt,
      title: noteTypeLabels[note.noteType],
      meta: `笔记 · ${formatDateTime(note.updatedAt ?? note.createdAt)}`,
      body: note.content,
      isReadOnly: false as const,
      item: note,
    })),
  ];

  return entries.sort((left, right) => right.sortAt.getTime() - left.sortAt.getTime());
}
