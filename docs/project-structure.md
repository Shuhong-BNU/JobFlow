# 项目结构说明

> 约束：目录与根目录配置文件由脚手架与 Phase 1 一起冻结。**不要随意移动根目录配置文件的位置**（`next.config.mjs` / `tsconfig.json` / `tailwind.config.ts` / `postcss.config.mjs` / `drizzle.config.ts` / `middleware.ts`），Next.js 与各工具默认在根目录读它们，移到子目录需要改一大串配置。

## 根目录（configs + entry points）

| 文件 | 作用 | 备注 |
|---|---|---|
| `package.json` | 依赖与脚本 | `dev / dev:doctor / dev:setup / dev:start / build / lint / typecheck / db:*` |
| `package-lock.json` | 锁定依赖版本 | 直接提交到仓库 |
| `next.config.mjs` | Next.js 配置 | 无自定义 webpack，保持最小配置 |
| `tsconfig.json` | TS 编译配置（strict） | `@/*` 路径别名指向项目根 |
| `tailwind.config.ts` | Tailwind 主题 + `content` 扫描范围 | 指向 `app / components / features / lib` |
| `postcss.config.mjs` | PostCSS + Tailwind + Autoprefixer | 与 Tailwind 联动，不单独使用 |
| `drizzle.config.ts` | Drizzle Kit（migrations 生成） | 指向 `db/schema.ts` 与 Postgres URL |
| `middleware.ts` | Next.js middleware：登录校验 + 健康度拦截 | 保护 `/app/*` 路由 |
| `components.json` | shadcn/ui 生成器配置 | 指向 `components/ui` |
| `next-env.d.ts` | Next.js 类型声明 | 自动生成，不要手改 |
| `.env / .env.example` | 环境变量 | 真实值只写 `.env`，示例与说明放 `.env.example` |

## 一级目录

```
app/                  # Next.js App Router — 路由 + layout
├── (marketing)/      # 未登录的落地页（如存在）
├── auth/             # 登录 / 注册 页面
├── api/              # NextAuth 回调、健康检查等 API Route
└── app/              # 登录后的工作区
    ├── layout.tsx    # Sidebar + Topbar
    ├── page.tsx      # Dashboard
    ├── board/        # 看板
    ├── list/         # 列表
    ├── applications/ # 申请详情 / 新建 / 编辑
    ├── calendar/     # Phase 2 占位（当前渲染规划页）
    ├── materials/    # Phase 2 占位
    ├── offers/       # Phase 2 占位
    ├── analytics/    # Phase 2 占位
    ├── ai/           # Phase 3 占位
    └── settings/     # Phase 3+ 占位

components/           # 跨业务域的通用 UI
├── ui/               # shadcn/ui 生成的原子组件
├── coming-soon.tsx   # Phase 3 及以后的"即将开放"占位
├── phase2-plan.tsx   # Phase 2 规划占位页（四个模块共用）
├── date-picker.tsx   # 统一日期选择（yyyy-mm-dd + 日历弹层）
├── datetime-picker.tsx  # 统一日期时间选择（yyyy-mm-dd HH:mm + 日历 + 时/分下拉）
├── status-badge.tsx
├── empty-state.tsx
└── ...

features/             # 按业务域切分的代码（核心组织方式）
├── applications/
│   ├── components/   # Board / Card / DetailTabs / Form / Timeline
│   ├── actions.ts    # server actions：create / update / move / note / event
│   ├── queries.ts    # data access：看板/列表/详情/统计查询
│   └── schema.ts     # zod：表单与 action 输入校验
├── dashboard/
│   └── queries.ts    # 风险卡、近期事件聚合
└── （Phase 2+ 在此新增 materials / offers / analytics / events 等）

lib/                  # 跨业务域的公用模块（无 UI）
├── auth.ts                  # NextAuth 主入口（server-side）
├── auth.config.ts           # NextAuth provider & session 配置
├── auth-helpers.ts          # requireUser 等便利 helper
├── auth-route.ts            # Credentials callback 入口
├── date.ts                  # 日期格式化 / relativeFromNow / isOverdue
├── enums.ts                 # ApplicationStatus / Priority 等枚举唯一真源
├── utils.ts                 # cn()
├── runtime-env.ts           # 环境变量强校验（zod）
├── runtime-health-client.ts # 启动自检（客户端 UX）
├── runtime-health-shared.ts # 启动自检（共享）
├── i18n/                    # 双语字典 + server / client 入口
│   ├── dictionaries/zh.ts   # 真源：所有可见文案
│   ├── dictionaries/en.ts   # 英文镜像，键结构必须对齐
│   ├── dictionaries/index.ts
│   ├── server.ts            # getServerDictionary / getLocale
│   ├── client.ts            # useT / useLocale hook
│   ├── cookie.ts            # locale cookie 读写
│   └── types.ts             # LOCALES / Locale 类型
└── ai/                      # Phase 3 抽象层（Phase 1 暂为空 provider）

db/                   # 数据库定义与迁移
├── schema.ts         # Drizzle schema（唯一真源）
├── client.ts         # postgres-js 连接池
├── seed.ts           # 开发用假数据
└── migrations/       # drizzle-kit 产出的 SQL

scripts/              # 开发 / 运维脚本
├── dev.ts            # doctor / setup / start 三件套
└── ...               # 其他一次性脚本

types/                # 全局类型（不按业务域分）
docs/                 # 文档
└── ...               # phase-1 / phase-2-plan / project-structure / nextjs-upgrade-assessment
```

## 代码组织原则

1. **`features/<domain>/` 是业务代码的主单位**：`actions.ts + queries.ts + schema.ts + components/` 聚在一起，不要为了凑目录而拆到 `app/` 里。
2. **`lib/` 不放业务代码**，只放跨业务域、与 UI 无关的工具。
3. **`components/ui/` 只放原子组件**；业务组件放到 `features/<domain>/components/` 或 `components/`。
4. **`app/` 下每个 `page.tsx` 保持轻薄**：负责组装 `features/` 里的东西 + 登录校验 + 数据加载；不写业务逻辑。
5. **`lib/enums.ts` 是枚举的唯一真源**：DB schema / zod / UI 全部从这里引用，避免漂移。
6. **`lib/i18n/dictionaries/zh.ts` 是文案的唯一真源**，`en.ts` 用 `Dictionary` 类型约束必须对齐；任何新文案都先落到这两个字典。

## 路径别名

`tsconfig.json` 里只有一条别名：

```json
{ "paths": { "@/*": ["./*"] } }
```

所有 import 用 `@/features/...` / `@/components/...` / `@/lib/...`，不要写相对路径翻越两级以上。

## 不要做的事情

- **不要在 `app/` 里写业务 hooks 或 queries**：它们必须落在 `features/<domain>/`。
- **不要把 i18n 文案写死在组件里**：一律走字典。
- **不要绕开 server actions 直接在 client 写 DB 操作**：会破坏 ownership 校验与后续的 RLS 接入。
- **不要移动根目录配置文件**：Next.js / drizzle-kit / tailwind / tsconfig 都默认在根目录找它们，挪一次改一堆路径。详见下一节。

## 为什么根目录配置文件必须留在根

这是 JobFlow 里"看起来乱但不能整理"的典型场景。下表罗列每个文件为什么必须在根，把它移走要付出的代价是什么。

| 文件 | 约定来源 | 移动代价 |
|---|---|---|
| `next.config.mjs` | Next.js 约定：启动时从 `cwd` 查找 `next.config.{js,mjs,ts}`；非根位置不会被识别 | 需要放弃 `next dev` / `next build`，改为 `cd config && next dev --root ../` 这种 hack，破坏所有文档示例 |
| `middleware.ts` | Next.js 约定：必须与 `app/` 同级才生效 | 无法替代方案。挪走等于关闭 middleware |
| `app/` | Next.js App Router 约定：路由根目录必须叫 `app/` 且在项目根 | 挪走等于退回 Pages Router，整套路由逻辑要重写 |
| `tsconfig.json` | TypeScript 约定：编译器从 `cwd` 向上查找；`@/*` 路径别名以此为原点解析 | 挪走后 `@/*` 别名全部断链，VS Code 类型跳转失效 |
| `tailwind.config.ts` | Tailwind CLI 约定：PostCSS 调用时从 `cwd` 查找；配置里的 `content` glob 以 `cwd` 为相对原点 | 挪走要在所有脚本里显式传 `--config`，且 glob 语义要全量修改 |
| `postcss.config.mjs` | PostCSS 约定：Next.js / Tailwind 都以 `cwd` 为起点加载 | 与 Tailwind 同理，必须同根 |
| `drizzle.config.ts` | Drizzle Kit 约定：默认从 `cwd` 读；非默认位置必须每条 `db:*` 脚本都加 `--config` | 所有 npm 脚本都要加参数污染，CI 脚本成本 ×N |
| `components.json` | shadcn CLI 约定：生成器在 `cwd` 查找；配置里 `aliases.components` / `aliases.utils` 以此为基准 | 挪走后 `npx shadcn add xxx` 会报找不到配置，生成路径也会错 |
| `.env / .env.example` | Next.js 与 `dotenv` 默认只从 `cwd` 读 `.env*` 家族 | 挪走要在 `scripts/dev.ts` 里硬编码 `path`，且 Next.js 自己的 env 注入机制对子目录不生效 |
| `.gitignore` | Git 约定：仓库根的 `.gitignore` 控制全局忽略 | 子目录 `.gitignore` 只影响该目录，不能替代根级 |
| `next-env.d.ts` | Next.js 自动生成并要求与 `tsconfig.json` 同级 | 手动挪走下次 `next dev` 会重新在根创建 |

结论：这些文件在根目录不是"没整理"，是**工具链的约定**。把它们收进 `config/` 子目录需要改动 20+ 处调用点，且大多数是不可逆的外部约定。放弃整理欲望，接受"根目录有十几个配置文件"是现代 Node 项目的常态。
