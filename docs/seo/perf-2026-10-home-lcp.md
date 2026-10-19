# Home page mobile LCP — October 2026

Goal: PageSpeed Insights mobile ≥ 90 for `/en` without changing the design.
Before this work (PSI, 2026-10-19 22:34): mobile 80 — FCP 1.35 s, LCP 5.1 s,
TBT 64 ms, CLS 0, SI 3.3 s.

## Why the LCP is 5 s although the hero arrives in 0.5 s

PSI does not throttle the page load it records. It loads the page at full
speed once, then *simulates* a slow-4G phone (Lighthouse "Lantern"). For LCP
the simulation replays every request that **finished before the LCP was
painted in the recorded load**, plus every script that ran before it
(`lantern/metrics/LargestContentfulPaint.js`, `FirstContentfulPaint.getFirstPaintBasedGraph`).

What PSI recorded for `/en`:

| ms (recorded load) | what |
| --- | --- |
| 1–441 | the HTML document (51 KB gzip) |
| 468–490 | every subresource requested at once: 2 CSS files, 26 JS chunks (~280 KB), 3 preloaded fonts (108 KB), the sprite, the header logo, the hero photo |
| 486 | hero photo done (own connection to cdn.sanity.io) |
| 757–1118 | JS chunks done |
| 1032–1096 | fonts done |
| 1043 | the 25 KB stylesheet done — it shares one HTTP/2 connection with the JS and fonts and finishes with them |
| 1257–1278 | the photos of the listing carousel (12 × 27–44 KB) |
| 1327 | first frame = FCP = LCP |

The first frame waits for the stylesheet, and the stylesheet arrives together
with the JS. So the whole JS bundle, the fonts and the carousel photos are
"before LCP" and the simulation downloads all of them at 1.6 Mbps before it
lets the hero paint: 5.1 s. Hydration time is not the problem (TBT 64 ms).

Check: the same page with its `<script>` tags stripped (local proxy, same
build) scores 92 with LCP 2.6 s instead of 69 / 5.8 s.

Local Lighthouse cannot show the fix: on `localhost` the JS arrives instantly,
so it is always "before LCP" and every variant lands at LCP 4.1–4.4 s. Only a
public build measured by PSI tells. Vercel previews sit behind Vercel SSO, so
each step was merged and measured on production.

## Steps

### A. Less traffic in front of the stylesheet (kept if PSI does not get worse)
- Inter preloads only its Latin file. `subsets` in `next/font` decides only
  what is preloaded; the Cyrillic `@font-face` stays and is fetched when a page
  has Cyrillic text. English pages stop downloading 19 KB of Cyrillic glyphs in
  the first second.
- The header logo (CMS SVG on cdn.sanity.io) is `fetchPriority="low"`, so React
  no longer preloads it ahead of the hero; both use the same connection.
- Listing carousel cards are 280/320/360 px wide, but the card told the
  browser `100vw`: a phone got the 750 px photo, twelve times. The carousel now
  passes its real `sizes` (`640w` on a phone, 1.75× DPR).

Design: identical at 390 and 1440 (same sections and heights, same text hash,
same logo box, same page height).

### B. Stylesheet inside the document (`experimental.inlineCss`)
Tried 2026-10-18 and reverted then (document 470 → 820 KB, TBT doubled while
GTM still ran during load). Re-tested now that third parties wait for the
first interaction: with the CSS in the HTML, the first frame no longer waits
for a request that competes with the JS.

## Results

| build | PSI mobile /en | LCP | FCP | TBT | PSI desktop /en | notes |
| --- | --- | --- | --- | --- | --- | --- |
| before (main 4cc0c6d) | 80 | 5.1 s | 1.35 s | 64 ms | 97 | |

Local Lighthouse (simulated, mobile; 3 runs each): before 74–81 / LCP 4.1–4.5 s;
step A 71–80 / LCP 4.3–4.4 s; step B 70–72 / LCP 4.1–4.2 s — noise, see above.
