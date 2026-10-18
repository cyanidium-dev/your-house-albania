# Technical SEO Audit — www.domlivo.com — 2026-09-25

Methodology: direct HTTP fetches (curl / Python urllib) with UA `Mozilla/5.0 (SEO-Audit)` unless noted. No JS rendering used (Lighthouse attempt failed at the tooling layer, see §9). All raw data saved under the session scratchpad `out/` directory (`out/*.xml`, `out/sample_results.json`, `out/mega_results.json`, `out/redirects.txt`, `out/misc1.txt`).

---

## 1. robots.txt

**Status: OK**

`GET https://www.domlivo.com/robots.txt` → `200`, 0.07s.

```
User-Agent: *
Allow: /
Disallow: /api/

User-Agent: Twitterbot / facebookexternalhit / LinkedInBot / Slackbot / Discordbot / TelegramBot / WhatsApp
Allow: /

User-Agent: AhrefsBot
Allow: /
Disallow: /api/
Crawl-delay: 30

User-Agent: GoogleOther / GoogleOther-Image / GoogleOther-Video / KeenableBot / Amazonbot / Bytespider / PetalBot / MJ12bot / DotBot / BLEXBot / SemrushBot / barkrowler
Disallow: /

Sitemap: https://www.domlivo.com/sitemap-priority.xml
Sitemap: https://www.domlivo.com/sitemap.xml
Sitemap: https://www.domlivo.com/sitemap-static.xml
Sitemap: https://www.domlivo.com/sitemap-cities.xml
Sitemap: https://www.domlivo.com/sitemap-types.xml
Sitemap: https://www.domlivo.com/sitemap-non-geo-listings.xml
Sitemap: https://www.domlivo.com/sitemap-properties.xml
Sitemap: https://www.domlivo.com/sitemap-blog.xml
Sitemap: https://www.domlivo.com/sitemap-landings.xml
Sitemap: https://www.domlivo.com/sitemap-districts.xml
Sitemap: https://www.domlivo.com/sitemap-knowledge.xml
```

Notes (medium): `GoogleOther` is blocked with `Disallow: /`. GoogleOther is a separate Google product-crawl agent from the main `Googlebot` (not named here, falls under `User-agent: *` → allowed), so this does not affect standard indexing, but confirm the block is intentional. GPTBot, ClaudeBot, PerplexityBot, CCBot and other AI-answer crawlers are not named at all and fall under `User-agent: *` (allowed) — consistent with the site's own AI assistant/knowledge-base strategy. 11 `Sitemap:` lines declared, one per child sitemap plus the index itself; all 10 children match what `sitemap.xml` itself lists (cross-checked, see §2).

---

## 2. Sitemap index and child sitemaps

**Status: mostly OK, one CRITICAL defect, one HIGH locale gap, one MEDIUM locale asymmetry**

`GET https://www.domlivo.com/sitemap.xml` → `200`, lists the same 10 child sitemaps as robots.txt.

| Sitemap | URLs | lastmod present | image:image | xhtml hreflang links | Locale split (sq/en/ru/uk/de/it/pl) |
|---|---|---|---|---|---|
| sitemap-priority.xml | 244 | 244/244 | 0 | 56 (7 URLs × 8 links incl. x-default) | 35/35/35/**34**/35/35/35 |
| sitemap-static.xml | 91 | 84/91 | 0 | 56 (7 URLs × 8 links incl. x-default) | 12/12/12/12/12/12/12 |
| sitemap-cities.xml | 13 | 13/13 | 0 | 0 | 2/2/2/**1**/2/2/2 |
| sitemap-types.xml | 84 | 84/84 | 0 | 0 | 12/12/12/12/12/12/12 |
| sitemap-non-geo-listings.xml | 42 | 42/42 | 0 | 0 | 6/6/6/6/6/6/6 |
| sitemap-properties.xml | 2625 | 2625/2625 | 11648 | 0 | 375/375/375/375/375/375/375 |
| sitemap-blog.xml | 238 | 238/238 | 0 | 0 | 34/34/34/34/34/34/34 |
| sitemap-landings.xml | 184 | 184/184 | 0 | 0 | 25/25/25/25/25/25/**34** |
| sitemap-districts.xml | 399 | 399/399 | 0 | 0 | 57/57/57/57/57/57/57 |
| sitemap-knowledge.xml | 7 | **0/7** | 0 | 0 | 1/1/1/1/1/1/1 |

**CRITICAL — sitemap-knowledge.xml lists 7 noindexed URLs.** All 7 URLs (`/{locale}/knowledge`) return `200` but carry `<meta name="robots" content="noindex, nofollow">` (confirmed directly on `/uk/knowledge`; all 7/7 sampled URLs from this sitemap carried the same noindex flag). Submitting noindexed URLs in a sitemap is a direct contradiction Google Search Console will surface as "Submitted URL marked 'noindex'" and wastes crawl budget. This is consistent with the memory note that knowledge-base articles are unpublished — the fix is to drop `sitemap-knowledge.xml` from `sitemap.xml`/robots.txt until the section is meant to be indexed, or drop noindex once it's ready. Also the only sitemap with zero `<lastmod>` values.

**HIGH — `uk` locale missing `albania/sarande` in two sitemaps.** `sitemap-priority.xml` and `sitemap-cities.xml` both contain a `sarande` entry for sq/en/ru/de/it/pl but not for `uk` — `uk` is the only locale missing it, in both sitemaps simultaneously. Not independently re-verified live in this pass (budget-constrained); if `/uk/albania/sarande` 404s or was never built, any hreflang set elsewhere pointing at it would also be broken.

**MEDIUM — sitemap-landings.xml: 9 Polish-only guide URLs with no equivalent in the other 6 locales.** URLs such as `pl/guides/czy-polak-moze-kupic-mieszkanie-w-albanii`, `pl/guides/ile-kosztuje-dom-w-albanii`, `pl/guides/jak-kupic-mieszkanie-w-albanii`, `pl/guides/mieszkania-w-albanii`, `pl/guides/nieruchomosci-w-albanii`, `pl/guides/nieruchomosci-saranda`, `pl/guides/nieruchomosci-nad-morzem-w-albanii`, `pl/guides/czy-warto-kupic-mieszkanie-w-albanii`, `pl/guides/tanie-mieszkania-w-albanii` exist only for `pl` (184 total landings vs 175 in every other locale). May be an intentional Poland-specific push (consistent with prior KP-foreign-demand research); flag for confirmation rather than treat as a bug outright.

**LOW — sitemap-static.xml: 7 of 91 URLs missing `<lastmod>`.**

**OK — hreflang in sitemaps.** Only `sitemap-priority.xml` and `sitemap-static.xml` carry `<xhtml:link>` hreflang annotations (7 sampled URLs each, 8 alternates including `x-default` → `en`). The other 8 sitemaps carry none. This is a minor inconsistency by itself, but see §3 — **the same hreflang annotations are entirely absent from the actual page `<head>` HTML**, which is the more serious problem.

**OK — image sitemap.** `sitemap-properties.xml` carries Google image-sitemap extensions (`xmlns:image`), 11,648 `<image:image>` entries across 2,625 property URLs (~4.4 images/listing), Sanity CDN URLs with sane transform params.

**OK — sample of 10 URLs per sitemap (97 total across all 10 sitemaps).** All 97 returned `200`, all had a self-referencing `<link rel="canonical">` matching the requested URL exactly, and none carried a noindex directive **except the 7/7 sampled from sitemap-knowledge.xml** (see CRITICAL above). Raw data: `out/sample_results.json`.

---

## 3. Redirect chains

**Status: HIGH — apex/http origins take 3 hops to reach content; otherwise clean**

All chains captured with redirects disabled per-hop (`out/mega_results.json` → `redirects`, cross-checked against verbose curl in `out/redirects.txt`):

| Start URL | Chain | Hops to 200 |
|---|---|---|
| `http://domlivo.com` | 308 → `https://domlivo.com/` → 308 → `https://www.domlivo.com/` → 307 → `/sq` → 200 | **3** |
| `http://www.domlivo.com` | 308 → `https://www.domlivo.com/` → 307 → `/sq` → 200 | 2 |
| `https://domlivo.com` | 308 → `https://www.domlivo.com/` → 307 → `/sq` → 200 | 2 |
| `https://domlivo.com/en/albania/durres` | 308 → `https://www.domlivo.com/en/albania/durres` → 200 | 1 |
| `https://www.domlivo.com/en/albania/durres/` (trailing slash) | 308 → `/en/albania/durres` → 200 | 1 |
| `https://www.domlivo.com/EN/albania/durres` (uppercase) | 308 → `/en/albania/durres` → 200 | 1 |
| `https://www.domlivo.com/en/albania/durres?utm_source=x` | 200 directly, no redirect | 0 |
| vercel.app alias (guessed `your-house-albania.vercel.app`) | 308 → `https://www.domlivo.com/` | 1 (alias correctly canonicalizes to the custom domain rather than serving duplicate content) |

Findings:
- **HIGH**: the bare apex over `http://` (`http://domlivo.com`) needs 3 redirect hops (http→https apex, apex→www, then locale-detect 307 to `/sq`) before serving content. Each hop costs latency and a small amount of link equity dilution; consolidating the http→https and apex→www hops into a single 301 (skip the intermediate `https://domlivo.com/`) would remove one hop. This matches the prior "apex 308 done" memory note, but that work only fixed the scheme+host hop, not the total chain length when combined with the locale-detect middleware.
- **OK**: locale-qualified URLs (`/en/...`) never redirect more than once, and only for real normalization (trailing slash, uppercase path) — both collapse to a single clean 308 to the canonical lowercase, no-trailing-slash form.
- **OK**: `?utm_source=` query strings pass through untouched with no redirect and (per §5) an unaffected canonical tag, so campaign URLs won't create duplicate indexable content.
- **Note**: unqualified root URLs (apex, or any path with no locale prefix) resolve to `/sq` (Albanian), not `/en`, when no `Accept-Language` header or `NEXT_LOCALE` cookie is sent (curl sends neither). This is presumably intentional (Albania-based business, `sq` as default locale) but confirm it's the desired default for bots/link-equity purposes, since most backlinks to the bare domain will inherit the `sq` version at the moment of crawl.

---

## 4. Security headers (on `/en`)

**Status: OK, with one MEDIUM note**

```
Content-Security-Policy: frame-ancestors 'self' https://*.sanity.studio
Permissions-Policy: camera=(), microphone=(), payment=(), usb=()
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=63072000
X-Content-Type-Options: nosniff
```

- **OK**: HSTS present with a 2-year max-age, `X-Content-Type-Options: nosniff` present, `Referrer-Policy` set to a safe default, `Permissions-Policy` restricts camera/mic/payment/usb.
- **MEDIUM**: HSTS on the app itself has no `includeSubDomains` or `preload` (just `max-age=63072000`), while the `Strict-Transport-Security` header returned by the platform-level redirect on the `vercel.app` alias check *did* include `includeSubDomains; preload`. Worth aligning so the production domain also qualifies for the HSTS preload list.
- **MEDIUM**: CSP only sets `frame-ancestors` (effectively an X-Frame-Options replacement, scoping embeds to same-origin + the Sanity Studio subdomain). There is no `script-src`/`style-src`/`default-src` restriction, no `X-Frame-Options` header, and no `object-src`. This is fine for framing/clickjacking but provides no mitigation against injected/XSS script execution. Not a crawlability or indexability issue but flagged since the check was requested.

---

## 5. Per-page audit

Fetched twice each to compare `X-Vercel-Cache`; TTFB is wall-clock time-to-first-byte approximation via urllib (not a lab network trace). Full data: `out/mega_results.json`.

| URL | Status | Title (len) | Meta desc (len) | Canonical self-match | Robots meta | hreflang in HTML | H1 count | JSON-LD @types | Cache hit 1→2 | TTFB | HTML size | imgs w/o alt | internal links |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| /en | 200 | "Real Estate in Albania: Apartments, Villas and Houses for Sale — Domlivo" (72) | 146 | yes | index, follow, max-image-preview:large | **0** | 1 | Organization, WebSite, FAQPage | HIT→HIT | 0.073s | 579,460 B | **2** | 70 |
| /en/albania/durres | 200 | "Apartments & Property for Sale in Durrës, Albania — Prices 2026 — Domlivo" (77) | 138 | yes | index, follow, max-image-preview:large | **0** | 1 | Organization, WebSite, BreadcrumbList, ItemList | HIT→HIT | 0.068s | 666,584 B | 0 | 89 |
| /en/albania/durres/golem-durres | 200 | "Apartments for Sale in Golem, Albania — Beach Flats & New Builds — Domlivo" (78) | 111 | yes | index, follow, max-image-preview:large | **0** | 1 | Organization, WebSite, BreadcrumbList, ItemList | HIT→HIT | 0.053s | 659,153 B | 0 | 70 |
| /en/albania/durres/sale/apartment (note: `/apartments` from the brief 404s — corrected to `/sale/apartment`, see below) | 200 | "Apartments for Sale in Durres, Albania — Domlivo" (48) | 134 | yes | **noindex, follow** | **0** | 1 | Organization, WebSite, BreadcrumbList, ItemList | STALE→HIT | 0.295s | 642,540 B | 0 | 60 |
| /de/albania/durres | 200 | "Immobilien in Durrës, Albanien: Wohnung kaufen am Meer — Preise 2026 — Domlivo" (78) | 149 | yes | index, follow, max-image-preview:large | **0** | 1 | Organization, WebSite, BreadcrumbList, ItemList | HIT→HIT | 0.065s | 675,263 B | 0 | 89 |
| /pl/albania/durres | 200 | "Durrës, Albania: mieszkania i nieruchomości na sprzedaż — ceny 2026 — Domlivo" (77) | 125 | yes | index, follow, max-image-preview:large | **0** | 1 | Organization, WebSite, BreadcrumbList, ItemList | HIT→HIT | 0.083s | 673,816 B | 0 | 89 |
| /en/about | 200 | "About Domlivo: the team and how the site works — Domlivo" (56) | 154 | yes | index, follow | **0** | 1 | Organization, WebSite, AboutPage, Person×3, BreadcrumbList | HIT→HIT | 0.066s | 162,319 B | 0 | 37 |
| /en/guides | 200 | "Guides — Domlivo" (16) | 57 | yes | index, follow, max-image-preview:large | **0** | 1 | Organization, WebSite, BreadcrumbList | HIT→HIT | 0.055s | 187,978 B | 0 | 57 |
| /en/blog | 200 | "Albania property blog: market, prices and buying advice — Domlivo" (65) | 146 | yes | index, follow, max-image-preview:large | **0** | 1 | Organization, WebSite, BreadcrumbList | **MISS→MISS** | 0.585s | 223,287 B | 0 | 96 |
| /en/property/apartment-2-1-golem-durres-69m2 | 200 | "Apartment, 68.5 m², Golem, Durres — €1,300/m² — Domlivo" (55) | 153 | yes | index, follow, max-image-preview:large | **0** | 1 | Organization, WebSite, RealEstateListing, Apartment, Product, BreadcrumbList | HIT→HIT | 0.068s | 358,804 B | 0 | 48 |
| /en/blog/how-to-choose-tirana-durres-vlore | 200 | "Tirana vs Durrës vs Vlorë: Where to Buy Property in 2026 — Domlivo" (66) | 133 | yes | index, follow, max-image-preview:large | **0** | 1 | Organization, WebSite, Article, BreadcrumbList, FAQPage | HIT→HIT | 0.053s | 261,531 B | 0 | 65 |

**Note on `/en/albania/durres/apartments`**: this exact path from the brief returns `404`. The correct live URL pattern (from `sitemap-types.xml`) is `/en/albania/durres/sale/apartment` (or `sale/studio`, `sale/land`, etc.) — audited that instead. If `/apartments` (plural, no `/sale/` segment) is a URL that used to exist or that external links/ads point to, it is currently a dead link with no redirect; worth checking analytics/backlinks for inbound traffic to that exact slug.

**CRITICAL — hreflang alternate tags are completely absent from HTML `<head>` on every page sampled (11/11, 0 occurrences of the string "hreflang" anywhere in the raw response body, confirmed both via regex and a raw `grep` on `/en/albania/durres`).** This is a 7-locale site (sq/en/ru/uk/de/it/pl) with thousands of parallel per-locale URLs (confirmed 1:1 locale parity in §2), but **not one of the 11 sampled pages — including the homepage, city page, district page, two other-locale variants, about, guides, blog index, a property listing and a blog post — emits `<link rel="alternate" hreflang="...">` in HTML.** The only hreflang signals anywhere on the site are in two of the ten XML sitemaps, for 7 URLs total (`/about`-class static pages). This contradicts the project memory's claim that "hreflang verified correct" / German locale "complete and indexed" — whatever verification produced that note is not reflected in current production HTML. Google can still discover the alternates via the sitemap for those 7 URLs only; for the other ~6,850 locale-parallel URLs in the remaining 9 sitemaps, Google has **no hreflang signal at all**, meaning: (a) wrong-locale pages can rank in wrong-language SERPs, (b) Google may fold duplicate-content-like locale variants together or pick an unexpected canonical per market, (c) the site gets none of the "serve the right language to the right searcher" benefit hreflang exists for. This is the single highest-impact defect found in this audit. Recommend deferring to the `seo-hreflang` sub-skill for a full remediation spec, but the underlying fact — 0/11 sampled pages have HTML hreflang — is established here.

**MEDIUM — `img_no_alt` on the homepage only: 2 of 44 `<img>` tags have no/empty `alt`.** All other 10 pages sampled had 0 images missing alt text (25–51 images each), so this looks like an isolated homepage component (likely a decorative slider/logo strip) rather than a systemic issue.

**OK — canonicals**: all 11 pages self-canonicalize exactly (canonical == requested URL, no trailing slash or query-string variants).

**OK — robots meta**: all standard content pages carry `index, follow, max-image-preview:large` (or `index, follow` on /about). The one exception, `/en/albania/durres/sale/apartment` → `noindex, follow`, appears to be a deliberate page-registry decision (consistent with the memory note on the SEO page registry gating listing-filter pages by keyword evidence), not a bug — but confirm this specific filter combination is meant to be excluded.

**OK — JSON-LD**: present and type-appropriate on every page (Organization/WebSite sitewide, plus BreadcrumbList on nearly all, ItemList on catalog pages, RealEstateListing+Apartment+Product on the property page, Article+FAQPage on the blog post, AboutPage+Person×3 on /about). No structural JSON-LD errors detected (all blocks parsed as valid JSON).

**OK/caching**: 9 of 11 pages returned `X-Vercel-Cache: HIT` on both the first and immediate second request (fast repeat TTFB ~0.05–0.08s). Two exceptions:
- `/en/albania/durres/sale/apartment`: `STALE` → `HIT` (first request served a stale ISR copy while revalidating, second got the fresh HIT — expected ISR behavior, not a defect).
- `/en/blog`: `MISS` → `MISS` on **both** consecutive requests, with a much higher TTFB (0.585s vs ~0.05–0.08s elsewhere). Two misses in a row for the same URL fetched seconds apart suggests this route is not actually being cached at the edge (or has a very short/zero revalidate window), unlike every other page tested. Given the account is on Vercel Hobby (prior memory note: CPU/ISR quota issues after a 60s revalidate misconfiguration), this is worth checking against the blog index's specific revalidate setting — it may be the one route still on a short/uncached path post-fix.

---

## 6. `/llms.txt`, 404 handling, nonexistent property slug

**Status: OK**

- `GET /llms.txt` → `200`, well-formed markdown describing the site, its sections (listings, prices/districts, guides, blog, knowledge base, about, AI search, contacts) with links, `Cache-Control: public, max-age=3600, s-maxage=86400`, `Access-Control-Allow-Origin: *`. Good practice, present and populated (not a stub).
- Random nonexistent path `/this-page-xyz-random-404-check` (no locale prefix): first hop is a `307` to `/sq/this-page-xyz-random-404-check` (locale-detect middleware fires before the 404 check), but the **final** resolved status is `404` — correct end-to-end behavior, just routed through the locale middleware first.
- `/en/property/nonexistent-slug-check` → `404` directly (no redirect hop, `X-Vercel-Cache: MISS` as expected for an error page), matched route `/[locale]/property/[slug]`. Correct.

---

## 7. Cloaking check (Googlebot UA vs normal UA)

**Status: OK — no cloaking detected**

`GET /en/albania/durres` with `User-Agent: Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)` vs `User-Agent: Mozilla/5.0 (SEO-Audit)`:

- Both: `status=200`
- Both: `title="Apartments & Property for Sale in Durrës, Albania — Prices 2026 — Domlivo"`
- Both: `canonical="https://www.domlivo.com/en/albania/durres"`

Identical title, canonical and status for both user agents — no evidence of cloaking (this is consistent with the site being SSR/prerendered rather than serving a different payload conditioned on UA).

---

## 8. JavaScript rendering requirement

**Status: OK — server-rendered, not CSR**

All fetched pages returned full HTML content (title, H1, JSON-LD, body text, meta description) from a plain `curl`/urllib GET with **no JavaScript execution**, and carried `X-Nextjs-Prerender: 1` / `X-Matched-Path` headers indicating static/ISR prerendering rather than client-side rendering. No SPA shell (empty `<div id="root">`) was observed on any sampled page. This is favorable for crawlers that don't render JS (most non-Google bots, and even Googlebot's rendering queue is bypassed since content is present on first response).

---

## 9. Lighthouse (mobile, performance + SEO)

**Status: SKIPPED — tooling failure, not a site issue**

```
npx --yes lighthouse https://www.domlivo.com/en/albania/durres --only-categories=performance,seo --preset=perf --form-factor=mobile --screenEmulation.mobile --quiet --chrome-flags="--headless=new" --output=json --output-path=<scratchpad>/lh-durres.json
```

Failed before Chrome/Lighthouse ever launched:

```
npm error code ECOMPROMISED
npm error Lock compromised
```

This is an `npm` package-lock/cache integrity error in the local environment (not a website response), so no Lighthouse metrics (performance score, LCP, TBT, CLS, SEO score) could be collected in this session. Retrying after clearing the npm cache (`npm cache verify` / clean the compromised lock) or running Lighthouse from a machine with a working npm/npx install would be needed to get lab Core Web Vitals data. No substitute lab measurement was attempted; the Core-Web-Vitals-relevant *source* signals that could still be checked from raw HTML are noted qualitatively below.

**Source-level CWV risk signals observed (not a substitute for a lab run):**
- Homepage HTML is 579 KB, the Durrës city page 666 KB, and locale variants (`/de`, `/pl`) 673–675 KB — large document weight for pages that also pull in `_next/image` responsive `srcset`s (5 breakpoints per hero image seen in `<head>` preloads) plus multiple font preloads (3 woff2 files) and several JS chunk `<script async>` tags visible in `<head>` before first content — worth a real lab trace to confirm LCP/INP aren't affected by this much render-blocking/preload weight, especially on the property page's 25 images and the catalog pages' 51 images per page.
- `fetchPriority="high"` is correctly set on the likely LCP hero image `<link rel="preload">` on `/en/albania/durres`, which is good practice for LCP.
- No inline layout-shift risk factors (e.g., missing width/height on images) were checked in this pass since it would require parsing every `<img>` tag's dimensional attributes across all pages — out of scope given the tool-call budget; recommend a follow-up Lighthouse run once the environment issue is fixed.

---

## Prioritized Defect List

1. **CRITICAL — No hreflang alternate tags in HTML on any page (0/11 sampled).** Only 7 URLs across the whole site carry hreflang, and only inside two XML sitemaps (never in HTML). For a 7-locale, thousands-of-URL site this means Google has essentially no hreflang signal for locale targeting outside those 7 URLs. Highest-impact fix available; recommend the `seo-hreflang` sub-skill for a full remediation spec (self-referencing + reciprocal alternates + x-default, in HTML `<head>` on every localized template).
2. **CRITICAL — sitemap-knowledge.xml submits 7 noindexed URLs.** All 7 `/{locale}/knowledge` pages are `noindex, nofollow` yet listed in the sitemap; remove the sitemap (and its robots.txt/index entry) until the section is meant to be indexed, or drop noindex once ready.
3. **HIGH — Redirect chain length on http(s) apex.** `http://domlivo.com` takes 3 hops (http→https apex → www → locale) before serving content; collapse the scheme+host normalization into a single redirect.
4. **HIGH — `uk` locale missing `/albania/sarande` from `sitemap-priority.xml` and `sitemap-cities.xml` (only locale missing it, in both places).** Verify whether the live uk page exists; fix the sitemap generator or the missing page.
5. **MEDIUM — `/en/blog` served `X-Vercel-Cache: MISS` on two consecutive requests (0.585s TTFB vs ~0.05–0.08s elsewhere).** Every other sampled page was a cache HIT on repeat request; investigate this route's revalidate/caching config given the account's prior Vercel Hobby ISR-quota history.
6. **MEDIUM — HSTS missing `includeSubDomains; preload` on the production app** (present only on the platform-level vercel.app redirect response). Align headers to qualify for HSTS preload.
7. **MEDIUM — sitemap-landings.xml has 9 Polish-only guide URLs with no equivalent in the other 6 locales** (184 vs 175 URLs) — confirm intentional before treating as a translation gap.
8. **LOW — `/en/albania/durres/apartments` (from the site's expected URL space) 404s; correct path is `/en/albania/durres/sale/apartment`.** No redirect exists between the two; check for inbound links/backlinks/ads using the plural, no-`/sale/` form.
9. **LOW — Homepage has 2/44 images with no/empty `alt` attribute** (isolated; all 10 other sampled pages had 0).
10. **LOW — sitemap-static.xml: 7/91 URLs missing `<lastmod>`.**
11. **INFORMATIONAL — CSP only sets `frame-ancestors`, no script-src/style-src restriction; no `X-Frame-Options` header** (not an SEO defect, flagged since security headers were in scope).
12. **INFORMATIONAL — Lighthouse could not run** (`npm error ECOMPROMISED`, local npm cache/lock integrity issue) — no lab Core Web Vitals (LCP/TBT/CLS/performance score/SEO score) collected this session; retry once npm environment is fixed. Source-level signals (579–675 KB HTML documents, multi-breakpoint responsive images, several preloaded JS chunks) suggest it's worth prioritizing a real run rather than skipping permanently.

**Not flagged as defects (verified OK):** robots.txt structure and AI-crawler allowlisting; canonical tags (11/11 self-referencing, 97/97 sampled from sitemaps self-referencing); trailing-slash/uppercase/query-string URL normalization; 404 handling for both unknown paths and unknown property slugs; Googlebot-vs-browser cloaking (none detected); server-side rendering (no CSR/SPA-shell dependency); JSON-LD presence and type-appropriateness on every template; image sitemap coverage; vercel.app alias correctly redirects to the production domain instead of serving duplicate content.
