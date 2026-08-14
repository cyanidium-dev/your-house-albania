> Canonical audit snapshot (2026-05-31). Superseded in part by July 2026 feature work (guides, districts, calculators, trackers, developers, rentals hiding) and the 2026-08-14 workspace audit. Live backlog: workspace docs/engineering/BACKLOG.md.

# Domlyva Technical Audit

> **Audited:** 2026-05-31 · **Scope:** `your-house-albania` (Next.js 15 App Router frontend). Sanity Studio/schemas live in a **separate repo** — the schema boundary here is `src/lib/sanity/*Adapter.ts`.
> **Method:** source of truth is the **current code only**. Prior audit markdown files were ignored. Every claim below is anchored to a real `file:line`. This document changes no code.
> **Stack:** Next.js 15.2.8 (App Router, React 19) · Sanity CMS (`@sanity/client`, GROQ, `unstable_cache` + tags) · next-intl 4 (locales `en/uk/ru/sq/it`, default `sq`) · TypeScript strict · Tailwind v4.

---

## 1. Executive Summary

The project is a **well-factored single-tenant** real-estate site. The core that the business actually uses — catalog, property detail, blog, city/deal landings, SEO, the Sanity query/adapter layer, the landing editor — is mature: cached fetchers with tag-based revalidation (`src/lib/sanity/queries/_core.ts:54`), a real SEO system (per-page metadata, hreflang, JSON-LD, index policy), signed editor sessions with a dedicated secret (`src/features/editor/auth/signCookie.ts:13`), and validated API routes.

The damage is concentrated in a **template-leftover island** that was never deleted: four orphan category pages rendering hardcoded mock data through a dead `src/data/*` → `src/app/api/*.tsx` chain, a dead `Auth/*` sign-in cluster with hardcoded `admin/admin123`, a dead donation context, and a handful of dead dependencies. None of it is wired into the live nav, but it ships in the repo, pollutes routing/SEO, and is exactly the kind of AI/template residue you asked to find.

Two genuinely large concerns for the stated SaaS goal: (a) the data layer is **single-dataset, single-siteSettings, single-password** with no tenant primitive anywhere (SaaS-readiness ≈ **8/100**), and (b) `src/lib/sanity/queries/catalog.ts` (790 lines) is a **god-file** mixing filters + projections + fetchers + SEO resolution, with the property-card GROQ projection copy-pasted across ~6 query files.

**Top priorities:** delete the template island (high ROI, low risk) → fix SEO index-bloat from orphan/thin pages → split `catalog.ts` and extract shared GROQ fragments → localize/remove the `Auth/*` cluster → then plan the multi-tenant rebuild.

---

## 2. Critical Problems

There are **no CRITICAL security holes** (no exposed tokens, no unauth writes, editor auth is sound). "Critical" here = highest-risk correctness/maintainability items.

| # | Problem | Evidence | Why it matters |
|---|---|---|---|
| C1 | **Hardcoded credentials in repo** | `src/components/Auth/SignIn/index.tsx` `useState("admin")/("admin123")` defaults | Even though the component is unmounted/dead, shipping `admin/admin123` in source is a bad smell and a copy-paste hazard. |
| C2 | **God-file `catalog.ts` (790 lines)** mixing 6 concerns | `src/lib/sanity/queries/catalog.ts:46-789` | Hardest file to change safely; central to the product. |
| C3 | **Thin/duplicate pages are indexable & sitemap-orphaned** | `residential-homes|luxury-villa|office-spaces|appartment/page.tsx`, metadata via `src/lib/seo/staticListingMetadata.ts:45` (`index:true`) | When indexing is enabled, four near-duplicate template pages can be crawled — index bloat competing with real `/sale`,`/rent`,city routes. |
| C4 | **Public contact/lead routes have no rate limiting** | `src/app/api/contact-agent/route.ts`, `src/app/api/registration-request/route.ts` | Unauthenticated POST → Telegram send; spam/cost abuse. Honeypot is the only control. |
| C5 | **No tenant isolation for the SaaS goal** | `src/lib/sanity/queries/_core.ts:4-5`, `writeClient.ts:13-15` (single project/dataset); no `tenantId` on any doc | Every tenant-sensitive seam is a single global. Multi-tenancy is a rebuild, not a tweak. |

---

## 3. AI-Generated Code Smells

Classic machine/template residue, all file-cited:

1. **Mock-data → fake-API → scaffold island (dead, self-contained).**
   `src/app/api/featuredproperty.tsx` (exports `featuredProprty` — sic), `footerlinks.tsx`, `propertyhomes.tsx` (9 fake Miami villas), `testimonial.tsx` are **`.tsx` files inside `src/app/api/` that are NOT route handlers**. They feed `src/data/{featuredProperty,footer,properties,testimonials}.ts`. `getProperties()` (`src/data/properties.ts`) is imported **only** by the four `src/components/Properties/{Appartment,LuxuryVilla,OfficeSpaces,Residential}/index.tsx` scaffolds (verified: grep of `getProperties` finds only these four + the `data/index.ts` re-export), which are used **only** by the four orphan pages. `data/featuredProperty|footer|testimonials` have **zero importers** outside `src/data/`.

2. **Quadruplicated scaffold components.** `Properties/{Residential,LuxuryVilla,Appartment,OfficeSpaces}/index.tsx` are ~95% identical; `OfficeSpaces` and `Residential` are byte-identical except the component name; the only real difference is `properties.slice(0,3)/(3,6)/(6,9)`.

3. **Dead `Auth/*` cluster.** `src/components/Auth/{SignIn,SignUp,SocialSignIn,SocialSignUp}` — `SocialSignIn`/`SocialSignUp` are ~90% identical (same Google/GitHub SVGs, differ by label + `rounded-2xl` vs `rounded-lg`). Imported only by each other; **nothing in `app/` mounts them** (grep confirms). Also hardcoded English (next-intl bypass) and a locale list missing `it` (`SignIn/index.tsx:11`).

4. **Dead donation context.** `src/app/context/donationContext.tsx` (`DonationProvider`) — **0 importers** anywhere; pure charity-template leftover.

5. **Copy-pasted GROQ projection.** The property-card projection block is repeated near-verbatim in `queries/catalog.ts:184`, `queries/property.ts:106` & `:165`, `queries/home.ts:227` & `:29`, `queries/blog.ts:40` & `:258` — no shared fragment.

6. **`as never` as a de-facto `any`.** 71 `as never` casts across 14 files in `src/lib/sanity` (verified count) used to push untyped Sanity rows through `resolveLocalizedString`.

7. **Dead dependencies** (in `package.json`, **0 imports** in `src` — verified): `react-slick`, `slick-carousel`, `react-phone-number-input`. (`@types/react-slick` too.)

8. **Stale doc residue at repo root:** `ARCHITECTURE_REPORT.md`, `properties-sticky-filters-audit.md`, `docs/TECHNICAL_AUDIT_2026.md`, and the mixed/duplicated `docs/refactor-prompts/*` (old `phase-*.md` + mismatched names) — old audits that contradict current code.

---

## 4. Architecture Review

**Healthy:** `src/lib/sanity/{queries,adapters,groq}` separation; `src/lib/seo/*` (focused single-purpose modules); `src/lib/routes/*` (route resolution); `src/features/editor/*` (cleanly isolated under `src/app/editor/layout.tsx`, client-only, won't leak into public bundles); cache+tag strategy in `_core.ts:54` with a real webhook (`src/app/api/revalidate/sanity/route.ts`).

**Misplaced / structural smells (file-cited):**
- **API folder holds non-route files:** `src/app/api/{featuredproperty,footerlinks,propertyhomes,testimonial}.tsx` are data modules masquerading as API (see §3.1). They are not route handlers and don't belong under `app/api`.
- **Two parallel "properties" trees:** `src/components/Properties/*` (mock scaffolds — dead) vs the real `src/components/catalog/*` + `src/components/shared/property/*` + `src/components/property/*`. The live ones (`Properties/PropertyList`, `Properties/PropertyGallery`) are fine; the four category scaffolds are not.
- **Business logic inside `catalog.ts`** (GROQ predicate building + SEO resolution mixed with fetchers) — see §7.
- **Two contexts dirs:** `src/contexts/*` (live: Currency, CatalogView) vs `src/app/context/*` (AuthDialog — alive only inside dead `Auth/*`; donation — dead). Consolidate to `src/contexts/`.
- **Two type homes for one entity:** `src/types/*` and `src/types/domain/*` + `src/lib/sanity/types/*` model Property four different ways (§8).

---

## 5. Duplicate Components Review

| Cluster | Files | Similarity | Keep | Remove / Merge | Risk |
|---|---|---|---|---|---|
| Category scaffolds | `Properties/{Residential,LuxuryVilla,Appartment,OfficeSpaces}/index.tsx` | ~95% (2 are byte-identical) | none (whole island is dead) | **Delete** with their pages; if kept, collapse to one `<PropertyShowcase slice={[a,b]}/>` | Low |
| Auth social buttons | `Auth/SocialSignIn.tsx` vs `Auth/SocialSignUp.tsx` | ~90% | none | **Delete** entire `src/components/Auth/` | Low |
| Old breadcrumb | `src/components/Breadcrumb/index.tsx` (`links[]` variant) + `src/types/breadcrumb.ts` | dead, **0 imports** | none | **Delete** both | None |
| Catalog breadcrumb outlier | `src/components/shared/CatalogBreadcrumb/index.tsx` (~200 lines, inline `formatSlug`/`buildCurrentPath`) | duplicates `src/lib/routes/breadcrumbs.ts` helpers | keep component | **Move** helpers into `lib/routes/breadcrumbs.ts` (like the other 5 thin wrappers) | Medium (dense path permutations) |
| Contact/register forms | `contact/GeneralContactForm.tsx`, `register/RegistrationRequestForm.tsx` | share duplicated `inputClass`, honeypot block, submit-button class | both (different fields/endpoints) | **Extract** `inputClass` + `<HoneypotField>` + `<SubmitButton>` | Low |

**Not duplicates (verified, keep as-is):** the 5 thin breadcrumb wrappers (`Blog/Cities/CityLanding/Favorites/PropertyDetail`) all delegate to the shared `src/components/shared/Breadcrumb/index.tsx` + `lib/routes/breadcrumbs.ts` — healthy primitive+wrapper pattern. `PropertyCard.tsx` is the single canonical card (no rival implementation). `Properties/{PropertyList,PropertyGallery}` are real and used.

---

## 6. Dead Code / Legacy Review

| Item | Importers | Delete? | Confidence |
|---|---|---|---|
| `src/app/api/{featuredproperty,footerlinks,propertyhomes,testimonial}.tsx` | only dead `src/data/*` | Yes | 100% |
| `src/data/{featuredProperty,footer,testimonials}.ts` | none outside `src/data/` | Yes | 100% |
| `src/data/properties.ts` + `src/components/Properties/{Appartment,LuxuryVilla,OfficeSpaces,Residential}` | only the 4 orphan pages | Yes (with pages) | 90% |
| `src/app/[locale]/{appartment,luxury-villa,office-spaces,residential-homes}/page.tsx` | not in live nav (only dead `footerlinks.tsx`) | Yes | 90% |
| `src/components/Auth/**` (SignIn, SignUp, Social*) | only each other | Yes | 95% |
| `src/app/context/donationContext.tsx` | none | Yes | 100% |
| `src/components/Breadcrumb/index.tsx`, `src/types/breadcrumb.ts` | none | Yes | 100% |
| deps `react-slick`, `slick-carousel`, `react-phone-number-input`, `@types/react-slick` | none in `src` | Yes | 100% |
| `src/lib/routes/dealPages.ts` `dealPageHref` | defined, never called (grep) | Investigate (the `/investment/*` pages render but are unlinked) | 75% |
| Root `ARCHITECTURE_REPORT.md`, `properties-sticky-filters-audit.md`, `docs/TECHNICAL_AUDIT_2026.md` | docs only | Yes (stale audits) | 90% |

> **Before deleting the orphan pages:** confirm with the product owner they aren't intended future SEO landing pages. If they are wanted, they need unique CMS content + sitemap entries (§10), not mock data.

---

## 7. Sanity / GROQ Review

**God-file:** `src/lib/sanity/queries/catalog.ts` (790 lines) mixes: area-bounds fetch (`:7`), filter predicate/where builder (`:46-151`), paginated property fetch + card projection (`:153-255`), catalog banners (`:257-383`), filter-option fetchers + `mapToLocalizedOption` (`:385-540`), city/country lookups (`:542-671`), and `resolveCatalogSeoPage` (`:673-789`).

**Duplicated GROQ (no shared fragments):**
- Property-card projection — `catalog.ts:184`, `property.ts:106`/`:165`, `home.ts:227`/`:29`, `blog.ts:40`/`:258`.
- `city/district/type` sub-projection — same files (`catalog.ts:202`, `property.ts:26`/`:122`/`:183`, `home.ts:44`/`:246`, `blog.ts:53`).
- Image projection `{asset->{_id,url,metadata}, crop, hotspot, alt, label}` — ~8× in `home.ts`, plus `property.ts:42`; a short `asset->{url}` form ~25× in `landing.ts:51-240`.
- SEO projection — `property.ts:70`, `home.ts:152`, `blog.ts:199`.
- Blog "published" filter `defined(publishedAt) && publishedAt <= now()` copy-pasted: `blog.ts:108/150/179/223`, `sitemap.ts:419`.
- Fetcher boilerplate (`getClient` null-guard + try/catch + `console.warn('[Sanity] … failed')`) duplicated in ~30 functions → needs a `safeFetch(query, params, label)` helper in `_core.ts`.
- Env read (`projectId/dataset`) triplicated: `_core.ts:4`, `imageUrl.ts:3`, `writeClient.ts:13`.

**Adapter duplication:** `socialMetadataResolution.ts` is the intended unifier (`buildMetadata:109`, `resolveChainedTitle/Description`, `pickAbsoluteOgImageUrl`), but `homeSeoAdapter.ts:29` and `blogSeoAdapter.ts:42` re-implement title/description/og resolution inline instead of delegating; `homeSeoAdapter.ts:20` even re-declares `TEMPLATE_TITLE/DESCRIPTION`. The `isIndexingEnabled()`+hreflang early-return is copy-pasted across all four `*SeoAdapter.ts`.

**Proposed structure** (`src/lib/sanity/`):
```
core/        env.ts · sanityClient.ts (getClient + safeFetch) · cache.ts · imageUrl.ts · writeClient.ts
groq/        propertyFilters.ts (keep) · catalogFilters.ts (from catalog.ts:46-151)
groq/fragments/  propertyCard · cityRef · districtRef · typeRef · image · seo · blogListing · landingSections · catalogSeoPage
queries/     home · property · catalog · catalogFacets · catalogSeo · landing · blog · agent · settings · sitemap   (thin fetchers only)
adapters/    property · city · propertyType · agent · siteSettings · blog · catalogSeo
adapters/seo/  social.ts (unifier) · indexingGuard.ts · property|home|blog|landing (all delegate to social.ts)
types/       localized.ts (single LocalizedField) · property.ts (ONE canonical type; CatalogProperty derives)
```

---

## 8. TypeScript Review

- **No literal `any`** in `src/lib/sanity` (clean) — but **71 `as never`** casts (verified) are the escape hatch; many fetchers return `Promise<unknown | null>` (`property.ts:7`, `home.ts:196`, `settings.ts:87`, `blog.ts:122`, `property.ts:243`) and defer typing to caller casts (`property/[slug]/page.tsx` casts `as never` 4×).
- **Duplicate `LocalizedField` type** defined 5×: `socialMetadataResolution.ts:4` (canonical), re-declared/inlined in `blogSeoAdapter.ts:7`, `propertyAdapter.ts:334`, `catalog.ts:422`, `localized.ts:15`; `homeSeoAdapter.ts:5` uses a divergent `Record<string,string>`.
- **Four overlapping Property shapes:** `src/types/domain/property.ts:5` (`Property`), `src/types/propertyHomes.ts:1` (`PropertyHomes`), `src/types/catalog.ts:27` (`CatalogProperty`), `propertyAdapter.ts:289` (`SanityProperty`). `Property` (domain) appears unused by the adapter path.
- **Inconsistent import path:** `propertyAdapter.ts:2` imports `CatalogProperty` from `./client`, while `catalog.ts:5`/`property.ts:4`/`home.ts:3` import it from `@/types/catalog`.

---

## 9. i18n Review

- **Message keys are fully in sync.** All 5 files (`messages/{en,it,ru,sq,uk}.json`) share the identical 14 namespaces and **306 leaf keys each** — union 306, zero missing. The ru/uk byte-size difference is **only** UTF-8 Cyrillic encoding cost, **not** extra/missing content. (The size discrepancy that motivated the question is a false alarm.)
- **Hardcoded UI text — the real offender is `Auth/*`** (dead, but if kept must be localized): `SignIn/index.tsx:62,70,82,92,103,107,109` and `SignUp/index.tsx:64,72,81,90,101,107,118,123` (`"Sign In"`, `placeholder="Username"`, `"OR"`, `"Forget Password?"`, etc.), plus toast `"Successfully registered"` (`SignUp:35`).
- **Hardcoded `aria-label`/`title` in live UI** (accessibility text not localized): `catalog/PropertyPagination.tsx:56,62,100`; `CatalogBodyClient.tsx:453`; `Properties/PropertyGallery/index.tsx:151,388,403,415,427,435`; `shared/ImageLightbox.tsx:36,42,51`; `Header/HeaderClient.tsx:140,170`; `Header/LanguageSwitcher.tsx:40`; `shared/Breadcrumb/index.tsx:21`; `property/PropertyAmenitiesSection.tsx:126`; `Blog/BlogContentImage.tsx:33`. (Forms `GeneralContactForm`/`RegistrationRequestForm` are correctly localized.)
- **Locale-list bug:** `Auth/SignIn/index.tsx:11` & `SignUp/index.tsx:9` hardcode `["en","uk","ru","sq"]` — **`it` omitted**.
- **No localized `pathnames`** in `src/i18n/routing.ts` → URL segments are English across all 5 languages (SEO weakness, not a bug).

---

## 10. SEO Review

**Strong overall:** 28/35 `page.tsx` implement `generateMetadata`; localized titles/descriptions; per-page canonical (clean path, query stripped — `catalogListingMetadata.ts:7`); complete hreflang for all 5 locales + `x-default` (`src/lib/seo/hreflang.ts:23`); a global indexing kill-switch (`NEXT_PUBLIC_ENABLE_INDEXING`, `envSeo.ts:7` → `robots.ts:8`); noindex on filtered/paginated/thin combos (`catalogListingMetadata.ts:60,79`, `listingIndexPolicy.ts:7`); `/catalog` always noindex by design (`catalog/page.tsx:72`); JSON-LD wired for site/property/blog/itemlist/breadcrumb.

**Gaps (file-cited):**
1. **Thin orphan templates are `index:true`** (`staticListingMetadata.ts:45`) — `residential-homes|luxury-villa|office-spaces|appartment` render only `HeroSub` + a mock list, no unique CMS body. Either enrich + add to sitemap, or `index:false` (or delete with the island).
2. **`/{country}/{city}/info` editorial pages are absent from all sitemaps** — `sitemap-static.xml/route.ts:51` skips `cities/` landings; `fetchSitemapCityEntries` (`sitemap.ts`) emits only listing-shorthand URLs. Indexable but undiscoverable via sitemap.
3. **`favorites/page.tsx:8`** sets title/description but **no `robots`/canonical/hreflang** → indexable user-utility page when indexing is on.

---

## 11. Performance Review

- **64 client components** (verified grep of `'use client'`/`"use client"`). Suspicious non-interactive ones that could be server: `shared/property/PropertyBadges.tsx` (only `useMemo`+`useTranslations`), `property/PropertyAmenitiesSection.tsx`, `Layout/Footer/index.tsx` (derives from `usePathname/useLocale`), `catalog/ViewModeSwitcherUI.tsx`. The currency boundary (`shared/PriceText.tsx` + `useCurrency`) is the right place to isolate so `PropertyCard.tsx` could become server.
- **maplibre-gl eager on property detail:** `PropertiesMap.tsx` (catalog) is correctly lazy via `next/dynamic({ssr:false})` (`CatalogBodyClient.tsx:18`), **but** `PropertyLocationMap` is a static `import` in `property/[slug]/page.tsx:8` (rendered `:269`) — maplibre + CSS land in every property-page bundle. Should be `next/dynamic`.
- **Dead deps bloat install/lockfile:** `react-slick`, `slick-carousel`, `react-phone-number-input` unused. Only `embla-carousel-react` is actually used (`ui/carousel.tsx:4`).
- **Images:** `next.config.ts` has **no `images` block** (no `remotePatterns` for the Sanity CDN). 3 raw `<img>` (verified): `CatalogBodyClient.tsx:462,495` (map popups), `shared/FavoritesFlyAnimation.tsx:81` (transient, OK).
- **useEffect derived-state syncing** (re-render churn / CLS): `catalog/useCatalogFilters.ts:148,201,213`; `catalog/widgets/HeroSearchWidget.tsx:57,73`; `property/SimilarPropertiesCarousel.tsx:18` (`matchMedia`→`isMobile`, card-width CLS); `contact/GeneralContactForm.tsx:69`. **No client-side network fetching** in components (good — catalog data is server-rendered).
- **Caching is solid:** `_core.ts:54` `sanityCache()` over `unstable_cache` + tags; webhook revalidation present.

---

## 12. Security Review

**Posture is solid; no CRITICAL/HIGH.** Editor auth uses a **dedicated** `EDITOR_SESSION_SECRET` HMAC (`signCookie.ts:13`), timing-safe verify (`:50`), `httpOnly`+`sameSite:lax`+signed cookie, `secure` in prod (`login/route.ts:34`); no Sanity-token fallback remains. Write token is server-only (`writeClient.ts:17`), never `NEXT_PUBLIC`, not imported by any `"use client"` file (verified). Strong routes: `editor/landing/save` (auth-gated, whitelists, `escapeKey()` for GROQ), `revalidate/sanity` (`SANITY_REVALIDATE_SECRET`, fails closed), `cron/update-currency-rates` (`CRON_SECRET`, fails closed). `.env*` gitignored.

**Findings:**
- **MEDIUM** — No rate limiting on `contact-agent` / `registration-request` (public POST → Telegram). [§2 C4]
- **MEDIUM** — `writeClient.ts` lacks `import 'server-only'` (defense-in-depth; not currently leaked).
- **MEDIUM** — Stale guidance: `editor/login/page.tsx:33` and `.env.example:42` still say `SANITY_WRITE_TOKEN` can be the editor secret — code no longer supports this; could cause a misconfigured (fails-closed) editor.
- **LOW** — Non-constant-time password compare (`login/route.ts:28`); PII (name/phone/email) logged at `contact-agent/route.ts:147`.
- **LOW/smell** — Hardcoded `admin/admin123` in dead `Auth/SignIn/index.tsx`.

---

## 13. SaaS Readiness Review — **Score: 8 / 100**

A polished single-tenant site; every tenant-sensitive seam is a single global. The `agent` route/adapter (`queries/agent.ts`, `agentAdapter.ts`) is a **listing-contact person**, not a tenant — the only "scoping" is the public filter `agent->slug.current == $agentSlug` (`catalog.ts:86`) over a shared pool. No `tenantId` on any document.

**Blockers (file-cited):**
1. Single-dataset client — `_core.ts:4`, `writeClient.ts:13`; no per-request client factory.
2. No tenant in data model; `siteSettings` is a singleton (`siteSettingsAdapter.ts`, `writeClient.ts:37` hardcodes the doc id).
3. Single shared password, no users/roles/tenant — `signCookie.ts`, `getEditorSession.ts:5` returns only `{authenticated}`.
4. Global site URL/brand/contacts/currency — `siteUrl.ts:3`, `baseUrl.ts`, one `siteSettings` doc.
5. Hardcoded locales (`i18n/routing.ts:4`) and branding (`BrandLogo/Logo.tsx` ignores `siteSettings.logo`).
6. **No billing/plan/quota code at all** (grep `stripe|subscription|billing|plan|quota` → none).

**Minimum viable path:** host→`tenantId` resolution in middleware → `getClient/getWriteClient({projectId,dataset})` factory (dataset-per-tenant is the mechanical option given the clean query layer) → per-tenant `siteConfig`/`tenant` doc keyed by domain (brand, contacts, currency, locales) → NextAuth + agency-membership + RBAC → per-tenant domains → theming via CSS vars from tenant config → Stripe + quotas (greenfield). Effort: weeks, but the dataset-factory refactor is mechanical, not risky.

---

## 14. Refactoring Roadmap

> Rule for every phase: run `npm run lint` + a typecheck (`npx tsc --noEmit`) + `npm run build`; commit per phase; never mix a delete-phase with a behavior change.

### PHASE 1 — Safety & Correctness *(~0.5 day, risk: low)*
- **Goal:** remove footguns without behavior change.
- **Tasks:** add `import 'server-only'` to `writeClient.ts`; correct stale editor-secret guidance (`editor/login/page.tsx:33`, `.env.example:42`); add the missing `it` locale to `Auth/SignIn/index.tsx:11` & `SignUp/index.tsx:9` (or delete in Phase 2); add a small rate-limit (IP token-bucket) to `contact-agent` + `registration-request`; reduce PII logging (`contact-agent/route.ts:147`).
- **Verify:** editor login still works; forms still submit; build green.

### PHASE 2 — Remove Legacy / Dead Code *(~1 day, risk: low)*
- **Goal:** delete the template island + dead deps + stale docs.
- **Files:** `src/app/api/{featuredproperty,footerlinks,propertyhomes,testimonial}.tsx`; `src/data/{featuredProperty,footer,testimonials}.ts` (+ `properties.ts` if pages go); `src/components/Properties/{Appartment,LuxuryVilla,OfficeSpaces,Residential}`; `src/app/[locale]/{appartment,luxury-villa,office-spaces,residential-homes}` (**confirm with owner first**); `src/components/Auth/**`; `src/app/context/donationContext.tsx`; `src/components/Breadcrumb/index.tsx`; `src/types/breadcrumb.ts`; remove deps `react-slick`, `slick-carousel`, `react-phone-number-input`, `@types/react-slick`; delete root `ARCHITECTURE_REPORT.md`, `properties-sticky-filters-audit.md`, `docs/TECHNICAL_AUDIT_2026.md`.
- **Effect:** smaller surface, no orphan SEO pages, no `admin/admin123`.
- **Verify:** `grep` shows zero importers before each delete; build green; sitemaps unchanged.

### PHASE 3 — Split God Files *(~1.5 days, risk: medium)*
- **Goal:** break up `catalog.ts` (790) per §7; also review `listingRouteResolver.ts` (622), `PropertiesMap.tsx` (620), `CatalogBodyClient.tsx` (562).
- **Order:** extract pure functions first (`buildCatalogPredicateParts/WhereClause` → `groq/catalogFilters.ts`), then projections → `groq/fragments/*`, then SEO resolve → `adapters/catalogSeo.ts`, leaving thin fetchers in `queries/`. Keep public exports stable via a barrel.
- **Verify:** typecheck + catalog/property pages render identically; same GROQ results.

### PHASE 4 — Deduplicate Components *(~1 day, risk: low–med)*
- **Goal:** §5 merges — `CatalogBreadcrumb` inline helpers → `lib/routes/breadcrumbs.ts`; extract shared form `inputClass`/`<HoneypotField>`/`<SubmitButton>`. (Scaffold/Auth duplicates already gone in Phase 2.)
- **Verify:** breadcrumb trails byte-identical on catalog routes; forms submit unchanged.

### PHASE 5 — Sanity Query Architecture *(~2 days, risk: medium)*
- **Goal:** the §7 target structure — `core/env.ts` (dedupe triplicated env), `safeFetch` helper, shared GROQ fragments, all `*SeoAdapter` delegating to `social.ts`, one `LocalizedField`, one canonical Property type.
- **Verify:** identical query outputs; typecheck removes a chunk of the 71 `as never` casts.

### PHASE 6 — Performance *(~1 day, risk: low)*
- **Goal:** `next/dynamic` for `PropertyLocationMap`; add `images.remotePatterns` to `next.config.ts`; convert `CatalogBodyClient` `<img>`→`next/image`; push currency boundary so `PropertyCard`/`PropertyBadges` become server; replace `matchMedia`→state with CSS (CLS).
- **Verify:** property-page JS bundle drops (maplibre out of initial); Lighthouse CLS/LCP improve.

### PHASE 7 — SaaS Preparation *(weeks, risk: high — greenfield)*
- **Goal:** the §13 path — tenant resolution, client factory, per-tenant config doc, RBAC auth, domains, theming, billing. Spike the **client factory + tenant-config doc** first behind a flag; do not refactor product features until the data/auth seams exist.

---

## 15. TOP 30 Tasks by ROI

| # | Task | Effect | Effort | Risk | Priority | Why now |
|---|---|---|---|---|---|---|
| 1 | Delete fake-API `app/api/*.tsx` + dead `data/*` | -dead code, clarity | S | Low | P0 | Zero importers, pure template residue |
| 2 | Delete `Auth/**` (kills `admin/admin123`) | -smell, -bundle | S | Low | P0 | Unmounted, hardcoded creds |
| 3 | Delete 4 orphan category pages + scaffolds | -SEO bloat | S | Low | P0 | Thin, indexable, unlinked (confirm w/ owner) |
| 4 | Remove dead deps (slick, phone-input) | -install, -lockfile | S | Low | P0 | 0 imports verified |
| 5 | Delete donation context + old Breadcrumb + `types/breadcrumb.ts` | -dead code | S | None | P0 | 0 imports |
| 6 | `noindex` or sitemap the orphan/info pages | SEO correctness | S | Low | P1 | Index bloat / discoverability |
| 7 | Rate-limit public contact routes | abuse protection | S | Low | P1 | Unauth POST→Telegram |
| 8 | `server-only` on `writeClient.ts` | defense-in-depth | XS | None | P1 | Prevent future client leak |
| 9 | Fix stale editor-secret docs | ops correctness | XS | None | P1 | Misconfig risk |
| 10 | Split `catalog.ts` (790→modules) | maintainability | L | Med | P1 | Central god-file |
| 11 | Extract shared GROQ property-card fragment | -dup, consistency | M | Med | P1 | Copy-pasted ×6 |
| 12 | `next/dynamic` `PropertyLocationMap` | -property bundle | S | Low | P1 | maplibre eager on detail |
| 13 | Add `images.remotePatterns` | image optimization | XS | Low | P1 | No images config |
| 14 | One canonical `LocalizedField` type | -dup, type safety | S | Low | P2 | Defined 5× |
| 15 | Collapse 4 Property type shapes → 1 | type safety | M | Med | P2 | Overlapping defs |
| 16 | `safeFetch` helper in `_core.ts` | -boilerplate ×30 | M | Low | P2 | Repeated try/catch |
| 17 | Dedupe env read (`core/env.ts`) | single source | S | Low | P2 | Triplicated |
| 18 | `homeSeoAdapter`/`blogSeoAdapter` → `social.ts` | -dup | M | Med | P2 | Bypass the unifier |
| 19 | Shared blog "published" GROQ filter | -dup | S | Low | P2 | Copy-pasted ×5 |
| 20 | `CatalogBreadcrumb` helpers → lib | -dup | M | Med | P2 | Inline path logic |
| 21 | Form `inputClass`/honeypot/submit primitives | -dup | S | Low | P2 | Duplicated in 2 forms |
| 22 | Localize live `aria-label`/`title` strings | a11y/i18n | M | Low | P2 | ~15 hardcoded |
| 23 | Reduce 71 `as never` via typed fetchers | type safety | L | Med | P2 | De-facto `any` |
| 24 | `PropertyBadges`/`PropertyCard` → server | -client JS | M | Med | P3 | Non-interactive |
| 25 | Replace `matchMedia`→state with CSS | -CLS | S | Low | P3 | Card-width shift |
| 26 | `favorites` page robots/canonical | SEO | XS | Low | P3 | Missing robots |
| 27 | Add localized `pathnames` (5 langs) | SEO | L | Med | P3 | English-only slugs |
| 28 | Decide fate of `/investment/*` (unlinked) | clarity/SEO | S | Low | P3 | `dealPageHref` unused |
| 29 | Consolidate `app/context`→`src/contexts` | structure | S | Low | P3 | Two context homes |
| 30 | Spike SaaS client-factory + tenant doc | unblock SaaS | L | High | P3 | Foundation for multi-tenancy |

*Effort: XS<2h · S≈½day · M≈1day · L≥2days.*

---

*Refactor execution prompts: see `docs/refactor-prompts/01..07`.*
