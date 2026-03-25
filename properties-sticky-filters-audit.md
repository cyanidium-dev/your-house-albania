# Properties Sticky Filters Audit

Audit-only: no code changes. Scope is the `/properties` catalog flow (root, `[city]`, `[city]/[district]` all use the same listing component), the filter/search bar, header interaction, and reusable UI patterns.

---

## 1. Relevant Files

| Path | Role |
|------|------|
| `src/app/[locale]/properties/page.tsx` | Root catalog route: `CatalogHero` + `PropertiesListing`. |
| `src/app/[locale]/properties/[city]/page.tsx` | City route: same `CatalogHero` + `PropertiesListing` with `pathCity`. |
| `src/app/[locale]/properties/[city]/[district]/page.tsx` | District route: same pattern (not re-opened here; assumed same stack). |
| `src/app/[locale]/layout.tsx` | Wraps all pages: `Header` → `{children}` → `Footer`. No extra scroll container. |
| `src/components/Properties/PropertyList/index.tsx` | Server component: fetches catalog data, builds `filterProps`, wraps `CatalogViewProvider` + `CatalogBodyClient` in `container … overflow-x-clip`. |
| `src/components/catalog/CatalogBodyClient.tsx` | Client: filter stack wrapper `relative z-20 min-w-0 [contain:layout]` + `PropertySearchBar` + results grid/map. |
| `src/components/catalog/PropertySearchBar.tsx` | **Single owner** of filter UI: deal/location/type/price, Reset / Advanced / Search, advanced row (beds, district, amenities, sort, page size, view mode). `applyFilters` + `router.push` on submit only. |
| `src/components/catalog/FilterSelect.tsx` | Select: `relative` trigger + **`absolute`** listbox (`top-full`, `z-[110]`) + **`fixed inset-0 z-[100]`** scrim while open. |
| `src/components/catalog/FilterMultiSelect.tsx` | Multi: mobile (`≤768px`) bottom sheet via **`createPortal`** to `document.body` (`z-[100]`); desktop **`fixed`** panel from `getBoundingClientRect` + scroll/resize listeners (`capture: true` on scroll). |
| `src/components/catalog/CatalogHero.tsx` | Hero above listing: `pt-16` / `md:pt-32`, `overflow-x-hidden` on section. |
| `src/components/Layout/Header/HeaderClient.tsx` | **`fixed left-0 right-0 z-50`** header; `md:top-3` when sticky; nav bar `md:h-24`-ish. |
| `src/components/Layout/Header/HeaderVisualState.tsx` | **`window.scrollY >= 50`** → `sticky` boolean (used for header styling only today). |
| `src/components/Layout/Header/HeaderMobileDrawer.tsx` | Full-height drawer: backdrop `z-40`, panel `z-50` (same band as header). |
| `src/components/ui/ConfirmModal.tsx` | Small centered dialog: **`z-[9999]`**, Escape, **`document.body.style.overflow = hidden`**. |
| `src/components/property/PropertyAmenitiesSection.tsx` | **Ad-hoc mobile full-screen sheet**: `fixed inset-0 z-[9999]`, backdrop, body scroll lock — pattern reference, not a shared primitive. |
| `src/contexts/CatalogViewContext.tsx` | View mode (large/small/list) for results; consumed inside `PropertySearchBar` via `ViewModeSwitcherUI` + `getCurrentView` for apply. |

---

## 2. Current Filter Bar Structure

### A. Exact render path (`/properties`)

1. `locale/layout.tsx` renders `Header` then page `children`.
2. `properties/page.tsx` renders `CatalogHero` then `<PropertiesListing … />`.
3. `PropertyList/index.tsx` renders `<section className='pt-0!'>` → `container … overflow-x-clip` → `CatalogViewProvider` → `CatalogBodyClient`.
4. `CatalogBodyClient` renders the wrapper div then `<PropertySearchBar {...filterProps} getCurrentView={…} />` then the results block.

City/district URLs differ only in server props passed into the same `PropertiesListing` / `CatalogBodyClient` / `PropertySearchBar` chain.

### B. Component ownership

| Concern | Owner today |
|---------|-------------|
| Deal type (sale / rent / short-term) | **`PropertySearchBar`**: `FilterSelect` labeled “deal type”, options from `dealTypeValues` (`['sale','rent','short-term']` in `PropertyList`) + `getDealLabel` / i18n. **Not** separate pill tabs. |
| Main filters (location, type, deal, price, actions) | **`PropertySearchBar`** (`form` → basic grid). |
| Advanced filters (beds, district, amenities, sort, page size, view) | **`PropertySearchBar`**: `showAdvanced` + animated height + `overflow-visible` when open (dropdown clipping fix). |
| Search / apply to URL | **`PropertySearchBar`**: `handleSubmit` → `applyFilters()` → `router.push`. |
| Reset | **`PropertySearchBar`**: button → `router.push(catalogPath(locale))`. |

No separate “deal tabs” component exists; the UX spec’s “Sell / Rent / Short-term tabs” would be **new UI** (or a visual swap of the current deal control) inside or beside `PropertySearchBar`.

### C. State ownership

All draft filter state (`city`, `type`, `deal`, price slider state, `beds`, `district`, `sort`, `pageSize`, `amenities`, `showAdvanced`) lives in **`PropertySearchBar`** as `useState`, synced from URL-derived `initial*` via a `useEffect` on `initialAmenitiesKey` + other initials.

### D. Submit flow

- Single `<form onSubmit={handleSubmit}>`.
- Advanced controls do **not** auto-apply; only **Search** submits.

---

## 3. Sticky Desktop Feasibility

### Can the filter block be `position: sticky`?

**Likely yes**, with verification:

- The scroll root is the **viewport** (layout does not wrap `children` in `overflow-auto`).
- Sticky would apply to an element that remains in the normal document flow inside the listing (e.g. wrapper around `PropertySearchBar` in `CatalogBodyClient` or an outer shell in `PropertySearchBar`).

### Correct offset vs fixed header

- Header: **`fixed`**, **`z-50`**, mobile `top-0` with `min-h-[3.25rem]` + safe-area padding; from `md:` **`top-3`** and taller bar (`md:h-24` class on nav area).
- **No shared CSS variable** for header height today; offset would be **approximate** (`calc(env(safe-area-inset-top) + …)` + rem) or a one-off measurement / design token.
- Desired **gap below header** is product spacing (e.g. `mt-2` / `gap-3`) added to that `top` value on the sticky bar.

### Parent constraints (risks)

1. **`overflow-x-clip` on the catalog `container`** (`PropertyList/index.tsx`): Some engines treat non-`visible` overflow on an ancestor as affecting sticky containment. **Test sticky in Chrome/Safari/Firefox** with the bar inside this container. If sticky fails or clips oddly, **move the sticky wrapper outside** the clipped container (e.g. sticky on a full-bleed row, inner content aligned to container width) or relax `overflow-x-clip` for the filter row only.

2. **`[contain:layout]` on the filter wrapper** (`CatalogBodyClient`): Layout containment can interact with sizing/stacking. Unlikely to fully block sticky, but **verify** after implementation; remove or narrow containment on the sticky ancestor if issues appear.

3. **`transform` / `filter` on ancestors**: None identified on the main catalog chain above the filter; header uses transitions but filter is **not** inside the header.

4. **`CatalogHero` `overflow-x-hidden`**: Sibling above the listing; should not affect sticky on content below.

### Safest implementation point

- **Prefer a thin sticky wrapper in `CatalogBodyClient`** around `PropertySearchBar` (or the first child of the fragment): keeps scroll/listener concerns next to layout/z-index comments already there (`z-20`).
- Alternative: **sticky on the outer `form` / shell in `PropertySearchBar`** if all responsive behavior stays colocated; slightly more coupling.

**Stacking:** Header is **`z-50`**. Filter wrapper is **`z-20`**. When sticky, the bar should sit **under** the header (lower z-index + `top` below header bottom) so it never covers nav. If dropdowns need to overlap the header, today **`FilterSelect` / `FilterMultiSelect` use `z-[100]+`** — they can still paint above the header; confirm product preference (usually acceptable for open menus).

---

## 4. Compact Sticky Desktop Behavior

### Detecting “scrolled enough”

Reuse the **same idea as `HeaderVisualState`**: `window` scroll listener in `useEffect`, threshold e.g. `scrollY >= 50` (or a larger value tied to “past hero + filter”). Initial render: default to **non-compact** to match SSR (`sticky === false` pattern). No hydration mismatch if UI does not depend on scroll until after mount.

Optional: **`IntersectionObserver`** on a sentinel below the filter or below the hero — fewer scroll handlers, clearer semantics (“filter left viewport”).

### What should stay visible in compact sticky mode

Product goal: **full primary row** (location, type, deal, price, actions) remains usable; **advanced section auto-collapsed**.

- Set **`showAdvanced` to `false`** when entering compact sticky mode (and optionally remember user intent if they had it open — product choice).
- **Re-open** via existing **“Advanced filters”** button; **overflow-visible / height measure** behavior must stay coherent when advanced opens while sticky (same clipping rules as today).

### Risks

- **Dropdowns inside sticky**: `FilterSelect` listbox is `absolute` under a `relative` cell; with `position: sticky` on an ancestor, positioning generally remains correct. **`FilterMultiSelect` desktop** already uses **`fixed`** + scroll listeners — robust while sticky.
- **Z-index**: Open panels at `z-[100]`–`z-[110]` vs header `z-50` — menus appear on top; acceptable or tune per design.
- **Reduced vertical space**: compact mode might still be tall on small laptop heights; consider slightly denser padding only in sticky mode (optional, avoid scope creep).

---

## 5. Mobile Collapsed Sticky + Modal Plan

### Current mobile structure

- **One form**: single column grid on small screens (`grid-cols-1`), then `sm:` breakpoints for row layout.
- **Deal** is a **labeled `FilterSelect`**, not tabs.
- **Advanced** button shows `filtersShort` on `sm:hidden`.
- **Reset / Advanced / Search** stack full-width on smallest breakpoint (`w-full` until `sm:w-auto`).

### Gap vs desired UX

The spec asks for **deal tabs only + one action** in the collapsed sticky bar. Today there are **no tabs** — only a dropdown. **Safest direction:** add a **segmented control** (reuse styling similar to `ViewModeSwitcherUI` pill group in `PropertySearchBar`) bound to the same `deal` state and `dealTypeValues`, using existing **`getDealLabel`** / i18n keys.

### Reusable modal / sheet options

| Pattern | Fit |
|---------|-----|
| **`ConfirmModal`** | Wrong shape (confirm/cancel, small card). Not for full filter form. |
| **`HeaderMobileDrawer`** | Side drawer, `z-40`/`z-50`, no body lock — **not ideal** for full-width filter sheet and conflicts with header z-index story. |
| **`FilterMultiSelect` mobile** | **Bottom sheet + portal + overlay** at `z-[100]` — closest internal reference for **filter-adjacent** mobile UI. |
| **`PropertyAmenitiesSection` modal** | Full-screen mobile panel, **body `overflow: hidden`**, Escape — good **copy-paste reference** for structure; **not** an exported component. |

**Conclusion:** There is **no dedicated reusable “catalog filter modal”**. The **minimal pattern** is: **portal + fixed inset-0 + backdrop + scrollable panel** (amenities-style or FilterMultiSelect-style), with **z-index above header** (e.g. `z-[100]`–`z-[9999]`) decided explicitly.

### Modal vs filter state / Search

- **Single React component** (`PropertySearchBar`) should own all state so the modal is **not** a second source of truth.
- **Recommended structure:**  
  - **Collapsed sticky bar (mobile):** not a second `<form>`; only **`deal` tabs** + **Open filters** / **Close** toggle. Changing deal updates **`deal` state** only (same as today); URL still updates on **Search** inside the modal (or keep one `<form>` in the modal only on mobile when using modal — see below).
- **Avoid** two `<form>` elements with duplicated `name`s. Practical approach:  
  - **Either** render **one** `<form>` **inside the modal** on small screens when modal is the editing surface, and render **non-form** compact bar + **duplicate submit only in modal**;  
  - **Or** keep **one form** in the document and use **CSS** to present it inside a modal (harder without fragment portals).  
  **Simplest minimal:** mobile scrolled → hide main form; **modal contains the full form** (move JSX once, conditional mount) + **Search** button; compact bar outside form with deal controls calling `setDeal` only.

### Close vs Open button

Toggle **same** control: label **“Filters”** when closed, **“Close”** when modal open; action closes modal without applying (unless product wants “apply on close” — contradicts current submit-only contract; **do not** without explicit change).

### Body scroll lock

When modal open, follow **`ConfirmModal` / amenities**: `document.body.style.overflow = 'hidden'` and restore on close. Coordinate with **nested** `FilterSelect` scrims (`fixed inset-0 z-[100]`) — usually fine; test iOS overscroll.

---

## 6. Recommended Minimal Implementation Plan

1. **Sticky shell (desktop + tablet breakpoint where layout matches)**  
   - Add `sticky` wrapper + `top: …` matching header + desired gap.  
   - **Validate** with `overflow-x-clip` container; adjust wrapper placement if sticky fails.

2. **Compact mode flag**  
   - `useEffect` + scroll threshold (or `IntersectionObserver`), default `false` on SSR.  
   - When `true` (desktop/tablet): **`setShowAdvanced(false)`** once on transition to compact (or every time while compact — prefer once to allow manual reopen).

3. **Mobile-only collapsed sticky bar**  
   - **`md:hidden`** (or chosen breakpoint) row: **deal segmented control** + **Filters/Close** button.  
   - **z-index** and **background** (e.g. `bg-white/95` + border) so it reads as a bar, not floating text.

4. **Mobile modal**  
   - New overlay in **`PropertySearchBar`** (or tiny `CatalogFilterModal.tsx` colocated) modeled on **amenities modal** or **FilterMultiSelect** sheet: portal, backdrop, scroll body, Escape, focus trap optional v1.  
   - **Single form** + **Search** inside modal for mobile when using this pattern.  
   - **z-index** explicitly **> 50** (header).

5. **Do not** refactor `applyFilters`, Sanity, or `CatalogBodyClient` map logic; **optional** one-line z-index tweak on filter wrapper if sticky stacking requires it.

6. **QA:** sticky open `FilterSelect` / amenities sheet, header overlap, scroll with modal open, URL still only updates on **Search**.

---

## 7. Diff Readiness (files likely to change later)

| File | Why |
|------|-----|
| `src/components/catalog/CatalogBodyClient.tsx` | Sticky wrapper, possibly z-index / containment tweaks. |
| `src/components/catalog/PropertySearchBar.tsx` | Scroll/compact state, advanced auto-collapse, mobile compact bar, modal shell, deal tabs UI, conditional layout of `<form>`. |
| `src/components/Properties/PropertyList/index.tsx` | **Only if** sticky must sit **outside** `overflow-x-clip` — restructure container (higher risk). |
| **New file (optional)** | `CatalogFilterMobileModal.tsx` — only if you want to keep `PropertySearchBar` smaller; otherwise inline is acceptable for minimal scope. |

**Unlikely needed for v1:** `HeaderVisualState.tsx` (unless sharing one scroll source), `FilterSelect.tsx` / `FilterMultiSelect.tsx` (unless z-index or portal policy changes).

---

## E. Risk analysis (summary)

| Risk | Mitigation |
|------|------------|
| Dropdown clipping in sticky | Keep advanced `overflow-visible` when open; retest; `FilterMultiSelect` already portals on mobile. |
| Z-index vs header | Sticky bar `< 50`; overlays/menus `≥ 100` by current pattern — document and test. |
| Body scroll lock | Modal open → lock; close on Escape/button; avoid double-lock if nesting scrims. |
| Hydration | Scroll-driven UI defaults off until `useEffect`. |
| Duplicated Search | Single form in modal path on mobile; compact bar without submit. |
| Desktop/mobile divergence | One state tree in `PropertySearchBar`; breakpoints only affect **layout** and **which surface** shows the form. |
| `overflow-x-clip` | Test sticky early; move wrapper if needed. |

---

*End of audit.*
