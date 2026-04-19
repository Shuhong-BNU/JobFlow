# Phase 2 实施记录

## 目标

把 Phase 1 的“可运行 MVP”扩展为“完整求职管理产品原型”，补实以下五块能力：

1. Calendar
2. Materials
3. Timeline editing / Notes editing
4. Offers
5. Analytics

本阶段继续沿用：
- Auth.js Credentials
- Drizzle ORM
- PostgreSQL
- 8 列固定看板状态
- `applications.deadline_at -> application_events.deadline` 自动同步模型

## Schema 结论

- 本轮没有新增 migration
- 沿用现有表：
  - `application_events`
  - `materials`
  - `application_materials`
  - `application_notes`
  - `offers`

原因：
- 现有 schema 已足够承载 Phase 2 的产品范围
- 为了保持本地可运行与最小变更，本轮优先补强 query / actions / UI

## 本轮实现

### 1. Calendar

- `/calendar` 从占位页变成真实月视图
- 基于 `application_events` 展示事件
- 支持事件类型筛选、状态筛选
- 支持按天查看事件
- 支持创建、编辑、删除非 deadline 事件
- 支持跳转到对应 `application detail`
- `deadline` 事件继续只读，并通过岗位编辑页维护

### 2. Materials

- `/materials` 从占位页变成真实材料中心
- 支持材料列表、筛选、详情查看
- 支持新建 / 编辑 / 删除材料
- 支持本地文件上传
- 支持外部文件 URL 作为文件来源
- 支持材料绑定到 application
- 支持在材料中心和详情页解绑
- Application Detail 中可查看当前岗位绑定材料

### 3. Timeline / Notes editing

- Application Detail 中支持：
  - 新增事件
  - 编辑事件
  - 删除事件
  - 新增笔记
  - 编辑笔记
  - 删除笔记
- 详情页 timeline 改为事件 + 笔记的统一时间线展示
- 支持从详情页进入事件/笔记编辑流程
- 详情页新增事件后，Calendar 可直接看到

### 4. Offers

- `/offers` 从占位页变成真实 Offer 列表页
- 支持 Offer 新增 / 编辑 / 删除
- 支持按 decision status 过滤
- 支持多 Offer 对比
- 支持从 Application Detail 录入 / 编辑 Offer
- 保存 Offer 时自动把 application 状态同步为 `offer`
- 删除 Offer 时不自动回退 application 状态

### 5. Analytics

- `/analytics` 从占位页变成真实基础分析页
- 当前统计口径包括：
  - 总申请数
  - 各状态数量
  - 状态漏斗
  - 来源统计
  - 平均等待时长
  - 7 天内即将截止岗位数
  - offer / rejection 统计

## 关键工程实现

### 本地存储适配层

为避免被云存储阻塞，Phase 2 采用本地优先策略：

- 默认上传到 `public/uploads/materials/<userId>/`
- 数据库仍只持久化 `file_url`
- 删除材料时会尝试删除本地文件
- 目录已加入 `.gitignore`

这让项目在本地环境下可以直接跑通，同时保留未来切到 Supabase Storage 的空间。

### 详情页数据聚合

`getApplicationDetail` 已扩展为一次性返回：
- application 基础信息
- events
- notes
- materials
- offer

这样 `/applications/[id]` 可以作为单岗位的真实工作台，而不是只读展示页。

### 口径保持一致

本轮重点保证以下页面读的是同一套数据：
- Calendar
- Dashboard upcoming events
- Application Detail timeline
- Offers
- Analytics

避免出现“一个地方改了，另一个地方不刷新”或“同一指标口径不一致”的问题。

## 主要新增模块

- `features/events`
- `features/materials`
- `features/offers`
- `features/analytics`

同时扩展了：
- `features/applications/server/queries.ts`
- `features/applications/server/actions.ts`
- `features/applications/components/*`

## 验证结果

本轮已执行：

```bash
npm run typecheck
npm run lint
npm run build
npm run db:migrate
npm run db:seed
```

结果：
- `typecheck` 通过
- `lint` 通过
- `build` 通过
- `db:migrate` 通过
- `db:seed` 通过（已有 demo 数据时会跳过重复写入）

## 已知限制

- 本地 `npm run dev` / `npm run build` 在 Windows 环境下可能会遇到 `spawn EPERM` 或 `.next\trace` 文件锁；当前可通过清理残留 Next 进程或在提权环境下运行解决
- Calendar 当前只实现月视图，没有继续做周视图
- Offer 的回复截止日期目前不会自动派生出 `offer_response` 事件，若需要在 Calendar 中追踪，仍建议手动录入事件
- 材料上传当前以本地目录为主，还没有切到云存储
- 统计页以“实用口径优先”为原则，没有引入复杂图表库

## 阶段结论

Phase 2 已把 JobFlow 从“可运行 MVP”推进到“完整求职管理产品原型”：

- Calendar 可真实维护事件
- Materials 可真实维护并绑定岗位
- Application Detail 可真实维护 timeline / notes / materials / offer
- Offers 可真实管理和对比
- Analytics 可真实展示基础统计

在不进入 AI / Gmail / Automation 的前提下，当前项目已经达到“完整 Phase 2 原型可运行”的目标。
