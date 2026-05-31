# Refactor Prompt 02 — SEO Integrity (P0/P1)

## Goal
Remove thin/duplicate mock pages from the search index and ensure only real, published URLs are crawlable.

## Context
`/appartment`, `/luxury-villa`, `/office-spaces`, `/residential-homes` render MOCK data from `src/data/properties.ts` via `getProperties().slice(...)`. The four components are ~99% identical (OfficeSpaces ≡ Residential). They emit `index:true` when `NEXT_PUBLIC_ENABLE_INDEXING=true`. The real catalog already covers these categories via Sanity filters. Audit §2.2.

## Files to inspect
- `src/components/Properties/{Appartment,LuxuryVilla,OfficeSpaces,Residential}/index.tsx`
- `src/lib/routes/catalog.ts:60-63` (registration)
- The page route files that render the above components
- `src/data/properties.ts` (mock source — LIVE only because of these pages)
- `src/lib/seo/hreflang.ts`, canonical helpers (verify untouched)

## Allowed changes
- Set `robots: { index: false, follow: false }` on the 4 pages' metadata (Phase 1), OR
- Redirect the 4 routes to their equivalent real catalog filter and delete the mock components (Phase 2).
- Remove the 4 entries from sitemap generation if present.

## Forbidden changes
- Do NOT delete `src/data/properties.ts` until the pages are gone (it would break the build).
- Do NOT change hreflang/canonical logic for real pages.
- Do NOT change the global `NEXT_PUBLIC_ENABLE_INDEXING` gate behavior for real pages.

## Step-by-step plan
1. Decide de-index vs redirect (recommend: de-index now, redirect+delete in a follow-up).
2. If de-indexing: add `robots` noindex to each page's `generateMetadata`/`metadata`.
3. If redirecting: map each to the matching real catalog URL; remove the mock components and their `lib/routes/catalog.ts:60-63` registration; then delete now-orphaned `src/data/properties.ts`.
4. Confirm sitemap no longer lists the mock URLs.
5. Run checks.

## Acceptance criteria
- The 4 URLs are either `noindex` or 301-redirect to a real catalog URL.
- Sitemap contains no mock URLs.
- Real category browsing still works via the live catalog.
- hreflang/canonical for real pages unchanged.

## Required checks
```
npm run lint
npm run typecheck
npm run build
```

## Output format
List changed files, state which strategy was used per route, and paste the resulting `robots`/redirect for one example page.
