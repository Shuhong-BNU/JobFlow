"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { applicationEvents, applications } from "@/db/schema";
import {
  eventFormSchema,
  mapEventFormData,
  mapEventFormToDbInput,
  type EventFormActionState,
} from "@/features/events/schema";
import { measureServerOperation } from "@/lib/server/logger";
import { requireUser } from "@/server/permissions";

function revalidateEventPaths(applicationId: string, redirectTo: string) {
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  revalidatePath("/applications");
  revalidatePath(`/applications/${applicationId}`);
  if (redirectTo.startsWith("/applications/")) {
    revalidatePath(redirectTo);
  }
}

function getFallbackRedirect(applicationId: string) {
  return `/applications/${applicationId}`;
}

export async function createEventAction(
  _prevState: EventFormActionState,
  formData: FormData,
): Promise<EventFormActionState> {
  const user = await requireUser();
  const parsed = eventFormSchema.safeParse(mapEventFormData(formData));

  if (!parsed.success) {
    return {
      error: "请先修正事件表单内容。",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const input = mapEventFormToDbInput(parsed.data);
  const db = getDb();

  const [application] = await db
    .select({ id: applications.id })
    .from(applications)
    .where(and(eq(applications.id, input.applicationId), eq(applications.userId, user.id)))
    .limit(1);

  if (!application) {
    return {
      error: "找不到对应的岗位申请，无法创建事件。",
    };
  }

  await measureServerOperation(
    "events.create",
    {
      userId: user.id,
      applicationId: input.applicationId,
      eventType: input.eventType,
    },
    async () => {
      await db.insert(applicationEvents).values({
        userId: user.id,
        applicationId: input.applicationId,
        eventType: input.eventType,
        title: input.title,
        description: input.description,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        reminderAt: input.reminderAt,
        status: input.status,
      });
    },
  );

  const redirectTo = input.redirectTo ?? getFallbackRedirect(input.applicationId);
  revalidateEventPaths(input.applicationId, redirectTo);
  redirect(redirectTo);
}

export async function updateEventAction(
  eventId: string,
  _prevState: EventFormActionState,
  formData: FormData,
): Promise<EventFormActionState> {
  const user = await requireUser();
  const parsed = eventFormSchema.safeParse(mapEventFormData(formData));

  if (!parsed.success) {
    return {
      error: "请先修正事件表单内容。",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const input = mapEventFormToDbInput(parsed.data);
  const db = getDb();

  const [eventRecord] = await db
    .select({
      id: applicationEvents.id,
      applicationId: applicationEvents.applicationId,
      eventType: applicationEvents.eventType,
    })
    .from(applicationEvents)
    .where(and(eq(applicationEvents.id, eventId), eq(applicationEvents.userId, user.id)))
    .limit(1);

  if (!eventRecord) {
    return {
      error: "事件不存在，或你没有权限编辑。",
    };
  }

  if (eventRecord.eventType === "deadline") {
    return {
      error: "截止日期事件由岗位 deadline 自动同步，不能直接编辑。",
    };
  }

  if (eventRecord.applicationId !== input.applicationId) {
    return {
      error: "事件与岗位申请不匹配，无法更新。",
    };
  }

  await measureServerOperation(
    "events.update",
    {
      userId: user.id,
      applicationId: input.applicationId,
      eventId,
      eventType: input.eventType,
    },
    async () => {
      await db
        .update(applicationEvents)
        .set({
          eventType: input.eventType,
          title: input.title,
          description: input.description,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          reminderAt: input.reminderAt,
          status: input.status,
          updatedAt: new Date(),
        })
        .where(eq(applicationEvents.id, eventId));
    },
  );

  const redirectTo = input.redirectTo ?? getFallbackRedirect(input.applicationId);
  revalidateEventPaths(input.applicationId, redirectTo);
  redirect(redirectTo);
}

export async function deleteEventAction(formData: FormData) {
  const user = await requireUser();
  const eventId = String(formData.get("eventId") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "");
  const applicationId = String(formData.get("applicationId") ?? "");

  if (!eventId || !applicationId) {
    redirect(redirectTo || "/calendar");
  }

  const db = getDb();
  const [eventRecord] = await db
    .select({
      id: applicationEvents.id,
      eventType: applicationEvents.eventType,
    })
    .from(applicationEvents)
    .where(and(eq(applicationEvents.id, eventId), eq(applicationEvents.userId, user.id)))
    .limit(1);

  if (eventRecord?.eventType === "deadline") {
    redirect(redirectTo || getFallbackRedirect(applicationId));
  }

  await measureServerOperation(
    "events.delete",
    { userId: user.id, applicationId, eventId },
    async () => {
      await db
        .delete(applicationEvents)
        .where(and(eq(applicationEvents.id, eventId), eq(applicationEvents.userId, user.id)));
    },
  );

  const target = redirectTo || getFallbackRedirect(applicationId);
  revalidateEventPaths(applicationId, target);
  redirect(target);
}
