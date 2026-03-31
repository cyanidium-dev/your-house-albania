# Registration request — Sanity programmatic create contract

**Scope:** Payload shape for creating `registrationRequest` documents from the website (server-side or trusted Sanity client).  
**Repository:** domlivo-admin (Sanity Studio schema).  
**Source of truth:** `schemaTypes/documents/registrationRequest.ts`, `lib/languages.ts`

---

## Document type

| Sanity `_type` | Title in Studio |
|----------------|-----------------|
| `registrationRequest` | Registration Request |

---

## What the public form should send

Send **only** user-submitted fields. Use **server-side** or **token-scoped** Sanity client writes (never expose write tokens in the browser).

| Field | Required? | Type | Notes |
|-------|------------|------|--------|
| `_type` | **Yes** | literal | Must be `"registrationRequest"`. |
| `name` | **Yes** | string | Non-empty after trim. |
| `phone` | **Yes** | string | Non-empty after trim. |
| `language` | **Yes** | string | One of the locale ids below. |
| `email` | No | string | Omit if empty; if present, valid email format (trimmed). |
| `realtorOrAgency` | No | string | Omit if empty; if set, exactly `realtor` or `agency`. |

### Do **not** send from the public site

| Field | Reason |
|-------|--------|
| `status` | Omit so schema **`initialValue: 'unread'`** applies. Editors change status in Studio. |
| `internalComment` | Studio-only; staff notes. |

If you **must** send `status` explicitly (e.g. integration tests), use only: `unread` | `read` | `inWork` | `registered` | `declined`.

---

## Enums

### `language` (required)

Must match **`lib/languages.ts`** (single source of truth):

| Value | Meaning |
|-------|---------|
| `en` | English |
| `uk` | Ukrainian |
| `ru` | Russian |
| `sq` | Albanian |
| `it` | Italian |

### `realtorOrAgency` (optional)

| Value | Meaning |
|-------|---------|
| `realtor` | Submitter is a realtor |
| `agency` | Submitter is an agency |

Omit the field or send only when the user selected an option.

### `status` (omit from form; default for new docs)

| Value | Default for new |
|-------|-----------------|
| `unread` | **Yes** when `status` is omitted |

If `status` is omitted on create, Sanity applies the schema default **`unread`**.

---

## Empty strings vs omit

- **`email`:** Prefer **omitting** the field when there is no email. Empty string `""` is treated as “no email” by validation (passes).  
- **`realtorOrAgency`:** Prefer **omitting** when unset. `""` or whitespace-only is treated as unset.  
- **Never** send whitespace-only `name` or `phone` — validation requires non-empty after trim.

---

## Example JSON body (minimal)

```json
{
  "_type": "registrationRequest",
  "name": "Jane Doe",
  "phone": "+355 69 000 0000",
  "language": "en"
}
```

## Example with all optional submission fields

```json
{
  "_type": "registrationRequest",
  "name": "Jane Doe",
  "phone": "+355 69 000 0000",
  "email": "jane@example.com",
  "realtorOrAgency": "realtor",
  "language": "sq"
}
```

---

## Timestamps

- **`_createdAt`** / **`_updatedAt`** are set by Sanity. Do not set them from the form unless you have a deliberate reason (usually unnecessary).

---

## Studio vs API

- **Studio:** Editors can set `status` and `internalComment` on any document.  
- **Website API:** Should only create documents with the submission fields above and rely on default **`unread`** for `status`.
