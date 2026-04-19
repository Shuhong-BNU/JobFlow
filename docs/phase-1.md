# Phase 1 交付记录

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

## 验收清单

1. 新用户可在 `/auth/sign-up` 注册并进入 `/app`
2. 演示账号可正常登录
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

相关路由和占位页保留，只用于稳定导航结构，不代表已经进入下一阶段。
