# <div align="center">JobFlow</div>

<p align="center">
  <strong>Your job search, on one board.</strong><br>
  A focused workflow workspace for individual job seekers
</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-14.2-black?logo=next.js">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white">
  <img alt="Tailwind" src="https://img.shields.io/badge/Tailwind-3.4-38BDF8?logo=tailwindcss&logoColor=white">
  <img alt="Phase" src="https://img.shields.io/badge/Phase_1-MVP-22C55E">
  <img alt="Docs" src="https://img.shields.io/badge/Docs-ZH_/_EN-0EA5E9">
</p>

<p align="center">
  <a href="./README.md">中文 README</a>
</p>

<!-- TODO: docs/assets/screenshots/hero.png -->

---

## Overview

JobFlow keeps one job-search pipeline in one focused workspace:
**Wishlist → Applied → OA → Interview → HR → Offer → Rejected → Archived**.

It is built for individual job seekers and ships with five core views: Dashboard, Board, List, Detail, and Timeline. The app also includes sign-in, sign-up, demo credentials, local seed data, and a one-click Chinese / English switch powered by cookies with Chinese as the default locale.

The current track stays on **Phase 1 MVP plus stabilization and UX polish**. This round does not include Phase 2 work, AI features, Gmail integration, or database schema expansion. See [docs/phase-1.en.md](./docs/phase-1.en.md).

## Live Demo

Public deployment URL coming soon. Want to spin up your own demo site? See [Deployment · Public demo deployment](./docs/deployment.en.md#public-demo-deployment).

---

## ✨ Highlights

- `📌` One pipeline from start to archive: every update stays attached to the same application record.
- `📊` Five views that work together: Dashboard for overview, Board for movement, List for management, Detail for context, Timeline for history.
- `🌐` One-click bilingual switch: Chinese by default, cookie-persisted, no URL locale prefix.
- `🔐` Demo-ready auth flow: demo account sign-in plus working registration for new users.
- `🛠` Better local DX: `dev:doctor`, `dev:setup`, and `dev:start` cover environment checks, setup, and daily startup.

---

## Screenshots

<!-- TODO: docs/assets/screenshots/dashboard-light-zh.png / board-light-zh.png / list-light-zh.png / detail-light-zh.png / timeline-light-zh.png / landing-light-zh.png -->

| Dashboard | Board | List |
|---|---|---|
| <sub>`docs/assets/screenshots/dashboard-light-zh.png`</sub> | <sub>`docs/assets/screenshots/board-light-zh.png`</sub> | <sub>`docs/assets/screenshots/list-light-zh.png`</sub> |

| Detail | Timeline | Landing |
|---|---|---|
| <sub>`docs/assets/screenshots/detail-light-zh.png`</sub> | <sub>`docs/assets/screenshots/timeline-light-zh.png`</sub> | <sub>`docs/assets/screenshots/landing-light-zh.png`</sub> |

### Screenshot plan

- `landing-light-zh.png`: the landing hero with headline, primary CTA, and language toggle in view.
- `sign-in-light-zh.png`: the full sign-in form, useful for showing the login path and locale switch entry.
- `sign-up-light-zh.png`: the full sign-up form, useful for showing that registration works.
- `dashboard-light-zh.png`: stats, upcoming items, and recent activity in one frame as the main overview shot.
- `board-light-zh.png`: at least five populated columns so the pipeline feels alive.
- `list-light-zh.png`: search, filters, sorting, and the table in one screen to show structured management.
- `detail-light-zh.png`: the application summary with status and key dates visible together.
- `timeline-light-zh.png`: chronological notes and events to highlight traceability.
- `language-toggle.webp`: a short before/after locale switch clip; a comparison image also works if you do not want animation.

Naming rules, resolution targets, and the full capture checklist live in [docs/assets/README.en.md](./docs/assets/README.en.md).

---

## Tech Stack

| Group | Choices |
|---|---|
| **Frontend** | Next.js 14 App Router · strict TypeScript · Tailwind CSS · Radix UI primitives · dnd-kit |
| **Data** | React Server Components · Server Actions · React Query · zod |
| **Persistence** | Supabase Postgres · Drizzle ORM · drizzle-kit |
| **Auth** | NextAuth v5 · Credentials Provider · JWT session |
| **Tooling** | tsx · dotenv · ESLint · `tsc --noEmit` · `scripts/dev.ts` |

See [docs/faq.en.md](./docs/faq.en.md) and [docs/deployment.en.md](./docs/deployment.en.md) for trade-offs, env vars, and deployment notes.

---

## Quick Start

Recommended path:

```bash
npm install
cp .env.example .env
npm run dev:doctor
npm run dev:setup
npm run dev:start
```

Default URL:

```text
http://localhost:3001
```

Default demo account after `db:seed`:

```text
demo@jobflow.local / demo1234
```

If `dev:doctor` fails, check these first:

- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_URL`

Full local setup notes are in [docs/deployment.en.md](./docs/deployment.en.md).

---

## Project Structure

This README focuses on the core folders and key files. For a fuller breakdown, see [docs/project-structure.en.md](./docs/project-structure.en.md).

```text
app/
├─ layout.tsx                              # Root layout with cookie-based locale and base metadata
├─ page.tsx                                # Landing page
├─ providers.tsx                           # Global providers for theme and i18n
├─ auth/
│  ├─ sign-in/page.tsx                     # Sign-in page
│  ├─ sign-in/sign-in-form.tsx             # Sign-in form, errors, and redirects
│  ├─ sign-up/page.tsx                     # Sign-up page
│  └─ sign-up/sign-up-form.tsx             # Sign-up form, account creation, and auto sign-in
├─ api/
│  ├─ auth/[...nextauth]/route.ts          # NextAuth entry route
│  ├─ auth/sign-up/route.ts                # Registration endpoint
│  └─ dev/ready/route.ts                   # Local runtime health check
└─ app/
   ├─ layout.tsx                           # Authenticated app shell
   ├─ page.tsx                             # Dashboard
   ├─ board/page.tsx                       # Board view
   ├─ list/page.tsx                        # List view
   └─ applications/                        # New, detail, and edit pages

components/
├─ app-sidebar.tsx                         # Left navigation
├─ app-topbar.tsx                          # Top bar
├─ language-switcher.tsx                   # One-click locale toggle
├─ coming-soon.tsx                         # Shared placeholder page component
├─ empty-state.tsx                         # Empty state component
├─ status-badge.tsx                        # Status badge component
└─ ui/                                     # Shared UI primitives

features/
└─ applications/
   ├─ actions.ts                           # Application-related Server Actions
   ├─ queries.ts                           # Board, list, detail, and stats queries
   ├─ schema.ts                            # Form and input validation
   └─ components/                          # ApplicationCard / Form / Timeline and more

lib/
├─ auth.ts                                 # Authentication logic
├─ auth.config.ts                          # NextAuth config
├─ auth-helpers.ts                         # Helpers such as requireUser
├─ date.ts                                 # Locale-aware date formatting
├─ runtime-env.ts                          # Env checks and database readiness
├─ runtime-health-client.ts                # Client-side preflight checks
└─ i18n/
   ├─ config.ts                            # Locale configuration
   ├─ actions.ts                           # Server action for locale switching
   ├─ client.tsx                           # I18n provider and hooks
   ├─ server.ts                            # Server-side dictionary loading
   └─ dictionaries/
      ├─ zh.ts                             # Chinese source copy
      └─ en.ts                             # English mirror dictionary

db/
├─ schema.ts                               # Drizzle schema
├─ client.ts                               # Database connection
├─ seed.ts                                 # Demo seed data
└─ migrations/                             # Migration files

scripts/
└─ dev.ts                                  # doctor / setup / start

docs/
├─ phase-1.md                              # Phase 1 Chinese delivery notes
├─ phase-1.en.md                           # Phase 1 English delivery notes
├─ deployment.md                           # Chinese deployment guide
├─ deployment.en.md                        # English deployment guide
└─ assets/README.en.md                     # Screenshot and static asset guide
```

---

## Documentation

**Getting Started**
- [Chinese README](./README.md)
- [Deployment](./docs/deployment.en.md)
- [FAQ](./docs/faq.en.md)

**Project**
- [Project Structure](./docs/project-structure.en.md)
- [Roadmap](./docs/roadmap.en.md)

**Phase Notes**
- [Phase 1](./docs/phase-1.en.md)
- [Phase 2 Plan (historical)](./docs/phase-2-plan.en.md)
- [Next.js Upgrade Assessment](./docs/nextjs-upgrade-assessment.en.md)

---

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the dev server on port `3001` |
| `npm run dev:doctor` | Check `.env`, dependencies, and DB reachability |
| `npm run dev:setup` | Run setup, migrations, and seed only when needed |
| `npm run dev:start` | Preferred entry point for daily development |
| `npm run build` | Production build |
| `npm start` | Start the production server on port `3001` |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript type check |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:push` | Push schema changes to the database |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run db:seed` | Insert demo data |

---

## Known Boundaries

- The current delivery target stays on the Phase 1 usable loop. No new Phase 2 work, AI features, or Gmail integration in this round.
- Single-user scope only. No collaboration, recruiter-side ATS, auto-apply, or automated email handling.
- The public live demo URL is still pending. Local setup and self-hosted demos are the current path.
- No `LICENSE` file has been committed yet, so licensing remains undecided.

---

## License

License: **TBD**. Please confirm usage rights before reusing, modifying, or redistributing the project.
