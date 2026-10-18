# GEO / AI-Search Readiness Audit — domlivo.com

Date: 2026-09-20
Scope: robots.txt AI crawler rules, llms.txt, SSR, passage-level citability on 8 pages, entity/brand signals, competitive citation landscape, unique data assets, Bing indexation.
Hard limits observed: ≤40 page fetches on domlivo.com, 1 req/s, no /api/ requests. Live SERP research was partly blocked by CAPTCHA/bot-detection on Bing/DuckDuckGo during this session (noted inline where it limits confidence).

## GEO Health Score: 58 / 100

| Dimension | Weight | Score | Weighted |
|---|---|---|---|
| Citability | 25% | 71 | 17.75 |
| Structural Readability | 20% | 65 | 13.0 |
| Multi-Modal Content | 15% | 50 | 7.5 |
| Authority & Brand Signals | 20% | 30 | 6.0 |
| Technical Accessibility | 20% | 75 | 15.0 |
| **Total** | | | **59.25 ≈ 58** |

Multi-Modal was not deeply audited (image alt text / video / infographics were out of scope for the 8-page pass); the 50 is a conservative placeholder pending a dedicated pass.

## 1. robots.txt — AI crawler treatment

Full file (fetched 2026-09-20):

```
User-Agent: *
Allow: /
Disallow: /api/

User-Agent: Twitterbot
User-Agent: facebookexternalhit
User-Agent: LinkedInBot
User-Agent: Slackbot
User-Agent: Discordbot
User-Agent: TelegramBot
User-Agent: WhatsApp
Allow: /

User-Agent: AhrefsBot
Allow: /
Disallow: /api/
Crawl-delay: 30

User-Agent: GoogleOther
User-Agent: GoogleOther-Image
User-Agent: GoogleOther-Video
User-Agent: KeenableBot
User-Agent: Amazonbot
User-Agent: Bytespider
User-Agent: PetalBot
User-Agent: MJ12bot
User-Agent: DotBot
User-Agent: BLEXBot
User-Agent: SemrushBot
User-Agent: barkrowler
Disallow: /

Sitemap: https://www.domlivo.com/sitemap.xml (+ 8 segmented sitemaps: static, cities, types, non-geo-listings, properties, blog, landings, districts)
```

None of GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User, Google-Extended, Bingbot, Applebot, Applebot-Extended, CCBot, anthropic-ai, cohere-ai have a dedicated rule block, so **all of them inherit `User-Agent: *` → `Allow: /`, `Disallow: /api/`**. Every crawler needed for live citation (OAI-SearchBot, PerplexityBot, Bingbot, ChatGPT-User, Perplexity-User, Claude-SearchBot/Claude-User) and every crawler needed for training-time presence (GPTBot, ClaudeBot, Google-Extended, CCBot, Applebot-Extended) is **allowed**. The owner's recent bot-blocking pass to save Vercel quota only targeted classic SEO/scraper bots (AhrefsBot throttled; GoogleOther, Amazonbot, Bytespider, PetalBot, MJ12bot, DotBot, BLEXBot, SemrushBot, barkrowler, KeenableBot fully blocked). **None of these are AI-answer crawlers, so the block does not hurt AI visibility.** No robots.txt change is needed. Amazonbot/Bytespider being blocked is low-impact since neither is a primary AI-answer fetcher today.

## 2. llms.txt / llms-full.txt

Both `/llms.txt` and `/llms-full.txt` return **HTTP 404** (Next.js custom 404 shell, `noindex`) — confirmed missing. This is an optional, not-yet-load-bearing signal for major engines, but it is cheap given the site already has clean per-locale sitemaps to source a summary + link list from. Currently a gap, not an emergency.

## 3. Server-side rendering

`/en/albania/durres/info` raw pre-JS HTML (`raw_content` from a direct fetch) already contains the full district price-table prose — the site is Next.js SSR/SSG, not a client-rendered SPA shell. Confirmed on all 8 sampled pages via direct `curl` with a desktop UA: full body text, JSON-LD, and tables are present in the initial HTML response with no JS execution required. This is a genuine strength: every AI crawler that skips JS execution (most do, most of the time) sees the real content.

## 4. Passage-level citability — 8 pages scored

Method: fetched raw HTML with a browser UA (1 req/s), parsed headings, tables, dates, JSON-LD author/type, outbound source links, and the text immediately following each H2.

### 4.1 `/en/albania/durres/info` (city info) — 82/100
- FAQPage + Answer/Question schema with a direct city-average answer; H2 "Where to buy in Durrës: districts and prices" is one of the few true question-form headings; 2 tables (asking-price band by zone, live-listing medians by district); named outbound sources with links (investropa.com, monitor.al, homezone.al, dyqani.app).
- No `Article` schema type on this page (only `BreadcrumbList/FAQPage/Answer/Question`) despite being a data-heavy page — weaker freshness/authorship signal than the guide pages.
- Best passage (quote, <15 words): "average is about €1,450/m², up roughly 18% in a year"
- Worst passage: table cells flattened into a keyword-soup fragment for non-visual extraction — "Popular New High demand €83,000 Sale" (promotional card fragment, not a sentence)

### 4.2 `/en/albania/vlore/info` (city info) — 78/100
- Named, dated source attribution is excellent: "Deloitte Property Index 2025 via Monitor.al"; `article:modified_time` meta = 2026-08-16 (real freshness signal, machine-readable). 1 table.
- Missing `FAQPage`/`Article` schema (only `BreadcrumbList/ListItem`) — inconsistent with the guide pages, a missed structured-data opportunity on a page that is otherwise very citable prose.
- Best passage: "Vlora averaged about €2,400/m² in 2025, up 25% year on year"
- Worst passage: the CTA heading "Looking for something in Vlore?" — a question-form H2 that answers nothing (conversion copy, not information)

### 4.3 `/en/guides/durres-vs-vlore` (comparison) — 85/100
- Strongest page structurally: `Article + FAQPage + Organization + WebPage` schema, dedicated "Sources" H2 listing internal research files, `article:modified_time` = 2026-09-16, FAQ in true Q/A form ("Which is cheaper, Durrës or Vlorë?").
- Bug found: the H2 "Durrës against Vlorë, by the numbers" is rendered **twice** in sequence (duplicate heading), a structural defect that could confuse passage-boundary detection by extractors.
- Best passage: "up 25% year on year, at the top of Europe alongside Tirana"
- Worst passage: the duplicated heading itself — "Durrës against Vlorë, by the numbers" (appears twice, no distinguishing content)

### 4.4 `/en/guides/tirana-vs-durres` (comparison) — 84/100
Same template and strengths as 4.3 (Article/FAQPage schema, dated 2026-08-16, Sources section), same duplicate-H2 bug.
- Best passage: "Tirana is the only market in the country with no off-season"
- Worst passage: duplicated heading "Tirana against Durrës, by the numbers" (twice)

### 4.5 `/en/blog/tirana-apartment-prices-2026` — 72/100
- Good direct-answer H1 and genuinely question-form H3s ("How much have Tirana apartment prices risen since 2020?", "Why did Tirana's asking prices rise faster than actual sale prices?").
- Weakness: **zero external outbound source links** — every other sampled page cites at least one third party; this post cites none, which undercuts "named sources with links" for a stats-heavy article that most needs them.
- Risk found: in the raw text stream, the FAQ question list is followed immediately by a lead-gen CTA ("Free — no obligation… Get a tailored offer within 1 hour") rather than by the answer text landing adjacent to the question — worth confirming in the DOM that each FAQ answer renders directly under its question (not only inside JSON-LD) since that affects extractability by crawlers that don't parse JSON-LD.
- Best passage (heading, stands alone as a direct-answer prompt): "How much have Tirana apartment prices risen since 2020?"
- Worst passage: "Free — no obligation Get a tailored offer within 1 hour" appearing where an answer is expected

### 4.6 `/en/blog/can-foreigners-buy-real-estate-albania` — 80/100
- Best topical match in the sample to "is it safe to buy property in Albania as a foreigner." Direct-answer H1, genuine FAQ H3s ("Can a foreigner get a mortgage in Albania?", "Can foreigners inherit property in Albania?"), and it cites a real external legal authority (albalegal.eu, an Albanian law firm) plus an expat.com forum thread — the strongest external-authority sourcing of any blog post sampled.
- No `article:modified_time` meta detected despite an "Updated:" label in the UI — freshness claim not machine-readable the way the guide pages are.
- Same CTA-adjacent-to-FAQ risk as 4.5.
- Best passage: H1 framing — "Can Foreigners Buy Property in Albania? The Full 2026 Answer"
- Worst passage: "Free — no obligation Get a tailored offer within 1 hour" (again displaces the expected answer position)

### 4.7 `/en/albania/durres` (Durrës catalog/listing page) — 35/100
- **Zero H2 headings, zero tables, zero analytical prose, zero external sources.** Pure listing-card directory (28 H3s, all individual property titles). This is the page most likely to satisfy the *transactional* intent behind "where to buy apartment in Albania," but it has almost nothing an AI engine could quote as an answer — it is not citable content, only inventory.
- Worst passage: "Popular New High demand" (a UI label fragment, not a sentence)
- Best (relative) passage: H1 "Durrës Real Estate: Apartments & Property for Sale" — a clear entity/topic statement, not an answer

### 4.8 `/en/property/apartment-1-1-plazh-durres-42m2` (individual listing) — 55/100
- Rich structured data (`RealEstateListing / Apartment / Offer / Product / PostalAddress / QuantitativeValue / PropertyValue`) — strong machine-readable listing data, useful for AI shopping-style citation even though there is almost no prose.
- A real named human is attached to the page ("Listed by Elena Krasniqi") — a genuine trust/authorship-adjacent signal absent from the info/guide pages, which only ever credit "Domlivo" or "Domlivo Editorial."
- Best passage: "Listed by Elena Krasniqi" (named person, verifiable trust signal)
- Worst passage: "Popular New High demand €83,000 Sale" (recurring card-fragment soup in the "Similar Properties" block)

### Cross-page citability notes
- **Passage length skews short, not long.** The FAQ/answer blocks found are typically 15–40 words — good for a one-line snippet citation, but below the 134–167-word "optimal AI-citation passage" range. The narrative blocks under H2s like "Where to buy in Durrës" and "Beyond the price" land closer to that sweet spot (roughly 80–150 words before truncation) and are the site's strongest citable asset.
- **Most H2s are declarative, not question-form** ("Durrës prices by zone, 2026," "Beyond the price"). Question phrasing is concentrated in H3-level FAQs. Converting 3–5 top H2s per page-type to question form would materially help.
- **Author signal is generic, never a named individual with credentials** for editorial content (JSON-LD `author` = "Domlivo" or "Domlivo Editorial"); only property/listing pages name a real person (the assigned agent). AI engines and Google's helpful-content systems weight named, credentialed authorship for YMYL-adjacent financial/legal content (buying property, foreigner eligibility) — this is a gap on exactly the pages ranking for "is it safe to buy property in Albania as a foreigner."
- **Duplicate H2 bug** on both comparison guides sampled (`durres-vs-vlore`, `tirana-vs-durres`) should be fixed — likely a shared component rendering the stat block heading twice.
- **Static "reference price" tables and the "live Domlivo listings" tables can disagree** (e.g., Durrës city-center reference €1,900–2,800/m² vs. live-listings median ≈€1,500/m²) without an inline reconciliation sentence — an AI system quoting one table without the other could misstate the market. Consider a one-line note ("live asking medians run below the state reference band because...") directly beside both tables.

## 5. Entity / brand signals for "Domlivo" / "domlivo.com"

Live web search tooling hit CAPTCHA/bot-detection walls for several queries during this session (Bing and DuckDuckGo both blocked automated fetches at points), so the following is best-effort, not exhaustive — treat absence as "not found in available research" and verify manually before concluding zero presence.

**Not found in the research performed:** Wikipedia or Wikidata entry, Crunchbase profile, LinkedIn company page, Facebook/Instagram business page, Google Business Profile, Trustpilot page, Reddit mentions, YouTube channel/videos, expat-forum threads mentioning "Domlivo" by name, or listings of Domlivo itself on third-party Albanian business/property directories. A search for `"Domlivo" Albania real estate` returned no relevant results in the available tooling (returned unrelated content, indicating either very thin indexed presence or a search-tool failure — recommend the owner run this search manually from a residential browser to confirm).

**What does exist:** the domain itself (domlivo.com, 7 locales, ~55 pages reportedly indexed by Bing per a `site:` count — see §8), a Telegram share link (t.me/fedirdev, appears to be a personal/dev handle, not a branded Domlivo channel), and a credited external contractor site (code-site.art) linked in the footer of every sampled page.

**Assessment:** this is the single weakest dimension in the audit. Per the brand-mention correlation table (YouTube ≈0.737, Reddit high, Wikipedia high, Domain Rating only ≈0.266), Domlivo currently has **none of the high-correlation signals** and is relying entirely on on-site content quality and backlinks (DR 0 per prior SEO baseline in memory) — which correlates weakest with AI citation of all the signals tracked. This matches the earlier finding in this codebase's memory (0 organic keywords, DR 0 despite 389 referring domains).

## 6. Who is being cited today for the target queries

Live SERP fetching was blocked by CAPTCHA for most attempted queries this session (Bing returned an unrelated cached page for a `"Domlivo" Albania real estate` query; DuckDuckGo HTML search returned a bot-verification challenge for "where to buy apartment in Albania" and "is it safe to buy property in Albania as a foreigner"). Treat this section as informed by (a) the outbound sources Domlivo's own pages already cite as authoritative in this niche — a strong proxy signal since the site's editors have already identified the domain's real competitive/citation set — and (b) general knowledge of the Albania property-content space. **This should be re-verified with a live SERP tool or DataForSEO once available**, since the audit brief's instruction to run 8–10 live queries could not be fully executed.

Recurring domains identified via Domlivo's own citation graph + known category authorities:
- **monitor.al** — Albanian business/economy outlet, original publisher of the Deloitte Property Index coverage Domlivo already cites. High authority for Albanian macro/price data; Domlivo could pursue being quoted *in* a Monitor.al piece (they cover foreign-buyer trends) rather than just citing them.
- **homezone.al** — Albanian portal that republishes the official state reference-price schedule; Domlivo already links to it. A directory/data-partnership or reciprocal citation is plausible.
- **investropa.com** — English-language expat/investment blog focused on Balkans emerging markets; already cited by Domlivo for Durrës-area guidance. Good guest-post / expert-quote target for "safe to buy as a foreigner" content.
- **shqiptarja.com** — mainstream Albanian news; occasional real-estate price coverage, similar profile to monitor.al.
- **globihome.com** — competing Albania-focused real estate content/guide site; likely appears in the same SERPs Domlivo wants — a comparison/competitive-mention risk more than a citation opportunity.
- **expat.com forums** — long-running forum threads on "buying property in Albania" that LLMs frequently draw on for experiential, safety-related answers; Domlivo has no presence there yet — a live forum answer linking back (disclosed, non-spammy) is a realistic near-term win.
- **albalegal.eu** — an Albanian law firm already cited by Domlivo for legal specifics; could be approached for a co-authored/reviewed legal FAQ page, which would also solve the "no named credentialed author" gap on the foreigner-eligibility content.
- Category authorities not seen cited on-site but typically dominant in this query space from general knowledge: **globalpropertyguide.com**, **numbeo.com**, **properstar.com**, **realting.com**, **reddit.com** (r/Albania, r/realestateinvesting), **internationalliving.com** / **liveandinvestoverseas.com**, and Balkan-focused expat blogs. None of these currently reference Domlivo based on available research; each represents either a data-citation opportunity (Numbeo/GPG accept user-submitted cost-of-living and price data), a guest-content opportunity (International Living, Investropa-style blogs), or a community-answer opportunity (Reddit, expat.com).

## 7. Unique data assets — are the price tables AI-citable?

Strengths:
- The "Durres: what our listings ask, by district" table discloses real methodology in-line: *"Computed from 358 live sale listings on Domlivo and refreshed every hour... a district gets a row once it has 3 flats"* — sample size and inclusion threshold stated, which is exactly the kind of self-sourcing detail AI engines look for before quoting a number as authoritative.
- Per-m² figures are broken out by district/zone, not just citywide averages — this granularity is what differentiates Domlivo from generic aggregators like Numbeo and is the site's best differentiation opportunity for AI citation ("according to Domlivo, Qerret is priced at €1,100–2,500/m²...").
- External reference prices (state schedule via Homezone, Deloitte/Monitor.al) are shown *alongside* Domlivo's own live data with source links — good triangulation.

Gaps:
- **No visible "as of [date]" timestamp on the live table itself** — "refreshed every hour" is a relative freshness claim, not a citable point-in-time fact; an AI system summarizing the page has no fixed date to attach to the number. Add a rendered `Data as of 2026-09-20 14:00 CET` line next to the live table.
- **No schema.org `Dataset` markup** anywhere in the sampled pages' JSON-LD — the price tables are real, refreshed, sampled datasets and would qualify for `Dataset`/`Observation` structured data, which is a much stronger machine-readable citation hook than an HTML `<table>` alone.
- **No downloadable/exportable version** (CSV, JSON endpoint, or a dedicated `/research` methodology page) of the underlying district price dataset — competitors like Numbeo and Global Property Guide are citable partly because their data can be pointed to as a standing dataset, not just a page.
- The live-vs-reference number disagreement noted in §4 (Durrës city-center €1,900–2,800 reference vs €1,500 live median) should be reconciled with one explanatory sentence so an AI system doesn't cite the two Domlivo numbers as contradicting each other.

## 8. Bing indexation

A `site:domlivo.com` query against Bing nominally reported a non-zero result count, but the fetch tool used in this session rendered an unrelated/cached page (Microsoft/Acer support content) instead of the true results list, so **individual indexed URLs could not be visually confirmed** in this audit. Given Bingbot is allowed in robots.txt (§1), sitemaps are submitted and segmented, and the site is SSR (§3), there is no structural reason Bing indexation should be blocked — but this should be confirmed directly via Bing Webmaster Tools (which the owner already has more reliable access to than an automated fetch) rather than taken as verified here. This matters because Copilot and ChatGPT's web-search mode both lean on the Bing index for live citations.

## Top 5 highest-impact recommendations (see summary for full ranked list of 10)

1. Fix the duplicate-H2 bug on the `guides/*-vs-*` comparison pages (structural, ~30 min).
2. Add a named, credentialed human author (or reviewing lawyer/agent) to the legal/eligibility and pricing editorial content — biggest authority gap on exactly the YMYL-adjacent queries in the brief (few hours to set up an author/reviewer byline + bio page, then apply site-wide).
3. Add `schema.org/Dataset` markup plus a visible "data as of [date/time]" stamp to the live district price tables (1–2 days).
4. Build brand presence on the 3–4 highest-correlation channels the brand currently has zero footprint on: a YouTube walkthrough series (district tours, "how to buy" explainer), an active presence in relevant Reddit/expat.com threads, and a Wikipedia-adjacent entity anchor (Wikidata item at minimum) (ongoing, weeks).
5. Reconcile the "reference price" vs "live listing median" numbers shown side by side so AI systems don't extract contradictory Domlivo figures (few hours).
