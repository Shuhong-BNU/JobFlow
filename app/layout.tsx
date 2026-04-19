import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from '@/components/ui/sonner';
import { getLocale } from '@/lib/i18n/server';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { LOCALE_HTML_LANG } from '@/lib/i18n/config';

export function generateMetadata(): Metadata {
  const dict = getDictionary(getLocale());
  return {
    title: dict.meta.title,
    description: dict.meta.description,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = getLocale();
  return (
    <html lang={LOCALE_HTML_LANG[locale]} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers locale={locale}>{children}</Providers>
        <Toaster richColors closeButton />
      </body>
    </html>
  );
}
