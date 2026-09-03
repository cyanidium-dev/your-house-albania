# Internal links report (SEO-08)

**Crawled:** https://www.domlivo.com · **Date:** 2026-09-03

Orphans are measured on the contextual graph: any link that appears on 80% or more of crawled pages is treated as header/footer chrome and excluded, because chrome links reach almost everything and would hide the pages nothing actually points at. Pages with no contextual links are then split in two: **orphans**, which are not in the chrome either and so are reachable only from a sitemap, and **nav-only**, which sit in the header or footer and are fine structurally. Depth uses the full graph, chrome included, since a crawler can follow the navigation.

| Locale | Pages | Orphans | Nav-only | Depth > 3 | Failed to fetch |
|---|---|---|---|---|---|
| en | 168 | 2 | 10 | 8 | 0 |

**Totals:** 2 orphans, 8 pages deeper than 3 clicks.

## en

### orphans

No contextual inbound links and not in the site chrome — reachable only from a sitemap.

- /en/investment/rent
- /en/investment/short-term-rent

### nav-only

In the header or footer, so reachable and indexable, but nothing links to them from body copy.

- /en/albania/durres
- /en/albania/sarande
- /en/albania/shengjin
- /en/cities
- /en/for-realtors
- /en/guides/albania-market
- /en/guides/buying
- /en/guides/investment-albania
- /en/investment/sale
- /en/sale

### depth > 3

- /en/albania/himare/districts/center-himare — 4 clicks
- /en/albania/himare/districts/livadh — 4 clicks
- /en/albania/himare/districts/old-town-himare — 4 clicks
- /en/guides/rana-e-hedhur-vs-tale — 4 clicks
- /en/guides/velipoja-vs-shengjin — 4 clicks
- /en/guides/vlora-vs-saranda — 4 clicks
- /en/investment/rent — unreachable from the homepage
- /en/investment/short-term-rent — unreachable from the homepage

### clusters

| Cluster | Pages | With contextual inbound links |
|---|---|---|
| district | 46 | 46 |
| property detail | 43 | 43 |
| blog post | 21 | 21 |
| guide | 19 | 16 |
| agent | 8 | 8 |
| district index | 7 | 7 |
| city editorial | 7 | 7 |
| city listing by type | 5 | 5 |
| city listing | 4 | 1 |
| investment | 3 | 0 |
| non-geo listing | 2 | 1 |
| homepage | 1 | 0 |
| static: /cities | 1 | 0 |
| static: /for-realtors | 1 | 0 |

<details><summary>chrome links excluded (22)</summary>

- /en
- /en/ai-search
- /en/albania/durres
- /en/albania/himare
- /en/albania/sarande
- /en/albania/shengjin
- /en/albania/shkoder
- /en/albania/tirana
- /en/blog
- /en/catalog
- /en/cities
- /en/contacts
- /en/favorites
- /en/for-realtors
- /en/guides
- /en/guides/albania-market
- /en/guides/buying
- /en/guides/investment-albania
- /en/image-credits
- /en/investment/sale
- /en/privacy
- /en/sale

</details>
