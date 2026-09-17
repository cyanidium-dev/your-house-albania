# Inventory analysis (2026-09-17)

What Domlivo can actually serve. Pulled from Sanity production on 2026-09-17 with the same public filter the site uses (`isPublished == true`, lifecycle `active` or unset, deal `sale`). Regenerate with `domlivo-admin/scripts/_inventory.mjs` logic (see [README § Monitoring](README.md#monitoring)); the page registry does **not** read this document — it counts inventory live (see [ADR 002](decisions/002-indexability-rules.md)).

## Headline

- **375 public listings, 358 of them in Durrës (95%).** Every other city has 2–7 listings. Rentals exist in the CMS (13 archived) but no rental is public.
- Inside Durrës the stock is concentrated in four districts: **Golem 80, Plazh 79, City Centre 72, Shkëmbi 31** (= 73% of Durrës). Spille 20 is mostly land; Mali i Robit 19 and Qerret 14 are small but clean apartment stock.
- **Flats dominate**: 252 apartments + 24 studios + 3 penthouses. One-bedroom (1+1) flats are 59% of flats, two-bedroom (2+1) 28%.
- Median asking price of a flat **€105,000**, median **€1,446/m²** (Durrës €1,413).
- **Vollga, Currila and Lalzi Bay have no usable inventory**: Vollga is not a district in the CMS (its listings sit under City Centre), Currila is one unpublished listing, Gjiri i Lalzit 4.
- **Tirana 4, Vlorë 4, Shëngjin 2** — high search demand (see [keyword research](keyword-research.md)) and almost nothing to show. Tirana has no flat at all.

## Summary

| Location | Intent | Properties available | Data quality | SEO potential |
| -------- | ------ | -------------------: | ------------ | ------------- |
| Albania (national) | property / apartments / houses for sale Albania | 375 | area 97%, beds 92%, coordinates 11%, sea data 32% | Medium: demand 1K–10K abroad, but portals with 10–100× the stock rank; our inventory is one city |
| Durrës (city) | apartments / property for sale Durrës | 358 | same as national | **High**: sq demand 100–1K in Albania and diaspora, 10–100 in every foreign market; inventory competitive with local portals |
| Durrës – apartments | apartamente në shitje Durrës | 244 (+23 studios) | beds 92% | **High** |
| Durrës – land | tokë në shitje Durrës | 32 | area 90%+, many priced per m² | **High** (sq 100–1K) |
| Durrës – 1+1 / 2+1 | apartament 1+1 / 2+1 Durrës | 160 / 73 flats | beds 92% | **Medium** (sq 10–100; SERP = portal facet pages) |
| Durrës – near the sea | Durrës beach apartments for sale | 98 of 111 with sea data | sea distance known for 31% only | **Medium** (10–100 UK/IT/US); data gap limits the page |
| Durrës – studios | garsoniere në shitje Durrës | 23 | ok | Low–medium (10–100) |
| Durrës – commercial | commercial property Durrës | 31 | ok | Low (no confirmed demand) |
| Durrës – budget ≤ €80k / €100k | cheap apartments Durrës | 52 / 106 flats | price ok; 77 listings priced per m² are excluded | Low (demand confirmed only for "cheap property Albania") |
| Durrës – new builds | new build apartments Durrës | 45 | stage 93% set, but "completed" is the default | Low (no confirmed demand) |
| Golem | apartamente në shitje Golem | 80 | sea data 51%, stage 99% | **High** (sq 100–1K in Albania) |
| Plazh (Durrës Beach) | apartament në shitje Plazh Durrës | 79 | photos 96% | **Medium–high** (10–100) |
| City Centre Durrës (incl. Vollga) | apartament në shitje Durrës qendër | 72 | no sea data (correct: inland/seafront mix) | Medium (no query-level demand, strong stock) |
| Shkëmbi i Kavajës | apartament në shitje Shkëmbi | 31 | sea data 52% | Medium (no query-level demand) |
| Mali i Robit | apartament në shitje Mali i Robit | 19 | ok | Low (no demand, thin) |
| Qerret | apartament në shitje Qerret | 14 | ok | Medium–low (10–100, thin) |
| Spille | — | 20 (13 land) | many per-m² prices | Low |
| Gjiri i Lalzit (Lalzi Bay) | apartamente në shitje Gjiri i Lalzit | 4 | — | Not servable (demand 10–100, inventory 4) |
| Vollga / Currila | — | 0 / 1 unpublished | — | Not servable |
| Sarandë | apartamente në shitje Sarandë; nieruchomości Saranda | 7 | complete | Medium demand, thin stock |
| Tirana | apartamente në shitje Tiranë | 4 (0 flats) | — | Not servable (demand 1K–10K) |
| Vlorë | apartamente në shitje Vlorë | 4 | — | Not servable (demand 100–1K) |
| Shëngjin | apartments for sale Shëngjin | 2 | — | Not servable |

"Data quality" names the fields a page for that intent depends on. "SEO potential" combines inventory with the confirmed demand from [keyword-research.md](keyword-research.md); the binding rules are in [ADR 002](decisions/002-indexability-rules.md).

## Definitions

- **Flats** = apartment + studio + penthouse. Median flat price uses total prices only; **€/m²** uses total ÷ area (area ≥ 15 m²) or the stated rate for per-m² listings.
- **Near sea** = `beachfront` or `seaDistanceMeters ≤ 300` — the `near-the-sea` facet predicate. "Known" = listings where either field is set.
- **New builds** = `constructionStage` off-plan or under-construction.
- Counts are **sale** listings; rent rows are zero because rentals are not public.

## By city
| Place | Sale listings | Flats | Types | Bedrooms (flats) | Median flat price | Median €/m² (flats) | Price range | Near sea ≤300 m / sea data known | Sea-view amenity | Off-plan + under construction | Flats ≤ €100k |
|---|---:|---:|---|---|---:|---:|---|---:|---:|---:|---:|
| **Albania** | 375 | 279 | apartment 252, land 34, commercial-space 32, studio 24, house 17, villa 12, penthouse 3, office 1 | 1: 165, 2: 79, 3: 11, 4+: 3, n/a: 21 | €105,000 | €1,446 (n=274) | €21,000–€2,200,000 | 106 / 119 | 54 | 45 | 108 |
| **durres** | 358 | 268 | apartment 244, land 32, commercial-space 31, studio 23, house 15, villa 11, penthouse 1, office 1 | 1: 160, 2: 73, 3: 11, 4+: 3, n/a: 21 | €100,000 | €1,413 (n=263) | €21,000–€2,200,000 | 98 / 111 | 43 | 45 | 106 |
| **sarande** | 7 | 7 | apartment 5, studio 1, penthouse 1 | 1: 3, 2: 4 | €179,000 | €1,905 (n=7) | €100,000–€265,000 | 6 / 6 | 7 | 0 | 1 |
| **vlore** | 4 | 2 | apartment 2, house 2 | 1: 2 | €105,000 | €1,719 (n=2) | €87,000–€169,000 | 1 / 1 | 2 | 0 | 1 |
| **tirana** | 4 | 0 | land 2, commercial-space 1, villa 1 |  | — | — | €75,000–€780,000 | 0 / 0 | 0 | 0 | 0 |
| **shengjin** | 2 | 2 | apartment 1, penthouse 1 | 2: 2 | €297,600 | €1,739 (n=2) | €160,000–€435,200 | 1 / 1 | 2 | 0 | 0 |



## By district

| District (city) | Published | Sale listings | Flats | Types | Bedrooms (flats) | Median flat price | Median €/m² (flats) | Near sea / known | Sea view | New builds | Flats ≤ €100k |
|---|---|---:|---:|---|---|---:|---:|---:|---:|---:|---:|
| golem-durres (durres) | yes | 80 | 79 | apartment 71, studio 8, commercial-space 1 | 1: 59, 2: 15, n/a: 5 | €88,000 | €1,311 | 39 / 41 | 6 | 27 | 35 |
| plazh (durres) | yes | 79 | 66 | apartment 59, commercial-space 10, studio 7, house 1, land 1, villa 1 | 1: 39, 2: 16, 3: 5, 4+: 1, n/a: 5 | €115,000 | €1,588 | 19 / 21 | 19 | 1 | 27 |
| city-center-durres (durres) | yes | 72 | 46 | apartment 45, commercial-space 11, house 6, land 5, villa 3, office 1, studio 1 | 1: 8, 2: 29, 3: 4, 4+: 2, n/a: 3 | €140,000 | €1,500 | 0 / 0 | 4 | 0 | 8 |
| shkembi-durres (durres) | yes | 31 | 30 | apartment 24, studio 5, penthouse 1, commercial-space 1 | 1: 23, 2: 4, 3: 1, n/a: 2 | €82,000 | €1,471 | 16 / 16 | 7 | 0 | 19 |
| spille (durres) | yes | 20 | 3 | land 13, commercial-space 4, apartment 3 | 1: 3 | — | €1,350 | 4 / 6 | 0 | 2 | 0 |
| mali-i-robit (durres) | yes | 19 | 19 | apartment 18, studio 1 | 1: 13, 2: 3, n/a: 3 | €87,000 | €1,500 | 6 / 12 | 1 | 7 | 9 |
| qerret (durres) | yes | 14 | 12 | apartment 12, land 2 | 1: 9, 2: 2, n/a: 1 | €85,000 | €1,300 | 7 / 8 | 0 | 8 | 3 |
| plepa-durres (durres) | yes | 8 | 7 | apartment 6, land 1, studio 1 | 1: 5, 2: 1, n/a: 1 | €90,000 | €1,625 | 3 / 3 | 5 | 0 | 4 |
| kavaje (durres) | yes | 6 | 1 | commercial-space 2, land 2, villa 1, apartment 1 | 2: 1 | €40,000 | €482 | 1 / 1 | 0 | 0 | 1 |
| (no district) (sarande) | — | 6 | 6 | apartment 4, studio 1, penthouse 1 | 1: 3, 2: 3 | €172,000 | €1,912 | 6 / 6 | 6 | 0 | 1 |
| spitalle (durres) | no | 5 | 1 | land 2, apartment 1, commercial-space 1, house 1 | n/a: 1 | — | €50 | 0 / 0 | 0 | 0 | 0 |
| shkozet (durres) | yes | 5 | 1 | house 3, apartment 1, land 1 | 3: 1 | €120,000 | €1,111 | 0 / 0 | 0 | 0 | 0 |
| gjiri-i-lalzit (durres) | yes | 4 | 2 | apartment 2, land 1, villa 1 | 1: 1, 2: 1 | €155,000 | €2,072 | 2 / 2 | 0 | 0 | 0 |
| city-center-vlore (vlore) | yes | 3 | 2 | apartment 2, house 1 | 1: 2 | €105,000 | €1,719 | 1 / 1 | 2 | 0 | 1 |
| arapaj (durres) | no | 3 | 0 | villa 1, house 1, land 1 |  | — | — | 0 / 0 | 0 | 0 | 0 |
| center-shengjin (shengjin) | yes | 2 | 2 | apartment 1, penthouse 1 | 2: 2 | €297,600 | €1,739 | 1 / 1 | 2 | 0 | 0 |
| (no district) (durres) | — | 2 | 0 | land 1, villa 1 |  | — | — | 0 / 0 | 1 | 0 | 0 |
| porto-romano (durres) | no | 1 | 0 | commercial-space 1 |  | — | — | 0 / 0 | 0 | 0 | 0 |
| rinas (tirana) | no | 1 | 0 | land 1 |  | — | — | 0 / 0 | 0 | 0 | 0 |
| laprake (tirana) | yes | 1 | 0 | land 1 |  | — | — | 0 / 0 | 0 | 0 | 0 |
| xhafzotaj (durres) | no | 1 | 0 | villa 1 |  | — | — | 1 / 1 | 0 | 0 | 0 |
| shkallnur (durres) | no | 1 | 0 | villa 1 |  | — | — | 0 / 0 | 0 | 0 | 0 |
| shijak (durres) | no | 1 | 0 | house 1 |  | — | — | 0 / 0 | 0 | 0 | 0 |
| fllake (durres) | no | 1 | 0 | house 1 |  | — | — | 0 / 0 | 0 | 0 | 0 |
| maminas (durres) | no | 1 | 0 | land 1 |  | — | — | 0 / 0 | 0 | 0 | 0 |
| currila (durres) | no | 1 | 1 | apartment 1 | 2: 1 | €330,000 | €3,113 | 0 / 0 | 0 | 0 | 0 |
| kodra-e-diellit (tirana) | no | 1 | 0 | commercial-space 1 |  | — | — | 0 / 0 | 0 | 0 | 0 |
| sukth (durres) | no | 1 | 0 | house 1 |  | — | — | 0 / 0 | 0 | 0 | 0 |
| koxhas (durres) | no | 1 | 0 | land 1 |  | — | — | 0 / 0 | 0 | 0 | 0 |
| manez (durres) | no | 1 | 0 | villa 1 |  | — | — | 0 / 0 | 0 | 0 | 0 |
| farke-lunder (tirana) | yes | 1 | 0 | villa 1 |  | — | — | 0 / 0 | 0 | 0 | 0 |
| (no district) (vlore) | — | 1 | 0 | house 1 |  | — | — | 0 / 0 | 0 | 0 | 0 |
| city-center-sarande (sarande) | yes | 1 | 1 | apartment 1 | 2: 1 | €193,050 | €1,650 | 0 / 0 | 1 | 0 | 0 |



## Field completeness (sale listings)

| Place | area | bedrooms (flats) | coordinates | sea distance | year built | construction stage | district | description (en) | ≥5 photos |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Albania | 97% | 92% | 11% | 32% | 6% | 91% | 98% | 100% | 77% |
| durres | 97% | 92% | 8% | 31% | 5% | 93% | 99% | 100% | 77% |
| vlore | 100% | 100% | 100% | 25% | 50% | 50% | 75% | 100% | 75% |
| shengjin | 100% | 100% | 100% | 50% | 50% | 50% | 100% | 100% | 100% |
| tirana | 100% | 0% | 0% | 0% | 0% | 100% | 100% | 100% | 25% |
| sarande | 100% | 100% | 100% | 86% | 14% | 14% | 14% | 100% | 100% |

Lifecycle of all property documents: {"true/active/sale":368,"false/archived/rent":13,"true/∅/sale":7,"false/archived/sale":8,"true/archived/sale":6,"true/reserved/sale":3,"false/archived/short-term":1,"false/active/sale":1}
Amenities on public listings: sea-view 54, furnished 29, air-conditioning 23, parking 21, wifi 20, elevator 17, balcony 10, terrace 3, mountain-view 2, garden 2, security 1, dishwasher 1, panoramic-windows 1, swimming-pool 1
Top sources (agent ids): agent-getal-adrian 255, agent-findall 78, null 7, agent-1 6

## Data-quality findings

1. **Coordinates** exist on 11% of listings (8% in Durrës) — no map-based or distance-based page can be built yet.
2. **Sea distance** is known for 32%; `near-the-sea` counts are a floor, not the truth. Re-run `scripts/enrichSeaData.ts` after imports.
3. **Year built** is set on 6%; the site cannot claim "new" or "after 2019" from data.
4. **77 listings are priced per m²** (29 in Golem, 12 in Spille, 10 in Qerret): they are excluded from total-price medians and from budget facets, which understates cheap stock.
5. **Floor / total floors** do not exist in the schema; "high floor" or "penthouse view" pages are impossible.
6. One listing in Spitallë has a stated price of €50/m² (data error, unpublished district).
7. 95% of listings come from two partner feeds (get.al 255, FIND ALL 95); inventory stability depends on those imports.
