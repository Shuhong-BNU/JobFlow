# Deployment

JobFlow deploys on two principles: local development self-checks itself to green, and production needs exactly two env vars changed to go live. This doc walks scenarios; developer-side FAQs live in [faq.en.md](./faq.en.md).

## Local Development

**Prerequisites.** Node 18+ (20 LTS recommended), npm 9+, a reachable Postgres (Supabase or local).

The three-script trio:

```bash
npm run dev:doctor    # Checks .env and DATABASE_URL reachability
npm run dev:setup     # Installs deps + db:push + db:seed (runs once per DATABASE_URL)
npm run dev:start     # dev:setup + next dev
```

Plain commands as fallback:

```bash
npm install
cp .env.example .env   # fill in real values
npm run db:push
npm run db:seed
npm run dev
```

Default port is **3001**. Why and how to change it: [faq.en.md](./faq.en.md).

A demo account ships with the seed:

```
demo@jobflow.local / demo1234
```

`dev:setup` writes `.jobflow/dev-state.json` to remember which `DATABASE_URL` was last initialized. Next `dev:start` skips `db:push` + `db:seed` unless the URL changed.

---

## Environment Variables

`.env.example` groups variables by phase: Phase 1 required, Phase 2 reserved, Phase 3 reserved.

| Variable | Required | Purpose | Example |
|---|---|---|---|
| `DATABASE_URL` | Phase 1 | Postgres connection string; direct 5432 preferred | `postgresql://postgres:...@db.<ref>.supabase.co:5432/postgres?sslmode=require` |
| `AUTH_SECRET` | Phase 1 | NextAuth session signing key, 32+ random bytes | Generate with `openssl rand -base64 32` |
| `AUTH_URL` | Phase 1 | NextAuth callback base URL; must match the actual host | Local `http://localhost:3001`; prod `https://<your-domain>` |
| `SUPABASE_URL` | Phase 2 | Supabase project URL, needed once Storage is on | `https://<ref>.supabase.co` |
| `SUPABASE_ANON_KEY` | Phase 2 | Public anon key | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Phase 2 | Server-side key (never ship to the client) | `eyJhbGciOi...` |
| `SUPABASE_STORAGE_BUCKET` | Phase 2 | Bucket name for Materials | `materials` |
| `OPENAI_API_KEY` | Phase 3 | AI feature credentials | `sk-...` |
| `OPENAI_BASE_URL` | Phase 3 | For self-hosted / proxy gateways | `https://api.openai.com/v1` |
| `OPENAI_MODEL` | Phase 3 | Default model | `gpt-4o-mini` |

Leave Phase 2 / 3 vars empty during Phase 1. Startup won't validate them.

---

## Supabase Setup

1. Create a project at [supabase.com](https://supabase.com), pick a region close to your users.
2. Settings → Database → Connection string — grab both:
   - **Direct connection (5432).** Prefer this for migrations, Drizzle Studio, and seed scripts. Supports prepared statements.
   - **Connection pooler / Session (6543).** Prefer this for long-running serverless hosts (Vercel). Add `?pgbouncer=true`.
3. Drop it into `.env` as `DATABASE_URL`, keep the trailing `?sslmode=require`.
4. Run:

   ```bash
   npm run db:push     # drizzle-kit applies schema changes directly
   npm run db:seed     # inserts demo user + sample applications
   ```

5. Poke around the data: `npm run db:studio`.

**IPv4 / IPv6 gotcha.** Supabase direct-connect hostnames resolve to IPv6 by default, and some home ISPs can't route v6. Symptom: `dev:doctor` reports `db_unreachable` even though `ping` resolves fine. Fix: switch to the pooler string (v4-reachable), or enable IPv6 on your router.

---

## Production Build

```bash
npm run build   # emits static + server bundle to .next/
npm start       # starts the Next.js production server on port 3001
```

In production:

- `AUTH_URL` must point to the real domain, with `https://`. Leaving it as `http://localhost:3001` breaks login callbacks.
- `AUTH_SECRET` is **not** shared with development — generate a separate one.
- `DATABASE_URL` should use the pooler (6543) unless you're on a long-lived host (VPS / Docker).

---

## Deploy to Vercel

JobFlow is Next.js 14 App Router — Vercel just works.

1. **Import Git Repository.** Vercel → Add New... → Project → pick this repo.
2. **Environment Variables.** Project Settings → Environment Variables → set the three Phase 1 required vars. Configure Preview and Production separately.
3. **Build Command.** Default `next build` is fine.
4. **Root Directory.** Keep at repo root.
5. **Node.js Version.** ≥ 18.17, 20 recommended.
6. After the first deploy, copy the Vercel-assigned (or custom) domain back into `AUTH_URL` and redeploy.

> No "Deploy with Vercel" button in the README yet — this repo doesn't expose a Vercel template. Will add once public.

---

## Public demo deployment

A public-facing JobFlow demo is a different shape from a production deployment — production is single-user and trusts whoever logs in. For demos you have to think about:

**Shared demo account.** The seed script writes `demo@jobflow.local / demo1234` via an idempotent upsert. Share those creds publicly and every visitor logs in as the same user, sees the same data, and overwrites each other's changes — JobFlow has no multi-tenant isolation today, and that's intentional (see [faq.en.md · Why the demo password sits in the README](./faq.en.md)). Never point a demo instance at a real business database — spin up a dedicated Supabase project.

**Data drift and periodic reset.** Visitors will create, edit, and delete demo records. Two ways to hand the next visitor a clean slate:

1. Manual reset: `DATABASE_URL=<demo-db> npm run db:seed` — the seed script already does `delete where user_id = demo.id` before inserting, so it's idempotent.
2. Scheduled reset: Vercel Cron calling an API route that wraps the same seed logic. Not a shipped feature before Phase 2C — fork and wire it yourself if you need it.

**Sign-up toggle.** Ideally you'd disable sign-ups on a public demo (stops strangers from polluting the DB), but JobFlow doesn't ship a toggle yet. To fully block, drop a `notFound()` in `app/auth/sign-up` on a fork branch — don't merge back to main. Leaving sign-ups open is fine too; periodic resets cover most of it.

**Vercel + Supabase Pooler combo.** Public-demo load patterns look serverless (connections rise and fall with requests), and using the pooler string (6543 + `?pgbouncer=true`) keeps prepared-statement errors out of the way. Keep the direct 5432 string for local migrations and seeds.

**Cost.** Vercel Hobby (free) + Supabase Free (500 MB) is enough for low-traffic public demos. Seed data weighs in the tens of KB — reset freely.

---

## Self-hosted

Any Node 18+ host works:

- Pull code → `npm ci` → `npm run build` → `npm start`.
- Use `pm2` / `systemd` / Docker to keep it running.
- Reverse-proxy (Nginx / Caddy) 443 to 3001 and set `X-Forwarded-*` headers properly.
- Database can stay on Supabase, or point `DATABASE_URL` at any self-hosted Postgres.

No shipped Dockerfile — user setups vary too much (co-located Postgres? proxy layer? TLS termination?). Until that's settled, follow Next.js `output: "standalone"` and package it your way.

---

## Common Errors

| Symptom | Cause | Fix |
|---|---|---|
| Login redirect 404s / `CallbackRouteError` | `AUTH_URL` doesn't match the browser host | Set `AUTH_URL` to the exact scheme + host + port users actually hit |
| `dev:doctor` reports `db_unreachable` but ping works | Home ISP has no IPv6 routing; Supabase direct goes v6 | Switch to the pooler (6543) or enable IPv6 on the router |
| `db:push` hangs / times out | drizzle-kit doesn't love the pooler | Use the 5432 direct string for `db:push`, switch back to pooler after |
| `db:seed` hits unique constraint | Already seeded once | Either skip, or clear users/applications rows first |
| `EADDRINUSE :3001` | Another Node process on the port | `npx kill-port 3001` or use a different port (`next dev -p 3002`) |
| `bcryptjs` build failures | A host accidentally pulled native `bcrypt` | This project pins the pure-JS `bcryptjs`; uninstall `bcrypt` and reinstall deps |
| Vercel → Supabase throws `prepared statement` errors | Serverless + pooler + prepared statements don't mix | Add `?pgbouncer=true` to `DATABASE_URL`, or disable prepared statements at the postgres client |
| `npm run build` errors on `.next/trace` EPERM | Dev server still running and holding files | Stop the dev server, then build |
