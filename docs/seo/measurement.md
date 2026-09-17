# Measurement

Success is not "more pages in Google". It is more **non-branded impressions and clicks on the pages the registry indexes**, from the queries their clusters target, turning into leads — while the number of indexed thin pages goes down.

Search Console data lags 2–3 days and is incomplete for filtered views (anonymised queries are dropped). With ~3K impressions a quarter, judge **per page and per query**, never by the site total alone.

## Baseline (2026-09-17)

Search Console, `sc-domain:domlivo.com`, last 3 months (to 2026-09-14):

| Metric | Value |
|---|---|
| Clicks | 73 |
| Impressions | 3.3K |
| CTR | 2.2% |
| Average position | 12.1 |
| Queries with impressions | 165 |
| Pages with impressions | 299 |
| Indexed pages (Pages report, updated 2026-09-04) | 501 indexed / 169 not indexed |
| Branded clicks | ≈ 0 (agent-name queries only: "elena krasniqi", "drita hoxha") — practically all clicks are non-branded |
| Top countries (impressions) | Albania 1,202 · Ukraine 300 · Poland 267 · USA 232 · Italy 209 · UK 179 · Germany 119 · Netherlands 112 |

### Listing pages with impressions before the registry

All listing URLs under `/albania/` (excluding `/info`, `/districts`, guides, blog). Clicks · impressions · average position.

| URL | Clicks | Impr. | Pos. | Now |
|---|---:|---:|---:|---|
| `/pl/albania/sarande` | 0 | 166 | 34.3 | index |
| `/uk/albania/durres` | 1 | 46 | 14.8 | index |
| `/ru/albania/durres/sale` | 2 | 32 | 21.5 | 308 → `/ru/albania/durres` (index) |
| `/uk/albania/durres/sale` | 0 | 22 | 19.8 | 308 → `/uk/albania/durres` (index) |
| `/en/albania/sarande` | 0 | 22 | 20.6 | index |
| `/ru/albania/sarande` | 0 | 20 | 9.4 | index (ru added from this row, see keyword-research) |
| `/albania/sarande` (no locale) | 1 | 15 | 34.8 | locale redirect |
| `/uk/albania/shengjin/sale` | 2 | 8 | 5.2 | 308 → `/uk/albania/shengjin` (noindex, 2 listings) |
| `/en/albania/shengjin` | 0 | 8 | 13.0 | noindex (2 listings) |
| `/pl/albania/durres` | 1 | 7 | 11.6 | index |
| `/ru/albania/durres` | 1 | 6 | 15.8 | index |
| `/ru/albania/shkoder` | 1 | 6 | 8.0 | not a registry page (0 listings) |
| `/pl/albania/vlore` | 0 | 4 | 10.5 | noindex (4 listings, Tier 3) |
| `/uk/albania/sarande` | 0 | 1 | 6.0 | noindex (no uk evidence) |

No district listing, type page or facet had impressions yet. `/uk/albania/canggu` and `/ru/albania/canggu` (11 and 1 impressions) are history: until 2026-08-14 the Shkodër city document carried Bali test data (title "Canngu", slug `canggu`). `domlivo-admin/scripts/fixShkoderCity.ts` restored it; the old URLs return 404 and drop out on their own.

### Apartments vs the city page (checked 2026-09-17)

Question from the model review: should `/albania/durres/sale/apartment` be its own indexed page? Search Console, 3 months:

| Query (contains) | Impressions | Pages Google showed |
|---|---:|---|
| `apartament` | 12 | Sarandë and Tirana only; **no Durrës apartment query in Albanian** |
| `apartment` | 71 | Tirana investment and Sarandë listing queries; **no Durrës** |
| `квартир` | 22 | `квартири в дурресі` 8, `квартиры в дурресе` 6, `купить квартиру в дурресе` 3, `купити квартиру в дурресі` 2 → `/ru/albania/durres/sale` 12, `/uk/albania/durres/sale` 6, `/uk/albania/durres` 3 |
| page contains `/sale/apartment` | 0 | — |

Google already answers apartment queries with the city listing (and its old `/sale` alias, now 308 to it); `/sale/apartment` has never received an impression. **Decision: keep the city page canonical for apartments.** Re-check at the experiment review (2026-11-12): if apartment queries land on the city page at position ≤ 10 but CTR stays near 0, test a dedicated apartment page then.

## Experiments

Pages indexed on probation ([ADR 007](decisions/007-experiments.md)). Review date **2026-11-12**.

| Experiment | Page | Listings at start | Success criteria | Result |
|---|---|---:|---|---|
| `durres-under-100k` | `/{l}/albania/durres/under-100k` | 106 | Budget queries land on this URL (not the city page) in ≥ 2 locales; indexed | — |
| `durres-new-builds` | `/{l}/albania/durres/new-builds` | 45 | New-build / off-plan / "ne ndertim" queries on this URL; indexed | — |
| `durres-near-the-sea-data` | `/{l}/albania/durres/near-the-sea` | 98 | Indexed; beach/sea queries on this URL; sea-distance coverage > 60% | — |

## What to track per registry page

| Signal | Where | Cadence |
|---|---|---|
| **Index status** — indexed, "crawled – not indexed", "discovered – not indexed", Google-selected canonical | GSC URL Inspection for each of the 14 pages (en + sq at least) | at 2 and 4 weeks, then monthly |
| Impressions, clicks, CTR, average position | GSC Performance, `page` = exact URL, per indexable locale | every 2 weeks |
| **Query → page alignment** — do a cluster's queries land on its page? | GSC Performance, filter query contains the cluster term → Pages tab (e.g. `2+1` → `/durres/2-1`, not `/durres`) | every 2 weeks |
| **Cannibalisation** — one query, several Domlivo URLs | same view: more than one page with impressions for a cluster query | every 2 weeks |
| Non-branded impressions and clicks | GSC Performance → branded/non-branded filter when available; otherwise exclude agent names | monthly |
| Inventory | `domlivo-admin/scripts/reportSeoInventory.mjs` | monthly |
| Decision changes | sitemap-types / sitemap-cities diff | monthly |
| Leads | CRM / Telegram, with the landing URL when available | weekly |

### Control group

Pages the registry did not change, to separate its effect from seasonality and Google updates: `/{l}/albania/{city}/info` for Durrës, Tirana and Sarandë; `/{l}/albania/durres/districts/*`; the blog. Compare their impression trend with the registry pages over the same window.

### Time frames

- **2–4 weeks**: crawling and indexing of the 14 pages, redirects picked up (`/sale` aliases disappear from GSC), no new "duplicate without canonical" errors, query → page alignment starting.
- **8–12 weeks**: impressions, positions, CTR and clicks per page; experiment verdicts.
- Do not change thresholds before the 8-week mark unless a page is clearly broken.

## Reading the results

- A **Tier 1** page should show impressions for its primary keyword within 4–8 weeks of being indexed. If it has impressions but position > 20 after 3 months, the page is not competitive for that SERP — improve content (facts, counts, prices) before adding pages.
- A **noindexed** page that keeps receiving impressions was already ranking; check whether its cluster evidence was missed before re-indexing it (this is how ru was added to Sarandë).
- A cluster query landing on the **parent** page instead of its own page means Google does not yet see the slice as distinct: strengthen the slice (title, H1, internal links) before adding more slices.
- When inventory for a Tier 3 page passes the minimum, it becomes indexable automatically; watch its first impressions.
- Do not count pages. Count clicks from cluster queries.

## Log

| Date | Clicks (3 mo) | Impressions (3 mo) | Avg position | Indexed | Registry indexed pages | Notes |
|---|---:|---:|---:|---:|---:|---|
| 2026-09-17 | 73 | 3.3K | 12.1 | 501 | 12 | Registry introduced |
| 2026-09-17 | 73 | 3.3K | 12.1 | 501 | 14 (11 index + 3 experiment) | Experiments; Sarandë indexed in ru |
