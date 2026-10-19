# ADR 008 — Listing pages: fewer indexed locales per listing, as an experiment

Status: closed 2026-10-19 (outcome 2, no difference) · accepted 2026-09-25 · review 2026-10-15 · applies [ADR 007](007-experiments.md) to `/property/*`

## Context

Every listing is published in seven locales, so 375 listings are 2,625 URLs, on a domain with no external links. On 2026-09-25 Search Console held 1,264 URLs at "discovered, currently not indexed" — never fetched — and 85 at "crawled, not indexed". Listings that are indexed rank normally (152 URLs with impressions, average position 7.8, CTR 3.9%). Demand for listing pages by locale over three months: en 80 impressions, it 52, ru 40, de 33, pl 22, sq 18, uk 14.

The hypothesis is that the crawl queue, not the page, is the limit: Google spends a small budget on this host and seven copies of each listing exhaust it before most listings are fetched even once. Enriching the pages would not change that.

The plan of 2026-09-20 set a gate for 2026-10-15: fewer than 40% of listing URLs indexed means the low-demand locales leave the sitemap and the index. This experiment tests that cut on half the listings before it is applied to all.

## Decision

`src/lib/seo/propertyLocaleExperiment.ts` assigns each listing to an arm by a hash of its key slug (stable across builds and imports, no CMS field):

- **full** — indexed in all seven locales, as before.
- **trimmed** — `noindex, follow` in uk, pl and sq; those locale URLs leave hreflang, the sitemap and IndexNow. The pages still render and are linked as before.

Each arm has its own sitemap: `sitemap-properties.xml` (full) and `sitemap-properties-trimmed.xml` (trimmed). Search Console's page report, filtered by sitemap, then gives each arm's indexed share directly.

## Measurement and review (2026-10-15)

Read, per sitemap, the indexed and "discovered, not indexed" counts, and the Googlebot hits on `/property/` URLs in the Vercel logs, three weeks after the trimmed sitemap is submitted.

1. **Trimmed arm indexes a clearly larger share of its remaining URLs** (en, ru, it, de): apply the cut to every listing, by setting the trimmed locales as the listing locale set in `PROPERTY_URL_LOCALES` handling, and delete the experiment.
2. **No difference**: the queue was not the limit. Set `TRIMMED_LOCALES` to `[]`, which returns every listing to the full arm, and move on to authority (plan track A) as the only lever.
3. **Trimmed arm loses clicks in the cut locales with no gain elsewhere**: same as 2.

Never by extending the date silently.

## Result (read 2026-10-19, Search Console page report per sitemap, data of 2026-10-12)

| Arm | URLs in sitemap | Indexed | Not indexed | Indexed share | Indexed locale versions per listing |
|---|---:|---:|---:|---:|---:|
| full (`sitemap-properties.xml`, 368 listings x 7) | 2,576 | 1,070 | 1,380 | 42% | 2.9 of 7 |
| trimmed (`sitemap-properties-trimmed.xml`, 359 listings x 4) | 1,436 | 765 | 691 | 53% | 2.1 of 4 |

The trimmed arm's share is eleven points higher, but per listing it holds fewer indexed pages than the full arm, and the four locales it kept are still only half indexed. Cutting three locales did not make Google fetch the rest: the queue is not the limit, authority is. Outcome 2.

Applied: `TRIMMED_LOCALES = []`, so every listing is back in all seven locales (hreflang, sitemap, IndexNow); the trimmed sitemap is empty and removed from `sitemap.xml` and robots. The uk, pl and sq copies were translated all along, so nothing else had to change. Owner: resubmit `sitemap-properties.xml` in Search Console and delete the trimmed one there. Next lever: links and mentions (growth plan track A4/B).

## Alternatives considered

- **Enrich every listing page first** (the "property intelligence page" idea): rejected as the first move. It changes nothing for URLs Google has not fetched, and the listing page already carries the district comparison, buying and running costs, similar listings and a per-locale text. Two cheap blocks were added anyway (price history and distance to the sea) because they are unique data, not because they move indexing.
- **Cut the locales for all listings now**: rejected; with no control group the 15.10 reading would attribute any change to the cut, including a change that came from the sitemap resubmission itself.
- **Canonical the low-demand locales to the English page**: rejected; a canonical across languages is ignored by Google and would misreport the surviving locales.
