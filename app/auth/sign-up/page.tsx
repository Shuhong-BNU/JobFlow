import Link from 'next/link';
import { SignUpForm } from './sign-up-form';
import { LanguageSwitcher } from '@/components/language-switcher';
import { getServerDictionary } from '@/lib/i18n/server';

export default function SignUpPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const t = getServerDictionary();
  const callbackUrl =
    typeof searchParams?.callbackUrl === 'string' ? searchParams.callbackUrl : undefined;
  const signInHref = callbackUrl
    ? `/auth/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : '/auth/sign-in';

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-6 py-12">
      <div className="mb-6 flex justify-end">
        <LanguageSwitcher />
      </div>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t.auth.signUp.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t.auth.signUp.subtitle}</p>
      </div>
      <SignUpForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t.auth.signUp.hasAccount}{' '}
        <Link href={signInHref} className="font-medium text-foreground underline">
          {t.auth.signUp.goSignIn}
        </Link>
      </p>
    </div>
  );
}
