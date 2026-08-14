# Goal
Delete the template-leftover island and dead code: fake-API data modules, mock-data chain, orphan category pages, the dead `Auth/*` cluster, dead contexts/types, unused dependencies, and stale audit docs. **No behavior change to any live route.**

# Context
The audit (`docs/TECHNICAL_AUDIT_LATEST.md` §3, §6) proved a self-contained dead island: `src/app/api/*.tsx` (not route handlers) feed `src/data/*` mock data, consumed only by four near-identical `Properties/*` scaffolds used only by four orphan pages not linked from any live nav. Plus a dead sign-in cluster (with hardcoded `admin/admin123`), a donation context, an old breadcrumb, and three unused npm deps. Removing this shrinks surface area and eliminates thin/duplicate SEO pages.

# Files to inspect (and the importer evidence to re-confirm before deleting)
- `src/app/api/featuredproperty.tsx`, `footerlinks.tsx`, `propertyhomes.tsx`, `testimonial.tsx`
- `src/data/featuredProperty.ts`, `footer.ts`, `testimonials.ts`, `properties.ts`, `index.ts` (prune re-exports)
- `src/components/Properties/{Appartment,LuxuryVilla,OfficeSpaces,Residential}/index.tsx`
- `src/app/[locale]/{appartment,luxury-villa,office-spaces,residential-homes}/page.tsx`
- `src/components/Auth/**` (SignIn, SignUp, SocialSignIn, SocialSignUp) and `src/app/context/AuthDialogContext.tsx` (only used by Auth)
- `src/app/context/donationContext.tsx`
- `src/components/Breadcrumb/index.tsx`, `src/types/breadcrumb.ts`
- `package.json` deps: `react-slick`, `slick-carousel`, `react-phone-number-input`, `@types/react-slick`
- Root: `ARCHITECTURE_REPORT.md`, `properties-sticky-filters-audit.md`, `docs/TECHNICAL_AUDIT_2026.md`, and stale `docs/refactor-prompts/{02-seo-integrity,03-security-hardening,04-dead-code-removal,05-groq-type-dedup,phase-1-critical,phase-2-architecture,phase-3-performance,phase-4-cleanup,phase-5-saas}.md`

# Allowed changes
- Delete the files/dirs above **after** re-verifying zero live importers with grep.
- Remove the four dead deps from `package.json` and update the lockfile.
- Remove now-orphaned re-exports in `src/data/index.ts`.

# Forbidden changes
- **Do NOT delete** `Properties/PropertyList` or `Properties/PropertyGallery` (live, used by catalog & property detail).
- **Do NOT delete** the live nav data (`src/data/navConfig.ts`, `footerNavConfig.ts`, `nonGeoDealNavHref.ts`, `navigation.ts`, `blog.ts`) — verify which `data/*` files are live before pruning.
- **Confirm with the product owner** before deleting the four orphan category pages — they may be wanted as future SEO landings (if so, they need real CMS content + sitemap entries, handled elsewhere — leave them and mark `index:false` instead).
- No behavior change to any live route; no refactor of surviving code.

# Step-by-step plan
1. For EACH deletion target, run a grep for its import path/symbol; paste the result proving 0 live importers. If any live importer exists, STOP and report.
2. Delete leaf-first: components → pages → data modules → fake-API files.
3. Remove `Auth/**` + `AuthDialogContext.tsx` + `donationContext.tsx` together (AuthDialogContext is only used by Auth).
4. Remove old `Breadcrumb/index.tsx` + `types/breadcrumb.ts`.
5. Remove the four deps; run install to refresh lockfile.
6. Delete stale root/docs audit files and stale refactor-prompt files.
7. Run all checks.

# Acceptance criteria
- `grep -r` for each removed symbol/path returns nothing in `src`.
- App builds; every **surviving** route renders unchanged.
- Sitemaps and the live header/footer nav are unaffected.
- `package.json` no longer lists the four dead deps; `npm install` is clean.
- The four orphan pages are either deleted (owner-approved) or set `index:false` (documented choice).

# Required checks
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`

# Output format
Report: deleted files/dirs (grouped), removed deps, the grep evidence per deletion, the orphan-pages decision (deleted vs noindexed), and any item left pending owner confirmation.
