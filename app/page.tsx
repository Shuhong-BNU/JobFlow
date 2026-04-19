import Link from 'next/link';
import { ArrowRight, Calendar, KanbanSquare, ListChecks, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getServerDictionary } from '@/lib/i18n/server';
import { LanguageSwitcher } from '@/components/language-switcher';

export default function Landing() {
  const t = getServerDictionary();
  const features = [
    { icon: KanbanSquare, ...t.landing.features.board },
    { icon: Calendar, ...t.landing.features.calendar },
    { icon: ListChecks, ...t.landing.features.list },
    { icon: Sparkles, ...t.landing.features.ai },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            JobFlow
          </Link>
          <nav className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button asChild variant="ghost">
              <Link href="/auth/sign-in">{t.landing.signIn}</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">
                {t.landing.getStarted} <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="container flex flex-col items-center py-24 text-center">
          <span className="rounded-full border bg-muted/30 px-3 py-1 text-xs font-medium text-muted-foreground">
            {t.landing.badge}
          </span>
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            {t.landing.heroTitle}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">{t.landing.heroBody}</p>
          <div className="mt-8 flex gap-3">
            <Button asChild size="lg">
              <Link href="/auth/sign-up">
                {t.landing.startFree} <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/auth/sign-in">{t.landing.signIn}</Link>
            </Button>
          </div>
        </section>

        <section className="border-t bg-muted/20">
          <div className="container grid gap-8 py-20 sm:grid-cols-2">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border bg-background p-6">
                <f.icon className="h-6 w-6 text-primary" />
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container flex h-14 items-center justify-between text-xs text-muted-foreground">
          <span>{`JobFlow · ${t.landing.footerSuffix}`}</span>
          <span>{`© ${new Date().getFullYear()}`}</span>
        </div>
      </footer>
    </div>
  );
}
