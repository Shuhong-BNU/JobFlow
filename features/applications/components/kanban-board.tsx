'use client';

import { useMemo, useState } from 'react';
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';
import { APPLICATION_STATUSES, type ApplicationStatus } from '@/lib/enums';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n/client';
import { ApplicationCardView } from './application-card';
import { moveApplicationStatus } from '../actions';
import type { ApplicationCard } from '../queries';

type CardsByStatus = Record<ApplicationStatus, ApplicationCard[]>;

function groupByStatus(cards: ApplicationCard[]): CardsByStatus {
  const out = Object.fromEntries(APPLICATION_STATUSES.map((s) => [s, [] as ApplicationCard[]])) as CardsByStatus;
  for (const c of cards) out[c.currentStatus].push(c);
  for (const s of APPLICATION_STATUSES) out[s].sort((a, b) => a.boardOrder - b.boardOrder);
  return out;
}

export function KanbanBoard({ initial }: { initial: ApplicationCard[] }) {
  const t = useT();
  const [cards, setCards] = useState(initial);
  const [activeId, setActiveId] = useState<string | null>(null);

  const grouped = useMemo(() => groupByStatus(cards), [cards]);
  const cardMap = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);
  const activeCard = activeId ? cardMap.get(activeId) ?? null : null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function findContainer(id: string): ApplicationStatus | null {
    if (APPLICATION_STATUSES.includes(id as ApplicationStatus))
      return id as ApplicationStatus;
    const card = cardMap.get(id);
    return card ? card.currentStatus : null;
  }

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  async function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const fromStatus = findContainer(activeId);
    const toStatus = findContainer(overId);
    if (!fromStatus || !toStatus) return;

    const overIsColumn = APPLICATION_STATUSES.includes(overId as ApplicationStatus);
    const beforeId = overIsColumn ? null : overId;

    // Optimistic update.
    const previousCards = cards;
    const next = applyMoveOptimistic(cards, activeId, toStatus, beforeId);
    setCards(next);

    const res = await moveApplicationStatus({
      applicationId: activeId,
      status: toStatus,
      beforeId,
    });
    if (!res.ok) {
      const common = t.common as Record<string, string>;
      toast.error(common[res.error] ?? t.board.moveFailed);
      setCards(previousCards);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4">
        {APPLICATION_STATUSES.map((status) => (
          <Column key={status} status={status} cards={grouped[status]} />
        ))}
      </div>
      <DragOverlay>
        {activeCard ? (
          <div className="w-72">
            <ApplicationCardView card={activeCard} dragging asLink={false} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function Column({ status, cards }: { status: ApplicationStatus; cards: ApplicationCard[] }) {
  const t = useT();
  const { setNodeRef, isOver } = useSortable({ id: status, data: { type: 'column' } });
  return (
    <section
      ref={setNodeRef}
      className={cn(
        'flex w-72 shrink-0 flex-col rounded-lg border bg-muted/20 p-2',
        isOver && 'ring-2 ring-primary/40'
      )}
    >
      <header className="flex items-center justify-between px-2 py-1.5 text-sm font-medium">
        <span>{t.status[status]}</span>
        <span className="rounded-full bg-background px-2 text-xs text-muted-foreground">
          {cards.length}
        </span>
      </header>
      <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <ol className="flex min-h-[60px] flex-col gap-2 p-1">
          {cards.map((card) => (
            <SortableCard key={card.id} card={card} />
          ))}
          {cards.length === 0 && (
            <li className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
              {t.board.dropHere}
            </li>
          )}
        </ol>
      </SortableContext>
    </section>
  );
}

function SortableCard({ card }: { card: ApplicationCard }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'card' },
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };
  return (
    <li ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ApplicationCardView card={card} />
    </li>
  );
}

// --- Pure helpers -----------------------------------------------------------

function applyMoveOptimistic(
  cards: ApplicationCard[],
  movedId: string,
  toStatus: ApplicationStatus,
  beforeId: string | null
): ApplicationCard[] {
  const moving = cards.find((c) => c.id === movedId);
  if (!moving) return cards;
  const others = cards.filter((c) => c.id !== movedId);
  const targetCol = others
    .filter((c) => c.currentStatus === toStatus)
    .sort((a, b) => a.boardOrder - b.boardOrder);

  const insertAt = beforeId ? targetCol.findIndex((c) => c.id === beforeId) : targetCol.length;
  const finalIdx = insertAt < 0 ? targetCol.length : insertAt;

  const newTargetCol = [...targetCol];
  newTargetCol.splice(finalIdx, 0, { ...moving, currentStatus: toStatus });

  const renumberedTarget = newTargetCol.map((c, i) => ({ ...c, boardOrder: i }));

  return [
    ...others.filter((c) => c.currentStatus !== toStatus),
    ...renumberedTarget,
  ];
}
