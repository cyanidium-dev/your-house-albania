# Registration request — public form contract & delivery

**Scope:** Payload and behavior for **`POST /api/registration-request`** (public `/[locale]/register` form).  
**Sanity schema reference:** domlivo-admin — `schemaTypes/documents/registrationRequest.ts`, `lib/languages.ts`

---

## Current production behavior (temporary — Telegram-first)

As implemented in this repo:

1. The browser sends JSON to **`POST /api/registration-request`** (same shape as below).
2. The server validates input and the **honeypot** (`companyWebsite` must be empty).
3. **Active delivery:** a plain-text message is sent to **Telegram** via Bot API `sendMessage` (see **Environment**). Success of this send **determines** HTTP success (`{ ok: true }`) and the client redirect to **`/[locale]/register/thank-you`**.
4. **Sanity persistence:** the **`createRegistrationRequest`** helper in **`src/lib/sanity/writeClient.ts`** remains in the codebase, but the **live route does not call it** while this phase is in effect — **no** `registrationRequest` documents are created from the website during this phase (no CMS pollution). The route contains a **commented** block showing exactly how to re-enable the create.

When re-enabling Sanity writes, restore the commented `createRegistrationRequest(...)` call in **`src/app/api/registration-request/route.ts`** (and decide ordering vs Telegram — product/ops).

**Failure policy:** If Telegram is misconfigured or `sendMessage` fails, the API returns **500** with a generic error (`Submission failed`); the client **does not** redirect to thank-you.

---

## Document type (Sanity — when persistence is re-enabled)

| Sanity `_type` | Title in Studio |
|----------------|-----------------|
| `registrationRequest` | Registration Request |

---

## What the public form sends (JSON body)

Unchanged from the website’s perspective:

| Field | Required? | Type | Notes |
|-------|------------|------|-------|
| `name` | **Yes** | string | Non-empty after trim. |
| `phone` | **Yes** | string | Non-empty after trim. |
| `language` | **Yes** | string | One of the locale ids below. |
| `email` | No | string | Omit if empty; if present, valid email format (trimmed). |
| `realtorOrAgency` | No | string | Omit if empty; if set, exactly `realtor` or `agency`. |
| `companyWebsite` | Honeypot | string | Must be empty for real users. |

### Do **not** send from the public site (Sanity-specific, when using CMS)

| Field | Reason |
|-------|--------|
| `_type` | Set server-side in `createRegistrationRequest`. |
| `status` | Set server-side (`unread`) when using the helper. |
| `internalComment` | Studio-only; staff notes. |

---

## Enums

### `language` (required)

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

---

## Telegram (active path)

- **Formatter:** `src/lib/notifications/registrationRequest/formatTelegramRegistrationRequest.ts`
- **Sender:** reuses `sendTelegramTextMessage` from contact notifications (`telegramBotSend.ts`).
- **Chat ID:** **`TELEGRAM_GENERAL_CHAT_ID` only** — same destination as general Contacts (`resolveAgentContactTelegramRouting().generalChatId`). There is **no** separate register chat env in the current implementation.

---

## Environment variables

| Variable | Role |
|----------|------|
| `TELEGRAM_BOT_TOKEN` | Required for Telegram delivery. |
| `TELEGRAM_GENERAL_CHAT_ID` | Inbox for both general Contacts and register submissions (this phase). |
| `TELEGRAM_API_BASE_URL` | Optional (default `https://api.telegram.org`). |

Sanity write tokens are **not** required for the public register path **while** Sanity create is disabled in the route; they remain needed for other features (e.g. cron) and for future re-enablement.

---

## Example JSON body (minimal)

```json
{
  "name": "Jane Doe",
  "phone": "+355 69 000 0000",
  "language": "en"
}
```

## Example with all optional submission fields

```json
{
  "name": "Jane Doe",
  "phone": "+355 69 000 0000",
  "email": "jane@example.com",
  "realtorOrAgency": "realtor",
  "language": "sq"
}
```

---

## Re-enabling Sanity programmatic create

1. Uncomment / restore **`import { createRegistrationRequest } from '@/lib/sanity/writeClient'`** in **`src/app/api/registration-request/route.ts`**.
2. Uncomment the **`createRegistrationRequest({ ... })`** block in that file (and align error handling with product: fail request if Sanity fails, or log-only, etc.).
3. Ensure **`SANITY_*`** write credentials are set in the deployment environment.

Example document fields for **`createRegistrationRequest`** (unchanged helper contract):

```json
{
  "_type": "registrationRequest",
  "name": "Jane Doe",
  "phone": "+355 69 000 0000",
  "language": "en"
}
```

---

## Timestamps (Sanity)

When using Sanity creates, **`_createdAt`** / **`_updatedAt`** are set by Sanity.

---

## Studio vs API

- **Studio:** Editors can set `status` and `internalComment` on documents.
- **Website (when Sanity create is re-enabled):** should only pass submission fields through **`createRegistrationRequest`**; status is set server-side.
