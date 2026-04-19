# Phase 1 Runtime Validation

## 1. 验收目标

本次验收仅针对 Phase 1 的“本地可运行 MVP”目标，不进入 Phase 2，也不扩展新功能。

验收目标包括：

- 本地数据库可实际启动
- 数据库迁移可实际执行
- Seed 数据可实际写入
- Next.js 开发环境可实际启动
- 以下主流程可在本地真实跑通
  - 注册
  - 登录
  - 登出
  - Dashboard 打开正常
  - Applications Board 打开正常
  - 新建申请
  - 编辑申请
  - 删除申请
  - 搜索 / 筛选
  - 拖拽改状态
  - 申请详情页查看

## 2. 验收环境

- 验收日期：2026-04-18
- 操作系统：Windows
- Shell：PowerShell
- Node.js：v18.18.0
- npm：9.8.1
- Docker：已安装 Desktop 与 Compose
- 数据库：PostgreSQL，容器名 `jobflow-postgres`
- 开发服务：Next.js dev server，最终固定在 `http://127.0.0.1:3100`
- 浏览器验收方式：系统 Chrome + 临时 Playwright 脚本
- 环境变量来源：`.env.local`

说明：

- 运行层验收期间，为避免已有端口冲突，开发环境最终使用 `3100` 端口完成验证。
- 主流程验收通过真实浏览器自动化脚本执行，不是仅靠静态检查或手工推断。

## 3. 实际执行命令

### 3.1 核心命令

```bash
docker compose up -d
npm run db:migrate
npm run db:seed
npm run dev
node .runtime/phase1-runtime-check.mjs
```

### 3.2 为完成验收实际执行过的补充命令

```bash
Start-Service com.docker.service
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
npm install server-only
npm install --no-save playwright-core@1.52.0
npm run typecheck
docker exec jobflow-postgres psql -U postgres -d jobflow -c "..."
```

说明：

- `Start-Service` 与 `Start-Process` 用于修复 Docker Desktop 未启动的问题。
- `npm install server-only` 用于补齐运行期缺失依赖。
- `npm install --no-save playwright-core@1.52.0` 仅用于本次浏览器级验收，不是产品功能依赖扩展。
- `docker exec ... psql` 用于验收后核对数据库中的用户与申请数据状态。

## 4. 主流程验证结果

### 4.1 页面与流程验证结果

| 项目 | 结果 | 说明 |
| --- | --- | --- |
| 注册 | 通过 | 新用户可注册并自动进入 Dashboard |
| 登录 | 通过 | 新注册账号可重新登录 |
| 登出 | 通过 | 登出后返回 `/sign-in` |
| Dashboard 打开正常 | 通过 | 页面可访问，统计与模块可加载 |
| Applications Board 打开正常 | 通过 | 页面可访问，筛选区和列视图可加载 |
| 新建申请 | 通过 | 可创建新申请并跳转到详情页 |
| 编辑申请 | 通过 | 可更新标题、状态、备注等信息 |
| 删除申请 | 通过 | 可从详情页删除并返回看板 |
| 搜索 / 筛选 | 通过 | 查询参数与页面结果一致 |
| 拖拽改状态 | 通过 | 从 `applied` 拖拽到 `interview` 后详情页状态同步更新 |
| 申请详情页查看 | 通过 | 可正常打开并展示岗位信息 |

### 4.2 浏览器级验收产物

- 浏览器验收报告：[phase1-runtime-report.json](/D:/桌面/codex/260418-Meituan-AI-Codex/.runtime/phase1-runtime-report.json)
- 临时验收脚本：[phase1-runtime-check.mjs](/D:/桌面/codex/260418-Meituan-AI-Codex/.runtime/phase1-runtime-check.mjs)

最终报告中的 11 个验收步骤全部为 `ok: true`。

## 5. 中途报错与修复过程

### 5.1 Docker 未启动

现象：

- `docker compose up -d` 初次执行失败
- 报错指向 Docker engine pipe，不存在或不可用

修复：

- 启动 `com.docker.service`
- 启动 Docker Desktop
- 再次执行 `docker compose up -d`

结果：

- 数据库容器成功启动

### 5.2 `db:seed` 在沙箱内直接执行失败

现象：

- 直接执行 `npm run db:seed` 出现 `spawn EPERM`

修复：

- 改为提权执行

结果：

- 命令可继续向下执行，进入真实业务报错阶段

### 5.3 `server-only` 缺失

现象：

- `db:seed` 执行时报 `Cannot find module 'server-only'`

修复：

- 安装 `server-only`

结果：

- 缺失依赖问题消除

### 5.4 `db/index.ts` 中的 `server-only` 导致 Node 脚本报错

现象：

- `db:seed` 仍失败
- 原因是 `db/index.ts` 被普通 Node 脚本直接引入时，`server-only` 会主动抛错

修复：

- 从 `db/index.ts` 去掉 `import "server-only"`

结果：

- `db/index.ts` 可同时被 Next.js 服务端代码和 seed 脚本复用

### 5.5 `db:seed` 实际写入成功但进程不退出

现象：

- Seed 命令能插入数据，但执行过程超时不结束

修复：

- 在 `db/seeds/seed.ts` 中为成功路径补上 `process.exit(0)`

结果：

- Seed 命令可稳定结束

### 5.6 dev server 卡在 `Starting...`

现象：

- `npm run dev` 初次无法稳定进入可用状态
- 旧的 Next.js 进程占用了 `3000 / 3001 / 3002 / 3100`
- `.next` 缓存残留导致开发环境卡在 `Starting...`

修复：

- 停止旧进程
- 清理 `.next`
- 重新后台启动 dev server
- 固定 `PORT=3100`

结果：

- dev server 成功进入 `Ready`

### 5.7 直接用 `curl` 调用 Server Action 不可作为表单验收方式

现象：

- 直接 POST 到 `/sign-up` 的 action 时返回 500
- 报错为 `formData` 为空或缺少绑定参数

说明：

- 这不是业务功能本身失效
- 原因是 `useActionState` 场景下，Server Action 依赖 React 绑定的隐藏参数，不能用裸 POST 简单替代

修复：

- 改为真实浏览器自动化方式验收

### 5.8 浏览器脚本前两次失败

现象：

- 临时 Playwright 脚本第一次、第二次执行时失败
- 原因是断言 selector 过宽，命中多个元素，触发 strict mode violation

修复：

- 收紧脚本中的 heading 与卡片 selector

结果：

- 第三次完整通过全部主流程

## 6. 实际修改文件清单

### 6.1 运行修复类改动

- [db/index.ts](/D:/桌面/codex/260418-Meituan-AI-Codex/db/index.ts)
- [db/seeds/seed.ts](/D:/桌面/codex/260418-Meituan-AI-Codex/db/seeds/seed.ts)
- [package.json](/D:/桌面/codex/260418-Meituan-AI-Codex/package.json)
- [package-lock.json](/D:/桌面/codex/260418-Meituan-AI-Codex/package-lock.json)
- [.env.local](/D:/桌面/codex/260418-Meituan-AI-Codex/.env.local)

### 6.2 运行验收辅助文件

- [.runtime/start-dev.ps1](/D:/桌面/codex/260418-Meituan-AI-Codex/.runtime/start-dev.ps1)
- [.runtime/phase1-runtime-check.mjs](/D:/桌面/codex/260418-Meituan-AI-Codex/.runtime/phase1-runtime-check.mjs)
- [.runtime/phase1-runtime-report.json](/D:/桌面/codex/260418-Meituan-AI-Codex/.runtime/phase1-runtime-report.json)
- `.runtime/*.log`

说明：

- 运行修复类改动中，只有部分适合正式保留到仓库。
- `.runtime/` 下文件主要用于本次本地验收与排障，不属于产品功能交付的一部分。

## 7. 当前已知限制

- 当前账号体系仍是 Auth.js Credentials，本轮未切换 Supabase Auth
- 所有权控制当前仍以应用层 `user_id` 约束为主，尚未补数据库 RLS
- `calendar / materials / offers / analytics / settings` 仍未进入正式实现
- `application_events` 与 `application_notes` 仍缺少完整的增删改前台能力
- 运行层验收时使用了 Node 18，Tailwind 相关包会给出 engine warning，但不阻塞本轮 MVP 验收
- `.runtime/` 下的辅助脚本与日志不应被视为正式产品代码

## 8. 最终结论

本次运行层验收已完成，结论如下：

- 本地数据库可启动
- 迁移可执行
- Seed 可执行
- Next.js 开发环境可启动
- Phase 1 规定的核心主流程已通过真实浏览器自动化完整验证

因此，当前项目已经达到：

**“本地可运行、可演示、主流程可用的 Phase 1 MVP 标准。”**
