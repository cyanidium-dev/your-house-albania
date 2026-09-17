# ADR 003 — Keep the existing URL architecture; redirect duplicate shapes

Status: accepted · 2026-09-17

## Context

Current listing URLs: `/{locale}/{country}/{city}`, `/{city}/{district}`, `/{city}[/{district}]/{facet}`, `/{city}/sale/{type}`. They are in sitemaps, some have impressions, and facet slugs (`1-1`, `2-1`) match the path shapes of the Albanian portals that rank (duashpi `/durres/1-1`). The examples in the brief (`/durres/apartments-for-sale`, `/durres/2-bedroom-apartments`) express the same intents with different words.

Two URL shapes rendered duplicate content: type without deal (`/albania/durres/apartment` = `/albania/durres/sale/apartment`) and country omitted (`/durres/sale` = `/albania/durres`).

## Problem

Choose a predictable URL architecture without throwing away accumulated signals.

## Decision

- **No URL migration.** Keyword-bearing slugs are not added: the city page already carries "apartments / property for sale" in title and H1 in every locale, facet slugs are locale-neutral so hreflang pairs line up, and Search Console shows no evidence that slug wording limits ranking.
- **Canonical shapes** (built only by `buildListingPath`): `/{l}/{country}/{city}`, `/{l}/{country}/{city}/{district}`, `/{l}/{country}/{city}[/{district}]/{facet}`, `/{l}/{country}/{city}/sale/{type}`.
- **308 redirects** for the two duplicate shapes: `/{country}/{city}[/{district}]/{type}` → `…/sale/{type}`; `/{city}/sale[/{type}]` (country omitted) → full geo.
- Facets never combine with type or deal (the resolver returns 404), so the space stays bounded: cities × (1 + districts × (1 + facets) + facets + types).

## Alternatives considered

- **Keyword slugs per locale** (`/de/albanien/durres/wohnungen-kaufen`). Rejected: breaks hreflang pairing, multiplies routes × locales, needs a redirect map for URLs already indexed, no evidence of gain.
- **Query-parameter facets.** Rejected: already noindexed by design; path facets are what ranks in this market.

## Consequences

- Links built anywhere with `buildListingPath` stay valid.
- The two redirects are permanent; old links pass their signals.
- Adding a facet = new slug in `LISTING_FACET_SLUGS` + evidence; no route change.
