# Phase 2 — 执行记录

> 本文件记录 Phase 2 实际交付的内容。规划文档仍保留在 [`phase-2-plan.md`](./phase-2-plan.md)。
> 两份的差异就是"当初设想 vs. 最终落地"的 diff——遇到实现取舍时优先相信本文。

Phase 2 按三个小阶段逐步冻结，每个阶段一张 tag：

| 版本   | 范围                                      | 触达路由                                            |
| ------ | ----------------------------------------- | --------------------------------------------------- |
| v0.2.0 | 进度视图 + 部署支持                       | `/app/list?view=progress`、README/部署文档          |
| v0.3.0 | Offers、Calendar、Analytics               | `/app/offers`、`/app/calendar`、`/app/analytics`    |
| v0.4.0 | Materials（URL-first，不含 Storage 上传） | `/app/materials`、`/app/applications/[id]?tab=materials` |

没有新增数据库表——所有 Phase 2 要用的表（`offers` / `materials` / `application_materials`）在 Phase 1 就已经写进 `db/schema.ts`，这里只是把它们的 UI 与 server actions 补全。

---

## v0.2.0 — 进度视图 + 部署支持

### 交付物
- `/app/list` 增加 `?view=progress` 视图，6 步主干阶段（wishlist → applied → oa → interview → hr → offer）横向展示。
- 终态（rejected / archived）没有 stage 映射，所以用事件回填推导：`offer_response → 5`、`interview → 3`、`oa → 2`、`appliedAt → 1`，都没有则回到 0。不是幻觉最远阶段，是"有依据的最远阶段"。
- README / `docs/deployment.md` 新增 Live demo + 公开演示部署注意事项（共享账号、数据漂移、Vercel + Supabase Pooler 组合、成本说明）。

### 设计取舍
- **视图是 URL 状态，不是新路由**。避免 Board / List / Progress 三条互不知晓的入口。用户从 List 页勾一下视图切换按钮，URL 变成 `?view=progress`，列表与进度视图复用同一批数据查询。
- **终态回填走 events，不走 status 历史表**。新建 application_status_history 开销太大，而 events 本来就是按阶段打点的，够用。

---

## v0.3.0 — Offers / Calendar / Analytics

### Offers（`/app/offers`）
- 申请与 offer 是 1:1，`offers.applicationId` 直接作为外键和"有没有 offer"的判定。
- 表单字段全部可选（只有 `decisionStatus` 默认 `pending`）。现实里 offer 先有口头承诺，细节分批补——强制必填只会堵住录入。
- UI 形态：单一 `upsert` action + 同一份 `OfferForm`；详情页 Offer Tab 的 `OfferPanel` 自己处理"没 offer / 新增中 / 查看中 / 编辑中"四种状态切换。没造"新建 vs. 编辑"两套页面。
- 总览页按 `updatedAt desc` 排，pending 的 offer 天然在上面；列表卡片带 DecisionPill、截止日、4 个关键字段。

### Calendar（`/app/calendar`）
- 单张月视图。6×7 = 42 个格子，周一起始。
- 数据两部分：`applications.deadlineAt` 虚拟为 `eventType: 'deadline'`，`application_events.startsAt` 是真实事件。两边合并按 `at` 升序。
- URL 驱动：`?m=yyyy-MM` 决定锚点月份，非法值回当月。Today 按钮清 querystring。
- **不做拖拽改期**。规划里写了，但拖拽需要 React DnD + 乐观更新 + 冲突回滚，远超 v1 预算。保留为 Phase 3 候选。
- 每个格子至多显示 3 条，超出用 "+N" 收纳。点击事件跳回申请详情。

### Analytics v1（`/app/analytics`）
- 刻意保守。v1 只出基础事实，不做 AI 洞察。
- 漏斗：按 **当前状态** 累加——offer 阶段 count = byStatus[offer]，hr = byStatus[hr] + byStatus[offer]，以此类推。Over-count 比 under-count 危险（会制造"有 Offer 其实没有"的错觉），所以选择诚实欠估。rejected / archived 作为独立计数展示，不混入漏斗。
- Source 分布：`nullif(trim(source), '')` → 'Unknown' fallback。不追溯 events。
- Waiting：currentStatus ∈ {applied, oa} 且 `appliedAt` 非空的申请，算 `avg / max(now() - appliedAt)` 作为"还在等"的均值与峰值。
- **不做的事**：环比 / 周趋势（需要追溯历史状态转换）、"健康度评分"（没有统一口径）、空数据伪造（真的零就给 EmptyState）。

---

## v0.4.0 — Materials

### 交付物
- `/app/materials` 列表页：类型过滤 chips + 就地新建 + 卡片列表。
- `/app/applications/[id]?tab=materials` 详情 Tab：显示已挂载材料 + "挂载材料"表单。
- 5 个 server actions：`createMaterial` / `updateMaterial` / `deleteMaterial` / `attachMaterialToApplication` / `detachMaterialFromApplication`。
- 6 个 MATERIAL_TYPES 已经定义于 `lib/enums.ts`（resume / cover_letter / portfolio / transcript / certificate / other），不新增。

### 关键取舍：URL-first，不做 Storage 上传
**规划文档写过 Supabase Storage 上传**，v1 没做。原因：

1. Supabase Storage 集成要引入 `@supabase/supabase-js`、签名 URL 生成、上传 UI、MIME / size 校验、删除时清理孤儿 blob 等一整套——对一个"把材料登记好"的功能来说太重。
2. `materials.fileUrl` 列已经存在。存外部链接（Google Drive、Dropbox、自建）解决 80% 的真实场景：用户只是想知道"那次我投的是哪版简历"，字节住在我们 bucket 里还是他们的不重要。
3. v1 不建 bucket，Phase 3 要加 Storage 不会被 v1 的实现形态绑架——纯 additive 升级。

### 绑定语义
- `application_materials` 表上 `(applicationId, materialId, purpose)` 有唯一索引。
- 同一份材料可以以不同 purpose 绑同一条申请（例如 purpose = "submitted" 和 "revised" 两条）。
- `attachMaterialToApplication` 做幂等：同三元组已存在时直接返回原 bindingId，不触发 unique 约束异常。
- 删除 material 级联删除所有绑定（schema 里有 `onDelete: 'cascade'`）。

### UI 细节
- 详情页 Tab 不放"新建材料"入口——推用户去 `/app/materials` 创建。避免详情页表单越堆越杂。
- 材料库是空的时候，详情页挂载按钮 disabled + 给一条指向库页的提示。
- 库页卡片就地编辑（点铅笔切换为表单），不开 Dialog。

---

## Phase 2 整体验证

每个阶段结束跑一轮：
- `npm run typecheck` — 全绿
- `npm run lint` — 全绿
- `npm run build` — 全绿（Next.js 14 静态生成 17 页）

数据验证：`npm run db:seed` 会种入完整的 Phase 2 示例数据（3 份 materials、2 条 binding、1 条 offer、6 条 events），直接跑 `dev:start` 就能看到各模块非空状态。

---

## 没做但被讨论过的事

| 事项               | 决策                | 原因                                                                       |
| ------------------ | ------------------- | -------------------------------------------------------------------------- |
| 日历拖拽改期       | 留到 Phase 3        | 乐观更新 + 冲突回滚超出 v1 预算                                            |
| 日历周视图         | 不做                | 月视图已经覆盖主要使用场景；周视图在手机上意义不大                         |
| Materials 文件上传 | 改为 URL-first      | 见上文"关键取舍"                                                           |
| Materials 过期提醒 | 不做                | 需要"N 天未使用"的口径定义，规则没讨论清楚前不想先写一个                   |
| Analytics 环比趋势 | 不做                | 需要 `application_status_history` 或追溯 events 推导状态，v1 不值得加成本  |
| Analytics 渠道漏斗 | 不做                | 需要跨 source × stage 的透视，v1 的 group-by-source 已经回答 80% 的问题    |
| Phase 2 schema 变更| 无                  | 所有表在 Phase 1 就建好了，Phase 2 只补 UI 和 actions                      |
