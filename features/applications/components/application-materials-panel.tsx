import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import type { ApplicationOption } from "@/features/applications/types";
import { MaterialAttachForm } from "@/features/materials/components/material-attach-form";
import { attachMaterialAction, detachMaterialAction } from "@/features/materials/server/actions";
import type { MaterialListItem } from "@/features/materials/types";
import { materialPurposeLabels, materialTypeLabels } from "@/lib/labels";

export function ApplicationMaterialsPanel({
  detail,
  availableMaterials,
}: {
  detail: {
    id: string;
    materials: Array<{
      id: string;
      materialId: string;
      purpose: keyof typeof materialPurposeLabels;
      name: string;
      type: keyof typeof materialTypeLabels;
      version: string;
      fileUrl: string;
      tags: string[];
    }>;
  };
  availableMaterials: MaterialListItem[];
}) {
  const redirectTo = `/applications/${detail.id}`;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)]">
      <Card className="bg-card/86">
        <CardTitle>已绑定材料</CardTitle>
        <CardDescription className="mt-2">
          这里展示当前岗位实际使用的简历、作品集或补充材料，方便复盘和复用。
        </CardDescription>

        <div className="mt-6 space-y-3">
          {detail.materials.length > 0 ? (
            detail.materials.map((material) => (
              <div
                key={material.id}
                className="rounded-[24px] border border-border bg-muted/55 px-4 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                        {materialTypeLabels[material.type]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {materialPurposeLabels[material.purpose]}
                      </span>
                      <span className="text-xs text-muted-foreground">{material.version}</span>
                    </div>
                    <p className="text-sm font-medium">{material.name}</p>
                    {material.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {material.tags.map((tag) => (
                          <span
                            key={`${material.id}-${tag}`}
                            className="rounded-full bg-card px-2.5 py-1 text-xs text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <div className="flex flex-wrap gap-3 text-sm">
                      <a
                        href={material.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        打开文件
                      </a>
                      <a
                        href={`/materials?selected=${material.materialId}`}
                        className="text-primary hover:underline"
                      >
                        去材料中心
                      </a>
                    </div>
                  </div>

                  <form action={detachMaterialAction}>
                    <input type="hidden" name="attachmentId" value={material.id} />
                    <input type="hidden" name="applicationId" value={detail.id} />
                    <input type="hidden" name="redirectTo" value={redirectTo} />
                    <Button type="submit" variant="outline" size="sm">
                      <Trash2 className="mr-2 size-4" />
                      解绑
                    </Button>
                  </form>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[24px] border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
              还没有给这个岗位绑定材料。你可以先从右侧选择已有材料，或去材料中心新建版本。
            </div>
          )}
        </div>
      </Card>

      <MaterialAttachForm
        title="绑定材料"
        description="把已有材料版本绑定到当前岗位，后续 Offer / Analytics / 复盘都能复用这条链路。"
        action={attachMaterialAction}
        applications={
          [
            {
              id: detail.id,
              companyName: "",
              title: "",
              currentStatus: "wishlist",
            },
          ] as ApplicationOption[]
        }
        materials={availableMaterials}
        redirectTo={redirectTo}
        fixedApplicationId={detail.id}
      />
    </div>
  );
}
