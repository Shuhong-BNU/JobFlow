"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useActionState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type AuthActionState,
  signInSchema,
  signUpSchema,
} from "@/features/auth/schema";

type AuthFormProps =
  | {
      mode: "sign-in";
      action: (
        prevState: AuthActionState,
        formData: FormData,
      ) => Promise<AuthActionState>;
    }
  | {
      mode: "sign-up";
      action: (
        prevState: AuthActionState,
        formData: FormData,
      ) => Promise<AuthActionState>;
    };

type AuthFormValues = {
  name: string;
  email: string;
  password: string;
};

const initialState: AuthActionState = {};

export function AuthForm({ mode, action }: AuthFormProps) {
  const [state, formAction] = useActionState(action, initialState);
  const [isPending, startTransition] = useTransition();
  const isSignUp = mode === "sign-up";

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(isSignUp ? signUpSchema : signInSchema) as never,
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!state.fieldErrors) {
      return;
    }

    for (const [field, messages] of Object.entries(state.fieldErrors)) {
      if (!messages?.[0]) {
        continue;
      }

      form.setError(field as keyof AuthFormValues, {
        message: messages[0],
      });
    }
  }, [form, state.fieldErrors]);

  const onSubmit = form.handleSubmit((values) => {
    const formData = new FormData();
    formData.set("email", values.email);
    formData.set("password", values.password);

    if (isSignUp) {
      formData.set("name", values.name);
    }

    startTransition(() => {
      formAction(formData);
    });
  });

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      {isSignUp ? (
        <div className="space-y-2">
          <Label htmlFor="name">姓名</Label>
          <Input id="name" placeholder="例如：陈小白" {...form.register("name")} />
          <FieldMessage message={form.formState.errors.name?.message} />
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">邮箱</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          {...form.register("email")}
        />
        <FieldMessage message={form.formState.errors.email?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">密码</Label>
        <Input
          id="password"
          type="password"
          autoComplete={isSignUp ? "new-password" : "current-password"}
          placeholder="至少 8 位"
          {...form.register("password")}
        />
        <FieldMessage message={form.formState.errors.password?.message} />
      </div>

      {state.error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-950 dark:bg-rose-950/40 dark:text-rose-200">
          {state.error}
        </p>
      ) : null}

      <Button className="w-full" type="submit" disabled={isPending}>
        {isPending
          ? isSignUp
            ? "正在创建账户..."
            : "正在登录..."
          : isSignUp
            ? "创建账户"
            : "登录"}
      </Button>

      <p className="text-sm text-muted-foreground">
        {isSignUp ? "已经有账号了？" : "还没有账号？"}{" "}
        <Link
          href={isSignUp ? "/sign-in" : "/sign-up"}
          className="font-medium text-primary hover:underline"
        >
          {isSignUp ? "去登录" : "立即注册"}
        </Link>
      </p>
    </form>
  );
}

function FieldMessage({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-rose-600 dark:text-rose-300">{message}</p>;
}
