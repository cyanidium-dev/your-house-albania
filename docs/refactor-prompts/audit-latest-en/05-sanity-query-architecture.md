# Goal
Consolidate the Sanity data layer: extract shared GROQ fragments, a `safeFetch` helper, a single env source, make all SEO adapters delegate to the unifier, and collapse duplicate types — reducing the 71 `as never` casts. **Query results must stay identical.**

# Context
Audit §7–§8. The property-card GROQ projection is copy-pasted across ~6 query files; image/city/district/type/SEO sub-projections repeat; ~30 fetchers duplicate the same try/catch boilerplate; env reads are triplicated; two of four `*SeoAdapter` bypass `socialMetadataResolution.ts`; `LocalizedField` is defined 5× and `Property` is modeled 4×. This phase pays down that debt on top of the Phase 3 split.

# Files to inspect
- Queries: `src/lib/sanity/queries/{_core,catalog,property,home,blog,landing,agent,settings,sitemap}.ts`
- GROQ: `src/lib/sanity/groq/propertyFilters.ts` (the one good shared filter — model the rest on it)
- Adapters: `src/lib/sanity/{propertyAdapter,blogAdapter,agentAdapter,cityAdapter,siteSettingsAdapter,propertyTypeAdapter}.ts` and `*SeoAdapter.ts` (`blogSeoAdapter:42`, `homeSeoAdapter:20/29`, `propertySeoAdapter`, `landingSeoAdapter`), `socialMetadataResolution.ts` (the unifier: `buildMetadata:109`, `resolveChainedTitle/Description`, `pickAbsoluteOgImageUrl`)
- Env/clients: `_core.ts:4`, `imageUrl.ts:3`, `writeClient.ts:13`
- Types: `src/types/{catalog,propertyHomes,domain/property}.ts`, `src/lib/sanity/types/*`, `localized.ts:15`
- Repeated GROQ anchors: property-card projection `catalog.ts:184`, `property.ts:106/165`, `home.ts:227/29`, `blog.ts:40/258`; blog published filter `blog.ts:108/150/179/223`, `sitemap.ts:419`

# Allowed changes
- Create `src/lib/sanity/groq/fragments/` with `propertyCard`, `cityRef`, `districtRef`, `typeRef`, `image`, `seo`, `blogPublished` fragments; replace the inline copies by composing these fragments into the existing queries (must produce the same query string semantics / same fields).
- Add `safeFetch(query, params, label)` to a core module; refactor the ~30 fetchers to use it (same null-guard + warn behavior).
- Add `src/lib/sanity/core/env.ts` as the single `projectId/dataset/apiVersion` source; update `_core.ts`, `imageUrl.ts`, `writeClient.ts` to import it.
- Make `homeSeoAdapter` and `blogSeoAdapter` delegate to `socialMetadataResolution.ts`; extract the repeated `isIndexingEnabled()`+hreflang early-return into one `indexingGuard`.
- Define `LocalizedField` once (in `types/localized.ts`); remove the 4 redeclarations. Make `CatalogProperty` derive from one canonical Sanity property type; remove unused `Property` (domain) if confirmed unused. Fix `propertyAdapter.ts:2` to import `CatalogProperty` from `@/types/catalog`.
- Replace `as never` casts with the real fetcher return types where typing now allows.

# Forbidden changes
- Do NOT change any returned field, ordering, projection shape, filter logic, cache tag, or `revalidate`. This is a structural/typing refactor — outputs identical.
- Do NOT change the public metadata output (titles/descriptions/og/canonical/hreflang) for any page — only de-duplicate how it's computed.
- Do NOT touch the editor write paths' behavior.

# Step-by-step plan
1. Introduce fragments; migrate ONE query (e.g. `home.ts` top offers) to compose them; diff the resolved query string + a live result. Repeat per query.
2. Add `safeFetch`; migrate fetchers in small batches, re-running typecheck.
3. Centralize env; verify clients still connect.
4. Refactor the two divergent SEO adapters to delegate; diff metadata output on home + a blog post.
5. Unify `LocalizedField` and the Property type; delete dead type; remove now-unnecessary `as never`.

# Acceptance criteria
- The property-card projection exists in exactly one fragment; all 6 sites compose it.
- `as never` count in `src/lib/sanity` is materially lower (report before/after).
- `LocalizedField` defined once; Property modeled by one canonical type with `CatalogProperty` derived.
- Metadata output for home/property/blog/landing is unchanged (spot-diff).
- Identical data returned for catalog, property, home, blog, sitemap fetchers.

# Required checks
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`

# Output format
Report: fragments created and where composed, `safeFetch` migration count, env consolidation, SEO-adapter delegation diffs, type unification, `as never` before/after count, and proof (spot-diffs) that query + metadata outputs are unchanged.
