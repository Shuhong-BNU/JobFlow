# Deployment

JobFlow 的部署策略遵循两条原则：开发环境"一键自检起跑"，生产环境"改两个环境变量就能上"。本文按场景走，不掺开发者 FAQ —— 那些在 [faq.md](./faq.md)。

## Local Development

**前置**：Node 18+（推荐 20 LTS）、npm 9+、可访问的 Postgres（Supabase 或本地均可）。

三件套脚本：

```bash
npm run dev:doctor    # 检查 .env / DATABASE_URL 可达性
npm run dev:setup     # 安装依赖 + db:push + db:seed（仅首次或 DATABASE_URL 变更时跑）
npm run dev:start     # 等同 dev:setup + next dev
```

朴素命令作 fallback（三件套挂掉时用）：

```bash
npm install
cp .env.example .env   # 填入真实值
npm run db:push
npm run db:seed
npm run dev
```

默认端口 **3001**。原因与修改方式见 [faq.md#端口](./faq.md)。

首次启动后默认带一份 demo 数据，账号：

```
demo@jobflow.local / demo1234
```

`dev:setup` 会在 `.jobflow/dev-state.json` 记录"当前 DATABASE_URL 已初始化过"，下次 `dev:start` 会跳过 `db:push` 与 `db:seed`。切换数据库时自动重新跑。

---

## Environment Variables

`.env.example` 把变量按阶段分成三段：Phase 1 必填、Phase 2 预留、Phase 3 预留。

| 变量 | 必填 | 用途 | 示例 |
|---|---|---|---|
| `DATABASE_URL` | Phase 1 | Postgres 连接串，推荐直连 5432 | `postgresql://postgres:...@db.<ref>.supabase.co:5432/postgres?sslmode=require` |
| `AUTH_SECRET` | Phase 1 | NextAuth 会话签名密钥，32+ 字节随机串 | 用 `openssl rand -base64 32` 生成 |
| `AUTH_URL` | Phase 1 | NextAuth 回调基础 URL，必须匹配实际访问域名 | 本地 `http://localhost:3001`；生产 `https://<your-domain>` |
| `SUPABASE_URL` | Phase 2 | Supabase 项目 URL，开启 Storage 时需要 | `https://<ref>.supabase.co` |
| `SUPABASE_ANON_KEY` | Phase 2 | 公开匿名 key | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Phase 2 | 服务端 key（绝不暴露到客户端） | `eyJhbGciOi...` |
| `SUPABASE_STORAGE_BUCKET` | Phase 2 | Materials 使用的 bucket 名 | `materials` |
| `OPENAI_API_KEY` | Phase 3 | AI 能力凭证 | `sk-...` |
| `OPENAI_BASE_URL` | Phase 3 | 自建/代理网关用，默认官方 | `https://api.openai.com/v1` |
| `OPENAI_MODEL` | Phase 3 | 默认模型 | `gpt-4o-mini` |

Phase 2 / 3 变量在 Phase 1 阶段保持空字符串即可，启动流程不会校验。

---

## Supabase Setup

1. 在 [supabase.com](https://supabase.com) 建项目，选与用户地理接近的 region。
2. Settings → Database → Connection string 拿两条串：
   - **Direct connection (5432)**：迁移、Drizzle Studio、Seed 脚本优先用这条，支持 prepared statements。
   - **Connection pooler / Session (6543)**：长驻服务（如 Vercel Serverless）优先用这条，注意加 `?pgbouncer=true`。
3. 填进 `.env` 的 `DATABASE_URL`，末尾保留 `?sslmode=require`。
4. 跑：

   ```bash
   npm run db:push     # 推 schema（drizzle-kit 会按当前 schema 直接改库）
   npm run db:seed     # 插入 demo 账号与示例申请
   ```

5. 需要可视化数据时：`npm run db:studio`。

**IPv4 / IPv6 陷阱**：Supabase 直连域名默认走 IPv6，部分家庭宽带不通。现象是 `dev:doctor` 报 `db_unreachable` 但 `ping` 解析正常。对策是切到 Pooler 串（IPv4 可达），或在路由器上启用 IPv6。

---

## Production Build

```bash
npm run build   # 产出 .next/ 静态 + server bundle
npm start       # 启动 Next.js 生产服务，默认端口 3001
```

生产环境必须：

- `AUTH_URL` 指向正式域名，带 `https://`。本地开发用的 `http://localhost:3001` 会导致登录回调失败。
- `AUTH_SECRET` 与开发环境**不共用**，单独生成一条。
- `DATABASE_URL` 使用 Pooler 串（6543），除非部署在长驻节点（VPS / Docker）。

---

## Deploy to Vercel

JobFlow 使用 Next.js 14 App Router，天然适配 Vercel。

1. **Import Git Repository**：Vercel → Add New... → Project → 选本仓库。
2. **Environment Variables**：在 Project Settings → Environment Variables 里填 `.env.example` 的 Phase 1 三条必填。Preview / Production 环境分别配。
3. **Build Command**：默认 `next build` 即可。
4. **Root Directory**：保持仓库根。
5. **Node.js Version**：≥ 18.17，推荐 20。
6. 部署完成后，Vercel 分配的域名（或绑定的自定义域）要反写进 `AUTH_URL` 再重新部署一次。

> 本仓库当前未开放 Vercel template，所以 README 不放 "Deploy with Vercel" 按钮。公开后会补。

---

## Public demo deployment

把 JobFlow 部署成"任何人点进来都能看"的公开 demo，和生产环境不同——后者默认单用户、默认信任登录者。Demo 场景下要额外注意：

**共用 demo 账号**。`db:seed` 生成的 `demo@jobflow.local / demo1234` 已经在 seed 里写成可重复跑的 upsert。公开分享时所有访客都用这一对凭证登录，数据在同一张表里互相可见、互相覆盖 —— JobFlow 当前没有 multi-tenant 隔离，这是刻意选择（see [faq.md#为什么 demo 账号写在 README 里](./faq.md)）。别把 demo 实例连到真实业务库，起单独的 Supabase project。

**数据漂移与定期重置**。访客会新增 / 修改 / 删除 demo 数据。想让下一位访客看到"干净的 demo"，两种方式：

1. 按需手动重置：`DATABASE_URL=<demo-db> npm run db:seed` —— seed 里已经先 `delete where user_id = demo.id` 再插入，幂等安全。
2. 自动定时重置：Vercel Cron + 一条 API route 调用同一段 seed 逻辑。Phase 2C 以前不做这个 feature，需要的自己接。

**注册开关**。public demo 理论上应关闭注册（防止陌生邮箱污染库），但 JobFlow 当前没提供注册开关；要彻底堵住就在 `app/auth/sign-up` 路由加 `notFound()` 发行一份 fork 分支，不合并回主干。接受"注册开着"也可以，定期重置能覆盖大部分情况。

**Vercel + Supabase Pooler 组合**。public demo 的负载模式更接近 Serverless（随请求发起连接），`DATABASE_URL` 用 Pooler 串（6543 + `?pgbouncer=true`）能避免 prepared statement 报错。直连 5432 留给本地迁移与 Seed。

**成本**。Vercel Hobby（免费）+ Supabase Free（500 MB）足以承载低流量 public demo。Seed 数据占几十 KB，可以放心重置。

---

## Self-hosted

任意 Node 18+ 宿主都可跑：

- 拉代码 → `npm ci` → `npm run build` → `npm start`。
- 用 `pm2` / `systemd` / Docker 守护进程。
- 反代（Nginx / Caddy）把 443 转到 3001，并设好 `X-Forwarded-*` 头。
- 数据库可继续用 Supabase；也可以自建 Postgres，把 `DATABASE_URL` 指过去即可。

未提供开箱即用的 Dockerfile —— 用户需求差异太大（是否同机跑 Postgres、是否挂代理），目前由使用者按 Next.js 官方 `output: "standalone"` 策略自行打包。

---

## Common Errors

| 现象 | 成因 | 处理 |
|---|---|---|
| 登录跳转回来就 404 / `CallbackRouteError` | `AUTH_URL` 与访问域名不一致 | 把 `AUTH_URL` 改成浏览器里真实看到的 scheme + host + port |
| `dev:doctor` 报 `db_unreachable` 但 ping 通 | 家庭宽带无 IPv6，Supabase 直连走 v6 | 切 Pooler 串（6543）或启用路由器 IPv6 |
| `db:push` 卡住/超时 | Pooler 模式下 drizzle-kit 不友好 | 切到 5432 直连串执行 db:push，跑完再换回 Pooler |
| `db:seed` 报 unique 冲突 | 已跑过一次，再跑会重复插 demo 数据 | 要么跳过，要么手动在 DB 里清 users/applications 再 seed |
| `EADDRINUSE :3001` | 另一个 Node 进程占着端口 | `npx kill-port 3001` 或换端口（`next dev -p 3002`） |
| `bcryptjs` 构建失败 | 用了原生 `bcrypt` 的宿主误装 | 本项目固定用纯 JS 版 `bcryptjs`，卸载 `bcrypt` 并重装依赖 |
| Vercel 连 Supabase 报 `prepared statement` 错 | Serverless + pooler + prepared statements 三者冲突 | 在 `DATABASE_URL` 里加 `?pgbouncer=true`，或在 postgres client 层关闭 prepared |
| `npm run build` 报 `.next/trace` EPERM | dev server 还开着占文件 | 停 dev server 再 build |
