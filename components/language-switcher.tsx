'use client';

import { useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocale, useT } from '@/lib/i18n/client';
import { setLocaleAction } from '@/lib/i18n/actions';
import { type Locale } from '@/lib/i18n/config';

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useT();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function switchLocale() {
    const next: Locale = locale === 'zh' ? 'en' : 'zh';
    startTransition(async () => {
      const result = await setLocaleAction(next, pathname || '/');
      if (!result.ok) return;
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={switchLocale}
      aria-label={t.language.label}
    >
      <Languages className="mr-1 h-4 w-4" />
      {locale === 'zh' ? t.language.en : t.language.zh}
    </Button>
  );
}
