# FAQ

This isn't a troubleshooting list — it's a defense of design choices. A lot of these look counterintuitive at first and make sense once you see the trade-off. Eight of the most-asked questions below.

## Why port 3001 instead of 3000?

`3000` is the default for Next.js, CRA, and Vite. Running three or four Node projects locally at once is normal, so pinning JobFlow to `3001` lets it coexist without `PORT=... next dev` gymnastics every time.

## Can I switch it back to 3000?

Yes — change `-p 3001` to `-p 3000` in the `dev` and `start` scripts in `package.json`, and set `AUTH_URL=http://localhost:3000` in `.env`. Not recommended though: the moment you change the default, CI scripts, README examples, and `dev:doctor` messages all need to stay in sync. Maintenance cost beats the benefit.

## Why a hand-rolled date picker instead of `react-day-picker`?

Phase 1 needs: click to open, accept `yyyy-mm-dd` keyboard input, integrate with zod validation. `react-day-picker` is a solid library, but adopting it means eating its CSS, locale, and accessibility conventions — a week of integration with the existing Tailwind + shadcn stack. The DIY version is 200 lines, zero dependencies, and follows the theme toggle for free. When Phase 2 Calendar actually needs a real grid view, reconsider.

## Why keep English words like "Offer" and "OA" in the Chinese UI?

In the Chinese job-search vernacular, translating "Offer" or "OA" (online assessment) feels off — the community uses the English terms. UI copy is a communication tool, not a translation test. Preserving industry jargon beats forced Chinese renderings. The English version reciprocates: it doesn't localize "interview" into something fancier.

## Why are the demo credentials sitting in the README?

JobFlow targets local or single-user self-hosting. The demo account lives in *your* database; exposing it is no riskier than exposing `localhost`. Hiding it only adds friction to the first-run experience. For real deployments, run a cleanup beyond `npm run db:seed` and create real users.

## Why doesn't i18n use URL prefixes (`/en/app/...`)?

URL prefixes make sense when SEO matters. JobFlow is an authenticated workspace — zero SEO weight. Language detection uses cookies + `Accept-Language`; switching doesn't change the URL, preferences survive refresh. The cost is you can't share a link forcing a specific language, but a job-search dashboard has no such sharing scenario.

## Why are Phase 2 pages placeholders instead of 404 / blank?

Phase 2 — Calendar / Materials / Offers / Analytics — is already surfaced in navigation. Returning a 404 makes users wonder if it's a bug. Showing "planned + link to the plan doc" is honest: it tells you what'll be here and why it isn't yet. All four routes share the same `Phase2Plan` component, so the maintenance surface stays small.

## Why NextAuth while it's still in beta?

`next-auth@5.0.0-beta.20` is far kinder to App Router than the v4 stable line: native Route Handler integration, `auth()` callable straight from Server Actions, Edge Runtime support. v4 + App Router needs hand-written adapter glue. The beta risk is API drift — but Phase 1 only uses login + session, so migrating once v5 stabilizes is bounded work.
