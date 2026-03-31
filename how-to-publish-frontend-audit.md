# Frontend audit: `/[locale]/how-to-publish`

Audit only — no implementation. Scope: assess reuse patterns for a static informational page (hero, video, CTAs, numbered steps) and routing.

---

## 1. Relevant files reviewed

| Path | Purpose |
|------|---------|
| `src/app/[locale]/layout.tsx` | Locale layout, `next-intl`, Header/Footer; validates locale via `routing`. |
| `src/app/[locale]/contacts/page.tsx` | Minimal static page pattern: `params`, pass `locale` to a content component. |
| `src/app/[locale]/for-realtors/page.tsx` | CMS-driven landing via `LandingRenderer` + Sanity slug (contrast with static pages). |
| `src/app/[locale]/contact/[slug]/page.tsx` | Dynamic route + Sanity + metadata pattern. |
| `src/middleware.ts` | `next-intl` middleware; legacy `/al/` → `/sq/` redirect. |
| `src/i18n/routing.ts` | Locales (`en`, `uk`, `ru`, `sq`, `it`), `localePrefix: "always"`. |
| `src/components/Home/Hero/index.tsx` | Home/landing hero: gradient/bg image, h1, subtitle, CTAs, optional search — not a generic “info + video” hero. |
| `src/components/landing/sections/HeroSection.tsx` | Thin wrapper around `Home/Hero` for landing CMS. |
| `src/components/landing/sections/CtaSection.tsx` | Centered section with eyebrow, title, description, primary/secondary CTAs; locale-aware `resolveHref`, external links `target="_blank"` + `rel`. |
| `src/components/landing/sections/impl/MarketingContentSectionImpl.tsx` | Marketing split layouts, `MarketingIntro`, bullet lists (dots), `<video>` for **file** URLs (not iframe embeds). |
| `src/components/landing/sections/SeoTextSection.tsx` / `impl/SeoTextSectionImpl.tsx` | Portable Text prose sections (bullets only in SEO impl, no numbered list variant). |
| `src/components/Blog/BlogArticleContent.tsx` | Portable Text: numbered lists via `<ol className="... list-decimal pl-6">`; locale-aware link resolver. |
| `src/components/contact/ContactPageContent.tsx` | Example of a mostly static informational layout (container, typography, `Link` with `/${locale}`). |
| `src/components/ui/button.tsx` | shadcn-style `Button` + CVA variants (used in modals/carousel; marketing CTAs mostly use styled `Link`/`a`). |
| `src/data/navConfig.ts` | Drawer nav shape; `realtors` expandable → `/for-realtors`. |
| `src/components/Layout/Header/Navigation/DrawerNavList.tsx` | For Realtors sub-items (`realtorsAbout`, `realtorsRegister`) — currently non-link placeholders; path prefix `/${locale}/for-realtors` controls expand. |
| `src/components/Layout/Header/index.tsx` | Nav translation keys including realtor children. |

---

## 2. Recommended page architecture

**Recommendation: static page composed of reusable patterns, with small page-local (or one shared) pieces for video and steps.**

- **Fully static page component** under `src/app/[locale]/how-to-publish/page.tsx` is the cleanest fit: aligns with `contacts/page.tsx` (no Sanity fetch for body content). Metadata can be static or use `getTranslations` / `generateMetadata` for titles per locale.
- **Reuse** existing layout primitives: `container max-w-8xl mx-auto px-5 2xl:px-0`, section spacing (`py-16 md:py-24` as in landing sections), typography classes from `CtaSection` / `MarketingIntro`-like patterns, and the **same locale rules** as `CtaSection` (`resolveHref` semantics: internal paths → `/${locale}${path}`).
- **Do not** wire this page through `LandingRenderer` unless product later requires CMS-editable body; that would add unnecessary Sanity surface for a “mostly static” goal.
- **Hybrid with minimal CMS** is optional later (e.g. only SEO title/description from Sanity); not required for first version.

**Why not reuse `HeroSection` / `Home/Hero` as-is:** those are tuned for full-bleed home/landing (min-height, search widget, CMS fields). A dedicated hero block for “title + subtitle + paragraph + embed + CTA” is simpler and avoids pulling search/catalog dependencies.

---

## 3. Reusable component / pattern inventory

| Page part | What exists | Reusability | Fit |
|-----------|-------------|-------------|-----|
| **Hero (h1, h2, paragraph, CTA)** | `Home/Hero` (via `HeroSection`), `MarketingIntro` inside `MarketingContentSectionImpl` (h2-style titles, eyebrow, subtitle, description, Link CTA) | `MarketingIntro` is **not exported**; `HeroSection` is **wrong shape** for video + informational layout | **Pattern reuse** (spacing, heading scale, rounded pill Link styles) — implement a **page-local hero** or extract a small shared `InfoHero` only if used twice. |
| **CTA buttons** | `CtaSection` (+ internal `CtaButton`), `MarketingIntro` Link, `Home/Hero` Link | **High** for lower-page full-width CTA: import `CtaSection` and pass labels/hrefs. **High** for hero: copy the same `resolveHref` / external vs `next/link` rules from `CtaSection` (or extract a tiny shared helper later). | **Good fit** for section 2; hero CTA should mirror same classes/rules as `CtaSection` for consistency. |
| **Content text blocks** | `SeoTextSectionImpl`, blog Portable Text, marketing sections | Portable Text is overkill for static copy; use **JSX + Tailwind** matching existing `max-w-3xl` / text opacity tokens. | **Good fit** as plain markup. |
| **Video / media embed** | **No** YouTube/Vimeo iframe component found; marketing uses **HTML5 `<video src>`** for file URLs in `MarketingContentSectionImpl` | **Not reusable** for iframe embeds | **New small component** (see §4). |
| **Numbered steps** | Blog PT: `<ol>` + `list-decimal`; marketing: **bullet** lists with dot markers; **no** `counter()` in TSX/CSS search | Blog list is **semantic `<ol>`** but **not** custom counter styling | **Page-local steps section** or one shared `StepsList` if reused; CSS counters are **not** present today. |
| **Two-column / media + text** | `MarketingContentSectionImpl` `grid lg:grid-cols-2`, `aspect-*` wrappers | **High** for layout CSS only | Reuse **grid + `aspect-video` + order classes** patterns; content is custom. |

---

## 4. Video embed audit

**Does reusable video embed support already exist?** **No.** A repo-wide search for `iframe` in `src/**/*.tsx` did not find YouTube/Vimeo (or other) embed components. The only video usage located is **native `<video>`** with a direct file URL in `MarketingContentSectionImpl` (background-style promo), not third-party embeds.

**CMS-driven video:** `videoUrl` / `promoMediaType === 'video'` in marketing sections refers to **file URLs** for `<video>`, not iframe rendering.

**Smallest safe implementation path (for a later implementation phase):**

1. Add a **small client or server component** (server is fine for static `src` URL) that renders a **privacy-conscious** YouTube embed (e.g. `youtube-nocookie.com` when applicable) or Vimeo iframe.
2. Wrap in **`aspect-video` + `relative` + `overflow-hidden` + `rounded-2xl`** (consistent with `blogCard` / `aspect-video` usage elsewhere).
3. **Iframe attributes:** `title` (required for a11y), `loading="lazy"` (below fold) or `loading="eager"` only for above-the-fold hero (trade LCP vs bandwidth), `allow` limited to what is needed (e.g. `accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share` if matching platform docs), `allowFullScreen` when the design expects fullscreen.
4. **Security:** only construct `src` from **allowed hosts** (YouTube/Vimeo allowlists) or from **hardcoded IDs** on a static page — avoid passing arbitrary user/CMS strings into `src` without validation.
5. **Autoplay:** for hero, prefer **no autoplay** for embeds (better UX and often blocked); marketing’s `<video autoplay muted>` is a different pattern (file background).

**Verdict:** A **lightweight dedicated component** (or a single page-local block) is the best path; there is nothing to reuse for iframe embeds.

---

## 5. Numbered steps audit

**CSS counter / styled steps component:** **Not found.** No `counter(` usage surfaced in TSX/CSS scans. No shared “timeline/steps” component.

**Native `<ol>` customization:** **Yes**, in **`BlogArticleContent.tsx`** — numbered lists use `<ol className="mt-4 flex flex-col gap-2 list-decimal pl-6">` with plain `<li>` children. That is **browser default numbering**, not a custom counter design.

**Smallest safe approach:**

- For the desired **visual control**, implement **`list-none` + CSS `counter-increment` / `::before`** on a wrapper (Tailwind arbitrary variants or a scoped CSS module), **or** a **flex column** with explicit step numbers in a styled circle — page-local first.
- **Page-local vs shared:** start **page-local**; promote to `components/shared` only if a second page needs the same step UI.

---

## 6. Route / localization notes

**Best route file location:** `src/app/[locale]/how-to-publish/page.tsx`.

**Localized URL:** With `localePrefix: "always"`, the public path is `/{locale}/how-to-publish` (e.g. `/en/how-to-publish`).

**Locale-aware links / buttons:** Match existing patterns:

- Internal paths: `/${locale}${href}` when `href` starts with `/` (as in `CtaSection.resolveHref`, `marketingCtaHref`, blog `resolveCtaHref`).
- External `http(s)`: open in new tab with `rel="noopener noreferrer"` where appropriate (`CtaSection` already does this).

No extra middleware work is required for a new static segment.

**Navigation (informational only):** `DrawerNavList` expands the Realtors section when `path === /${locale}/for-realtors` or under `for-realtors/`. The new route **`/how-to-publish` does not sit under `/for-realtors`**, so it **will not** auto-expand that drawer by current logic. Updating nav labels/links is out of scope for this audit; when implemented, child links will need real `href`s (today realtor children are disabled placeholders).

---

## 7. Minimal safe implementation scope (later — not part of this audit)

1. **`page.tsx` + optional `HowToPublishContent.tsx`** (or single file) with static JSX/copy (or `next-intl` keys for strings).
2. **`generateMetadata`** (or static `metadata`) for title/description per SEO needs.
3. **Hero block:** layout only; reuse typography/spacing tokens from landing/contact.
4. **`EmbeddedVideo` (or inline) iframe** with allowlisted URL builder + `aspect-video` wrapper + `title`.
5. **Steps block:** page-local CSS-counter or custom numbered flex list.
6. **CTAs:** reuse **`CtaSection`** for block 2; hero CTA using same link resolution and button classes as `CtaSection`.
7. **Translations:** add message keys under a namespace (e.g. `HowToPublish`) for EN + other locales as needed.

---

## 8. Final verdict

**Ready for implementation with small dedicated static page work.**

Rationale: routing and localization patterns are established; CTA and layout patterns are reusable; **video iframe support does not exist** but is a **small, isolated addition**; numbered steps have **no existing counter-based component**, so a **page-local** (or one shared) implementation is appropriate without a large refactor. **Not blocked** by missing core frontend infrastructure.

---

## Rules compliance

- Audit only; no code changes in the application for this deliverable.
- Prefer reuse where it fits; avoid forcing `LandingRenderer` / `HeroSection` for this content shape.
- Video: **explicit — no reusable YouTube/Vimeo embed in the repo today**; HTML5 `<video>` for files only.
