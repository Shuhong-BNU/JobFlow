# JobFlow

[English README](./README.en.md)

一个专注于求职流程管理的工作台。申请、截止日、面试、时间线和 Offer 线索，集中放在同一块看板里。

当前仓库处于 **Phase 1 MVP**。已完成认证、申请 CRUD、看板拖拽、列表筛选、详情页与仪表盘；**不包含** Phase 2 功能、AI 功能和 Gmail 集成。

## 当前能力

- 邮箱注册、登录、退出登录
- 申请 CRUD，自动创建公司记录
- 8 列固定看板，支持拖拽更新状态
- 列表页搜索、筛选、排序
- 仪表盘：状态统计、近期截止日、事件、风险提醒、最近更新
- 申请详情：概览 + 时间线（事件、备注）
- 中英双语切换，默认中文，使用 cookie 持久化
- 明暗主题切换

## 技术栈

- **框架：** Next.js 14（App Router）+ TypeScript（strict）
- **UI：** Tailwind CSS + shadcn/ui 风格基础组件
- **数据流：** React Server Components + Server Actions + React Query
- **认证：** NextAuth v5（Credentials / JWT Session）+ Drizzle Adapter
- **数据库：** Supabase Postgres
- **ORM：** Drizzle ORM + drizzle-kit
- **拖拽：** dnd-kit

## 本地运行

### 1. 环境要求

- Node.js 18.18+，推荐 20+
- 一个可用的 Supabase 项目

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
cp .env.example .env
```

至少需要填写以下变量：

- `DATABASE_URL`
  指向 Supabase Postgres 的连接串。Phase 1 开发默认使用直连端口 `5432`。
- `AUTH_SECRET`
  可用 `openssl rand -base64 32` 生成。
- `AUTH_URL`
  默认是 `http://localhost:3001`。

其余 Supabase Storage、OpenAI 相关变量可以留空。当前阶段不会启用。

### 4. 初始化数据库

```bash
npm run db:push
npm run db:seed
```

种子数据会创建一个演示账号：

```text
demo@jobflow.local / demo1234
```

### 5. 启动开发环境

```bash
npm run dev
```

打开 [http://localhost:3001](http://localhost:3001)。

## 端口说明

- 开发和启动脚本默认固定使用 `3001`
- 这样可以避开常见的 `3000` 冲突
- 如果改用其他端口，需要同时更新 `.env` 中的 `AUTH_URL`

示例：

```bash
npx next dev -p 3002
```

对应：

```env
AUTH_URL=http://localhost:3002
```

## 最短启动路径

```bash
npm install
cp .env.example .env
npm run db:push
npm run db:seed
npm run dev
```

## 验收方式

建议按下面顺序做一轮本地 smoke test：

1. 在 `/auth/sign-up` 注册新账号，成功进入 `/app`
2. 从头像菜单退出登录，再使用 `demo@jobflow.local / demo1234` 登录
3. 检查 `/app` 仪表盘是否显示统计、截止日、事件、风险和最近更新
4. 打开 `/app/board`，确认 8 列看板正常渲染
5. 拖动任意卡片到新列，刷新后状态仍保持
6. 在 `/app/applications/new` 新建一条申请，确认新公司可自动创建
7. 打开详情页，新增一条事件和一条备注
8. 进入编辑页，修改状态、优先级或截止日并保存
9. 在列表页测试搜索、筛选、排序和清空
10. 切换中英文，确认当前页面文案立即更新，刷新后语言保持不变
11. 切换明暗主题，确认界面正常
12. 退出登录后直接访问 `/app`，确认会被重定向到登录页

## Phase 1 边界

当前明确 **不包含**：

- Calendar / Materials / Offers / Analytics 的正式功能实现
- AI 功能
- Gmail 集成
- 数据库 schema 扩展

这些页面当前保留为占位入口，用于稳定导航结构，不代表已进入下一阶段开发。

## 常用脚本

| 脚本 | 说明 |
| --- | --- |
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建 |
| `npm run lint` | 运行 ESLint |
| `npm run typecheck` | 运行 TypeScript 类型检查 |
| `npm run db:generate` | 生成 Drizzle migration |
| `npm run db:push` | 推送 schema 到数据库 |
| `npm run db:studio` | 打开 Drizzle Studio |
| `npm run db:seed` | 注入演示数据 |

## 目录结构

```text
app/                    Next.js App Router 路由
  page.tsx              落地页
  auth/                 登录 / 注册
  api/auth/             NextAuth 与注册接口
  app/                  登录后应用壳层
    page.tsx            仪表盘
    board/              看板
    list/               列表
    applications/       新建 / 详情 / 编辑
features/               业务域代码（query、action、schema、组件）
components/             共享组件与应用壳层
components/ui/          基础 UI 组件
db/                     Drizzle schema、客户端、seed
lib/                    认证、i18n、日期、枚举等公共能力
docs/                   阶段文档
```

## 相关文档

- [English README](./README.en.md)
- [Phase 1 文档](./docs/phase-1.md)
- [Phase 1 English Doc](./docs/phase-1.en.md)
