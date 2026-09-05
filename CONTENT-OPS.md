# Content operations — hard rules

> **How-to lives next to the Studio:** creating each page type, the publish checklist, the translation workflow, the data-refresh cadence and the Studio "Content ops" desk are in `domlivo-admin/CONTENT-OPS.md` (ТЗ-18). This file is the rules; that one is the operations manual.

These rules govern every text and image that goes on domlivo.com. They exist to
keep the site factual, multilingual and free of machine-filler. The automated
`npm run content-qa` audit (see README → Content QA) enforces most of them.

## Facts

- **The only source of facts is the DomLivo research knowledge base**
  (`DomLivo Research Department/knowledge-base/`). Districts →
  `03-districts/*.md`, cities → `02-cities/*.md`, legal/buyers →
  `05-legal/*.md`, `07-buyers/*.md`, macro → `01-macro/*.md`.
- **No number without a source.** If the knowledge base does not have it, do not
  write it. Frame prices with a cautious date, e.g. "as of 2026".
- If a place is not covered by the knowledge base (e.g. Dajti), write a short,
  honest description with no invented facts and point the reader to the team.

## Text minimums (no machine one-liner fillers)

| Field | Minimum |
|---|---|
| City description | 600 characters |
| District description | 400 characters |
| FAQ answer | 150 characters |

- Never ship filler one-liners ("Blloku is a lively area."). Describe the place:
  character, who it suits, one or two cautious facts.
- All interface strings go through next-intl dictionaries (`messages/*.json`),
  never hardcoded in JSX.

## Albanian (sq)

- Write sq **natively**, not machine-translated, and mark work "pending native
  review" in the delivery report.
- Respect declension. After **në / nga** use the indefinite/locative form
  (`në Tiranë`, `në Durrës`, `në Vlorë`, `në Sarandë`); the genitive uses
  **e/i + -s/-it** (`Rrethet e Tiranës`, `qendra e Durrësit`). City forms are
  stored on the `city.sqDeclension` object and used by the frontend templates.

## Images

- **Never generate or upload stock / third-party photos.** Only the owner
  uploads real district/city photos.
- No photo yet → use the built-in placeholder pattern (initials + gradient, as
  on agent logos) and add a line "needs photo: {page}" to the delivery report.
- All content images must be served from `cdn.sanity.io` (project static under
  `/images/` is the only exception). Hotlinked external images are forbidden.

## Rentals

- The product focus is **sale only**. Rentals stay in the data and on direct
  URLs but are hidden from the public UI via `PUBLIC_DEAL_TYPES`
  (`src/lib/catalog/publicDealTypes.ts`). Do not reintroduce rent wording into
  home/landing copy, navigation, hero tabs or curated property feeds.

## Duplicates & data hygiene

- Never hard-delete CMS documents. Duplicates/garbage → `isPublished: false`
  plus a line in the delivery report for the owner to decide.
- Content edits ship through an **idempotent script with a dry-run mode**
  (`domlivo-admin/scripts/fixContentQa2026.ts`), never by hand, so every change
  is traceable and repeatable.
