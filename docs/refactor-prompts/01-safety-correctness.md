# Refactor Prompt 01 — Safety & Correctness (P0)

## Goal
Stop unpublished, sold, and archived properties from leaking into every public surface. Public property queries must match the Studio's own contract: published + active lifecycle only.

## Context
The Sanity schema defines `isPublished` (boolean) and `lifecycleStatus` (string) on `property` — see `domlivo-admin/schemaTypes/documents/property.ts:107,116`. The Studio's listing query already enforces them (`domlivo-admin/lib/sanity/queries.ts:258`):
`*[_type == "property" && isPublished == true && (lifecycleStatus == "active" || !defined(lifecycleStatus))]`.
The frontend does NOT, so sold/draft/archived listings appear in catalog, detail, homepage, and sitemap. This is the single highest-risk defect in the audit (§2.1).

## Files to inspect
- `src/lib/sanity/queries/catalog.ts:127-150` (`buildCatalogWhereClause`)
- `src/lib/sanity/queries/property.ts:9, 105, 164`
- `src/lib/sanity/queries/home.ts:28`
- `src/app/sitemap.ts:159` (`fetchSitemapTypeEntries`), `:295` (`fetchSitemapNonGeoListingEntries`), `:390` (already correct — use as reference)
- `domlivo-admin/lib/sanity/queries.ts:258` (the canonical predicate)

## Allowed changes
- Add the publish/lifecycle predicate to each public property query.
- Create one shared GROQ fragment string (e.g. `src/lib/sanity/groq/publishedPropertyFilter.ts`) and reuse it so the rule lives in one place.

## Forbidden changes
- Do NOT change pagination, sorting, projections, or returned fields.
- Do NOT alter the already-correct `sitemap.ts:390`.
- Do NOT touch the admin repo.
- Do NOT change caching/revalidate config.

## Step-by-step plan
1. Add `export const PUBLISHED_PROPERTY_FILTER = 'isPublished == true && (lifecycleStatus == "active" || !defined(lifecycleStatus))'`.
2. In `buildCatalogWhereClause`, push this into `parts` right after `_type == "property"`.
3. In `property.ts` (3 query sites) and `home.ts:28`, append `&& ${PUBLISHED_PROPERTY_FILTER}` to the property predicate.
4. In `sitemap.ts:159` and `:295`, replace/augment `defined(status)` with the published filter.
5. Run the required checks.

## Acceptance criteria
- A property with `isPublished == false` or `lifecycleStatus == "archived"/"sold"` does NOT appear in: catalog list, property detail (returns 404/notFound), homepage blocks, or any sitemap entry.
- A property with `isPublished == true` and undefined `lifecycleStatus` still appears (back-compat).
- No change to field projections or ordering for published properties.

## Required checks
```
npm run lint
npm run typecheck   # or: npx tsc --noEmit
npm run build
```

## Output format
List changed files, the exact predicate added per file, and a short note confirming an unpublished fixture is excluded from each surface.
