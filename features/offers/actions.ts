'use server';

import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { applications, offers } from '@/db/schema';
import { requireUser } from '@/lib/auth-helpers';
import { offerFormSchema, type OfferFormInput } from './schema';

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

/**
 * Upsert offer。Offer 与 application 1:1，用 applicationId 作为锚点。
 * 先做 ownership 校验（避免跨用户写入），然后判断是 update 还是 insert。
 * 用 upsert 的原因：详情页的 Offer tab 里不区分"新增 / 编辑"两套 UI，
 * 同一个表单填写、同一个按钮提交，后端吸收这个分流。
 */
export async function upsertOffer(
  applicationId: string,
  input: OfferFormInput
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = offerFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'invalidInput',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const v = parsed.data;

  const [parent] = await db
    .select({ id: applications.id })
    .from(applications)
    .where(and(eq(applications.id, applicationId), eq(applications.userId, user.id)))
    .limit(1);
  if (!parent) return { ok: false, error: 'notFound' };

  const [existing] = await db
    .select({ id: offers.id })
    .from(offers)
    .where(eq(offers.applicationId, applicationId))
    .limit(1);

  let offerId: string;
  if (existing) {
    const [updated] = await db
      .update(offers)
      .set({
        baseSalary: v.baseSalary,
        bonus: v.bonus,
        location: v.location,
        team: v.team,
        responseDeadlineAt: v.responseDeadlineAt,
        decisionStatus: v.decisionStatus,
        pros: v.pros,
        cons: v.cons,
        updatedAt: new Date(),
      })
      .where(eq(offers.id, existing.id))
      .returning({ id: offers.id });
    offerId = updated!.id;
  } else {
    const [created] = await db
      .insert(offers)
      .values({
        applicationId,
        baseSalary: v.baseSalary,
        bonus: v.bonus,
        location: v.location,
        team: v.team,
        responseDeadlineAt: v.responseDeadlineAt,
        decisionStatus: v.decisionStatus,
        pros: v.pros,
        cons: v.cons,
      })
      .returning({ id: offers.id });
    offerId = created!.id;
  }

  revalidatePath(`/app/applications/${applicationId}`);
  revalidatePath('/app/offers');
  revalidatePath('/app');
  return { ok: true, data: { id: offerId } };
}

export async function deleteOffer(
  applicationId: string
): Promise<ActionResult<{ applicationId: string }>> {
  const user = await requireUser();

  const [parent] = await db
    .select({ id: applications.id })
    .from(applications)
    .where(and(eq(applications.id, applicationId), eq(applications.userId, user.id)))
    .limit(1);
  if (!parent) return { ok: false, error: 'notFound' };

  const result = await db
    .delete(offers)
    .where(eq(offers.applicationId, applicationId))
    .returning({ id: offers.id });
  if (result.length === 0) return { ok: false, error: 'notFound' };

  revalidatePath(`/app/applications/${applicationId}`);
  revalidatePath('/app/offers');
  return { ok: true, data: { applicationId } };
}
