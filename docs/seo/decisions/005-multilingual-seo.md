# ADR 005 — Locales are indexed where the language searches for the place

Status: accepted · 2026-09-17

## Context

The site has seven locales (en, uk, ru, sq, it, pl, de), all fully translated since 2026-09-16. Every listing page declared all seven in hreflang and every sitemap listed all seven. Keyword research shows demand for Durrës property in all seven languages, but for Sarandë only in sq, en, de, it and pl.

## Problem

Avoid indexing locale variants that nobody searches for, without building per-locale keyword lists for every slice (Keyword Planner cannot see small slices without ad spend).

## Decision

- The city cluster in `KEYWORD_CLUSTERS` lists the languages with evidence of demand for that place. A listing page for that place (city, district, facet, type) is `index` only in those locales; elsewhere it renders `noindex, follow` and is excluded from hreflang alternates and sitemaps.
- `x-default` points to `en` when English is indexable, otherwise to the first indexable locale.
- Translation completeness is a separate precondition, enforced by the locale gate (`src/lib/seo/localeIndexing.ts`, `PARTIAL_LOCALE_PATHS`).
- Pages use each market's wording through `Seo.listing.*` messages ("1+1" in sq, "bilocale" in it), not a literal translation of English.

## Alternatives considered

- **All locales everywhere** (status quo). Rejected for places without language evidence.
- **Per-page, per-locale evidence.** Rejected: impossible to source reliably at bucket granularity.
- **New locales (fr, he, tr) on the same structure.** Deferred: the demand atlas supports fr as a second wave; he, tr and ar are not justified.

## Consequences

- Sarandë listing pages drop out of the index in uk and ru.
- Adding a language for a place is a data change with a source.
