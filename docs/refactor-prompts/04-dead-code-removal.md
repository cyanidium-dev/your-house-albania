# Refactor Prompt 04 — Dead Code Removal (P2)

## Goal
Shrink the maintenance surface by deleting verified-unused template residue. No behavior change.

## Context
The audit found ~12 files with 0 importers / 0 JSX usage — leftovers from the starter template. Removing them reduces onboarding confusion and eliminates a latent hardcoded-cred liability. Audit §6.

## Files to inspect (and candidate deletions — VERIFY 0 importers before deleting each)
- `src/data/{testimonials,featuredProperty,blog,footer,navigation}.ts` + `src/data/index.ts`
- `src/app/api/{testimonial,featuredproperty,footerlinks}.tsx`
- `src/app/context/{AuthDialogContext,donationContext}.tsx`
- `src/components/Breadcrumb/index.tsx` (legacy; shared one lives in `src/components/shared/Breadcrumb`)
- `src/components/utils/{markdownToHtml,validateEmail}.ts` (if unused; otherwise see prompt 05/06 for relocation)
- `src/lib/.../nonGeoDealNavHref.ts` (~75% dead — remove only the unused exports)
- NOTE: `src/data/properties.ts` is LIVE until prompt 02 removes the mock pages — do NOT delete here.

## Allowed changes
- Delete files only after grep proves zero importers (production + tests).
- Remove now-unused exports from partially-dead modules.

## Forbidden changes
- Do NOT delete anything still imported anywhere.
- Do NOT delete `src/data/properties.ts` (depends on prompt 02).
- Do NOT change behavior of any live component.

## Step-by-step plan
1. For each candidate, run `grep -r "<basename>"` across `src/` and `__tests__`/`*.test.*`. Zero hits (other than the file itself) → safe to delete.
2. Delete confirmed-dead files.
3. For `nonGeoDealNavHref.ts`, remove only exports with zero references.
4. Run checks; fix any surfaced import.

## Acceptance criteria
- All deleted files had zero importers (show the grep evidence).
- `lint` + `typecheck` + `build` all green with no new errors.
- No runtime route or component changed behavior.

## Required checks
```
npm run lint
npm run typecheck
npm run build
```

## Output format
Table of each candidate → grep hit count → deleted/kept decision. Confirm build is green.
