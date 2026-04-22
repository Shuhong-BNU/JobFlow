import { requireUser } from '@/lib/auth-helpers';
import { getServerDictionary } from '@/lib/i18n/server';
import { listMaterials } from '@/features/materials/queries';
import { MATERIAL_TYPES, type MaterialType } from '@/lib/enums';
import { MaterialCard } from '@/features/materials/components/material-card';
import { MaterialTypeFilter } from '@/features/materials/components/material-type-filter';
import { NewMaterialButton } from '@/features/materials/components/new-material-button';
import { EmptyState } from '@/components/empty-state';

function resolveType(raw: string | string[] | undefined): MaterialType | null {
  if (typeof raw !== 'string') return null;
  return (MATERIAL_TYPES as readonly string[]).includes(raw) ? (raw as MaterialType) : null;
}

export default async function MaterialsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const user = await requireUser();
  const t = getServerDictionary();
  const type = resolveType(searchParams?.type);
  const materials = await listMaterials(user.id, type ? { type } : undefined);

  return (
    <div className="px-6 py-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t.materialsPage.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.materialsPage.subtitle}</p>
        </div>
      </header>

      <div className="mb-4 space-y-4">
        <MaterialTypeFilter active={type} />
        <NewMaterialButton />
      </div>

      {materials.length === 0 ? (
        <EmptyState
          title={type ? t.materialsPage.emptyFiltered.title : t.materialsPage.listEmpty.title}
          description={
            type ? t.materialsPage.emptyFiltered.desc : t.materialsPage.listEmpty.desc
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {materials.map((m) => (
            <MaterialCard key={m.id} material={m} />
          ))}
        </div>
      )}
    </div>
  );
}
