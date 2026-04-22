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

## 🚀 Overview

JobFlow keeps one job-search pipeline in one focused workspace:
**Wishlist → Applied → OA → Interview → HR → Offer → Rejected → Archived**.

It is built for individual job seekers and ships with five core views: Dashboard, Board, List, Detail, and Timeline. The app also includes sign-in, sign-up, demo credentials, local seed data, and a one-click Chinese / English switch powered by cookies with Chinese as the default locale.

The current track stays on **Phase 1 MVP plus stabilization and UX polish**. This round does not include Phase 2 work, AI features, Gmail integration, or database schema expansion. See [docs/phase-1.en.md](./docs/phase-1.en.md).

## 🌍 Live Demo

- Public site: [job-flow-sandy.vercel.app](https://job-flow-sandy.vercel.app/)
- Demo account: `demo@jobflow.local / demo1234`
- Long Vercel-generated domains are deployment snapshots, not the primary public entry
- Self-hosting and demo deployment notes: [Deployment guide](./docs/deployment.en.md)

---

## ✨ Highlights

- `📌` One pipeline from start to archive: every update stays attached to the same application record.
- `📊` Five views working together: Dashboard for overview, Board for movement, List for management, Detail for context, Timeline for history.
- `🌐` One-click bilingual switch: Chinese by default, cookie-persisted, no URL locale prefix.
- `🔐` Demo-ready auth flow: demo account sign-in plus working registration for new users.
- `🛠` Better local DX: `dev:doctor`, `dev:setup`, and `dev:start` cover environment checks, setup, and daily startup.

---

## 🖼 Screenshots

<table>
  <tr>
    <td align="center" width="33.33%"><strong>Dashboard</strong></td>
    <td align="center" width="33.33%"><strong>Board</strong></td>
    <td align="center" width="33.33%"><strong>List</strong></td>
  </tr>
  <tr>
    <td><img src="./docs/assets/screenshots/dashboard-light-zh.png" alt="Dashboard" width="100%"></td>
    <td><img src="./docs/assets/screenshots/board-light-zh.png" alt="Board" width="100%"></td>
    <td><img src="./docs/assets/screenshots/list-light-zh.png" alt="List" width="100%"></td>
  </tr>
  <tr>
    <td align="center"><strong>Detail</strong></td>
    <td align="center"><strong>Timeline</strong></td>
    <td align="center"><strong>Landing</strong></td>
  </tr>
  <tr>
    <td><img src="./docs/assets/screenshots/detail-light-zh.png" alt="Detail" width="100%"></td>
    <td><img src="./docs/assets/screenshots/timeline-light-zh.png" alt="Timeline" width="100%"></td>
    <td><img src="./docs/assets/screenshots/landing-light-zh.png" alt="Landing" width="100%"></td>
  </tr>
</table>

Naming rules, export targets, and the full capture checklist live in [docs/assets/README.en.md](./docs/assets/README.en.md).

---

## 🧱 Tech Stack

| Group | Choices |
|---|---|
| **Frontend** | Next.js 14 App Router · strict TypeScript · Tailwind CSS · Radix UI primitives · dnd-kit |
| **Data** | React Server Components · Server Actions · React Query · zod |
| **Persistence** | Supabase Postgres · Drizzle ORM · drizzle-kit |
| **Auth** | NextAuth v5 · Credentials Provider · JWT session |
| **Tooling** | tsx · dotenv · ESLint · `tsc --noEmit` · `scripts/dev.ts` |

See [docs/faq.en.md](./docs/faq.en.md) and [docs/deployment.en.md](./docs/deployment.en.md) for trade-offs, env vars, and deployment notes.

---

## ⚡ Quick Start

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

## 🗂 Project Structure

This README covers the core folders and key files. For the full breakdown, see [docs/project-structure.en.md](./docs/project-structure.en.md).

```text
app/                                       # Routes, layouts, and page entrypoints
├─ layout.tsx                              # Root layout with cookie-driven locale and metadata
├─ page.tsx                                # Landing page
├─ providers.tsx                           # Global providers for theme and i18n
├─ auth/                                   # Public auth flow: sign in, sign up, redirects
│  ├─ sign-in/page.tsx                     # Sign-in page entry
│  ├─ sign-in/sign-in-form.tsx             # Sign-in form, errors, and callback handling
│  ├─ sign-up/page.tsx                     # Sign-up page entry
│  └─ sign-up/sign-up-form.tsx             # Registration form and post-sign-up login flow
├─ api/                                    # Server routes: auth, sign-up, health checks
│  ├─ auth/[...nextauth]/route.ts          # NextAuth entry route
│  ├─ auth/sign-up/route.ts                # Registration endpoint
│  └─ dev/ready/route.ts                   # Local runtime health endpoint
└─ app/                                    # Authenticated workspace
   ├─ layout.tsx                           # App shell with sidebar and topbar
   ├─ page.tsx                             # Dashboard overview
   ├─ board/page.tsx                       # Board view
   ├─ list/page.tsx                        # List view
   ├─ applications/                        # New, detail, and edit pages
   ├─ calendar/                            # Phase 2 placeholder
   ├─ materials/                           # Phase 2 placeholder
   ├─ offers/                              # Phase 2 placeholder
   ├─ analytics/                           # Phase 2 placeholder
   ├─ ai/                                  # Phase 3 placeholder
   └─ settings/                            # Settings and future extension entry

components/                                # Shared components across routes
├─ app-sidebar.tsx                         # Main left navigation
├─ app-topbar.tsx                          # Top navigation and page action area
├─ language-switcher.tsx                   # One-click locale toggle
├─ phase2-plan.tsx                         # Shared Phase 2 placeholder content
├─ coming-soon.tsx                         # Generic placeholder wrapper
├─ empty-state.tsx                         # Empty list and empty search state
├─ status-badge.tsx                        # Status-to-visual mapping
└─ ui/                                     # Atomic UI primitives

features/                                  # Business domains
├─ applications/                           # Core application-tracking domain
│  ├─ actions.ts                           # Create, update, status move, notes, and events
│  ├─ queries.ts                           # Board, list, detail, and stats queries
│  ├─ schema.ts                            # Form and input validation
│  └─ components/                          # Card, form, timeline, and detail components
└─ dashboard/                              # Dashboard aggregation and metrics

lib/                                       # Auth, i18n, runtime checks, and utilities
├─ auth.ts                                 # Authentication logic
├─ auth.config.ts                          # NextAuth config
├─ auth-helpers.ts                         # Helpers such as requireUser
├─ auth-route.ts                           # Credentials callback entry
├─ date.ts                                 # Locale-aware date formatting
├─ enums.ts                                # Single source of truth for statuses and priorities
├─ runtime-env.ts                          # Env and database readiness checks
├─ runtime-health-client.ts                # Client-side preflight checks
├─ runtime-health-shared.ts                # Shared boot diagnostics
└─ i18n/                                   # Dictionaries, provider, and locale persistence
   ├─ config.ts                            # Locale configuration
   ├─ actions.ts                           # Server action for locale switching
   ├─ client.tsx                           # I18n provider and hooks
   ├─ server.ts                            # Server-side dictionary loading
   └─ dictionaries/
      ├─ zh.ts                             # Chinese source copy
      └─ en.ts                             # English mirror dictionary

db/                                        # Schema, connection, and seed data
├─ schema.ts                               # Drizzle schema
├─ client.ts                               # Database connection
├─ seed.ts                                 # Demo seed data
└─ migrations/                             # Migration files

scripts/                                   # Local DX and ops scripts
└─ dev.ts                                  # doctor / setup / start

docs/                                      # Chinese-first docs plus English mirrors
├─ deployment.md                           # Chinese deployment guide
├─ deployment.en.md                        # English deployment guide
├─ phase-1.md                              # Phase 1 Chinese delivery notes
├─ phase-1.en.md                           # Phase 1 English delivery notes
├─ project-structure.md                    # Chinese structure guide
├─ project-structure.en.md                 # English structure guide
└─ assets/README.en.md                     # Screenshot and static asset guide
```

---

## 📚 Documentation

**🚦 Getting Started**
- [Chinese README](./README.md)
- [Deployment](./docs/deployment.en.md)
- [FAQ](./docs/faq.en.md)

**🧭 Project**
- [Project Structure](./docs/project-structure.en.md)
- [Roadmap](./docs/roadmap.en.md)

**📝 Phase Notes**
- [Phase 1](./docs/phase-1.en.md)
- [Phase 2 Plan (historical)](./docs/phase-2-plan.en.md)
- [Next.js Upgrade Assessment](./docs/nextjs-upgrade-assessment.en.md)

---

## 🧪 Scripts

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

## 📌 Known Boundaries

- The current delivery target stays on the Phase 1 usable loop. No new Phase 2 work, AI features, or Gmail integration in this round.
- Single-user scope only. No collaboration, recruiter-side ATS, auto-apply, or automated email handling.
- The public demo runs at `https://job-flow-sandy.vercel.app/`; deployment snapshot domains are not used as the main entry.
- No `LICENSE` file has been committed yet, so licensing remains undecided.

---

## ⚖️ License

License: **TBD**. Please confirm usage rights before reusing, modifying, or redistributing the project.
