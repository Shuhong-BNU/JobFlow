# JobFlow

JobFlow is a focused workspace for managing a job search pipeline. Applications, deadlines, interviews, timeline notes, and offer signals stay on one clear board.

The repository is currently in **Phase 1 MVP**. Authentication, application CRUD, drag-and-drop board flow, list filters, detail pages, and dashboard are already in place. **Phase 2 features, AI features, and Gmail integration are not included.**

## Current capabilities

- Email sign-up, sign-in, and sign-out
- Application CRUD with automatic company creation
- 8 fixed board columns with drag-and-drop status updates
- Search, filtering, and sorting in the list view
- Dashboard with counts, upcoming deadlines, events, risks, and recent updates
- Application detail page with overview and timeline (events + notes)
- Chinese and English switching, defaulting to Chinese, persisted with cookies
- Light and dark theme toggle

## Stack

- **Framework:** Next.js 14 (App Router) + TypeScript (strict)
- **UI:** Tailwind CSS + shadcn/ui-style primitives
- **Data flow:** React Server Components + Server Actions + React Query
- **Auth:** NextAuth v5 (Credentials / JWT sessions) + Drizzle Adapter
- **Database:** Supabase Postgres
- **ORM:** Drizzle ORM + drizzle-kit
- **Drag and drop:** dnd-kit

## Local setup

### 1. Requirements

- Node.js 18.18+ (20+ recommended)
- A working Supabase project

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in at least:

- `DATABASE_URL`
  Use your Supabase Postgres connection string. Phase 1 development uses the direct `5432` connection by default.
- `AUTH_SECRET`
  Generate one with `openssl rand -base64 32`.
- `AUTH_URL`
  Defaults to `http://localhost:3001`.

Supabase Storage and OpenAI variables can stay empty for now. They are not used in Phase 1.

### 4. Initialize the database

```bash
npm run db:push
npm run db:seed
```

The seed script creates a demo account:

```text
demo@jobflow.local / demo1234
```

### 5. Start the app

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

## Port notes

- The default dev/start scripts run on `3001`
- This avoids the usual `3000` conflict
- If you use another port, update `AUTH_URL` in `.env` as well

Example:

```bash
npx next dev -p 3002
```

Then:

```env
AUTH_URL=http://localhost:3002
```

## Fastest local path

```bash
npm install
cp .env.example .env
npm run db:push
npm run db:seed
npm run dev
```

## Acceptance checklist

Recommended smoke-test flow:

1. Register a new account at `/auth/sign-up` and confirm it lands on `/app`
2. Sign out from the avatar menu, then sign in with `demo@jobflow.local / demo1234`
3. Confirm `/app` shows counts, deadlines, events, risks, and recent updates
4. Open `/app/board` and verify the 8-column board renders correctly
5. Drag any card into another column and confirm the change survives refresh
6. Create a new application at `/app/applications/new` and confirm a new company can be created automatically
7. Open the detail page and add one event plus one note
8. Edit the application, change status/priority/deadline, and save
9. In the list view, verify search, filters, sort, and clear
10. Switch between Chinese and English and confirm the current page updates immediately and persists after refresh
11. Toggle light/dark theme and confirm the UI stays stable
12. Sign out, then visit `/app` directly and confirm it redirects to sign-in

## Phase 1 boundaries

The following are explicitly **out of scope** right now:

- Full Calendar / Materials / Offers / Analytics implementation
- AI features
- Gmail integration
- Database schema changes

Placeholder routes remain in place only to keep navigation stable.

## Useful scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checks |
| `npm run db:generate` | Generate a Drizzle migration |
| `npm run db:push` | Push schema to the database |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run db:seed` | Seed demo data |

## Project layout

```text
app/                    Next.js App Router routes
  page.tsx              Landing page
  auth/                 Sign-in / sign-up
  api/auth/             NextAuth and sign-up endpoint
  app/                  Authenticated shell
    page.tsx            Dashboard
    board/              Board
    list/               List
    applications/       New / detail / edit
features/               Domain logic (queries, actions, schema, components)
components/             Shared components and shell pieces
components/ui/          Base UI components
db/                     Drizzle schema, client, seed
lib/                    Auth, i18n, date, enums, shared helpers
docs/                   Phase docs
```

## Related docs

- [中文 README](./README.md)
- [Phase 1 Doc](./docs/phase-1.en.md)
- [Phase 1 中文文档](./docs/phase-1.md)
