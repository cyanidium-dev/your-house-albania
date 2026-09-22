# Domlivo SEO system

**Read this before adding, changing or "improving" any indexable page.**

Domlivo does not create pages because a combination of filters is technically possible. A listing page is indexable only when **search demand + inventory + a distinct intent** justify it. That rule lives in code, in one module — `src/lib/seo/pages/` — and every surface that exposes a listing URL to Google (robots meta, hreflang, sitemap, internal links) asks that module instead of deciding on its own.

- Research behind the rules: [keyword-research.md](keyword-research.md), [inventory-analysis.md](inventory-analysis.md)
- State before the registry: [current-architecture.md](current-architecture.md)
- How we know it works: [measurement.md](measurement.md)
- Why it is built this way: [decisions/](decisions/)

## Architecture

```
Sanity (properties, cities, districts, catalogSeoPage)
   │  GROQ via src/lib/sanity/queries/* (cached, tag-purged on publish)
   ▼
fetchSeoPageDecisions()  src/lib/sanity/queries/seoPages.ts — one cached query:
   │                     public sale listings + published cities/districts + CMS noindex
   ▼
decide.ts / inventory.ts  every page with ≥ 1 listing, its count and its parent's count
   │                                     keyword evidence (research data)
   │                                     src/lib/seo/pages/data/keywordEvidence.ts
   │                                     ▼
   │                             demand.ts  findDemand(key) → score 0–3 + locales
   ▼                                     │
eligibility.ts  evaluateSeoPage({ key, inventory: { count, parentCount }, editorialNoindex })
   │            → { status: index | noindex | skip, indexableLocales, reasons, tier }
   │            thresholds: policy.ts (the only place numbers live)
   ▼
registry.ts  SEO_PAGE_FAMILIES: URL shape, canonical path, copy source, sections, JSON-LD
   │
   ├─► listing route generateMetadata  → robots, canonical, hreflang (indexable locales only)
   ├─► sitemap-cities.xml / sitemap-types.xml → only status=index, per locale
   ├─► ListingFacetNav (internal links) → only status=index targets
   └─► tests (__tests__) + validateSeoRegistry() guardrails
```

### Source of truth

| Question | Answer lives in |
|---|---|
| Which kinds of listing pages can exist and what their URLs look like | `src/lib/seo/pages/registry.ts` (`SEO_PAGE_FAMILIES`) |
| Which intents have proven demand, in which languages | `src/lib/seo/pages/data/keywordEvidence.ts` (`KEYWORD_CLUSTERS`), documented in `keyword-research.md` |
| Every numeric threshold (inventory minimums, share-of-parent caps, demand score) | `src/lib/seo/pages/policy.ts` (`SEO_PAGE_POLICY`); `src/lib/seo/listingIndexPolicy.ts` derives the national `/sale/{type}` threshold from it |
| Whether a page is indexable | `evaluateSeoPage()` in `src/lib/seo/pages/eligibility.ts` — nothing else |
| Which facets exist and how they filter | `src/lib/catalog/listingFacets.ts` (`LISTING_FACETS`: `query` for the page, `matches` for counting) |
| Titles, descriptions, H1 | `src/lib/seo/listingSeoCopy.ts` + `messages/*.json` `Seo.listing.*`; CMS `catalogSeoPage` overrides per place |
| URL building | `src/lib/routes/listingRoutes.ts` (`buildListingPath`) |
| Editorial pages (city `/info`, districts, guides, blog) | Sanity `landingPage` / `blogPost` with CMS `seo.noIndex`; outside this registry (see [ADR 001](decisions/001-seo-page-registry.md) § Scope) |

## Page families

| Family | URL | Counts | Min inventory | Other rules |
|---|---|---|---:|---|
| `city` | `/{l}/{country}/{city}` | public sale listings in the city | 5 | demand score ≥ 2 |
| `district` | `/{l}/{country}/{city}/{district}` | listings in the district | 10 | demand ≥ 2, or city demand (score 1) with ≥ 30 listings |
| `cityType` | `/{l}/{country}/{city}/sale/{type}` | city listings of the type | 16 | demand ≥ 2; type ≤ 60% of the city (else it duplicates the city page) |
| `facet` | `/{l}/{country}/{city}[/{district}]/{facet}` | listings matching `LISTING_FACETS[facet].matches` | 10 | demand ≥ 2 for that facet at that place; ≤ 90% of the parent place |

Anything else a route can render — district+type, deal without type, agent listings, query-filtered URLs, page 2+ — is `noindex, follow`, not in a sitemap and not linked from the SEO navigation.

### Decision states

| Status | Meaning | Robots | Sitemap | Internal SEO links |
|---|---|---|---|---|
| `index` | demand, inventory and a distinct intent all hold | `index, follow` in `indexableLocales`; `noindex, follow` in other locales | yes, in `indexableLocales` | yes |
| `experiment` | listed in `data/experiments.ts`: indexed without keyword evidence (or with incomplete data) until its review date; every other rule still applies ([ADR 007](decisions/007-experiments.md)) | as `index` | as `index` | as `index` |
| `noindex` | useful to visitors, not justified in search (thin, no demand, duplicate intent, CMS override) | `noindex, follow` | no | no |
| `skip` | nothing to show (0 listings) or a combination outside every family | `noindex, follow` (route may still render for a filtering visitor) | no | no |

Every decision carries `reasons[]` (e.g. `inventory 4 < min 5`, `no keyword evidence for facet under-80k`, `type is 68% of city inventory (> 60%)`) so a noindex is always explainable.

### Demand score

`findDemand(key)` looks the page up in `KEYWORD_CLUSTERS`:

| Score | When |
|---|---|
| 3 | a cluster targets exactly this page with a bucket ≥ 100–1K |
| 2 | a cluster targets exactly this page with 10–100 |
| 1 | no exact cluster, but the parent place (city) has one — inferred |
| 0 | nothing, or only clusters whose SERP is rental/editorial |

Locales: a page may be indexed in a locale only when the **city** cluster lists that language (people who search in that language look for property in that place). For Durrës that is all seven; for Sarandë it is sq, en, ru, de, it, pl (ru from Search Console).

### Tiers

Computed, not hand-assigned (`decision.tier`):

- **Tier 1** — status `index`, demand score 3, inventory ≥ 2 × the family minimum.
- **Tier 2** — status `index`, everything else.
- **Tier 3** — status `noindex` only because of inventory, with demand ≥ 2 (becomes indexable automatically when stock arrives).

Pages indexed on 2026-09-17 (production inventory, 14): Tier 1 — Durrës city, Golem, Durrës land. Tier 2 — Plazh, Qerret, City Centre and Shkëmbi (inferred demand, strong stock), Durrës `1-1`, `2-1`, studios, Sarandë city. Experiments (review 2026-11-12) — Durrës `under-100k`, `new-builds`, `near-the-sea`. Tier 3 — Tirana, Vlorë, Shëngjin, Gjiri i Lalzit, Durrës villas and houses. Not indexed for lack of demand: `under-80k` (inside `under-100k`), `3-1`, commercial space, Mali i Robit and Spille listings, district-level facets. Not indexed as duplicate intent: `/albania/durres/sale/apartment` (the city page is canonical for apartments).

## Page lifecycle

```
keyword opportunity (Keyword Planner / Search Console / SERP)
  → approved cluster        docs/seo/keyword-research.md + KEYWORD_CLUSTERS entry (source, bucket, locales, serp type)
  → page definition         an existing family in SEO_PAGE_FAMILIES (new family = ADR)
  → decision                evaluateSeoPage() with live inventory
  → rendered page           listing route: title/H1/description from listingSeoCopy, robots + canonical + hreflang from the decision
  → sitemap                 sitemap-cities / sitemap-types include it for indexableLocales
  → internal links          ListingFacetNav links it from its place page
  → monitoring              measurement.md: impressions, clicks, queries, index status, inventory
```

Nothing in this chain is written by hand per URL: when inventory falls under a minimum the page drops out of the sitemap, the navigation and the index on the next revalidate, and comes back the same way.

## Rendering and caching of the listing route

`/{l}/{country}/{city}/[[...filters]]` is ISR (`revalidate = 3600`, empty `generateStaticParams`, nothing prerendered at build) and **takes no `searchParams`** — awaiting that prop is what kept every listing URL on `private, no-store` until 2026-09-20. A URL with a real query (`?page=2`, filters, sort) is rewritten by the middleware to the internal route `/{l}/listing-query/…`, which reads the query and renders the same module (`src/components/catalog/geoListing/GeoListingRoute.tsx`) with `noindex, follow` and the path-only canonical. Tracking-only queries (`utm_*`, `gclid`, …) get the cached page. Rules: `src/lib/routes/listingQueryRewrite.ts` (a test fails when a new folder under `app/[locale]` is missing from its list). Client components under the listing must not call `useSearchParams` — use `useUrlSearch`.

## Blocks under the card grid

City and district pages that the registry indexes in the visitor's locale carry, below the cards: an `<h2>` over the grid with the live count, the CMS bottom text under its own `<h2>`, then `priceStats`, `districtLinks`, `faq`, `buyingCosts` (`ListingDepthSections`; the family's `contentSections` lists them). Numbers come from the queries the `/info` price table, the facet chips and the sitemap already use; nothing under 3 listings is printed (`src/lib/catalog/listingDepth.ts`); links go only to indexable pages (ADR 004). The FAQ is the place's CMS FAQ in the visitor's language, with no FAQPage markup here — `/info` and the district page declare it. Facet, type and query pages get the grid heading only.

## Adding a new page

1. **Confirm demand.** Keyword Planner (bucket ≥ 10–100 in the target market), Search Console impressions, or both. Check the SERP: if the top results are rentals, hotels or articles, a listing page will not rank — stop. No measurable demand but a clear commercial intent and real stock? Add an entry to `data/experiments.ts` with a hypothesis, success criteria and a review date ≤ 120 days away instead ([ADR 007](decisions/007-experiments.md)).
2. **Check inventory.** Count public sale listings for the exact filters (`inventory-analysis.md` shows how). Below the family minimum the page will be Tier 3 at best.
3. **Check overlap.** Is there already a page whose inventory contains ≥ 90% of this one, or whose SERP returns the same URLs? Then add the keywords to that page's cluster instead. Types above 60% of their city are the city page.
4. **Add the definition.** Add a `KeywordCluster` to `data/keywordEvidence.ts` targeting an existing family (city, district, cityType, facet). A new facet also needs an entry in `LISTING_FACETS` (with `query` and `matches`), messages in all locales and a family test. A new *family* needs an ADR.
5. **Check canonical.** The canonical is built by `seoPagePath()` from the family; never hard-code a canonical. Verify there is no second URL rendering the same filters (the route must redirect or noindex it).
6. **Check content.** Title, H1 and description come from `listingSeoCopy.ts`/messages and must state real facts (count, price from, €/m²). No marketing filler.
7. **Check internal links.** The page must be reachable from its place page through `ListingFacetNav` (automatic for facets and districts) — and nothing may link to it while it is `noindex`.
8. **Check the sitemap.** `npm test` covers inclusion; after deploy, open `/sitemap-types.xml` and find the URL in each indexable locale.
9. **Check structured data.** Listing pages emit BreadcrumbList + ItemList; do not add FAQPage without a real FAQ block.
10. **Test.** `npx vitest run src/lib/seo` — `validateSeoRegistry()` fails on duplicate clusters, unknown facets/types, bad locales or a cluster that targets a page no family can build.

## Forbidden patterns

- **No arbitrary indexable filter URLs.** Price ranges, amenities, sort, bedrooms ≥ n and any query string are never indexable. New indexable slices go through a family and a cluster.
- **No metadata hard-coded in components.** Titles, descriptions and robots come from `listingSeoCopy`, messages, CMS and the decision.
- **No page without an inventory threshold.** Thresholds exist only in `policy.ts`.
- **No page without keyword evidence.** A cluster with a source is required; "it seems useful" is not evidence.
- **No duplicate intents.** One cluster → one URL. Keyword variations join an existing cluster.
- **No manual sitemap URLs.** Sitemaps are generated from decisions.
- **No SEO text without factual data.** No "discover stunning properties in beautiful Durrës".
- **No second SEO architecture.** Do not add another registry, threshold file, page generator or parallel route family. Extend this one; if it cannot express what you need, write an ADR first.
- **No thresholds or place names in UI components.** Components receive decisions; they do not know that Durrës has districts.

## File structure

| Path | Responsibility |
|---|---|
| `src/lib/seo/pages/types.ts` | `SeoPageKey`, `SeoPageDecision`, cluster and policy types |
| `src/lib/seo/pages/policy.ts` | All thresholds and demand scoring constants |
| `src/lib/seo/pages/data/keywordEvidence.ts` | Research data: clusters with sources, buckets, locales, SERP type |
| `src/lib/seo/pages/data/experiments.ts` | Pages indexed on probation, with hypothesis, success criteria and review date |
| `src/lib/seo/pages/demand.ts` | Looks a page up in the evidence; returns score, locales, matched clusters |
| `src/lib/seo/pages/eligibility.ts` | Pure decision function; no I/O |
| `src/lib/seo/pages/registry.ts` | Page families, key ↔ path, `seoPagePath`, family metadata (copy source, sections, JSON-LD) |
| `src/lib/seo/pages/inventory.ts` | Counts page inventory (and parent inventory) from property rows with the facet predicates |
| `src/lib/seo/pages/decide.ts` | CMS rows → a decision for every page with inventory (published cities/districts, sale only, CMS noindex) |
| `src/lib/sanity/queries/seoPages.ts` | `fetchSeoPageDecisions()` / `fetchSeoPageDecision(key)`: the one cached query every surface reads |
| `src/lib/seo/pages/links.ts` | Chooses internal link targets from decisions |
| `src/lib/seo/pages/validateRegistry.ts` | Guardrails run by tests |
| `src/lib/seo/pages/index.ts` | Public exports |
| `src/lib/seo/pages/__tests__/` | Eligibility, demand, paths, sitemap inclusion, locales, links, guardrails |
| `src/lib/seo/listingIndexPolicy.ts` | National `/sale/{type}` threshold (derived from `policy.ts`) and the empty-listing check |
| `src/lib/catalog/listingFacets.ts` | Facet definitions (`query` + `matches`) |
| `src/lib/seo/listingSeoCopy.ts` | Listing titles, descriptions, H1 copy |
| `src/components/catalog/geoListing/GeoListingRoute.tsx` | Listing route logic: resolves the key, asks for a decision, applies it; 308s duplicate URL shapes. Mounted by `app/[locale]/[country]/[city]/[[...filters]]/page.tsx` (cached, no query) and `app/[locale]/listing-query/…/page.tsx` (query URLs, via middleware rewrite) |
| `src/app/[locale]/agent/[agent]/[country]/[city]/[[...filters]]/page.tsx` | Agent listings: always `noindex, follow`, no alternates |
| `src/lib/sanity/queries/sitemap.ts` | Sitemap rows; city and type entries carry `locales` from decisions |
| `src/lib/seo/contentLastmod.ts` | Honest `lastmod`: a `_updatedAt` shared by two documents to the second is a script run and is replaced by the document's own date; nothing known → no `lastmod` |
| `src/lib/seo/prioritySitemap.ts` + `sitemap-priority.xml` | The crawler's starting point, listed first in the index and robots.txt: indexed registry pages, `/sale`, city info pages, `/about`, guides and blog indexes, ten newest posts |
| `src/lib/seo/propertySitemap.ts` | Property file order (complete listings first, newest first) and the fallback-only locale URLs it leaves out |
| `src/components/catalog/ListingFacetNav.tsx` | Internal links to indexable districts and facets |
| `docs/seo/*` | Research, decisions, measurement |

## Data flow

```
Sanity property rows
 → inventory aggregation   (fetchSeoPageDecisions → decideSeoPages → collectSeoPageCandidates)
 → page registry           (SEO_PAGE_FAMILIES: is this key a page? what is its path?)
 → page resolver           (listing route: seoPageKeyFromListingRoute → fetchSeoPageDecision)
 → eligibility             (evaluateSeoPage: demand × inventory × overlap × CMS override)
 → metadata                (robots, canonical, hreflang for indexableLocales)
 → content                 (listingSeoCopy, catalogSeoPage, facts line, facet nav)
 → internal linking        (links.ts → ListingFacetNav)
 → sitemap                 (only index decisions, per locale)
```

## URL redirects introduced by the registry

| From | To | Why |
|---|---|---|
| `/{l}/{country}/{city}[/{district}]/{type}` | `/{l}/{country}/{city}[/{district}]/sale/{type}` (308) | Same inventory and title under two URLs |
| `/{l}/{city}/sale[/{type}]` (country omitted) | `/{l}/{country}/{city}[/sale/{type}]` (308) | Duplicate of the full geo URL |

Existing 308s kept: `/{country}/{city}/sale` → city, `/properties` → `/sale`, country hub → `/sale`.

## Monitoring

See [measurement.md](measurement.md). The inventory report in `inventory-analysis.md` was produced by `domlivo-admin/scripts/reportSeoInventory.mjs`; re-run it monthly and before changing any threshold.

## Property pages and sold listings

Individual property pages are outside the listing registry but follow the same principle; rules in [ADR 006](decisions/006-property-lifecycle.md).
