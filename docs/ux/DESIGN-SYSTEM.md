# Domlivo layout system

Written 2026-09-28, after a page-by-page design audit (section "Audit" below).
The code lives in `src/components/shared/layout/index.tsx`. Use its components
and constants; do not retype the class strings.

## The rule

Every section sits in one container: `CONTAINER`, 1400px (`max-w-8xl`), 20px
gutter below 1536px. **No section gets a narrower container of its own**, and
nothing is centred in a narrow box.

Inside the container there are three widths, and only three:

| Width | Use | How |
|---|---|---|
| Full | tables, card grids, carousels, galleries, figure tiles | nothing to add |
| Reading measure, 768px | a heading's lead, a lone paragraph | `MEASURE`, always start-aligned |
| Split, 5 + 7 of 12 columns | prose, FAQ, costs, anything with text longer than a paragraph | `SPLIT`, `SPLIT_ASIDE`, `SPLIT_MAIN` |

The 7-column side of the split lands at the reading measure on a desktop, so
long text gets a comfortable line without half the page standing empty. The
5-column side carries what belongs to the text: its heading, a photo, the
figures it talks about, a callout. Below `lg` the two sides stack.

If a block "needs to be narrow", it goes into the split with something useful
beside it. A new `max-w-*` on a section wrapper is a bug.

## Scale

| Token | Where |
|---|---|
| `HERO_TITLE`, `HERO_LABEL`, `HERO_LEAD` | every photo hero (landing, listing, blog and guide hubs); all start-aligned |
| `SECTION_TITLE` | every section `<h2>`: 30 / 36 / 44px |
| `SECTION_LEAD` | the line under a section title |
| `BODY_TEXT` | prose in sections: 17px, line-height 1.625 |
| Blog article body | 17px, line-height 1.75, own heading steps (`BlogArticleContent`) |

Vertical rhythm: `SECTION_Y` (`py-12 md:py-16`), so 96px between sections on a
phone and 128px from `md`. Notes and sources that belong to a section render
inside it (`aside` props), never as a second container pulled up with `-mt-10`.

## Components

- `Section`, `SectionHeading` (title, lead, optional trailing button or arrows).
- `PANEL`: the quiet surface for figures and notes.
- `balancedGridClass(n)`: 2, 3 or 4 columns, whichever leaves the fullest last row. A lone card is `wide` (photo beside text), not one card and two empty slots.
- `galleryItemClass(i, n)` (`LinkedGallerySection`): photos fill the last row.
- `NoPhotoPlate`: every card has an image slot; a place without a photo gets its name on a dotted plate, never a grey box.
- `FaqAccordion` (`components/shared/faq`): the only FAQ list. Landing FAQs, district pages, blog posts, in-article FAQ blocks, trackers and listing pages all use it. The landing layout puts the heading on the split's narrow side.
- `PriceTableSection`: a value column that reads as prices gets range bars on one shared scale; the page's own zone is highlighted; confidence has a column header and a legend.
- `StatsBandSection`: figures in a panel beside their research note (zone pages), or one panel per figure; two figures in one unit show the gap between them.
- `DistrictsComparisonSection`: a table on desktop, one card per question on a phone (the table used to scroll sideways and hide the second place).
- `CtaSection`: a contained brand panel, text left, buttons right.
- `depthUi.tsx`: chips and stat tiles under listing grids.

## Allowed exceptions

- The AI search page keeps a centred 896px chat column: it is an app surface, and a chat reads down one column.
- 404, register and the thank-you pages centre a short composition on purpose.

## Audit, 2026-09-28

Production and the local build were captured full-page at 1440, 768 and 375px
in the dark theme (the owner's), 26 URLs covering every page type.

What was wrong, and what changed:

- **Widths.** Sections used 1400, 1024, 896, 768 and 672px wrappers, some centred. The "About X" prose block sat in a centred 896px box 250px right of every other section, and split long text into two CSS columns that never balanced (one sentence alone at the top of the second column on `/durres/info`). Now: one container, the split, no CSS columns.
- **Figures.** "X in figures" showed one number at the left edge of an empty 1400px row. Now a panel beside the research note and sources.
- **Tables.** Zone tables with one value column stretched across the page with an unlabeled column of dots. Now range bars, a confidence header and legend, the page's zone highlighted, sources beside a narrow table.
- **FAQ.** Six renderings; on listing pages question and answer ran together. Now one accordion.
- **Cards.** Blank grey image boxes, a lone comparison card in a three-column row, four cards laid out as three and one. Now the name plate, `balancedGridClass`, wide single cards, compact rows on phones (nine districts were nine screens of photos).
- **City and district listings.** The page opened on a two-row filter form whose first field asked for the city already in the URL, and a small city (Shëngjin, two listings) ended at the cards and one generic sentence. Now the filter opens as a one-line summary aligned with the heading; the blocks under the grid render on every bare city and district URL, and a city with too few listings for statistics shows its research figures and its districts instead. City and district landing heroes no longer carry a search box with "Any location" preselected.
- **Catalog grid.** The map took one cell, so 24 cards per page always ended on one card alone. The map now takes the cells each breakpoint needs (a 2×2 block at four columns).
- **Heroes.** Two centred heroes and one start-aligned one, with different labels and title sizes. Now one scale, all start-aligned.
- **Blog.** Global `.blog-details` rules sat outside Tailwind's layers and overrode the article components (18px, pure white, line-height 1.2, 32px bottom margins). Now 17px / 1.75 at a 7-column measure; sidebar cards put the category above the title instead of beside it.
- **Property page.** Below `lg` the lower grid had 12 columns with 32px gaps, 352px of gaps on a 335px row, so text, cards and map ran past the right margin. Similar properties had a second container inside the first.
- **Guides index.** Text-only cards next to photo cards made rows of three heights. Now every card has an image slot, and guides and comparisons are separate groups.
- **District photos.** 17 district heroes and 14 district cards were the demo seed script's stock photos (`seed-district-*.jpg`, 800×600: a motel sign for Blloku, a desert for Sarandë, a highland cow for Gjuhadol, the Statue of Liberty for Uji i Ftohtë), stretched to 2560px under a dark wash. The queries now drop seed uploads (`REAL_IMAGE_ASSET` in `lib/sanity/queries/_core.ts`), so those pages fall back to the city's own photograph or the name plate. Any other CMS hero photo under 1600px wide, or with an extreme aspect, is shown framed beside the copy from a tablet up instead of stretched full width.
- **Legal pages** had no breadcrumb (a landing only placed it inside a hero) and relied on section padding to clear the fixed header. `LandingRenderer` now puts the breadcrumb in a `PAGE_TOP` strip when there is no hero.
- **Knowledge pages** used heading sizes the theme does not define and `prose` without the typography plugin, so they rendered at browser defaults.

Still open: the pages that lost a seed photo need real photographs uploaded in the Studio (Plazh, Shkozet, Blloku, Fresku, Komuna e Parisit, Pazari i Ri, Qendër Tirana, Qendër Shkodër, Gjuhadol, Parrucë, Ksamil, Buzë Shëtitores, Qendër Sarandë, Qendër Vlorë, Lungomare, Orikum, Uji i Ftohtë, and the Himarë districts). Several landing cards in the CMS reuse one photo (the three "Albania or …" comparisons all show the Tirana opera), and districts without a photo show the city's photo in their hero. Both are content, not code: they need photographs in Sanity.
