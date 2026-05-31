# Refactor Prompt 05 — GROQ & Type Deduplication (P2)

## Goal
DRY the data layer: extract repeated GROQ into named fragments, split the `catalog.ts` god-file, and collapse the duplicate type tree — with byte-identical query output.

## Context
The property-card projection is copy-pasted 5×, the city/district/type ref triplet ~9×, the image-asset fragment ~15×, and the SEO fragment 3×. `catalog.ts` is 786 lines mixing 8 concerns. `src/types/domain/*` duplicates flat `src/types/*` and is used only by mock data. Audit §3, §4, §7, §8.

## Files to inspect
- `src/lib/sanity/queries/catalog.ts` (786 lines; projections at `:183-220`)
- `src/lib/sanity/queries/home.ts:226-263`
- `src/lib/sanity/queries/property.ts:9-81, 105-139, 164-201`
- `src/lib/sanity/blog/landing SeoAdapter` family; `blogSeoAdapter.ts:7` (`LocalizedField` redefined)
- `src/types/domain/*` vs `src/types/*`
- `src/lib/sanity/adapters/propertyAdapter.ts:12` (`as never` sites)

## Allowed changes
- Create `src/lib/sanity/groq/` with fragments: `propertyCardFields`, `refTriplet`, `imageAsset`, `seoFields` (and reuse `publishedPropertyFilter` from prompt 01).
- Replace inline projections with these fragments (string-identical output).
- Split `catalog.ts` into focused modules (area-bounds / predicate / pagination / banners / filter-options / country / footer / catalogSeo).
- Collapse `src/types/domain/*` into `src/types/*`; fix `featuredProperty.ts:2` `scr`→`src`.
- Correct `CatalogProperty` schema mismatches: drop phantom `coordinates` (use `coordinatesLat`/`Lng`), drop phantom `currency`, change `investment` to `boolean`.
- Remove `as never` casts where a real GROQ-result type can be applied.

## Forbidden changes
- Do NOT change which fields are fetched or their names — output must be identical.
- Do NOT change caching tags/revalidate.
- Do NOT change the publish filter semantics from prompt 01.

## Step-by-step plan
1. Build the `groq/` fragment files; verify each fragment reproduces the exact field list it replaces.
2. Swap one query to the fragments, diff the composed query string vs original — must match.
3. Repeat for all 5 projection sites.
4. Split `catalog.ts` module-by-module, keeping public exports stable.
5. Collapse the type tree; update imports; fix the typo and schema mismatches.
6. Remove now-unnecessary `as never`.
7. Run checks after each major step.

## Acceptance criteria
- Composed GROQ strings are character-identical to pre-refactor for every query (paste a before/after for one).
- `catalog.ts` split into ≤~150-line modules; all original exports still resolve.
- One type source of truth; `grep "scr:"` and phantom fields gone.
- `lint`+`typecheck`+`build` green.

## Required checks
```
npm run lint
npm run typecheck
npm run build
```

## Output format
List new/changed/deleted files, one before/after GROQ diff proving identical output, and the new `catalog.ts` module breakdown.
