# ADR 007 — Experiments: indexing on a hypothesis, with a review date

Status: accepted · 2026-09-17 · amends [ADR 002](002-indexability-rules.md)

## Context

ADR 002 requires keyword evidence before a page is indexed. The evidence comes mostly from Keyword Planner, and without ad spend Keyword Planner shows buckets only and returns nothing for most long-tail phrases. After the registry shipped, the budget page (`/durres/under-100k`, 106 listings, 28% of stock) and the new-build page (`/durres/new-builds`, 45) went to `noindex` for lack of data. A review of the model (2026-09-17) pointed out that "no data" is not the same as "no demand", and that a binary gate cannot learn from Search Console.

The same review flagged `near-the-sea`: it has evidence, but sea distance is known for only 32% of listings, so the page shows a subset of the stock it describes.

## Decision

A new decision status, `experiment`, in `src/lib/seo/pages`:

- An experiment is an entry in `data/experiments.ts` (`SEO_EXPERIMENTS`): target page, hypothesis, success criteria, `startedAt`, `reviewAt`.
- It replaces the **demand** requirement only. The inventory minimum, overlap with the parent, CMS noindex and locale rules still apply. An experiment with 9 listings, or one covering 95% of its place, stays `noindex`.
- An experiment page is treated exactly like `index` everywhere (`isIndexedSeoStatus`): robots, hreflang, sitemap, internal links. The status exists so the page is visibly on probation in decisions, docs and reviews.
- A page with evidence can also be an experiment when its data is incomplete (`near-the-sea`).
- Guardrails (`validateSeoRegistry`): one experiment per page, a hypothesis and success criteria, valid dates, at most 120 days, and a city with a listing cluster (otherwise there is no locale to index in).

At `reviewAt` the experiment ends one of two ways — never by extending the date silently:

1. **Promote**: Search Console shows the target queries landing on the page → add a `KEYWORD_CLUSTERS` entry with source `gsc-…` and delete the experiment.
2. **Drop**: no impressions, wrong pages ranking, or "crawled – not indexed" → delete the experiment; the page returns to `noindex` and leaves the sitemap.

## First experiments (review 2026-11-12)

| Id | Page | Why |
|---|---|---|
| `durres-under-100k` | `/{l}/albania/durres/under-100k` | Price ceiling is a distinct commercial intent Keyword Planner cannot size; 106 listings |
| `durres-new-builds` | `/{l}/albania/durres/new-builds` | Off-plan is a distinct purchase; 45 listings; no KP data |
| `durres-near-the-sea-data` | `/{l}/albania/durres/near-the-sea` | Has evidence; sea-distance coverage 32% |

Not experiments: `under-80k` (52 listings, all inside `under-100k` — two budget pages would compete for the same queries), `3-1`, district-level facets, commercial space.

## Alternatives considered

- **Lower the demand bar for all facets.** Rejected: re-indexes every slice at once with no way to tell which one worked.
- **Weighted opportunity score with an "experiment" band.** Rejected for now: with ~375 listings and ~3K impressions per quarter the inputs are too sparse to tune weights; an explicit list is easier to review.
- **Index everything, prune by GSC later.** Rejected: that is the state before the registry.

## Consequences

- 14 pages indexed instead of 12 (11 `index`, 3 `experiment`).
- Measurement gains a fixed review date and success criteria per experiment ([measurement.md](../measurement.md) § Experiments).
- An experiment left in the file past its review date is a process failure; the 120-day guardrail caps the damage.
