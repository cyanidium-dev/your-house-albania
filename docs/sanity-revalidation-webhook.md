# Sanity Revalidation Webhook

**Scope:** On-demand cache invalidation of Next.js data caches when content is published in Sanity.
**Endpoint:** `POST /api/revalidate/sanity`

This complements — and does **not** replace — the path-based `revalidatePath` invalidation that the landing editor save route (`/api/editor/landing/save`) performs. The two run independently.

---

## 1. How it works

Every cached Sanity fetcher in `src/lib/sanity/queries/*` is wrapped with `sanityCache(...)`, which attaches cache **tags** (see `SANITY_TAGS` in `src/lib/sanity/queries/_core.ts`). Each fetcher declares every tag it depends on.

When a document is published/changed in Sanity, the webhook posts the mutated document's `_type` (and `_id`) to this route. The route maps the `_type` to its tag and calls `revalidateTag(...)`, which purges **every** cached fetcher that lists that tag.

Example: editing a `city` document calls `revalidateTag('sanity:city')`, which busts the catalog filter-options, footer-cities, home, and catalog property-list caches — all of which carry the `city` tag.

### Type → tag mapping

| Sanity `_type`   | Revalidated tag        |
| ---------------- | ---------------------- |
| `property`       | `sanity:property`      |
| `propertyType`   | `sanity:propertyType`  |
| `homePage`       | `sanity:homePage`      |
| `landingPage`    | `sanity:landingPage`   |
| `blogPost`       | `sanity:blogPost`      |
| `blogCategory`   | `sanity:blogCategory`  |
| `blog-settings`  | `sanity:blog-settings` |
| `city`           | `sanity:city`          |
| `district`       | `sanity:district`      |
| `amenity`        | `sanity:amenity`       |
| `country`        | `sanity:country`       |
| `catalogSeoPage` | `sanity:catalogSeoPage`|
| `siteSettings`   | `sanity:siteSettings`  |

An unrecognized `_type` is acknowledged with HTTP 200 and `revalidated: []` (no retry storm), but nothing is purged.

---

## 2. Configuration

### Environment

Set a shared secret (any long random string):

```
SANITY_REVALIDATE_SECRET=<random-string>
```

The route returns **401** if this is unset, so the webhook is disabled by default.

### Sanity Studio (Manage)

1. Go to **sanity.io/manage → your project → API → Webhooks → Create webhook**.
2. **Name:** `Next.js revalidate`
3. **URL:** `https://<your-domain>/api/revalidate/sanity`
4. **Dataset:** `production`
5. **Trigger on:** Create, Update, Delete
6. **Filter (optional):** restrict to the document types above, e.g.
   ```
   _type in [
     "property","propertyType","homePage","landingPage","blogPost",
     "blogCategory","blog-settings","city","district","amenity",
     "country","catalogSeoPage","siteSettings"
   ]
   ```
7. **Projection:** expose the type and id the route reads:
   ```
   { "_type": _type, "_id": _id }
   ```
8. **HTTP method:** `POST`
9. **HTTP Headers:** add
   ```
   Authorization: Bearer <SANITY_REVALIDATE_SECRET>
   ```

---

## 3. Manual testing

```bash
# Authorized (replace SECRET / domain)
curl -X POST "https://<your-domain>/api/revalidate/sanity" \
  -H "Authorization: Bearer <SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"_type":"property","_id":"abc123"}'
# → { "ok": true, "revalidated": ["sanity:property"], "type": "property", "id": "abc123" }

# The secret may also be passed as a query param for local calls:
#   POST /api/revalidate/sanity?secret=<SECRET>
```

Responses:

| Condition                     | Status | Body                                                        |
| ----------------------------- | ------ | ----------------------------------------------------------- |
| Missing/invalid secret        | 401    | `{ ok: false, reason: "Unauthorized" }`                     |
| Body not JSON                 | 400    | `{ ok: false, reason: "Invalid JSON" }`                     |
| Missing `_type`               | 400    | `{ ok: false, reason: "Missing _type in payload" }`         |
| Unhandled `_type`             | 200    | `{ ok: true, revalidated: [], type, id, note: "Unhandled _type" }` |
| Success                       | 200    | `{ ok: true, revalidated: [<tags>], type, id }`             |
