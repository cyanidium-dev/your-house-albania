# Content, E-E-A-T, structured data and GEO audit — www.domlivo.com

Fetched 2026-09-25 with a plain HTTP fetch (no JS execution), script: scratchpad/audit.mjs; raw HTML and parsed JSON in scratchpad/findings/ (audit-data.json, audit-stdout.txt, raw-*.html). Word counts = text inside <main> minus header/footer/nav.

## 0. Fetch status

| Page | Status | Words (main) | Title len | Desc len |
|---|---|---|---|---|
| /en | 200 | 1049 | 72 | 146 |
| /en/about | 200 | 550 | 56 | 154 |
| /en/albania/durres | 200 | 1576 | 73 | 138 |
| /en/albania/durres/golem-durres | 200 | 1397 | 74 | 111 |
| /en/albania/durres/apartments | **404** (noindex fallback page, title "Domlivo — Real estate in Albania") | 0 | 32 | 191 |
| /en/albania/durres/info | 200 | 1751 | 69 | 157 |
| /en/guides | 200 | 777 | 16 | 57 |
| /en/guides/buying | 200 | 362 | 44 | 131 |
| /en/blog | 200 | 915 | 65 | 146 |
| /en/blog/moving-to-albania-with-family | 200 | 2014 | 65 | 156 |
| /en/blog/albania-rental-yield-for-investors | 200 | 1964 | 63 | 154 |
| /en/blog/retiring-to-albania-property-costs | 200 | 2060 | 65 | 157 |
| /en/property/apartment-2-1-golem-durres-69m2 | 200 | 590 | 55 | 153 |
| /de/property/wohnung-2-1-golem-durres-69m2 | 200 | 573 | 54 | 153 |
| /de/albania/durres | 200 | 1545 | 78 | 149 |
| /pl/albania/durres | 200 | 1562 | 77 | 125 |
| /en/privacy | 200 | 689 | 24 | 156 |
| /llms.txt | 200 (3,974 chars) | | | |
| /llms-full.txt | 404 | | | |

Sitemap index lists 10 child sitemaps (priority, static, cities, types, non-geo-listings, properties, blog, landings, districts, knowledge). sitemap-blog.xml: 238 URLs; sitemap-properties.xml: 2,667 URLs. The 3 newest EN blog posts all carry the same lastmod 2026-09-20T17:22:22Z (batch timestamp, not per-post edit dates).

## 1. Per-page content

| Page | Words | H1 | H2 outline | Verdict |
|---|---|---|---|---|
| /en | 1049 | Real estate in Albania — buy an apartment, house or villa | Popular listings · Choose the property · Most popular cities · Worth investing in · Investment property — stable returns · Why choose Domlivo · Platform for agents · Blog · FAQ (10 Q) | OK; marketing copy, one FAQ block |
| /en/about | 550 | About Domlivo | Our idea · Research, with sources · The team · How listings get on Domlivo · Contact | OK; 3 founders with bios and outbound profile links |
| /en/albania/durres | 1576 | Durrës Real Estate: Apartments & Property for Sale | 358 listings · Buying property in Durres · Property prices in Durres · Get the guide (PDF) · Property by district · Buying in Durres: questions and answers (5 Q) · Buying as a foreigner: what it costs | OK, unique intro, live stats "Data as of September 25, 2026, based on 358 listings" |
| /en/albania/durres/golem-durres | 1397 | Apartments for Sale in Golem, Albania | identical 7-heading template as the city page with "Golem, Durres" substituted; "Other districts in Durres" instead of "Property by district" | Intro is unique (Golem 1,100 €/m² second line, 2,000–2,500 first line); outline is templated |
| /en/albania/durres/apartments | 0 | — | — | 404 (noindex fallback). sitemap-types uses /en/albania/durres/sale/apartment; /en/albania/durres/apartment 308s there, /apartments does not |
| /en/albania/durres/info | 1751 | Property prices in Durres in 2026, area by area | Top properties · Where to buy: districts and prices · Prices by zone 2026 · What our listings ask, by district · Useful articles · FAQ (11 Q) · Explore the districts · Related comparisons · Districts of Durres | OK; the only page with external source links (monitor.al, investropa.com, homezone.al x2, dyqani.app) |
| /en/guides | 777 | Guides | no H2 at all (cards only) | Hub with no section structure; title 16 chars, description 57 chars |
| /en/guides/buying | 362 | Property Buying Guides | Guides on this topic · Frequently asked questions · Need help choosing? | THIN: 362 words, all card teasers; zero sentences with a price, % or €/m²; FAQ has 3 questions but only the first answer is in the HTML (answers 2–3 exist only in JSON-LD / RSC payload) |
| /en/blog | 915 | Real estate insights. | none | Generic H1; description copied from /en |
| /en/blog/moving-to-albania-with-family | 2014 | Moving to Albania With a Family: Residence, Schools, Rent and Which City to Choose | Properties on this topic · FAQ (4 Q) — body headings are H3/anchors | OK depth; "In short" key-facts block at top |
| /en/blog/albania-rental-yield-for-investors | 1964 | Rental Yield in Albania for a Foreign Investor: Long Let, Summer Let, Tax and the Manager's Cut | Properties on this topic · FAQ (4 Q) | OK depth; states 4–6% gross, 15% tax, manager 10–45%, with confidence labels ("We hold this at medium confidence") but NO external source links (only wa.me / t.me / code-site.art outbound) |
| /en/blog/retiring-to-albania-property-costs | 2060 | Retiring to the Albanian Coast: What a Flat Costs to Own, and What the Paperwork Looks Like | Properties on this topic · FAQ (4 Q) | OK depth |
| /en/property/apartment-2-1-golem-durres-69m2 | 590 | 1+1 apartment at Golem Beach, new construction | Get the guide (PDF) · Ask about this property · Similar Properties | Normal for a listing; 2 photos only ("Check all photos (2)"); listing text is partner-supplied |
| /de/property/wohnung-2-1-golem-durres-69m2 | 573 | 1+1 Wohnung am Strand von Golem, Neubau im Murrizi Resort | German equivalents | Fully translated incl. title/description/JSON-LD |
| /de/albania/durres | 1545 | Wohnung kaufen in Durrës — Immobilien in Albanien | same 7-heading template in German | translated 1:1 |
| /pl/albania/durres | 1562 | Durrës, Albania: mieszkania i apartamenty na sprzedaż | same 7-heading template in Polish | translated 1:1 |
| /en/privacy | 689 | Privacy Policy | Who we are · What we collect · Where form submissions go · Analytics · Browser storage · Who else processes · Transfers · Your rights · Security · Children · Changes | Concrete and specific; NO legal entity |

Uniqueness check, first 300 chars of main text:
- /en/albania/durres: "Apartments, studios, villas and land for sale in Durrës and along its coast — from the centre and Plazh to Golem, Qerret and Spille. Real prices, photos and direct contact. 358 listings · from €21,000 · median €1,416/m² for flats…"
- /golem-durres: "Golem is the most sought-after beach south of Durrës: new 1+1 and 2+1 apartments from 1,100 €/m² on the second line and 2,000–2,500 €/m² on the first. 80 listings · from €50,000 · median €1,311/m² for flats…"
- /info: "Property prices in Durres in 2026, area by area Choose verified sale offers with clear pricing and coastal districts Find the best property in Durres Location Any location…" (opens with a search widget, not copy)
- Verdict: intros are unique; H2 skeletons and the "Buying as a foreigner: what it costs" block (Notary 0.23–0.35%, ASHK 3,500 lek ≈ €38, agency 1%, 2% transfer tax paid by seller) are identical boilerplate on /durres, /golem-durres and the property page. /info and /durres embed the same 12-listing "Top properties" module (identical H3 list).
- Images: no missing alt on any page except /en (2 decorative category SVGs with alt="", acceptable).

## 2. E-E-A-T

- Blog author: every post is bylined "Domlivo Editorial" (Article.author = Organization "Domlivo Editorial", parentOrganization → #organization, url → /en/about). No Person author, no author bio, no author link in the visible byline, no "reviewed by" anywhere (grep of guides/buying, privacy, blog post: none).
- About page: linked from the footer (/en/about) on every page; NOT in the header navigation.
- Organization JSON-LD (in the @graph on every page): name "Domlivo", url, logo (ImageObject, Sanity SVG 288x41), email hello@domlivo.com, description, areaServed, knowsLanguage, founder ×3 (Person @ids), contactPoint ×3 (email / WhatsApp / Telegram, contactType "customer support"), sameAs = [wa.me/message/KPXIGD5DJISGO1, t.me/real_estate_al]. MISSING: telephone, address. legalName = "Domlivo — Real estate in Albania" (a tagline, not a registered entity). sameAs has no LinkedIn/Facebook/Instagram/Google Business Profile.
- Person schema: /en/about carries AboutPage + 3 Person nodes (Fedir Alpatov, Viktor Grinchenko, Diana Merkotun) with jobTitle, description, image, worksFor, knowsAbout, sameAs (code-site.art; grinchenko-realestate.com, Telegram, Instagram, YouTube). Good. These Persons are not reused as blog authors.
- Legal entity on privacy: "Domlivo (domlivo.com) publishes property listings in Albania… This site is operated by the Domlivo team." No company name, NIPT, registered address or named data controller. No TODO/placeholder tokens found on any page.
- Phone: the only phone on the site is +355 68 928 6136 (footer, wa.me/355689286136). No +355 69 000 0000 placeholder observed. The phone is not in Organization.telephone.
- Dates: blog posts "Sep 20, 2026"; /info "Updated: Sep 25, 2026"; /durres "Data as of September 25, 2026"; /guides/buying "Updated: Aug 26, 2026"; privacy "Last updated: 10 September 2026".

## 3. Structured data

All JSON-LD blocks parsed as valid JSON (0 syntax errors across 17 pages).

| Page | @types |
|---|---|
| /en | graph(Organization, WebSite) · FAQPage(10) |
| /en/about | graph(Organization, WebSite) · graph(AboutPage, Person×3) · BreadcrumbList |
| /en/albania/durres, /golem-durres, /de, /pl | graph(Organization, WebSite) · BreadcrumbList · ItemList(24 of 358 / 80) |
| /en/albania/durres/info | graph(Organization, WebSite) · BreadcrumbList · Dataset · FAQPage(11) |
| /en/guides | graph(Organization, WebSite) · BreadcrumbList |
| /en/guides/buying | graph(Organization, WebSite) · Article · BreadcrumbList · FAQPage(3) |
| /en/blog | graph(Organization, WebSite) · BreadcrumbList |
| blog posts ×3 | graph(Organization, WebSite) · Article · BreadcrumbList · FAQPage(4) |
| property en/de | graph(Organization, WebSite) · graph(RealEstateListing, Apartment, Product) · BreadcrumbList |
| /en/privacy | graph(Organization, WebSite) only |

Field validation:
- WebSite: name, url, inLanguage [7], publisher, potentialAction SearchAction → https://www.domlivo.com/en/catalog?q={search_term_string} with query-input. Complete (search target not fetched).
- BreadcrumbList: positions, names, item URLs present. /durres: Home > Properties (/en/catalog) > Albania (/en/sale) > Durres. /info: Home > Cities > Durres (item = /info). Property: 6 levels down to the listing. Valid.
- Article (blog): headline, datePublished, dateModified, url, author (Organization), publisher, description, image (string), inLanguage, mainEntityOfPage. Complete for rich results. Observation: datePublished = 2026-09-20T17:22:22.321Z / .315Z / .305Z (three posts 16 ms apart) and dateModified 17:24:49.000Z identical on all three → batch-import timestamps, not editorial dates; sitemap lastmod is the same value.
- Article on /en/guides/buying: headline "Property Buying Guides", author Organization, dates, NO image (required for Article rich results); a hub page marked up as Article.
- FAQPage: /en (10), /info (11), /guides/buying (3), blog (4). Answers 196–382 chars. On /guides/buying only Q1's answer is rendered in the HTML; Q2/Q3 answer text is not in the DOM (markup/content mismatch). /durres, /golem-durres, /de, /pl have visible Q&A sections (5 questions) with NO FAQPage markup (grep FAQPage = 0).
- Dataset (/info): name, description, url, inLanguage, isAccessibleForFree, dateModified 2026-09-25, temporalCoverage, creator, publisher, spatialCoverage (Place + 8 containsPlace), variableMeasured ×4, measurementTechnique. Missing recommended: license, distribution (no downloadable file), keywords.
- ItemList (/durres): numberOfItems 24, 24 ListItems with position/url/name/image. Fine; numberOfItems reflects page size, not the 358 total.
- Property page: RealEstateListing (@id, name, url, inLanguage, description, image[], datePosted 2026-04-30, mainEntity → Apartment) + Apartment (address {Durres, Golem, AL}, floorSize 68.5 MTK, rooms/bedrooms/bathrooms) + Product (name, url, description, image[], offers Offer {price 89050 EUR, availability InStock, businessFunction Sell, url, priceSpecification UnitPriceSpecification 1300 EUR/MTK}, additionalProperty ×4). Offer complete; Product lacks brand/sku (not required). No geo coordinates in Apartment (coordinates exist in the page payload for map pins).
- No Person node on blog Articles; no LocalBusiness/RealEstateAgent type (Organization only) — no NAP for local rich results.
- og:locale absent on all three pages checked.

## 4. AI search / GEO

- robots.txt: "User-Agent: * / Allow: / / Disallow: /api/". No explicit rules for GPTBot, ClaudeBot, PerplexityBot, Google-Extended, OAI-SearchBot, CCBot → all allowed via the wildcard. Explicitly blocked: GoogleOther*, KeenableBot, Amazonbot, Bytespider, PetalBot, MJ12bot, DotBot, BLEXBot, SemrushBot, barkrowler. AhrefsBot Crawl-delay 30. 11 Sitemap lines.
- /llms.txt: 200, 3,974 chars, well-formed (H1, blockquote summary, sections Listings / Prices and districts / Guides and comparisons / About / Sitemaps, ~25 links with one-line descriptions, locale note). Good quality. It claims "published market sources, each cited on the page with a link" — true on /info (5 external sources) but not on /en/albania/durres (0 external non-contact links; "Our sources put gross short-let yield in Plazh at 7–11%" without naming them) nor on the rental-yield post (0 external source links). /llms-full.txt: 404.
- Citable facts on /en/albania/durres/info: 5 short sentences with € ranges per zone ("The centre and the Currila–Vollga–Taulantia seafront ask €1,900–2,800/m²." "The city average is about €1,450/m², up roughly 18% year on year…"), dated "Updated: Sep 25, 2026", plus a live table "Durres: what our listings ask, by district" and Dataset markup. Yields and buying costs are NOT on /info (0 yield sentences, 0 cost sentences). FAQ answer block present (11 Q, first: "How much does an apartment cost in Durrës in 2026?").
- /en/albania/durres has the best citable cost/yield sentences ("Notary: 0.23–0.35% of the price…", "gross short-let yield in Plazh at 7–11%", "Data as of September 25, 2026, based on 358 listings") with a source line "Rates: Ministry of Justice Order 279/2012 (notary scale), the ASHK fee schedule" — but no FAQPage markup and no links to the cited sources.
- /en/guides/buying: 0 citable fact sentences; FAQ present (3 Q) with only 1 answer visible. Costs appear only inside JSON-LD as "roughly 3–5% on top of the price", which contradicts the /durres block that computes ~1.3% (notary 0.23–0.35% + €38 + 1% agency).
- Blog posts open with an "In short" key-facts block (good for extraction) and label confidence; sources described in prose but not linked.

## 5. Titles and descriptions (17 pages)

- Duplicate description: /en and /en/blog share "Verified apartments, villas and commercial property in Tirana, Durrës, Vlorë and Sarandë. Direct from owners and trusted agencies — no commission." No duplicate titles.
- Titles over 60 chars (10 of 16 live pages): /en 72, /durres 73, /golem-durres 74, /info 69, /blog 65, moving-to-albania 65, rental-yield 63, retiring 65, /de/albania/durres 78, /pl/albania/durres 77. Every title ends in " — Domlivo" (10 chars).
- Short/weak: /en/guides title "Guides — Domlivo" (16), description 57 chars; /en/privacy title 24 (acceptable).
- Descriptions present on all pages; property descriptions are the raw listing text with line breaks ("1+1 apartment for sale at Golem Beach / At Murrizi Resort / Floor: 2nd…") truncated with "…" at 153; /info description also truncated mid-sentence with "…" at 157.
- 404 fallback page: title "Domlivo — Real estate in Albania", 191-char description, noindex.

## 6. hreflang / inLanguage (3 pages)

/en/albania/durres, /de/albania/durres, /en/blog/albania-rental-yield-for-investors: each has 8 alternates (en, uk, ru, sq, it, pl, de, x-default → /en), absolute self-referencing URLs, reciprocal between en and de, html lang matches the locale, canonical = self. WebSite.inLanguage = 7-array; Article.inLanguage = "en"; RealEstateListing.inLanguage = "de" on the DE listing. Consistent. og:locale tag absent.

## Prioritised defects

| Sev | Page | Defect | Evidence |
|---|---|---|---|
| High | /en/albania/durres/apartments | 404; only /sale/apartment exists and only the singular /apartment redirects | HEAD: /apartments 404, /apartment 308 → /sale/apartment; sitemap-types lists /en/albania/durres/sale/studio, /sale/land |
| High | /en/privacy + Organization JSON-LD | No legal entity anywhere: privacy says "operated by the Domlivo team"; Organization.legalName = "Domlivo — Real estate in Albania" (tagline); no address, no telephone in schema | privacy "Who we are"; Organization keys |
| High | blog posts ×3, /guides/* | No human author: Article.author is Organization "Domlivo Editorial"; no bio, no reviewer, although 3 founder Person nodes with knowsAbout exist on /about | Article.author JSON; visible byline |
| High | /en/guides/buying | Thin hub: 362 words, zero price/cost/% sentences; FAQ answers 2–3 missing from the DOM while present in FAQPage JSON-LD; Article markup without image; JSON-LD says costs "roughly 3–5%" vs /durres "about €1,340 (1.3%)" | §1, §3, §4 |
| Medium | /en/albania/durres, /golem-durres, /de, /pl | Visible 5-question Q&A section has no FAQPage markup, while /en, /info and blog posts do | grep FAQPage = 0 |
| Medium | /en/albania/durres, rental-yield post | "Our sources put…" / "sources report…" with no source links (only wa.me, t.me, code-site.art outbound); llms.txt promises "each cited on the page with a link" | external href lists |
| Medium | blog posts ×3 | datePublished 2026-09-20T17:22:22.3xxZ (16 ms apart) and identical dateModified 17:24:49 — import timestamps, not editorial dates; sitemap lastmod identical | Article JSON, sitemap-blog.xml |
| Medium | 10 pages | Titles 63–78 chars; the " — Domlivo" suffix pushes every localised city title past 70 | §5 |
| Medium | /en/blog | Description duplicated from /en; H1 "Real estate insights." is generic | meta description, h1 |
| Medium | /en/guides | No H2s, 16-char title, 57-char description | h2 = [] |
| Low | Organization | sameAs only WhatsApp + Telegram; no LinkedIn/Facebook/Instagram/GBP; no RealEstateAgent/LocalBusiness node | sameAs array |
| Low | /info Dataset | No license / distribution / keywords | Dataset keys |
| Low | property pages | Meta description = raw listing text with line breaks and "…" truncation; only 2 photos on the sampled listing; Apartment has no geo | meta, "Check all photos (2)" |
| Low | all pages | og:locale missing; /llms-full.txt 404 | grep og:locale |
| Low | robots.txt | AI crawlers allowed only implicitly via "*"; no explicit GPTBot/ClaudeBot/PerplexityBot/Google-Extended lines (functionally fine) | robots.txt |
| Low | /info + /durres | Same 12-listing "Top properties" module (identical H3 list) on both pages; identical 7-H2 skeleton across city/district pages | h3 lists |

Positives worth keeping: valid JSON-LD everywhere, Organization+WebSite+SearchAction graph, Person schema for founders, Dataset with live district table, dated key-fact sentences on /info and /durres, 8-way hreflang correct, llms.txt well-formed, full DE/PL translations including schema.
