# Refactor Prompt 06 — Performance (P3)

## Goal
Reduce payload and layout shift without changing visuals: drop runtime icon fetching and let `next/image` optimize Sanity CDN images.

## Context
`@iconify/react`'s runtime `Icon` is used in 37 files → per-icon network fetch + CLS. ~50 `next/image` usages set `unoptimized` (Sanity CDN bypasses Next optimization) → larger payloads. The map is already correctly lazy-loaded — leave it. Audit §11.

## Files to inspect
- Grep `@iconify/react` (37 files) — catalog the actual icon names in use.
- Grep `unoptimized` on `next/image` (~50 sites).
- `next.config.*` (image config / loader).

## Allowed changes
- Replace runtime Iconify with a build-time/offline approach: either `@iconify/json` + offline addon, or local SVG components for the finite icon set actually used.
- Add a Sanity image loader (custom `loader` or `images.remotePatterns` + remove `unoptimized`) so `next/image` can serve sized/optimized images.

## Forbidden changes
- Do NOT change icon glyphs or sizes (visual parity required).
- Do NOT change the lazy map setup.
- Do NOT introduce a new heavy runtime dependency.

## Step-by-step plan
1. Enumerate every icon name actually rendered; build the offline/local set covering exactly those.
2. Swap `Icon` usages; verify each renders the same glyph/size.
3. Configure the Sanity image loader; remove `unoptimized` only where the loader covers the host.
4. Spot-check LCP/CLS on catalog + property detail before/after.
5. Run checks.

## Acceptance criteria
- No runtime icon network requests for the rendered set (verify in Network panel).
- Visual parity (icons + images look identical).
- LCP/CLS not regressed on catalog and property detail.
- `lint`+`typecheck`+`build` green.

## Required checks
```
npm run lint
npm run typecheck
npm run build
```

## Output format
List changed files, the icon-replacement strategy, the image-loader config, and a short before/after note on payload/CLS for one page.
