# Next.js upgrade assessment (14.2.5 → 15)

> **Verdict first**: Phase 1 will not upgrade. This document captures the upgrade path, impact surface, and rollback plan for future reference.

## 1. Current versions

| Package | Current | Target (if upgraded) |
|---|---|---|
| `next` | 14.2.5 | 15.x (15.3 shipped) |
| `react` / `react-dom` | 18.3.1 | 19.x |
| `eslint-config-next` | 14.2.5 | 15.x |
| `next-auth` | 5.0.0-beta.20 | Current version works on Next 15 but is still beta |

Everything else (Drizzle, Tailwind, Radix, shadcn/ui) is decoupled from the Next version and does not block the upgrade.

## 2. Why Phase 1 skips the upgrade

1. **Phase 1 scope was frozen early.** An upgrade is infra work and would drag the closeout round.
2. **Next 15 makes `params` / `searchParams` / `cookies()` / `headers()` async.** Every `page.tsx` / `layout.tsx` / server action / route handler that touches these needs a signature change. The repo has 10+ affected entry points.
3. **React 19's breaking changes** (stricter hook timing, relaxed `forwardRef`, new `useTransition` semantics) have unknown ripple effects on Radix / shadcn.
4. **NextAuth v5 is still beta.** Production currently runs a known-stable combination; upgrading forces us to track NextAuth releases in parallel.
5. **No user-reported need requires upgrading right now.** Turbopack, `after()`, etc. are nice-to-haves.

## 3. What must change on upgrade (ordered by impact)

### 3.1 Async dynamic APIs (largest change)

Next 15 makes the following return Promises:

- `params` / `searchParams` (in `page.tsx`, `layout.tsx`, `generateMetadata`).
- `cookies()` / `headers()` / `draftMode()` (in server components, server actions, route handlers).

Example migration:
```diff
- export default function Page({ params }: { params: { id: string } }) {
-   const { id } = params;
+ export default async function Page({ params }: { params: Promise<{ id: string }> }) {
+   const { id } = await params;
```

Entry points to scan:
- `app/app/applications/[id]/page.tsx` (dynamic route)
- `app/app/applications/[id]/edit/page.tsx`
- `app/app/list/page.tsx` (`searchParams`-based filtering)
- `lib/auth.ts` / `lib/auth-helpers.ts` (`cookies()` / `headers()`)
- Every `app/api/**/route.ts`
- `lib/i18n/server.ts` — **key**: currently uses `cookies()` synchronously.

Automation helper: `npx @next/codemod@latest next-async-request-api .` handles most rewrites, but hand-review is still required for try/catch and transaction sites.

### 3.2 `fetch` default cache change

Next 15 flips the default from `force-cache` to `no-store` (including GET route handlers).

- We do not call `fetch()` against third-party APIs today.
- Future Phase 3 / Phase 4 work (AI, Gmail) must set `cache` explicitly instead of relying on defaults.

### 3.3 React 19

- `ref` can be used as a prop directly; `forwardRef` no longer required. Existing code still works.
- `useFormState` → `useActionState` (compatible signature, new name).
- `useTransition` callbacks can be async.
- `Suspense` error-boundary semantics tighten — missing boundaries bubble errors.

**We do not use `useFormState`**, so the main risk is React 19 vs Radix / shadcn compatibility:

- Radix has React 19-compatible releases (`@radix-ui/react-*@latest`); bump the whole set.
- `react-hook-form` 7.52+ is compatible.
- `sonner` / `next-themes` need to bump to latest.

### 3.4 ESLint

Next 15 wants `eslint-config-next@15`. Compatible with `eslint@8`, but moving to `eslint@9` flat config is recommended eventually.

Recommendation: during upgrade, stay on `eslint-config-next@15 + eslint@8`. Schedule a separate task for the flat-config migration.

### 3.5 Turbopack dev (optional)

`next dev --turbo` is stable in 15.

- 2-5x faster cold start.
- Some webpack loader / alias quirks differ subtly — full dev regression required before switching.

**Recommendation**: during the initial upgrade, keep webpack dev. Opt into Turbopack later.

### 3.6 NextAuth v5 compatibility

`next-auth@5.0.0-beta.20` runs on Next 14 today. When bumping to Next 15, also bump NextAuth to the then-latest beta and watch `lib/auth.ts` / `lib/auth.config.ts` for breaking changes.

## 4. What does not need to change

- **Drizzle ORM**: decoupled from Next.
- **Tailwind v3 + PostCSS**: compatible with Next 15. Tailwind v4 is a separate major upgrade, out of scope.
- **Generated shadcn/ui components**: our own code; Next upgrade does not touch them.
- **Server action usage**: the `'use server'` protocol is stable.

## 5. Recommended upgrade path (when we decide to do it)

1. **Prep**
   - Branch from main as `chore/next-15`.
   - Baseline: `npm run typecheck && npm run lint && npm run build`.
2. **Bump packages**
   ```bash
   npm i next@15 react@19 react-dom@19 eslint-config-next@15
   npm i -D @types/react@19 @types/react-dom@19
   ```
3. **Run the codemod**
   ```bash
   npx @next/codemod@latest next-async-request-api .
   ```
   Hand-review every touched file; pay extra attention to try/catch and await placement.
4. **Fix leftovers manually**
   - `lib/i18n/server.ts`: switch `cookies()` to `await`.
   - Sweep `middleware.ts` (request API unchanged, but double-check).
   - Bump the Radix family to latest.
5. **Verify**
   - `npm run typecheck` must be green.
   - `npm run build` must be green.
   - Manual smoke: sign in → new application → drag → detail page → language switch.
6. **Rollback plan**
   - Keep `chore/next-15` separate from main until full manual QA passes.
   - If Phase 2 is ready to start and the upgrade is still blocking, revert to 14.2.5 and ship features.

## 6. Risk matrix

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Async `params` / `cookies` gaps slip past build but fail at runtime | Medium | High | codemod + manual sweep of entry points + end-to-end smoke |
| React 19 incompatibility with a third-party component | Low | Medium | Full build on a branch first; pin Radix to latest |
| NextAuth v5 regresses on Next 15 | Low | High | Watch next-auth issues; keep old lockfile to fast-revert |
| Scope creep during upgrade | Medium | Medium | Hard-gate `chore/next-15` — infra only, no feature work |

## 7. Decision

- **No upgrade during Phase 1 closeout.** Keep bug-fix work and infra work separate.
- **Upgrade window before Phase 2 kicks off**, scheduled as a standalone day of work.
- **Revisit Turbopack in Phase 3.** Stay on webpack dev for now.
