# Goal
Remove the remaining component-level duplication: fold the `CatalogBreadcrumb` inline helpers into the shared breadcrumb lib, and extract shared form primitives from the contact/register forms. **No visual or behavioral change.**

# Context
Audit §5. Most breadcrumbs already follow a healthy shared-primitive + thin-wrapper pattern, but `CatalogBreadcrumb` re-implements `formatSlug`/`buildCurrentPath` that already exist in `src/lib/routes/breadcrumbs.ts`. The contact and register forms duplicate an `inputClass` string, a honeypot block, and a submit-button class. (The scaffold and `Auth/*` duplicates were already deleted in Phase 2.)

# Files to inspect
- `src/components/shared/CatalogBreadcrumb/index.tsx` (~200 lines; inline `formatSlug`, `buildCurrentPath`)
- `src/lib/routes/breadcrumbs.ts` (existing `buildBlog…/buildCities…/buildCityLanding…/buildFavorites…/buildPropertyDetail…`, `formatBreadcrumbSlug`, `toBreadcrumbJsonLdItems`)
- The 5 healthy wrappers as the pattern to match: `shared/{BlogBreadcrumb,CitiesBreadcrumb,CityLandingBreadcrumb,FavoritesBreadcrumb,PropertyDetailBreadcrumb}/index.tsx`
- `src/components/contact/GeneralContactForm.tsx` and `src/components/register/RegistrationRequestForm.tsx` (shared `inputClass`, honeypot `companyWebsite`, submit button)
- `src/components/catalog/FilterSelect.tsx` (already shared by both forms — reference for where shared primitives could live)

# Allowed changes
- Add `buildCatalogBreadcrumbItems` / `buildCatalogCurrentPath` to `src/lib/routes/breadcrumbs.ts`, mirroring the other builders; rewrite `CatalogBreadcrumb` to consume them + the shared `Breadcrumb` + `BreadcrumbJsonLd`.
- Extract a shared `inputClass` constant, a `<HoneypotField>` component, and a `<SubmitButton>` (or shared class) used by both forms. Place them where the forms can both import (e.g. a `components/shared/form/` module).

# Forbidden changes
- Do NOT merge the two forms — they have different fields, validation, and endpoints. Only extract the shared primitives.
- Do NOT change breadcrumb output: the rendered trail and JSON-LD items for catalog routes must be byte-identical.
- Do NOT touch the 5 already-healthy breadcrumb wrappers beyond what's needed for consistency.
- No restyle, no class tweaks beyond consolidating the identical strings.

# Step-by-step plan
1. Read `CatalogBreadcrumb` and map its inline path logic to equivalents in `breadcrumbs.ts`. Add the new builders there with unit-level parity to the inline versions.
2. Rewrite `CatalogBreadcrumb` to call the builders. Compare rendered output on several catalog route shapes (deal, deal+type, country/city, agent variants).
3. Extract `inputClass` + honeypot + submit primitive; point both forms at them.
4. Run checks; manually diff a rendered catalog breadcrumb and a submitted form before/after.

# Acceptance criteria
- `CatalogBreadcrumb` no longer contains its own `formatSlug`/path logic.
- Catalog breadcrumb trail + JSON-LD identical for: `/sale`, `/sale/apartment`, `/{country}/{city}`, agent routes.
- Both forms render the same inputs/placeholders and submit successfully; honeypot still blocks bots.
- The duplicated `inputClass` string exists in exactly one place.

# Required checks
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`

# Output format
Report: new lib builders + shared form primitives, files rewritten to consume them, before/after breadcrumb comparison for the listed routes, and confirmation the two forms were NOT merged.
