# Goal
Cut client JS and layout instability: lazy-load the property-detail map, configure `next/image` for the Sanity CDN, remove dead heavy deps, push the currency boundary so cards can be server components, and kill a `matchMedia`-driven CLS. **No visual change.**

# Context
Audit §11. `PropertiesMap` (catalog) is already lazy, but `PropertyLocationMap` is imported eagerly into every property page, shipping maplibre-gl in that route's bundle. `next.config.ts` has no `images` block. Three npm deps are unused. Several non-interactive components are needlessly `"use client"`, and a `matchMedia`→state pattern shifts card widths after mount.

# Files to inspect
- `src/app/[locale]/property/[slug]/page.tsx:8` (eager `import` of `PropertyLocationMap`, rendered `:269`)
- `src/components/catalog/CatalogBodyClient.tsx:18` (the correct `next/dynamic` pattern to copy) and `:462,495` (raw `<img>` in map popups)
- `next.config.ts` (no `images.remotePatterns`)
- `package.json` — confirm `react-slick`, `slick-carousel`, `react-phone-number-input` unused (grep), then ensure they were removed in Phase 2 (if not, remove here)
- Currency boundary: `src/components/shared/PriceText.tsx` (+ `useCurrency`), `src/components/shared/property/PropertyCard.tsx`, `PropertyBadges.tsx`
- CLS: `src/components/property/SimilarPropertiesCarousel.tsx:18` (`matchMedia`→`isMobile`)
- Other server-able client components: `src/components/property/PropertyAmenitiesSection.tsx`, `src/components/Layout/Footer/index.tsx`, `src/components/catalog/ViewModeSwitcherUI.tsx`

# Allowed changes
- Convert `PropertyLocationMap` to `next/dynamic({ ssr:false })` with a sized placeholder (mirror `CatalogBodyClient.tsx:18`).
- Add `images.remotePatterns` (Sanity CDN host) + sensible `formats`/`deviceSizes` to `next.config.ts`; convert the two `CatalogBodyClient` `<img>` to `next/image` where layout permits.
- Isolate `useCurrency` into the smallest leaf (`PriceText`) so `PropertyCard`/`PropertyBadges` can drop `"use client"` and render on the server.
- Replace the `matchMedia`→state width switch with a CSS/responsive approach (no post-mount state flip).

# Forbidden changes
- No visual/layout change: image sizes, card appearance, and map behavior must look identical.
- Do NOT lazy-load anything above the fold that would hurt LCP; the map is below the fold on detail pages — verify.
- Do NOT convert a component to a server component if it actually uses state/effects/handlers — verify each candidate first.
- No new dependencies.

# Step-by-step plan
1. `next/dynamic` the property map; confirm the page renders and the map still appears on scroll; check the route's JS payload drops.
2. Add the images config; convert the two `<img>`; verify Sanity images still load (no broken/remote-host errors).
3. Move currency to `PriceText`; remove `"use client"` from `PropertyCard`/`PropertyBadges` only if they then have no client-only APIs.
4. Replace the `matchMedia` width switch with CSS; verify no width jump on load.

# Acceptance criteria
- Property-detail route no longer bundles maplibre-gl in its initial JS (verify via build output / bundle analysis).
- `next/image` serves Sanity images with no console/runtime remote-host error.
- `PropertyCard`/`PropertyBadges` compile as server components (or are documented as why they must stay client).
- No card-width shift on the similar-properties carousel during load (CLS).
- All four previously-flagged deps are gone from `package.json`.

# Required checks
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`

# Output format
Report: bundle-size before/after for the property route (maplibre removed), images config added, components converted to server (or why not), the CLS fix, and any candidate you left as client (with the client-only API that requires it).
