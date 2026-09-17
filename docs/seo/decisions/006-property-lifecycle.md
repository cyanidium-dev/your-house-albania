# ADR 006 — Property pages and sold / inactive listings

Status: rules accepted · sold/archived page state on the roadmap · 2026-09-17

## Context

`/{locale}/property/{slug}` renders a property only when it passes `PUBLISHED_PROPERTY_FILTER` (published, lifecycle active or unset, public deal). Any other state returns **404** and the URL leaves `sitemap-properties.xml`. Schema lifecycle values: `draft active reserved sold rented archived`. On 2026-09-17: 368 active + 7 unset, 3 reserved, 14 archived sales, 13 archived rentals, 1 unpublished active.

Property pages already have one stable slug URL, a canonical, breadcrumbs (country → city → district → property), RealEstateListing JSON-LD, similar-property links and a title composed from real fields (`composePropertyMetaTitle`: type, area, district, city — €price).

## Problem

A sold or withdrawn listing may have earned links and rankings; a 404 discards them, while keeping an unavailable listing indexed misleads visitors.

## Decision (rules)

| State | HTTP | Robots | Page | Sitemap |
|---|---|---|---|---|
| `active` (or unset), published, public deal | 200 | index | full listing | yes |
| `reserved` | 200 | index | full listing with a "reserved" status; offer availability `LimitedAvailability` | yes |
| `sold` / `rented` | 200 for 12 months after the change, then 410 | noindex, follow | status banner, historical facts, similar available properties, links to the district and city listings | no |
| `archived` (withdrawn) | 200 for 90 days, then 410 | noindex, follow | as sold, without claiming a sale | no |
| `draft` / never published | 404 | — | — | no |
| slug never existed | 404 | — | — | no |
| slug renamed | 308 to the new slug | — | — | new URL only |

Until the sold template exists, the current 404 stays; it is correct for drafts and never-existing URLs.

## Alternatives considered

- **404 on every non-active state** (current). Kept until the template exists.
- **Keep sold pages indexed.** Rejected: unavailable offers are treated as soft 404s and visitors bounce.
- **Redirect sold pages to the district listing.** Rejected as a default: mass redirects to a category look like soft 404s; allowed only for pages that never had impressions.

## Consequences

- Needs a lifecycle change date (or `_updatedAt` as a proxy) and a detail-page query that bypasses the public filter.
- `availabilityFor` in `src/lib/seo/propertyJsonLd.ts` already maps sold → `SoldOut`; that branch becomes reachable.
