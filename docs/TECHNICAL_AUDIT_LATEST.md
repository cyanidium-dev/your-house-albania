# Domlyva — Technical Audit (LATEST)

> Audited: 2026-05-31 · Scope: `your-house-albania` (Next.js 15 App Router frontend) with cross-reference to `domlivo-admin` (Sanity Studio + schemas).
> Method: source-of-truth is the **current code only**. Every problem below is backed by a concrete file:line. Findings with no code anchor were dropped. This document does not change code.
> Stack: Next.js 15 (App Router, React 19) · Sanity CMS (GROQ, `unstable_cache` + tags) · next-intl 4 (locales `en/uk/ru/sq/it`, default `sq`) · TypeScript strict.

---

## 1. Executive Summary

The frontend is **functionally solid and well-cached**, with good i18n coverage, good SEO scaffolding (hreflang, canonical, JSON-LD), and a clean server/client split for the heavy map. The codebase is, however, carrying a meaningful amount of **AI-scaffolding residue**: duplicated GROQ projections, a parallel `src/types/domain/*` type tree, template-leftover auth/context islands, and four mock-data "category" pages that are publicly indexable.

There is **one production-correctness defect rated CRITICAL**: public property queries do not filter `isPublished` / `lifecycleStatus`, so **sold, draft, and archived listings leak into the catalog, property detail, homepage, and sitemaps**. The Studio's own query layer filters these (`domlivo-admin/lib/sanity/queries.ts:258`), so this is a frontend divergence, not a schema gap.

SaaS-readiness is **12/100** — the app is hard-wired single-tenant at the data-source layer.

**Headline numbers**
- 336 TS/TSX files (~190 `.tsx`), ~59–62 client components.
- Largest file: `src/lib/sanity/queries/catalog.ts` at 786 lines (god-file).
- GROQ property-card projection copy-pasted **5×**; image-asset fragment ~**15×**; ref-triplet (city/district/type) ~**9×**.
- ~80 `as never` strict-bypass casts; 11 `Promise<unknown>` fetcher boundaries.
- ~12 files of **100%-confidence dead code** (template leftovers).

**What to do first (ROI order):** ship the `isPublished` filter (P0), de-index/remove the 4 mock pages (P0/P1), add rate-limiting to public POST routes (P1), then extract GROQ fragments + split `catalog.ts` (P2), delete dead code (P2), and only then consider SaaS groundwork.

---

## 2. Critical Problems (P0 — can break production / leak data / hurt SEO now)

### 2.1 [CRITICAL] Unpublished / sold / archived listings leak everywhere

**Risk:** breaks production trust (sold flats shown as available → wasted leads, legal exposure), pollutes SEO index with stale/duplicate URLs.

The Studio schema defines `isPublished` (boolean) and `lifecycleStatus` (string) — `domlivo-admin/schemaTypes/documents/property.ts:107,116`. The Studio's own listing query enforces them:

```
// domlivo-admin/lib/sanity/queries.ts:258
/** Listed properties: published, not archived. Treat undefined lifecycleStatus as active. */
PROPERTIES_LIST_QUERY = *[_type == "property" && isPublished == true && (lifecycleStatus == "active" || !defined(lifecycleStatus))]{ ... }
```

The frontend does **not**:

| Surface | File:line | Predicate used | Leak |
|---|---|---|---|
| Catalog | `src/lib/sanity/queries/catalog.ts:130` | `_type == "property"` only | ✅ leaks |
| Property detail | `src/lib/sanity/queries/property.ts:9, 105, 164` | slug match, no publish gate | ✅ leaks |
| Homepage | `src/lib/sanity/queries/home.ts:28` | `_type == "property"` | ✅ leaks |
| Sitemap (type) | `src/app/sitemap.ts:159` | `_type=="property" && defined(status)` | ✅ leaks |
| Sitemap (non-geo) | `src/app/sitemap.ts:295` | `defined(status)` | ✅ leaks |
| Sitemap (listing) | `src/app/sitemap.ts:390` | filters correctly | ❌ only correct one |

**Fix shape (audit recommendation, not applied):** add `&& isPublished == true && (lifecycleStatus == "active" || !defined(lifecycleStatus))` to every public property predicate. Centralize as a shared GROQ fragment so it can't drift again (see §7).

### 2.2 [CRITICAL→HIGH] Four mock-data category pages are publicly indexable

`/appartment`, `/luxury-villa`, `/office-spaces`, `/residential-homes` render **mock data** from `src/data/properties.ts` via `getProperties().slice(...)` — not Sanity. Components: `src/components/Properties/{Appartment,LuxuryVilla,OfficeSpaces,Residential}/index.tsx`. They are ~99% identical (OfficeSpaces & Residential are byte-identical `slice(0,3)`), registered in `src/lib/routes/catalog.ts:60-63`, and emit `index:true` when `NEXT_PUBLIC_ENABLE_INDEXING=true`.

**Risk:** SEO — fake listings indexed under category URLs; thin/duplicate content; user lands on non-real inventory. **Recommendation:** de-index immediately, then delete (the live catalog already covers these via real filters).

### 2.3 [HIGH] No rate-limiting on public POST routes

`/api/contact-agent`, `/api/registration-request`, `/api/editor/login` accept unauthenticated POSTs with only a `companyWebsite` honeypot. **Risk:** Telegram-notification flooding, registration spam, editor-password brute-force. **Recommendation:** add IP-based rate limiting (e.g. token bucket in middleware or per-route) before any SaaS exposure.

---

## 3. AI-Generated Code Smells

Concrete, file-backed residue typical of scaffolded generation:

- **Parallel type tree.** `src/types/domain/*` (property/testimonial/blog/footerLink/featuredProperty) mirrors flat `src/types/*`. `domain/*` is imported only by the 5 mock `src/data/*` files. Net: two sources of truth for the same shapes.
- **Typo propagated by copy-paste.** `src/types/domain/featuredProperty.ts:2` declares field `scr` (intended `src`); the bug is carried into `src/app/api/featuredproperty.tsx:5-17`.
- **Copy-pasted GROQ.** Property-card projection appears 5× (`catalog.ts:183-220`, `home.ts:226-263`, `property.ts:105-139,164-201,9-81`). See §7.
- **Copy-pasted SEO adapters.** `home/property/blog/landingSeoAdapter` share ~4× duplicated metadata-building logic; `LocalizedField` is redefined locally in `blogSeoAdapter.ts:7`.
- **Template auth island.** `src/components/Auth/{SignIn,SignUp,SocialSignIn,SocialSignUp}` — boilerplate login UI with **hardcoded `admin/admin123` default creds**, zero JSX usage, and the only hardcoded English strings in the app (omits `it` locale).
- **Template contexts.** `src/app/context/{AuthDialogContext,donationContext}.tsx` — "donation" is not a domain concept here; leftover from a starter template.
- **`as never` as a habit.** ~80 occurrences (e.g. `propertyAdapter.ts:12`, `catalog.ts:7`) used to silence strict typing at adapter boundaries rather than typing the GROQ result.

---

## 4. Architecture Review

**Good**
- Clean RSC split: the map is correctly client-only and lazy (`CatalogBodyClient.tsx:18-29`, `next/dynamic` `ssr:false`).
- Cache layer is coherent: `sanityCache` wrapper + `SANITY_TAGS` + `revalidateTag` webhook (`/api/revalidate/sanity`).
- Routing/breadcrumb/hreflang helpers live in `src/lib/routes/*` and `src/lib/seo/*`.

**Problems**
- **God-file:** `catalog.ts` (786 lines) mixes area-bounds, predicate building, pagination, banners, filter-options, country lookup, footer data, and catalogSeo. Hard to reason about, hard to test, hotspot for the §2.1 bug.
- **Two context folders:** real ones in `src/contexts/*` vs template leftovers in `src/app/context/*`. Confusing for onboarding.
- **Inline logic that bypasses shared libs:** `CatalogBreadcrumb` builds crumbs inline instead of using `src/lib/routes/breadcrumbs.ts`.
- **Misplaced helpers:** `src/components/utils/{markdownToHtml,validateEmail}.ts` are non-UI utilities sitting under `components/` — belong in `src/lib/`.

---

## 5. Duplicate Components Review

| Duplicate set | Files | Verdict |
|---|---|---|
| Category mock pages | `Properties/{Appartment,LuxuryVilla,OfficeSpaces,Residential}/index.tsx` | ~99% identical; OfficeSpaces ≡ Residential. Collapse → delete (§2.2). |
| Breadcrumb | `src/components/Breadcrumb/index.tsx` (legacy) vs `src/components/shared/Breadcrumb` | Legacy unused; delete. |
| SEO adapters | `home/property/blog/landingSeoAdapter` | Extract shared `buildMetadata` core. |
| Type tree | `src/types/domain/*` vs `src/types/*` | Collapse to one (§3). |

---

## 6. Dead Code / Legacy Review

**100% confidence (0 importers / 0 JSX usage):**
- `src/data/{testimonials,featuredProperty,blog,footer,navigation}.ts` + `src/data/index.ts` barrel.
- `src/app/api/{testimonial,featuredproperty,footerlinks}.tsx`.
- `src/components/Auth/{SignIn,SignUp,SocialSignIn,SocialSignUp}` (hardcoded creds — also a security smell).
- `src/app/context/{AuthDialogContext,donationContext}.tsx`.
- `src/components/Breadcrumb/index.tsx` (legacy).
- `src/components/utils/{markdownToHtml,validateEmail}.ts`.

**Partial:**
- `src/data/properties.ts` is **LIVE** (the 4 mock pages, §2.2) — only deletable once those pages go.
- `nonGeoDealNavHref.ts` ~75% dead.

**Risk of keeping:** raises maintenance/onboarding cost, and the hardcoded-cred Auth island is a latent security liability if ever wired up.

---

## 7. Sanity / GROQ Review

**Duplication (the core debt):**
- Property-card projection: **5×** (`catalog.ts:183-220`, `home.ts:226-263`, `property.ts:105-139,164-201,9-81`).
- city/district/type ref triplet: ~**9×**.
- Image-asset fragment (`asset->{url}`): ~**15×**.
- SEO fragment: **3×**.

**Recommendation:** create `src/lib/sanity/groq/` with named fragments (`propertyCardFields`, `refTriplet`, `imageAsset`, `seoFields`, **and `publishedPropertyFilter`** so §2.1 is enforced in one place). Then split `catalog.ts` into focused modules (area-bounds / predicate / pagination / banners / filter-options / country / footer / catalogSeo).

**Type ↔ schema mismatches** (`CatalogProperty`):
- Phantom `coordinates` field (`property.ts:48`) — schema only has `coordinatesLat`/`coordinatesLng`.
- Phantom `currency` — schema is EUR-only.
- `investment` typed `string`, schema is `boolean`.

---

## 8. TypeScript Review

- Strict + `noImplicitAny` is **on** (good — recently enabled).
- ~**80** `as never` casts bypass typing at GROQ→adapter boundaries; 11 `Promise<unknown>` fetchers. These are safe-ish but defeat the point of strict mode and hide the §7.x schema mismatches.
- **Recommendation:** type GROQ results once (generated or hand-written `Sanity*` types) and drop the casts at adapter entry. No behavior change.

---

## 9. i18n Review

**Strong.** All 5 message files (`en/uk/ru/sq/it`) carry the **identical 306-key set** — no missing/extra keys. `resolveLocalizedString` is a single consistent pattern across 37 files. **Only** hardcoded-text offender is the dead `Auth` island (§3) — which omits `it`. Net: i18n is healthy; fix is simply deleting the dead island.

---

## 10. SEO Review

**Strong scaffolding:**
- hreflang for all 5 locales + `x-default` (`src/lib/seo/hreflang.ts` `buildHreflangAlternates`).
- Per-page canonical + `seo.noIndex` honored; global `NEXT_PUBLIC_ENABLE_INDEXING` gate.
- JSON-LD Organization + WebSite (`siteJsonLd.ts`), RealEstateListing on detail.

**Defects (tie back to §2):**
- §2.1 leaks sold/draft URLs into the sitemap.
- §2.2 indexes 4 thin/duplicate mock pages.

Fixing §2.1 + §2.2 closes the SEO gaps; the scaffolding itself is good.

---

## 11. Performance Review

**Good:** map lazy-loaded (`CatalogBodyClient.tsx:18-29`); cache strategy solid (`sanityCache` + tags + webhook).

| Severity | Issue | Anchor |
|---|---|---|
| HIGH | `@iconify/react` runtime `Icon` in **37 files** → per-icon network fetch + CLS | grep `@iconify/react` |
| MEDIUM | ~**50** `next/image` sites use `unoptimized` (Sanity CDN bypasses Next optimization) → larger payloads | grep `unoptimized` |

**Recommendation:** swap runtime Iconify for a build-time/offline icon set (or local SVGs); add a Sanity image loader so `next/image` can optimize CDN images. Both are non-behavioral.

---

## 12. Security Review

**Good:**
- No write-token client leakage: `writeClient.ts:17` server-only; `getClient()` is tokenless/read-only.
- Editor session: HMAC over `EDITOR_SESSION_SECRET` with `timingSafeEqual` (`signCookie.ts:13-31`); `httpOnly`/`secure`/`sameSite` cookie. (Constraint honored: session secret is **not** the Sanity write token.)
- `/api/revalidate/sanity` requires shared secret (401 otherwise).

**Gaps:**
- **HIGH:** no rate limiting on public POSTs (§2.3).
- **MEDIUM:** dead `Auth` island ships hardcoded `admin/admin123` — delete so it can never be wired.

---

## 13. SaaS Readiness Review — **12/100**

Hard-wired single-tenant at the data-source layer:
- `src/lib/sanity/queries/_core.ts:4-5` reads a **single** project/dataset at module load.
- `src/lib/siteUrl.ts` — single domain.
- Brand "Domlivo" hardcoded: `layout.tsx:11`, `siteJsonLd.ts:29`, `staticListingMetadata.ts:27`.
- `agent` is a **content/contact** entity, not a tenancy primitive (`/agent/[agent]` is just a GROQ filter — `catalog.ts:85-87`).

**Missing for multi-tenant:** tenant model, data isolation (dataset/filter per tenant), per-tenant domains, per-tenant branding/i18n/theming, roles/authZ, billing.

**Top blockers (in order):** (1) tenant-resolution layer (host→tenant), (2) data isolation, (3) per-tenant domain + branding, (4) authN/authZ + billing. This is a multi-quarter effort; **do not start before §2 is fixed**.

---

## 14. Refactoring Roadmap (PHASE 1–7)

| Phase | Theme | Contents | Gate to next |
|---|---|---|---|
| **1 — Safety & Correctness** | Stop the bleeding | §2.1 publish filter (all surfaces + sitemap); de-index §2.2 mock pages | Manual check: sold/draft not in catalog/sitemap |
| **2 — SEO Integrity** | Index hygiene | Remove/redirect mock pages; verify hreflang/canonical unaffected | Sitemap contains only real, published URLs |
| **3 — Security Hardening** | Abuse resistance | Rate-limit §2.3 routes; delete hardcoded-cred Auth island | Brute-force/flood blocked in test |
| **4 — Dead Code Removal** | Shrink surface | Delete §6 100%-confidence set + barrels/contexts | `lint`+`typecheck`+`build` green; no import breaks |
| **5 — GROQ & Type Dedup** | DRY the data layer | Extract `lib/sanity/groq/` fragments; split `catalog.ts`; collapse `types/domain/*`; drop `as never` at boundaries | Byte-identical query output; build green |
| **6 — Performance** | Payload & CLS | Offline icons; Sanity image loader for `next/image` | LCP/CLS not regressed; visual parity |
| **7 — SaaS Preparation** | Multi-tenant groundwork | Tenant resolution, data isolation, per-tenant domain/branding, authZ, billing | Design-doc + spike only; no prod behavior change |

---

## 15. TOP 30 Tasks by ROI

ROI = business value (blocks listings / blocks onboarding / SEO / maintainability / prod-risk / dev-cost) ÷ effort. P0 = do now.

| # | Task | Anchor | Priority | Effort |
|---|---|---|---|---|
| 1 | Filter `isPublished`/`lifecycleStatus` in catalog | `catalog.ts:130` | P0 | S |
| 2 | Same filter on property detail | `property.ts:9,105,164` | P0 | S |
| 3 | Same filter on homepage | `home.ts:28` | P0 | S |
| 4 | Same filter on sitemap (type + non-geo) | `sitemap.ts:159,295` | P0 | S |
| 5 | De-index 4 mock category pages | `lib/routes/catalog.ts:60-63` | P0 | S |
| 6 | Rate-limit `/api/contact-agent` | route file | P1 | M |
| 7 | Rate-limit `/api/registration-request` | route file | P1 | M |
| 8 | Rate-limit `/api/editor/login` | route file | P1 | M |
| 9 | Delete hardcoded-cred Auth island | `components/Auth/*` | P1 | S |
| 10 | Extract `publishedPropertyFilter` GROQ fragment | new `lib/sanity/groq/` | P1 | S |
| 11 | Remove/redirect mock pages after de-index | `Properties/*` | P1 | M |
| 12 | Delete dead `src/data/*` + barrel | §6 | P2 | S |
| 13 | Delete dead `src/app/api/*.tsx` | §6 | P2 | S |
| 14 | Delete `src/app/context/*` leftovers | §6 | P2 | S |
| 15 | Delete legacy `Breadcrumb/index.tsx` | §5 | P2 | S |
| 16 | Move `components/utils/*` → `lib/` | §4 | P2 | S |
| 17 | Extract `propertyCardFields` GROQ fragment | §7 | P2 | M |
| 18 | Extract `refTriplet` + `imageAsset` fragments | §7 | P2 | M |
| 19 | Split `catalog.ts` god-file | `catalog.ts` | P2 | L |
| 20 | Collapse `types/domain/*` into `types/*` | §3 | P2 | M |
| 21 | Fix `scr`→`src` typo | `featuredProperty.ts:2` | P2 | S |
| 22 | Fix `CatalogProperty` schema mismatches | `property.ts:48` | P2 | M |
| 23 | Extract shared `buildMetadata` for SEO adapters | §5 | P2 | M |
| 24 | Drop `as never` at adapter boundaries | ~80 sites | P2 | L |
| 25 | Offline icon set (drop runtime Iconify) | 37 files | P3 | L |
| 26 | Sanity image loader for `next/image` | ~50 sites | P3 | M |
| 27 | `CatalogBreadcrumb` use shared `breadcrumbs.ts` | §4 | P3 | S |
| 28 | Remove dead `nonGeoDealNavHref.ts` parts | §6 | P3 | S |
| 29 | Consolidate context folders | §4 | P3 | S |
| 30 | SaaS design doc (tenant resolution) | §13 | P3 | L |

---

*End of audit. Companion ready-to-run prompts live in `docs/refactor-prompts/01-…07-…`.*
