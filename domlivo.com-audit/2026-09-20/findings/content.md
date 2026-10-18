# Domlivo.com — Content Quality / E-E-A-T Audit
Date: 2026-09-20 | Scope: 42 pages fetched (raw HTML, browser UA, 1 req/s), text extracted via trafilatura.

## Content Quality Score: 46/100

Solid, non-generic market-data writing on city/district/info/blog pages (real €/m² figures, dated sources, FAQ schema) is undercut by a structurally unverifiable identity layer (no About/Contact page, a literal `TODO(legal)` placeholder for the company's registered entity, "agent" profile pages with no bios or photos) and badly thin commercial category pages (Durrës city page ≈198 words of unique copy against an 800-word service-page floor).

## E-E-A-T Breakdown

| Factor | Score /10 | Evidence |
|---|---|---|
| Experience | 5/10 | District pages (`/en/albania/durres/districts/plazh`, 625 words) and blog posts read like someone who actually tracks the local market ("Currila alone up 70–90% since 2019", earthquake-check checklist with the 2019 M6.4 event, notary/tax reference-price mechanics). No photos/video that are visibly first-hand, no "we visited" framing, but the specificity is above generic AI filler. |
| Expertise | 4/10 | Blog/guide JSON-LD `author` is `{"@type":"Person","name":"Domlivo Editorial"}` (`/en/blog/buying-apartment-durres-complete-guide`) — a house pseudonym, not a named expert with credentials. "Agent" pages (see below) carry zero bio, license or track-record text. |
| Authoritativeness | 3/10 | No press mentions, no cited external sources/regulatory links (reference prices, earthquake stats, EU-accession claims are stated but not linked to Ministry of Finance / INSTAT / official sources), no reviews or testimonials found anywhere in the 42 pages crawled. |
| Trustworthiness | 3/10 | `/en/privacy` contains the literal string **"TODO(legal): the registered entity operating this site, its registration number and registered address belong here."** — a placeholder left live in a legal document. No street address, no company registration/NIPT number, no licence claim found on any page (`mentions_nipt_or_regno` true only because that TODO sentence itself contains "registration number"). One phone number (`+355 68 928 6136`) and one mailbox (`hello@domlivo.com`) are the only real contact signals on the entire site — found repeated identically on every single page via JSON-LD `ContactPoint`, not as a human/office presence. |

**Weighted score (20/25/25/30): 0.2(5)+0.25(4)+0.25(3)+0.30(3) = 3.65/10 → ~37/100** for the trust-weighted E-E-A-T component; blended with on-page/content-structure quality (freshness, schema, internal linking, which are comparatively strong) gives the 46/100 overall score above.

## Word counts vs. minimums (unique main content, nav/cards/boilerplate excluded)

| Page | Words | Minimum | Verdict |
|---|---|---|---|
| Home `/en` | 349 | 500 (homepage) | Below |
| Home `/ru`, `/de`, `/sq` | 336 / 340 / 373 | 500 | Below, near-identical across locales (see duplication below) |
| Durrës city `/en/albania/durres` | 198 | 800 (service/category) | **Far below** — thinnest important commercial page on the site |
| Durrës city, other 5 locales | 180–218 | 800 | Same gap, all locales |
| District `golem-durres` | 510 | 500–600 (location page) | Meets |
| District `plazh` | 625 | 500–600 | Meets |
| `/en/albania/durres/info` | 337 | — | Adequate but thinner than `/tirana/info` (384) |
| Property pages (6 sampled) | 205–280 | 300–400 (product) | **Below** on every sample |
| Blog posts (4 sampled) | 367–898 | 1,500 (blog) | **Below on all 4**, worst is 367 (`durres-old-apartment-earthquake-check`) |
| Guides (3 sampled) | 333–460 | — | Short but topic-scoped |
| Agent pages (9 sampled) | 43–223 | — | 4 of 9 are 43-word stubs (see below) |

Facet URLs I could find/guess (`?propertyType=studio`, `?maxPrice=100000`) render the **identical page** as the base Durrës listing (same title/H1/word count, no unique facet copy, no crawlable facet links were found in the Durrës page's outline) — filters appear to be client-side/query-string only, not indexable landing pages.

## Duplicate/templated content

- **Locale duplication is structural, not lazy**: the Durrës city page and homepage are independently translated per locale (different sentence structure, not machine-translation artifacts), but the copy is short enough in every locale that "translated" and "thin" are the same problem repeated 7×.
- **Property page duplicate-locale check** (`apartment-1-1-plazh-durres-42m2` in en/ru/de): confirmed the three locale versions are faithful translations of one source description — same facts, same order, same amenity bullet list ("Reliable internet connection…", "Climate control…", "Dedicated parking…"). These four boilerplate amenity bullets are **templated across at least 4 of the 6 sampled property pages** (`42m2`, `47m2`, `golem-62m2` all reuse near-identical "Enjoy open views…/Reliable internet…/Climate control…/Fully furnished…/Dedicated parking…" sentences) — this is generic-AI-filler pattern repeated per listing, sitting in front of a much shorter (~100–150 word) property-specific paragraph. Estimate: **most of the 6 sampled property pages carry only ~100–180 words of listing-specific unique description once the templated amenity bullets are subtracted — under the 150-word thin-content line for roughly half the sample.**
- **Guides index blocks (`/en/guides/buying`, `/en/guides/investment-albania`) open with a stray "Palm springs, CA" string** — looks like a leftover/mis-fed location token from a template or CMS field, a visible content-quality defect on two guide hub pages.

## "Agent" pages — answering the direct E-E-A-T question

Checked 9 of 9 listed agent URLs (`elena-krasniqi`, `drita-hoxha`, `arben-shala`, `olga-dervishi`, `genti-mema`, `findall`, `adrian`, `real-estate-al`, `fedir`). None are staff bio/profile pages. Each is simply a **pre-filtered property-listing view** titled "Properties by {Name}":
- No photo of the person anywhere — the full image list on every one of these pages is the site logo, hero coast photo, and property listing photos only. No headshot, stock or otherwise.
- No bio text, no credentials, no license number, no years-of-experience claim, no contact-method specific to that individual (same universal `+355 68 928 6136` / `hello@domlivo.com`).
- 4 of 9 (`olga-dervishi`, `findall`, `adrian`, `fedir`) currently have **zero active listings attributed** and render only a 43-word generic paragraph ("Domlivo helps you find property in Albania...") — i.e., near-empty pages.
- `findall` (title "Properties by FIND ALL PROPERTIES") and `real-estate-al` ("Properties by Real Estate AL") are plainly **agency/partner import accounts, not individuals** — consistent with the bulk `findall` partner-scraper import noted in project memory — yet are exposed in the same URL pattern as named "people," which is misleading if a visitor assumes these are Domlivo's own agents.
- Verdict: this is **not stock-photo placeholder personas**, it is an *absence* of any identity signal — worse for E-E-A-T than a stock photo would be, because there is nothing to fact-check or verify at all. Google's Sept 2025 QRG explicitly wants creator/author identifiability for YMYL-adjacent commercial content; real-estate transactions with foreign buyers plausibly qualify. This is a page-template gap, not a per-agent content problem, and should be fixed once (add name+bio+photo+license fields to the agent schema) rather than per page.

## Trust-signal inventory (site-wide, from 42 pages)

- Phone: one number, present identically everywhere via schema — real signal, but singular/generic (no named office line, no WhatsApp/agent-direct number visible in body copy).
- Email: `hello@domlivo.com`, found only on `/privacy` and `/terms`, not in the header/footer/contact-focused location on content pages sampled.
- Company/registration: **none found**. `/en/about` and `/en/contact` both return **404** — there is no dedicated About or Contact page on the site at all.
- Licence/accreditation claims: none found (the one `mentions_license_word: True` hit on `/en/terms` is boilerplate liability language, not a real estate licence claim).
- Reviews/testimonials: none found in the 42-page sample.
- Freshness: good — blog articles carry `datePublished`/`dateModified` in `Article` schema (e.g. `buying-apartment-durres-complete-guide`: published 2026-03-08, modified 2026-09-16), guides show visible "Updated: Aug 26, 2026" text, and district/info pages cite "2026-H1" / dated reference-price sources. This is a genuine strength.

## AI-content quality flags (Sept 2025 QRG)

- Property-listing amenity bullets are templated/generic across pages (see duplication section) — classic low-effort AI-listing pattern.
- Guide/blog prose (info pages, `durres-reference-prices-2026`, `can-foreigners-buy-real-estate-albania`) is specific, numeric, source-dated, and internally consistent — reads as edited/fact-checked, not raw LLM output, despite the anonymous "Domlivo Editorial" byline.
- The `/en/guides/buying` and `/en/guides/investment-albania` "Palm springs, CA" artifact and the `/en/privacy` `TODO(legal)` string are concrete, citable proof of unreviewed/unfinished content shipped to production — exactly the kind of "lack of quality control" signal the Sept 2025 QRG flags regardless of whether AI was involved.

## Commercial category-page gap: `/en/albania/durres` vs. a competitive real-estate category page

Present: listing count + price stat in hero ("358 listings · from €21,000 · median €1,416/m²"), a market-text paragraph, `BreadcrumbList`/`ItemList` schema, per-locale versions, links to district pages.
Missing versus a normal ranking real-estate category page:
- No FAQ block/schema on the city page itself (city `/durres` page ld_types = `BreadcrumbList, ItemList, ListItem` only; FAQ schema exists on `/durres/info` and district pages but not the money page).
- No visible/crawlable facet links (studio, near-sea, under-€100k, new-build) — filters are query-string only and return identical HTML/title/H1, so they add no indexable surface or unique copy.
- No map embed detected in extracted content.
- No recently-sold/price-history data (price stats are asking-price only, "median €1,416/m²" — no transaction history, no time series beyond the one point already on `/durres/info`).
- No agent/office contact block distinct from the universal phone number; no "talk to a local expert" CTA tied to a named, verifiable person.
- Only 198 words of unique market narrative — thinnest page in a category that should be the site's main money page for the "apartments for sale in Durrës" query.

## Top strengths
1. Locale-specific, non-machine-translated titles/H1/meta with the target keyword placed naturally for each market (e.g. `de/albania/durres` H1 "Wohnung kaufen in Durrës", `it` "Appartamenti e case in vendita a Durazzo") — good commercial-intent match across all 6 non-sq locales checked.
2. Freshness and specificity in district/info/blog content (dated reference prices, named zones, earthquake context) — genuinely useful, hard-to-fake market detail.
3. Structured data coverage is broad (Organization, WebSite, FAQPage, RealEstateListing/Offer/Product, Article, BreadcrumbList) across most page types, which is good for AI-citation readiness even where on-page trust signals are weak.

## Top weaknesses (ranked by impact)
1. **No About/Contact page (404 on both) and a `TODO(legal)` placeholder for the company's registered entity/address inside the live Privacy Policy** — `https://www.domlivo.com/en/privacy`. This is the single biggest trust gap on the site for a YMYL-adjacent, foreign-buyer marketplace.
2. **"Agent" pages carry no identity at all** (no photo, no bio, no license, 4/9 nearly empty) — `https://www.domlivo.com/en/agent/elena-krasniqi`, `.../drita-hoxha`, `.../findall`, `.../fedir`, etc. — while blog authorship is a generic "Domlivo Editorial" persona.
3. **The primary commercial page (`/en/albania/durres`) is the thinnest important page on the site** (~198 unique words vs. an 800-word category floor) and repeats across 6 locales at 180–218 words each, with no FAQ, no map, no crawlable facets, no price-history — directly undermines the stated ranking goal for "apartments for sale in Durres" and its translated equivalents.
4. **Templated amenity-bullet boilerplate on property pages** pushes several of the 6 sampled listings under ~150 words of listing-specific unique copy once boilerplate is subtracted (`apartment-1-1-plazh-durres-42m2`, `studio-plazh-durres-47m2`, `apartment-1-1-golem-durres-62m2`).
5. **Visible production defects** — "Palm springs, CA" stray string on `/en/guides/buying` and `/en/guides/investment-albania`; no H1 at all on `/en/privacy` and `/en/terms`.
