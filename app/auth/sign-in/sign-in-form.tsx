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

export function SignInForm() {
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
      const res = await signIn('credentials', {
        email: String(data.get('email') ?? '').trim().toLowerCase(),
        password: String(data.get('password') ?? ''),
        redirect: false,
      });

      if (res?.error) {
        toast.error(t.auth.errors.invalidCredentials);
        return;
      }

      router.replace(callbackUrl);
    } catch (err) {
      console.error('[sign-in] unexpected submit error:', err);
      toast.error(t.auth.errors.serviceUnavailable);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{t.auth.signIn.email}</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t.auth.signIn.password}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          minLength={8}
        />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? t.auth.signIn.submitting : t.auth.signIn.submit}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        {t.auth.signIn.demoHint} <code>demo@jobflow.local</code> / <code>demo1234</code>
      </p>
    </form>
  );
}
