'use client';

import { useState, useTransition } from 'react';
import {
  CalendarClock,
  CircleDot,
  Flag,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { EVENT_TYPES, NOTE_TYPES, type EventType, type NoteType } from '@/lib/enums';
import { formatDateTime } from '@/lib/date';
import { useT, useLocale } from '@/lib/i18n/client';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import { createEvent, createNote } from '../actions';

/** Server Action 返回稳定错误码，界面层再映射为当前语言文案。 */
function translateActionError(code: string, t: Dictionary): string {
  const common = t.common as Record<string, string>;
  return common[code] ?? code;
}

type TimelineItem =
  | {
      kind: 'event';
      id: string;
      title: string;
      description: string | null;
      startsAt: Date;
      eventType: EventType;
    }
  | {
      kind: 'note';
      id: string;
      noteType: NoteType;
      content: string;
      createdAt: Date;
    };

export function Timeline({
  applicationId,
  events,
  notes,
}: {
  applicationId: string;
  events: Array<{
    id: string;
    title: string;
    description: string | null;
    startsAt: Date;
    eventType: EventType;
  }>;
  notes: Array<{ id: string; noteType: NoteType; content: string; createdAt: Date }>;
}) {
  const t = useT();
  const items: TimelineItem[] = [
    ...events.map(
      (e): TimelineItem => ({
        kind: 'event',
        id: e.id,
        title: e.title,
        description: e.description,
        startsAt: new Date(e.startsAt),
        eventType: e.eventType,
      })
    ),
    ...notes.map(
      (n): TimelineItem => ({
        kind: 'note',
        id: n.id,
        noteType: n.noteType,
        content: n.content,
        createdAt: new Date(n.createdAt),
      })
    ),
  ].sort((a, b) => {
    const ad = a.kind === 'event' ? a.startsAt : a.createdAt;
    const bd = b.kind === 'event' ? b.startsAt : b.createdAt;
    return bd.getTime() - ad.getTime();
  });

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        {items.length === 0 && (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            {t.timeline.empty}
          </p>
        )}
        {items.map((item) =>
          item.kind === 'event' ? (
            <EventCard key={item.id} item={item} />
          ) : (
            <NoteCard key={item.id} item={item} />
          )
        )}
      </div>

      <aside className="space-y-6 rounded-lg border bg-muted/10 p-4">
        <AddEvent applicationId={applicationId} />
        <Separator />
        <AddNote applicationId={applicationId} />
      </aside>
    </div>
  );
}

function EventCard({
  item,
}: {
  item: Extract<TimelineItem, { kind: 'event' }>;
}) {
  const t = useT();
  const locale = useLocale();
  const Icon =
    item.eventType === 'interview'
      ? CalendarClock
      : item.eventType === 'oa'
        ? Flag
        : CircleDot;
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 text-primary" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{item.title}</p>
            <span className="text-xs text-muted-foreground">{t.eventType[item.eventType]}</span>
          </div>
          {item.description && (
            <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(item.startsAt, locale)}</p>
        </div>
      </div>
    </div>
  );
}

function NoteCard({ item }: { item: Extract<TimelineItem, { kind: 'note' }> }) {
  const t = useT();
  const locale = useLocale();
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start gap-3">
        <MessageSquare className="mt-0.5 h-4 w-4 text-primary" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t.noteType[item.noteType]}
            </p>
            <span className="text-xs text-muted-foreground">{formatDateTime(item.createdAt, locale)}</span>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm">{item.content}</p>
        </div>
      </div>
    </div>
  );
}

function AddEvent({ applicationId }: { applicationId: string }) {
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [eventType, setEventType] = useState<EventType>('interview');

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    startTransition(async () => {
      const res = await createEvent({
        applicationId,
        eventType,
        title: String(data.get('title') ?? ''),
        startsAt: new Date(String(data.get('startsAt') ?? '')),
        description: String(data.get('description') ?? '') || undefined,
      });
      if (!res.ok) {
        toast.error(translateActionError(res.error, t));
        return;
      }
      toast.success(t.timeline.addEvent.toast);
      form.reset();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <p className="text-sm font-semibold">{t.timeline.addEvent.title}</p>
      <div className="space-y-2">
        <Label>{t.timeline.addEvent.type}</Label>
        <Select value={eventType} onValueChange={(v) => setEventType(v as EventType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EVENT_TYPES.map((e) => (
              <SelectItem key={e} value={e}>
                {t.eventType[e]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>{t.timeline.addEvent.eventTitle}</Label>
        <Input name="title" required placeholder={t.timeline.addEvent.titlePlaceholder} />
      </div>
      <div className="space-y-2">
        <Label>{t.timeline.addEvent.when}</Label>
        <Input name="startsAt" type="datetime-local" required />
      </div>
      <div className="space-y-2">
        <Label>{t.timeline.addEvent.notes}</Label>
        <Textarea name="description" rows={2} />
      </div>
      <Button type="submit" size="sm" className="w-full" disabled={pending}>
        {pending ? t.timeline.addEvent.submitting : t.timeline.addEvent.submit}
      </Button>
    </form>
  );
}

function AddNote({ applicationId }: { applicationId: string }) {
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [noteType, setNoteType] = useState<NoteType>('general');

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    startTransition(async () => {
      const res = await createNote({
        applicationId,
        noteType,
        content: String(data.get('content') ?? ''),
      });
      if (!res.ok) {
        toast.error(translateActionError(res.error, t));
        return;
      }
      toast.success(t.timeline.addNote.toast);
      form.reset();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <p className="text-sm font-semibold">{t.timeline.addNote.title}</p>
      <div className="space-y-2">
        <Label>{t.timeline.addNote.type}</Label>
        <Select value={noteType} onValueChange={(v) => setNoteType(v as NoteType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {NOTE_TYPES.map((n) => (
              <SelectItem key={n} value={n}>
                {t.noteType[n]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>{t.timeline.addNote.content}</Label>
        <Textarea name="content" required rows={3} />
      </div>
      <Button type="submit" size="sm" className="w-full" disabled={pending}>
        {pending ? t.timeline.addNote.submitting : t.timeline.addNote.submit}
      </Button>
    </form>
  );
}
