"use server";

import { hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import type { AuthActionState } from "@/features/auth/schema";
import { signInSchema, signUpSchema } from "@/features/auth/schema";
import { createUserAccount, getAuthUserByEmail } from "@/features/auth/server/repository";

export async function signInAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: "请检查登录信息。",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error: "邮箱或密码不正确。",
      };
    }

    throw error;
  }

  return {};
}

export async function signUpAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: "请先修正表单内容。",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const existingUser = await getAuthUserByEmail(parsed.data.email);

  if (existingUser) {
    return {
      error: "该邮箱已注册，请直接登录。",
    };
  }

  const passwordHash = await hash(parsed.data.password, 10);

  await createUserAccount({
    name: parsed.data.name,
    email: parsed.data.email,
    passwordHash,
  });

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error: "注册成功，但自动登录失败，请手动登录。",
      };
    }

    throw error;
  }

  return {};
}

export async function signOutAction() {
  await signOut({ redirectTo: "/sign-in" });
  redirect("/sign-in");
}
