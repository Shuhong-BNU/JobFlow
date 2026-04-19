# JobFlow

JobFlow 是一个面向大学生求职季的求职申请管理看板 Web 应用。

它不是招聘网站，也不是自动海投工具。项目核心是把岗位申请、截止日期、时间线、材料版本、Offer 记录、基础分析和 AI 辅助能力统一到一个清晰、可演示、可扩展的产品骨架里。

当前仓库已经完成：
- Phase 1：可运行 MVP
- Phase 2：完整求职管理原型
- Phase 3：AI 增强层第一版

## 技术栈

- Next.js App Router
- TypeScript strict mode
- Tailwind CSS
- Auth.js Credentials
- Drizzle ORM
- PostgreSQL
- React Hook Form + Zod
- dnd-kit

## 当前已实现

### Phase 1
- 注册 / 登录 / 登出
- Dashboard 总览
- Applications Board 看板
- Application CRUD
- 搜索 / 筛选 / 拖拽改状态
- Application Detail 基础信息页

### Phase 2
- `/calendar` 月视图日历
- application events 新增 / 编辑 / 删除
- deadline 事件只读展示，并继续由 `applications.deadline_at` 自动同步
- `/materials` 材料中心
- 本地文件上传 + 外部文件链接两种材料来源
- 材料新增 / 编辑 / 删除
- 材料与岗位绑定 / 解绑
- Application Detail 中的 timeline / notes / materials / offer 维护能力
- `/offers` Offer 列表与对比
- `/analytics` 基础分析页

### Phase 3
- `/applications/new` 中的 AI JD 解析草稿
- `/applications/[id]` 中的 AI 下一步建议
- `/applications/[id]` 中的 AI 面试准备摘要
- OpenAI-compatible provider abstraction
- `ai_tasks` 调用记录
- response schema 校验
- provider 失败后的 fallback

## 项目结构

```text
app/                  路由与页面
components/           通用 UI 与共享组件
features/             按业务域拆分的模块
db/                   schema / migrations / seeds
lib/                  常量、标签、工具函数
server/               权限与服务端辅助逻辑
docs/phases/          各阶段实施记录
```

## 本机运行流程

### 1. 安装依赖

```bash
npm install
```

### 2. 准备环境变量

Next.js 运行时读取 `.env.local`，而当前 `db:seed` 这条 CLI 会读取 `.env`。

因此本地建议同时准备两份：

```powershell
Copy-Item .env.example .env.local
Copy-Item .env.example .env
```

至少确认下面两个变量可用：

```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/jobflow
AUTH_SECRET=jobflow-local-dev-secret
```

如果要启用真实 AI provider，再额外填写：

```env
OPENAI_API_KEY=
OPENAI_BASE_URL=
OPENAI_MODEL=
```

说明：
- 不配置 AI 环境变量时，Phase 3 仍然可用，但会走 fallback 规则
- AI 结果仍然只作为建议 / 草稿 / 预填充，不会直接写业务主表

### 3. 启动数据库

```bash
docker compose up -d
```

### 4. 执行迁移

```bash
npm run db:migrate
```

### 5. 导入演示数据

```bash
npm run db:seed
```

默认演示账号：
- `demo@jobflow.local`
- `Demo12345!`

### 6. 启动开发环境

```bash
npm run dev
```

默认访问地址通常是：
- [http://localhost:3000](http://localhost:3000)

如果 `3000` 端口被占用，请以终端实际输出为准。

### 一键启动

如果你在 Windows 本机上希望“一条命令跑起来”，现在可以直接执行：

```powershell
npm run start:local
```

它会自动完成：

1. 检查并补齐 `.env.local` / `.env`
2. 检查 Docker 是否就绪；若未启动，会尝试拉起 Docker Desktop
3. 启动 `docker compose`
4. 等待数据库端口就绪
5. 执行 `db:migrate`
6. 执行 `db:seed`
7. 启动 `next dev`

现在的一键启动会严格按顺序执行，前一步失败就停止，不会再出现：

- Docker 没启动，但后面继续跑
- 数据库没连上，但应用仍然继续启动
- 最后只有页面查询报错，排查点不清楚

如果你更习惯双击启动，也可以直接运行根目录的：

```text
start-local.bat
```

## 运行日志

### 实时日志

- 正常开发时，服务端日志会直接输出到终端
- 若使用 `npm run start:local`，终端输出会同时落盘
- 若数据库或 Docker 没准备好，脚本会直接在终端中止并给出失败原因

### 日志文件位置

- `.runtime/logs/dev-时间戳.log`

### 当前日志覆盖范围

目前已经补上了以下关键路径的运行日志：

- 认证缺失跳转
- Dashboard 总览查询
- Applications 列表 / 详情 / upcoming events 查询
- Application 创建 / 编辑 / 删除 / 拖拽改状态
- Timeline notes / events 的新增、编辑、删除
- Materials 相关增删改与绑定 / 解绑
- Offers 保存 / 删除
- AI 服务调用与 fallback

如果页面出现服务端异常，应用内错误页也会提示查看终端或 `.runtime/logs/`。

## 本地验证建议

### Phase 1 / Phase 2 主流程
1. 登录
2. 打开 `/dashboard`
3. 打开 `/applications`
4. 新建申请
5. 编辑申请
6. 打开详情页
7. 维护 timeline / materials / offer
8. 打开 `/calendar`、`/offers`、`/analytics`

### Phase 3 主流程
1. 打开 `/applications/new`
2. 粘贴 JD 文本
3. 生成 AI 解析结果
4. 应用到申请表单
5. 创建申请
6. 打开 `/applications/[id]`
7. 生成 AI 下一步建议
8. 生成 AI 面试准备摘要
9. 确认 AI 输出只作为建议展示，没有自动改状态、自动建事件或自动写 notes

## 当前关键路由

- `/`
- `/sign-in`
- `/sign-up`
- `/dashboard`
- `/applications`
- `/applications/new`
- `/applications/[id]`
- `/applications/[id]/edit`
- `/calendar`
- `/materials`
- `/offers`
- `/analytics`
- `/settings`

## 数据模型范围

当前仓库已落地或已预留的表：

- `users`
- `user_credentials`
- `companies`
- `applications`
- `application_events`
- `materials`
- `application_materials`
- `application_notes`
- `offers`
- `ai_tasks`
- `mail_connections`
- `mail_events`

## 当前冻结边界

- Auth 保持 Auth.js Credentials
- 看板 8 列固定，不开放自定义
- `applications` 是主聚合对象
- 一个 `application` 最多一个 `offer`
- `applications.deadline_at` 与 `application_events.deadline` 自动同步模型保持不变
- AI 只能作为辅助层，不能反向改变产品主结构
- 当前阶段不进入 Gmail / Automation

## 材料存储说明

Phase 2 的材料上传默认使用本地存储适配层：

- 上传目录：`public/uploads/materials/<userId>/`
- 数据库存储：`materials.file_url`
- 该目录已加入 `.gitignore`

## AI 行为说明

Phase 3 当前只做三件事：

1. JD 自动解析
2. AI 下一步建议
3. AI 面试准备摘要

AI 输出默认只用于：
- 表单预填充
- 建议展示
- 准备提纲

AI 不会直接：
- 创建 application
- 修改 application 状态
- 创建 event
- 写 note
- 改 offer

## 实施记录

- [Phase 1 记录](./docs/phases/phase-1.md)
- [Phase 1 运行层验收](./docs/phases/phase-1-runtime-validation.md)
- [Phase 2 记录](./docs/phases/phase-2.md)
- [Phase 2 运行层验收](./docs/phases/phase-2-runtime-validation.md)
- [Phase 3 记录](./docs/phases/phase-3.md)
- [Phase 4 计划](./docs/phases/phase-4.md)
