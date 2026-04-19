import "server-only";
import { cache } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { logServerEvent } from "@/lib/server/logger";

const getCachedSession = cache(() => auth());

export async function requireUser() {
  const session = await getCachedSession();

  if (!session?.user?.id) {
    await logServerEvent("warn", "auth.requireUser.redirect", {
      reason: "missing_session_user",
    });
    redirect("/sign-in");
  }

  return session.user;
}

export async function getOptionalUser() {
  const session = await getCachedSession();
  return session?.user ?? null;
}
