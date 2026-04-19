import { Suspense } from 'react';
import Link from 'next/link';
import { SignInForm } from './sign-in-form';
import { LanguageSwitcher } from '@/components/language-switcher';
import { getServerDictionary } from '@/lib/i18n/server';

export default function SignInPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const t = getServerDictionary();
  const callbackUrl =
    typeof searchParams?.callbackUrl === 'string' ? searchParams.callbackUrl : undefined;
  const signUpHref = callbackUrl
    ? `/auth/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : '/auth/sign-up';

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-6 py-12">
      <div className="mb-6 flex justify-end">
        <LanguageSwitcher />
      </div>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t.auth.signIn.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t.auth.signIn.subtitle}</p>
      </div>
      <Suspense fallback={<div className="h-40" />}>
        <SignInForm />
      </Suspense>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t.auth.signIn.noAccount}{' '}
        <Link href={signUpHref} className="font-medium text-foreground underline">
          {t.auth.signIn.goSignUp}
        </Link>
      </p>
    </div>
  );
}
