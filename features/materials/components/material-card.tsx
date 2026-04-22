'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useT, useLocale } from '@/lib/i18n/client';
import { formatDate } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { MaterialType } from '@/lib/enums';
import { MaterialForm } from './material-form';
import { deleteMaterial } from '../actions';
import { formatTags } from '../schema';
import type { MaterialRow } from '../queries';

/** Tailwind tint by material type. Kept inline — v1 has only 6 values. */
const TYPE_TONE: Record<MaterialType, string> = {
  resume: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-200',
  cover_letter: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  portfolio: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-200',
  transcript: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200',
  certificate: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-200',
  other: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
};

export function MaterialCard({ material }: { material: MaterialRow }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  function onDelete() {
    if (!confirm(t.materialsPage.confirmDelete)) return;
    startTransition(async () => {
      const result = await deleteMaterial(material.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(t.materialsPage.toast.deleted);
      router.refresh();
    });
  }

  if (editing) {
    return (
      <Card>
        <CardContent className="p-5">
          <MaterialForm
            materialId={material.id}
            defaultValues={{
              type: material.type,
              name: material.name,
              version: material.version ?? '',
              fileUrl: material.fileUrl ?? '',
              tags: formatTags(material.tags),
              notes: material.notes ?? '',
            }}
            onDone={() => setEditing(false)}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
                  TYPE_TONE[material.type]
                )}
              >
                {t.materialType[material.type]}
              </span>
              {material.version && (
                <span className="text-[11px] text-muted-foreground">v{material.version}</span>
              )}
            </div>
            <h3 className="mt-1 truncate text-sm font-semibold">{material.name}</h3>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
              disabled={pending}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {material.fileUrl && (
          <a
            href={material.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex max-w-full items-center gap-1 truncate text-xs text-primary underline-offset-4 hover:underline"
          >
            <ExternalLink className="h-3 w-3 shrink-0" />
            <span className="truncate">{material.fileUrl}</span>
          </a>
        )}

        {material.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {material.tags.map((tag) => (
              <span
                key={tag}
                className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {material.notes && (
          <p className="whitespace-pre-wrap text-xs text-muted-foreground">{material.notes}</p>
        )}

        <p className="text-[11px] text-muted-foreground">
          {t.materialsPage.updatedPrefix}
          {formatDate(material.updatedAt, undefined, locale)}
        </p>
      </CardContent>
    </Card>
  );
}

export { TYPE_TONE };
