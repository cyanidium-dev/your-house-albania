# Own analytics store and panel

Which pages, sources and search queries bring visitors and leads, counted on
our side. GA4 sees a few percent of visits (consent banner), Clarity splits
every page into its own session, and Search Console forgets everything after
16 months. This store keeps daily aggregates in our own Postgres database and
shows them next to the Sanity leads at **`/editor/analytics`** (editor
password, `noindex`).

```
browser                                server                                  panel
LeadTracker → recordPageView()         POST /api/metrics/hit ─ after() ─┐
           └→ sendHit() (sendBeacon) ─▶  bots dropped, body validated   ├─▶ Neon Postgres ─┐
                                                                         │   visit_daily    │
Vercel cron 03:30 UTC ─▶ GET /api/cron/nightly ─ gsc job ─ Search Console API ─▶ gsc_daily  ├─▶ /editor/analytics
                                                                                  import_log │      + Sanity leads,
                                                                                             │        viewCounter docs
```

Everything is optional. Until the database exists the beacon answers 204 and
writes nothing, the cron reports `skipped: no database`, and the panel shows
the Sanity-backed sections (leads by source and landing page, listing
popularity) with "—" for visits and a status box that says what is missing.

## What is stored

| Table | One row per | Counts |
| --- | --- | --- |
| `visit_daily` | day × landing path × source × medium × campaign × locale × device × country | `visits` (+1 when a visit starts) |
| `pageview_daily` | day × path × locale | `views` (+1 per page view) |
| `gsc_daily` | day × page path × query | `clicks`, `impressions`, `position_weighted` (position × impressions, so averages stay exact) |
| `import_log` | job run | `ok`, `detail` (the backfill cursor lives here) |

- Days are UTC. Paths are the pathname only: no origin, query string or
  fragment, no trailing slash, at most 200 characters.
- A visit starts on the first page of an attribution session
  (`src/lib/analytics/attribution.ts`: per tab, 30-minute continuation into new
  tabs, new UTM campaign = new session, as in GA4). Source/medium/campaign are
  the ones that session already carries, the same ones a lead gets.
- Device comes from the user agent on the server (mobile / tablet / desktop),
  country from Vercel's `x-vercel-ip-country` header.

## What is deliberately not stored

- No IP address, no user agent, no cookie, no visitor or session id. The
  beacon adds no browser storage of its own; it reads the session the lead
  attribution already keeps in `sessionStorage`.
- No query strings (they can carry e-mails or names), no referrer URLs, no
  page titles, no per-visit rows. Nothing in the database can be traced back
  to a person; it is a set of counters.
- Crawlers, headless browsers, HTTP libraries, `navigator.webdriver`
  browsers, the owner's own browser once flagged with `?domlivo_internal=1`,
  and preview deployments (`VERCEL_ENV` other than `production`) are not
  counted. A per-instance throttle caps one client at 120 hits and 20 visit
  starts per 10 minutes.

## Environment variables

| Name | Needed for | Notes |
| --- | --- | --- |
| `DATABASE_URL` | visits, page views, Search Console copy | Set by Vercel's Neon integration. `POSTGRES_URL` is accepted too. |
| `GSC_SERVICE_ACCOUNT_JSON` | Search Console import | The whole JSON key file of the service account, pasted as one value. |
| `GSC_SITE_URL` | Search Console import | Optional, default `sc-domain:domlivo.com` (the domain property). |
| `CRON_SECRET` | nightly cron | Already required by the currency cron. Vercel sends it as `Authorization: Bearer …`; without it every cron call is refused with 401. |
| `SANITY_API_TOKEN` | leads and view counters in the panel | Already set; leads are read only with the server-side token. |

## Owner setup

1. **Database.** Vercel dashboard → the project → Storage → Create Database →
   Neon (free plan) → connect it to this project (all environments). This sets
   `DATABASE_URL`. Tables are created automatically on first use.
2. **Search Console access.**
   1. Google Cloud console → create a project (e.g. "domlivo-analytics").
   2. APIs & Services → Library → enable **Google Search Console API**.
   3. IAM & Admin → Service accounts → create one (no roles needed) → Keys →
      Add key → JSON. A file downloads.
   4. Search Console → domlivo.com property → Settings → Users and permissions
      → Add user → the service account's e-mail (`…@….iam.gserviceaccount.com`)
      with permission **Restricted**.
   5. Vercel → Settings → Environment Variables → `GSC_SERVICE_ACCOUNT_JSON` =
      the full contents of the JSON file. Mark it sensitive.
3. **Redeploy** (Deployments → latest → Redeploy) so the new variables apply.
   Check that `CRON_SECRET` exists under Environment Variables (the currency
   cron needs it too).

After that the first nightly run backfills Search Console newest month first,
about 40 s per night, until 16 months are in; recent days are re-imported
every night. To run it by hand:
`curl -H "Authorization: Bearer $CRON_SECRET" https://www.domlivo.com/api/cron/nightly`.
The panel's status box shows table sizes and the last import results.

Browse the site once with `?domlivo_internal=1` from every browser you use, so
your own visits do not count (the same flag marks your test leads as spam).

## Limits

- Neon free plan: 0.5 GB storage per project at the time of writing, and a
  monthly compute allowance; compute sleeps after a few idle minutes and each
  beacon or panel view wakes it. Check Neon console → Usage after the first
  weeks. Each beacon is one HTTP round trip (both upserts in one transaction).
- `gsc_daily` is the table that grows: roughly (page, query) pairs with an
  impression per day. At a few thousand pairs a day, 16 months is a few hundred
  MB with its index. If it nears the cap, roll rows older than a year into
  monthly totals.
- Search Console publishes final data 2–3 days late and drops anonymised
  queries; its totals are lower than the Search Console UI's chart.

## Adding a nightly job

`src/lib/cron/nightlyJobs.ts`: add `{ name: 'popularity', run: fn }` to
`NIGHTLY_JOBS`. Jobs run in order inside one 60 s function; a failure is
reported in the JSON response and the next job still runs.

## Files

| Where | What |
| --- | --- |
| `src/lib/analyticsStore/db.ts` | Neon client (`getSql`, injectable `SqlClient`), schema, `import_log` |
| `src/lib/analyticsStore/paths.ts` | Path normalisation shared by beacon, leads and Search Console |
| `src/lib/analyticsStore/hit.ts` | Beacon validation, row building, upserts, throttle |
| `src/lib/analyticsStore/gscAuth.ts` | Service-account JWT → access token (`node:crypto`, no googleapis) |
| `src/lib/analyticsStore/gscImport.ts` | Nightly import: catch-up + month-by-month backfill |
| `src/lib/analyticsStore/reports.ts` | Panel SQL |
| `src/lib/analytics/hitBeacon.ts` | Client beacon, called from `LeadTracker` |
| `src/app/api/metrics/hit/route.ts` | Beacon endpoint (always 204) |
| `src/app/api/cron/nightly/route.ts`, `src/lib/cron/*` | Cron route, auth, job list |
| `src/app/editor/analytics/page.tsx`, `src/features/editor/analytics/*` | Panel, Sanity reads, UTM builder |
