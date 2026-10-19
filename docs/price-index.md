# Domlivo Price Index

The one source of every asking-price figure the site prints for a city or a
district (2026-10-19, growth plan Q4 track A1/A5). Public method:
`/{locale}/methodology`.

## Where the figure comes from

- **Read:** `fetchPriceIndexRows` (`src/lib/sanity/queries/priceIndex.ts`), one
  cached GROQ read of every published, active sale listing plus the published
  cities and districts. Cache 1 hour, purged by the Sanity webhook like every
  listing query. `computedAt` is the moment of the read and the date every page
  prints.
- **Calculation:** `src/lib/priceIndex/snapshot.ts` on top of
  `src/lib/catalog/listingPriceSummary.ts`. Flats = `apartment` + `studio`.
  €/m² = the stated rate of a per-m² listing, or total ÷ area (area ≥ 15 m²).
  Median rounded to the euro; band = 20th–80th percentile, linear interpolation.
- **Headline rule:** a median over fewer than `MIN_HEADLINE_SAMPLE` (30) flats
  with a usable €/m² is never a headline: answer boxes say "too little data:
  N flats", tables put an asterisk and a footnote, downloads set `lowSample`.

## Who reads it

| Surface | Code |
| --- | --- |
| `/info` answer box | `components/city/CityPriceAnswer.tsx` |
| `/info` district table | `components/landing/sections/ListingPriceIndexSection.tsx` |
| `/info` Dataset JSON-LD | `app/[locale]/[country]/[city]/info/page.tsx` → `lib/priceIndex/jsonLd.ts` |
| District catalog depth block, `/sale` hub | `fetchCityListingPriceIndex`, `fetchNationalListingPriceIndex` (derived from the same read) |
| Listing "median for similar homes" | `rankInDistrict` (same arithmetic, same sample) |
| Downloads | `/data/prices/index.json`, `/data/prices/{city}.csv` (CC BY 4.0, 1 h) |
| Methodology + DataCatalog | `app/[locale]/methodology/page.tsx` |
| `/llms.txt` "Key figures", `/llms-full.txt` | `lib/priceIndex/llmsText.ts` |
| CMS copy | `{{median:<city>}}`, `{{p20:…}}`, `{{p80:…}}`, `{{count:…}}`, `{{date:…}}` (`lib/priceIndex/tokens.ts`), filled on `/info` pages and their metadata |

The catalog header line (`ListingFactsLine`, "N listings · from € · median
€/m²") uses the same arithmetic over exactly the page's filters, so on a city or
district page without filters it equals the index figure; it still shows a
median from 5 flats and does not apply the 30 rule.

Not the index, and labelled as such:

- `zoneMetrics` tables ("All stock, €/m²" with a confidence column): published
  market research with sources.
- The lead-landing live tokens `{count}`, `{fromPrice}`, `{medianPricePerSqm}`
  (`lib/landing/liveTokens.ts`): the landing's own inventory band, every
  property type included. Do not use them for a city's price; use
  `{{median:<city>}}`.

## Monthly editions in the blog

Editions are blog posts `durres-asking-price-index-YYYY-MM`, written by the
monthly autopilot from `domlivo-admin/scripts/reportDurresPriceIndex.mjs` and
published by `createPriceIndexArticle.ts` (see `domlivo-admin/docs/AUTOPILOT.md`).
Each gets a Dataset of its month (`temporalCoverage: YYYY-MM`, `isBasedOn` the
methodology) and captions on its tables.

**Rule: no edition without new figures.** If a month's figures equal the
previous edition's apart from the date, there is no edition that month.
`reportDurresPriceIndex.mjs` exits with code 3 and writes nothing, and
`createPriceIndexArticle.ts` refuses to create such a post. The October 2026
edition (`-2026-10`) repeated September's figures under a new date; it is left
published as history.

The report script and the site share the sample since 2026-10-19 (penthouses
had been counted in the report, never on the site).

## Not there yet

- Month-over-month: the index keeps no history. `monthOverMonthPct` is `null`
  in the JSON until monthly snapshots are stored (e.g. the edition JSONs, or a
  `priceIndexSnapshot` document written on the 1st).
- Only Durrës has enough flats for a headline figure (2026-10-19: 511). Tirana
  11, Sarandë 11, Shëngjin 19, Vlorë 6.
