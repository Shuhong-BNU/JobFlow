# Phase 2 Plan (Historical)

> **This is the planning-stage document** (written near the end of Phase 1). For what actually shipped and the trade-offs taken, see [`phase-2.en.md`](./phase-2.en.md).
> This file is kept as a "what we thought we'd build vs. what we built" comparison and is no longer updated.
>
> Biggest deviations from the original plan: Materials shipped URL-first (external links, no Supabase Storage upload); Calendar got a month view only (no week view, no drag-to-reschedule); Analytics ships honest facts only (no WoW trends, no channel funnel).

## 0. Shared principles

- **All writes still go through server actions.** The `actions.ts / queries.ts / schema.ts` layering from Phase 1 stays intact.
- **All reads and writes stay scoped by `user_id`.** New modules do not relax this.
- **All user-visible text stays in `lib/i18n/dictionaries/*.ts`** — no hardcoded strings in new components.
- **No new dependencies without discussion.** Calendar, charting, and upload libraries are shortlisted below and locked in when Phase 2 starts.

---

## 1. Calendar

### Product goal
Aggregate `applications.deadlineAt` and `application_events.startsAt` into a single month/week view, replacing the Excel / Notion timelines users maintain by hand.

### Key capabilities
- Month and week views, default to month.
- Source badges: deadline / OA / interview / offer response / custom — distinct colors.
- Clicking a cell navigates to the corresponding application detail tab.
- Filter by company / status / priority; filter state persists to the URL.
- Drag-to-reschedule: drop an event on another day → `updateEvent` server action → detail timeline refreshes.

### Technical notes
- Library candidates: `react-big-calendar`, or a lightweight self-built month grid on top of `components/ui/calendar.tsx`.
- Data model: reuse `applications` and `application_events`. No new tables.
- Time zones: DB stores UTC. Render in the browser's local zone with `date-fns`.

### Acceptance
A user can see all deadlines and interviews for the next two months, drag an event to a new date, and watch the application timeline update.

---

## 2. Materials

### Product goal
Centralize resumes, cover letters, portfolios, transcripts, and certificates — and track which version was sent to which role.

### Key capabilities
- File upload with version labels (e.g. `resume-v3-spring26`).
- Group by type: resume / cover_letter / portfolio / transcript / certificate / other.
- Bind materials to applications from the detail-page Materials tab.
- Flag stale or unused materials after N days without use.

### Schema sketch (to land in Phase 2)
```
materials(
  id pk, user_id fk,
  type MaterialType, name, file_url, version, tags jsonb, notes,
  created_at, updated_at,
  idx(user_id, type)
)
application_materials(
  id pk, application_id fk, material_id fk,
  purpose,            -- 'submitted_resume' / 'submitted_cl' / 'reference'
  created_at,
  unique(application_id, material_id, purpose)
)
```

### Technical notes
- Storage candidate: Supabase Storage (env slot already reserved; not enabled in Phase 1).
- Size: resumes are tiny; cap portfolios around 50MB with a clear client-side message.
- No inline preview in v1 — a direct download link is enough.

### Acceptance
Upload a resume → create a new application and tick "bind resume v3" → the file is downloadable from the detail page's Materials tab.

---

## 3. Offers

### Product goal
When a user has multiple offers, surface comp, location, team, and response deadline side by side to support the decision.

### Key capabilities
- Auto-aggregate every application in `current_status = 'offer'` into a comparison table.
- One column per offer, free sorting.
- Capture: base / bonus / total / location / team / response deadline / decision status (pending / accepted / declined / expired).
- Free-form pros and cons text.
- Offers nearing their response deadline surface on the dashboard.

### Schema sketch (to land in Phase 2)
```
offers(
  id pk, application_id fk unique,
  base_salary, bonus, location, team,
  response_deadline_at,
  decision_status OfferDecision default 'pending',
  pros text, cons text,
  created_at, updated_at
)
```

### Technical notes
- 1:1 via `application_id unique`. If rebase support is needed later, relax to 1:N.
- Response deadline is semantically different from `applications.deadlineAt` — do not reuse the field.

### Acceptance
A user with three offers opens `/app/offers`, sees them in a comparison table, edits pros/cons, and sees a "needs response within 7 days" card on the dashboard.

---

## 4. Analytics

### Product goal
Feed back pipeline rhythm, wait times, and channel effectiveness so users can adjust their next batch. **No vanity charts** — three views that actually change behavior.

### Key views
1. **Status funnel**: wishlist → applied → oa → interview → offer, with count and pass rate per layer.
2. **Wait-time distribution**: average days between stage transitions, median or boxplot is enough.
3. **Channel effectiveness**: response rate grouped by `applications.source` (what fraction reach OA or interview).

### Data sources
- Funnel reads `applications.current_status` directly.
- Wait times need event timestamps in `application_events` for `applied / oa / interview / offer_response`. The Phase 1 events table already covers this.
- Channel effectiveness uses `applications.source` plus current status.

### Technical notes
- Chart library candidate: `recharts` (small, declarative, no canvas dependency).
- Aggregation happens in `features/analytics/queries.ts`, not on the client.

### Acceptance
A user with 20+ applications can open `/app/analytics` and, within 30 seconds, reach an actionable conclusion such as "My BOSS Zhipin reply rate is much lower than referrals."

---

## 5. Explicit non-goals

- No task system (todos / reminders). Phase 2 stays event + deadline driven.
- No team or sharing features.
- No JD parsing or AI suggestions — those belong in Phase 3.
- No mail ingestion — Phase 4.

---

## 6. Pre-flight checklist before Phase 2 starts

- [ ] Phase 1 bug polish wrapped up (forms, dates, i18n coverage, drag edges).
- [ ] `materials` and `offers` schemas locked in a dedicated review before migrations.
- [ ] Supabase Storage cost estimate (materials traffic is non-trivial).
- [ ] Calendar library locked in to avoid mid-build swaps.
