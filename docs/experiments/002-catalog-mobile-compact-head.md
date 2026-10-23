# E002 - Catalogue on phones: listings in the first screen

Status: running from 2026-10-24 (proposed 2026-10-21) · sample check **2026-11-07** · review **2026-11-21** · rules of [ADR 007](../seo/decisions/007-experiments.md) (hypothesis, success criteria, fixed review date, no silent extension)

## Context

CRO audit of 2026-10-21 (`reports/domlivo-cro-audit-2026-10-21.md`). On a 390 px phone the first listing card of a city, district or facet page starts at 880-1 110 px: the hero (breadcrumb, label, a three-line title, a four-line intro, the facts line, two links), the heading with its median paragraph, Filters, then the facet chips (areas, sea, bedrooms, stage) and the sort. The first screen ends at about 770 px, above the sticky contact bar, so a visitor arriving on a catalogue sees no listing until they scroll. Clarity, 30 days: average scroll depth 39 %, 1.38 pages per session, 22 % of sessions reach a listing page. Leads are made on listing pages (24 of 44 in the page analytics report of 2026-10-20), so a catalogue visitor who never opens a listing cannot become one.

The intro and the chips are there for good reasons (the place in numbers, internal links, quick filters), and they stay in the HTML for search engines and on desktop either way. Whether phones convert better with them above the listings or out of the way is what the test answers.

## Hypothesis

Hiding the hero intro and the facet chips on phones, so the first card appears in the first screen, raises the share of catalogue visitors who open a listing, because what they came for is visible without scrolling.

## Design

| | |
|---|---|
| Flag | PostHog multivariate flag `catalog-mobile-compact-head`, used by the experiment "E002 Catalogue head on phones" (id 102850, running since 2026-10-24) |
| Variants | `control` (the page as it is) · `compact`. 50/50 |
| Changed, phones below 768 px only | The hero intro is hidden and the hero loses its minimum height; the facet chips (`ListingFacetNav`) are hidden (Filters still has every option). The facts line (count, from, median), the links under it, the heading and its median paragraph stay. Dev server: first card 1 007 px → 551 px on /en/albania/durres/near-the-sea |
| Where | City, district and facet pages (`GeoListingRoute`, full-geo routes) |
| Not changed | Desktop and tablets, SEO landings, the national catalogue, the HTML (CSS only) |
| Who is in it | Phone visitors with analytics consent, from their second page view on (below) |
| Exposure | `$feature_flag_called`, sent by `ExperimentExposure` only when the variant was applied at load and the viewport is under 768 px |
| Code | `src/lib/experiments/bootFlags.ts`, `src/components/analytics/ExperimentExposure.tsx`, `src/components/catalog/CatalogHero.tsx`, `src/components/catalog/geoListing/GeoListingRoute.tsx` |

### Why the variant starts on the second page

The tested block is the top of the page. E001 reads its flag when PostHog loads, after the first scroll; here that would collapse 450 px above the visitor's thumb mid-scroll. So the variant is applied before the first paint from the flags PostHog stored on an earlier page (`EXPERIMENT_BOOT_SCRIPT` in the layout). The first page of a first visit is always the control and is not counted. The result applies to visitors who reach a catalogue page as their second or later page (from the home page, a landing, a listing, the blog).

## Metrics

Per exposed visitor, in the PostHog experiment (`$feature/catalog-mobile-compact-head`).

- **Primary - listing open rate**: share with at least one `property_view` after exposure.
- **Secondary - conversation rate**: share with `messenger_open`, `property_inquiry` or `contact_form`.
- **Guardrail - filter use**: share with `filter_apply`. Hiding the chips must not cut filtering by more than 30 % relative without a rise in the primary metric.

## Sample size

Baselines unknown (PostHog has data from 2026-10-20). At a 30 % listing open rate, a 20 % relative lift (30 → 36 %) needs about 920 exposed visitors per variant (two-sided, 5 %, 80 % power). Consented phone traffic is roughly 300-400 visitors a month, so four weeks will not get there unless the effect is large. On 2026-11-04 write the baseline and the weekly exposures into the Result below.

## Decision at review (2026-11-21)

Never by extending the date silently. One of:

1. **`compact` wins**: PostHog win probability for the primary metric ≥ 90 % and the guardrail holds. Make compact the phone layout (keep the classes, drop the attribute selector), delete the flag in code and in PostHog.
2. **`control` wins**, or the guardrail fails: remove the variant classes, delete the flag.
3. **No clear winner**: keep the control, delete the flag, record the reading. If the open rate rose but conversations did not, look at the card next (E004), not the head.

## Known limits

- Consent and second-page-only, as above: the result describes consented visitors who move between pages.
- Runs next to E003 (listing page, phones) and E004 (card label). The flags are independent 50/50 splits on different elements, and PostHog reads each against its own exposures.

## Result

_Fill in at the sample check and at review: exposures per variant, the rates with intervals, the win probability, the outcome and the commit that applied it._
