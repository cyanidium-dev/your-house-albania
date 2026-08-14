# Refactor Prompt 07 — SaaS Preparation (P3, design-first)

## Goal
Produce a concrete design + thin spike for multi-tenancy. This phase is **design and isolated groundwork only** — no change to current single-tenant production behavior.

## Context
SaaS readiness is 12/100. The app is hard-wired single-tenant: a single Sanity project/dataset is read at module load (`src/lib/sanity/queries/_core.ts:4-5`), a single domain (`src/lib/siteUrl.ts`), brand "Domlivo" hardcoded (`layout.tsx:11`, `siteJsonLd.ts:29`, `staticListingMetadata.ts:27`). `agent` is a content entity, not a tenancy primitive (`/agent/[agent]` is a GROQ filter — `catalog.ts:85-87`). Audit §13.

## Files to inspect
- `src/lib/sanity/queries/_core.ts:4-5` (project/dataset binding)
- `src/lib/siteUrl.ts` (domain)
- `src/app/[locale]/layout.tsx:11`, `src/lib/seo/siteJsonLd.ts:29`, `staticListingMetadata.ts:27` (brand)
- `src/middleware.ts` (where host→tenant resolution would live)
- `src/lib/sanity/queries/catalog.ts:85-87` (agent filter, for contrast)

## Allowed changes
- Write a design doc: tenant model, tenant resolution (host→tenant), data-isolation strategy (dataset-per-tenant vs shared-dataset+tenant-filter), per-tenant domains/branding/i18n/theming, roles/authZ, billing.
- A behind-a-flag, default-off spike: a `resolveTenant(host)` stub that returns the current single tenant unchanged when the flag is off.

## Forbidden changes
- Do NOT change current production behavior or the single-tenant default path.
- Do NOT alter `_core.ts` data-source binding for the live site.
- Do NOT introduce per-request dataset switching on the live path.
- Do NOT expose any server-only token to the client.

## Step-by-step plan
1. Draft the design doc with a recommended isolation model and migration path; list the exact files each future phase touches.
2. Add `resolveTenant(host)` returning the current tenant when the SaaS flag is unset (no-op in prod).
3. Identify the brand/domain constants that must become tenant-scoped and list them (do not yet rewire prod).
4. Run checks to prove the spike is inert.

## Acceptance criteria
- Design doc exists and names the chosen isolation model + per-phase file list.
- With the flag off, runtime behavior is byte-identical to today (single tenant, same domain/brand).
- `lint`+`typecheck`+`build` green.

## Required checks
```
npm run lint
npm run typecheck
npm run build
```

## Output format
Link the design doc, show the `resolveTenant` stub, and confirm the flag-off path is unchanged.
