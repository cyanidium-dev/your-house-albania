# Measurement

Success is not "more pages in Google". It is more **non-branded impressions and clicks on the pages the registry indexes**, from the queries their clusters target, turning into leads — while the number of indexed thin pages goes down.

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
| Listing pages with impressions | `/uk/albania/durres` 46 (pos 14.8), `/ru/albania/durres/sale` 32 (21.5, now 308), `/uk/albania/durres/sale` 22 (19.8), `/pl/albania/sarande` 166 (34.3), `/en/albania/sarande` 22 (20.6), `/pl/albania/durres` 7 (11.6) |
| Registry pages (2026-09-17) | computed by `evaluateSeoPage` over production inventory — see README § Tiers |

Conversions: leads arrive through the contact form, quick-lead form, Telegram/WhatsApp and the AI chat. Analytics does not yet attribute a lead to a landing page; until it does, count leads per week from the CRM/Telegram and record them here.

## What to track per registry page

| Signal | Where | Cadence |
|---|---|---|
| Impressions, clicks, CTR, average position | GSC Performance, filter `page` = the URL (each indexable locale) | every 2 weeks |
| Ranking queries | GSC Performance, page filter → Queries | every 2 weeks |
| Index status | GSC URL inspection / Pages report | monthly, and after each registry change |
| Inventory | `evaluateSeoPage` reasons in the rendered page (dev) or `domlivo-admin/scripts/reportSeoInventory.mjs` | monthly |
| Decision changes | sitemap-types / sitemap-cities diff | monthly |
| Leads | CRM / Telegram, with the landing URL when available | weekly |

## Reading the results

- A **Tier 1** page should show impressions for its primary keyword within 4–8 weeks of being indexed. If it has impressions but position > 20 after 3 months, the page is not competitive for that SERP — improve content (facts, counts, prices) before adding pages.
- A **noindexed** page that keeps receiving impressions was already ranking; check whether its cluster evidence was missed before re-indexing it.
- When inventory for a Tier 3 page passes the minimum, it becomes indexable automatically; watch its first impressions.
- Do not count pages. Count clicks from cluster queries.

## Log

| Date | Clicks (3 mo) | Impressions (3 mo) | Avg position | Indexed | Registry index pages | Notes |
|---|---:|---:|---:|---:|---:|---|
| 2026-09-17 | 73 | 3.3K | 12.1 | 501 | see README | Registry introduced |
