# Blog Implementation Clarifications

Answers derived from the codebase to unblock an implementation-ready plan.

---

## 1. Which exact repo is being changed first?

**Current state (from this workspace):**

| Repo | What exists |
|------|-------------|
| **Frontend (this repo)** | All GROQ queries live in `src/lib/sanity/client.ts`. No Sanity Studio. Connects to Sanity via `@sanity/client` + env vars (`NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`). |
| **Sanity** | Not in this workspace. No `sanity.config.*`, no `sanity.cli.*`, no Studio. Schema/Studio assumed to live in a separate repo or deployment. |

**Source of truth for queries:** The frontend repo (`src/lib/sanity/client.ts`) is the only place with live GROQ. The blog queries in `docs/blog-schema-contract.md` are a spec for future implementation; they are not yet in `client.ts` (blog is still MDX).

**Recommendation:**  
- If Sanity schema/Studio is in another repo: change that repo first (add `blogPost`, `blogCategory`, `blogAuthor`, etc.), then add blog fetch functions to the frontend `client.ts`.  
- If schema is shared or embedded: clarify where the Studio lives before planning.

---

## 2. Intended publish rule

**Current behavior:**  
- `docs/blog-schema-contract.md` GROQ does not filter by publish date. Example: `*[_type == "blogPost"] | order(publishedAt desc)` — no `publishedAt <= now()` condition.  
- MDX blog has no publish logic; all files are listed.

**Options:**

| Rule | GROQ filter | Meaning |
|------|------------|---------|
| **A. Strict schedule** | `publishedAt <= now()` | Only show posts whose `publishedAt` is in the past. |
| **B. Presence only** | `defined(publishedAt)` | Any post with `publishedAt` set is visible (including future). |
| **C. No filter** | (none) | All `blogPost` documents are visible. |

**Recommendation:** Use **A** (`publishedAt <= now()`) for listing and single-post fetches so scheduled posts stay hidden until their date.

---

## 3. Legacy author fields

**From `docs/blog-schema-contract.md`:**

> Legacy author fallbacks: `authorName`, `authorRole`, `authorImage` remain present for older documents; when `author` exists in a document, Studio hides these legacy fields.

**Current frontend:**  
- `src/types/domain/blogPost.ts` uses `author?: string` and `authorImage?: string` (flat strings).  
- MDX frontmatter has `author`, `authorImage` as strings.

**Options:**

| Approach | Effect |
|---------|--------|
| **Keep in query** | Include `authorName`, `authorRole`, `authorImage` in GROQ. Frontend adapter prefers `author->` when present, falls back to legacy. |
| **Drop immediately** | Omit from GROQ. Old posts without `author` reference would show no author. |

**Recommendation:** Keep legacy fields in the query for backward compatibility until content is migrated. The adapter can use `author ?? authorName` and `author.photo ?? authorImage`.

---

## 4. Slug shape for categories

**From `docs/blog-schema-contract.md` GROQ:**

```groq
"categories": categories[]->{
  _id,
  slug: slug.current,
  title
}
```

**Frontend expectation:** Flattened string. The query uses `slug: slug.current`, so the response has `slug` as a string, not `slug: { current: "..." }`.

**Answer:** The frontend expects `slug` as a flattened string (i.e. `slug.current` projected as `slug`). No nested `slug.current` in the response.

---

## 5. Minimum property card fields for embedded real estate cards

**From `src/types/properyHomes.ts` (PropertyHomes):**

| Field | Required | Used by PropertyCard |
|-------|----------|----------------------|
| `name` | ✓ | Title |
| `slug` | ✓ | Link `/${locale}/property/${slug}` |
| `location` | ✓ | Display location |
| `rate` | ✓ | Price string (fallback when no `price`) |
| `beds` | ✓ | Bedrooms |
| `baths` | ✓ | Bathrooms |
| `area` | ✓ | Area |
| `images` | ✓ | Array of `{ src: string }` |
| `price`, `currency`, `status`, `propertyType`, `city`, `district`, `teaser` | Optional | Richer display |

**From `blog-schema-contract.md` — `blogPropertyEmbedBlock`, `relatedProperties`:**

```jsonc
{
  _id,
  slug: slug.current,
  title,
  shortDescription,
  price,
  currency,
  gallery[] { alt, asset->{url} }
}
```

**`mapSanityPropertyToCard` in `propertyAdapter.ts`** expects:

- `title`, `slug`, `description` (or `shortDescription`)

- `price`, `currency`, `area`, `bedrooms`, `bathrooms`, `status`

- `city`, `district`, `type` (with `title`, `slug`)

- `mainImageUrl` or `mainImage.asset.url` or `gallery[0].asset.url`

**Minimum embed projection for PropertyCard:**

| Field | Required | Source |
|-------|----------|--------|
| `slug` | ✓ | `slug.current` |
| `title` | ✓ | → `name` |
| `gallery` | ✓ (≥1 image) | `gallery[0].asset->url` → `images` |
| `price` | Optional | For price display |
| `currency` | Optional | With price |
| `shortDescription` | Optional | → `teaser` |

**Fields that can be omitted for embed (adapter uses fallbacks):**

- `city`, `district`, `type` → `location` = `''`, `city`/`district` = undefined  
- `bedrooms`, `bathrooms`, `area` → `beds: 0`, `baths: 0`, `area: 0`  
- `status` → `rate` from price or `''`

**Recommended GROQ projection for embed:**

```groq
"properties": relatedProperties[]->{
  _id,
  "slug": slug.current,
  title,
  shortDescription,
  price,
  currency,
  "mainImageUrl": gallery[0].asset->url,
  "galleryUrls": gallery[].asset->url,
  "city": city->{ title, "slug": slug.current },
  "district": district->{ title, "slug": slug.current, "citySlug": city->slug.current },
  "type": type->{ title, "slug": slug.current },
  area,
  bedrooms,
  bathrooms,
  status
}
```

This matches the existing `CatalogProperty` shape used by `mapCatalogPropertyToCard` / `mapSanityPropertyToCard`. If you want a truly minimal embed (e.g. compact mode), you can reduce to `_id`, `slug`, `title`, `gallery[0]`, and optionally `price`/`currency`; the adapter can map that to PropertyHomes with zeros for missing fields.

---

## Summary

| Question | Answer |
|----------|--------|
| **Repo changed first** | Frontend holds all queries; Sanity schema/Studio is elsewhere. Change Sanity first if schema is new, then frontend. |
| **Publish rule** | Not defined in code. Recommended: `publishedAt <= now()`. |
| **Legacy author fields** | Keep in query for backward compatibility. |
| **Category slug shape** | Flattened string: `slug: slug.current` in GROQ. |
| **Min property embed fields** | At minimum: `slug`, `title`, `gallery[0].asset->url`. For full card compatibility, align with `CatalogProperty` / `mapSanityPropertyToCard`. |
