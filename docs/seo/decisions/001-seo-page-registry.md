# ADR 001 — One SEO page registry for listing pages

Status: accepted · 2026-09-17

## Context

Listing URLs are generated from path segments: city, district, deal, type and seven facets. The route could render thousands of combinations; which of them were indexable was decided in four places (listing route, `catalogListingMetadata`, `ListingFacetNav`, `queries/sitemap.ts`), each with its own counting query. The thresholds were shared, the decisions were not, and they had already drifted (facet pages ignored the CMS noindex flag; district+type pages were indexable but in no sitemap). No rule anywhere asked whether anyone searches for the page.

## Problem

We need one place that answers "should this listing URL be in Google, in which languages, and why?" — used by robots, hreflang, sitemaps and internal links alike — without inventing a second routing system next to the working one.

## Decision

Add `src/lib/seo/pages/`:

- **Families, not URL rows.** `SEO_PAGE_FAMILIES` describes the four page kinds that may be indexable (`city`, `district`, `cityType`, `facet`): their key shape, canonical path (built with the existing `buildListingPath`), copy source, content sections and structured data. Individual pages are not listed by hand; they are keys evaluated against live inventory.
- **Evidence as data.** `data/keywordEvidence.ts` holds the approved keyword clusters (research data with sources), separate from logic.
- **One pure decision function.** `evaluateSeoPage()` combines demand, inventory, overlap and CMS overrides into `index | noindex | skip` with reasons and indexable locales. No I/O, fully unit-tested.
- **Existing surfaces call it.** The listing route, sitemap fetchers and `ListingFacetNav` pass counts in and apply the decision. They no longer compare counts to thresholds themselves.

Scope: listing pages. Editorial pages (city `/info`, district landings, guides, blog) stay in Sanity with their own `seo.noIndex`; they are written one by one by people, so the combinatorial risk this registry controls does not exist there. The national `/sale/{type}` listing keeps its existing threshold (re-exported from the policy) until it gets demand evidence of its own.

## Alternatives considered

- **A static list of every indexable URL** (JSON or CMS). Rejected: inventory changes daily; a list goes stale silently and needs a human to remove a page that lost its stock.
- **A new CMS document type per SEO page.** Rejected: duplicates `catalogSeoPage`, moves business rules into editor hands, and still needs code to count inventory.
- **A new route family** (`/{city}/apartments-for-sale`, …). Rejected: the existing URLs already rank and are in sitemaps; new URLs would split signals and require a migration with no evidence it helps ([ADR 003](003-url-architecture.md)).
- **Keep thresholds per surface, add demand checks per surface.** Rejected: this is how the drift happened.

## Consequences

- Adding an indexable slice is data + tests, not a new route. Adding a *kind* of page is an ADR.
- Some pages that were indexed become `noindex` (no demand, duplicate intent, thin stock). They still render for visitors.
- The decision function needs counts the route already fetches; facet and type pages also fetch their parent count (cached).
- Future agents must extend this module. Creating another registry, threshold file or page generator is listed under Forbidden patterns in `docs/seo/README.md`.
