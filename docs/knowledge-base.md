# Knowledge base (`/knowledge`)

One question per page, answered with a figure, a date and its sources. Built on
2026-10-19 with 30 question pages in 7 locales; growth plan Q4 2026, section A2
(be the source an AI assistant cites).

## What a page is

- **H1** is the question as a buyer asks it ("Is there a 2% transfer tax when you buy property in Albania?").
- **First paragraph** (`summary`) answers it in 2–3 sentences with a figure and a date.
- **Sections** with prose and **tables**. Every table row can point at the `knowledgeFact` documents behind it; the row then gets a citable anchor (`#DATA-PURCHASE-0007`) and a "Sources" drop-down with value, confidence, period and link.
- **FAQ** (3–5 pairs, `FaqAccordion`), **Sources** (every `knowledgeSource` the page lists plus any fact source it did not), **What is missing** (`gaps`).
- **Byline**: "Data compiled by Fedir Alpatov" (`author`). "Checked by …" appears **only** when `reviewedBy` is set.

Structured data: `Article` (author = the founder Person node from `teamPersonNode`, `contributor` only when reviewed, `dateModified` = the visible `lastUpdated`, `citation` = the sources), `FAQPage` when there are ≥ 3 complete Q&A pairs, `BreadcrumbList`. Research data sheets (no `topicGroup`) keep their `Dataset` markup. hreflang and canonical come from `buildSimplePageMetadata`.

## Where things live

| What | Where |
|---|---|
| Schemas | domlivo-admin `schemaTypes/documents/knowledgeArticle.ts` (`topicGroup`, `author`, `reviewedBy`, `reviewedAt`, `faq`, `sources` added 2026-10-19), `knowledgeFact.ts`, `knowledgeSource.ts`, `objects/knowledgeTable.ts` (`localizedCells`) |
| English master of the 30 pages | domlivo-admin `scripts/data/knowledge-base-2026-10-19/` (`articles*.ts`, `facts.ts`, `sources.ts`) |
| Seed | domlivo-admin `scripts/seedKnowledgeBase20261019.ts` |
| Translation | domlivo-admin `scripts/translateLocaleGaps.ts --types knowledgeArticle` (handles plain-paragraph section bodies too) |
| Queries | `src/lib/sanity/queries/knowledge.ts` |
| Pages | `src/app/[locale]/knowledge/page.tsx` (index by topic group), `[slug]/page.tsx` |
| JSON-LD | `src/lib/seo/knowledgeArticleJsonLd.ts` |
| llms.txt "Reference facts", llms-full.txt full text | `src/lib/knowledge/llmsText.ts` |
| Links from blog posts, `/{city}/info`, `/methodology` | `src/lib/knowledge/links.ts` (+ footer "Knowledge base" in `src/data/footerNavConfig.ts`) |
| Sitemap | `src/app/sitemap-knowledge.xml/route.ts`, listed in `sitemap.xml` and `robots.ts` |

## Numbers: where each kind comes from

- **Domlivo prices** are never typed by hand. Write a price-index token and the page fills it from the live index on every render: `{{median:durres}}`, `{{p20:durres}}`, `{{p80:durres}}`, `{{count:durres}}`, `{{date:durres}}`, and for a district `{{median:durres/plazh}}` (`src/lib/priceIndex/tokens.ts`). A city or district under 30 flats must be called indicative in the copy.
- **Legal and tax figures** are `knowledgeFact` documents with a `source` and dates. A table row cites the fact by `dataId`. One correction of the fact fixes every page that cites it.
- **A figure you are not sure of** goes into `gaps` with a priority, not into the text.
- Lek is converted at the Bank of Albania fixing stated on the page (92.02 ALL/EUR, 2026-09-09).

## Adding a page

1. Add an `ArticleSpec` to the right `articles*.ts` file in `scripts/data/knowledge-base-2026-10-19/` (or a new dated folder and seed for a new batch). New facts go to `facts.ts`, new sources to `sources.ts`; existing ones are cited by id.
2. `npx tsx scripts/seedKnowledgeBase20261019.ts --dry` — it checks ids, slugs, cell counts per row, that every cited fact and source exists, that the summary has a figure and that there are 3–5 FAQ items, and writes `preview.json`.
3. `--execute` writes a backup of whatever it replaces, then the documents. A page is published only when every fact it cites has a source and the page lists at least one source. Translations of unchanged English text survive a re-run.
4. `npx tsx scripts/translateLocaleGaps.ts --execute --types knowledgeArticle --locales de` (one locale per run keeps each request small; repeat for `it pl uk ru sq`, then once without `--locales` to fill anything a failed batch left).
5. Add the page to `src/lib/knowledge/links.ts` so at least two existing pages link to it (the test fails otherwise).

## Changing a fact

Facts are versioned, never overwritten: add a new `dataId` with `supersedes: '<old dataId>'`; the seed sets the old one to `isCurrent: false` with `validUntil`. Done on 2026-10-19 for the ASHK sale-registration fee (DATA-PURCHASE-0003 3,500 ALL → DATA-PURCHASE-0007 5,000 ALL, VKM 462/2025) and the "2% transfer tax" (DATA-PURCHASE-0002 → DATA-PURCHASE-0008: land and plots only, paid by the seller).

## Review

- Viktor Grinchenko reviews legal and tax pages. Until he has, `reviewedBy` stays empty and nothing on the page or in the markup claims a review.
- After checking a page against its sources: set **Checked by** (`reviewedBy` → `blogAuthor-viktor-grinchenko`) and **Checked on** in Studio, and move `lastUpdated` if anything changed. The byline and the `Article.contributor` appear on the next revalidation (hourly).
- Start with the gaps marked HIGH: the seed prints them, and each page lists its own under "What is missing". Resolving one means: confirm or correct the fact, update its source, remove the gap.
- `nextReviewAt` is 6 months for taxes and law, 12 for prices.
- Albanian translations are machine translations pending a native read (CONTENT-OPS).
