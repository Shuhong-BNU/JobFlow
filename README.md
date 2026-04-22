# <div align="center">JobFlow</div>

<p align="center">
  <strong>求职进度，一板掌握。</strong><br>
  面向个人求职者的流程管理工作台
</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-14.2-black?logo=next.js">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white">
  <img alt="Tailwind" src="https://img.shields.io/badge/Tailwind-3.4-38BDF8?logo=tailwindcss&logoColor=white">
  <img alt="Phase" src="https://img.shields.io/badge/Phase_1-MVP-22C55E">
  <img alt="Docs" src="https://img.shields.io/badge/Docs-中文_/_EN-0EA5E9">
</p>

<p align="center">
  <a href="./README.en.md">English README</a>
</p>

<!-- TODO: docs/assets/screenshots/hero.png -->

---

## Overview

JobFlow 把一条求职流程收进一个清晰可追踪的工作台里：
**Wishlist → Applied → OA → Interview → HR → Offer → Rejected → Archived**。

它聚焦单人求职场景，提供 Dashboard、看板、列表、详情、时间线五种核心视图，支持登录注册、演示账号、本地种子数据、中英双语一键切换，以及以 cookie 持久化的默认中文体验。

当前主线以 **Phase 1 MVP + 修复与体验优化** 为准。本轮不包含 Phase 2、AI、Gmail，也不扩展数据库 schema。阶段记录见 [docs/phase-1.md](./docs/phase-1.md)。

## Live Demo

公开部署地址待补。想自己起一个 demo 站？见 [部署指南](./docs/deployment.md)。

---

## ✨ 核心特点

- `📌` 一条求职流程贯穿到底：从意向到归档，状态切换和记录更新都围绕同一条申请展开。
- `📊` 五种视图互相补位：Dashboard 看全局，Board 推进流程，List 管理筛选，Detail 查单条，Timeline 追踪关键节点。
- `🌐` 中英一键切换：默认中文，按钮单击直接切换，cookie 持久化，不使用 URL locale prefix。
- `🔐` 本地可直接演示：支持 demo 账号登录，也支持新账号注册和注册后继续登录。
- `🛠` 开发环境更顺手：`dev:doctor`、`dev:setup`、`dev:start` 覆盖环境检查、初始化和日常启动。

---

## Screenshots

<!-- TODO: docs/assets/screenshots/dashboard-light-zh.png / board-light-zh.png / list-light-zh.png / detail-light-zh.png / timeline-light-zh.png / landing-light-zh.png -->

| Dashboard | Board | List |
|---|---|---|
| <sub>`docs/assets/screenshots/dashboard-light-zh.png`</sub> | <sub>`docs/assets/screenshots/board-light-zh.png`</sub> | <sub>`docs/assets/screenshots/list-light-zh.png`</sub> |

| Detail | Timeline | Landing |
|---|---|---|
| <sub>`docs/assets/screenshots/detail-light-zh.png`</sub> | <sub>`docs/assets/screenshots/timeline-light-zh.png`</sub> | <sub>`docs/assets/screenshots/landing-light-zh.png`</sub> |

### 截图建议

- `landing-light-zh.png`：落地页首屏，保留标题、主按钮、语言切换入口。
- `sign-in-light-zh.png`：登录页完整表单，适合展示可登录链路和语言按钮位置。
- `sign-up-light-zh.png`：注册页完整表单，适合展示注册流程可用。
- `dashboard-light-zh.png`：统计卡片、近期提醒、最近活动同时出镜，作为总览主图。
- `board-light-zh.png`：至少 5 列以上的看板，卡片数量保持分布，能看出流程推进感。
- `list-light-zh.png`：搜索、筛选、排序和表格主体同屏，突出结构化管理体验。
- `detail-light-zh.png`：申请基础信息、状态、时间节点同屏，避免只截局部。
- `timeline-light-zh.png`：事件与备注按时间展开，突出过程可追溯。
- `language-toggle.webp`：同一页面中英切换前后，优先短动图；如果不录动图，可做一张对比拼图。

完整命名规范、分辨率建议和补图清单见 [docs/assets/README.md](./docs/assets/README.md)。

---

## Tech Stack

| 分组 | 选型 |
|---|---|
| **Frontend** | Next.js 14 App Router · TypeScript strict · Tailwind CSS · Radix UI primitives · dnd-kit |
| **Data** | React Server Components · Server Actions · React Query · zod |
| **Persistence** | Supabase Postgres · Drizzle ORM · drizzle-kit |
| **Auth** | NextAuth v5 · Credentials Provider · JWT session |
| **Tooling** | tsx · dotenv · ESLint · `tsc --noEmit` · `scripts/dev.ts` |

设计取舍、环境变量说明和部署方式见 [docs/faq.md](./docs/faq.md) 与 [docs/deployment.md](./docs/deployment.md)。

---

## Quick Start

推荐路径：

```bash
npm install
cp .env.example .env
npm run dev:doctor
npm run dev:setup
npm run dev:start
```

默认地址：

```text
http://localhost:3001
```

执行 `db:seed` 后的默认演示账号：

```text
demo@jobflow.local / demo1234
```

如果 `dev:doctor` 报错，优先检查以下字段：

- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_URL`

完整本地运行说明见 [docs/deployment.md](./docs/deployment.md)。

---

## 项目结构

README 先列核心目录和关键文件；更完整的结构说明见 [docs/project-structure.md](./docs/project-structure.md)。

```text
app/
├─ layout.tsx                              # 根布局，按 cookie 设置语言和基础 metadata
├─ page.tsx                                # Landing 页面
├─ providers.tsx                           # Theme / I18n 等全局 Provider
├─ auth/
│  ├─ sign-in/page.tsx                     # 登录页
│  ├─ sign-in/sign-in-form.tsx             # 登录表单、错误提示、跳转处理
│  ├─ sign-up/page.tsx                     # 注册页
│  └─ sign-up/sign-up-form.tsx             # 注册表单、创建账号、自动登录链路
├─ api/
│  ├─ auth/[...nextauth]/route.ts          # NextAuth 路由入口
│  ├─ auth/sign-up/route.ts                # 注册接口
│  └─ dev/ready/route.ts                   # 本地环境健康检查
└─ app/
   ├─ layout.tsx                           # 登录后的应用框架
   ├─ page.tsx                             # Dashboard
   ├─ board/page.tsx                       # 看板视图
   ├─ list/page.tsx                        # 列表视图
   └─ applications/                        # 新建、详情、编辑

components/
├─ app-sidebar.tsx                         # 左侧导航
├─ app-topbar.tsx                          # 顶部栏
├─ language-switcher.tsx                   # 中英一键切换按钮
├─ coming-soon.tsx                         # 占位页通用组件
├─ empty-state.tsx                         # 空状态
├─ status-badge.tsx                        # 状态标签
└─ ui/                                     # 通用基础组件

features/
└─ applications/
   ├─ actions.ts                           # 申请相关 Server Actions
   ├─ queries.ts                           # 看板、列表、详情、统计查询
   ├─ schema.ts                            # 表单和输入校验
   └─ components/                          # ApplicationCard / Form / Timeline 等业务组件

lib/
├─ auth.ts                                 # 认证逻辑与登录校验
├─ auth.config.ts                          # NextAuth 配置
├─ auth-helpers.ts                         # requireUser 等辅助方法
├─ date.ts                                 # 中英日期格式化
├─ runtime-env.ts                          # 环境变量与数据库可用性检查
├─ runtime-health-client.ts                # 客户端启动前检查
└─ i18n/
   ├─ config.ts                            # 语言配置
   ├─ actions.ts                           # 切换语言的 server action
   ├─ client.tsx                           # I18n Provider 与 hook
   ├─ server.ts                            # 服务端字典读取
   └─ dictionaries/
      ├─ zh.ts                             # 中文文案真源
      └─ en.ts                             # 英文字典镜像

db/
├─ schema.ts                               # Drizzle schema
├─ client.ts                               # 数据库连接
├─ seed.ts                                 # 演示数据
└─ migrations/                             # 迁移记录

scripts/
└─ dev.ts                                  # doctor / setup / start

docs/
├─ phase-1.md                              # Phase 1 中文记录
├─ phase-1.en.md                           # Phase 1 英文记录
├─ deployment.md                           # 部署说明
├─ deployment.en.md                        # Deployment guide
└─ assets/README.md                        # 截图与静态资源规范
```

---

## 文档导航

**开始使用**
- [README 英文版](./README.en.md)
- [部署指南](./docs/deployment.md)
- [FAQ](./docs/faq.md)

**项目文档**
- [项目结构说明](./docs/project-structure.md)
- [Roadmap](./docs/roadmap.md)

**阶段记录**
- [Phase 1](./docs/phase-1.md)
- [Phase 2 规划（历史）](./docs/phase-2-plan.md)
- [Next.js 升级评估](./docs/nextjs-upgrade-assessment.md)

---

## Scripts

| 脚本 | 说明 |
|---|---|
| `npm run dev` | 启动开发服务器，端口 `3001` |
| `npm run dev:doctor` | 检查 `.env`、依赖、数据库可达性 |
| `npm run dev:setup` | 仅在需要时执行初始化、迁移和 seed |
| `npm run dev:start` | 推荐入口，先检查再启动开发环境 |
| `npm run build` | 生产构建 |
| `npm start` | 启动生产服务，端口 `3001` |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript 类型检查 |
| `npm run db:generate` | 生成 Drizzle migration |
| `npm run db:push` | 推送 schema 到数据库 |
| `npm run db:studio` | 打开 Drizzle Studio |
| `npm run db:seed` | 注入演示数据 |

---

## 已知边界

- 当前交付范围以 Phase 1 可用闭环为主，不继续扩展 Phase 2、AI、Gmail。
- 单用户定位，不包含团队协作、招聘侧 ATS、自动投递、自动邮件处理。
- `Live demo` 地址仍待补充，当前以本地运行和自建演示环境为主。
- 仓库暂未附带 `LICENSE` 文件，授权方式仍待确定。

---

## License

License: **TBD**。在许可证明确前，使用、修改或分发前请先确认授权范围。
