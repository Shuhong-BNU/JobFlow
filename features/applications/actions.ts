'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { applicationEvents, applicationNotes, applications, companies } from '@/db/schema';
import { requireUser } from '@/lib/auth-helpers';
import {
  applicationFormSchema,
  moveStatusSchema,
  type ApplicationFormInput,
} from './schema';
import { z } from 'zod';
import { EVENT_TYPES, NOTE_TYPES } from '@/lib/enums';

async function upsertCompanyByName(userId: string, name: string) {
  const trimmed = name.trim();
  const [existing] = await db
    .select()
    .from(companies)
    .where(and(eq(companies.userId, userId), eq(companies.name, trimmed)))
    .limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(companies)
    .values({ userId, name: trimmed })
    .returning();
  if (!created) throw new Error('Failed to create company');
  return created;
}

async function nextBoardOrder(userId: string, status: string) {
  const rows = await db
    .select({
      max: sql<number>`coalesce(max(${applications.boardOrder}), -1)::int`,
    })
    .from(applications)
    .where(
      and(
        eq(applications.userId, userId),
        eq(applications.currentStatus, status as never)
      )
    );
  const max = rows[0]?.max ?? -1;
  return max + 1;
}

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function createApplication(
  input: ApplicationFormInput
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = applicationFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'invalidInput',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const v = parsed.data;
  const company = await upsertCompanyByName(user.id, v.companyName);
  const order = await nextBoardOrder(user.id, v.currentStatus);

  const [created] = await db
    .insert(applications)
    .values({
      userId: user.id,
      companyId: company.id,
      title: v.title,
      department: v.department,
      location: v.location,
      source: v.source,
      sourceUrl: v.sourceUrl,
      employmentType: v.employmentType,
      currentStatus: v.currentStatus,
      priority: v.priority,
      deadlineAt: v.deadlineAt,
      appliedAt: v.appliedAt,
      salaryRange: v.salaryRange,
      referralName: v.referralName,
      notes: v.notes,
      boardOrder: order,
    })
    .returning({ id: applications.id });

  revalidatePath('/app');
  revalidatePath('/app/board');
  revalidatePath('/app/list');

  return { ok: true, data: { id: created!.id } };
}

export async function updateApplication(
  id: string,
  input: ApplicationFormInput
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = applicationFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'invalidInput',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const v = parsed.data;
  const company = await upsertCompanyByName(user.id, v.companyName);

  const result = await db
    .update(applications)
    .set({
      companyId: company.id,
      title: v.title,
      department: v.department,
      location: v.location,
      source: v.source,
      sourceUrl: v.sourceUrl,
      employmentType: v.employmentType,
      currentStatus: v.currentStatus,
      priority: v.priority,
      deadlineAt: v.deadlineAt,
      appliedAt: v.appliedAt,
      salaryRange: v.salaryRange,
      referralName: v.referralName,
      notes: v.notes,
      updatedAt: new Date(),
    })
    .where(and(eq(applications.id, id), eq(applications.userId, user.id)))
    .returning({ id: applications.id });

  if (result.length === 0) return { ok: false, error: 'notFound' };

  revalidatePath('/app');
  revalidatePath('/app/board');
  revalidatePath('/app/list');
  revalidatePath(`/app/applications/${id}`);

  return { ok: true, data: { id } };
}

export async function deleteApplication(id: string): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const result = await db
    .delete(applications)
    .where(and(eq(applications.id, id), eq(applications.userId, user.id)))
    .returning({ id: applications.id });
  if (result.length === 0) return { ok: false, error: 'notFound' };

  revalidatePath('/app');
  revalidatePath('/app/board');
  revalidatePath('/app/list');
  return { ok: true, data: { id } };
}

export async function deleteApplicationAndRedirect(id: string) {
  const result = await deleteApplication(id);
  if (!result.ok) throw new Error(result.error);
  redirect('/app/board');
}

/**
 * Move an application to a new status / position.
 * The whole target column is renumbered 0..n-1 in a single transaction so we
 * never accumulate gaps or duplicates from optimistic UI re-orderings.
 */
export async function moveApplicationStatus(input: {
  applicationId: string;
  status: string;
  beforeId?: string | null;
}): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = moveStatusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalidInput' };
  const { applicationId, status, beforeId } = parsed.data;

  await db.transaction(async (tx) => {
    // Confirm ownership.
    const [target] = await tx
      .select()
      .from(applications)
      .where(and(eq(applications.id, applicationId), eq(applications.userId, user.id)))
      .limit(1);
    if (!target) throw new Error('Not found');

    // Pull current column ordering excluding the moving card.
    const column = await tx
      .select({ id: applications.id, boardOrder: applications.boardOrder })
      .from(applications)
      .where(
        and(eq(applications.userId, user.id), eq(applications.currentStatus, status as never))
      )
      .orderBy(applications.boardOrder);

    const others = column.filter((c) => c.id !== applicationId);
    const insertAt = beforeId ? others.findIndex((c) => c.id === beforeId) : others.length;
    const finalIdx = insertAt < 0 ? others.length : insertAt;
    const newOrder = [...others];
    newOrder.splice(finalIdx, 0, { id: applicationId, boardOrder: finalIdx });

    // Renumber.
    for (let i = 0; i < newOrder.length; i++) {
      const row = newOrder[i]!;
      await tx
        .update(applications)
        .set({
          boardOrder: i,
          ...(row.id === applicationId
            ? { currentStatus: status as never, updatedAt: new Date() }
            : {}),
        })
        .where(eq(applications.id, row.id));
    }
  });

  revalidatePath('/app/board');
  revalidatePath('/app');
  return { ok: true, data: { id: applicationId } };
}

// --- Events / Notes (kept here to keep Phase 1 surface area small) -----------

const eventInputSchema = z.object({
  applicationId: z.string().uuid(),
  eventType: z.enum(EVENT_TYPES),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  startsAt: z.coerce.date(),
  reminderAt: z.coerce.date().optional(),
});

export async function createEvent(input: z.input<typeof eventInputSchema>) {
  const user = await requireUser();
  const parsed = eventInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: 'invalidInput' };

  // Ownership check via parent application.
  const [parent] = await db
    .select({ id: applications.id })
    .from(applications)
    .where(
      and(eq(applications.id, parsed.data.applicationId), eq(applications.userId, user.id))
    )
    .limit(1);
  if (!parent) return { ok: false as const, error: 'notFound' };

  await db.insert(applicationEvents).values({
    applicationId: parsed.data.applicationId,
    eventType: parsed.data.eventType,
    title: parsed.data.title,
    description: parsed.data.description,
    startsAt: parsed.data.startsAt,
    reminderAt: parsed.data.reminderAt,
  });

  revalidatePath(`/app/applications/${parsed.data.applicationId}`);
  revalidatePath('/app');
  return { ok: true as const };
}

const noteInputSchema = z.object({
  applicationId: z.string().uuid(),
  noteType: z.enum(NOTE_TYPES).default('general'),
  content: z.string().trim().min(1).max(4000),
});

export async function createNote(input: z.input<typeof noteInputSchema>) {
  const user = await requireUser();
  const parsed = noteInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: 'invalidInput' };

  const [parent] = await db
    .select({ id: applications.id })
    .from(applications)
    .where(
      and(eq(applications.id, parsed.data.applicationId), eq(applications.userId, user.id))
    )
    .limit(1);
  if (!parent) return { ok: false as const, error: 'notFound' };

  await db.insert(applicationNotes).values({
    applicationId: parsed.data.applicationId,
    noteType: parsed.data.noteType,
    content: parsed.data.content,
  });

  revalidatePath(`/app/applications/${parsed.data.applicationId}`);
  return { ok: true as const };
}
