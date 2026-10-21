# ADR 009 — French as a partial locale: a pilot of forty pages, not a translated site

Status: accepted · 2026-10-21 · review 2026-11-18

## Context

The owner asked whether to add languages after a lead from Spain. The demand data of 2026-10-21 (reports/domlivo-locales-2026-10-21.md): no country outside the seven languages shows more than a few hundred impressions in Search Console over three months, and the leads from Spanish, Czech and Hebrew browsers all landed on English pages, two thirds of them from ChatGPT. Keyword Planner (all locations) puts French at the level of German and Polish: "immobilier albanie", "appartement albanie", "acheter maison albanie", "immobilier albanie bord de mer" 100–1K a month each; Spanish phrases stay at 10–100.

Two constraints shape how: the Sanity dataset is at its attribute cap (2026/2000 paths), so a `fr` key cannot be added to localized fields; and the March and May 2026 core updates hit sites that scaled machine-translated pages over many languages (owner report domlivo-ai-text-audit-2026-10-20).

## Decision

- `fr` joins `routing.locales` as a partial locale (`PARTIAL_LOCALE_PATHS`). Indexed: the French hub `/fr/immobilier-albanie`, two guides under it, `/fr/albania/durres` and five districts (also gated by the registry, `durres-property` lists `fr`), and 30 listings. Every other `/fr` URL renders and is `noindex, follow`, out of hreflang, sitemaps and IndexNow.
- Added 2026-10-21: the two calculator pages, `/fr/calculators/purchase-costs` and `/fr/calculators/rental-yield` (`lib/calculatorPages`). Every word on them, the calculators' labels included, is in `messages/fr.json`, so they are indexed like the other locales' copies.
- The interface is translated in `messages/fr.json`. The Sanity text those pages show is translated in the repository, `src/data/contentTranslations/fr.json`, keyed by the English source text and resolved in `lib/sanity/localized.ts`. A changed English source falls back to English until re-translated.
- Listing addresses in `fr` are derived from the English ones (`apartment-` → `appartement-`), because `localizedSlug.fr` cannot be stored.

## Review (2026-11-18) and the rule for expanding or rolling back

Read in Search Console, filter "page contains /fr/", 28 days: impressions, clicks, average position; leads with `locale = fr` in Sanity.

1. **Expand** when the pilot pages have 300+ impressions and at least one French lead: add Tirana or Vlorë, 30 more listings, a native reviewer for the translations, then Dutch by the same method.
2. **Keep and wait four more weeks** when impressions grow but stay under 300.
3. **Roll back** when there are under 100 impressions or the pilot pages sit in "crawled, not indexed": remove `fr` from `routing.locales` and `lib/frenchPilot`; 301 nothing (the URLs were few and new).

## Alternatives considered

- **Spanish**, for the lead that started the question: Keyword Planner 10–100 per phrase, Search Console 96 impressions from Spain in three months, mostly German and Polish queries of expats. Rejected for now.
- **Translate the whole site into French**: the scaled-translation pattern the 2026 updates penalised, and impossible in Sanity at the attribute cap.
- **English country pages** (UK, US): their visitors already read the English site; no page-type gap was found. Deferred.
