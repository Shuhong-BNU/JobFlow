import type { ApplicationStatus, EventStatus, EventType } from "@/lib/constants";

export type CalendarEventFilter = {
  month: Date;
  eventType?: EventType | "all";
  status?: EventStatus | "all";
};

export type CalendarEventItem = {
  id: string;
  applicationId: string;
  companyName: string;
  applicationTitle: string;
  currentStatus: ApplicationStatus;
  eventType: EventType;
  title: string;
  description: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  reminderAt: Date | null;
  status: EventStatus;
  createdAt: Date;
  updatedAt: Date;
};
