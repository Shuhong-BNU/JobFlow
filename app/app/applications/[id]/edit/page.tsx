import { notFound } from 'next/navigation';
import { ApplicationForm } from '@/features/applications/components/application-form';
import { requireUser } from '@/lib/auth-helpers';
import { getApplicationById } from '@/features/applications/queries';
import { getServerDictionary } from '@/lib/i18n/server';

export default async function EditApplicationPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const t = getServerDictionary();
  const data = await getApplicationById(user.id, params.id);
  if (!data) notFound();

  const { application, company } = data;
  return (
    <div className="container max-w-3xl py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">{t.editApplication.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{company.name} · {application.title}</p>
      </header>
      <ApplicationForm
        mode="edit"
        applicationId={application.id}
        defaultValues={{
          companyName: company.name,
          title: application.title,
          department: application.department ?? '',
          location: application.location ?? '',
          source: application.source ?? '',
          sourceUrl: application.sourceUrl ?? '',
          employmentType: application.employmentType,
          currentStatus: application.currentStatus,
          priority: application.priority,
          deadlineAt: application.deadlineAt as never,
          appliedAt: application.appliedAt as never,
          salaryRange: application.salaryRange ?? '',
          referralName: application.referralName ?? '',
          notes: application.notes ?? '',
        }}
      />
    </div>
  );
}
