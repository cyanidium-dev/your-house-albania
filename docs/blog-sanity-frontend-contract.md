# Blog Sanity-to-Frontend Contract

**Version:** Current (post latest blog fixes)  
**Scope:** Sanity → Frontend data contract for the Domlivo blog  
**Repository:** Sanity Studio (domlivo-admin)

This document describes the current Sanity schema and editorial contract for blog content. Frontend developers should use it as the source-of-truth reference when consuming blog data from Sanity.

---

## 1. Scope / Purpose

This contract defines:

- What blog content structures Sanity produces
- Which inline blocks are allowed in the article body
- Which blocks are **not** part of the editorial contract (removed from authoring)
- How CTA data is structured and validated
- Where related content comes from (dedicated fields vs inline blocks)
- Localization expectations

It does **not** define frontend rendering behavior, routing implementation, or API details beyond what the schema implies.

---

## 2. Routing / Localization Assumptions

- Frontend uses locale-prefixed routes (e.g. `/[locale]/blogs`, `/[locale]/blogs/[slug]`).
- Sanity stores localized content in field-level i18n objects with keys: `en`, `uk`, `ru`, `sq`, `it` (see `lib/languages.ts`).
- Frontend must resolve the correct locale value from these objects (e.g. `title[locale]` with fallback).
- Slug is single per post (`slug.current`); URL localization is a frontend concern.

---

## 3. Blog Post Content Expectations

### High-level fields consumed by frontend

| Field | Type | Notes |
|-------|------|-------|
| `slug` | slug | `slug.current` — single slug per post |
| `publishedAt` | datetime | Required |
| `title` | localizedString | Required; English required for schema |
| `subtitle` | localizedString | Optional |
| `excerpt` | localizedText | Optional |
| `content` | localizedBlockContent | Article body; per-locale block arrays |
| `coverImage` | image | `alt`, `caption` required when image present |
| `categories` | array of ref | 1–3 references to blogCategory |
| `author` | reference | Required; reference to blogAuthor |
| `featured` | boolean | Default false |
| `relatedPosts` | array of ref | Max 6; references to blogPost |
| `relatedProperties` | array of ref | Max 3; references to property; filter `isPublished == true` |
| `seo` | localizedSeo | Meta title, description, OG per locale |

### Article body

- `blogPost.content` is `localizedBlockContent`: an object with per-locale arrays `en`, `uk`, `ru`, `sq`, `it`.
- Each array contains Portable Text blocks and custom blocks.
- English content is required (at least one block in `content.en`).

---

## 4. Main Article Body Contract

### Allowed inline body block types

| Block type | Schema name | Description |
|------------|-------------|-------------|
| Portable text | `block` | Paragraphs, headings (h2, h3, h4), quote, lists, links |
| Image | `image` | With `alt`, `caption` |
| Table | `blogTable` | `title`, `rows` (array of `cells`), `caption` |
| FAQ | `blogFaqBlock` | `title`, `items` (localizedFaqItem) |
| Callout | `blogCallout` | `variant` (info, tip, important, warning, summary), `title`, `content` |
| CTA | `blogCtaBlock` | See CTA contract below |

### Blocks NOT part of the editorial contract

- **`blogRelatedPostsBlock`** — Not allowed in the main article body. Editors cannot insert it. Related posts are managed via the dedicated `relatedPosts` field on the blog post document.
- **`blogPropertyEmbedBlock`** — Not allowed in the main article body. Editors cannot insert it. Related properties are managed via the dedicated `relatedProperties` field on the blog post document.

**Note:** If historical documents contain these blocks (from before the schema change), they may still exist in stored content. Frontend may render them if desired, but new content will not include them. The Sanity editorial contract is: do not expect these blocks in new content.

---

## 5. Related Content Contract

| Content | Source | Not from |
|---------|--------|----------|
| Related posts | `blogPost.relatedPosts` (array of refs, max 6) | Inline `blogRelatedPostsBlock` in body |
| Related properties | `blogPost.relatedProperties` (array of refs, max 3) | Inline `blogPropertyEmbedBlock` in body |

Frontend should consume `relatedPosts` and `relatedProperties` from the document fields, not from inline body blocks.

---

## 6. CTA Contract

### Schema structure

**Blog CTA block** (`blogCtaBlock`):

- `variant`: `"primary"` | `"secondary"` | `"link"` — button style
- `cta`: `localizedCtaLink` — required

**Localized CTA link** (`localizedCtaLink`):

- `href`: string — required; link destination
- `label`: localizedString — required; button text per locale

### Valid href formats (Sanity validation)

Sanity enforces that `href` must start with one of:

- `/` — relative path (e.g. `/properties`, `/blog`)
- `http://` — full URL
- `https://` — full URL
- `mailto:` — email link
- `tel:` — phone link

Invalid hrefs (e.g. bare `example.com` without protocol) are rejected by Studio validation.

### Label / localization requirement

- `label` is required.
- English (`label.en`) is required by schema validation.
- Other locales (`uk`, `ru`, `sq`, `it`) are optional.

### Sanity vs frontend responsibility

- **Sanity:** Ensures `href` format and `label.en` presence.
- **Frontend:** Resolves `label` for locale, resolves internal vs external links, applies routing for `href` starting with `/`, etc.

---

## 7. Localization Contract

### Locale keys

All localized fields use: `en`, `uk`, `ru`, `sq`, `it` (from `lib/languages.ts`).

### Localized types relevant to blog

| Type | Shape | Notes |
|------|-------|-------|
| localizedString | `{ en?, uk?, ru?, sq?, it? }` | Strings per locale |
| localizedText | `{ en?, uk?, ru?, sq?, it? }` | Text per locale |
| localizedBlockContent | `{ en?, uk?, ru?, sq?, it? }` | Block array per locale |
| localizedSeo | Meta fields per locale | metaTitle, metaDescription, ogTitle, ogDescription, etc. |
| localizedCtaLink | `href` (string) + `label` (localizedString) | Single href; label per locale |

### Fallback expectations

- English is required for: `title`, `content` (at least one block), `label` in CTA, SEO meta before publish.
- Frontend should handle missing locales with fallback (e.g. `en` → `uk` → …).

---

## 8. Non-goals / Exclusions

This contract does **not** define:

- Frontend routing implementation
- Reading time calculation (frontend responsibility)
- Date formatting (frontend responsibility)
- Image CDN URLs or asset handling
- GROQ query structure (see `lib/sanity/queries.ts` for query contract)
- Blog listing pagination behavior
- Category filtering behavior

---

## 9. Practical Checklist

- [ ] Related posts come from `relatedPosts`; do not expect inline `blogRelatedPostsBlock` in new content.
- [ ] Related properties come from `relatedProperties`; do not expect inline `blogPropertyEmbedBlock` in new content.
- [ ] CTA `href` is always one of: `/...`, `http://...`, `https://...`, `mailto:...`, `tel:...`.
- [ ] CTA `label.en` is always present when CTA exists.
- [ ] Resolve localized fields with `[locale]` and fallback chain.
- [ ] Handle `blogSettings` query returning `null` when document not created.
- [ ] Reading time is computed on frontend from content; no Sanity field.
