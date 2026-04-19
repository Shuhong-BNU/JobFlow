"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { applications, offers } from "@/db/schema";
import {
  mapOfferFormData,
  mapOfferFormToDbInput,
  offerFormSchema,
  type OfferFormActionState,
} from "@/features/offers/schema";
import { measureServerOperation } from "@/lib/server/logger";
import { requireUser } from "@/server/permissions";

function revalidateOfferPaths(applicationId: string, redirectTo: string) {
  revalidatePath("/offers");
  revalidatePath("/analytics");
  revalidatePath("/applications");
  revalidatePath(`/applications/${applicationId}`);
  if (redirectTo.startsWith("/applications/")) {
    revalidatePath(redirectTo);
  }
}

export async function saveOfferAction(
  _prevState: OfferFormActionState,
  formData: FormData,
): Promise<OfferFormActionState> {
  const user = await requireUser();
  const parsed = offerFormSchema.safeParse(mapOfferFormData(formData));

  if (!parsed.success) {
    return {
      error: "请先修正 Offer 表单内容。",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const input = mapOfferFormToDbInput(parsed.data);
  const db = getDb();

  const [application] = await db
    .select({ id: applications.id })
    .from(applications)
    .where(and(eq(applications.id, input.applicationId), eq(applications.userId, user.id)))
    .limit(1);

  if (!application) {
    return {
      error: "找不到对应的岗位申请，无法保存 Offer。",
    };
  }

  const [existing] = await db
    .select({ id: offers.id })
    .from(offers)
    .where(and(eq(offers.applicationId, input.applicationId), eq(offers.userId, user.id)))
    .limit(1);

  await measureServerOperation(
    "offers.save",
    { userId: user.id, applicationId: input.applicationId, decisionStatus: input.decisionStatus },
    async () => {
      if (existing) {
        await db
          .update(offers)
          .set({
            baseSalary: input.baseSalary,
            bonus: input.bonus,
            location: input.location,
            team: input.team,
            responseDeadlineAt: input.responseDeadlineAt,
            decisionStatus: input.decisionStatus,
            pros: input.pros,
            cons: input.cons,
            updatedAt: new Date(),
          })
          .where(eq(offers.id, existing.id));
      } else {
        await db.insert(offers).values({
          userId: user.id,
          applicationId: input.applicationId,
          baseSalary: input.baseSalary,
          bonus: input.bonus,
          location: input.location,
          team: input.team,
          responseDeadlineAt: input.responseDeadlineAt,
          decisionStatus: input.decisionStatus,
          pros: input.pros,
          cons: input.cons,
        });
      }

      await db
        .update(applications)
        .set({
          currentStatus: "offer",
          updatedAt: new Date(),
        })
        .where(eq(applications.id, input.applicationId));
    },
  );

  const redirectTo = input.redirectTo ?? `/applications/${input.applicationId}`;
  revalidateOfferPaths(input.applicationId, redirectTo);
  redirect(redirectTo);
}

export async function deleteOfferAction(formData: FormData) {
  const user = await requireUser();
  const applicationId = String(formData.get("applicationId") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "") || `/applications/${applicationId}`;

  if (!applicationId) {
    redirect(redirectTo);
  }

  const db = getDb();
  await measureServerOperation(
    "offers.delete",
    { userId: user.id, applicationId },
    async () => {
      await db
        .delete(offers)
        .where(and(eq(offers.applicationId, applicationId), eq(offers.userId, user.id)));
    },
  );

  revalidateOfferPaths(applicationId, redirectTo);
  redirect(redirectTo);
}
