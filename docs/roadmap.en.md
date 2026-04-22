# Roadmap

Managing a job search isn't a one-shot project. This roadmap uses status words instead of promises — it tells you what JobFlow ships today, what's planned next, and what it won't do.

## At a Glance

| Module | Phase | Status | Value | Docs |
|---|---|---|---|---|
| Applications — Board / List / Detail / Timeline / Dashboard | Phase 1 | **Shipping** | One board, one full pipeline | [phase-1.en.md](./phase-1.en.md) |
| Calendar | Phase 2 | Planned | Deadlines and interviews on a month / week view | [phase-2-plan.en.md#1-calendar](./phase-2-plan.en.md) |
| Materials | Phase 2 | Planned | Versioned résumés / cover letters / portfolios, bound to the application they were sent with | [phase-2-plan.en.md#2-materials](./phase-2-plan.en.md) |
| Offers | Phase 2 | Planned | Side-by-side comparison when multiple offers land | [phase-2-plan.en.md#3-offers](./phase-2-plan.en.md) |
| Analytics | Phase 2 | Planned | Funnel, wait times, channel response rates — to steer the next batch | [phase-2-plan.en.md#4-analytics](./phase-2-plan.en.md) |
| JD parsing / interview prep | Phase 3 | Exploring | Paste a JD, get a structured draft; pre-interview context brief | — |
| Gmail ingestion | Phase 4 | Exploring | Auto-identify OA / interview / rejection mail and file it to the matching application | — |

---

## Now — Phase 1 (Shipping)

A single board covering the full pipeline — wishlist → applied → OA → interview → HR → offer → rejected → archived — with a Dashboard summary, list filters, detail timeline, and bilingual + theme toggles. Date picking, required-field hints, and a startup self-check are all in place.

Details in [phase-1.en.md](./phase-1.en.md).

## Also Shipping — Phase 2

Phase 2 shipped in three milestones: v0.2.0 (progress view + deployment support), v0.3.0 (Offers + Calendar + Analytics), v0.4.0 (Materials).

- **Calendar.** Single month view; merges deadlines and events; URL driven (`?m=yyyy-MM`). Drag-to-reschedule parked for Phase 3.
- **Offers.** 1:1 with applications, every field optional; editable from both the detail tab and the overview page.
- **Analytics v1.** Honest facts — funnel by current status, source distribution, still-waiting metrics. No WoW trends, no AI insights.
- **Materials.** URL-first — no file uploads. External-link registration + binding to applications. Storage upload stays in Phase 3.

Full shipping notes in [phase-2.en.md](./phase-2.en.md). The original plan remains in [phase-2-plan.en.md](./phase-2-plan.en.md) as a "what we thought we'd build" record.

---

## Next — Phase 3 (Planned / Exploring)

### Material file uploads (Planned)
**Capability.** Host material file bytes in Supabase Storage so the product doesn't depend on external links.
**User value.** One-stop management without Google Drive / Dropbox round-trips; enables version history and in-app preview.
**Dependencies.** Enabled Supabase Storage bucket, signed URLs, MIME / size validation, orphan cleanup on delete.

### JD parsing and next-step hints (Exploring)
Paste a JD → structured draft application; per-application lightweight "what to do next" hints. Failure modes never block the core CRUD.

### Calendar drag-to-reschedule (Exploring)
Drag an event onto another day → calls `updateEvent`. Needs optimistic updates + rollback. Out of v1 budget.

### Analytics WoW trends (Exploring)
Requires `application_status_history` or event replay. Deliberately out of v1.

---

## Later — Phase 4+ (Exploring)

> No timeline commitments. These are here to describe where the product boundary is heading, not a development schedule.

- **Gmail ingestion (read-only).** Auto-identify OA invites / interview invites / rejections / offer emails and file them onto the matching application's timeline. **No auto-apply. No auto-reply.**

---

## Non-goals

- No multi-user collaboration. JobFlow is a single-person job-search record.
- No recruiter-side view (ATS, JD publishing).
- No native app. Web-first; responsive on mobile browsers is enough.
- No auto-apply or auto-reply email. Every write action requires user confirmation.
- No "import your Excel and we'll take over." Manual entry is more reliable for early users.

---

## Feedback

This roadmap welcomes pushback. Open an Issue for disagreements, or start a Discussion if you have a better way to write a public roadmap.
