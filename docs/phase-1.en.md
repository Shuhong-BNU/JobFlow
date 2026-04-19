# Phase 1 Delivery Record

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

## Acceptance checklist

1. A new user can register at `/auth/sign-up` and land on `/app`
2. The demo account can sign in successfully
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

Placeholder routes remain only to keep navigation stable. They do not indicate Phase 2 work has started.
