# SXO / SERP-Backwards Audit — domlivo.com commercial listing pages
Date: 2026-09-20 | Scope: EN/RU/PL/DE/IT/SQ commercial real-estate queries, Durrës focus

## Fetch budget log (domlivo.com) — 9 of ~25 fetches used
1-2. GET /en (homepage, discover nav — one redundant call, noted)
3. GET /en/albania/durres
4. GET /ru/albania/durres
5. GET /pl/albania/durres
6. GET /de/albania/durres
7. GET /it/albania/durres
8. GET /sq/albania/durres
All via `render_page.py --mode auto`, 1 req/s, never /api/. No golem/district sub-page exists in any locale — confirmed absent from nav in all six languages.

---

## 1. SERP findings by language cluster

### EN cluster (7 queries)
| Query | Dominant type | Notable domains | Listings on ranking pages | Notes |
|---|---|---|---|---|
| apartments for sale in durres | Aggregator/portal city category | realting.com, tranio.com, realestate.al, duashpi.al, holprop.com, tuttomondorealestate.com | 25–953 | Head term, entrenched |
| property for sale durres albania | Mixed portals + luxury brand + local agency | Christie's Int'l RE, realting, tranio, properstar (only 7 listings!), albaniapropertygroup, indomio.al, mikadorealestate.com | 7–1000s | Low-inventory Properstar still ranks — template/authority matters more than volume |
| property for sale albania (national) | National aggregator | properstar (108), green-acres (82), realting, indomio.al, prianproperty, holprop (4,611, incl. /price/50000/ sub-page) | 82–4,611 | Fully portal-dominated; price-tier sub-URLs rank independently |
| buy apartment albania | Aggregator + hybrid info/category | realting, tranio/low_cost, properstar, duashpi.al, geoln.com, prianproperty, holprop | 26–100s | geoln.com blends listings with price/m² + legal-fee explainer (hybrid format) |
| sea view apartment albania for sale | Mixed category + single PDPs | Century21 Albania (single listing ranks), albaniapropertygroup (single listing ranks), realting/seaview, tranio/coastal, albaniaproperty.al (single listing) | n/a | Well-optimized single property pages rank for narrow modifiers without a category page |
| apartments for sale golem albania | Dedicated district sub-page | realting/golem, albaniapropertygroup, properstar/golem (only 4 listings), realestate.al/golem, remax-albania.com/golem, indomio.al/golem, holprop/golem | 3–3,294 | Every recurring competitor has a URL one level under the city for Golem; Domlivo has none |
| cheap property albania | Price-tier filtered/landing URL | properstar (price-sort URL), realting/cheap, tranio/low_cost, prianproperty/lowprice, propertyunder20k.com, propertyunder50k.com | 75–106 | Crawlable "cheap"/"under X" URLs rank as their own pages, not a UI sort toggle |

### RU cluster (3 queries)
- **купить квартиру в дурресе**: prian.ru (x2), realting, albaniapropertygroup, tranio, ee24.com, mavato.ru (x2), holprop, even a Skyscanner hotel page ranks — weak-spot signal.
- **недвижимость в албании купить**: prian.ru, homesoverseas.ru, realting, tranio, ee24, geoln (x2), mavato.ru — all portals with price/m² and legal-fee blocks.
- **квартира в албании у моря цена**: prian.ru/sea, realting, hatamatata.ru (cross-country comparison blog), alba-land.ru (price-band 25000–40000 landing page), ee24, geoln, albrealtor.com (single agency).

### PL cluster (2 queries) — SERP is thin
- **mieszkania na sprzedaż albania**: properstar, properstar.de (locale leak), realting, green-acres, albanialokalnie.pl (tiny single-broker PL site), **two Wikipedia football-stadium pages rank** — strong winnable signal.
- **nieruchomości albania durres**: realting (919 Durrës listings), nieruchomosci-albania.pl (PL-only Durrës specialist, "clear legal status" trust copy), Wikipedia Durrës pages again ranking.

### DE cluster (2 queries)
- **wohnung kaufen albanien**: immowelt.de (199 listings, major German portal), tranio, realting, bluehomes.com, immozentral.com, properstar.de, kleinanzeigen.de, geoln — mainstream-portal DA dominance, hardest DE query.
- **immobilien albanien durres**: **albanienimmobilien.com ranks #1**, a tiny single-owner DE site — proves a focused DE Durrës page can outrank generalist portals for city+country queries. Also: tranio, albanien.immobilien, prianproperty.com/de, realigro.de, holprop, globihome.com (blog+price-guide hybrid), realtyalbania.com/de.

### IT cluster (2 queries)
- **appartamenti in vendita durazzo**: properstar (17, then 68 county), **latuacasaalmare.it ranks twice** (IT coastal specialist), mitula.it (scraper), duashpi.al (IT-lang page), green-acres.
- **case in vendita albania**: jamesedition.com (luxury), properstar (x2), latuacasaalmare.it, arkadia.com, green-acres, albaniapropertygroup, holprop — broader/national, more competitive.

### SQ cluster (2 queries) — fully classifieds-dominated, hopeless at current scale
- **apartamente ne shitje durres**: merrjep.al (24,607 listings claimed), realestate.al, gazetacelesi.al, duashpi.al, futurehome.al, shpi.al, shtepiaime.al, njoftime365.com, njoftime.al.
- **shtepi ne shitje durres**: merrjep.al, homezone.al (30,000+, installment-plan angle), duashpi.al, futurehome.al, mirlir.com (x2), gazetacelesi.al, pronperty.com.

### SERP features (limitation flagged)
The WebSearch tool used returns text summaries, not enumerated SERP-feature flags — no direct screenshot/HTML of the SERP was captured, so presence of AI Overview, People Also Ask, image pack, or map pack could **not be independently verified** for any query. Inference only: these are broad transactional queries without a single physical business location, so a classic local **map pack is unlikely**; multi-listing image carousels are plausible for head terms; AI Overviews are plausible for process/fee-flavored queries (e.g. "buy apartment albania") given 2026 rollout patterns, but this is not confirmed. Treat SERP-feature claims as inferred, not observed.

---

## 2. Competitor category-page teardown (fetched directly)

**realting.com/albania/durres/apartments** — Title "Apartments for sale in Durres, Albania – Buy flats, prices", H1 "Apartments in Durres, Albania". 953 apartments, broken down by room count, 30/page paginated. Filters: price (9 currencies), type, category (new/secondary/under construction), area, rooms/bathrooms, year, seller type, residence-permit flag. Trust: agency logos, agent languages, Telegram contact, like counts. Breadcrumbs Realting > Albania > Durres > Residential > Apartment; map toggle present. No FAQ, no price-stats chart.

**realestate.al/en/apartment-for-sale-in-Durres** — Title "Apartments, Flat, Duplex for sale in Durres Albania – RealEstate.Al – Page 1", H1 "Apartment For Sale Durres". ~25 listings/page across Golem, Pavaresia, Currilat, Shkëmbi i Kavajës. Filters: location, type, status, bedrooms, price bands, area. Internal long-tail category links ("One bedroom Apartment For Sale Durres"). Trust: company registration number shown. No FAQ, no map.

**merrjep.al (SQ classifieds)** — Title "Gjeni apartamente ne shitje Durres në MerrJep.al", H1 "Shitje apartamentesh ne Durres". Claims 24,607 listings; filter by private (9,049) vs company (15,558) seller. Extensive facet filters, "Trusted Seller" badges, short investment-pitch copy block, long-tail internal links ("plazh", "vollga", "golem", "qender", "me pamje nga deti").

**Blocked/inaccessible (limitation):** tranio.com and properstar.com returned HTTP 403 (bot protection); indomio.al served a bot-verification interstitial. Findings for these three rely on WebSearch snippets only, not direct page inspection.

---

## 3. Domlivo target pages — all six /​[locale]/albania/durres (fully parsed)

All six locale pages share an identical structural pattern:

| Locale | Title | H1 | Word count | H2 count | ItemList items | H3 count |
|---|---|---|---|---|---|---|
| en | Durrës Real Estate: Apartments & Property for Sale — Domlivo | Durrës Real Estate: Apartments & Property for Sale | 948 | 0 | 24 | 28 |
| ru | Недвижимость в Дурресе: купить квартиру у моря — Domlivo | Недвижимость в Дурресе: купить квартиру у моря | 890 | 0 | 24 | 28 |
| pl | Apartamenty i mieszkania na sprzedaż w Durrës — ceny 2026 — Domlivo | Durrës: apartamenty i mieszkania na sprzedaż | 878 | 0 | 24 | 28 |
| de | Wohnung kaufen in Durrës, Albanien – Immobilien am Meer – Domlivo | Wohnung kaufen in Durrës – Immobilien in Albanien | 898 | 0 | 24 | 28 |
| it | Appartamenti in vendita a Durazzo – case al mare, prezzi 2026 – Domlivo | Appartamenti e case in vendita a Durazzo, Albania | 970 | 0 | 24 | 28 |
| sq | Apartamente në shitje në Durrës – banesa 1+1, 2+1, çmime 2026 — Domlivo | Apartamente dhe shtëpi në shitje në Durrës | 970 | 0 | 24 | 28 |

Common findings across all six:
- Title/H1/meta description are keyword-aligned and locale-native (not machine-translated boilerplate) — this part is genuinely good and matches the ranking pattern for city category pages.
- **Zero H2s on every locale** — page jumps from H1 straight into 24 property-card H3s, then footer nav H3s ("Navigation/Guides/Cities/Contacts"). No semantic section for "Popular areas", "Price statistics", "FAQ", or "About Durrës real estate" — exactly the sections that recur across ranking competitors (realting's rooms breakdown, geoln's price/legal blurb, merrjep's investment pitch).
- Schema: correct BreadcrumbList + ItemList pattern, but **numberOfItems is capped at 24 on every locale**, vs. competitors' 25–953 (or 24,607 for SQ classifieds). For an inventory of ~360 Durrës listings, only 24 are exposed in the initial HTML/schema — no crawlable pagination link or "load more" href was found in the DOM.
- **No district/price-tier sub-pages** anywhere (no /golem, /plazh, /cheap, /seaview equivalents) — every recurring EN/RU/DE competitor has these as separate indexable URLs.
- Primary CTA ("View properties" / locale equivalent) links to the **generic, unfiltered `/[locale]/catalog`**, not a Durrës-filtered catalog URL — loses location context exactly at the conversion moment. Note: `/en/catalog?investment=true` exists as a distinct investment-focused catalog view but is not cross-linked from the Durrës page.
- hreflang is correctly implemented across all 7 locale variants + x-default — i18n technical setup is solid and NOT the bottleneck.

---

## 4. Page-type mismatch verdict

SERP-dominant type across all clusters (except SQ): **Aggregator/Portal category page** — closest taxonomy analog is a **Product Page** pattern (multiple priced items, images, specs, filters) crossed with Local signals (city/district), not literally one of the 8 named types but functionally identical to "Product Page, aggregated, with Local facets."

Domlivo's /albania/durres pages match this **same type** — title, H1, ItemList/Breadcrumb schema, and card-based layout are all correct. **Severity: ALIGNED on page type, but HIGH on depth/crawlable-surface-area.** This explains the split the brief asked about: blog/guide content ranks 5–12 because Blog Post is a much lower-competition, correctly-matched type where Domlivo's copy quality alone can compete; commercial listing pages sit at 20–35 despite correct type because Google is ranking on **facet depth and inventory breadth** (district pages, price tiers, listing counts) that Domlivo's near-zero-authority domain has not yet built, not on page-type mismatch.

---

## 5. User stories (SERP-signal sourced)

1. As a **German retiree browsing wohnung kaufen albanien**, I want to filter to seaside flats under a fixed budget, because I'm on a pension and price certainty matters, but I'm blocked by **no crawlable price-tier URL** on Domlivo's /de/albania/durres (competitors: tranio /low_cost, realting /cheap). *(Source: EN "cheap property albania" cluster + DE cluster pattern)*
2. As a **Polish or Russian investor evaluating квартира в албании у моря цена**, I want to see price-per-m² and district comparison stats, because I'm judging value for money before committing, but I'm blocked by the **absence of any price-statistics block** on Domlivo (competitors: prian.ru price/m² blocks, alba-land.ru price-band pages). *(Source: RU cluster + geoln.com hybrid pattern in EN)*
3. As a **buyer searching apartments for sale golem albania**, I want a dedicated Golem results page, because I have a specific neighborhood in mind, but I'm blocked because **Domlivo has no /golem sub-page in any locale** — "golem" exists only inside individual property slugs. *(Source: EN "golem" cluster — every recurring competitor has this URL)*
4. As a **first-time foreign buyer reading buy apartment albania**, I want quick answers on foreigner eligibility, fees, and residence-permit thresholds, because these are unfamiliar legal risks, but I'm blocked by **no FAQ or legal-explainer block** on the category page itself (competitors: geoln.com, prian.ru, nieruchomosci-albania.pl all embed this). *(Source: EN + RU + PL hybrid-content pattern)*
5. As a **Polish/PL-language searcher on a thin SERP** (mieszkania na sprzedaż albania, Wikipedia football-stadium pages ranking), I want a genuinely useful PL-language Durrës page, because low competition means I'd likely click through if the page existed with any authority, but Domlivo's /pl page, while well-written, is **not yet earning backlinks/authority** to capture this open slot. *(Source: PL cluster weak-SERP signal)*

---

## 6. Persona scoring — Durrës listing page (0–10, task-specified scale)

**1. German retiree, seaside flat under €100k — Score: 4/10**
Page (`/de/albania/durres`) has correct language, keyword-matched H1, and mentions Golem/Qerret in the meta description — but there is no price filter/URL for "under 100k," no retirement-relevant content (healthcare access, residence-permit-by-purchase threshold, climate, expat community), and no district page for the areas the meta itself names. Misses: budget filter, retiree trust content, district drill-down.

**2. Polish investor wanting rental yield — Score: 4/10**
`/pl/albania/durres` is sale-only with zero rental/yield data, no ROI calculator, no comparison to Vlorë/Sarandë yields. Domlivo does have an investment-flagged catalog (`/en/catalog?investment=true`) but it is **not linked from the Durrës page**, so this persona has no path to it. Misses: yield data, rental comps, cross-link to investment catalog.

**3. Ukrainian family relocating — Score: 3/10**
No relocation-specific content block (schools, safety, family-size 2+1/3+1 filter framing, residence-permit process for families) on the category page itself; Domlivo's guides (`/guides/buying`, `/guides/albania-market`, `/guides/investment-albania`) don't specifically address family relocation and aren't cross-linked from the Durrës page. Misses: family-relocation guide link, safety/schools content, permit-for-family process explainer.

**4. Albanian diaspora buyer from Italy — Score: 6/10 (strongest of the four)**
Both `/sq` and `/it` pages exist with native, non-machine-translated copy, and pricing is transparent (a known diaspora concern given historic title/fraud worries). Still misses: no notary/legal-process trust content for returning diaspora, no testimonials or agency-credential block, no inheritance/succession-document guidance.

**Weakest persona:** Ukrainian family relocating (3/10) — biggest single fix is a family-relocation content module cross-linked from the Durrës category page, since the guides content may already partially exist but is disconnected from the page that would capture this intent.

---

## 7. Feed/portal syndication targets (leads + links)

| Portal | Recurs in clusters | Feed/partner signal | Notes |
|---|---|---|---|
| Realting.com | EN, RU, PL, DE | Has agency/seller accounts; commonly ingests partner feeds | Highest cross-language recurrence — top syndication priority |
| Indomio.al | EN (golem, durres) | Albania-native portal, agency-listing model | Bot-blocked our direct fetch; verify acceptance via direct outreach |
| Realestate.al | EN, SQ | Shows registered company (Sh.p.k) — agency-oriented | Albania-focused; likely accepts partner listings |
| MerrJep.al | SQ (dominant) | Free tier + paid "Trusted Seller" promoted tier | Essential for SQ lead volume, not for foreign-language SEO |
| Green-acres (al.green-acres.com) | EN, PL, IT | Pan-European portal, agency-partnership model | Good fit for EU-market exposure (PL/IT/FR) |
| Tranio.com | EN, RU, DE | Curated/exclusive listing model, likely commission-based | Blocked our fetch (403); confirm terms directly |
| Properstar.com | EN, PL, IT | Aggregates via IDX/agency data feeds | Ranks even with very low inventory (7 listings) — worth pursuing for template authority alone |
| Prian.ru / Homesoverseas.ru | RU | RU-market specialist portals | High relevance for RU cluster, verify listing fees directly |
| Albanienimmobilien.com / nieruchomosci-albania.pl / latuacasaalmare.it | DE / PL / IT | **These are competing niche specialists, not open aggregators** — not syndication targets, but their ranking proves the format (small, focused, native-language Durrës page) works |

**Limitation:** No direct outreach or pricing pages were fetched for any portal (out of scope for WebSearch-only competitor research); acceptance criteria and cost are inferred from each site's apparent business model, not confirmed.

---

## 8. Winnable vs. hopeless query matrix (3-month horizon)

| Query / cluster | Verdict | Why |
|---|---|---|
| PL: mieszkania na sprzedaż albania | **Winnable** | SERP shows Wikipedia football-stadium pages ranking — genuinely thin competition |
| PL: nieruchomości albania durres | **Winnable** | Same thin-SERP pattern; small PL specialist already proves the format works |
| DE: immobilien albanien durres | **Winnable** | Single-owner niche site (albanienimmobilien.com) ranks #1 over major portals for city+country combo |
| EN: apartments for sale golem albania | **Winnable (needs new page)** | Competitors rank with as few as 3–4 listings on a dedicated district URL Domlivo doesn't have yet |
| RU: квартира в албании у моря цена | **Medium/winnable** | Niche price-band pages (alba-land.ru) rank alongside portals; a dedicated price-tier page is buildable |
| EN: sea view apartment albania for sale | **Medium** | Individual PDPs rank for this, not just categories — achievable via on-page optimization of existing listings, no new page needed |
| EN: buy apartment albania | **Medium/hard** | Portal + hybrid-content dominated; needs an FAQ/legal-explainer block added to an existing page |
| IT: appartamenti in vendita durazzo | **Medium/hard** | Beatable in principle (niche IT specialist ranks) but requires building IT-market authority first |
| RU: купить квартиру в дурресе / недвижимость в албании купить | **Hard** | Entrenched RU-market portals (prian.ru, tranio, ee24) with deep listing counts |
| EN: apartments for sale in durres (head term) | **Hopeless (12mo+)** | 953-listing realting + tranio + holprop entrenched |
| EN: property for sale albania (national) | **Hopeless** | 4,611-listing national portals, near-zero authority can't compete at this scope |
| DE: wohnung kaufen albanien | **Hopeless** | immowelt.de mainstream-portal DA dominance |
| IT: case in vendita albania (national) | **Hopeless** | Luxury brand + national aggregators |
| SQ: apartamente ne shitje durres / shtepi ne shitje durres | **Hopeless at current scale** | merrjep.al alone claims 24,607+ listings; ~360 total Domlivo listings cannot out-scale classifieds density |

---

## 9. Limitations

- WebSearch results are AI-summarized text, not raw SERP HTML/screenshots — SERP feature presence (AI Overview, PAA, image pack, map pack) is inferred, not directly observed, for every query.
- tranio.com, properstar.com, and indomio.al blocked direct page fetches (403 / bot-check interstitial); their structural details rely on WebSearch snippets only.
- No portal outreach was performed; feed-acceptance and cost figures in Section 7 are inferred from business model, not confirmed by the portals themselves.
- Domlivo fetch budget capped at ~25 pages/1 req-sec — only the six /albania/durres pages plus the EN homepage were inspected in depth; other cities (Tirana, Vlorë, Sarandë, Shëngjin) were not audited and may show different depth/facet gaps.
- Persona scores are qualitative judgments against the stated 0–10 scale, not derived from user testing.
- "24 items" cap on the ItemList/DOM could not be conclusively attributed to a hard pagination limit vs. a JS-rendered "load more" — render mode was `auto` (raw HTML); a `--mode always` Playwright render was not run to confirm whether more items appear after client-side hydration.

END OF REPORT
