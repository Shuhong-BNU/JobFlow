# Phase 1 记录

## 已交付
- Next.js App Router + TypeScript + Tailwind 工程骨架。
- `users / user_credentials / companies / applications / application_events / application_notes / offers` 等 Drizzle schema。
- Auth.js 邮箱密码注册 / 登录 / 登出。
- Dashboard、Applications Board、Application Detail、New/Edit form。
- 搜索、筛选、拖拽改状态、删除与详情查看。
- Phase 2/3/4 路由占位、README、`.env.example`、seed 脚本。

## 关键冻结点
- `applications` 是主聚合根，邮件与 AI 只能围绕它扩展。
- `application_status`、`event_type` 已冻结，不在 Phase 1 随意改名。
- `materials` 未来坚持“一条记录 = 一个具体版本”。
- `offers` 未来继续保持“一条 application 最多一个 offer”。

## 本地验证
1. 复制 `.env.example` 为 `.env.local`。
2. 启动 Postgres：`docker compose up -d`。
3. 生成 migration：`npm run db:generate`。
4. 执行迁移：`npm run db:migrate`。
5. 导入假数据：`npm run db:seed`。
6. 启动开发环境：`npm run dev`。

## 还差什么
- Calendar / Materials / Offers Compare / Analytics 正式内容。
- Notes / Events 的可编辑能力。
- 更强的所有权约束策略与外部服务集成。
