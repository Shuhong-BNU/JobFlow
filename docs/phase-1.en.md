# Phase 1 Delivery Record

> **Status**: Phase 1 is frozen. Everything in scope has shipped — this is the MVP milestone. New capabilities go through [the Phase 2 plan](./phase-2-plan.en.md); this document only keeps "how to verify, how to run, and what closeout fixes landed."

## Phase scope

Phase 1 is a working MVP for managing a job-search pipeline end to end.

Included:

- Sign-up, sign-in, and sign-out
- Application CRUD
- Automatic company creation
- 8 fixed board columns with drag-and-drop status updates
- Search, filtering, and sorting in the list view
- Dashboard counts, deadlines, events, risks, and recent updates
- Application detail page and timeline
- Unified date picker (`yyyy-mm-dd` / `yyyy-mm-dd HH:mm`, text field + calendar popover)
- Visual required / optional markers on forms
- Chinese/English switching, defaulting to Chinese, persisted with cookies
- Light/dark theme toggle

Excluded:

- Full Phase 2 feature implementation
- AI features
- Gmail integration
- Database schema changes

## What is already shipped

### Foundation

- Next.js 14 + strict TypeScript
- Tailwind CSS + base UI primitives
- Drizzle ORM + Supabase Postgres
- NextAuth v5 + credentials auth
- React Query, Server Actions, and RSC

### Product flow

- Auth flow: sign-up, sign-in, sign-out
- Application management: create, edit, delete, detail view
- Board: 8 fixed stages with drag-and-drop and optimistic updates
- List: search, status filter, priority filter, sorting
- Timeline: events and notes
- Dashboard: counts, deadlines, events, risks, recent updates

### Internationalization

- Default language: Chinese
- Switching model: cookie-based, no URL locale prefix
- Language switcher is already wired into the landing page, auth pages, and authenticated shell
- Switching language refreshes the current page immediately and persists the choice

## Local run

Preferred path (built-in self-check + migration + seed):

```bash
npm install
cp .env.example .env
npm run dev:doctor
npm run dev:setup
npm run dev:start
```

Plain path:

```bash
npm install
cp .env.example .env
npm run db:push
npm run db:seed
npm run dev
```

Default URL:

```text
http://localhost:3001
```

Demo account:

```text
demo@jobflow.local / demo1234
```

## Environment variables

Required:

- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_URL`

Notes:

- `AUTH_URL` should default to `http://localhost:3001`
- If the dev port changes, update `AUTH_URL` as well
- Storage and OpenAI variables may stay empty in Phase 1

## Port notes

The default dev script uses `3001` to avoid the common `3000` conflict.

If another port is needed:

```bash
npx next dev -p 3002
```

Then update `.env`:

```env
AUTH_URL=http://localhost:3002
```

## Smoke Test

The 12-step manual acceptance path for Phase 1. Covers three arcs — new user onboarding → core business flow → sign-out regression. Use it after any contributor change to prove nothing broke, or walk an interviewer through it end-to-end.

1. A new user can register at `/auth/sign-up` and land on `/app`
2. The demo account (`demo@jobflow.local` / `demo1234`) can sign in successfully
3. The dashboard shows counts, deadlines, events, risks, and recent updates
4. The board renders correctly and supports drag-and-drop
5. Board status changes survive refresh
6. Creating an application can auto-create a new company
7. The detail page can add events and notes
8. The edit page persists changes
9. Deleting an application removes it from board and list
10. Search, filters, sorting, and clear all work in the list page
11. Language switching updates the current page immediately and persists after refresh
12. Visiting `/app` while signed out redirects back to sign-in

## Not included right now

The following remain out of scope for Phase 1:

- Full Calendar feature
- Materials upload and binding
- Offers module
- Analytics module
- AI features
- Gmail integration

Placeholder routes remain only to keep navigation stable. They do not indicate Phase 2 work has started. The four Phase 2 modules (calendar / materials / offers / analytics) currently render the "Phase 2 plan" outline — see [docs/phase-2-plan.en.md](./phase-2-plan.en.md).

## Closeout fixes after manual QA

Before freezing Phase 1 the project went through several rounds of manual QA with targeted fixes. Key closeout items:

- **Unified date input**: dropped the browser-native `<input type="date">` (it renders inconsistently across locales, e.g. `yyyy-mm-日` on zh-CN). Replaced with in-house `components/date-picker.tsx` + `components/datetime-picker.tsx`: a text field constrained to `yyyy-mm-dd` / `yyyy-mm-dd HH:mm`, plus a right-side button that opens a self-built `components/ui/calendar.tsx` month grid; hour/minute pickers use Select with 15-minute granularity.
- **Required / optional markers**: required inputs (company, role title) show a red `*`; optional inputs (deadline, applied-on, notes) show an "Optional" caption. The timeline "Add event" / "Add note" forms follow the same convention.
- **Copy rollback**: Chinese UI keeps the English word "Offer" (an earlier round that translated it to 「录用」 was reverted).
- **Schema gotcha fixes**: `optionalDate` accepts `string | Date` then `transform` with `ctx.addIssue` so the client can surface localized errors; list-view ordering moved its `NULLS LAST` clause from a Drizzle helper into a raw `sql` template.
- **Navigation de-duplication**: the duplicate "New application" button in the Dashboard / Board / List headers was removed — the Sidebar entry is the single source.
