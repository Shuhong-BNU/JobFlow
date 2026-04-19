import Link from "next/link";
import { addMonths, format, isSameDay, parseISO, startOfMonth } from "date-fns";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { listApplicationOptions } from "@/features/applications/server/queries";
import { CalendarMonthView } from "@/features/events/components/calendar-month-view";
import { EventForm } from "@/features/events/components/event-form";
import { createEventAction, deleteEventAction, updateEventAction } from "@/features/events/server/actions";
import { listCalendarEvents } from "@/features/events/server/queries";
import { eventStatuses, eventTypes } from "@/lib/constants";
import { eventStatusLabels, eventTypeLabels } from "@/lib/labels";
import { formatDateTime } from "@/lib/utils";
import { requireUser } from "@/server/permissions";

type CalendarPageProps = {
  searchParams: Promise<{
    month?: string;
    day?: string;
    eventType?: string;
    status?: string;
    event?: string;
  }>;
};

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const user = await requireUser();
  const params = await searchParams;
  const month = params.month ? parseMonth(params.month) : startOfMonth(new Date());
  const day = params.day ? parseDay(params.day) : month;
  const eventType =
    typeof params.eventType === "string" && eventTypes.includes(params.eventType as never)
      ? (params.eventType as (typeof eventTypes)[number])
      : "all";
  const status =
    typeof params.status === "string" && eventStatuses.includes(params.status as never)
      ? (params.status as (typeof eventStatuses)[number])
      : "all";

  const [events, applications] = await Promise.all([
    listCalendarEvents(user.id, {
      month,
      eventType,
      status,
    }),
    listApplicationOptions(user.id),
  ]);

  const selectedDayEvents = events.filter((event) => event.startsAt && isSameDay(event.startsAt, day));
  const selectedEvent = events.find((event) => event.id === params.event) ?? null;

  const buildQuery = (overrides: Record<string, string | null | undefined>) => {
    const query = new URLSearchParams();
    query.set("month", format(month, "yyyy-MM"));
    query.set("day", format(day, "yyyy-MM-dd"));
    if (eventType !== "all") {
      query.set("eventType", eventType);
    }
    if (status !== "all") {
      query.set("status", status);
    }

    for (const [key, value] of Object.entries(overrides)) {
      if (!value) {
        query.delete(key);
      } else {
        query.set(key, value);
      }
    }

    return `/calendar?${query.toString()}`;
  };

  return (
    <>
      <PageHeader
        eyebrow="Phase 2"
        title="Calendar"
        description="这里按月展示 application events，并允许直接维护面试、跟进、提醒和 Offer 回复事件。deadline 事件继续由岗位 deadline 自动同步。"
        actions={
          <>
            <Button asChild variant="outline">
              <a
                href={buildQuery({
                  month: format(addMonths(month, -1), "yyyy-MM"),
                  day: format(addMonths(month, -1), "yyyy-MM-01"),
                  event: null,
                })}
              >
                上个月
              </a>
            </Button>
            <Button asChild variant="outline">
              <a
                href={buildQuery({
                  month: format(addMonths(month, 1), "yyyy-MM"),
                  day: format(addMonths(month, 1), "yyyy-MM-01"),
                  event: null,
                })}
              >
                下个月
              </a>
            </Button>
          </>
        }
      />

      <Card className="bg-card/86">
        <CardTitle>筛选</CardTitle>
        <CardDescription className="mt-2">
          Calendar 与 Dashboard 的 upcoming events 共用同一张 `application_events` 表，口径保持一致。
        </CardDescription>
        <form className="mt-6 grid gap-4 md:grid-cols-4">
          <input type="hidden" name="month" value={format(month, "yyyy-MM")} />
          <input type="hidden" name="day" value={format(day, "yyyy-MM-dd")} />
          <div className="space-y-2">
            <label className="text-sm font-medium">事件类型</label>
            <Select name="eventType" defaultValue={eventType}>
              <option value="all">全部</option>
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {eventTypeLabels[type]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">事件状态</label>
            <Select name="status" defaultValue={status}>
              <option value="all">全部</option>
              {eventStatuses.map((item) => (
                <option key={item} value={item}>
                  {eventStatusLabels[item]}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-end gap-3">
            <Button type="submit">应用筛选</Button>
            <Button asChild type="button" variant="ghost">
              <Link href={`/calendar?month=${format(month, "yyyy-MM")}&day=${format(day, "yyyy-MM-dd")}`}>
                清空
              </Link>
            </Button>
          </div>
        </form>
      </Card>

      <CalendarMonthView
        month={month}
        selectedDay={day}
        events={events}
        dayHrefBuilder={(nextDay) => buildQuery({ day: format(nextDay, "yyyy-MM-dd"), event: null })}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <Card className="bg-card/86">
          <CardTitle>{format(day, "yyyy-MM-dd")} 的事件</CardTitle>
          <CardDescription className="mt-2">
            点击某条事件可进入编辑。deadline 事件只读，并跳转到岗位详情中修改。
          </CardDescription>

          <div className="mt-6 space-y-3">
            {selectedDayEvents.length > 0 ? (
              selectedDayEvents.map((event) => (
                <div
                  key={event.id}
                  className="rounded-[24px] border border-border bg-muted/55 px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                          {eventTypeLabels[event.eventType]}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {eventStatusLabels[event.status]}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(event.startsAt)}
                      </p>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {event.description ?? "暂无补充说明。"}
                      </p>
                      <Link
                        href={`/applications/${event.applicationId}`}
                        className="text-sm text-primary hover:underline"
                      >
                        查看岗位：{event.companyName} / {event.applicationTitle}
                      </Link>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {event.eventType === "deadline" ? (
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/applications/${event.applicationId}/edit`}>编辑 deadline</Link>
                        </Button>
                      ) : (
                        <>
                          <Button asChild variant="outline" size="sm">
                            <a href={buildQuery({ event: event.id })}>编辑</a>
                          </Button>
                          <form action={deleteEventAction}>
                            <input type="hidden" name="eventId" value={event.id} />
                            <input type="hidden" name="applicationId" value={event.applicationId} />
                            <input type="hidden" name="redirectTo" value={buildQuery({ event: null })} />
                            <Button type="submit" variant="ghost" size="sm">
                              删除
                            </Button>
                          </form>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                这一天还没有事件。你可以在右侧直接补一条面试、提醒或跟进记录。
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <EventForm
            title="新增事件"
            description="从 Calendar 直接补全 OA、面试、跟进或 Offer 回复。"
            action={createEventAction}
            applications={applications}
            redirectTo={buildQuery({ event: null })}
            defaultValues={{
              startsAt: parseISO(`${format(day, "yyyy-MM-dd")}T09:00:00`) as never,
            }}
            submitLabel="创建事件"
          />

          {selectedEvent ? (
            selectedEvent.eventType === "deadline" ? (
              <Card className="bg-card/86">
                <CardTitle>deadline 事件只读</CardTitle>
                <CardDescription className="mt-2">
                  这个事件来自岗位详情中的截止日期字段。请前往岗位编辑页修改。
                </CardDescription>
              </Card>
            ) : (
              <EventForm
                title="编辑事件"
                description="编辑后，Calendar / Dashboard / Detail 会同步刷新。"
                action={updateEventAction.bind(null, selectedEvent.id)}
                applications={applications}
                redirectTo={buildQuery({ event: null })}
                defaultValues={{
                  applicationId: selectedEvent.applicationId,
                  eventType: selectedEvent.eventType as never,
                  title: selectedEvent.title,
                  description: selectedEvent.description ?? "",
                  startsAt: selectedEvent.startsAt as never,
                  endsAt: selectedEvent.endsAt as never,
                  reminderAt: selectedEvent.reminderAt as never,
                  status: selectedEvent.status,
                }}
                submitLabel="更新事件"
              />
            )
          ) : null}
        </div>
      </div>
    </>
  );
}

function parseMonth(value: string) {
  return startOfMonth(parseISO(`${value}-01`));
}

function parseDay(value: string) {
  return parseISO(value);
}
