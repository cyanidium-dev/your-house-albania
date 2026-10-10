# Catalogue map + listing grid: research and recommendation (2026-10-10)

How portals combine the results list with a map, what the evidence says, and what domlivo should build. All sources were accessed on 2026-10-10. **Observed** means I opened the live page that day at 1440×900 or 375×812 and measured the DOM. **Unverified** means a bot check blocked the page and I found no reliable source.

## 1. Comparison

| Portal | Desktop default | List:map | Sticky map | Pins | Map controls | Paging | Mobile | Src |
|---|---|---|---|---|---|---|---|---|
| Realting | Split | 56:44, 3-column cards | `fixed` | Count circles and clusters | "Search using the map", on by default | `<a href=?page=2>` "Show next 30" plus numbers | List first, floating "Show property on map" | [1] |
| Idealista | Unverified | – | – | – | Draw an area; several zones | – | Draw with a finger | [2][3] |
| Rightmove | List, 1-column cards | Static map thumbnail in the rail | – | Price pills, capped at 96 of 3,828; region polygon | Separate full-screen `map.html` with "List view" and draw | Numbered | – | [4] |
| Zillow | Split, map **left** | 56:44, 2-column cards | List pane scrolls | Region boundary | "Remove Boundary" | `<a href=/2_p/>` | Unverified | [5] |
| Redfin | Split | ≈63:37, 2-column cards | Yes | – | Draw, Layout | `/page-2` | Bottom list toggle (third party) | [6][7] |
| Immobiliare.it | Split | 67:33, 1-column cards | `sticky` | **Hybrid**: some price pills, the rest dots; card hover highlights its pill | "ESPANDI" (full-screen) | `?pag=2` | – | [8] |
| Otodom | List, 36 per page | Thumbnail opens `?viewType=map` at 27:73 | – | – | Draw an area; `mapBounds` in the URL | `?page=2` | – | [9] |
| OLX / Domy.pl | Unverified | – | – | – | – | – | – | – |
| LUN | Split | ≈50:50, 1-column cards | `sticky` | **Hybrid**: about 15 price pills with the developer logo, orange dots for the rest | – | Numbered; footer reachable | – | [10] |
| Bird (LUN) | iOS, map first | – | – | 3D city; buildings with matching flats lit | Filters | – | Map first | [11] |
| Airbnb | Split | ≈55:45, 2-column cards | Yes | Price pills plus mini-pins | Results follow the map | Map shows the current page only | Bottom map button | [12][13][14] |
| Booking.com | Split in 50% of Baymard's sessions | – | – | Price pins | "Show on map" on each card | – | – | [15][16] |
| Bayut / Property Finder | List, then "Map View" | List beside the map | – | Bayut: count markers, no prices | PF: points of interest from 2GIS | – | Bayut: list in a sheet under the map | [17][18] |

Patterns:
- Split portals give the list 50–67% of the width.
- **No portal puts the map inside the card grid.**
- Paging stays numbered and crawlable even beside a map.
- Phones are list first, with a floating Map button that opens a full-screen map.

## 2. Evidence

**Split view (data, travel).** Baymard tested hotel and rental search [15]. The setting is travel, not property, but the task is close.
- 70% of the sites tested showed the list without a map by default.
- 65% of users on those sites never used the map; they could not find it or overlooked it.
- 95% of Hilton users used the map when it was shown in a split view.
- At Expedia, 75% of users lost their map narrowing when they returned to the list.
- Horizontal filter bars worked well; vertical sidebars crowded the split.
- Users mistook a map overlay for the results page and lost the sort control.

**Pins (data, Airbnb 2024)** [12].
- Attention concentrates at the map's centre, and the order of the pins barely matters.
- Fewer, better pins raised uncanceled bookings by 1.7% (1.9% in a larger test).
- Mini-pins get about one-eighth of the clicks of full pins.

**Loading more (data plus guidance).**
- Baymard: "Load more" with lazy loading tested best; infinite scroll hurt search results and mobile [19]. On mobile, show 15–30 items before the button [20].
- NN/g: "Load more" keeps the footer reachable. Infinite scroll suits browsing, not looking for something specific [21].

**SEO.** Google neither clicks nor scrolls.
- Each page of results needs an `<a href>` with an absolute `?page=n`, and each page is its own canonical [22][23].
- Update the URL with the History API when appended results become the visible content [22].
- Google ignores fragments. Filter and bounds parameters should not be crawled [22][24].

**Performance.**
- Reserve the space of late-loading embeds. Good CLS is 0.1 or less; shifts within 500 ms of a user action do not count [25].
- Show a static facade until the visitor needs the interactive map [26].

**Approximate locations.**
- Airbnb hides the exact spot behind a small circle inside a shaded circle until a booking is confirmed [14].
- Rightmove, Zillow, Immobiliare and Otodom draw the search area as a polygon [4][5][8][9].
- Bird lights whole buildings, which only works with a known address [11].
- No portal I saw puts a precise-looking price pin on an approximate location.

**Opinion, not data:**
- "Price pins changed browsing" and "map users send better inquiries" come from an agency blog with no numbers [27].
- The ratios in the table are measurements, not test results.
- I found no public A/B test of split versus list on a property portal.

## 3. Recommendation

### Desktop, 1024 px and wider

- **Layout.** Only the results band becomes a split; hero, facet chips, SEO text, FAQ and footer stay in the 1400 px `CONTAINER`.
  - The band is 7 + 5 of 12 columns (≈58:42), the mirror of `SPLIT`.
  - The list aligns with the container's left edge; the map runs to the viewport's right edge.
  - Record this in `DESIGN-SYSTEM.md` as the one named exception to the container rule.
- **Cards.** 2 columns up to 1919 px, 3 columns from 1920 px. No cell is reserved for the map.
- **Filters.** The existing horizontal compact bar, sticky above both columns, with sort and the result count in it.
- **Map panel.**
  - Use `position: sticky`, not `fixed`: `top` is the header plus the filter bar, and the height is `100dvh` minus that.
  - Give the panel its final size in CSS, so CLS stays at zero.
  - Show a static placeholder until MapLibre loads in a dynamic chunk on idle or when visible.
  - The first card photo stays the LCP element, never the map.
- **"Hide map".** A toggle that turns the band back into a full-width 3–4 column grid. Remember the choice in `localStorage` inside try/catch. The map is on by default, because 65% of users never found a hidden one.
- **Card ↔ pin sync.**
  - Card hover highlights its pin, or the area halo for an approximate one.
  - Pin hover outlines its card.
  - A pin click opens the existing preview and never scrolls the list.
- **Pins.**
  - Price pills only for the cards loaded in the list.
  - Every other listing in the filter is a dot, clustered when zoomed out (the Airbnb, LUN and Immobiliare pattern).
- **Moving the map does not re-query the list.**
  - After a pan, offer "Show 84 listings in Plazh", a link to the existing district listing path.
  - Bounding-box filtering is wrong when 87% of pins sit on district centroids.
- **"Show more".**
  - It stays an `<a href=?page=N>` at the foot of the list column.
  - Appended cards turn their dots into pills, and `history.replaceState` writes `?page=N`.
  - When the list ends, the sticky map is released and the SEO text and footer follow.

### Full-screen map (all sizes)

- **Opening and closing.**
  - An "Expand" button in the panel corner opens it.
  - Opening pushes a history entry (`?view=map`, as today); Back and Esc close it.
  - Never link `?view=map` as an `<a href>`, and keep its canonical on the base URL.
  - Keep the camera position in the fragment (`#16/41.31/19.45`).
- **Desktop.** A 380 px collapsible list drawer on the left keeps sort and cards in reach. Baymard's overlay pitfall was losing them.
- **3D buildings.**
  - A toggle in full-screen only, pitch 0 by default, opt-in on phones.
  - Light a building only for the 14% of listings with an exact location. Attaching an approximate listing to a building is false precision.

### Tablet (768–1023 px)

- No split; the list uses 2 columns.
- A floating "Map" pill opens the full-screen map, with the list in a bottom sheet.

### Mobile (under 768 px, about 60% of traffic)

- List first, server-rendered, "Show more" as today.
- A floating pill at bottom centre reads "Map · 650" and sits above the safe area.
- The full-screen map has a card carousel at the bottom:
  - Swiping a card pans to its pin, and tapping a pin scrolls to its card.
  - The "List" pill and Back restore the scroll position.
- No map inside the scrolling page.

### Approximate pins (87%)

- **Zoomed out.** One area bubble per district or landmark with a count ("Plazh · 84") replaces 84 stacked "≈" pins. Tapping it opens a short list or the district page.
- **Zoomed in.** Each listing is a dot inside a translucent district halo, never a price pill on the centroid.
- **Legend.** Keep the dashed outline, explained once in a legend.
- **Exact listings.** Only the 14% with an exact location get solid price pills.
- **Cards.** They say "Approximate location: Plazh", and the preview says the agent gives the address.

### What not to do

- Map as a grid cell.
- Infinite scroll.
- A `fixed` map covering the footer.
- Map bounds replacing the server-rendered list.
- Bounds in crawlable URLs.
- Price pills or 3D buildings for approximate listings.
- MapLibre in the initial bundle, or the map as the LCP element.
- A vertical filter sidebar.
- A map toggle hidden among the chips.
- 3D on by default on phones.

## 4. Prioritised implementation

1. **P0.** Take the map out of the grid (`MAP_SPAN_*` in `CatalogBodyClient`). Build the sticky 7/5 band with a 2-column grid, a reserved-size panel, idle-loaded MapLibre, and "Show more" kept as `<a href>` plus `replaceState`.
2. **P0.** Phone and tablet: the floating Map pill, a full-screen map with the card carousel, Back and Esc to close, scroll restored.
3. **P1.** Pills for loaded cards and dots for the rest; two-way hover sync; area bubbles and halos with a legend.
4. **P1.** The desktop full-screen button and list drawer; check that `?view=map` is canonical to the base URL and never linked.
5. **P2.** The "Show N in [district]" link; the "Hide map" preference.
6. **P2.** The 3D toggle in full-screen, exact listings only.
7. **P3.** Measurement in Clarity, since GA4 sees only about 4% of sessions:
   - funnels for map opened → pin → preview → listing → lead;
   - then 4 weeks with the split on by default against off.

## Sources (accessed 2026-10-10)

1. Realting, observed: https://realting.com/albania/durres
2. Idealista app: https://apps.apple.com/app/id465958311
3. Idealista multi-area search: https://www.idealista.com/en/news/node/883902
4. Rightmove, observed, list and `map.html`: https://www.rightmove.co.uk/property-for-sale/Bristol.html
5. Zillow, observed behind its bot check: https://www.zillow.com/austin-tx/
6. Redfin, observed: https://www.redfin.com/city/30818/TX/Austin
7. Redfin mobile flow (third party): https://screensdesign.com/explore/flows/using-maps/
8. Immobiliare, observed: https://www.immobiliare.it/vendita-case/bologna/
9. Otodom, observed: https://www.otodom.pl/pl/wyniki/sprzedaz/mieszkanie/pomorskie/gdansk/gdansk/gdansk
10. LUN, observed: https://lun.ua/uk/новобудови-києва
11. Bird: https://en.ain.ua/2021/09/23/story-of-bird-rental-app
12. Haldar et al., Learning to Rank for Maps at Airbnb (2024): https://arxiv.org/html/2407.00091v1
13. Airbnb, observed: https://www.airbnb.com/s/Durres--Albania/homes ; map shows the current page only: https://community.withairbnb.com/t5/Help/Map-View-issue-for-new-hosts/m-p/964925
14. Airbnb, approximate location: https://www.airbnb.co.in/help/article/2141
15. Baymard, split view for accommodations (2022): https://baymard.com/blog/accommodations-split-view
16. Booking.com location context (2025): https://www.avuxi.com/?p=13937
17. Bayut Map View (updated 2025-03-11): https://www.bayut.com/mybayut/map-view-bayut-features-steps/
18. Property Finder × 2GIS: https://www.onlinemarketplaces.com/articles/property-and-2dis-uae-launch-location-based-search-engine
19. Baymard via Smashing (2016): https://smashingmagazine.com/2016/03/pagination-infinite-scrolling-load-more-buttons
20. Baymard, items loaded by default (2020): https://baymard.com/research-articles/number-of-items-loaded-by-default
21. NN/g, Infinite Scrolling (2022): https://www.nngroup.com/articles/infinite-scrolling-tips/
22. Google, pagination and incremental loading: https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading
23. Google, lazy-loading: https://developers.google.com/search/docs/crawling-indexing/javascript/lazy-loading
24. Google, faceted navigation: https://developers.google.com/search/docs/crawling-indexing/crawling-managing-faceted-navigation
25. web.dev, Optimize CLS: https://web.dev/articles/optimize-cls
26. web.dev, third-party embeds: https://web.dev/articles/embed-best-practices
27. Raw.Studio, opinion (2026-01-08): https://raw.studio/blog/using-maps-as-the-core-ux-in-real-estate-platforms/
