# ADR 002 — Indexability rules: demand × inventory × distinct intent

Status: accepted · 2026-09-17

## Context

Before this ADR a listing page was indexable when it had more than N listings (0 for cities, 9 for districts and facets, 15 for type pages). Keyword research on 2026-09-16/17 ([keyword-research.md](../keyword-research.md)) showed that several indexed slices have no measurable search demand (budget, new builds, 3+1, commercial space, district-level facets), that "sea view" in English is a rental query, and that apartments in Durrës are the same intent as the city page. Inventory analysis ([inventory-analysis.md](../inventory-analysis.md)) showed 95% of stock in one city.

## Problem

Decide, per page and per locale, whether it deserves to be in the index — with rules that are explainable, central and automatically re-evaluated as inventory changes.

## Decision

A page is `index` when **all** hold:

1. **Demand.** Demand score (from `KEYWORD_CLUSTERS`) ≥ the family minimum (2 = a confirmed cluster targeting this exact page, bucket ≥ 10–100). Districts may use inferred demand (score 1 = only the city has a cluster) when inventory is strong (≥ 30). Clusters whose SERP is rental or editorial do not count.
2. **Inventory.** Public sale listings ≥ family minimum: city 5, district 10, facet 10, city type 16.
3. **Distinct intent.** A type page duplicates its city when the type is > 60% of the city's listings; a facet duplicates its place when it holds > 90% of the place's listings.
4. **No editorial override.** `catalogSeoPage.seo.noIndex` forces `noindex`.
5. **Locale.** The page is indexed only in locales where the city cluster has demand; other locales render `noindex, follow` and are dropped from hreflang and sitemaps ([ADR 005](005-multilingual-seo.md)).

Otherwise `noindex` (something exists but the page is not justified) or `skip` (0 listings, or the key is not a registry family). All numbers live in `src/lib/seo/pages/policy.ts`.

Why these numbers: 5 is the smallest city result set that still answers "property for sale in X" with a real choice; 10 matches the previous district/facet bar that already kept thin districts out; 16 keeps the previous `> 15` type bar so no type page flips on the change of rules alone; 60% and 90% separate a slice from its parent — at 68% (Durrës apartments) the SERPs for the two head queries return the same category pages.

## Alternatives considered

- **Inventory-only thresholds** (status quo). Rejected: indexes slices nobody searches for.
- **A single weighted score with a cut-off** (demand × inventory × stability × SERP opportunity). Rejected for the gate: a score makes decisions hard to explain and invites tuning a page in. A tier is still computed for prioritisation.
- **Per-locale keyword evidence for every page.** Rejected: Keyword Planner only returns buckets ≥ 10 without ad spend, so language-specific phrases for small slices are invisible; the city-level language signal is the reliable one.
- **404 for thin pages.** Rejected: visitors filter into them; noindex keeps them usable and lets them return when stock arrives.

## Consequences

- On 2026-09-17: budget, new-build and 3+1 facets, district facets, Durrës commercial and apartment type pages, and the Mali i Robit and Spille district listings leave the index; Tirana, Vlorë and Shëngjin city listings leave it for lack of stock. The Durrës land and studio type pages stay indexed with evidence behind them.
- A page returns automatically when its inventory passes the minimum and evidence exists.
- New evidence can index a page with a data change only — but only with a source.
- Keyword Planner buckets are coarse; re-check evidence when the Ads account has spend (exact volumes) and at least every 6 months.
