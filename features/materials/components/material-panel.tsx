'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink, Link as LinkIcon, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/empty-state';
import { useT } from '@/lib/i18n/client';
import { cn } from '@/lib/utils';
import type { MaterialType } from '@/lib/enums';
import { TYPE_TONE } from './material-card';
import { attachMaterialToApplication, detachMaterialFromApplication } from '../actions';
import type { ApplicationMaterialBinding, MaterialRow } from '../queries';

/**
 * 详情页 Materials tab。两块：
 *  - 顶部：已绑定列表 + 单条解绑
 *  - 底部：从 material 库选一个绑上来（可选 purpose 文案）
 *
 * 没有"在此页新建 material"的入口 —— 推用户去 /app/materials 创建，以免
 * 详情页表单越堆越杂。空的 library 会给一个前往链接。
 */
export function MaterialPanel({
  applicationId,
  bindings,
  library,
}: {
  applicationId: string;
  bindings: ApplicationMaterialBinding[];
  library: MaterialRow[];
}) {
  const t = useT();
  const router = useRouter();
  const [picking, setPicking] = useState(false);
  const [pending, startTransition] = useTransition();

  const alreadyBoundIds = useMemo(() => new Set(bindings.map((b) => b.material.id)), [bindings]);
  const available = useMemo(
    () => library.filter((m) => !alreadyBoundIds.has(m.id)),
    [library, alreadyBoundIds]
  );

  function onDetach(bindingId: string) {
    startTransition(async () => {
      const result = await detachMaterialFromApplication(bindingId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(t.materialsPage.toast.detached);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {bindings.length === 0 ? (
        <EmptyState
          title={t.materialsPage.detail.empty.title}
          description={t.materialsPage.detail.empty.desc}
        />
      ) : (
        <Card>
          <CardContent className="divide-y p-0">
            {bindings.map((b) => (
              <BindingRow
                key={b.bindingId}
                binding={b}
                onDetach={() => onDetach(b.bindingId)}
                disabled={pending}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {picking ? (
        <AttachForm
          applicationId={applicationId}
          available={available}
          onDone={() => setPicking(false)}
          onCancel={() => setPicking(false)}
        />
      ) : (
        <Button variant="outline" onClick={() => setPicking(true)} disabled={library.length === 0}>
          <Plus className="mr-1 h-4 w-4" /> {t.materialsPage.detail.attach}
        </Button>
      )}

      {library.length === 0 && (
        <p className="text-xs text-muted-foreground">{t.materialsPage.detail.libraryEmpty}</p>
      )}
    </div>
  );
}

function BindingRow({
  binding,
  onDetach,
  disabled,
}: {
  binding: ApplicationMaterialBinding;
  onDetach: () => void;
  disabled?: boolean;
}) {
  const t = useT();
  const { material, purpose } = binding;
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span
        className={cn(
          'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
          TYPE_TONE[material.type as MaterialType]
        )}
      >
        {t.materialType[material.type]}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className="truncate text-sm font-medium">{material.name}</p>
          {material.version && (
            <span className="shrink-0 text-[11px] text-muted-foreground">v{material.version}</span>
          )}
        </div>
        {(purpose || material.fileUrl) && (
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
            {purpose && (
              <span className="inline-flex items-center gap-1">
                <LinkIcon className="h-3 w-3" />
                {purpose}
              </span>
            )}
            {material.fileUrl && (
              <a
                href={material.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                {t.materialsPage.detail.openFile}
              </a>
            )}
          </div>
        )}
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-muted-foreground hover:text-destructive"
        onClick={onDetach}
        disabled={disabled}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function AttachForm({
  applicationId,
  available,
  onDone,
  onCancel,
}: {
  applicationId: string;
  available: MaterialRow[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [materialId, setMaterialId] = useState<string>(available[0]?.id ?? '');
  const [purpose, setPurpose] = useState('');

  function onSubmit() {
    if (!materialId) return;
    startTransition(async () => {
      const result = await attachMaterialToApplication({
        applicationId,
        materialId,
        purpose: purpose.trim() || undefined,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(t.materialsPage.toast.attached);
      router.refresh();
      onDone();
    });
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t.materialsPage.detail.pickMaterial}</Label>
            <Select value={materialId} onValueChange={setMaterialId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {available.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {t.materialType[m.type]} · {m.name}
                    {m.version ? ` (v${m.version})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <Label>{t.materialsPage.detail.purpose}</Label>
              <span className="text-[11px] text-muted-foreground">{t.form.hints.optional}</span>
            </div>
            <Input
              placeholder={t.materialsPage.detail.purposePlaceholder}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t.form.actions.cancel}
          </Button>
          <Button type="button" onClick={onSubmit} disabled={pending || !materialId}>
            {pending ? t.common.adding : t.common.add}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
