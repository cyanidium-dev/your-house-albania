# Technical SEO Audit — www.domlivo.com — 2026-09-20

Method: curl only (no headless render), 1 req/sec, ~85 requests total across robots.txt,
9 sitemaps, 25 sampled sitemap URLs, 10 page-type fetches, 11 root/UA/hygiene checks, plus
read-only inspection of the local Next.js source (`next.config.ts`, `src/middleware.ts`,
`src/app/robots.ts`, `src/lib/seo/envSeo.ts`, city/filters page metadata logic) for ground
truth on redirect and noindex behavior. No `/api/` paths were requested live.

Score: **74/100**

---

## 1. Crawlability

**robots.txt** (`https://www.domlivo.com/robots.txt`) — 200 OK, well-formed:

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

User-Agent: GoogleOther / GoogleOther-Image / GoogleOther-Video / KeenableBot / Amazonbot /
            Bytespider / PetalBot / MJ12bot / DotBot / BLEXBot / SemrushBot / barkrowler
Disallow: /
```

**AI crawler tokens** (GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, PerplexityBot,
Google-Extended, Bingbot, Applebot-Extended, CCBot): **none of these are named anywhere in
robots.txt.** They all fall through to the `User-Agent: *` block (`Allow: /`, `Disallow: /api/`),
so every one of them is currently **allowed** to crawl the whole site except `/api/`. This is a
deliberate-looking default (only low-value/aggressive scraper bots and `GoogleOther*` are
explicitly blocked) but it is worth the owner confirming it's the intended AI-crawler stance,
since Google-Extended/CCBot/Bytespider are lumped with training-data crawlers elsewhere and
usually get an explicit line either way. **No bug — verify intent.**

Sitemap index (`sitemap.xml`) lists 9 children including `sitemap-knowledge.xml`; `robots.txt`'s
own `Sitemap:` directives (`src/app/robots.ts`) only enumerate 8 (missing
`sitemap-knowledge.xml`). Not a functional problem — crawlers reach it via the index — but the
explicit list in `robots.ts` is stale. **Low priority.**

Soft-404 check: `GET /en/property/this-listing-does-not-exist-xyz123` → **404** (not a soft-404).
`GET /en/albania/nonexistentcity123` → **404**. Both return real HTTP 404 with
`Cache-Control: public/private, max-age=0, must-revalidate` (not cached long), so this is a
clean pass.

No `noindex` was found via `X-Robots-Tag` HTTP header on any of the 25 sampled sitemap URLs.

## 2. Sitemaps

| Sitemap | `<url>` entries | lastmod | image:image | xhtml:link (hreflang) |
|---|---|---|---|---|
| sitemap-static.xml | 147 | 147/147 | 0 | 0 |
| sitemap-cities.xml | 13 | 13/13 | 0 | 0 |
| sitemap-types.xml | 84 | 84/84 | 0 | 0 |
| sitemap-non-geo-listings.xml | 42 | 42/42 | 0 | 0 |
| sitemap-properties.xml | 2,625 | 2,625/2,625 | 0 | 0 |
| sitemap-blog.xml | 210 | 210/210 | 0 | 0 |
| sitemap-landings.xml | 184 | 184/184 | 0 | 0 |
| sitemap-districts.xml | 399 | 399/399 | 0 | 0 |
| sitemap-knowledge.xml | 7 | 7/7 | 0 | 0 |
| **Total** | **3,711** | 100% | **0** | **0** |

- **No `image:image` entries anywhere** — property pages clearly carry photos (see §7) but none
  are declared in the image sitemap extension. Medium priority: cheap win for Google Images
  traffic on a listings site.
- **No `xhtml:link` alternates in the sitemaps** — this is separate from and does not replace
  in-page `hreflang`, which is present and correct (see §4). Sitemap-level hreflang is optional
  when page-level hreflang is solid, so this is low priority, but flagging since the task asked.
- **Locale coverage**: `/de/` is present — 528 URLs under `/de/`, on par with `sq` (528), `en`
  (528), `uk` (527), `ru` (528), `it` (528). `pl` has 537 (9 extra, likely PL-specific
  guides/landings). All 7 locales are represented in the sitemaps. **Pass.**
- **lastmod quality**: dates are real and span 2026-03-29 through 2026-09-20T12:48, not a single
  fake stamp. However, 2,079 of the 2,625 property URLs (79%) share the *exact* same timestamp
  `2026-09-18T14:29:35.000Z`, and three more clusters (392/91/56/7 URLs) share single timestamps
  each. This is consistent with `lastmod` reflecting a bulk CMS sync/import rather than genuine
  per-listing edits, which dilutes its signal to Google about what actually changed. **Low
  priority**, cosmetic.
- **25-URL sample check** (`/en`, 2 agent pages, `/en/albania/durres`, `/en/albania/sarande`,
  `/en/albania/durres/plazh`, `/en/albania/durres/near-the-sea`, `/en/albania/durres/1-1`,
  `/en/sale`, `/en/sale/apartment`, 5 property pages across `en/uk/ru/it/de`, 3 blog posts across
  `en/sq/de`, 3 guides across `en/pl/ru`, 3 district pages across `en/sq/de`, `/en/knowledge`):
  **all 25 returned HTTP 200, none redirected, none carried an `X-Robots-Tag: noindex`.** Clean.

## 3. Root `/` behavior

`GET https://www.domlivo.com/` → **307** to `Location: /sq`, sets
`Set-Cookie: NEXT_LOCALE=sq; Path=/; SameSite=lax`, tested with:

| Accept-Language sent | Redirect target |
|---|---|
| (none) | `/sq` |
| `de-DE,de;q=0.9` | `/sq` |
| `ru-RU,ru;q=0.9` | `/sq` |
| `sq-AL,sq;q=0.9` | `/sq` |
| Googlebot UA, no Accept-Language | `/sq` |

**Finding (fresh evidence, contradicts the "redirects by Accept-Language" assumption):** every
variant tested — including German and Russian `Accept-Language` — redirected to `/sq`
(Albanian), never to `/en` or `/de`. This looks like `next-intl`'s `localeDetection` is disabled
(or effectively neutralized) and `/` always falls back to the configured `defaultLocale` (`sq`).
For a site whose own foreign-demand research (see memory: `kp-foreign-demand-2026-09.md`) says
German-locale demand matters, sending German visitors and Googlebot itself to the Albanian
homepage on a bare domain visit is worth a deliberate decision, not an accidental default.
**Medium priority** — confirm this is intentional (e.g., you want one canonical entry point) or
fix locale detection.

x-default in hreflang (see §4) correctly points at `/en` on every page checked, so this is purely
a root-URL redirect-target issue, not an indexing/hreflang issue.

## 4. Canonicals, meta robots, hreflang — per page type

All 10 page types were fetched (normal desktop Chrome UA). hreflang was verified with an
occurrence count fixed for minified single-line HTML (a naive `grep -c` under-counts on a
single-line document — confirmed the real count via `grep -o | wc -l`).

| Page type | URL | Canonical | Meta robots | hreflang alternates |
|---|---|---|---|---|
| Home (en) | `/en` | `https://www.domlivo.com/en` (self) | none (indexable) | 8 (7 locales + x-default) |
| City | `/en/albania/durres` | self | none | 8 |
| District | `/sq/albania/tirana/districts/laprake` | self | none | 8 |
| Facet (feature) | `/en/albania/durres/near-the-sea` | self | none | 8 |
| Facet (type) | `/en/albania/durres/1-1` | self | none | 8 |
| Property | `/en/property/apartment-1-1-plazh-durres-42m2` | self | none | 8 |
| Blog post | `/en/blog/albania-investment-by-budget-and-goal` | self | none | 8 |
| Guide | `/en/guides/albania-vs-croatia` | self | none | 8 |
| City info | `/en/albania/durres/info` | self | none | 8 |
| Pagination p.2 | `/en/albania/durres?page=2` | **`/en/albania/durres`** (base, no `?page=2`) | **`noindex, follow`** | 8 |

hreflang tags use the `hrefLang` DOM property casing Next.js emits (confirmed with
`grep -i`), reciprocal, all 7 locales + `x-default`, on every page type sampled. **Pass — matches
known-good baseline, re-confirmed with fresh evidence.**

Pagination handling is correct textbook practice: self-canonical to page 1, `noindex,follow` on
page 2+, so link equity flows without paginated URLs competing for the same query. **Pass.**

## 5. Cache headers / TTFB per page type

| Page type | Cache-Control | X-Vercel-Cache | Age | TTFB |
|---|---|---|---|---|
| Home | `public, max-age=0, must-revalidate` | HIT | 1370s | 0.175s |
| City (`/[locale]/[country]/[city]/[[...filters]]`) | **`private, no-cache, no-store, max-age=0, must-revalidate`** | **MISS** | 0 | 0.647s |
| District | `public, max-age=0, must-revalidate` | HIT | 24s | 0.453s |
| Facet (feature) | **`private, no-cache, no-store...`** | **MISS** | 0 | 0.522s |
| Facet (type) | **`private, no-cache, no-store...`** | **MISS** | 0 | 0.656s |
| Property | `public, max-age=0, must-revalidate` | HIT | 311s | 0.170s |
| Blog | `public, max-age=0, must-revalidate` | HIT | 48s | 0.539s |
| Guide | `public, max-age=0, must-revalidate` | HIT | 410s | 0.173s |
| City info | `public, max-age=0, must-revalidate` | HIT | 317s | 0.180s |
| Pagination p.2 | **`private, no-cache, no-store...`** | **MISS** | 0 | 0.530s |

**Critical finding:** every URL served by the `/[locale]/[country]/[city]/[[...filters]]` route
— i.e. **every city page, every facet/filter page, and every pagination page** (the highest-
traffic, highest-crawl-volume templates on the site) — is served `private, no-cache, no-store`
with no `X-Nextjs-Prerender` header and `X-Vercel-Cache: MISS` on every single request, no
`Set-Cookie` present to explain it (ruled out — full header dump shows none). This means the
route is fully dynamic (SSR on every hit, not ISR/static), unlike `/en`, `/property/[slug]`,
`/blog/[slug]`, `/guides/[slug]`, and the district route, which all show
`X-Nextjs-Prerender: 1`-style caching and serve from CDN with `Age` growing over time.

Given this project's own history of exceeding **Vercel Hobby CPU/ISR quotas** in September 2026
(see memory: `vercel-hobby-limits.md`), an always-dynamic route that backs the city, facet, and
pagination templates — collectively ~13 cities × 84 type-facets × many feature-facets × N pages
each, i.e. the largest and most bot-crawled URL surface in the sitemaps (`sitemap-types.xml` +
part of `sitemap-cities.xml`, 97+ URLs, each re-rendering server-side on every crawl) — is the
single largest cost/CPU and CWV risk found in this audit. It also directly costs TTFB: 450–660ms
uncached vs. 170–230ms on the cached templates, a ~3x difference that pushes these pages toward
the "Needs Improvement" band for LCP on slower connections. **Critical priority.**

## 6. Security headers, HTTPS, HSTS

Full response headers on `/en` (representative — same set seen on all page types):

```
Strict-Transport-Security: max-age=63072000
X-Powered-By: Next.js
Server: Vercel
```

- HTTPS: enforced, HSTS present with `max-age=63072000` (2 years). **No `includeSubDomains` or
  `preload`** directive — minor hardening gap since the domain and www subdomain are both in
  scope, worth adding both if not already preload-listed.
- **Missing:** `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options` /
  `frame-ancestors`, `Referrer-Policy`, `Permissions-Policy`. None of these appear on any of the
  10 page types checked. This is a real gap — clickjacking (no frame protection) and MIME-sniffing
  (no `nosniff`) protections are both absent site-wide. **High priority** — these are cheap to add
  via `next.config.ts` `headers()` and have no SEO downside, only upside (some crawlers/quality
  signals and Core Web Vitals tooling read CSP posture).
- No mixed content observed in the 10 fetched page bodies (spot-checked `src=`/`href=` for stray
  `http://`; none found — all asset/API references were `https://` or protocol-relative to the
  Sanity CDN).
- `X-Powered-By: Next.js` leaks framework fingerprint — trivial info-disclosure, low priority,
  disable via `poweredByHeader: false` in `next.config.ts` if the team cares.

## 7. JavaScript rendering (SSR vs CSR)

Confirmed via raw `curl` (no JS execution) that on every page type checked, the H1, listing
card titles/prices, and body copy are present in the raw HTML:

- City page raw HTML contains the real H1 (`Durrës Real Estate: Apartments & Property for
  Sale`) and is 591KB with listing content inline, not a JS shell.
- Property page raw HTML contains the real H1 (`One-Bedroom Apartment 70 m from the Beach —
  Plazh, Durres`), price (`€78,000` in `<title>`), and description text server-rendered.
- **Googlebot UA vs Chrome UA parity check** (3 pages: home, city, property): byte-identical
  page size and identical `<title>`/`<h1>` returned to both UAs (city page: 591,351 bytes to
  both). No cloaking, no UA-gated content. **Pass — this is a fully SSR site, no client-render
  dependency for primary content.**

## 8. URL hygiene

| Test | URL | Result |
|---|---|---|
| Trailing slash | `/en/albania/durres/` | **308** → `/en/albania/durres` (correct canonicalization) |
| Uppercase path | `/en/Albania/Durres` | **200** (not redirected), but `<link rel="canonical">` correctly points to the lowercase `/en/albania/durres` |
| Query filter | `/en/albania/durres?bedrooms=1` | **200**, canonical → `/en/albania/durres`, `meta robots: noindex, follow` |
| Soft-404 property | `/en/property/this-listing-does-not-exist-xyz123` | **404** |
| Soft-404 city | `/en/albania/nonexistentcity123` | **404** |
| Pagination `?page=2` | `/en/albania/durres?page=2` | **200**, canonical → base, `noindex, follow` |

The uppercase-path case is a **duplicate crawl path**: `/en/Albania/Durres` is directly
crawlable and returns 200 rather than redirecting, relying entirely on the canonical tag to
prevent indexing of the variant. This works for indexing but still lets bots (and any inbound
links using mixed case) spend crawl budget on a duplicate URL instead of getting redirected at
the edge. **Medium priority** — a case-insensitive 308 redirect to the canonical lowercase path
would be a cleaner fix than relying on canonical alone, especially with the CPU-cost concerns in
§5 (right now a mixed-case hit gets the full dynamic-route cost of §5, not a cheap redirect).

Query-param and pagination handling are both textbook-correct (canonical to clean URL,
`noindex,follow` — link equity flows, duplicate isn't indexed).

## 9. Internal linking depth (from `/en`)

Extracted from the raw HTML of `/en` (no additional requests):

- **Property pages: 1 click** — 10 distinct property URLs linked directly from the homepage
  (e.g. `/en/property/apartment-1-1-plazh-durres-42m2`).
- **City pages: 1 click** — 5 city links directly on the homepage (Durrës, Sarandë, Shëngjin,
  Tiranë, Vlorë).
- **District pages: not directly linked from the homepage** — homepage links go straight to
  city pages, not district pages; district pages are one hop further, i.e. **2 clicks** from
  home via a city page (district links live on the city template, not verified in this pass but
  consistent with URL depth `/en/albania/{city}/districts/{district}`). Since districts *are*
  in the sitemap (399 URLs) this is not an orphan risk, but it does mean district pages depend
  on the city page being crawled/linked, not the homepage directly.
- **Blog posts: 1 click** — 3 blog links directly on the homepage.
- **Guides: 1 click** — 3 guide links directly on the homepage.

No orphan risk detected for the templates checked — the homepage fans out directly to
representative examples of every major template type, and the sitemaps carry the long tail
(2,625 properties, 399 districts) that isn't individually linked from `/en`. Internal linking
depth itself is healthy (≤2 clicks to every template type); the risk is entirely on the
`[[...filters]]` route's per-request cost (§5), not on discoverability.

## 10. HTML weight and DOM size

| Page type | HTML bytes | Approx. tag count (`<letter`) | inline JSON-LD blocks |
|---|---|---|---|
| Home | 554,950 | 1,864 | 4 |
| City | 591,351 | 2,457 | 4 |
| District | 197,612 | 534 | 6 |
| Facet (feature) | 614,371 | 2,616 | 4 |
| Facet (type) | 611,987 | 2,615 | 4 |
| Property | 357,507 | 1,251 | 4 |
| Blog | 239,211 | 759 | 6 |
| Guide | 145,424 | 403 | 6 |
| City info | **746,076** | 3,049 | 4 |
| Pagination p.2 | 601,876 | 2,532 | 4 |

No `__NEXT_DATA__` script tag found on any page (this is an App Router / RSC site, so state is
streamed via React Server Components payloads, not a classic `__NEXT_DATA__` blob — expected,
not a bug).

**Finding:** the catalog-family pages (city, both facets, pagination, and especially city-info
at 746KB) are 550–750KB of HTML with 2,400–3,000+ tags — heavy documents by any standard, and
roughly 2-4x the weight of the editorial pages (blog/guide/district, 145–240KB). Combined with
§5 (these are also the uncached, always-dynamic pages), this is where both CWV risk (parse/render
cost on top of the already-slow TTFB) and Vercel compute cost concentrate. **High priority**,
tied to the §5 caching fix — trimming inline data (e.g., checking whether all facet/filter
options and full listing payloads need to ship on every catalog page load, vs. lazy-loading
secondary filter data) would help both metrics at once.

## 11. IndexNow / verification files

- `next.config.ts` rewrites `/indexnow-:key.txt` → `/api/indexnow-key`, and
  `src/app/api/indexnow-key/route.ts` serves the `INDEXNOW_KEY` env value as `text/plain` (404
  if unset). This confirms the **mechanism exists in code** and is live-or-off behind one env
  var (consistent with memory: `property-localized-urls.md` — "IndexNow live").
- The live key filename could not be verified in this audit without hitting `/api/` (explicitly
  off-limits) or knowing the secret key value in advance — IndexNow key files aren't referenced
  from `robots.txt` or the sitemaps by design (the spec expects search engines to learn the key
  via the submission API, not by crawling it). **Not a gap**, just outside what a passive crawl
  audit can confirm; recommend the owner check Bing Webmaster Tools / IndexNow submission logs
  directly to confirm 200s are being returned on `/indexnow-{key}.txt`.
- No Bing (`msvalidate.01`) or Google (`google-site-verification`) meta tag was found in the
  `<head>` of any of the 10 fetched pages. Ownership may be verified via DNS TXT record instead
  (common for Vercel/Cloudflare-fronted domains and not visible from HTML), so this is **not
  conclusive evidence of a gap** — flagging only because the task asked to check; recommend the
  owner confirm verification method in Search Console / Bing Webmaster Tools directly rather than
  adding a redundant meta tag if DNS verification is already in place.

---

## Prioritized issues

**Critical**
1. `/[locale]/[country]/[city]/[[...filters]]` (every city, facet, and pagination page) is served
   fully dynamic — `Cache-Control: private, no-store`, `X-Vercel-Cache: MISS` on every request,
   no ISR. TTFB 450–660ms vs. 170–230ms on cached templates. Given the site's history of
   exceeding Vercel Hobby CPU/ISR quotas, this is the top compute-cost and CWV risk on the site.
   Evidence: `https://www.domlivo.com/en/albania/durres`, `/en/albania/durres/1-1`,
   `/en/albania/durres/near-the-sea`, `/en/albania/durres?page=2` — all four returned
   `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate` with no `Set-Cookie`
   to explain it.

**High**
2. No `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
   or `Permissions-Policy` headers on any page type. Evidence: full header dump on
   `https://www.domlivo.com/en`.
3. Catalog-family pages (city/facet/pagination/city-info) ship 550–750KB of HTML with
   2,400–3,000+ tags, 2-4x the weight of editorial templates, compounding issue #1. Evidence:
   `https://www.domlivo.com/en/albania/durres/info` (746,076 bytes).

**Medium**
4. Root `/` always redirects to `/sq` regardless of `Accept-Language` (tested de/ru/sq/none/
   Googlebot, all → `/sq`) — confirm this is intentional given German-locale demand is a stated
   priority. Evidence: `curl -H "Accept-Language: de-DE,de;q=0.9" https://www.domlivo.com/` → 307
   to `/sq`.
5. `/en/Albania/Durres` (mixed-case path) returns 200 instead of redirecting to the canonical
   lowercase URL, relying solely on `<link rel="canonical">` — wastes crawl budget on the
   dynamic, expensive route from #1. Evidence: `https://www.domlivo.com/en/Albania/Durres`.
6. No `image:image` entries in any sitemap despite property pages carrying photos. Evidence:
   `sitemap-properties.xml`, 2,625 URLs, 0 `image:image` tags.

**Low**
7. `robots.txt`'s explicit `Sitemap:` list (`src/app/robots.ts`) omits `sitemap-knowledge.xml`,
   which only surfaces via the `sitemap.xml` index. Evidence: `https://www.domlivo.com/robots.txt`
   vs. `https://www.domlivo.com/sitemap.xml`.
8. 79% of `sitemap-properties.xml` lastmod values share one identical timestamp
   (`2026-09-18T14:29:35.000Z`), suggesting bulk-import mtime rather than genuine per-listing
   change tracking.
9. HSTS present but without `includeSubDomains`/`preload`. `X-Powered-By: Next.js` leaks
   framework. AI crawler tokens (GPTBot, ClaudeBot, PerplexityBot, etc.) have no explicit
   robots.txt rule and default-allow via `User-Agent: *` — confirm this is the intended stance.

## What's working well (do not re-break)

- hreflang: 8 reciprocal alternates (7 locales + x-default), correct `hrefLang` casing, present
  on all 10 page types tested, re-confirmed with corrected tooling. Pass.
- Canonicals: self-referencing and correct on every indexable page type; pagination and
  query-filter variants canonicalize to the clean base URL with `noindex, follow`. Pass.
- Hard 404s: nonsense property/city slugs return real 404s, not soft-404s, and aren't cached
  aggressively. Pass.
- SSR/no cloaking: Googlebot UA and Chrome UA get byte-identical HTML; H1/prices/descriptions
  are all in the raw HTML with no JS dependency. Pass.
- Sitemaps: well-formed, 100% lastmod coverage, all 7 locales including `/de/` present with
  comparable URL counts, 25/25 sampled URLs return clean 200s with no stray noindex/redirect.
- URL structure: trailing slashes 308-redirect correctly; internal linking reaches every major
  template type within 1-2 clicks of the homepage with no orphan risk found.

Evidence files (raw headers/HTML captured during this audit) are in the scratchpad and not
committed to the repo; all figures above are reproducible with the exact `curl` commands
described per section.
