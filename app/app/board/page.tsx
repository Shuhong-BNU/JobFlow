import { requireUser } from '@/lib/auth-helpers';
import { listApplicationsForBoard } from '@/features/applications/queries';
import { KanbanBoard } from '@/features/applications/components/kanban-board';
import { getServerDictionary } from '@/lib/i18n/server';

export default async function BoardPage() {
  const user = await requireUser();
  const t = getServerDictionary();
  const cards = await listApplicationsForBoard(user.id);

  return (
    <div className="px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{t.board.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.board.subtitle}</p>
      </header>
      <KanbanBoard initial={cards} />
    </div>
  );
}
