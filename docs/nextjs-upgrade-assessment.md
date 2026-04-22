# Next.js 升级评估（14.2.5 → 15）

> **结论先行**：Phase 1 不升级。本文档只评估升级路径、影响面与回退策略，供后续决策参考。

## 1. 当前版本

| 包 | 当前 | 目标（若升级） |
|---|---|---|
| `next` | 14.2.5 | 15.x（15.3 已发布） |
| `react` / `react-dom` | 18.3.1 | 19.x |
| `eslint-config-next` | 14.2.5 | 15.x |
| `next-auth` | 5.0.0-beta.20 | 当前版本对 Next 15 兼容但仍是 beta |

其余（Drizzle / Tailwind / Radix / shadcn-ui）与 Next 版本解耦，不是升级的阻塞点。

## 2. 为什么 Phase 1 不升级

1. **Phase 1 的范围早已冻结**：升级是基建工作，放进当前收尾轮会拖长阵线。
2. **Next 15 强制把 `params` / `searchParams` / `cookies()` / `headers()` 改成异步**，所有 `page.tsx` / `layout.tsx` / server action 里摸这些值的地方都要改签名。当前仓库此类入口点 10+ 处，改动面不小。
3. **React 19 的破坏性变更**（如更严格的 hook 调用时机、`forwardRef` 不再强制、`useTransition` 返回值变化）与 Radix / shadcn 组件的适配存在未知风险。
4. **NextAuth v5 仍然是 beta**，在生产上目前跑的是已知稳定组合，升级期间需要同时追 NextAuth 的版本动态。
5. **当前没有用户反馈必须升级的能力**：Turbopack、`after()`、`unstable_after` 等功能都不是当前阻塞项。

## 3. 升级必须改的点（按影响大小排）

### 3.1 异步动态 API（最大改动点）

Next 15 把下面这些改成 Promise：

- `params` / `searchParams`（在 `page.tsx` / `layout.tsx` / `generateMetadata`）
- `cookies()` / `headers()` / `draftMode()`（在 server 组件、server action、route handler 中）

需要的修改：
```diff
- export default function Page({ params }: { params: { id: string } }) {
-   const { id } = params;
+ export default async function Page({ params }: { params: Promise<{ id: string }> }) {
+   const { id } = await params;
```

仓库范围内需要扫描的入口：
- `app/app/applications/[id]/page.tsx`（动态路由）
- `app/app/applications/[id]/edit/page.tsx`
- `app/app/list/page.tsx`（`searchParams` 做筛选）
- `lib/auth.ts` / `lib/auth-helpers.ts`（`cookies()` / `headers()`）
- 所有 `app/api/**/route.ts`
- `lib/i18n/server.ts` 里的 `cookies()` 读取（**关键**：当前是同步）

自动化辅助：Next 15 提供了 `npx @next/codemod@latest next-async-request-api .` 可以改大部分，但仍需人工复核 catch/transaction 场景。

### 3.2 fetch 默认缓存语义变化

Next 15 把默认 `fetch()` 从 `force-cache` 改为 `no-store`（含 GET route handlers）。

影响：
- 我们没有用 `fetch()` 访问第三方 API。
- 但要留意未来 Phase 3 / Phase 4 接入 AI / Gmail 时，显式声明 `cache` 选项，不要依赖默认值。

### 3.3 React 19

- 组件 props 上 `ref` 可以直接用，不再强制 `forwardRef`。**不改动代码也能工作**，但 lint 规则会提示。
- `useFormState` → `useActionState`（签名兼容，名字变）。
- `useTransition` 回调可以是 async（用于改进 pending 语义）。
- `Suspense` 错误边界行为收紧：无 `errorBoundary` 的抛错会冒泡，需要顶层兜底。

**当前仓库不用 `useFormState`**，主要风险是 react 19 与 Radix / shadcn 的兼容：

- Radix 生态已经放出 React 19 兼容版本（`@radix-ui/react-*@latest`），但要整包升级。
- `react-hook-form` 7.52+ 兼容 React 19，无改动。
- `sonner` / `next-themes` 要升到最新。

### 3.4 ESLint / Lint rules

Next 15 要求 `eslint-config-next@15`，与 `eslint@8` 兼容，但推荐迁到 `eslint@9` flat config。

建议：如果只是为了升 Next 15，`eslint-config-next@15 + eslint@8` 组合可以继续跑；`eslint@9` 的 flat config 改造单独排期。

### 3.5 Turbopack dev（可选）

Next 15 让 `next dev --turbo` 进入 stable。我们目前用 webpack dev，切到 Turbo 后：

- 启动快 2-5 倍。
- 但部分 webpack loader / alias 行为还有细微差异，需要跑一遍完整 dev 流程复核。

**升级评估结论**：如果升级，优先保留 webpack dev；Turbopack 作为可选。

### 3.6 `next-auth` v5 的兼容

当前 `next-auth@5.0.0-beta.20` 对 Next 14 已经能跑。升 Next 15 时建议同步升 next-auth 到当时最新 beta（v5 仍未 GA），并盯 `lib/auth.ts` / `lib/auth.config.ts` 是否有 breaking change。

## 4. 不需要改的点

- **Drizzle ORM**：与 Next 版本无关。
- **Tailwind v3 / PostCSS**：与 Next 15 兼容。Tailwind v4 是单独的大升级，不在本次评估内。
- **shadcn/ui 已生成的组件**：代码是我们自己的，不会被 Next 升级打穿。
- **业务代码里的 server actions 用法**：`'use server'` 的协议稳定，没变。

## 5. 建议的升级路径（若未来决定做）

1. **准备**
   - 新开一个 `chore/next-15` 分支。
   - 跑一遍 `npm run typecheck && npm run lint && npm run build` 作为基线。
2. **升级包**
   ```bash
   npm i next@15 react@19 react-dom@19 eslint-config-next@15
   npm i -D @types/react@19 @types/react-dom@19
   ```
3. **跑 codemod**
   ```bash
   npx @next/codemod@latest next-async-request-api .
   ```
   人工复核每一个被改动的文件，重点看 `try/catch`、`await` 位置。
4. **修手动剩余点**
   - `lib/i18n/server.ts` 里的 `cookies()` 改 `await`。
   - 检查 `middleware.ts`（middleware 的 request API 没变，但顺手过一遍）。
   - Radix 包整体升级到最新。
5. **验证**
   - `npm run typecheck` 必须全绿。
   - `npm run build` 必须全绿。
   - 本地手测：登录 → 新建申请 → 拖拽 → 详情页 → 语言切换。
6. **回退预案**
   - 保留 `chore/next-15` 分支独立，不合并到 main 直到全部手测通过。
   - 如果 Phase 2 动工前升级阻塞太久，回退到 14.2.5 继续做功能。

## 6. 风险 matrix

| 风险 | 可能性 | 影响 | 应对 |
|---|---|---|---|
| 异步 `params/cookies` 扫不干净，build pass 但运行时 500 | 中 | 高 | codemod + 人工遍历入口点，再加端到端手测 |
| React 19 与第三方组件不兼容 | 低 | 中 | 升级前先在一个分支里跑完整 build；锁定 Radix 包到最新 |
| NextAuth v5 在 Next 15 上有 regression | 低 | 高 | 盯 next-auth 仓库 issue；保留旧 lockfile 以便快速回退 |
| 升级期间业务需求增加 | 中 | 中 | 严格控制 `chore/next-15` 分支范围，不夹业务改动 |

## 7. 决策

- **Phase 1 收尾不升级**，避免把修 bug 与基建混在一起。
- **Phase 2 动工前择机升级**：把升级作为独立一天的工作，不与新功能交叉。
- **Phase 3 再决定是否切换到 Turbopack**，当前保留 webpack dev。
