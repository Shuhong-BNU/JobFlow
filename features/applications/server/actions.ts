"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db";
import { applicationEvents, applicationNotes, applications, companies } from "@/db/schema";
import {
  mapNoteFormData,
  mapNoteFormToDbInput,
  noteFormSchema,
  type NoteFormActionState,
} from "@/features/applications/note-schema";
import {
  applicationFormSchema,
  mapApplicationFormData,
  mapApplicationFormToDbInput,
  type ApplicationFormActionState,
} from "@/features/applications/schema";
import { applicationStatuses, type ApplicationStatus } from "@/lib/constants";
import { measureServerOperation } from "@/lib/server/logger";
import { requireUser } from "@/server/permissions";

async function upsertCompany(tx: ReturnType<typeof getDb>, input: {
  userId: string;
  name: string;
  website: string | null;
  industry: string | null;
  location: string | null;
}) {
  const [existingCompany] = await tx
    .select({
      id: companies.id,
    })
    .from(companies)
    .where(and(eq(companies.userId, input.userId), eq(companies.name, input.name)))
    .limit(1);

  if (existingCompany) {
    await tx
      .update(companies)
      .set({
        website: input.website,
        industry: input.industry,
        location: input.location,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, existingCompany.id));

    return existingCompany.id;
  }

  const [company] = await tx
    .insert(companies)
    .values({
      userId: input.userId,
      name: input.name,
      website: input.website,
      industry: input.industry,
      location: input.location,
    })
    .returning({
      id: companies.id,
    });

  return company.id;
}

async function syncDeadlineEvent(
  tx: ReturnType<typeof getDb>,
  params: {
    userId: string;
    applicationId: string;
    deadlineAt: Date | null;
    companyName: string;
    title: string;
  },
) {
  const [existingDeadline] = await tx
    .select({
      id: applicationEvents.id,
    })
    .from(applicationEvents)
    .where(
      and(
        eq(applicationEvents.applicationId, params.applicationId),
        eq(applicationEvents.userId, params.userId),
        eq(applicationEvents.eventType, "deadline"),
      ),
    )
    .limit(1);

  if (!params.deadlineAt) {
    if (existingDeadline) {
      await tx.delete(applicationEvents).where(eq(applicationEvents.id, existingDeadline.id));
    }

    return;
  }

  const payload = {
    userId: params.userId,
    applicationId: params.applicationId,
    eventType: "deadline" as const,
    title: `${params.companyName} · ${params.title} 截止日期`,
    description: "由申请表单自动同步的截止日期提醒。",
    startsAt: params.deadlineAt,
    reminderAt: params.deadlineAt,
    status: "scheduled" as const,
    updatedAt: new Date(),
  };

  if (existingDeadline) {
    await tx
      .update(applicationEvents)
      .set(payload)
      .where(eq(applicationEvents.id, existingDeadline.id));
  } else {
    await tx.insert(applicationEvents).values(payload);
  }
}

function revalidateApplicationPaths(applicationId?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/applications");
  revalidatePath("/calendar");
  revalidatePath("/offers");
  revalidatePath("/analytics");
  revalidatePath("/materials");
  if (applicationId) {
    revalidatePath(`/applications/${applicationId}`);
    revalidatePath(`/applications/${applicationId}/edit`);
  }
}

export async function createApplicationAction(
  _prevState: ApplicationFormActionState,
  formData: FormData,
): Promise<ApplicationFormActionState> {
  const user = await requireUser();
  const formValues = mapApplicationFormData(formData);
  const parsed = applicationFormSchema.safeParse(formValues);

  if (!parsed.success) {
    return {
      error: "请先修正表单内容。",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const input = mapApplicationFormToDbInput(parsed.data);

  const application = await measureServerOperation(
    "applications.create",
    {
      userId: user.id,
      companyName: input.companyName,
      title: input.title,
      currentStatus: input.currentStatus,
    },
    async () => {
      const db = getDb();

      return db.transaction(async (tx) => {
        const companyId = await upsertCompany(tx, {
          userId: user.id,
          name: input.companyName,
          website: input.companyWebsite,
          industry: input.companyIndustry,
          location: input.companyLocation,
        });

        const [createdApplication] = await tx
          .insert(applications)
          .values({
            userId: user.id,
            companyId,
            title: input.title,
            department: input.department,
            location: input.location,
            source: input.source,
            sourceUrl: input.sourceUrl,
            employmentType: input.employmentType,
            deadlineAt: input.deadlineAt,
            appliedAt: input.appliedAt,
            currentStatus: input.currentStatus,
            priority: input.priority,
            referralName: input.referralName,
            notes: input.notes,
            salaryRange: input.salaryRange,
          })
          .returning({
            id: applications.id,
          });

        await syncDeadlineEvent(tx, {
          userId: user.id,
          applicationId: createdApplication.id,
          deadlineAt: input.deadlineAt,
          companyName: input.companyName,
          title: input.title,
        });

        return createdApplication;
      });
    },
  );

  revalidateApplicationPaths(application.id);
  redirect(`/applications/${application.id}`);
}

export async function updateApplicationAction(
  applicationId: string,
  _prevState: ApplicationFormActionState,
  formData: FormData,
): Promise<ApplicationFormActionState> {
  const user = await requireUser();
  const formValues = mapApplicationFormData(formData);
  const parsed = applicationFormSchema.safeParse(formValues);

  if (!parsed.success) {
    return {
      error: "请先修正表单内容。",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const input = mapApplicationFormToDbInput(parsed.data);

  await measureServerOperation(
    "applications.update",
    {
      userId: user.id,
      applicationId,
      companyName: input.companyName,
      title: input.title,
      currentStatus: input.currentStatus,
    },
    async () => {
      const db = getDb();

      await db.transaction(async (tx) => {
        const [existingApplication] = await tx
          .select({
            id: applications.id,
          })
          .from(applications)
          .where(and(eq(applications.id, applicationId), eq(applications.userId, user.id)))
          .limit(1);

        if (!existingApplication) {
          throw new Error("申请不存在，或你没有权限编辑。");
        }

        const companyId = await upsertCompany(tx, {
          userId: user.id,
          name: input.companyName,
          website: input.companyWebsite,
          industry: input.companyIndustry,
          location: input.companyLocation,
        });

        await tx
          .update(applications)
          .set({
            companyId,
            title: input.title,
            department: input.department,
            location: input.location,
            source: input.source,
            sourceUrl: input.sourceUrl,
            employmentType: input.employmentType,
            deadlineAt: input.deadlineAt,
            appliedAt: input.appliedAt,
            currentStatus: input.currentStatus,
            priority: input.priority,
            referralName: input.referralName,
            notes: input.notes,
            salaryRange: input.salaryRange,
            updatedAt: new Date(),
          })
          .where(eq(applications.id, applicationId));

        await syncDeadlineEvent(tx, {
          userId: user.id,
          applicationId,
          deadlineAt: input.deadlineAt,
          companyName: input.companyName,
          title: input.title,
        });
      });
    },
  );

  revalidateApplicationPaths(applicationId);
  redirect(`/applications/${applicationId}`);
}

export async function deleteApplicationAction(applicationId: string) {
  const user = await requireUser();
  await measureServerOperation(
    "applications.delete",
    { userId: user.id, applicationId },
    async () => {
      const db = getDb();
      await db
        .delete(applications)
        .where(and(eq(applications.id, applicationId), eq(applications.userId, user.id)));
    },
  );

  revalidateApplicationPaths(applicationId);
  redirect("/applications");
}

const moveStatusSchema = z.object({
  applicationId: z.string().uuid(),
  status: z.enum(applicationStatuses),
});

export async function moveApplicationStatusAction(input: {
  applicationId: string;
  status: ApplicationStatus;
}) {
  const user = await requireUser();
  const parsed = moveStatusSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: "状态更新失败。",
    };
  }

  await measureServerOperation(
    "applications.moveStatus",
    { userId: user.id, ...parsed.data },
    async () => {
      const db = getDb();

      await db
        .update(applications)
        .set({
          currentStatus: parsed.data.status,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(applications.id, parsed.data.applicationId),
            eq(applications.userId, user.id),
          ),
        );
    },
  );

  revalidateApplicationPaths(parsed.data.applicationId);

  return {
    ok: true,
  };
}

function getApplicationDetailRedirect(applicationId: string, redirectTo?: string | null) {
  return redirectTo || `/applications/${applicationId}`;
}

export async function createApplicationNoteAction(
  _prevState: NoteFormActionState,
  formData: FormData,
): Promise<NoteFormActionState> {
  const user = await requireUser();
  const parsed = noteFormSchema.safeParse(mapNoteFormData(formData));

  if (!parsed.success) {
    return {
      error: "请先修正备注表单内容。",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const input = mapNoteFormToDbInput(parsed.data);
  const db = getDb();

  const [application] = await db
    .select({ id: applications.id })
    .from(applications)
    .where(and(eq(applications.id, input.applicationId), eq(applications.userId, user.id)))
    .limit(1);

  if (!application) {
    return {
      error: "找不到对应的岗位申请，无法创建备注。",
    };
  }

  await measureServerOperation(
    "applications.notes.create",
    { userId: user.id, applicationId: input.applicationId, noteType: input.noteType },
    async () => {
      await db.insert(applicationNotes).values({
        userId: user.id,
        applicationId: input.applicationId,
        noteType: input.noteType,
        content: input.content,
      });
    },
  );

  const redirectTo = getApplicationDetailRedirect(input.applicationId, input.redirectTo);
  revalidateApplicationPaths(input.applicationId);
  redirect(redirectTo);
}

export async function updateApplicationNoteAction(
  noteId: string,
  _prevState: NoteFormActionState,
  formData: FormData,
): Promise<NoteFormActionState> {
  const user = await requireUser();
  const parsed = noteFormSchema.safeParse(mapNoteFormData(formData));

  if (!parsed.success) {
    return {
      error: "请先修正备注表单内容。",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const input = mapNoteFormToDbInput(parsed.data);
  const db = getDb();

  const [noteRecord] = await db
    .select({
      id: applicationNotes.id,
      applicationId: applicationNotes.applicationId,
    })
    .from(applicationNotes)
    .where(and(eq(applicationNotes.id, noteId), eq(applicationNotes.userId, user.id)))
    .limit(1);

  if (!noteRecord) {
    return {
      error: "备注不存在，或你没有权限编辑。",
    };
  }

  if (noteRecord.applicationId !== input.applicationId) {
    return {
      error: "备注与岗位申请不匹配，无法更新。",
    };
  }

  await measureServerOperation(
    "applications.notes.update",
    { userId: user.id, applicationId: input.applicationId, noteId, noteType: input.noteType },
    async () => {
      await db
        .update(applicationNotes)
        .set({
          noteType: input.noteType,
          content: input.content,
          updatedAt: new Date(),
        })
        .where(eq(applicationNotes.id, noteId));
    },
  );

  const redirectTo = getApplicationDetailRedirect(input.applicationId, input.redirectTo);
  revalidateApplicationPaths(input.applicationId);
  redirect(redirectTo);
}

export async function deleteApplicationNoteAction(formData: FormData) {
  const user = await requireUser();
  const noteId = String(formData.get("noteId") ?? "");
  const applicationId = String(formData.get("applicationId") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "");

  if (!noteId || !applicationId) {
    redirect(redirectTo || "/applications");
  }

  const db = getDb();
  await measureServerOperation(
    "applications.notes.delete",
    { userId: user.id, applicationId, noteId },
    async () => {
      await db
        .delete(applicationNotes)
        .where(and(eq(applicationNotes.id, noteId), eq(applicationNotes.userId, user.id)));
    },
  );

  revalidateApplicationPaths(applicationId);
  redirect(getApplicationDetailRedirect(applicationId, redirectTo));
}
