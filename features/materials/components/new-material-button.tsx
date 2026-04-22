'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useT } from '@/lib/i18n/client';
import { MaterialForm } from './material-form';

/**
 * 库页右上的"新建材料"按钮。点击后在内容顶部展开一张 form 卡片。
 * v1 不做 Sheet / Dialog —— 表单很小，就地展开比弹窗流畅。
 */
export function NewMaterialButton() {
  const t = useT();
  const [open, setOpen] = useState(false);

  if (open) {
    return (
      <Card>
        <CardContent className="p-5">
          <h2 className="mb-4 text-sm font-semibold">{t.materialsPage.newTitle}</h2>
          <MaterialForm onDone={() => setOpen(false)} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex justify-end">
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-1 h-4 w-4" /> {t.materialsPage.new}
      </Button>
    </div>
  );
}
