# Current SEO architecture (audit, 2026-09-17)

Snapshot of how domlivo.com decides what exists, what is indexed and how pages link, taken **before** the SEO page registry (see [README](README.md), [ADR 001](decisions/001-seo-page-registry.md)). Where the registry changed behaviour, the change is noted inline as **→ changed**.

## Stack

| Layer | What |
|---|---|
| Frontend | Next.js ^15.5 App Router, React 19, next-intl ^4.8 (this repo, `your-house-albania`) |
| CMS / database | Sanity (`domlivo-admin` repo holds schemas and data scripts). No SQL database, no ORM: GROQ queries in `src/lib/sanity/queries/*` |
| Cache | `sanityCache()` (`queries/_core.ts`) wraps `unstable_cache` with per-type tags; `/api/revalidate/sanity` purges tags on publish and pings IndexNow |
| Rendering | ISR (`revalidate = 3600` + empty `generateStaticParams`) for property, blog, guide, city info, district pages; listings are dynamic (read `searchParams`) |
| Locales | `en uk ru sq it pl de`, default `sq`, prefix always (`src/i18n/routing.ts`) |
| Indexing switch | `NEXT_PUBLIC_ENABLE_INDEXING=true` (`src/lib/seo/envSeo.ts`); off → noindex, empty sitemaps |

## Data model (Sanity, `domlivo-admin/schemaTypes`)

`property` — fields that exist and matter for SEO:

| Field | Notes |
|---|---|
| `status` | deal type: `sale`, `rent`, `short-term`. Only `sale` is public (`PUBLIC_DEAL_TYPES`) |
| `isPublished`, `lifecycleStatus` | `draft active reserved sold rented archived`; public = published and active/undefined |
| `city` (ref, required), `district` (ref) | country comes from `city → country`; there is no property-level country |
| `type` (ref → `propertyType`) | slugs in use: apartment, studio, penthouse, house, villa, land, commercial-space, office |
| `price` (EUR), `priceUnit` | `total` or `per-sqm`; no currency field; price/m² is derived |
| `area`, `plotArea`, `bedrooms`, `rooms`, `bathrooms` | |
| `yearBuilt`, `constructionStage`, `handoverYear/Quarter` | stage `off-plan under-construction completed` (no separate new-build flag) |
| `seaDistanceMeters`, `beachfront` | filled from listing text by `scripts/enrichSeaData.ts` |
| `amenitiesRefs` | sea view is the `sea-view` amenity; no boolean |
| `coordinatesLat/Lng`, `locationPrecision` | |
| `developer`, `agent`, `investment`, `promoted` | |
| **Not present** | floor, total floors, currency, updatedAt field (only `_updatedAt`), country |

Taxonomy: `country` (title, slug, code), `city` (→country, isPublished, sqDeclension, descriptions, FAQ, seo), `district` (→city, isPublished, descriptions, FAQ, seo; no coordinates), `propertyType`, `amenity`, `developer` (tier rating), `agent`. Market data: `zoneMetrics` (price ranges/medians, rents, yields, reference prices, sources, confidence). SEO copy: `catalogSeoPage` (scopes `propertiesRoot`, `city`, `district` — no type dimension). Editorial pages: `landingPage` (`home cityIndex city district custom unique investment`), `blogPost`.

## Routes

| URL | Renders | Index decision (before registry) |
|---|---|---|
| `/{l}/{country}/{city}` | city listing | noindex only when empty (`EMPTY_CITY_LISTING_NOINDEX_MAX = 0`) **→ changed** |
| `/{l}/{country}/{city}/{district}` | district listing | noindex ≤ 9 listings **→ changed** |
| `/{l}/{country}/{city}[/{district}]/{facet}` | facet listing (`1-1 2-1 3-1 under-80k under-100k new-builds near-the-sea`) | noindex ≤ 9 **→ changed** |
| `/{l}/{country}/{city}/sale/{type}` | city+type listing | noindex ≤ 15, city-level count even on district pages **→ changed** |
| `/{l}/{country}/{city}/{type}` | type-only listing, same inventory as `/sale/{type}` | indexable, no threshold (duplicate) **→ 308 to `/sale/{type}`** |
| `/{l}/{city}/sale[/{type}]` | omit-country listing | self-canonical, indexable (duplicate) **→ 308 to full geo** |
| `/{l}/{country}/{city}/sale` | sole-deal duplicate | 308 → city listing (since 2026-09-15) |
| `/{l}/{country}/{city}/info` | city landing (CMS) | CMS `seo.noIndex` |
| `/{l}/{country}/{city}/districts/{d}` | district landing (CMS) | CMS `seo.noIndex` |
| `/{l}/guides/{slug}` | custom landing (comparisons, type×city guides, PL cluster) | CMS `seo.noIndex`, `landingPage.locales` |
| `/{l}/blog/{slug}` | blog post | CMS `seo.noIndex` |
| `/{l}/property/{slug}` | property detail | CMS `seo.noIndex`; non-public → 404 |
| `/{l}/sale[/{type}]` | national listing | type noindex ≤ 15 |
| `/{l}/catalog` | query catalog | always noindex |
| `/{l}/agent/{a}/{country}/{city}/…` | agent listings | indexable, no threshold, no sitemap **→ noindex** |
| `/{l}/investment/new-builds` | national new builds | indexable, not in any sitemap |

Pagination: `?page=N`, page 2+ noindex,follow with canonical to page 1. Any query string noindexes a listing.

## Indexability: where decisions were made

Thresholds lived in one file (`src/lib/seo/listingIndexPolicy.ts`: 15 / 9 / 9 / 0) but were **applied** separately in the listing route (`[country]/[city]/[[...filters]]/page.tsx`), `catalogListingMetadata.ts`, `ListingFacetNav.tsx` and `queries/sitemap.ts`, each with its own counting query. Known drift before the registry: facet pages ignored `catalogSeoPage.noIndex`; the city sitemap used `city.seo.noIndex` while the route used `catalogSeoPage.noIndex`; district+type pages were indexable but absent from sitemaps; `staticSitemapFilters.test.ts` re-implemented its predicate and was stale. No rule anywhere required search demand.

## Metadata, canonical, hreflang

- Listing titles: `src/lib/seo/listingSeoCopy.ts` (`buildCityListingSeo`, `buildCityDistrictListingSeo`, `buildCityTypeListingSeo`, `buildFacetListingSeo`) with messages `Seo.listing.*` in all 7 locales; CMS `catalogSeoPage` wins where written in the locale.
- Landings: `buildLandingMetadata` (`src/lib/sanity/landingSeoAdapter.ts`); property: `buildPropertyMetadata` (`composePropertyMetaTitle`: type, area, district, city — €price); blog: `buildBlogMetadata`.
- Canonical: path without query on every family; CMS `seo.canonicalUrl` override for landings.
- Hreflang: `buildHreflangAlternates` (`src/lib/seo/hreflang.ts`), all 7 locales + `x-default` (en); `landingPage.locales` narrows guides; `PARTIAL_LOCALE_PATHS` gate (empty since German completed).

## Sitemaps (`src/app/sitemap*.xml`)

`static`, `cities`, `types` (city+type, district, facet), `non-geo-listings`, `properties`, `blog`, `landings`, `districts`. All generated from Sanity on a 1-hour revalidate; no manual URL lists. Before the registry `sitemap-types` and `sitemap-cities` re-implemented the route thresholds **→ both now read the registry decision**.

## Structured data

Organization/WebSite (home), BreadcrumbList (every breadcrumb component), RealEstateListing + Apartment/House + Offer (property), ItemList (listing grids, districts hub), FAQPage (landings, blog; one per page), Article (blog, guides), Person (author), Place (district page).

## Internal linking

Data-driven: `ListingFacetNav` (district and facet chips with live counts), `ListingPlaceInfoLink`, `relatedPagesAutoSection` (topic tags), footer cities, similar properties, `PropertyMarketPositionSection`. Hard-coded: `BLOG_POST_LISTING_TOPICS`, nav/footer fixed links (`/investment/sale` is noindex), property-type cards → `/{type}` (noindex one-segment page).

## Duplicate-content risks found

1. Type-only geo URL duplicating `/sale/{type}` — **fixed (308)**.
2. Omit-country listings duplicating full geo — **fixed (308)**.
3. Agent geo listings indexable subsets — **fixed (noindex)**.
4. City listing vs `/info`, district listing vs `/districts/{d}`, `/guides/{type}-{city}` vs `/sale/{type}` — different page types; resolved by the cluster → URL map in [keyword-research.md](keyword-research.md), not by merging.
5. Breadcrumb "Properties" → `/catalog` (noindex) on every listing — roadmap.
6. English fallback content indexed under other locales for blog/property/district — roadmap (locale gate exists).
7. Apex `domlivo.com` answers 307 to `www` (Vercel setting, not code) — needs 308.
