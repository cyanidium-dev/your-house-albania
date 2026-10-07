# Investment landing pages: research, structure, yield model, rollout (2026-10-08)

Decision document for a hub-and-spoke set of "invest in Albania / Durrës" pages. Inputs: Search Console and Clarity (`DEMAND-VS-SUPPLY-2026-10-04.md`), the SEO page registry (`src/lib/seo/pages/`), the research knowledge base (`DomLivo Research Department/knowledge-base/`, cited by file), the Cactus Real Estate export (418 docs, scratchpad `cactus-props.json`) and web checks made on 2026-10-08. Every figure below that is not from our own data is an external estimate, dated and linked.

## 0. What we already have (reuse, do not rebuild)

| Asset | Where | Use on the investment pages |
|---|---|---|
| ROI calculator (gross → management → 15% tax → net) | `src/lib/calculators/roi.ts` | extend to the full waterfall of §3 |
| Purchase-cost model (notary bands, ASHK, 1% buyer fee, 0.05% building tax) | `src/lib/property/ownershipCosts.ts`, `src/lib/calculators/purchaseCost.ts` | acquisition line of the calculator |
| Utilities model | `src/lib/calculators/utilities.ts` | running-cost line |
| Durrës STR/LTR/ROI tables with data_ids | KB `12-ai-database/19`, `20`, `21`, `24`, `25` | every number on the pages, with citation |
| Zone price bands and risks | KB `12-ai-database/05-city-durres.md`, `02-cities/durres.md` | district spokes |
| Developer traffic-light and vetting list | KB `06-developers/developers-rating.md` §3, §6 | developer pages, badge |
| `developer` CMS type with tier + `PropertyDeveloperBadge` | Sanity, `src/components/shared/property/PropertyDeveloperBadge.tsx` | link listings → developer profile |
| Indexable new-builds feed | `/{locale}/investment/new-builds` | becomes the off-plan spoke |
| Articles: `albania-rental-yield-for-investors`, Durrës price index, BoA H1 2026 market post | blog | internal links, citations |
| Live price `Dataset` JSON-LD, FAQ in DOM, `/llms.txt`, AI prompt panel | `docs/seo/ai-prompt-panel.md` | AI-search track |

## 1. Demand research

Volumes: our Keyword Planner account returns buckets only (`docs/seo/keyword-research.md`). In the September 2026 atlas, `off plan property albania`, `new build apartments durres` and all "rental yield" phrases were **below the 10–100 threshold** in Albania and in UK+DE+IT+US; national `property for sale albania` is 1K–10K (UK, US) and 100–1K (IT, DE, PL, FR). The only investment-worded demand we have *measured* is on our own site: `buy apartment in tirana for investment` / `invest in apartments in tirana` gave 15–16 impressions each at positions 31–45 in GSC (3 months to 2026-09-14). Everything else below is qualitative: what Google ranks, and who is targeting it. Action in week 1: replay ~60 investment phrases through the KP RPC method (memory `kp-foreign-demand-2026-09`) to get buckets.

| Language | Queries real people type (observed in SERPs/autocomplete-style variants) | What ranks today (checked 2026-10-08) | Gap |
|---|---|---|---|
| en | buy apartment in albania for investment · albania real estate investment 2026 · durres rental yield · airbnb durres income · off-plan albania · albania golden visa property · albania property tax for foreigners · is durres a good investment | Blog farms (investropa.com ×6 pages, globihome.com), portal news (realting.com), guides (homesgofast, ownpropertyabroad), developer PR (greencoast.al). "Durrës rental yield" returns only tranio/realting listing pages, no answer page. "Golden visa" is owned by immigration consultancies (citizenx.com, golden-visa.com, imidaily.com), several with misleading titles. | No page with sourced, dated Durrës numbers + calculator + live listings. No honest golden-visa debunk from a property site. |
| ru | инвестиции в недвижимость албании · недвижимость албания доходность · купить квартиру в дурресе для сдачи · албания аренда доходность | prian.ru (rating of districts by yield), homesoverseas.ru, incfine.com, Czech agency primorskiydom.net | Durrës-specific yield with costs; Prian quotes 6.3–7% Tirana gross, "10–16% ROI" claims by sellers |
| uk | інвестиції в нерухомість албанії · купити квартиру в дурресі під оренду | minfin.com.ua blog (Homium agency), OLX, globihome | Almost empty; our uk Durrës pages already rank 20–32 |
| pl | inwestycja w nieruchomości albania · czy warto kupić mieszkanie w albanii · saranda vs durrës inwestycja · albania czy czarnogóra | Polish agencies: seaandhomes.com (Saranda vs Durrës, Albania vs Hiszpania), mdrealty.me, albanialokalnie.pl, sprawdzonynajemca.pl | Comparisons dominate; PL impressions high but we sit at pos 17 (`DEMAND-VS-SUPPLY`) |
| it | investire in albania immobili · rendimento affitti durazzo · conviene comprare casa in albania | consul.al (Durazzo market page), zenazone.it, altrostile.net, personal brands (robertomazzuca.com "Investo in Albania"), fortuneita.com | Our it comparisons already rank pos 7; an investment angle on Durazzo with numbers is missing |
| de | immobilien albanien investition · rendite durres · wohnung albanien kaufen als kapitalanlage | bellevue.de market report, tranio.com/de, globihome, consul.al, holprop.de | German asks for a *Marktreport*; we have the BoA H1 2026 article in de |
| sq | investim në pasuri të paluajtshme durrës · çmimet e apartamenteve durrës 2026 · ku të investosh në durrës | agjensiokazione.com ("zonat më të mira për të investuar 2026"), tregu.im, dyqani.app, durresinfo.com, shqiptarja.com | Albanian investor intent is price/zone-driven; serve it from the city price hub, not a separate sq investment page |

Myths to debunk on-page (each is a query): **"Albania golden visa"** — there is none; the 2019 citizenship-by-investment scheme was recorded as terminated on 2022-12-31 ([imidaily.com](https://www.imidaily.com/analysis/how-to-get-residency-in-the-balkans-through-investment/), accessed 2026-10-08). What exists is a one-year renewable residence permit for a registered property owner under Law 79/2021 art. 84, no minimum value in the primary law, ≈20 m² per person ([balkanhome.eu](https://www.balkanhome.eu/en/guides/residence-permit-through-property-in-albania), accessed 2026-10-08). **"8% tax on short-term rent"** — no: individuals pay 15% flat on rental income whether long- or short-term, declared in DIVA by 31 March, no NIPT needed ([hlb.al](https://www.hlb.al/short-term-rentals-in-albania-new-tax-reporting-obligations-from-2026/), [euronews.al](https://euronews.al/en/no-tax-id-required-for-short-term-apartment-rentals-taxes-to-be-paid-through-diva/), accessed 2026-10-08; KB `22-taxes.md` DATA-TAX-0006). The 8% figure is the dividend withholding of the company route (KB DATA-TAX-0013). **"10–12% guaranteed yield"** — developer marketing; the BoA-based picture is below (§3).

## 2. Landing structure

**Where they live.** The site already has an `/investment/` prefix (`/investment/new-builds` indexable; `/investment/sale|rent|short-term-rent` are noindex marketing pages). Reuse it instead of opening `/invest/`: one namespace, no redirects, existing footer links. The pages are editorial (Sanity `landingPage` with sections, like `/albania/durres/info`), so they sit **outside** the listing registry (ADR 001 scope) and carry their own `seo.noIndex`; their listing feeds call the catalogue by filter and are themselves `noindex` as filtered URLs.

| # | URL (`/{locale}/…`) | Role | Core sections | Data blocks / tools | Listing feed (catalogue filter) | Primary queries | Locales (launch) | Schema |
|---|---|---|---|---|---|---|---|---|
| H | `investment` | Hub: "Investing in Albanian property, 2026" | why/why not, market numbers, city comparison, how to buy, taxes, myths, FAQ | BoA HPI card, city table (KB `24` CITY_COMPARISON), calculator entry | none (links to spokes) | albania real estate investment 2026, инвестиции в недвижимость албании, inwestycja albania, investire in albania, immobilien albanien investition | en, ru, uk, pl, it, de (sq later) | `WebPage` + `FAQPage` + `BreadcrumbList`; `Dataset` for the city table |
| S1 | `investment/durres` | City spoke | zone map with €/m² bands, STR vs LTR vs hybrid, 3 scenarios, risks (sewage, seismic, oversupply), who buys | scenario table §3, monthly STR curve, cost waterfall | `city=durres`, sort by €/m², cap 12 | durres investment property, купить квартиру в дурресе под аренду, durazzo investimento, durres rendite | en, ru, uk, pl, it, de | `FAQPage`, `ItemList`, `Dataset` |
| S2 | `investment/durres/golem` | District spoke (repeat for `plazh`, `shkembi-i-kavajes`, `mali-i-robit`, `qerret` when ≥10 listings) | season-only market (May–Sep), new-build prices, named residences + developer tier, sewage note | AirROI Golem 27.5% / $88 card, hybrid model | `district=golem-durres` | golem apartments investment, apartamente golem investim | en, pl, ru | `FAQPage`, `ItemList` |
| S3 | `investment/new-builds` (existing, enriched; off-plan spoke) | Off-plan guide + feed | stage/handover explained, payment schedules, red flags, escrow reality, 10-step vetting (§4), Cactus residences table | developer tier badges | `stage=unfinished` | off-plan albania, new build apartments albania, новостройки албания, nowe mieszkania albania | all 7 | `FAQPage`, `ItemList` |
| S4 | `investment/rental-yield-durres` | Calculator page | the §3 formula, three scenarios, sensitivity, STR vs LTR, "what a manager costs" | interactive calculator (extended `roi.ts`) | 6 listings ≤ €130k, 1+1 | durres rental yield, airbnb durres income, доходность аренды дуррес | en, ru, pl, de | `FAQPage`, `SoftwareApplication` (calculator) |
| S5 | `investment/taxes-for-foreign-owners` | Tax spoke | 15% rental tax, DIVA, 0.05% building tax and 2029 draft, 2% transfer tax (who pays), 15% CGT, 2026 revaluation window, treaties | worked €110k example | none | albania property tax for foreigners, podatki albania nieruchomości, tasse immobili albania | en, pl, it, de, ru | `FAQPage` |
| S6 | `investment/residence-permit-and-golden-visa` | Myth page | no golden visa; what the property permit is; process; cost | — | none | albania golden visa, golden visa albanien, золотая виза албания | en, ru, de, pl | `FAQPage` |
| S7 | `investment/developers/<slug>` | Developer profiles (noindex until vetted) | QKB facts, projects, permits, delivery record, tier, sources | tier dot | `developer=<id>` | "<developer> reviews" | en, sq | `Organization` |
| C | existing `guides/*-vs-*` | Comparisons | add an "as an investment" block (yield, seasonality, time to sell) | — | — | durrës vs saranda inwestycja, meglio valona o durazzo | as today | as today |

Internal-linking rules: (1) every Durrës city/district listing page gets one line in `ListingDepthSections` → S1/S2 ("Thinking of renting it out? Durrës yield scenarios"); (2) the property page "cost of ownership" block (`PropertyOwnershipCostsSection`) links to S4 with price and area pre-filled via query (`?price=110000&area=60`); (3) listings with `stage=unfinished` link to S3 and, when a developer ref exists, to S7; (4) the three investor articles and the price-index posts link to the hub; (5) hub ↔ spokes both ways, spokes ↔ comparisons; (6) footer "Investment" column lists H, S1, S3, S4. Titles follow `withBrand` (≤50 chars + brand). Every number on the pages prints its date and source; FAQ answers go number-first in the first 40–80 words (track D rule).

## 3. The yield model

Case: Durrës coast (Plazh/Golem second line) 1+1, 60 m², asking **€110,000** (€1,833/m²). Cactus 1+1 stock in Durrës: n=127, median €101,530, median 62 m², median €1,715/m²; our catalogue median €1,413/m² (`inventory-analysis.md`), so the case is at the upper half of real stock.

**Formula** (ROI-v1, KB `24-roi-model.md`, extended with exit):

```
total_investment = price × (1 − discount) × (1 + transaction_cost) + furniture
gross_STR        = Σ_month occupancy_m × ADR_m × days_m
opex             = platform_fee + management + cleaning_net + utilities × (0.6 + 0.4 × occupancy)
                   + repairs (% of price) + insurance + building_tax + overnight_tax
income_tax       = 15% × (gross − platform_fee)            # individuals, STR and LTR alike
NOI              = gross − opex − income_tax
net_yield        = NOI ÷ total_investment
exit (year N)    = price × (1 + appreciation)^N × (1 − 3% selling costs) − 15% × capital gain
IRR              = rate where Σ cash flows (−total_investment, NOI₁…NOI_N + exit_N) = 0
```

**Assumptions** (sources: KB `19`, `20`, `21`, `22`, `23`; external where stated):

| Input | Pessimistic | Most likely | Optimistic | Basis |
|---|---|---|---|---|
| Purchase vs asking | 0% | −3% | −5% | BoA agents survey: >half of deals at asking or ≤5% below (KB DATA-PROPERTY-ALB-0006) |
| Transaction cost | 5.5% (2% transfer tax shifted to buyer, lawyer, 1% agent) | 2.5% | 1.5% | KB `23` CALC-ACQUISITION-COST; notary 0.30–0.35% (MoJ Order 279/2012), ASHK 3,500 ALL |
| Furniture | €250/m² | €200/m² | €180/m² | KB FURN_BANDS |
| STR occupancy (annual) | 36% (Jan 20% → Aug 68%) | 47% (30% → 78%) | 55% (40% → 88%) | AirROI Durrës beach 35%, Golem 27.5%; Airbtics full-time 53% ([airroi.com](https://www.airroi.com/airbnb-data/albania/durr%C3%ABs-county/durr%C3%ABs), [airbtics.com](https://airbtics.com/annual-airbnb-revenue-in-durres-albania), accessed 2026-10-08; KB DATA-STR-DURRES-0001…0006) |
| ADR (annual avg) | €60 | €68 | €75 | AirROI $74–94, Airbtics €56; beach 1+1 +25–30% Jun–Sep (KB STR_MONTHLY_DURRES) |
| Platform fee | 12% (Booking-heavy) | 6% | 3% | KB PLATFORM_FEES_2026 |
| Management | 25% full-service | self-managed | self-managed | bands 10–15% / 20–30% ([airbtics.com](https://airbtics.com/airbnb-management-companies/hotel-mustang-40105390), accessed 2026-10-08; KB `21`) |
| Cleaning cost / fee charged | €30 / €20 | €25 / €25 | €20 / €30 | Golem avg fee $30 ([airroi.com](https://www.airroi.com/airbnb-data/albania/tirana-county/golem)); KB CLEANING_COSTS |
| Utilities (60 m², 2 guests) | ≈€1,200/yr | ≈€1,150 | ≈€1,100 | KB UTILITY_MODEL: €96–112/month |
| Repairs reserve | 1.0% of price | 0.75% | 0.5% | KB DATA-SERVICE-CALC-0003 |
| Insurance / building tax / overnight tax | €72 / €65 / 70 ALL × 2 guests per night | same | same | 0.05% of reference value ([sherbimekontabiliteti.al](https://sherbimekontabiliteti.al/en/buy-property-albania-foreigner/), accessed 2026-10-08; KB DATA-TAX-0008, DATA-TAX-CALC-0001); Durrës overnight tax not published (GAP-TAX-01) |
| Income tax | 15% on gross net of platform fee | same | same | Law 29/2023; KB DATA-TAX-0002/0006/0007 |
| LTR annual rent (advertised → achieved × vacancy) | €300 × 0.90, 10% vacancy | €400 × 0.93, 6% | €450 × 0.95, 3% | Plazh 1+1 €300–500, Golem €300–450 ([homezone.al](https://homezone.al/en/properties/rent/Durres?category=apartment), accessed 2026-10-08; KB LTR_WORKING_2026 rows 05–06) |
| Appreciation p.a. | −1% | +4% | +7% | BoA Fisher index: 0% h/h, +10% y/y in H1 2026 after +28% and +41.7% in 2025 ([albaniandailynews.com](https://albaniandailynews.com/news/the-pace-of-annual-price-growth-also-decelerated-significantly-according-to-the-fisher-housing-price-index-1), accessed 2026-10-08); KB FC_PRICES_2027 Durrës −4% / +5% / +12% |
| Exit costs / CGT | 3% (seller agent + notary) + 15% × gain | same | same | KB DATA-PURCHASE-0004, DATA-TAX-0010 |

**Results** (computed 2026-10-08; script in session scratchpad; all ESTIMATE):

| Scenario | Total invested | STR gross / yr | Gross yield | STR NOI / yr | **STR net yield** | LTR NOI / yr | **LTR net yield** | **IRR 5 yrs (STR / LTR)** | **IRR 10 yrs (STR / LTR)** |
|---|---|---|---|---|---|---|---|---|---|
| Pessimistic | €131,050 | €7,962 | 7.2% | €1,607 | **1.2%** | €1,102 | **0.8%** | −3.6% / −4.0% | −1.5% / −2.0% |
| Most likely | €121,367 | €11,506 | 10.8% | €7,093 | **5.8%** | €2,464 | **2.0%** | **6.2% / 2.3%** | **7.7% / 3.9%** |
| Optimistic | €116,867 | €15,186 | 14.5% | €11,055 | **9.5%** | €3,393 | **2.9%** | 12.3% / 5.9% | 13.2% / 7.3% |

Worked example, most likely: 170 booked nights × €68 = €11,506; minus platform €690, utilities €904, repairs €800, insurance €72, building tax €65, overnight tax €259, income tax 15% × (11,506 − 690) = €1,622 → NOI €7,093 (€591/month) on €121,367 invested = 5.8%. Sale after 10 years at 4%/yr: €157,942, less 3% and 15% CGT on the €51k gain → IRR 7.7%. Hybrid (summer STR + 8-month winter let) lands between STR and LTR (KB `24`: Golem hybrid 6.0% base on €100k).

**Sensitivity** (most-likely STR net yield 5.8%): manager at 25% → 3.6% (−2.2 pp); occupancy ±10 pp → ±1.4 pp; ADR ±15% → ±1.1 pp; paying asking +15% (€1,900/m²) → 4.9% (−0.9 pp); Booking-heavy fees → −0.5 pp; transfer tax shifted → −0.15 pp; repairs 1% or utilities +30% → −0.2 pp each. **Order of what moves the result: management fee > occupancy > ADR > purchase price > platform mix > everything else.** Appreciation dominates IRR, not yield: at −1%/yr even the optimistic operating case barely breaks even over 5 years. These are the two levers the pages must make visible, not the tax.

Reading for the copy: external claims of "8–12% yield" ([armenian-lawyer.com](https://armenian-lawyer.com/business-immigration/balkan-property-investment-roi-best-countries-residency/), [investropa.com](https://investropa.com/blogs/news/durres-which-area), accessed 2026-10-08) are **gross** and seasonal; our most-likely **net** is 5–6% self-managed, ≈3.5% managed, and the coast's supply grew +69% in 2025 with revenue per listing +2.6% (KB DATA-STR-DURRES-0005): oversupply is the pessimistic case's engine. Open data gaps to close before publishing S4: Durrës overnight tax and waste tariff (GAP-TAX-01), a real manager price list (GAP-MGMT-01), achieved coastal rents (GAP-LTR-01).

## 4. Developer-reliability method and the Cactus set

**Vetting checklist (per developer, published as the tier note):**
1. **QKB** (qkb.gov.al, free, by name/NIPT): legal form, capital, shareholders/beneficial owners, administrators, status, year founded; pull the e-Albania "Ekstrakt historik" for changes of owner ([businessdataguide.com](https://www.businessdataguide.com/blog/jurisdictions/albania-company-search-guide), accessed 2026-10-08). Red flags: capital of 100,000 ALL for a 1,000-flat project, founded <2 years ago, Gmail contact.
2. **Land title** at ASHK: certificate and mortgages on the plot; legalised (ALUIZNI) plots carry compensation disputes (KB `05-legal` §risks).
3. **Permits**: `leje ndërtimi` (KKT decisions for large coastal projects; municipal for small ones) and, for finished buildings, `leje përdorimi`; cross-check floors built vs permitted (Golem/Shkëmbi history of 6–8 floors on 3-floor permits, KB `06-developers` §3). ShtegUrban's tracker (shtegurban.org) already lists permit status for some Durrës projects, e.g. Desla Towers ([shtegurban.org](https://shtegurban.org/tracker/desla-hotel-residence-towers-durres?lang=en), accessed 2026-10-08).
4. **Contract form**: notarised `kontratë porosie` registered at ASHK (Instruction 1557/2024); refuse private contracts.
5. **Money**: payments tied to construction milestones (30/30/30/10 is good; 50% + balance in 6 months regardless of progress is bad); notary escrow for the deposit. Escrow is **not** mandatory in Albania (KB `06-developers` §1), so its absence is normal but must be priced as risk.
6. **Delivery record**: previous projects handed over vs promised date; `leje përdorimi` obtained; ASHK registration of buyers' units completed.
7. **Litigation / media**: SPAK and court records, local press (Monitor, Shqiptarja, Reporter.al); IKMT demolition or subsidence notes.
8. **Insurance**: the developer's 10-year structural insurance (required for ASHK registration).
9. **Legalisation** issues: any part of the building under `legalizim` rather than a permit.
10. **Site visit** with photos, dated; compare with sales render.

Scoring: green (1–8 clean) / yellow (slips or thin company, no litigation) / red (litigation, no permit, sales before permit). Published on S7 and as the `developer.tier` badge on listings; "unknown" is a valid, visible state.

**Cactus dataset facts** (418 docs: 373 sale, 45 rent; Durrës 362, Shëngjin 20, Tirana 14, Vlorë 9, Sarandë 5): 26 sale docs are `is being built`, ≈15 more say "under construction"; handovers quoted May/Aug/Oct 2026, Jan 2027, Q1 2027, H2 2027. Under-construction Golem 1+1s price at €1,200–1,450/m²; 79 descriptions sell "sea view", 23 say "investment", 6 offer instalments.

| Residence (zone) | Cactus listings | Developer found | Public information (accessed 2026-10-08) | Tier (provisional) |
|---|---|---|---|---|
| Liburna Residence (Golem, Pishat e Buta) | 5 (incl. "building 3, completion May 2026") | **Optimum Property** (founded 2024, led by Brunild Gashi) | 15 buildings, >1,300 flats, "end of 2025" completion on Realting vs May 2026 in Cactus → slipped; contact via Instagram/Gmail ([optimumproperty.al](https://optimumproperty.al/liburna), [realting.com](https://realting.com/albania/new-buildings/22484)) | yellow: young company, very large project, slip; QKB/permit unknown |
| Palm Paradise Residence (Qerret) | 1 | Optimum Property / BIT Investment Group | 20 five-storey buildings, >1,000 flats, 300 m from sea ([optimumproperty.al](https://optimumproperty.al/palm-paradise), [investoreality.cz](https://www.investoreality.cz/en/property/palm-paradise/)) | yellow: same developer carrying two >1,000-unit projects |
| Desla Tower (Plazh/Hekurudha) | 1 (1+1 100 m², €170,697) | **Desla sh.p.k.** | 25-floor hotel + 17- and 9-floor residential; permit shown as confirmed on ShtegUrban tracker ([shtegurban.org](https://shtegurban.org/tracker/desla-hotel-residence-towers-durres?lang=en)) | yellow→green pending QKB and delivery check |
| White Hill Residence (Currila) | 5 (€350k / 113 m² ≈ €3,100/m²) | contact `dci-company.com`; company name unverified | 3 residential + 1 hotel building, 50 m from sea; widely resold by C21 and others ([century21albania.com](https://www.century21albania.com/en/property/590450/whitehill-residence-currila-durres-new30973.html)) | unknown |
| SunSea Residence (Golem) | 1 (two studios, €1,300/m²; 50% down, balance in 6 months; completion Jan 2027) | **unknown** | listed by Dua Shpi/C21; completion 2027, from €58,500 ([duashpi.al](https://duashpi.al/en/property/689c424dafc0ee556d026a62/project-sunsea-residence-golem.html)) | red flag on payment terms until developer identified |
| Gioia Residence (Mali i Robit) | 1 (€57,850 / 44.5 m²) | unknown | milestone payments 30/30/30/10 ([homezone.al](https://homezone.al/en/property/sale/durres/mali-i-robit-168443)) | unknown, good contract structure |
| Vjena/Viena complex (Golem), Adriatic Garden (Mali i Robit), Toqac T complex (Plazh), Dyrrakium Residence (Currila), Rotondo (Plazh, resale), Tirana Dritan Hoxha complex | 1–4 each | unknown | KB `02-cities/durres.md` §5 notes a branded-hotel project "near Vjena" from €2,000/m² | unknown |
| Kodra e Diellit (Tirana) | 1 | Agikons sh.p.k. | owner Gentian Sula is a defendant in the Veliaj case (KB `06-developers` §3, a2news) | yellow |
| Illyria/Iliria Beach | 11 | not a development: the Iliria zone of Plazh | — | n/a |

Before import: ask Cactus for developer name + NIPT on every off-plan listing; map them to `developer` documents; show the tier badge; do not publish any yield claim from Cactus copy ("Perfect for investment!").

## 5. Traffic plan

**Organic, by locale** (from `DEMAND-VS-SUPPLY-2026-10-04.md`: Albania 41% of clicks, Ukraine best CTR, Italy comparisons at pos 7, Poland 995 impressions at pos 17, Germany/UK/US small): ship en first (also the AI-search language), then ru/uk (Durrës queries already at 20–32), pl (comparison-led: Saranda vs Durrës investment, Albania vs Montenegro), it (Durazzo investimento block on existing comparisons), de (hub + S1 as "Marktreport"), sq last (price hub covers it). Request indexing in GSC and push via IndexNow on publish; add hub and spokes to `/llms.txt` and `sitemap-landings.xml`.

**AI search**: the site is already cited by Perplexity on prices and received its first lead from ChatGPT (`ai-prompt-panel.md`). Add five prompts to the panel ("Is buying an apartment in Durrës to rent out worth it in 2026?", "Albania golden visa?", "Tax on Airbnb income in Albania", "Durrës vs Saranda for rental investment", "How to check an Albanian developer"), publish the scenario table as `Dataset` with a dated `temporalCoverage`, keep answers number-first, state sources inline. The honest debunk pages (S5, S6) are the most citable content type: assistants prefer a page that contradicts marketing with a law reference.

**Distribution**: Telegram channel `t.me/real_estate_al` and the Durrës buying-guide PDF (lead magnet) → add a "yield scenarios" PDF per locale behind the existing `guide-request` form; Polish Facebook groups and blogs already listed in the Q4 plan (Albania po polsku, Polka Inwestuje), Reddit r/albania and expat.com threads that ask "is Durrës a good investment" (answer with the calculator link); YouTube: no channel yet (Q4 track A owner task) — a 6-minute "what a Durrës 1+1 really nets" walkthrough of S4 is the first video worth making. **Partner backlinks**: Cactus (partner page linking to Domlivo), Optimum Property and Desla (a "verified on Domlivo" badge page they can link), monitor.al / invest-in-albania for the yield study, Realting/Properstar feeds (owner task).

**Measure**: GSC query clusters `invest*`, `yield|доходн|rendite|rendimento|opłacal`, `golden visa`, `off-plan|новостро|nowe`; impressions and position per spoke per locale; Clarity scroll depth on the scenario table; calculator interactions as a GA4 event (`calc_run` with scenario); leads tagged by page (`lead.sourcePage`) and type (`investment` vs `home`); AI panel citations monthly.

**6-week rollout**

| Week | Ship | Depends on |
|---|---|---|
| 1 | S4 calculator page (en, ru) with §3 scenarios from existing KB data; extend `roi.ts` to the full waterfall; property-page cost block links to it; KP replay of ~60 investment phrases | nothing new: all data exists |
| 2 | Hub `investment` (en, ru, uk, pl, it, de) with BoA/KB numbers and myth block; S6 golden-visa page (en, ru, de); llms.txt + sitemap + IndexNow | week 1 |
| 3 | S1 `investment/durres` with zone bands, risks, 3 scenarios, listing feed; investor block on `guides/*-vs-*`; footer column | week 2 |
| 4 | S3 enrich `new-builds` into the off-plan guide; Cactus import with developer refs; S7 profiles for Optimum Property, Desla (noindex) after QKB/permit check | Cactus NIPT data from the partner |
| 5 | S5 taxes page (en, pl, it, de, ru) after a lawyer reads the 2% transfer-tax and DIVA points; S2 Golem spoke | lawyer review (Q4 plan track A open task) |
| 6 | pl/it/de translations of S1 and S4 via the export/apply locale jobs; yield PDF lead magnet; AI panel run; first GSC read | weeks 1–5 |

## 6. Risks and legal-honesty notes

- Every yield, IRR and price forecast is labelled **estimate**, dated, with the source and the formula visible; no "guaranteed", "secure" or "passive income" wording; the pessimistic case is shown with the same weight as the optimistic one. Add the Q4-plan sentence "forecasts are not investment advice" and the legal-reviewer signature once the owner finds one.
- Figures that need a lawyer before publishing: who bears the 2% transfer tax (law says the transferor, Law 9632/2006 and KB DATA-PURCHASE-0002; agency sites say buyer — contract practice shifts it), DIVA mechanics for non-residents, STR classification via AKT and the Durrës overnight tax (KB OPEN-TAX-02…05).
- Market risks to state on-page: coastal STR oversupply (+69% listings in 2025), the January 2026 floods in low-lying Durrës neighbourhoods (Spitallë, Kënetë, Nishtullë; ≈800 homes, [balkaninsight.com](https://balkaninsight.com/2026/01/07/heavy-rains-cause-evacuations-and-discontent-in-albania/), accessed 2026-10-08), 2019 earthquake stock, Golem sewage, Durrës Marina subsidence (KB `02-cities/durres.md` §5–7), Vlora airport still not open as of September 2026 ([terrainvestsolutions.com](https://terrainvestsolutions.com/blog/vlora-airport-albania/), accessed 2026-10-08), the 2029 property-tax reform draft (0.1–0.2% of market value).
- Developer pages: publish facts from registries and dated press only; "yellow"/"red" needs a cited event, never an opinion; give the developer a right of reply; unknown stays "unknown".
- Compliance: the scenario calculator must not store personal data; lead forms keep the existing consent flow.

## Recommendation: build these three first

Build **S4 `investment/rental-yield-durres`** first, because it is the only page in the set that no competitor has (the "Durrës rental yield" SERP returns listing pages), it is built entirely from data we already hold in `12-ai-database`, it is the most citable asset for ChatGPT/Perplexity, and its sensitivity analysis is the honest answer to the "10–12%" marketing our visitors arrive with. Second, the **hub `investment`**, because every other spoke, article and comparison needs a parent to link to and it carries the two myth blocks (golden visa, 8% tax) that attract AI citations and shareable links. Third, **S1 `investment/durres`**, because Durrës is where demand and 350 of our 370 listings coincide, the Cactus import adds ~360 more Durrës units including the off-plan stock the page explains, and it turns the KB zone bands and risks that only exist in Russian research files into seven-language, dated, linkable content. The off-plan and developer pages wait until Cactus supplies developer names and the first QKB checks are done.
