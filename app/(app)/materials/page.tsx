import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { MaterialForm } from "@/features/materials/components/material-form";
import { MaterialAttachForm } from "@/features/materials/components/material-attach-form";
import {
  attachMaterialAction,
  createMaterialAction,
  deleteMaterialAction,
  detachMaterialAction,
  updateMaterialAction,
} from "@/features/materials/server/actions";
import { getMaterialDetail, listMaterials } from "@/features/materials/server/queries";
import { listApplicationOptions } from "@/features/applications/server/queries";
import { materialTypeLabels, materialPurposeLabels } from "@/lib/labels";
import { requireUser } from "@/server/permissions";

type MaterialsPageProps = {
  searchParams: Promise<{
    query?: string;
    type?: string;
    selected?: string;
  }>;
};

export default async function MaterialsPage({ searchParams }: MaterialsPageProps) {
  const user = await requireUser();
  const params = await searchParams;
  const query = params.query ?? "";
  const type = params.type ?? "all";

  const [materials, applicationOptions, selectedMaterial] = await Promise.all([
    listMaterials(user.id, {
      query,
      type: type as never,
    }),
    listApplicationOptions(user.id),
    params.selected ? getMaterialDetail(user.id, params.selected) : Promise.resolve(null),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Phase 2"
        title="Materials"
        description="材料中心用于管理简历版本、作品集、成绩单等文件，并支持直接绑定到具体岗位。"
      />

      <Card className="bg-card/86">
        <CardTitle>筛选</CardTitle>
        <CardDescription className="mt-2">
          一条 material 代表一个具体版本，后续绑定关系会直接复用这里的数据。
        </CardDescription>
        <form className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_auto]">
          <div className="space-y-2">
            <label className="text-sm font-medium">搜索</label>
            <Input name="query" placeholder="按名称或版本搜索" defaultValue={query} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">材料类型</label>
            <Select name="type" defaultValue={type}>
              <option value="all">全部</option>
              {Object.entries(materialTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-end gap-3">
            <Button type="submit">应用筛选</Button>
            <Button asChild type="button" variant="ghost">
              <Link href="/materials">清空</Link>
            </Button>
          </div>
        </form>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <Card className="bg-card/86">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>材料列表</CardTitle>
              <CardDescription className="mt-2">
                点击某条材料可查看详情、编辑信息或管理它绑定到了哪些岗位。
              </CardDescription>
            </div>
            <Button asChild variant="outline">
              <Link href="/materials">新建材料</Link>
            </Button>
          </div>

          <div className="mt-6 space-y-3">
            {materials.length > 0 ? (
              materials.map((material) => (
                <a
                  key={material.id}
                  href={`/materials?selected=${material.id}`}
                  className="block rounded-[24px] border border-border bg-muted/55 px-4 py-4 transition hover:border-primary/40"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                      {materialTypeLabels[material.type]}
                    </span>
                    <span className="text-xs text-muted-foreground">{material.version}</span>
                  </div>
                  <p className="mt-3 text-sm font-medium">{material.name}</p>
                  {material.tags.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
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
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {material.notes || "暂无备注。"}
                  </p>
                </a>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                还没有材料记录。可以先在右侧创建一个本地可运行的材料版本。
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <MaterialForm
            title="新增材料"
            description="优先保证本地可运行：支持上传本地文件，也支持填写外部链接。"
            action={createMaterialAction}
            redirectTo="/materials"
            submitLabel="保存材料"
          />

          {selectedMaterial ? (
            <>
              <MaterialForm
                title="编辑材料"
                description="更新版本号、标签、备注或文件来源。"
                action={updateMaterialAction.bind(null, selectedMaterial.id)}
                redirectTo={`/materials?selected=${selectedMaterial.id}`}
                currentFileUrl={selectedMaterial.fileUrl}
                defaultValues={{
                  type: selectedMaterial.type,
                  name: selectedMaterial.name,
                  version: selectedMaterial.version,
                  tags: selectedMaterial.tags.join(", "),
                  notes: selectedMaterial.notes ?? "",
                }}
                submitLabel="更新材料"
              />

              <Card className="bg-card/86">
                <CardTitle>已绑定岗位</CardTitle>
                <CardDescription className="mt-2">
                  这些岗位正在复用当前材料版本，解绑后双方页面会同步刷新。
                </CardDescription>
                <div className="mt-6 space-y-3">
                  {selectedMaterial.attachments.length > 0 ? (
                    selectedMaterial.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="rounded-[24px] border border-border bg-muted/55 px-4 py-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-2">
                            <p className="text-sm font-medium">
                              {attachment.companyName} / {attachment.applicationTitle}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {materialPurposeLabels[attachment.purpose]}
                            </p>
                            <Link
                              href={`/applications/${attachment.applicationId}`}
                              className="text-sm text-primary hover:underline"
                            >
                              打开岗位详情
                            </Link>
                          </div>
                          <form action={detachMaterialAction}>
                            <input type="hidden" name="attachmentId" value={attachment.id} />
                            <input
                              type="hidden"
                              name="redirectTo"
                              value={`/materials?selected=${selectedMaterial.id}`}
                            />
                            <input type="hidden" name="applicationId" value={attachment.applicationId} />
                            <Button type="submit" variant="outline" size="sm">
                              解绑
                            </Button>
                          </form>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[24px] border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                      当前材料还没有绑定到任何岗位。
                    </div>
                  )}
                </div>
              </Card>

              <MaterialAttachForm
                title="绑定到岗位"
                description="从材料中心直接把当前版本挂到岗位上，详情页会同步显示。"
                action={attachMaterialAction}
                applications={applicationOptions}
                materials={materials}
                redirectTo={`/materials?selected=${selectedMaterial.id}`}
                fixedMaterialId={selectedMaterial.id}
              />

              <form action={deleteMaterialAction}>
                <input type="hidden" name="materialId" value={selectedMaterial.id} />
                <input type="hidden" name="redirectTo" value="/materials" />
                <Button type="submit" variant="destructive">
                  删除当前材料
                </Button>
              </form>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
