# Project structure

> Constraint: the directory layout and root-level config files are frozen together with the Phase 1 scaffold. **Do not move root-level config files** (`next.config.mjs`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `drizzle.config.ts`, `middleware.ts`). Next.js and the surrounding tooling look for them at the repo root — moving them forces config changes in many places.

## Root (configs + entry points)

| File | Purpose | Notes |
|---|---|---|
| `package.json` | Dependencies and scripts | `dev / dev:doctor / dev:setup / dev:start / build / lint / typecheck / db:*` |
| `package-lock.json` | Dependency lock | Checked in |
| `next.config.mjs` | Next.js config | No custom webpack — keep it minimal |
| `tsconfig.json` | TS strict compiler config | `@/*` alias points to the repo root |
| `tailwind.config.ts` | Tailwind theme + `content` glob | Scans `app / components / features / lib` |
| `postcss.config.mjs` | PostCSS + Tailwind + Autoprefixer | Paired with Tailwind, not used standalone |
| `drizzle.config.ts` | Drizzle Kit (migration generator) | Points at `db/schema.ts` + Postgres URL |
| `middleware.ts` | Next.js middleware: auth + health gate | Protects `/app/*` routes |
| `components.json` | shadcn/ui generator config | Points at `components/ui` |
| `next-env.d.ts` | Next.js type declarations | Auto-generated, do not hand-edit |
| `.env / .env.example` | Environment variables | Real values go in `.env`; the example + explanations live in `.env.example` |

## Top-level directories

```
app/                  # Next.js App Router — routes + layouts
├── (marketing)/      # Public landing (if present)
├── auth/             # Sign in / sign up pages
├── api/              # NextAuth callback, health probe, etc.
└── app/              # Authenticated workspace
    ├── layout.tsx    # Sidebar + topbar
    ├── page.tsx      # Dashboard
    ├── board/        # Kanban
    ├── list/         # Table view
    ├── applications/ # Detail / new / edit
    ├── calendar/     # Phase 2 placeholder (renders the plan page)
    ├── materials/    # Phase 2 placeholder
    ├── offers/       # Phase 2 placeholder
    ├── analytics/    # Phase 2 placeholder
    ├── ai/           # Phase 3 placeholder
    └── settings/     # Phase 3+ placeholder

components/           # Cross-domain UI
├── ui/               # shadcn/ui primitives
├── coming-soon.tsx   # "Coming soon" stub for Phase 3+
├── phase2-plan.tsx   # Shared Phase 2 plan page (four modules reuse it)
├── date-picker.tsx   # Unified date input (yyyy-mm-dd + calendar popover)
├── datetime-picker.tsx  # Unified date-time input (yyyy-mm-dd HH:mm + calendar + hour/minute dropdowns)
├── status-badge.tsx
├── empty-state.tsx
└── ...

features/             # Business-domain code (the main way we organize things)
├── applications/
│   ├── components/   # Board / Card / DetailTabs / Form / Timeline
│   ├── actions.ts    # Server actions: create / update / move / note / event
│   ├── queries.ts    # Data access: board / list / detail / stats queries
│   └── schema.ts     # zod: form + action input validation
├── dashboard/
│   └── queries.ts    # Risk and upcoming-event aggregation
└── (Phase 2+ adds materials / offers / analytics / events here)

lib/                  # Cross-domain utilities (no UI)
├── auth.ts                  # NextAuth server entry
├── auth.config.ts           # NextAuth providers + session config
├── auth-helpers.ts          # requireUser and similar helpers
├── auth-route.ts            # Credentials callback entry
├── date.ts                  # Date formatting / relativeFromNow / isOverdue
├── enums.ts                 # ApplicationStatus / Priority etc. — the single source
├── utils.ts                 # cn()
├── runtime-env.ts           # Env validation with zod
├── runtime-health-client.ts # Boot self-check (client UX)
├── runtime-health-shared.ts # Boot self-check (shared)
├── i18n/                    # Bilingual dictionaries + server/client entries
│   ├── dictionaries/zh.ts   # Source of truth — all user-visible text
│   ├── dictionaries/en.ts   # English mirror, key shape must match
│   ├── dictionaries/index.ts
│   ├── server.ts            # getServerDictionary / getLocale
│   ├── client.ts            # useT / useLocale hook
│   ├── cookie.ts            # Locale cookie read/write
│   └── types.ts             # LOCALES / Locale
└── ai/                      # Phase 3 abstraction layer (empty providers in Phase 1)

db/                   # Database definitions and migrations
├── schema.ts         # Drizzle schema (source of truth)
├── client.ts         # postgres-js pool
├── seed.ts           # Fixture data for dev
└── migrations/       # drizzle-kit output

scripts/              # Dev / ops scripts
├── dev.ts            # doctor / setup / start trio
└── ...

types/                # Global types
docs/                 # Documentation
```

## Organization principles

1. **`features/<domain>/` is the primary unit for business code.** `actions.ts + queries.ts + schema.ts + components/` stay together; do not split them into `app/` just to populate a folder.
2. **`lib/` holds no business code** — only cross-domain, UI-agnostic utilities.
3. **`components/ui/` holds primitives.** Business components go in `features/<domain>/components/` or `components/`.
4. **Each `page.tsx` stays thin**: assemble `features/` exports, check auth, load data. No business logic here.
5. **`lib/enums.ts` is the only source of truth for enums.** DB schema, zod, UI all read from it.
6. **`lib/i18n/dictionaries/zh.ts` is the source of truth for copy.** `en.ts` is constrained by the `Dictionary` type and must mirror the key shape.

## Path alias

`tsconfig.json` defines a single alias:

```json
{ "paths": { "@/*": ["./*"] } }
```

All imports use `@/features/...`, `@/components/...`, `@/lib/...`. Do not write relative imports that climb more than one level.

## Things not to do

- **Do not put hooks or queries inside `app/`.** They belong in `features/<domain>/`.
- **Do not hardcode user-visible text in components.** Go through the dictionary.
- **Do not bypass server actions and hit the DB from the client.** It breaks ownership checks and future RLS.
- **Do not move root-level config files.** Next.js, drizzle-kit, Tailwind, and tsconfig all look for them at the root. See the next section for why.

## Why the root-level config files stay at the root

This is the textbook "looks messy but shouldn't be tidied" case in JobFlow. Below is every file, the convention that pins it to the root, and the price of moving it.

| File | Convention source | Cost of moving it |
|---|---|---|
| `next.config.mjs` | Next.js looks up `next.config.{js,mjs,ts}` from `cwd` on boot; nowhere else is detected | Abandon `next dev` / `next build`; fall back to `cd config && next dev --root ../` and break every doc example |
| `middleware.ts` | Next.js convention: must sit next to `app/` to take effect | No workaround. Moving it disables middleware entirely |
| `app/` | App Router convention: the routing root must be named `app/` and live at the repo root | Moving it means going back to Pages Router — a full routing rewrite |
| `tsconfig.json` | TypeScript finds `tsconfig.json` by walking up from `cwd`; the `@/*` alias resolves from here | Moving it breaks every `@/*` import and kills "Go to definition" in VS Code |
| `tailwind.config.ts` | Tailwind CLI loads from `cwd` via PostCSS; the `content` glob is `cwd`-relative | Every script needs an explicit `--config`, and every glob pattern has to be rewritten |
| `postcss.config.mjs` | PostCSS convention: Next.js and Tailwind both load it from `cwd` | Same as Tailwind — must stay co-located |
| `drizzle.config.ts` | Drizzle Kit reads from `cwd` by default; any other location requires `--config` on every `db:*` script | Every npm script gets polluted with `--config`; CI pays the cost N times |
| `components.json` | shadcn CLI convention: the generator finds it from `cwd`, and `aliases.components` / `aliases.utils` are resolved relative to it | `npx shadcn add xxx` fails to locate the config; generation paths drift |
| `.env / .env.example` | Next.js and `dotenv` only read `.env*` files from `cwd` | Would need hand-rolled `path` handling in `scripts/dev.ts`, and Next.js's own env injection does not follow moved files |
| `.gitignore` | Git convention: the repo root `.gitignore` controls global ignores | A subdirectory `.gitignore` applies only within that subtree — no replacement |
| `next-env.d.ts` | Auto-generated by Next.js next to `tsconfig.json` | Even if moved, the next `next dev` recreates it at the root |

The takeaway: these files aren't "untidy" — they're **pinned by toolchain conventions**. Consolidating them into a `config/` subdirectory would require changes at 20+ call sites, most of which are external conventions you can't override. Accept that "a dozen config files at the root" is the modern Node project norm, and move on.
