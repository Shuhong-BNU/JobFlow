# Phase 1 交付记录

> **状态**：Phase 1 已冻结。范围内功能全部落地，对应 MVP 里程碑。后续新能力走 [Phase 2 规划](./phase-2-plan.md)；本文档仅维护"怎么验收、怎么跑、收尾时做了哪些修复"。

## 阶段定位

Phase 1 的目标很明确：交付一个能实际跑通的求职管理 MVP。

范围内：

- 注册、登录、退出登录
- 申请 CRUD
- 公司自动创建
- 8 列固定看板与拖拽改状态
- 列表页搜索、筛选、排序
- 仪表盘统计、截止日、事件、风险、最近更新
- 申请详情与时间线
- 统一的日期选择（`yyyy-mm-dd` / `yyyy-mm-dd HH:mm`，文本 + 日历弹层）
- 表单必填/选填视觉标识
- 中英双语切换，默认中文，cookie 持久化
- 明暗主题切换

范围外：

- Phase 2 功能正式实现
- AI 能力
- Gmail 集成
- 数据库 schema 扩展

## 当前交付内容

### 配置与基础设施

- Next.js 14 + TypeScript strict
- Tailwind CSS + 基础 UI 组件
- Drizzle ORM + Supabase Postgres
- NextAuth v5 + Credentials 登录
- React Query、Server Actions、RSC

### 业务能力

- 认证流程：注册、登录、退出登录
- 申请管理：创建、编辑、删除、详情查看
- 看板：8 个固定状态列，支持拖拽与乐观更新
- 列表：搜索、状态筛选、优先级筛选、排序
- 时间线：事件与备注
- 仪表盘：统计、截止日、事件、风险、最近更新

### 国际化

- 默认语言：中文
- 切换方式：cookie，不使用 URL locale prefix
- 语言切换器已接入落地页、认证页和登录后壳层
- 当前页面切换语言后会立即刷新并持久化

## 本地运行

推荐路径（内置自检 + 迁移 + seed）：

```bash
npm install
cp .env.example .env
npm run dev:doctor
npm run dev:setup
npm run dev:start
```

朴素路径：

```bash
npm install
cp .env.example .env
npm run db:push
npm run db:seed
npm run dev
```

默认地址：

```text
http://localhost:3001
```

演示账号：

```text
demo@jobflow.local / demo1234
```

## 环境变量说明

必须配置：

- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_URL`

说明：

- `AUTH_URL` 默认应为 `http://localhost:3001`
- 如果开发端口改动，`AUTH_URL` 也要同步修改
- Storage、OpenAI 相关变量在当前阶段可以留空

## 端口说明

开发脚本默认使用 `3001`，目的是避开常见的 `3000` 端口冲突。

如果需要改端口，可直接执行：

```bash
npx next dev -p 3002
```

同时把 `.env` 中的 `AUTH_URL` 改成：

```env
AUTH_URL=http://localhost:3002
```

## Smoke Test

Phase 1 的 12 步人工验收路径。合并了"新用户初见 → 核心业务流 → 退出回归"三段，适合 contributor 改动后快速自证未砸锅，也适合面试场景跑一遍。

1. 新用户可在 `/auth/sign-up` 注册并进入 `/app`
2. 演示账号（`demo@jobflow.local` / `demo1234`）可正常登录
3. 仪表盘显示统计、截止日、事件、风险和最近更新
4. 看板渲染正常，可拖拽更新状态
5. 刷新后状态保持一致
6. 新建申请时，新公司可自动创建
7. 详情页可新增事件和备注
8. 编辑页保存后修改生效
9. 删除申请后看板和列表同步移除
10. 列表页搜索、筛选、排序、清空全部正常
11. 中英切换后当前页立刻更新，刷新后语言保持
12. 退出登录后访问 `/app` 会跳回登录页

## 当前不包含

以下能力目前仍然不在 Phase 1 范围内：

- Calendar 正式功能
- Materials 上传与绑定
- Offers 正式模块
- Analytics 正式模块
- AI 功能
- Gmail 集成

相关路由和占位页保留，只用于稳定导航结构，不代表已经进入下一阶段。Phase 2 的四个模块（calendar / materials / offers / analytics）页面当前渲染「Phase 2 规划」占位内容，详见 [docs/phase-2-plan.md](./phase-2-plan.md)。

## 后续人工测试修复轮次（收尾）

Phase 1 冻结前进行了多轮人工测试与定点修复，关键收尾项：

- **日期输入统一方案**：废弃浏览器原生 `<input type="date">`（跨 locale 会出现 `yyyy-mm-日` 之类混杂）。改为自造组件：`components/date-picker.tsx` + `components/datetime-picker.tsx`，文本框规范 `yyyy-mm-dd` / `yyyy-mm-dd HH:mm`，右侧按钮弹出自造 `components/ui/calendar.tsx` 月视图；时分用 Select 粒度为 15 分钟。
- **必填 / 选填视觉**：表单公司名、岗位名称加红 `*`；截止日、投递日期、备注字段显式标注「选填」；时间线新增事件 / 备注沿用同一视觉规则。
- **文案回退**：中文界面 Offer 保持英文拼写（之前一轮将 Offer 改成「录用」被撤回）。
- **schema 交互陷阱收尾**：`optionalDate` 字段接受 `string | Date` 再 `transform`，配合 `ctx.addIssue` 抛稳定错误码，客户端再映射成当前语言文案；列表排序的 SQL `NULLS LAST` 从 Drizzle helper 写到 `sql` 原生表达式里。
- **导航冗余收敛**：Dashboard / Board / List 顶部 header 的「新建申请」按钮删除，统一从 Sidebar 入口。
