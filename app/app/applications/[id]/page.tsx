import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { requireUser } from '@/lib/auth-helpers';
import { getApplicationById } from '@/features/applications/queries';
import { deleteApplicationAndRedirect } from '@/features/applications/actions';
import { getOfferByApplicationId } from '@/features/offers/queries';
import { listBindingsForApplication, listMaterials } from '@/features/materials/queries';
import { MaterialPanel } from '@/features/materials/components/material-panel';
import { StatusBadge, PriorityBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Timeline } from '@/features/applications/components/timeline';
import { OfferPanel } from '@/features/offers/components/offer-panel';
import { formatDate, relativeFromNow, isOverdue } from '@/lib/date';
import { getServerDictionary, getLocale } from '@/lib/i18n/server';

export default async function ApplicationDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const user = await requireUser();
  const t = getServerDictionary();
  const locale = getLocale();
  const data = await getApplicationById(user.id, params.id);
  if (!data) notFound();
  const { application, company, events, notes } = data;
  const offer = await getOfferByApplicationId(user.id, application.id);
  const [materialBindings, materialLibrary] = await Promise.all([
    listBindingsForApplication(user.id, application.id),
    listMaterials(user.id),
  ]);

  const tabParam = typeof searchParams?.tab === 'string' ? searchParams.tab : undefined;
  const allowedTabs = new Set(['overview', 'timeline', 'materials', 'offer']);
  const defaultTab = tabParam && allowedTabs.has(tabParam) ? tabParam : 'overview';

  async function deleteAction() {
    'use server';
    await deleteApplicationAndRedirect(application.id);
  }

  return (
    <div className="container max-w-5xl py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{company.name}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{application.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusBadge status={application.currentStatus} />
            <PriorityBadge priority={application.priority} />
            <span className="text-xs text-muted-foreground">
              {t.employmentType[application.employmentType]}
            </span>
            {application.location && (
              <span className="text-xs text-muted-foreground">· {application.location}</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/app/applications/${application.id}/edit`}>
              <Pencil className="mr-1 h-4 w-4" /> {t.detail.edit}
            </Link>
          </Button>
          <form action={deleteAction}>
            <Button type="submit" variant="destructive">
              <Trash2 className="mr-1 h-4 w-4" /> {t.detail.delete}
            </Button>
          </form>
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="mt-8">
        <TabsList>
          <TabsTrigger value="overview">{t.detail.tabs.overview}</TabsTrigger>
          <TabsTrigger value="timeline">{t.detail.tabs.timeline}</TabsTrigger>
          <TabsTrigger value="materials">{t.detail.tabs.materials}</TabsTrigger>
          <TabsTrigger value="offer">{t.detail.tabs.offer}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <SummaryCard
              label={t.detail.summary.deadline}
              value={
                application.deadlineAt
                  ? formatDate(application.deadlineAt, undefined, locale)
                  : t.detail.summary.noDeadline
              }
              hint={
                application.deadlineAt
                  ? relativeFromNow(application.deadlineAt, locale)
                  : undefined
              }
              tone={isOverdue(application.deadlineAt) ? 'danger' : undefined}
            />
            <SummaryCard
              label={t.detail.summary.appliedOn}
              value={
                application.appliedAt
                  ? formatDate(application.appliedAt, undefined, locale)
                  : t.detail.summary.notYet
              }
            />
            <SummaryCard
              label={t.detail.summary.salary}
              value={application.salaryRange ?? t.common.dash}
              hint={
                application.referralName
                  ? `${t.detail.summary.referralPrefix}${application.referralName}`
                  : undefined
              }
            />
          </div>

          <Card>
            <CardContent className="space-y-4 p-6 text-sm">
              <DetailRow label={t.detail.fields.department} value={application.department} />
              <DetailRow label={t.detail.fields.source} value={application.source} />
              <DetailRow
                label={t.detail.fields.posting}
                value={
                  application.sourceUrl ? (
                    <a
                      className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
                      href={application.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {application.sourceUrl}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : null
                }
              />
              <DetailRow label={t.detail.fields.notes} value={application.notes} multiline />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Timeline applicationId={application.id} events={events} notes={notes} />
        </TabsContent>

        <TabsContent value="materials">
          <MaterialPanel
            applicationId={application.id}
            bindings={materialBindings}
            library={materialLibrary}
          />
        </TabsContent>

        <TabsContent value="offer">
          <OfferPanel applicationId={application.id} offer={offer} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: 'danger';
}) {
  return (
    <Card>
      <CardContent className="space-y-1 p-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p
          className={
            tone === 'danger'
              ? 'text-base font-semibold text-destructive'
              : 'text-base font-semibold'
          }
        >
          {value}
        </p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function DetailRow({
  label,
  value,
  multiline,
}: {
  label: string;
  value: React.ReactNode;
  multiline?: boolean;
}) {
  if (!value) {
    return (
      <div className="grid grid-cols-[140px_1fr] gap-4">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-muted-foreground">-</span>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-[140px_1fr] gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={multiline ? 'whitespace-pre-wrap' : ''}>{value}</span>
    </div>
  );
}
