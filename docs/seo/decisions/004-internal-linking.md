# ADR 004 — Internal links only to indexable registry pages

Status: accepted · 2026-09-17

## Context

`ListingFacetNav` linked districts and facets whose count cleared a threshold. With demand in the rules, a slice can have stock and still be `noindex`. Hand-written lists elsewhere (`BLOG_POST_LISTING_TOPICS`, footer) point at listing URLs without knowing their index status.

## Problem

Spend internal link equity only on pages we want indexed, without hard-coding hundreds of links.

## Decision

- Listing-to-listing links are chosen by `selectSeoLinks()` (`src/lib/seo/pages/links.ts`) from decisions: a place page links its indexable districts (on city pages) and its indexable facets, grouped by kind; a facet page highlights itself and links its siblings. Targets that are not `index` in the current locale are never linked.
- Hierarchy: Country → City → District → Facet / Type, plus sibling facets. Editorial cross-links (city `/info`, comparisons, blog) stay data-driven through CMS topic tags and are outside this ADR.
- Hand-written lists that link listings (`BLOG_POST_LISTING_TOPICS`) point at city or district keys, the most stable indexable pages.

## Alternatives considered

- **Link every slice with stock and nofollow the noindexed ones.** Rejected: nofollow on internal links wastes crawl paths.
- **A generated "all pages" hub.** Rejected: thin hub pages are what the registry exists to prevent.

## Consequences

- Budget and new-build chips disappear from the SEO navigation while those facets are `noindex`; visitors still reach them through the filters.
- When a page becomes indexable it gains its links on the next render, without code changes.
