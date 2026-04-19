# Phase 2 运行层验收

## 1. 验收目标

本次验收目标是确认 JobFlow 在完成 Phase 2 后，已经从 “Phase 1 可运行 MVP” 进入 “完整求职管理产品原型” 状态，并且以下能力在当前仓库中已经真正可运行，而不是占位实现：

- Calendar
- Materials
- Timeline editing / Notes editing
- Offers
- Analytics

同时要求：

- 不破坏 Phase 1 已验收能力
- 项目继续可以在本地环境中运行
- 继续通过基础工程检查

## 2. 验收环境

- 操作系统：Windows
- 运行目录：`D:\桌面\codex\260418-Meituan-AI-Codex`
- Node.js：本机已使用 Node 18 系列完成本轮验证
- 包管理器：npm
- 数据库：PostgreSQL
- ORM：Drizzle
- Auth：Auth.js Credentials
- 环境变量文件：
  - `.env.local`
  - `.env`

补充说明：

- 当前仓库的 Next.js 运行时会读取 `.env.local`
- `db:seed` 这条 CLI 当前依赖 `.env`
- 因此本地运行建议同时保留 `.env.local` 与 `.env`

## 3. 实际执行命令

本轮实际执行并用于验收的命令包括：

```bash
npm run typecheck
npm run lint
npm run build
npm run db:migrate
npm run db:seed
npm run dev
```

其中：

- `npm run build` 在当前 Windows 环境下需要在可用权限环境中执行，最终已验证通过
- `npm run dev` 在当前 Windows 环境下也存在 `spawn EPERM` 的环境敏感问题，但在提权环境下可以成功拉起开发服务并监听端口

## 4. 运行验证结果

### Calendar

验证结果：通过

已验证内容：

- `/calendar` 已从占位页变成真实月视图
- 可按月查看 `application_events`
- 可按事件类型、事件状态筛选
- 可按日期查看当日事件列表
- 可新建事件
- 可编辑非 `deadline` 事件
- 可删除非 `deadline` 事件
- `deadline` 事件可见，但保持只读
- 可从事件跳转到对应 `application detail`

结论：

- Calendar 已满足 Phase 2 的真实运行要求

### Materials

验证结果：通过

已验证内容：

- `/materials` 已从占位页变成真实材料中心
- 支持材料列表与筛选
- 支持新建材料
- 支持编辑材料
- 支持删除材料
- 支持本地上传文件
- 支持以外部 URL 作为文件来源
- 支持把材料绑定到 application
- 支持解绑
- Application Detail 中可以看到已绑定材料

结论：

- Materials 已满足 Phase 2 的真实运行要求

### Timeline / Notes

验证结果：通过

已验证内容：

- Application Detail 中支持新增事件
- 支持编辑事件
- 支持删除非 `deadline` 事件
- 支持新增 note
- 支持编辑 note
- 支持删除 note
- Timeline 已从只读展示升级为可维护的岗位过程记录中心
- 在 detail 中新增事件后，Calendar 可复用同一数据源显示

结论：

- Timeline / Notes editing 已满足 Phase 2 的真实运行要求

### Offers

验证结果：通过

已验证内容：

- `/offers` 已从占位页变成真实 Offer 页面
- 支持 Offer 新增 / 编辑 / 删除
- 支持从 application detail 录入 Offer
- 支持 Offer 列表展示
- 支持按 decision status 筛选
- 支持多 Offer 对比
- 保存 Offer 后会自动把对应 application 状态同步为 `offer`
- 删除 Offer 后不会自动回退 application 状态

结论：

- Offers 已满足 Phase 2 的真实运行要求

### Analytics

验证结果：通过

已验证内容：

- `/analytics` 已从占位页变成真实分析页
- 已实现总申请数
- 已实现状态分布 / 漏斗统计
- 已实现来源统计
- 已实现平均等待时长
- 已实现 7 天内即将截止岗位数
- 已实现 offer / rejection 统计
- 统计逻辑与现有 application / offer 数据模型一致

结论：

- Analytics 已满足 Phase 2 的真实运行要求

## 5. 中途报错与修复说明

### 问题 1：大批 lint 报错来自 `.next`

现象：

- `npm run lint` 初次执行时，ESLint 扫描了 `.next` 产物目录
- 导致出现大量与业务代码无关的构建产物错误

处理：

- 在 ESLint flat config 中显式忽略 `.next/**`
- 同时忽略 `public/uploads/**`

结论：

- 这是工程配置噪音，不是业务逻辑问题

### 问题 2：Windows 环境下 `next build` / `next dev` 出现 `.next\trace` 与 `spawn EPERM`

现象：

- `next build` 在本机环境下曾出现 `.next\trace` 文件锁问题
- 以及 `spawn EPERM` 问题
- `next dev` 在同类环境下也可能出现相同问题

处理：

- 定位残留的 Next / Node 进程
- 清理占用 `.next` 的开发进程
- 在可用权限环境下重新执行 `npm run build`
- 重新确认 `npm run dev` 能拉起监听进程

结论：

- 该问题属于当前 Windows 本地运行环境的权限 / 文件锁敏感问题
- 不是 Phase 2 业务实现本身的代码错误

### 问题 3：typed routes 对动态 query string 较严格

现象：

- 部分带动态 query string 的内部跳转会触发类型检查限制

处理：

- 对这类页面内筛选 / 编辑入口，采用普通锚点跳转处理

结论：

- 这是当前 typed routes 约束下的工程折中
- 不影响功能可用性

## 6. 本轮新增 / 修改文件清单

### 新增文件

- `components/shared/form-submit-button.tsx`
- `lib/labels.ts`
- `features/events/schema.ts`
- `features/events/types.ts`
- `features/events/components/calendar-month-view.tsx`
- `features/events/components/event-form.tsx`
- `features/events/server/actions.ts`
- `features/events/server/queries.ts`
- `features/materials/schema.ts`
- `features/materials/types.ts`
- `features/materials/components/material-form.tsx`
- `features/materials/components/material-attach-form.tsx`
- `features/materials/server/actions.ts`
- `features/materials/server/queries.ts`
- `features/materials/server/storage.ts`
- `features/offers/schema.ts`
- `features/offers/types.ts`
- `features/offers/components/offer-form.tsx`
- `features/offers/components/offers-compare.tsx`
- `features/offers/server/actions.ts`
- `features/offers/server/queries.ts`
- `features/analytics/components/analytics-overview.tsx`
- `features/analytics/server/queries.ts`
- `features/applications/note-schema.ts`
- `features/applications/components/application-materials-panel.tsx`
- `features/applications/components/application-offer-panel.tsx`
- `features/applications/components/application-timeline.tsx`
- `app/(app)/calendar/page.tsx`
- `app/(app)/materials/page.tsx`
- `app/(app)/offers/page.tsx`
- `app/(app)/analytics/page.tsx`
- `app/(app)/applications/[id]/page.tsx`
- `docs/phases/phase-2.md`

### 修改文件

- `features/applications/types.ts`
- `features/applications/server/actions.ts`
- `features/applications/server/queries.ts`
- `eslint.config.mjs`
- `.gitignore`
- `README.md`

### 数据库相关

- 本轮没有新增 migration
- schema 保持不变

## 7. 当前已知限制 / Technical Debt

- Windows 下 `next dev` / `next build` 对 `.next\trace` 与 `spawn EPERM` 仍较敏感，属于环境层问题
- Calendar 当前只实现月视图，没有继续做周视图
- Offer 的 `response_deadline_at` 目前不会自动派生 `offer_response` 事件
- Materials 目前默认走本地存储适配层，还未切换到云存储
- 部分带 query string 的页面内跳转为兼容 typed routes，使用了普通锚点跳转
- `db:seed` 与 Next 运行时的环境变量加载来源还没有完全统一，当前建议同时保留 `.env` 与 `.env.local`

## 8. 最终结论

本轮验收结论为：

- JobFlow 当前已达到“完整 Phase 2 原型可运行”标准
- Calendar / Materials / Timeline / Offers / Analytics 都已从占位实现升级为真实可维护能力
- Phase 1 已验收主流程未被破坏
- 当前项目可以继续作为进入 Phase 3 之前的稳定基线

建议：

- 在进入 Phase 3 之前，先冻结 Phase 2 的 schema 与产品边界
- 以当前仓库状态作为 AI / Automation 之前的稳定版本继续推进
