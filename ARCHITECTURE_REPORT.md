# FRONTEND TEMPLATE ARCHITECTURE REPORT

**Project:** Homely / Your House Albania (Real Estate Template)  
**Date:** March 2025  
**Scope:** Full technical audit for evaluation before multilingual and CMS integration

---

## 1. Core Technologies

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 15.2.2 (React 19) |
| **Routing** | App Router |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 + tailwindcss-animate |
| **State Management** | React useState/useContext (AuthDialogContext, donationContext) |
| **Data Fetching** | Static imports from `src/app/api/*` (mock data), file system (markdown) |
| **Image Handling** | next/image with `unoptimized={true}` on most images |
| **Build System** | Next.js (SWC minify, Turbopack for dev) |
| **UI Libraries** | Radix UI (Accordion, Slot), shadcn/ui (button, accordion, carousel) |
| **Icons** | @iconify/react, lucide-react |
| **Animation** | Embla Carousel, tailwindcss-animate, custom CSS keyframes |
| **SEO** | Static Metadata in layout and pages, generateMetadata in blog slug |
| **i18n (declared but unused)** | next-i18next, react-i18next, i18next in package.json; next.config i18n |
| **Other** | next-themes (dark mode), nextjs-toploader, next-auth (installed, minimal use), react-hot-toast, gray-matter, remark, date-fns |

**Critical:** The project uses `next-i18next` and `i18n` in `next.config.ts`, but **App Router does not support the built-in next.config i18n**. The i18n packages are **never imported or used** in any component.

---

## 2. Project Structure

```
your-house-albania/
├── markdown/blogs/          # MDX blog posts (blog_1.mdx … blog_9.mdx)
├── public/
│   ├── images/             # Static assets (hero, properties, categories, etc.)
│   └── locales/            # en, ru, al, uk common.json — NOT consumed by app
├── src/
│   ├── app/
│   │   ├── api/            # Mock data exports (navlink, propertyhomes, footerlinks, etc.)
│   │   ├── context/        # AuthDialogContext, donationContext
│   │   ├── [locale]/       # Dynamic locale segment — all non-home pages
│   │   │   ├── properties/[slug]/
│   │   │   ├── blogs/[slug]/
│   │   │   ├── contactus/
│   │   │   ├── documentation/
│   │   │   ├── luxury-villa/
│   │   │   ├── residential-homes/
│   │   │   ├── appartment/
│   │   │   └── office-spaces/
│   │   ├── layout.tsx      # Root layout
│   │   ├── page.tsx        # Homepage (NO locale prefix)
│   │   └── not-found.tsx
│   ├── components/
│   │   ├── Auth/           # SignIn, SignUp, SocialSignIn, SocialSignUp
│   │   ├── Blog/           # Blog list page component
│   │   ├── Documentation/  # Intro, Config, QuickStart, DocNavigation, etc.
│   │   ├── Home/           # Hero, Services, Properties, FeaturedProperty, Testimonial, FAQs, GetInTouch
│   │   ├── Layout/         # Header, Footer
│   │   ├   Properties/     # PropertyList, Residential, LuxuryVilla, Appartment, OfficeSpaces
│   │   ├── shared/         # HeroSub, Blog (BlogSmall), blogCard
│   │   └── ui/             # button, accordion, carousel (shadcn)
│   ├── lib/
│   │   └── utils.ts        # cn() for Tailwind merge
│   ├── types/              # navlink, properyHomes, blog, footerlinks, testimonial, etc.
│   └── components/utils/   # markdown, markdownToHtml, validateEmail
├── next.config.ts
├── next-i18next.config.js
├── postcss.config.mjs
├── components.json         # shadcn config
└── eslint.config.mjs
```

**Folder responsibilities:**
- **app/api/** — Static data exports (no HTTP API). Used as a data source.
- **app/[locale]/** — All secondary pages. Uses dynamic `[locale]` but no middleware or layout.
- **app/context/** — Global context providers.
- **components/Home/** — Homepage sections.
- **components/Properties/** — Listing and category page content.
- **components/shared/** — Shared UI (HeroSub, Blog, BlogCard).
- **components/ui/** — Low-level UI primitives.

**Structure assessment:** Mixed. Clear separation between Home, Properties, Layout, shared, but navigation and routing assumptions cause 404s (see Section 3).

---

## 3. Routing Architecture

### Homepage
- **Path:** `/`
- **File:** `src/app/page.tsx`
- **Type:** Static Server Component

### Property Routes
| Route | File | Type |
|-------|------|------|
| Property list | `/[locale]/properties` | Static |
| Property detail | `/[locale]/properties/[slug]` | Dynamic (slug) |

### Category Pages (filtered property lists)
| Route | File | Component |
|-------|------|-----------|
| Residential Homes | `/[locale]/residential-homes` | ResidentialList |
| Luxury Villa | `/[locale]/luxury-villa` | LuxuryVillaList |
| Apartments | `/[locale]/appartment` | AppartmentList |
| Office Spaces | `/[locale]/office-spaces` | OfficeSpacesList |

### Blog Routes
| Route | File | Type |
|-------|------|------|
| Blog list | `/[locale]/blogs` | Static (reads markdown) |
| Blog post | `/[locale]/blogs/[slug]` | Dynamic (slug) |

### Other Routes
- `/[locale]/contactus` — Contact page
- `/[locale]/documentation` — Docs page
- `/not-found` — Custom 404

### City/District Pages
- **None.** Only category-based property lists; no city or district filtering.

### Critical Routing Problem

All internal links use paths **without locale prefix:**
- Nav: `/`, `/properties`, `/blogs`, `/contactus`, `/documentation`
- Footer: `/luxury-villa`, `/residential-homes`, `/appartment`, `/contactus`, `/blogs`
- Hero, Services, FeaturedProperty: `/contactus`, `/properties`, `/residential-homes`, etc.

Actual routes live under `app/[locale]/`:
- Real URLs: `/en/properties`, `/ru/blogs`, etc.
- There is no `app/properties/page.tsx` or `app/contactus/page.tsx`.

Result: `/properties`, `/blogs`, `/contactus` return **404**, because they do not match any route. Only `/` and `/{locale}/...` work.

Additional issues:
- No `app/[locale]/layout.tsx` — locale is not used for layout or i18n.
- No middleware for locale detection or redirects.
- No `app/[locale]/page.tsx` — `/en`, `/ru`, etc. return 404.
- `/signin` is linked in the header but no route exists.

### Data Fetching per Route
- **Homepage:** RSC, no async.
- **Properties:** Client and server components import static arrays from `app/api/propertyhomes.tsx`.
- **Blog:** Server components call `getAllPosts()`, `getPostBySlug()` (file system).
- **Property detail:** Client component, `useParams()` + `find()` in imported array.

---

## 4. Component Architecture

### Layout Components
- **Root layout:** `app/layout.tsx` — ThemeProvider, NextTopLoader, Header, Footer, children.
- **Header:** Fixed, sticky, dark mode toggle, nav, mobile sidebar.
- **Footer:** Newsletter, CTA, footer links.

### Page Components
- `app/page.tsx` — Composes Hero, Services, Properties, FeaturedProperty, Testimonial, BlogSmall, GetInTouch, FAQ.
- Category pages — HeroSub + listing component.
- Property detail — Inline layout in page.

### Feature Components
- **Hero, Services, Properties, FeaturedProperty, Testimonial, FAQs, GetInTouch** — Homepage blocks.
- **PropertyCard, BlogCard** — Cards with links.
- **HeroSub** — Reusable sub-page hero (badge, title, description).

### UI Components
- `Button`, `Accordion`, `Carousel` (shadcn + Radix).

### Domain Components
- PropertyCard, PropertiesListing, ResidentialList, etc. — Domain-specific but mostly presentation.

### Architecture Notes
- Components are reasonably modular and reusable.
- Some duplication (e.g., ResidentialList vs PropertyList differ mainly by data slice).
- Property detail page is large (~215 lines) with inline JSX and hardcoded text.
- Client vs server split is reasonable; interactive parts use `"use client"`.
- `NavLink` compares `item.href` to `pathname` — works only if links match actual routes (currently they do not).

---

## 5. Real Estate Domain Implementation

### Properties
- **Data:** `propertyHomes` in `app/api/propertyhomes.tsx` (9 properties).
- **Shape:** name, slug, location, rate, beds, baths, area, images[].
- **Cards:** PropertyCard with image, title, location, price, beds/baths/area.
- **Detail page:** Full layout: hero, images, amenities, map iframe, CTA, testimonials.

### Property Cards
- Shared between homepage, properties list, and category pages.
- Links: `/properties/${slug}` (without locale).

### Filters
- **None.** No search, price range, or category filters.

### Galleries
- Property detail: 4 images in a grid.
- FeaturedProperty, Testimonial: Embla Carousel.

### Maps
- Single hardcoded Google Maps embed in property detail page.

### Agents
- **None.** No agent model or UI.

### Blog
- MDX in `markdown/blogs/` (9 posts).
- gray-matter + remark for parsing and HTML.
- BlogCard links to `/blogs/${slug}` (no locale).
- Blog post page: title, author, date, tag, cover image, HTML content.

---

## 6. Data Layer

### Source Types
- **Static JSON:** Exports from `src/app/api/*.tsx` (navlink, propertyhomes, footerlinks, featuredproperty, testimonial).
- **File system:** `markdown/blogs/*.mdx` via `getAllPosts()`, `getPostBySlug()`.

### No External APIs
- No REST or GraphQL calls.
- No environment-based API URLs.

### Data Locations
| Data | File | Format |
|------|------|--------|
| Nav links | `app/api/navlink.tsx` | TypeScript export |
| Properties | `app/api/propertyhomes.tsx` | TypeScript export |
| Footer links | `app/api/footerlinks.tsx` | TypeScript export |
| Featured images | `app/api/featuredproperty.tsx` | TypeScript export |
| Testimonials | `app/api/testimonial.tsx` | TypeScript export |
| Blog posts | `markdown/blogs/*.mdx` | MDX + gray-matter |
| Locale strings | `public/locales/{en,ru,al,uk}/common.json` | JSON (unused) |

### Types
- `properyHomes.ts`, `navlink.ts`, `footerlinks.ts`, `featuredProperty.ts`, `testimonial.ts`, `blog.ts`, `breadcrumb.ts` — Typed, with one typo in filename (`properyHomes`).

---

## 7. SEO Architecture

### Implementation
- **Root layout:** Static `metadata` (title, description).
- **Pages:** Page-specific `metadata` or `generateMetadata` (e.g. blog post).
- **Blog post metadata:** title, author, robots, googleBot.
- **No OpenGraph/Twitter meta tags** in inspected code.
- **No canonical links.**
- **No sitemap or robots.txt** in src.

### Assessment
- **Basic:** Titles and descriptions present.
- **Incomplete:** No OGP, no canonical, no sitemap/robots.
- **Risk:** Default description "Generated by create next app" remains in root layout.

---

## 8. Multilingual Readiness

### Current State
- **i18n packages:** next-i18next, react-i18next, i18next installed but **unused**.
- **Config:** `next.config.ts` uses `i18n` from `next-i18next.config.js` (locales: en, uk, ru, al). **App Router ignores this config.**
- **Translation files:** `public/locales/{en,ru,al,uk}/common.json` exist but are not loaded.
- **Routing:** `[locale]` segment present, but no middleware, no layout usage, no link helpers.

### Text Handling
- **Almost all text is hardcoded** in components (Hero, Services, Properties, FAQs, Header, Footer, property detail, etc.).
- No `useTranslation` or similar; no translation keys.

### Required Changes for i18n
1. Add middleware for locale detection and redirects.
2. Fix routing: either move all pages under `[locale]` (including homepage) or remove `[locale]`.
3. Introduce a translation library compatible with App Router (e.g. next-intl).
4. Replace hardcoded strings with translation keys across components.
5. Add locale to all internal links (e.g. `/[locale]/properties`).
6. Add `app/[locale]/layout.tsx` and wire locale context.

### Difficulty
- **High:** Many components, heavy hardcoding, routing mismatch, and unused i18n setup.

---

## 9. CMS Integration Readiness

### Target Sanity Entities (per spec)
- city, district, property, propertyType, amenity, locationTag, agent, blogPost, blogCategory, homePage, siteSettings

### Easy to Connect
- **Property cards and lists** — Already consume array data; can be switched to Sanity queries.
- **HeroSub** — Title/description from props; can come from CMS.
- **Footer/nav links** — Already driven by data; can be replaced by Sanity.
- **Homepage sections** — Structure exists; content can be moved to Sanity.

### Needs Refactoring
- **Property detail page** — Long hardcoded copy; should use property data from CMS.
- **Blog** — Currently file-based; needs migration to Sanity blogPost schema.
- **Featured property, testimonials** — Replace static arrays with Sanity queries.
- **Categories** — Residential, Luxury, Apartment, Office — should map to propertyType or similar.
- **Filters** — Must be added for city, district, propertyType, amenities.

### Structural Gaps
- No city/district entities or pages.
- No agent pages or components.
- Property schema is minimal (no type, amenities, tags).
- No structured content for homePage/hero/features.

---

## 10. Code Quality Evaluation

### Strengths
- TypeScript used; types for data models.
- Consistent Tailwind usage.
- shadcn/Radix for accessible UI.
- Clear folder structure (Home, Properties, Layout, shared).
- `cn()` utility for class merging.

### Weaknesses
- Typo: `properyHomes` in type and file names; `featuredProprty` in export.
- `noImplicitAny: false` in tsconfig.
- `any` in params/metadata (blog post page).
- Duplication: ResidentialList, LuxuryVillaList, etc. only differ by data slice.
- Property detail: large component, hardcoded text.
- Header: complex conditional classes, hard to follow.
- `unoptimized={true}` on many images — performance risk.

### Technical Debt
- Unused i18n packages and config.
- Unused `public/locales` JSON files.
- next-auth installed with no visible auth flow.
- Links to non-existent routes (`/signin`, `/properties`, etc.).

---

## 11. Performance Observations

- **Images:** `unoptimized={true}` used widely — bypasses Next.js optimization.
- **Client components:** Carousel, Testimonial, FeaturedProperty, Header — reasonable use of `"use client"`.
- **No obvious lazy loading** for below-fold sections.
- **No memoization** in list rendering (e.g. PropertyCard, BlogCard).
- **Blog:** Server-side; markdown read at request time; no caching layer described.
- **Bundles:** No code-splitting analysis; Radix/shadcn and iconify add to bundle size.

---

## 12. Design System Analysis

### Approach
- Tailwind 4 with custom theme in `globals.css` (`@theme`): primary, skyblue, shadows, spacing, breakpoints.
- Custom utilities: `no-scrollbar`, `blog-details` (typography).
- Dark mode via `next-themes` and `dark:` variants.
- shadcn/ui with CVA for buttons; Radix for accordion and carousel.

### Responsiveness
- Breakpoints: `xs`, `mobile`, `md`, `lg`, `xl`, `2xl` (Tailwind + custom).
- Layout: `grid`, `flex`, responsive columns (e.g. `md:grid-cols-2`).
- Mobile: Header hamburger, collapsible nav.

### Consistency
- Shared colors and spacing.
- Repeated patterns (e.g. icon + label blocks) without a single abstraction.
- Some inconsistency in padding/margins across sections.

---

## 13. Architectural Risks

1. **Broken routing:** Nav and footer links lead to 404s.
2. **i18n mismatch:** App Router + next.config i18n + unused packages create confusion.
3. **Hardcoded content:** Makes i18n and CMS migration labor-intensive.
4. **No city/district model:** Limits scalability for multi-location sites.
5. **Property detail fragility:** Large block of hardcoded copy; CMS migration will require careful refactor.
6. **Image optimization disabled:** May harm performance and Core Web Vitals.
7. **Type safety:** `noImplicitAny: false` and `any` weaken type guarantees.

---

## 14. Recommended Improvements BEFORE Adding Multilingual Support

1. **Fix routing**
   - Add middleware: detect locale and redirect `/` → `/[locale]`, `/properties` → `/[locale]/properties`, etc.
   - Or restructure: move `app/page.tsx` to `app/[locale]/page.tsx` and make `[locale]` the single entry point.
   - Add `app/[locale]/layout.tsx` if using locale-scoped layout.
   - Update all internal links to include locale (via helper/hook).

2. **Align links with routes**
   - Either create `/signin` route or remove the link.
   - Ensure nav, footer, and CTA links point to existing routes.

3. **Clean i18n setup**
   - Remove or replace next-i18next (not App Router compatible).
   - Choose an App Router–compatible solution (e.g. next-intl) and configure it from scratch.
   - Remove unused `public/locales` or integrate them with the new setup.

4. **Prepare for translations**
   - Centralize all user-facing strings.
   - Introduce translation keys and a minimal i18n layer before full migration.

5. **Fix small issues**
   - Rename `properyHomes` → `propertyHomes`, `featuredProprty` → `featuredProperty`.
   - Enable `noImplicitAny` and fix `any` usage.
   - Re-enable Next.js image optimization where possible.

6. **Document routing**
   - Describe intended URL structure (with or without locale prefix) and how middleware/layout support it.

---

*Report generated for AI-assisted evaluation. No code was modified.*
