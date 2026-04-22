# Phase 2 — Shipping notes

> This file records what Phase 2 actually shipped. The roadmap version still lives at [`phase-2-plan.en.md`](./phase-2-plan.en.md).
> Where the two diverge, trust this file — it describes the trade-offs made during implementation.

Phase 2 froze in three small milestones, each tagged:

| Tag    | Scope                                      | Routes                                                  |
| ------ | ------------------------------------------ | ------------------------------------------------------- |
| v0.2.0 | Progress view + deployment support         | `/app/list?view=progress`, README / deployment docs     |
| v0.3.0 | Offers, Calendar, Analytics                | `/app/offers`, `/app/calendar`, `/app/analytics`        |
| v0.4.0 | Materials (URL-first, no Storage upload)   | `/app/materials`, `/app/applications/[id]?tab=materials`|

No new database tables. Every Phase 2 table (`offers` / `materials` / `application_materials`) was already declared in Phase 1's `db/schema.ts` — we just wired up the UI and server actions.

---

## v0.2.0 — Progress view + deployment support

### What shipped
- `/app/list` gained a `?view=progress` variant that lays out the six trunk stages (wishlist → applied → oa → interview → hr → offer) horizontally per application.
- Terminal statuses (rejected / archived) don't map to a trunk stage, so we derive the "furthest reached" index from events: `offer_response → 5`, `interview → 3`, `oa → 2`, `appliedAt → 1`, else 0. Not a guess at the farthest stage — an *evidence-backed* guess.
- README and `docs/deployment.md` gained a Live demo section plus caveats for public demo hosting (shared credentials, data drift, Vercel + Supabase Pooler combo, cost note).

### Design calls
- **View is URL state, not a new route.** No point introducing Board / List / Progress as three separate top-level navs. The switch lives on the list page and updates `?view=progress`; both variants reuse the same query.
- **Terminal backfill from events, not a status history table.** Building `application_status_history` would cost more than it's worth at this stage; events already record each stage touchdown.

---

## v0.3.0 — Offers / Calendar / Analytics

### Offers (`/app/offers`)
- Applications ↔ offers are 1:1, keyed on `offers.applicationId`.
- All fields are optional except `decisionStatus` (default `pending`). Real offers start with a verbal number and fill in later — forcing required fields just blocks data entry.
- UI shape: one `upsert` action and one `OfferForm`. The detail page's Offer tab `OfferPanel` toggles between "none / creating / view / edit" internally — no separate "new vs. edit" routes.
- Overview sorted by `updatedAt desc` so pending offers rise naturally. Cards carry DecisionPill, response deadline, and four key fields.

### Calendar (`/app/calendar`)
- One month grid: 6×7 = 42 cells, Monday start.
- Two data sources merged: `applications.deadlineAt` virtualized as `eventType: 'deadline'` and real `application_events` rows. Sorted by `at` asc.
- URL driven: `?m=yyyy-MM` picks the anchor month; invalid values fall back to current month. The Today button clears the query param.
- **No drag-to-reschedule.** The roadmap called for it, but it needs React DnD + optimistic updates + rollback on conflict — well beyond v1 scope. Parked for Phase 3.
- Max 3 items per cell, overflow collapses into "+N". Clicking an item jumps to the application detail.

### Analytics v1 (`/app/analytics`)
- Deliberately conservative. v1 produces only primary facts — no AI insights.
- Funnel: cumulative by **current status**. offer = `byStatus[offer]`, hr = `byStatus[hr] + byStatus[offer]`, and so on. Over-counting (suggesting an offer when there isn't one) is worse than under-counting, so v1 chooses honest under-counts. Rejected / archived are shown as separate counters, not mixed into the funnel.
- Sources: `nullif(trim(source), '')` → 'Unknown' fallback. No event replay.
- Waiting: for applications with current status ∈ {applied, oa} and a non-null `appliedAt`, compute `avg / max(now() - appliedAt)` as the "still waiting" average and peak.
- **Not in v1**: week-over-week trends (needs status-transition history), "health scores" (no agreed rubric), fake empty-state numbers (real zero → real EmptyState).

---

## v0.4.0 — Materials

### What shipped
- `/app/materials` library page: type filter chips, inline "new material" form, card grid.
- `/app/applications/[id]?tab=materials` tab: current bindings + "attach material" form.
- Five server actions: `createMaterial` / `updateMaterial` / `deleteMaterial` / `attachMaterialToApplication` / `detachMaterialFromApplication`.
- Six material types already defined in `lib/enums.ts` (resume / cover_letter / portfolio / transcript / certificate / other) — no additions.

### The key call: URL-first, no Storage upload
**The roadmap called for Supabase Storage uploads.** v1 didn't ship that. Why:

1. Full Storage integration would require `@supabase/supabase-js`, signed URL generation, upload UI, MIME / size validation, orphan blob cleanup on delete — heavy for a feature whose core value is "remember which version I sent."
2. `materials.fileUrl` already exists. Storing external URLs (Google Drive, Dropbox, self-hosted) covers 80% of the real use case: the user just wants to know *which* version went to *which* role. Whether the bytes live in our bucket is a secondary concern.
3. v1 doesn't create a bucket, so Phase 3 can add Storage later as a purely additive upgrade — not constrained by v1's implementation.

### Binding semantics
- `application_materials` has a unique index on `(applicationId, materialId, purpose)`.
- The same material can attach to the same application under different purposes (e.g. purpose = "submitted" and "revised" as two separate bindings).
- `attachMaterialToApplication` is idempotent: if the exact triplet already exists, it returns the existing bindingId instead of hitting the unique constraint.
- Deleting a material cascades to all its bindings (schema enforces `onDelete: 'cascade'`).

### UI details
- The detail tab has no "create new material" button — we push users to `/app/materials` for creation so the detail form doesn't balloon.
- When the library is empty, the attach button is disabled and a link points to the library page.
- Library cards edit in place (pencil icon swaps in the form). No dialog.

---

## Phase 2 overall verification

After each milestone:
- `npm run typecheck` — clean
- `npm run lint` — clean
- `npm run build` — clean (Next.js 14 generates 17 pages)

Data verification: `npm run db:seed` loads a full Phase 2 sample dataset (3 materials, 2 bindings, 1 offer, 6 events). Running `dev:start` shows every module non-empty immediately.

---

## Discussed but not shipped

| Item                           | Decision          | Reason                                                                     |
| ------------------------------ | ----------------- | -------------------------------------------------------------------------- |
| Drag-to-reschedule on calendar | Phase 3           | Optimistic updates + rollback exceed v1 budget                             |
| Calendar week view             | Skip              | Month view covers primary usage; week view adds little on mobile           |
| Materials file upload          | URL-first instead | See "key call" above                                                       |
| Materials staleness warnings   | Skip              | Needs a rubric for "N days unused" that we haven't agreed on               |
| Analytics WoW trends           | Skip              | Needs `application_status_history` or event replay — not worth v1 cost    |
| Analytics channel funnel       | Skip              | Cross (source × stage) pivot; the existing group-by-source already answers 80%|
| Phase 2 schema changes         | None              | Every Phase 2 table was already declared in Phase 1                        |
