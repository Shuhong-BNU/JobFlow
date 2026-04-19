'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useT } from '@/lib/i18n/client';
import { fetchRuntimeHealth } from '@/lib/runtime-health-client';
import { mapRuntimeHealthCodeToAuthErrorKey } from '@/lib/runtime-health-shared';

type SignUpErrorCode =
  | 'env_invalid'
  | 'db_unreachable'
  | 'email_taken'
  | 'invalid_input'
  | 'invalid_json';

export function SignUpForm() {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') ?? '/app';
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Capture form reference synchronously: React nulls `e.currentTarget`
    // once the handler yields via `await`, so any later FormData(e.currentTarget)
    // would throw and get swallowed by the catch as a false "service unavailable".
    const form = e.currentTarget;
    setPending(true);
    try {
      const readiness = await fetchRuntimeHealth();
      if (!readiness.ok) {
        toast.error(t.auth.errors[mapRuntimeHealthCodeToAuthErrorKey(readiness.code)]);
        return;
      }

      const data = new FormData(form);
      const payload = {
        name: String(data.get('name') ?? '').trim(),
        email: String(data.get('email') ?? '').trim().toLowerCase(),
        password: String(data.get('password') ?? ''),
      };

      const res = await fetch('/api/auth/sign-up', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
          code?: SignUpErrorCode;
        };

        if (body.code === 'env_invalid') {
          toast.error(t.auth.errors.envInvalid);
        } else if (body.code === 'db_unreachable') {
          toast.error(t.auth.errors.dbUnavailable);
        } else if (body.code === 'email_taken') {
          toast.error(t.auth.errors.emailTaken);
        } else {
          toast.error(body.error ?? t.auth.errors.registerFailed);
        }

        return;
      }

      const signInRes = await signIn('credentials', {
        email: payload.email,
        password: payload.password,
        redirect: false,
      });

      if (signInRes?.error) {
        toast.error(t.auth.errors.createdButSignInFailed);
        router.replace(`/auth/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        return;
      }

      router.replace(callbackUrl);
    } catch (err) {
      console.error('[sign-up] unexpected submit error:', err);
      toast.error(t.auth.errors.serviceUnavailable);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t.auth.signUp.name}</Label>
        <Input id="name" name="name" required autoComplete="name" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">{t.auth.signUp.email}</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t.auth.signUp.password}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
        <p className="text-xs text-muted-foreground">{t.auth.signUp.passwordHint}</p>
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? t.auth.signUp.submitting : t.auth.signUp.submit}
      </Button>
    </form>
  );
}
