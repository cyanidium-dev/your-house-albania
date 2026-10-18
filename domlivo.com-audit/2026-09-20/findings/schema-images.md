# Domlivo — structured data and image SEO audit

Date: 2026-09-20. Scope: https://www.domlivo.com, EN locale plus one `de` and one `sq` spot check.
Method: curl (desktop Chrome UA, 1 req/s) + Python parsing of the raw server HTML — i.e. what Googlebot gets before rendering.
Budget used: 25 HTML pages, 7 sitemap/robots files, 13 image requests (one single `/api/og` request, one single `/_next/image` request).

Scores: **Schema 62 / 100** · **Images 47 / 100**

Pages sampled

| Key | URL |
|---|---|
| home | /en (and /sq) |
| city | /en/albania/durres |
| district (info) | /en/albania/durres/districts/plazh |
| district (listing) | /en/albania/durres/plazh |
| info | /en/albania/durres/info |
| prop1 | /en/property/apartment-1-1-plazh-durres-42m2 (+ /de/property/wohnung-1-1-plazh-durres-42m2) |
| prop2 | /en/property/apartment-2-1-plazh-durres-110m2-2 |
| prop3 | /en/property/house-city-center-vlore-109m2 |
| blog | /en/blog/durres-beach-vs-center |
| guide | /en/guides/apartment-durres |
| compare | /en/guides/golem-vs-plazh |
| contacts | /en/contacts (`/en/contact` and `/en/about` return 404 + noindex — there is no About page) |
| agent | /en/agent/findall |
| author | /en/blog/author/domlivo-editorial |
| credits | /en/image-credits |

---

## PART A — Structured data

All markup is JSON-LD, server-rendered, valid JSON on every page. No microdata/RDFa. Good baseline.

### A1. What each page emits

| Page | JSON-LD blocks | @types |
|---|---|---|
| home | 2 | `@graph`[Organization `#organization` (ImageObject logo, ContactPoint), WebSite `#website` (SearchAction)], FAQPage (10 Q) |
| city | 2 | BreadcrumbList (4), ItemList (24 ListItem: url, name, image) |
| district info | 3 | Place (+containedInPlace Place), BreadcrumbList (5), FAQPage (3 Q) |
| district listing | 2 | BreadcrumbList, ItemList |
| info | 2 | BreadcrumbList (3), FAQPage (11 Q) — **no Place/City** |
| prop1/2/3 | 2 | `@graph`[RealEstateListing `#listing`, Apartment/House `#accommodation` (PostalAddress, floorSize), Product `#product` (Offer, 4 × PropertyValue)], BreadcrumbList (6) |
| blog | 3 | Article (author Person, publisher Organization, WebPage), BreadcrumbList, FAQPage |
| guide | 3 | Article (author Organization, **no image**), BreadcrumbList, FAQPage |
| compare | 3 | Article (author Organization, image), BreadcrumbList, FAQPage |
| contacts | 1 | BreadcrumbList only |
| agent | 2 | BreadcrumbList, ItemList — **no RealEstateAgent / Person** |
| author | 1 | Person |
| credits | 1 | BreadcrumbList — **no ImageObject** despite the page holding licence + creator for 76 photos |

### A2. Errors and gaps, ranked

**S1 (high) — Placeholder telephone in the Organization node.**
Home JSON-LD: `"telephone": "+355 69 000 0000"` (comes from Sanity `siteSettings.phone`; the same value is in the RSC payload of every page). The number the site actually shows users is `WhatsApp +355 68 928 6136`. Structured data that contradicts visible content is a guideline violation and poisons the entity/NAP record. Fix the CMS value (one field) — the builder in `src/lib/seo/siteJsonLd.ts` already passes it through.

**S2 (high) — The Organization entity exists only on the home page and is thin.**
- Not emitted on contacts, agent, city, property or article pages. Articles re-declare a second, anonymous `Organization` (`"url": "https://www.domlivo.com"` — no `@id`, no trailing slash, differs from the home node `https://www.domlivo.com/`). Result: two unmerged Organization nodes across the site.
- Missing: `address` (at least `addressCountry: AL` + city), `areaServed`, `description`, `knowsLanguage`, and a second type (`RealEstateAgent`) — the site is a marketplace/agency, and a bare `Organization` gives Google nothing local to attach to.
- `logo` is `…-288x41.svg` — a 7:1 wordmark, 41 px tall. Google's logo guideline asks for at least 112×112 px; a wide wordmark gets cropped or ignored in the knowledge panel. Supply a square PNG (512×512) as `logo` and keep the wordmark as `image`.
- `sameAs`: `facebook.com/domlivo`, `instagram.com/domlivo`, `linkedin.com/company/domlivo` were not verified (not fetched, to stay in budget) — confirm each profile exists; `https://t.me/domlivobot` is a bot, not a profile, and belongs in `contactPoint.url`, not `sameAs`.

**S3 (high) — Property pages: no `geo`, weak `address`, no seller, no `inLanguage`.**
Verified on prop1, prop2, prop3, prop1-de. Present and correct: `price` (number), `priceCurrency: EUR`, `floorSize` (MTK), `numberOfRooms`, `numberOfBedrooms`, `numberOfBathroomsTotal`, `yearBuilt` (prop1 only), `datePosted`, image array (9/14/20 images), names and descriptions localised per locale (de verified).
Missing:
- `geo` (GeoCoordinates) on the Apartment/House — the page has a map, so coordinates exist. This is the single most useful missing property for a real-estate entity.
- `address`: only `addressLocality: "Plazh, Durres"` + `addressCountry`. District and city are jammed into one field. Use `addressLocality: "Durrës"`, `addressRegion: "Durrës County"`, and put the district in `containedInPlace`.
- `Offer.seller` / `offeredBy` (the agent or Domlivo `#organization`), `Offer.priceValidUntil`, `Offer.itemOffered` → `#accommodation`. Today Product, Apartment and RealEstateListing are three islands: only `RealEstateListing.mainEntity → #accommodation` links anything; `Product` is not connected to either.
- `RealEstateListing` has no `inLanguage`, `isPartOf` (#website), `dateModified`, `offers`, `provider`.
- Apartment lacks `image`, `description`, `url`, `amenityFeature` (sea view, balcony, lift, parking — exactly the terms the owner wants to rank for), `floorLevel`.
- `image` arrays point to the **un-transformed originals** (`…-2252x3282.jpg`, 1,214,537 bytes for prop1 image 1), not to the URL used in `<img>`. See I3.
- `Product` without `sku`/`brand` is valid, but because it carries an `Offer` with a price, Search Console will also evaluate it as a *Merchant listing* and raise non-critical warnings (`shippingDetails`, `hasMerchantReturnPolicy`). These are warnings, not errors; ignore them. Do not add fake reviews/ratings.

**S4 (medium) — `WebSite` node is contradictory across locales.**
`@id` is always `https://www.domlivo.com/#website`, but `url`, `inLanguage` and the SearchAction template change per locale (`/en`, `/sq` verified). Seven definitions of one `@id`. Either one node with `inLanguage: ["sq","en","uk","ru","it","pl","de"]` and `url: https://www.domlivo.com/`, or per-locale ids (`/#website-sq`). Note: the sitelinks search box was retired by Google in Nov 2024 — SearchAction is harmless but earns nothing.

**S5 (medium) — Breadcrumb trail is inconsistent and mislabelled.**
- Listing/property trail: `Home › Properties (/catalog) › Albania (/en/sale) › Durres › Plazh (/en/albania/durres/plazh)`. The item named "Albania" points to `/en/sale`, which is a deal-type page, not a country page.
- Info/district trail uses a different hierarchy: `Home › Cities › Durres (/info) › Districts › Plazh (/districts/plazh)`. So "Durres" and "Plazh" each resolve to two different URLs depending on the page. Both targets return 200 and self-canonicalise, so nothing is broken, but the two trails compete. Pick one: the commercial trail everywhere (city → district **listing** pages), and drop the `/sale` hop.
- City name spelling varies inside the same graph: "Durres" (breadcrumb, address) vs "Durrës" (H1, titles).

**S6 (medium) — Articles.**
- guide (`/en/guides/apartment-durres`): no `image` → no article thumbnail, not eligible for Discover. The page has a hero (`/images/albania/durres.jpg`); use it.
- blog: `author` is `Person` named "Domlivo Editorial" with `jobTitle: "Editorial team"`. A team is not a Person; Google's author guidance says use `Organization` for an organisation byline. Either switch the type to Organization (`@id: #organization`) or attribute to a real named person with `sameAs`. The author page repeats the same Person typing.
- blog `image` is a single 940×788 PNG. Google recommends ≥1200 px wide and 16:9 / 4:3 / 1:1 variants. With Sanity crops this is free.
- `publisher` has no `@id` (see S2). `datePublished` on guides is date-only (`2026-09-05`) while `dateModified` is a full timestamp; use full ISO timestamps with offset for both.
- `headline` lengths are fine (< 110 chars). `inLanguage` is present on all three article types.

**S7 (medium) — City info page has no Place/City node; district Place is minimal.**
`/en/albania/durres/info` is the natural entity home for "Durrës" and emits only Breadcrumb + FAQ. The district `Place` has name/url/description/image but no `geo`, no `address`, no `sameAs` (Wikidata/Wikipedia), and its parent is an untyped `Place` rather than `City`.

**S8 (low) — FAQPage on 7 of 12 sampled page types.**
FAQ rich results have been restricted to government/health sites since Aug 2023, and the current schema reference lists them as retired for all sites in May 2026. The markup is valid and the Q&As are visible on-page, so there is no penalty; keep it for LLM/AI-overview extraction, but expect no SERP feature and spend no more time on it.

**S9 (low) — ItemList on listing pages** has `url`, `name`, `image` per item — valid, but Google only renders list carousels for Recipe/Course/Movie/Restaurant detail types, so no rich result. The list itself lacks `name` and `url`. No `CollectionPage`/`WebPage` node with `inLanguage` exists on any listing page.

**S10 (low) — contacts / agent pages.**
contacts has only a breadcrumb: add `ContactPage` + a reference to `#organization`. Agent pages (9 in the sitemap) should carry `RealEstateAgent` (agency) or `Person` with `worksFor`, `telephone`, `areaServed`, `image` — these are the local entities that can actually earn a knowledge panel. Side note: `/en/contacts` is not in `sitemap-static.xml`.

**S11 (low) — No ImageObject / licence metadata anywhere.** See I8.

### A3. Rich-result eligibility (Google, Sept 2026)

| Page type | Eligible now | Blocked / missing |
|---|---|---|
| Property | **Breadcrumb**; **Product snippet** (price + availability line) — name + offers present | No review/rating (do not fake). Merchant-listing warnings expected. `RealEstateListing`/`Apartment` have no Google rich result — they are entity signals only, which is why `geo`/`address`/`amenityFeature` matter |
| City / district listing | Breadcrumb | ItemList carousel not available for real estate |
| Info / district info | Breadcrumb | FAQ rich result not available; no Place entity |
| Blog / compare | Breadcrumb; Article enhancements (headline, date, thumbnail) | image < 1200 px; author typing |
| Guide | Breadcrumb; Article without thumbnail | `image` missing |
| Home | Organization logo / knowledge panel signals | logo shape, placeholder phone, no address; sitelinks search box retired |
| Contacts / agent | Breadcrumb | No LocalBusiness/RealEstateAgent at all |
| Any page with photos | — | **"Licensable" badge in Google Images: not eligible** — no `ImageObject.license` + `acquireLicensePage` |

### A4. Ready-to-use JSON-LD

**(a) Site-wide Organization — emit in the locale layout on every page, identical in all locales**

```json
{
  "@context": "https://schema.org",
  "@type": ["Organization", "RealEstateAgent"],
  "@id": "https://www.domlivo.com/#organization",
  "name": "Domlivo",
  "url": "https://www.domlivo.com/",
  "description": "Real-estate marketplace for Albania: apartments, houses, villas and land for sale and rent in Durrës, Tirana, Vlorë and Sarandë.",
  "logo": {
    "@type": "ImageObject",
    "@id": "https://www.domlivo.com/#logo",
    "url": "https://www.domlivo.com/brand/domlivo-logo-512.png",
    "width": 512,
    "height": 512
  },
  "image": "https://cdn.sanity.io/images/g4aqp6ex/production/e53216911fc13bb8b1663896f632b4aa62bd0674-288x41.svg",
  "email": "hello@domlivo.com",
  "telephone": "+355689286136",
  "address": { "@type": "PostalAddress", "addressLocality": "Durrës", "addressCountry": "AL" },
  "areaServed": [
    { "@type": "Country", "name": "Albania" },
    { "@type": "City", "name": "Durrës" }
  ],
  "knowsLanguage": ["sq", "en", "uk", "ru", "it", "pl", "de"],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer support",
    "telephone": "+355689286136",
    "email": "hello@domlivo.com",
    "availableLanguage": ["en", "sq", "ru", "uk", "it", "de", "pl"]
  },
  "sameAs": [
    "https://www.facebook.com/domlivo",
    "https://www.instagram.com/domlivo",
    "https://www.linkedin.com/company/domlivo"
  ]
}
```
Before shipping: confirm the telephone and office locality, confirm each social profile exists, create the 512 px logo file (the path above does not exist yet). `RealEstateAgent` is a LocalBusiness subtype — only keep it if a real address can be published; otherwise stay with `Organization`.

**(b) WebSite — one definition**

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://www.domlivo.com/#website",
  "name": "Domlivo",
  "url": "https://www.domlivo.com/",
  "inLanguage": ["sq", "en", "uk", "ru", "it", "pl", "de"],
  "publisher": { "@id": "https://www.domlivo.com/#organization" }
}
```

**(c) Property page — connected graph** (values from prop1; `geo`, `floorLevel`, amenities and the vanity filename are placeholders to fill from the CMS)

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["WebPage", "RealEstateListing"],
      "@id": "https://www.domlivo.com/en/property/apartment-1-1-plazh-durres-42m2#listing",
      "url": "https://www.domlivo.com/en/property/apartment-1-1-plazh-durres-42m2",
      "name": "One-Bedroom Apartment 70 m from the Beach — Plazh, Durres",
      "inLanguage": "en",
      "isPartOf": { "@id": "https://www.domlivo.com/#website" },
      "datePosted": "2026-05-04T10:31:58Z",
      "dateModified": "2026-09-18T14:29:35Z",
      "primaryImageOfPage": { "@id": "https://www.domlivo.com/en/property/apartment-1-1-plazh-durres-42m2#image-1" },
      "mainEntity": { "@id": "https://www.domlivo.com/en/property/apartment-1-1-plazh-durres-42m2#accommodation" },
      "offers": { "@id": "https://www.domlivo.com/en/property/apartment-1-1-plazh-durres-42m2#offer" }
    },
    {
      "@type": "Apartment",
      "@id": "https://www.domlivo.com/en/property/apartment-1-1-plazh-durres-42m2#accommodation",
      "name": "One-Bedroom Apartment 70 m from the Beach — Plazh, Durres",
      "url": "https://www.domlivo.com/en/property/apartment-1-1-plazh-durres-42m2",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Durrës",
        "addressRegion": "Durrës County",
        "addressCountry": "AL"
      },
      "containedInPlace": {
        "@type": "Place",
        "name": "Plazh",
        "url": "https://www.domlivo.com/en/albania/durres/plazh"
      },
      "geo": { "@type": "GeoCoordinates", "latitude": 0.0, "longitude": 0.0 },
      "floorSize": { "@type": "QuantitativeValue", "value": 42, "unitCode": "MTK" },
      "floorLevel": "9",
      "numberOfRooms": 2,
      "numberOfBedrooms": 1,
      "numberOfBathroomsTotal": 1,
      "yearBuilt": 2019,
      "amenityFeature": [
        { "@type": "LocationFeatureSpecification", "name": "Distance to beach", "value": "70 m" },
        { "@type": "LocationFeatureSpecification", "name": "Sea view", "value": true }
      ],
      "image": [
        { "@id": "https://www.domlivo.com/en/property/apartment-1-1-plazh-durres-42m2#image-1" }
      ]
    },
    {
      "@type": "Product",
      "@id": "https://www.domlivo.com/en/property/apartment-1-1-plazh-durres-42m2#product",
      "name": "One-Bedroom Apartment 70 m from the Beach — Plazh, Durres",
      "category": "Apartments for sale",
      "isRelatedTo": { "@id": "https://www.domlivo.com/en/property/apartment-1-1-plazh-durres-42m2#accommodation" },
      "image": [
        "https://cdn.sanity.io/images/g4aqp6ex/production/2adb62343f6a00f3eed4ce4b72d48250b42e116e-2252x3282.jpg/apartment-plazh-durres-70m-from-beach-1.jpg?w=1600&q=75&auto=format&fit=max"
      ],
      "offers": {
        "@type": "Offer",
        "@id": "https://www.domlivo.com/en/property/apartment-1-1-plazh-durres-42m2#offer",
        "price": 78000,
        "priceCurrency": "EUR",
        "availability": "https://schema.org/InStock",
        "businessFunction": "http://purl.org/goodrelations/v1#Sell",
        "priceValidUntil": "2026-12-31",
        "url": "https://www.domlivo.com/en/property/apartment-1-1-plazh-durres-42m2",
        "itemOffered": { "@id": "https://www.domlivo.com/en/property/apartment-1-1-plazh-durres-42m2#accommodation" },
        "seller": { "@id": "https://www.domlivo.com/#organization" }
      }
    },
    {
      "@type": "ImageObject",
      "@id": "https://www.domlivo.com/en/property/apartment-1-1-plazh-durres-42m2#image-1",
      "contentUrl": "https://cdn.sanity.io/images/g4aqp6ex/production/2adb62343f6a00f3eed4ce4b72d48250b42e116e-2252x3282.jpg/apartment-plazh-durres-70m-from-beach-1.jpg?w=1600&q=75&auto=format&fit=max",
      "width": 1600,
      "height": 2332,
      "caption": "One-bedroom apartment 70 m from the beach in Plazh, Durrës",
      "representativeOfPage": true,
      "creditText": "Domlivo",
      "creator": { "@id": "https://www.domlivo.com/#organization" },
      "copyrightNotice": "© Domlivo and the listing agent",
      "license": "https://www.domlivo.com/en/terms",
      "acquireLicensePage": "https://www.domlivo.com/en/contacts"
    }
  ]
}
```
The `contentUrl` must be the same string as the `<img src>` (see I3). Only claim `license`/`creator` for photos Domlivo or its partner agents actually own, and only if the terms page really states the image licence. Never ship `geo` with zeros — omit the property when coordinates are unknown.

**(d) City info page — entity node**

```json
{
  "@context": "https://schema.org",
  "@type": "City",
  "@id": "https://www.domlivo.com/en/albania/durres/info#place",
  "name": "Durrës",
  "alternateName": ["Durres", "Durazzo"],
  "url": "https://www.domlivo.com/en/albania/durres/info",
  "sameAs": ["https://en.wikipedia.org/wiki/Durr%C3%ABs"],
  "geo": { "@type": "GeoCoordinates", "latitude": 41.3231, "longitude": 19.4414 },
  "containedInPlace": { "@type": "Country", "name": "Albania" },
  "image": "https://www.domlivo.com/images/albania/durres.jpg"
}
```
Add the Wikidata URL to `sameAs` after looking up the id. District pages: same shape with `@type: Place`, own `geo`, `containedInPlace: {"@id": ".../durres/info#place"}`.

**(e) Article — publisher/author by reference, multi-ratio images**

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "@id": "https://www.domlivo.com/en/blog/durres-beach-vs-center#article",
  "headline": "Durrës Beach or City Centre: Where's Actually Better to Live?",
  "inLanguage": "en",
  "datePublished": "2026-03-20T11:45:22Z",
  "dateModified": "2026-09-16T15:29:50Z",
  "mainEntityOfPage": "https://www.domlivo.com/en/blog/durres-beach-vs-center",
  "isPartOf": { "@id": "https://www.domlivo.com/#website" },
  "author": { "@id": "https://www.domlivo.com/#organization" },
  "publisher": { "@id": "https://www.domlivo.com/#organization" },
  "image": [
    "https://cdn.sanity.io/images/g4aqp6ex/production/ASSET-WxH.jpg/durres-beach-vs-centre.jpg?w=1200&h=675&fit=crop&auto=format",
    "https://cdn.sanity.io/images/g4aqp6ex/production/ASSET-WxH.jpg/durres-beach-vs-centre.jpg?w=1200&h=900&fit=crop&auto=format",
    "https://cdn.sanity.io/images/g4aqp6ex/production/ASSET-WxH.jpg/durres-beach-vs-centre.jpg?w=1200&h=1200&fit=crop&auto=format"
  ]
}
```
(The current blog hero source is only 940 px wide; upload a ≥1200 px source, Sanity does not upscale with `fit=max`.)

**(f) Licensed stock photos (image-credits page and wherever those photos are used)**

```json
{
  "@context": "https://schema.org",
  "@type": "ImageObject",
  "contentUrl": "https://cdn.sanity.io/images/g4aqp6ex/production/ASSET-1920x1440.jpg/shkembi-i-kavajes-beach.jpg?w=1600&q=75&auto=format&fit=max",
  "caption": "Bathers at Shkëmbi i Kavajës beach below the rock",
  "creator": { "@type": "Person", "name": "Pasztilla aka Attila Terbócs" },
  "creditText": "Pasztilla aka Attila Terbócs / Wikimedia Commons",
  "copyrightNotice": "Pasztilla aka Attila Terbócs",
  "license": "https://creativecommons.org/licenses/by-sa/4.0/",
  "acquireLicensePage": "https://www.domlivo.com/en/image-credits"
}
```

---

## PART B — Images

### B1. Inventory (raw HTML)

| Page | `<img>` | alt ok / empty / missing | distinct alts | srcset | sizes | lazy | fetchpriority=high | preload as=image | figcaption | Sanity assets in `<img>` vs anywhere in HTML |
|---|---|---|---|---|---|---|---|---|---|---|
| home | 44 | 42 / 2 / 0 | 25 | 42 | 40 | 43 | 1 | 1 | 0 | 35 / 255 |
| city | 51 | 51 / 0 / 0 | 26 | 51 | 49 | 50 | 1 | 1 | 0 | 49 / 211 |
| district info | 38 | 38 / 0 / 0 | 21 | 38 | 36 | 37 | 1 | 1 | 0 | 33 / 122 |
| info | 63 | 63 / 0 / 0 | 36 | 63 | 61 | 62 | 1 | 1 | 0 | 59 / 221 |
| prop1 | 35 | 35 / 0 / 0 | 11 | 34 | 32 | 33 | **2** | **2** | 0 | 26 / 82 |
| blog | 12 | 12 / 0 / 0 | 5 | 12 | 4 | 11 | 0 | 1 | 0 | 11 / 33 |
| guide | 30 | 30 / 0 / 0 | 17 | 30 | 28 | 29 | 1 | 1 | 0 | 28 / 124 |
| compare | 12 | 12 / 0 / 0 | 7 | 12 | 10 | 11 | 1 | 1 | 0 | 7 / 7 |
| contacts | 3 | 3 / 0 / 0 | 2 | 3 | 1 | 2 | 0 | 1 | 0 | 1 / 1 |
| agent | 47 | 47 / 0 / 0 | 26 | 47 | 45 | 46 | 1 | 1 | 0 | 44 / 275 |
| credits | 78 | 2 / 76 / 0 | 2 | 78 | 76 | 78 | 0 | 0 | 0 | 76 / 76 |

("anywhere in HTML" counts assets referenced only in the RSC/JSON payload — card sliders and later pages — which are not `<img>` and not crawlable as images.)

Technical delivery is good: every content image has `srcset`; the hero has `fetchpriority="high"` plus a matching `<link rel="preload" imagesrcset>`; everything else is `loading="lazy" decoding="async"`; `fill` images sit in aspect-ratio boxes (no CLS), fixed images carry `width`/`height`; Sanity `auto=format` serves AVIF/WebP, so no `<picture>` is needed. **The delivery layer is not the problem — discoverability, naming and text signals are.**

### B2. Byte sizes measured

| Image | URL variant | Accept | Type | Bytes |
|---|---|---|---|---|
| Home hero (3840×2318 source) | `?w=1920&q=72&auto=format` | avif | image/avif | 193,166 |
| prop1 photo 1 | `?w=2560&q=72…` — this is the `<img src>` | avif,webp | image/webp | **643,634** |
| prop1 photo 1 | same URL | `*/*` (no modern formats) | image/jpeg | **979,079** |
| prop1 photo 1 | `?w=1080…` | avif,webp | image/webp | 186,188 |
| prop1 thumb | `?w=640…` | avif,webp | image/webp | 21,668 |
| prop1 photo 1 | **no params — the URL in JSON-LD and ItemList** | — | image/jpeg | **1,214,537** |
| blog hero (940×788 PNG source) | `?w=1920&q=100…` | avif,webp | image/webp | 367,364 |
| city/info/guide hero | `/_next/image?url=/images/albania/durres.jpg&w=1080&q=75` | avif | image/avif | 69,776 (source JPEG 594,129) |
| og:image prop1 | `/api/og?kind=property…` | — | image/png 1200×630 | **1,242,920**, 5.0 s, `X-Vercel-Cache: MISS`, `Cache-Control: public, max-age=3600` |

Notes: Sanity returned WebP rather than AVIF for the portrait listing photo even with `Accept: image/avif` (AVIF for the home hero) — not controllable, not worth chasing. Delivered files carry no EXIF/IPTC/XMP (checked the original's first 192 KB, the transformed JPEG, the AVIF and the OG PNG), so licence/creator can only be conveyed through structured data.

### B3. Findings ranked by impact on Google Images

**I1 (critical) — Gallery alt text is in the wrong language and identical on every photo.**
`PropertyGallery` uses `img.alt ?? localisedFallback` (`src/components/Properties/PropertyGallery/index.tsx:116`); the Sanity `alt` is a single non-localised string copied from the listing's original-language title, so it always wins:

| Page | H1 | alt on every gallery `<img>` |
|---|---|---|
| /en/property/apartment-1-1-plazh-durres-42m2 | One-Bedroom Apartment 70 m from the Beach — Plazh, Durres | `Квартиры 1+1 у моря \| 70 м до пляжа` ×16 |
| /de/property/wohnung-1-1-plazh-durres-42m2 | 1+1-Wohnung 70 m vom Strand — Plazh, Durrës | the same Russian string ×16 |
| /en/property/apartment-2-1-plazh-durres-110m2-2 | 2+1 apartment with two bathrooms, third line from the sea, Plazh | `Shitet Apartament 2+1+2 \| Plazh, Durrës (Vija e 3-të)` on all |
| /en/property/house-city-center-vlore-109m2 | House for Sale in Vlore — 109 m², 3 km from the Sea | `Дома во ВЛЕРЕ` on all |

Alt is the strongest on-page text signal Google Images has. On EN/DE/IT/PL pages the property photos are described by a Russian or Albanian phrase; no photo says "sea view", "balcony", "kitchen" or "Durrës". Nine to twenty images per listing share one string, so none is distinguishable.
Fix: never use the CMS alt unless it is localised. Generate per locale: `{type} {rooms} in {district}, {city} — {room/feature label}`, e.g. "1+1 apartment in Plazh, Durrës, 70 m from the beach — balcony with sea view". Cheap first step: `"{localised title} — photo {n} of {total}"`. The real gain comes from a per-image `label` enum in Sanity (sea view / living room / kitchen / bedroom / bathroom / balcony / building exterior / floor plan), filled once per listing (manually or by a vision model) and translated through `messages/*.json`.

**I2 (critical) — No image sitemap.**
0 `<image:image>` tags in sitemap-properties (2,625 URLs), -blog (210), -districts (399), -landings (184), -static (147), -knowledge (7); the `xmlns:image` namespace is not declared. For a site with DR 0 and images on a third-party host, the image sitemap is the main discovery path for Googlebot-Image. The data is already queried for JSON-LD. Add up to ~10 `<image:image><image:loc>` per property URL, using exactly the same URL string as `<img src>` (I3). Cross-host image URLs are allowed in image sitemaps. Vercel cost: none beyond the existing sitemap route (already cached 3600 s).

```xml
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>https://www.domlivo.com/en/property/apartment-1-1-plazh-durres-42m2</loc>
    <lastmod>2026-09-18T14:29:35.000Z</lastmod>
    <image:image>
      <image:loc>https://cdn.sanity.io/images/g4aqp6ex/production/2adb62343f6a00f3eed4ce4b72d48250b42e116e-2252x3282.jpg/apartment-plazh-durres-70m-from-beach-1.jpg?w=1600&amp;q=75&amp;auto=format&amp;fit=max</image:loc>
    </image:image>
  </url>
</urlset>
```

**I3 (high) — Every photo is exposed under many URLs on a foreign host, with a hash for a name.**
- Canonical image URL Google will index today: `https://cdn.sanity.io/images/g4aqp6ex/production/2adb62343f6a00f3eed4ce4b72d48250b42e116e-2252x3282.jpg?w=2560&q=72&auto=format&fit=max` (the `src`). Host `cdn.sanity.io`, filename = SHA-1. Zero keyword value in the URL.
- The same asset also appears as 8 srcset widths in 2–3 `sizes` contexts, as the parameter-less original in `RealEstateListing.image` and `Product.image`, and in `ItemList.image` on every listing page. Google dedupes by pixels, but alt, host page and structured data are attached to URL strings that never match each other.
- `src` is `w=2560` for every image including 72-px thumbnails and card images — crawlers that ignore `srcset` pull 0.64–0.98 MB per photo.
Fix (free, no Vercel traffic): Sanity **vanity filenames** — append a slug after the asset path: `…/2adb6234…-2252x3282.jpg/apartment-plazh-durres-sea-view-1.jpg?w=1600&q=75&auto=format&fit=max`. Use one fixed canonical variant (w=1600) as `src`, in JSON-LD `image`/`contentUrl`, in `ItemList.image`, in the image sitemap and as the photo source for `og:image`; keep `srcset` for browsers. `cdn.sanity.io/robots.txt` allows image crawling (only `*.pdf` is disallowed), so the host is fine. Do **not** proxy images through domlivo.com on the Hobby plan.

**I4 (high) — `og:image` is disallowed for Googlebot and is heavy.**
`robots.txt` has `User-agent: * / Disallow: /api/`; every page's `og:image`/`twitter:image` is `https://www.domlivo.com/api/og?...`. Social bots are explicitly allowed, Googlebot is not, so Google cannot use the declared primary image as a thumbnail hint (Search, Discover). The card itself is correct: 1200×630, `og:image:width/height/alt` present, `twitter:card=summary_large_image`, rendering verified (photo + price + rooms + area + logo). Problems: 1.24 MB PNG (messenger previews degrade above ~300–600 KB), 5 s cold render, `Cache-Control: public, max-age=3600` without `s-maxage` → re-rendered by the function when the hour expires, which costs CPU quota. The `slug` parameter still carries the legacy Russian slug (`prodazha-kvartiry-11-u-morya-…`) — harmless, but it leaks.
Fix: add `Allow: /api/og` under `User-agent: *` (longer rule wins); output JPEG at ~150 KB; `Cache-Control: public, max-age=86400, s-maxage=31536000, immutable`, busting through the existing `v=` param. Optionally add a second, plain-photo `og:image` (`…/vanity.jpg?w=1200&h=630&fit=crop&auto=format`) so Google has an unblocked, unbranded candidate at zero Vercel cost.

**I5 (high) — No `max-image-preview:large`.**
No `<meta name="robots">` on home, city, district, info, property, blog, guide, compare, agent (only contacts emits `index, follow`), and no `X-Robots-Tag` header. Without `max-image-preview:large` Google may limit itself to small thumbnails, and pages are ineligible for large Discover cards. Add to the root metadata: `robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } }` — without overriding the pages that set `noindex`.

**I6 (medium) — No captions, no descriptive text next to photos.**
0 `<figcaption>` on all 11 pages; 1 `<figure>` in total. Gallery images sit inside `<button aria-label="Open image 3">` — the nearest text to each photo is "Open image N". The listing description is good and relevant, but nothing ties a specific photo to "sea view" or "balcony". With the per-image label from I1, render it as a small or visually-hidden `<figcaption>` in the thumbnail strip and lightbox. On compare/blog pages add real captions (the alts there are already good: "The palm-lined promenade along Golem beach").

**I7 (medium) — Crawlability of galleries: good, with caveats.**
All JSON-LD gallery images are present as `<img>` in the raw HTML (prop1 9/9, prop2 14/14, prop3 20/20) through the thumbnail strip, so Googlebot-Image does not depend on JS. Caveats: (a) only two slides render at full size, the rest are declared `sizes="…72px"` — harmless because `src` is large; (b) there is no `<a href>` to a full-size image, which is fine; (c) on listing pages only 2 of 51 card images are inside an `<a>` — the card link is an overlay anchor with `aria-label`. Google Images therefore credits the *listing* page as host page for card photos; the property page gets credit only from its own gallery. Acceptable; wrap the card image in the anchor if cheap. (d) Card sliders beyond the first two photos exist only in the RSC payload.

**I8 (medium) — No licence metadata.**
No `ImageObject` with `license`/`acquireLicensePage`/`creator`/`creditText` anywhere, and delivered files have no IPTC. `/en/image-credits` already holds photographer + licence + source for 76 CC photos — but as 76 images with `alt=""` and no structured data. Give those images their description as alt and emit snippet (f) for each; on property pages emit the ImageObject from (c) for at least the first photo. This enables the "Licensable" badge and is a rare differentiator in this niche.

**I9 (medium) — Generic and duplicate alts outside galleries.**
- `Blog post image` ×3–5 on home, district, info, blog (blog cards) → use the post title.
- `vector` on `/images/properties/vector.svg` (decorative → `alt=""`).
- Listing cards render 2 photos each, both with the listing title as alt (acceptable; append "— photo 2").
- Listing titles that become alts are sometimes weak: "Cosy apartment 1+1 by the sea", "Apartment by the sea, 61 m²" (no place name). Titles with district + city make better alts *and* better SERP titles.
- Good examples worth copying: home hero "Himarë on the Ionian coast of Albania, seen over the beach and the sea"; card "Front-line 1+1 apartment with a panoramic sea view, Plazh"; the compare-page alts.

**I10 (low) — Same stock hero on three Durrës pages.**
`/images/albania/durres.jpg` ("The beach at Durrës") is the LCP hero on city, info and guide pages, served through `/_next/image` (consumes the Vercel image-optimisation quota; response `Cache-Control: public, max-age=0, must-revalidate`, `Content-Disposition: attachment; filename="durres.avif"` — normal Next behaviour, not a blocker; `/_next/image` is not disallowed in robots.txt). One image cannot rank for three pages; give each page a distinct, descriptively named photo, ideally from Sanity so the optimiser quota is untouched.

**I11 (low) — Performance nits.**
- Property page: two `fetchpriority="high"` images + two preloads for the same asset (mobile and desktop gallery variants, de-duplicated with a `1px` sizes trick). On desktop the hidden mobile variant still fetches its smallest candidate (640w) at high priority. Keep one priority image, or scope the preloads with `media`.
- Blog hero: `q=100` and `w=1920` on a 940-px PNG source → 367 KB. Use `q=75`; never request above intrinsic width.
- Header logo is `loading="lazy"` above the fold (tiny SVG; make it eager).
- `src` fallback `w=2560` everywhere — set the loader's default `src` to 1600.

**I12 (info) — robots.txt.**
Nothing blocks `Googlebot-Image`. `GoogleOther-Image` is disallowed (Google's non-Search fetcher; no ranking effect). `/_next/` is open. The only image-relevant block is `/api/` (I4).

### B4. Why these photos do not rank for "apartment durres sea view"

1. The photos say nothing in English (or German, Italian, Polish): alt is one Russian/Albanian string repeated on every image (I1), filenames are SHA-1 hashes on cdn.sanity.io (I3), there are no captions (I6).
2. Google is never told the photos exist: no image sitemap (I2), and the declared primary image is robots-blocked (I4).
3. Signals are diluted: ten-plus URLs per asset, and structured data points to a different URL than the `<img>` (I3).
4. Large previews are not opted into (I5), so even a ranking image gets a small thumbnail.
5. Site authority is near zero (DR 0 per the SEO baseline) — image rankings follow page rankings, so the listing and landing pages must rank first. The fixes above remove the self-inflicted part.
6. No host page targets the image-intent query itself: a "sea view apartments in Durrës" facet page with a photo-led grid, descriptive alts and captions is the natural landing page for those image results.

### B5. Fix list (in order)

| # | Fix | Where | Effort | Vercel cost |
|---|---|---|---|---|
| 1 | Localised, per-photo alt; stop using the non-localised CMS alt | `src/components/Properties/PropertyGallery/index.tsx` (`imgAlt`), card components, `messages/*.json` | S | none |
| 2 | `max-image-preview:large` in root metadata | `src/app/[locale]/layout.tsx` | XS | none |
| 3 | `Allow: /api/og` for `*`; OG as JPEG ≤200 KB; `s-maxage=31536000, immutable` | robots route, `/api/og` | S | **reduces** CPU |
| 4 | Image sitemap entries in sitemap-properties / -blog / -landings / -districts | sitemap routes | S | none (same cache) |
| 5 | Sanity vanity filenames + one canonical variant (w=1600) shared by `src`, JSON-LD, ItemList, sitemap | Sanity image loader, JSON-LD builders | M | none |
| 6 | Fix Organization (real phone, address, areaServed, square logo) and emit it site-wide by `@id`; reference it from Article/Offer | `src/lib/seo/siteJsonLd.ts`, layout, Sanity siteSettings | S | none |
| 7 | Property graph: `geo`, split address, `amenityFeature`, `seller`, `inLanguage`, connect Product ↔ Apartment ↔ Listing, `ImageObject` for first photo | property page JSON-LD builder | M | none |
| 8 | `City`/`Place` node with `geo` + `sameAs` on info and district pages | info/district pages | S | none |
| 9 | Article: image on guides, ≥1200-px multi-ratio images, author typed as Organization or a real person | article JSON-LD builder | S | none |
| 10 | Per-image label field in Sanity → alt + figcaption; captions in blog/compare | Studio schema + gallery | M | none |
| 11 | ImageObject licence markup + real alts on `/image-credits` | that page | S | none |
| 12 | Breadcrumb hierarchy: one trail, drop the "Albania → /sale" hop, consistent "Durrës" | breadcrumb builder | S | none |
| 13 | Distinct heroes per Durrës page, hosted in Sanity; blog hero `q=75`; single priority image on property page | components | S | reduces optimiser usage |
| 14 | "Sea view apartments in Durrës" photo-led facet page (check the SEO page registry evidence first) | `src/lib/seo/pages` | M | none |

### Scoring rationale

Schema 62: valid JSON-LD everywhere, sensible `@id` graph on property pages, price/currency/area/rooms correct, localised per locale, breadcrumbs on every page, Article dates and `inLanguage` present (+). Placeholder phone, Organization only on home and duplicated anonymously in articles, no geo/seller/inLanguage on listings, no Place on city pages, no entity on contacts/agent pages, no ImageObject licensing, conflicting WebSite node, guide without image (−).

Images 47: modern formats, srcset/sizes everywhere, correct LCP priority + preload, no CLS, all gallery images in server HTML, working 1200×630 cards with alt (+). Wrong-language duplicated alts on all listing galleries, no image sitemap, hash filenames on a third-party host with many URL variants, og:image blocked for Googlebot and 1.2 MB, no `max-image-preview:large`, no captions, no licence metadata, oversized `src` fallback (−).
