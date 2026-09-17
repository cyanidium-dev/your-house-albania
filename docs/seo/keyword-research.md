# Keyword research (2026-09-17)

Demand evidence behind every indexable listing page. The machine-readable subset lives in `src/lib/seo/pages/data/keywordEvidence.ts`; this document is the human record of where each number came from and what it means. A page that cannot point to a cluster here is not indexable ([ADR 002](decisions/002-indexability-rules.md)).

## Sources

| Source | Date | Scope | Notes |
|---|---|---|---|
| Google Ads Keyword Planner — "Durrës Buyer Demand Atlas" | 2026-09-16 | 355 phrases × 46 countries + keyword ideas in 36 markets; 1,241 rows kept (≥6/12 months with searches) | [artifact](https://claude.ai/artifact/R6EKoXWMQZDUnMkTcUaLW7); no Albania location; Russia invalid (identical to Ukraine) |
| Keyword Planner, location **Albania** | 2026-09-17 | 50 gap phrases (sq + en): rooms, districts, land, villas, prices, budget, new builds | `kp-albania-2026-09-17` in the evidence file |
| Keyword Planner, **UK + DE + IT + US** combined | 2026-09-17 | same 50 phrases | `kp-foreign4-2026-09-17` |
| Google Search Console `sc-domain:domlivo.com` | 3 months to 2026-09-14 | 165 queries, 299 pages, countries | `gsc-2026-09-17` |
| Google SERP (Chrome, `pws=0`, local `gl`/`hl`) | 2026-09-17 | 10 head queries in sq, en, de, it, pl, ru | competitor and page-type check |

**Volumes are buckets, not numbers.** The Ads account has no spend, so Keyword Planner returns 0–10 / 10–100 / 100–1K / 1K–10K. A phrase is **confirmed** when it has a bucket ≥ 10–100 (the atlas also required searches in ≥ 9 of 12 months). "No data" means below Google's threshold in that location — evidence of *absence*, not missing work.

## What the data says

1. **The market that searches for Durrës property most is Albanian-speaking**: `apartamente ne shitje durres`, `shtepi ne shitje durres`, `apartamente ne shitje golem` and `toke ne shitje durres` are 100–1K in Albania; the first two are also 100–1K across UK+DE+IT+US (diaspora). English Durrës phrases are 10–100 in every market; German `durres apartments` reaches 100–1K in Germany.
2. **Albanian search is by city and by district; English and every other language search by city.** District phrases with volume: Golem (100–1K), Plazh, Qerret, Gjiri i Lalzit (10–100). No confirmed phrase for Mali i Robit, Shkëmbi, Currila, Vollga, "Durrës qendër".
3. **Room slices exist only in Albanian**: `apartament 1+1 ne shitje durres`, `apartament 2+1 durres` (10–100). `1 bedroom / 2 bedroom apartment durres`, `studio for sale durres` have no data anywhere checked.
4. **Budget and new-build slices have no confirmed demand at city level**: `cheap apartments albania`, `apartments under 100k albania`, `apartamente te lira ne shitje durres`, `new build apartments durres`, `off plan property albania`, `apartamente ne ndertim durres` — all below threshold in Albania and in UK+DE+IT+US. Only national `cheap property albania` / `cheap houses albania` are 10–100.
5. **"Sea view" is a rental query.** `sea view apartments durres` is 10–100, but the SERP is Booking, Tripadvisor, Agoda, Vrbo — holiday stays, not purchases. `appartamento durazzo` (IT 100–1K) is likewise mostly Booking/Airbnb/Kayak. Neither justifies a sale page on its own.
6. **Land is a real, uncovered intent**: `toke ne shitje durres` 100–1K in Albania, `land for sale albania` 100–1K abroad, SERP = portal land categories (merrjep, homezone, mirlir, realestate.al).
7. **High demand, no inventory**: Tirana (`apartamente ne shitje tirane` 1K–10K), Vlorë and Sarandë (100–1K). Domlivo has 4 / 4 / 7 listings there.

## Search Console baseline and opportunities

Last 3 months: **73 clicks, 3.3K impressions, CTR 2.2%, average position 12.1**; 165 queries and 299 pages with impressions. Countries by impressions: Albania 1,202 · Ukraine 300 · Poland 267 · USA 232 · Italy 209 · UK 179 · Germany 119 · Netherlands 112. Most clicks are on anonymised queries.

Queries at positions 5–30 with impressions (quick wins):

| Query | Impr. | Pos. | Page type that should rank | Action |
|---|---:|---:|---|---|
| реальные цены на жилье в дурресе 2026 | 19 | 6.7 | `/ru/albania/durres/info` price hub | CTR: title already reworked 2026-09-16 |
| квартири в дурресі · нерухомість в дурресі · квартиры в дурресе · недвижимость в дурресе · купить квартиру в дурресе · купити квартиру в дурресі | 3–9 each | 20–32 | `/uk|ru/albania/durres` city listing | Tier 1 page; ranking impressions landed on the old `/sale` URL (now 308) |
| saranda albania domy na sprzedaż · nieruchomości saranda · mieszkania saranda | 8–16 each | 28–40 | `/pl/albania/sarande` | Inventory 7: indexable but weak (Tier 3) |
| meglio tirana o durazzo · meglio valona o durazzo · valona o saranda | 3–7 | 6–10 | comparisons `/it/guides/*-vs-*` | Already the right pages |
| podatki w albanii | 6 | 12.8 | `/pl/blog/legal-guide-buyers` | Editorial, outside the listing registry |
| buy apartment in tirana for investment · invest in apartments in tirana | 15–16 | 31–45 | Tirana guides | No inventory; guides only |
| plepa | 3 | 21 | `/albania/durres/districts/plepa-durres` | District info page |

Pages with impressions but no clicks worth a title review: `/en/blog/market-outlook-2026` (193 impr., pos 6.2), `/pl/albania/sarande` (166, pos 34), `/en/albania/tirana/info` (109, pos 32), `/sq/albania/tirana/info` (327, pos 11, 5 clicks).

## Competitor SERPs

| Query (market) | Top 10 | Ranking page type | Why it ranks |
|---|---|---|---|
| apartamente ne shitje durres (AL) | merrjep.al, futurehome.al, century21albania.com, gazetacelesi.al, shpi.al, homezone.al (33,000+ listings), shtepiaime.al, Facebook group, duashpi.al, mirlir.com | Local classifieds and portal **city category pages** | Massive inventory, exact-match category URL and title |
| apartamente ne shitje golem (AL) | homezone.al (address + district pages), merrjep.al (search), pronajuaj.com, century21, Facebook group, duaoferta.com, alimobiliare.com, shpinet.com | **District category pages** | District as a first-class filter with its own URL |
| apartament 1+1 ne shitje durres (AL) | merrjep (search), duashpi.al `/durres/1-1`, century21, homezone `1+1` page, shpi.al, duaoferta `1+1 durres` | **Room-facet pages** under the city | The same `1-1` path shape Domlivo uses |
| toke ne shitje durres (AL) | merrjep land category, homezone, mirlir, remix.al, realestate.al, devinf, indomio | **Land category pages** | Type × city URL |
| cmimet e apartamenteve ne durres (AL) | merrjep, century21, futurehome, dyqani.app price guide, Euronews video, portals, YouTube | Mixed: listings + one price guide | Hybrid intent; a price hub with live data fits |
| apartments for sale durres (UK) | realting.com, century21, realestate.al, indomio.al, tranio.com, duashpi.al, tuttomondorealestate, holprop.com, albaniapropertygroup.com | International **portal city pages** | Inventory 4,000+ (holprop), English |
| durres wohnung kaufen (DE) | realting.com/de, tranio.de, holprop.de, immowelt.de, immobilienammeer.com, immobilienscout24, prianproperty, albaniapropertygroup | Portal city pages in German | Localised URLs and counts in titles |
| appartamento durazzo (IT) | holprop.it, Booking, Kayak, duashpi.al/it, Tripadvisor, Airbnb, Expedia, dreamalbania, trivago, hometogo | **Holiday rentals** dominate | Mixed intent; only 3 sale results |
| property for sale albania (UK) | zoopla overseas, properstar, indomio, century21, albaniapropertygroup, holprop (under €50k), realting (sea view), green-acres, rightmove overseas | Country pages of international portals | Brand authority + inventory |
| sea view apartments durres (UK) | Booking ×3, Tripadvisor ×2, Agoda, Skyscanner, trivago, Vrbo, hotels.com | **Holiday rentals only** | Rental intent |
| квартиры в дурресе купить (UA) | realting.com/ru, OLX UA, ee24.ru, prian.ru, green-acres, Facebook, dnepr-city, albaniarent | Portal city pages in Russian | Language + inventory |
| mieszkanie durres (PL) | realting.com/pl, kupujnadmorzem.pl, mieszkaniaalbania.pl, arkadia, homezone/pl, albanialokalnie.pl | Polish agencies + portals | Polish-language agencies |

Patterns: every commercial SERP is won by **category/listing pages with large inventory and exact-match titles** — never by articles. International portals (realting, holprop, tranio, prian) own the non-Albanian languages with thousands of listings. Domlivo cannot outrank on volume; it can on *precision* (real prices, €/m², sea distance, district data, one clean URL per intent) and in the long tail where portals have no page (districts, rooms in Albanian, land).

## Keyword clusters → URL map

"Inventory" = public sale listings on 2026-09-17. "Current position" from Search Console (— = no impressions). Priority tiers are defined in [README § Tiers](README.md#tiers).

| Cluster | Primary keyword | Secondary keywords | Country | Language | Monthly searches | Competition | Inventory | Current Domlivo position | Recommended URL | Priority |
|---|---|---|---|---|---|---|---:|---|---|---|
| `durres-property` | apartamente ne shitje durres | shtepi ne shitje durres, banesa ne shitje durres, durres apartments, durres real estate, apartment for sale durres, property for sale durres albania, durres wohnung kaufen, immobilien durres, case in vendita durazzo, apartament durres, mieszkanie durres, купить квартиру в дурресе, недвижимость в дурресе | AL, XK, MK, IT, DE, CH, AT, UK, US, PL, UA | sq, en, de, it, pl, uk, ru | 100–1K (AL, sq); 100–1K (UK+DE+IT+US, sq); 100–1K `durres apartments` (DE); 10–100 elsewhere | Low (AL), High (`durres apartments` UK/US) | 358 | uk 14.8, pl 11.6, ru 15.8 (city page) | `/{l}/albania/durres` | Tier 1 |
| `durres-land` | toke ne shitje durres | land for sale albania, truall ne shitje durres | AL, UK+DE+IT+US | sq, en | 100–1K (AL); 10–100 (foreign sq); 100–1K `land for sale albania` (national) | Low | 32 | — | `/{l}/albania/durres/sale/land` | Tier 1 |
| `golem-apartments` | apartamente ne shitje golem | apartament golem, golem apartments for sale, golem albania apartments, golem apartments | AL, XK, MK, UK, DE, PL, CZ, US, CA | sq, en | 100–1K (AL); 10–100 elsewhere | Low (AL), Medium (en) | 80 | — (listing); 4.6 (info page) | `/{l}/albania/durres/golem-durres` | Tier 1 |
| `durres-prices` | cmimet e shtepive ne durres | cmimi i apartamenteve ne durres, реальные цены на жилье в дурресе, ceny mieszkań w albanii, quanto costa una casa in albania, was kostet eine wohnung in albanien | AL, UA, PL, IT, DE | sq, ru, pl, it, de | 10–100 (AL); 100–1K national IT/PL | Low | 358 (live table) | ru 6.7 | `/{l}/albania/durres/info` (editorial, outside the listing registry) | Tier 1 (exists) |
| `plazh-apartments` | apartament ne shitje plazh durres | apartament ne shitje durres plazh | AL, DE, IT, CH, FR | sq | 10–100 | Low | 79 | — | `/{l}/albania/durres/plazh` | Tier 2 |
| `durres-1-1` | apartament 1+1 ne shitje durres | — | AL, UK+DE+IT+US | sq | 10–100 | Low | 1-bedroom apartments ≈ 150 | — | `/{l}/albania/durres/1-1` | Tier 2 |
| `durres-2-1` | apartament 2+1 durres | — | AL, UK+DE+IT+US | sq | 10–100 | Medium | 2-bedroom apartments ≈ 70 | — | `/{l}/albania/durres/2-1` | Tier 2 |
| `durres-near-sea` | durres beach apartments for sale | albania beach property for sale, beachfront property albania, albanien immobilien am meer kaufen, casa al mare albania | UK, IT, US (+ national coast in 17 markets) | en (+ de, it national) | 10–100 | Medium | 98 (sea data on 31% of listings) | — | `/{l}/albania/durres/near-the-sea` | Tier 2 |
| `durres-studios` | garsoniere ne shitje durres | — | AL, UK+DE+IT+US | sq | 10–100 | Low | 23 | — | `/{l}/albania/durres/sale/studio` | Tier 2 |
| `qerret-apartments` | apartament ne shitje qerret | — | AL, UK+DE+IT+US | sq | 10–100 | Low | 14 | — | `/{l}/albania/durres/qerret` | Tier 2 |
| `sarande-property` | apartamente ne shitje sarande | saranda apartments for sale, saranda property for sale, nieruchomości saranda, saranda domy na sprzedaż, case in vendita saranda, saranda immobilien | AL, PL, UK, US, IT, DE | sq, en, pl, it, de | 100–1K (AL; `saranda apartments for sale` in some markets); 10–100 | Low | 7 | pl 34 | `/{l}/albania/sarande` | Tier 3 |
| `albania-property` | property for sale albania | albania houses for sale, apartments for sale albania, buy property albania, albanien immobilien, casa in albania, mieszkanie albania | 20+ markets | all | 1K–10K (UK, US); 100–1K (IT, DE, PL, FR) | High | 375 | — | `/{l}/sale` (national listing; not part of this registry yet) | Roadmap |
| `durres-villas` | vila ne shitje durres | albania villa for sale | AL, 18 markets (national) | sq, en | 10–100 | Low | 11 | — | `/{l}/albania/durres/sale/villa` | Blocked by inventory (min 16) |
| `durres-houses` | house for sale durres albania | albania house for sale | UK, IT, NL, PL, US, CA | en | 10–100 | Low | 15 | — | `/{l}/albania/durres/sale/house` | Blocked by inventory |
| `lalzit-apartments` | apartamente ne shitje gjiri i lalzit | gjiri i lalzit apartamente ne shitje san pietro | AL, XK | sq | 10–100 (falling) | Low | 4 | — | `/{l}/albania/durres/gjiri-i-lalzit` | Blocked by inventory |
| `tirana-apartments` | apartamente ne shitje tirane | tirana apartments for sale, tirana real estate | AL, 20 markets | sq, en | 1K–10K (AL); 100–1K (foreign) | Low | 4 (0 flats) | en 36 (`tirana real estate`) | `/{l}/albania/tirana` | Blocked by inventory |
| `vlore-apartments` | apartamente ne shitje vlore | vlore apartments for sale, case in vendita valona | AL, 19 markets | sq, en, it | 100–1K (AL, foreign sq) | Low | 4 | — | `/{l}/albania/vlore` | Blocked by inventory |

### Keyword variations are one page

`apartments for sale durres` / `durres apartments for sale` / `apartment for sale in durres albania` / `apartamente ne shitje durres` / `shtepi ne shitje durres` are one intent: the SERPs for the Albanian head terms return the same category pages (futurehome's `shtepi-ne-shitje-durres` ranks for `apartamente`), and apartments are 68% of Durrës inventory. **The city listing is the canonical page for both "apartments" and "homes/property" in Durrës**; `/albania/durres/sale/apartment` is a duplicate intent and stays out of the index ([ADR 002](decisions/002-indexability-rules.md) § dominant-type rule).

### Checked and not confirmed (no page)

1 bedroom apartment durres · 2 bedroom apartment durres · studio for sale durres · new build apartments durres · new apartments albania · off plan property albania · cheap apartments albania · apartments under 100k albania · apartamente te lira ne shitje durres · apartamente ne ndertim durres · apartament me keste durres · apartament me pamje nga deti durres · apartament prane detit durres · apartament ne shitje durres qender · apartament ne shitje currila · apartament ne shitje vollga · apartament ne shitje mali i robit · apartament ne shitje shkembi i kavajes · durres property prices · apartment prices durres · cmimi i apartamenteve ne durres · villa for sale durres · land for sale durres · luxury apartments albania · penthouse for sale albania · commercial property for sale albania · house for sale albania by owner · shtepi ne shitje tirane — in Albania and in UK+DE+IT+US. The atlas adds its own unconfirmed lists per country (Kavajë, "rental yield", Hebrew, Arabic, Turkish Durrës phrases).

### Locale coverage for Durrës

| Locale | Evidence that the language searches for Durrës property |
|---|---|
| sq | `apartamente/shtepi ne shitje durres` 100–1K (AL, XK, MK, IT, DE, CH, UK, US) |
| en | 14–15 phrases 10–100 in UK and US; used by CZ, SK, RO, RS, HR, NL, SE, NO |
| de | `durres wohnung kaufen`, `immobilien durres` 10–100 (DE, AT, CH); `durres apartments` 100–1K in DE |
| it | `case in vendita durazzo`, `appartamenti in vendita durazzo` 10–100 (IT) |
| pl | `apartament durres`, `mieszkanie durres` 10–100 (PL) |
| uk, ru | `купить квартиру в дурресе`, `дуррес квартира` 10–100 (UA); GSC impressions on uk/ru Durrës pages |

Sarandë has no uk/ru evidence, so its listing is indexed in sq, en, de, it and pl only.
