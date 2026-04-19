import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { Card } from "@/components/ui/card";
import type { CalendarEventItem } from "@/features/events/types";
import { eventTypeLabels } from "@/lib/labels";
import { cn } from "@/lib/utils";

const weekLabels = ["一", "二", "三", "四", "五", "六", "日"];

export function CalendarMonthView({
  month,
  selectedDay,
  events,
  dayHrefBuilder,
}: {
  month: Date;
  selectedDay: Date;
  events: CalendarEventItem[];
  dayHrefBuilder: (day: Date) => string;
}) {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  });

  return (
    <Card className="bg-card/86">
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-muted-foreground">
        {weekLabels.map((label) => (
          <div key={label} className="py-1">
            周{label}
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-7 gap-2">
        {days.map((day) => {
          const dayEvents = events.filter((event) => event.startsAt && isSameDay(event.startsAt, day));
          return (
            <a
              key={day.toISOString()}
              href={dayHrefBuilder(day)}
              className={cn(
                "min-h-28 rounded-[24px] border px-3 py-3 transition hover:border-primary/40 hover:bg-muted/45",
                isSameDay(day, selectedDay)
                  ? "border-primary bg-primary/5"
                  : "border-border bg-muted/35",
                !isSameMonth(day, month) && "opacity-45",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">{format(day, "d")}</span>
                {dayEvents.length > 0 ? (
                  <span className="text-[11px] text-muted-foreground">
                    {dayEvents.length} 项
                  </span>
                ) : null}
              </div>

              <div className="mt-3 space-y-2">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="rounded-2xl bg-card px-2 py-1.5 text-left text-[11px] shadow-sm"
                  >
                    <p className="truncate font-medium">{event.title}</p>
                    <p className="mt-1 truncate text-muted-foreground">
                      {eventTypeLabels[event.eventType]}
                    </p>
                  </div>
                ))}

                {dayEvents.length > 3 ? (
                  <p className="text-[11px] text-muted-foreground">
                    还有 {dayEvents.length - 3} 项
                  </p>
                ) : null}
              </div>
            </a>
          );
        })}
      </div>
    </Card>
  );
}
