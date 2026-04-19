import "server-only";

import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { aiTasks } from "@/db/schema";
import type { AiTaskStatus, AiTaskType } from "@/lib/constants";

export async function createAiTask(params: {
  userId: string;
  taskType: AiTaskType;
  inputPayload: unknown;
}) {
  const db = getDb();
  const [task] = await db
    .insert(aiTasks)
    .values({
      userId: params.userId,
      taskType: params.taskType,
      inputPayload: params.inputPayload,
      status: "queued",
    })
    .returning({
      id: aiTasks.id,
    });

  return task;
}

export async function finishAiTask(params: {
  taskId: string;
  status: Extract<AiTaskStatus, "success" | "failed">;
  outputPayload: unknown;
}) {
  const db = getDb();
  await db
    .update(aiTasks)
    .set({
      status: params.status,
      outputPayload: params.outputPayload,
      updatedAt: new Date(),
    })
    .where(eq(aiTasks.id, params.taskId));
}
