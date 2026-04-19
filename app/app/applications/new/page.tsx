import { ApplicationForm } from '@/features/applications/components/application-form';
import { getServerDictionary } from '@/lib/i18n/server';

export default function NewApplicationPage() {
  const t = getServerDictionary();
  return (
    <div className="container max-w-3xl py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">{t.newApplication.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.newApplication.subtitle}</p>
      </header>
      <ApplicationForm mode="create" />
    </div>
  );
}
