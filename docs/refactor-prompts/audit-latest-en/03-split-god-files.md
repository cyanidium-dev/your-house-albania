# Goal
Break up the data-layer god-file `src/lib/sanity/queries/catalog.ts` (790 lines) into focused modules, with **identical query results and zero behavior change**. Review the other large files for the same treatment.

# Context
`catalog.ts` mixes six unrelated concerns (audit §7): area-bounds fetch, filter predicate/where builder, paginated property fetch + card projection, catalog banners, filter-option fetchers + localized mappers, city/country lookups, and `resolveCatalogSeoPage`. It is central to the product and the hardest file to change safely. Splitting it (and extracting shared GROQ in Phase 5) unlocks the rest of the data-layer work.

# Files to inspect
- `src/lib/sanity/queries/catalog.ts` (790) — primary target. Concern map:
  - area bounds `:7-43`
  - predicate/where builder `buildCatalogPredicateParts` / `buildCatalogWhereClause` `:46-151`
  - paginated property fetch + projection `:153-255`
  - catalog banners `:257-383`
  - filter-option fetchers + `mapToLocalizedOption` `:385-540`
  - city/country lookups `:542-671`
  - `resolveCatalogSeoPage` `:673-789`
- Secondary large files to assess (split only if it reduces real complexity): `src/lib/routes/listingRouteResolver.ts` (622), `src/components/catalog/map/PropertiesMap.tsx` (620), `src/components/catalog/CatalogBodyClient.tsx` (562), `src/components/Properties/PropertyGallery/index.tsx` (529).
- All importers of `catalog.ts` (grep `from "@/lib/sanity/queries/catalog"`).

# Allowed changes
- Move pure functions and projections into new modules:
  - `src/lib/sanity/groq/catalogFilters.ts` ← `buildCatalogPredicateParts/WhereClause`
  - `src/lib/sanity/queries/catalogFacets.ts` ← filter-option fetchers + city/country lookups
  - `src/lib/sanity/adapters/catalogSeo.ts` ← `resolveCatalogSeoPage` (+ `mapToLocalizedOption`)
  - keep thin property/banner fetchers in `queries/catalog.ts`
- Keep the public import surface stable via a barrel re-export so callers don't change (or update callers explicitly if cleaner).

# Forbidden changes
- Do NOT alter GROQ query strings, parameters, projection fields, ordering, or pagination math — extraction must be byte-faithful.
- Do NOT change caching tags or `revalidate` values.
- Do NOT introduce new behavior, new fields, or "while I'm here" improvements (those belong to Phase 5).

# Step-by-step plan
1. Extract the **pure, side-effect-free** functions first (predicate/where builder) — lowest risk; update imports.
2. Run typecheck + build; spot-check catalog routes render identically.
3. Extract facet/lookup fetchers; then the SEO resolver. Re-check after each move.
4. Add a barrel (`queries/catalog/index.ts` or re-exports) so external imports stay valid.
5. Only then assess the secondary files; split each only with a concrete concern-separation rationale.

# Acceptance criteria
- `catalog.ts` (and any split target) is meaningfully smaller, each new module has one concern.
- No GROQ string changed (diff shows moves, not edits).
- Catalog list, filters, banners, and catalog SEO pages render identically (same data) before/after.
- All existing importers compile unchanged (or are updated consistently).

# Required checks
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`

# Output format
Report: new module list with the concern each owns, the line-ranges moved out of `catalog.ts`, confirmation that no GROQ string was edited (moves only), importer updates, and any secondary file you chose NOT to split (with reason).
