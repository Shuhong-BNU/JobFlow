import { EmptyState } from '@/components/empty-state';
import { getServerDictionary } from '@/lib/i18n/server';

export function ComingSoon({ title, phase }: { title: string; phase: string }) {
  const t = getServerDictionary();
  return (
    <div className="container max-w-4xl py-12">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t.comingSoon.bodyTemplate.replace('{phase}', phase)}
      </p>
      <div className="mt-8">
        <EmptyState
          title={t.comingSoon.notBuiltTitle}
          description={t.comingSoon.notBuiltDesc}
        />
      </div>
    </div>
  );
}
