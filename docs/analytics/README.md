# Lead analytics

Every lead and every lead-intent click is measurable in GA4 and Clarity, saved
as a `lead` document in Sanity, and posted to Telegram with where the visitor
came from and what they did on the site.

```
browser                                   server                         out
───────                                   ──────                         ───
LeadTracker (layout)                      /api/contact-agent  ─┐
 ├ records pages → attribution.ts          /api/registration-   ├─ createLead() → Sanity `lead`
 └ contact-link clicks ─ sendBeacon ─────▶ /api/leads/click   ─┘  Telegram (general chat)
forms ─ body.context = getLeadContext() ─▶
track() ─ dataLayer (GTM → GA4) + window.clarity("event")
```

## Files

| Where | What |
| --- | --- |
| `src/lib/analytics/trafficSource.ts` | Pure source/medium/channel and device rules |
| `src/lib/analytics/attribution.ts` | First touch, session, journey in browser storage; `getLeadContext()` |
| `src/lib/analytics/track.ts` | Typed `track()` → dataLayer + Clarity; internal-traffic flag |
| `src/lib/analytics/leadEvents.ts` | `trackFormLead()`, `trackContactClick()` (event + beacon) |
| `src/lib/analytics/searchEvents.ts` | `search_submit`, `filter_apply` |
| `src/components/analytics/LeadTracker.tsx` | Mounted once in `src/app/[locale]/layout.tsx` |
| `src/lib/leads/*` | Context schema, lead types, Sanity document, click endpoint guards |
| `src/lib/notifications/leads/formatLeadTelegram.ts` | Telegram text (pure, tested) |
| `src/app/api/leads/click/route.ts` | Click leads |
| domlivo-admin `schemaTypes/documents/lead.ts` | Studio schema + "Leads" desk list |

## Events

All events go to `window.dataLayer` (GTM decides what reaches GA4, under
Consent Mode) and to Clarity as a custom event of the same name. Nothing is
pushed unless `NEXT_PUBLIC_ENABLE_ANALYTICS=true`.

| Event | When | Parameters |
| --- | --- | --- |
| `generate_lead` | A lead **form** was accepted by the server (any form; clicks excluded). The guide gate fires it with `lead_type: guide_download` and no form-specific event | `lead_type`, `placement`, listing params, attribution params |
| `contact_form_submit` | General contact form (`/contacts`) or a phone-only callback form (blog CTA, floating widget) was accepted | same |
| `property_inquiry_submit` | The contact form about a listing (property page, or a listing card) was accepted | same |
| `click_whatsapp` | Click on `wa.me` (number or `wa.me/message/<code>` business link), `api.whatsapp.com`, `web.whatsapp.com` or `whatsapp://` | `lead_type`, `placement`, `property_slug` (if any), attribution params |
| `click_telegram` | Click on `t.me/<name>`, `telegram.me/<name>` or `tg:` | same |
| `click_phone` | Click on `tel:` | same |
| `click_email` | Click on `mailto:` | same |
| `search_submit` | Hero search submitted | `placement: hero`, `city`, `property_type`, `deal` |
| `filter_apply` | Catalog filters applied (form submit or mobile deal tab); an identical repeat within 3 s is dropped | `placement` (`catalog` / `catalog-deal-tab`), `city`, `district`, `property_type`, `deal`, `beds`, `has_price`, `has_area`, `amenities_count` |
| `lead_submit` | Legacy, still fired with every successful form (`kind`: general / agent / quote / registration) | `kind`, `source` |
| `property_view`, `blog_view`, `ai_*` | Unchanged | Unchanged |

- **Listing params**: `property_slug`, `property_id`, `city`, `district`, `property_type`, `price_eur` (where the page knows them).
- **Attribution params**: `landing_page`, `source`, `medium`, `campaign`, `channel` — this session's, as below.
- **Placement** values: `header`, `footer`, `property`, `property-card`, `catalog` (the phone contact bar on city/district listing pages), `agent`, `quick-contact`, `contact-page`, `blog-cta`, `landing`, `register-page`, `guide` (the PDF guide card), `page` (fallback).
- **Never sent** to GA4 or Clarity: names, phones, emails, messages, the page journey, referrer URLs.
- Lead events reset the listing/attribution keys they do not set, so a `property_slug` from one lead cannot ride along on the next (GTM keeps every pushed key in its data model).
- Clarity also gets tags (`clarity("set", …)`) for `lead_type`, `placement`, `channel`, `source`, and `internal`.

### Contact clicks: how placement is resolved

One capture-phase `click` (+ middle-click `auxclick`) listener on `document`
sees every link click before the browser leaves for the app. For a contact link
it reads, from the link or its nearest ancestor:

- `data-lead-placement="footer"` — set on the footer, the contacts page section, landing CTA sections, the floating QuickContact widget;
- `data-property-slug="…"` — optional; on a `/{locale}/property/{slug}` URL the slug comes from the path.

No placement attribute → `property` on a property page, else `page`. A new
contact link anywhere on the site is tracked with no extra code; add
`data-lead-placement` to name its placement. The same link clicked twice within
2 s counts once.

## Attribution rules

Captured on the first page view of a session (`sessionStorage`, per tab). A tab
opened from one of our pages within 30 minutes of the last activity continues
that session instead of starting a direct one. New `utm_source`/`utm_campaign`
or a `gclid` in the URL starts a new session.

Precedence: **UTMs → gclid → referrer → direct.**

| Signal | source | medium | channel |
| --- | --- | --- | --- |
| `utm_source` present | `utm_source` (lower-case) | `utm_medium` or `(not set)` | `paid_search` if medium is cpc/ppc/paid… and the source is a search engine; `ai` if the source is an AI host (ChatGPT adds `utm_source=chatgpt.com`); `email` for email/newsletter; `social` for medium social or a social source; `organic_search` for medium organic on a search engine; `referral` for medium referral; else `campaign` |
| `gclid` without UTMs | `google` | `cpc` | `paid_search` |
| Referrer chatgpt.com, chat.openai.com, perplexity.ai, copilot.microsoft.com, gemini.google.com, claude.ai | `chatgpt` / `perplexity` / `copilot` / `gemini` / `claude` | `referral` | `ai` |
| Referrer google.*, bing.com, duckduckgo.com, yandex.*, ya.ru, yahoo.*, qwant.com, ecosia.org | engine name | `organic` | `organic_search` |
| Referrer threads, instagram, facebook (fb.com, fb.me), t.me / telegram, tiktok, linkedin (lnkd.in) | network name | `social` | `social` |
| Any other referrer host | host without `www.` | `referral` | `referral` |
| No referrer, or our own host | `(direct)` | `(none)` | `direct` |

Subdomains match (`l.instagram.com` → instagram); lookalikes do not
(`notgoogle.com` → referral). AI hosts are checked before search, so
`gemini.google.com` is AI.

**First touch** (`localStorage`, 30 days from first seen) keeps the same fields
from the very first visit.

**Session journey**: pages in order (path + title, last 20), total page-view
count, listing slugs opened (last 20), session start. Paths only — no query
strings. Device class comes from the UA and viewport (iPadOS with a desktop UA
is detected by touch points).

All storage access is wrapped; with storage blocked the journey lives in memory
for the page load and nothing throws.

## Lead entity (Sanity `lead`)

Written server-side by `createLead()` with `SANITY_API_TOKEN`. A failed write is
logged and never blocks the Telegram message.

| Field | Notes |
| --- | --- |
| `type` | `contact_form` · `property_inquiry` · `agent_contact` · `registration` · `guide_download` · `click_whatsapp` · `click_telegram` · `click_phone` · `click_email` |
| `status` | `new` (default) · `contacted` · `qualified` · `viewing` · `negotiation` · `won` · `lost` · `spam`. Internal traffic is saved as `spam`. Editable in Studio, with `notes` |
| `internal` | `true` for `?domlivo_internal=1` browsers |
| `createdAt`, `placement`, `locale`, `formLabel` | `formLabel` is the label the quote widgets already send, or realtor/agency for registrations |
| `property` (weak reference), `propertySlug`, `propertyTitle` | Looked up by slug |
| `agent` (weak reference), `agentSlug` | From the form, or the listing's agent |
| `source`, `medium`, `channel`, `campaign`, `utm{source,medium,campaign,content,term}`, `hasGclid`, `referrerHost`, `landingPage` | This session |
| `firstTouch{source,medium,channel,campaign,landingPage,referrerHost,at}` | First visit |
| `currentPage`, `pagesViewed[{path,title}]`, `pagesViewedCount`, `propertySlugsViewed`, `timeOnSiteSec` | Journey |
| `country` | `x-vercel-ip-country` only |
| `device`, `browserLanguage` | From the browser |
| `name`, `phone`, `email`, `message`, `interest{location,propertyType,dealType,budget,area}` | **Form leads only**, exactly what the forms already collect |

Type mapping: `/contacts` form and the phone-only callback forms →
`contact_form`; property contact modal (page or card) → `property_inquiry`
(`agent_contact` if it ever arrives without a listing); register form →
`registration`; the Durrës guide card → `guide_download` (email only,
`formLabel: durres-buying-guide`, with the listing when the card sat on a
property page).

The API contracts are unchanged: the form endpoints accept an optional
`context` (and `placement` on `/api/contact-agent`); without it the lead is
still saved and Telegram says there is no visit data.

### `POST /api/guide-request`

The lead magnet: "Buying in Durrës: prices, taxes, steps", seven static
PDFs in `public/guides/durres-buying-guide.<locale>.pdf`, built once by
`npx tsx scripts/buildDurresGuidePdf.ts` from `scripts/data/durres-guide/`
(never rendered per request — the Hobby CPU budget). The card renders on
Durrës city/district listing pages (inside the indexable-only depth
sections) and under the cost block of property pages whose city is Durrës.

Body: `{ "locale": "de", "email": "…", "consent": true, "companyWebsite": "", "propertySlug": "…", "context": { … } }`.

- Honeypot, bot UA filter (`204`), body over 32 KB → `413`, invalid → `400`
  (`Consent required`, `Invalid locale`, `Invalid email`, `Invalid property`).
- One lead per client per 60 s: a resubmit inside the window answers
  `{ ok, url, duplicate: true }` and the browser skips `generate_lead`.
- Response `{ "ok": true, "url": "/guides/durres-buying-guide.de.pdf" }` —
  the visitor always gets the file, even if the Sanity write or Telegram fails.
- Telegram: "📘 Лид скачал PDF-гид" with the guide, the email, the page, the
  listing and the analytics block.

**Studio schema (domlivo-admin `schemaTypes/documents/lead.ts`)**: add
`{ title: 'Guide download', value: 'guide_download' }` to the `type` options
and `{ title: 'Guide card', value: 'guide' }` to the `placement` options —
until then Studio shows the raw values but the documents are saved.

### `POST /api/leads/click`

Body (strict — unknown keys are rejected):

```json
{ "type": "click_whatsapp", "placement": "property", "propertySlug": "…", "locale": "ru", "context": { … } }
```

- Sent with `navigator.sendBeacon` (`text/plain` body), falling back to `fetch(…, { keepalive: true })`.
- Bots are ignored (UA pattern, empty UA) with `204`.
- Throttle: one lead per client and type per 30 s (`429`). The key is a SHA-256 of the forwarded IP and type, held in memory only; the IP is never stored.
- Body over 32 KB → `413`; invalid → `400`; accepted → `202`, then the Sanity write and Telegram message run in `after()`.

## Telegram

Plain text (no `parse_mode`, so no escaping), to `TELEGRAM_GENERAL_CHAT_ID`.

Form leads keep their existing message and get an analytics block appended:

```
New property contact request

Property: Квартира 1+1 с двумя балконами, центр Влёры
Link: https://www.domlivo.com/ru/property/prodaetsya-bolshaya-kvartira-1-1-vo-vlere
Agent: Drita Hoxha (drita-hoxha)
Language: RU

Name: …
Phone: …
Email: …

Message:
…

📊 Аналитика
Источник: google / organic
Канал: органический поиск
Реферер: google.com
Страница входа: /ru/albania/vlore/apartments
Первый визит: 10.09.2026, instagram / social
Просмотрено страниц: 5
• /ru/albania/vlore/apartments
• …
Смотрел объекты: prodaetsya-bolshaya-kvartira-1-1-vo-vlere
Время на сайте: 07:22
Страна: DE
Устройство: телефон
Язык: сайт RU, браузер ru-RU
```

Lines appear only when they have a value (`Кампания`, `Реферер`, `Клик Google
Ads`, `Страна`). The first visit shows its source only when it differs from this
visit. Up to the last 8 paths are listed, with "Последние 8:" when there were
more.

Click leads:

```
🟢 Лид кликнул по WhatsApp        (📞 … по телефону / ✉️ … по email)

Где: страница объекта
Страница: /ru/property/prodaetsya-bolshaya-kvartira-1-1-vo-vlere
Объект: Квартира 1+1 с двумя балконами, центр Влёры (prodaetsya-bolshaya-kvartira-1-1-vo-vlere)
https://www.domlivo.com/ru/property/prodaetsya-bolshaya-kvartira-1-1-vo-vlere

📊 Аналитика
…
```

Internal traffic: every message starts with `[ТЕСТ] `.

## Internal traffic

- Open any page with `?domlivo_internal=1` once per browser: sets `localStorage["domlivo:internal"]`. `?domlivo_internal=0` clears it.
- While set: `traffic_type: "internal"` is pushed to the dataLayer before any other event and added to every event; Clarity gets the custom tag `internal=1`; Telegram messages are prefixed `[ТЕСТ]`; leads are saved with `status: spam`, `internal: true`.

**Clarity**: Dashboard or Recordings → Filters → Custom tags → `internal` →
exclude `1` (or save it as a segment "Without internal").

**GA4** (needs the GTM step below):
1. GTM: Data Layer Variable `traffic_type` (DLV - traffic_type). In the GA4
   Google tag's configuration settings (shared event settings), add
   parameter `traffic_type` = `{{DLV - traffic_type}}` so every hit carries it.
2. GA4 Admin → Data settings → Data filters → Create filter → **Internal
   traffic**, `traffic_type` parameter value `internal`. This filter matches
   the `traffic_type` event parameter, which we now send ourselves, so the
   IP-based "Define internal traffic" rules are not needed. Leave the filter in
   *Testing* for a day (check with the "Test data filter name" dimension in
   Explorations), then set it to *Active*.

## GTM / GA4: what is configured (2026-09-17)

- **GA4 property** "Domlivo" (id 554679221) in account cyanidium-dev (328517824); web stream `https://www.domlivo.com`, measurement ID **G-2VTT0GD8V2**. Before this date the site had no GA4 property and the GTM container was empty — no Google Analytics data exists before 2026-09-17.
- **GTM GTM-T27ZZ289, version 2** (imported from a generated container JSON, merge mode):
  - `Google tag - Domlivo GA4` on Initialization – All Pages, config parameter `traffic_type = {{DLV - traffic_type}}`.
  - `GA4 event - Leads and search` on regex custom event `generate_lead|contact_form_submit|property_inquiry_submit|click_whatsapp|click_phone|click_email|search_submit|filter_apply`; `source/medium/campaign/channel` are sent as `lead_source/lead_medium/lead_campaign/lead_channel`.
  - `GA4 event - Site events` for `property_view`, `blog_view`, `ai_*`, `lead_submit` (camelCase keys mapped to snake_case).
  - Data Layer Variables `DLV - <key>` for every key above.
- **GA4 custom dimensions** (event scope): Lead type, Lead placement, Property slug, Lead channel, Lead source.
- **GA4 data filter** "Internal Traffic" (exclude `traffic_type = internal`) is **Active**. The flag is pushed by the consent bootstrap before GTM loads, so page views carry it too.
- **Still to do (2026-09-20):** `click_telegram` is new. Add it to the regex of the `GA4 event - Leads and search` trigger in GTM (the live container still lists only the three older click events, so until then the event reaches the dataLayer, Clarity, Sanity and Telegram but not GA4), and add `click_telegram` to the `type` options of the Studio `lead` schema in domlivo-admin.
- **Still to do:** mark `generate_lead` as a key event (optionally `click_whatsapp`, `click_phone`) in Admin → Events once the first one has arrived — GA4 only lists events it has received.

## GTM / GA4 setup reference

1. **Data Layer Variables**: `lead_type`, `placement`, `property_slug`, `property_id`, `city`, `district`, `property_type`, `price_eur`, `landing_page`, `source`, `medium`, `campaign`, `channel`, `deal`, `traffic_type`.
2. **Custom Event triggers** (one each, or one regex trigger `^(generate_lead|contact_form_submit|property_inquiry_submit|click_whatsapp|click_telegram|click_phone|click_email|search_submit|filter_apply)$`).
3. **GA4 Event tags** with event name `{{Event}}` and the parameters above.
   Avoid naming GA4 parameters `source`/`medium`/`campaign` if they collide with
   reserved traffic-source dimensions in your reports — map them to
   `lead_source`, `lead_medium`, `lead_campaign` in the tag instead.
4. **GA4 → Admin → Events → mark as key events**: `generate_lead` (primary),
   and optionally `click_whatsapp`, `click_phone`, `click_email`. Keep
   `contact_form_submit` / `property_inquiry_submit` as ordinary events so a
   form lead is not counted twice.
5. **Custom dimensions** (event scope) for `lead_type`, `placement`,
   `property_slug`, `channel` if you want them in standard reports.
6. The legacy `lead_submit` trigger can be retired once `generate_lead` is live.

## Privacy

- The journey stays in the visitor's browser until the visitor submits a form or clicks a contact link; only then does it go, with that request, to our own API. It is collected regardless of the analytics consent choice because it is first-party and never shared with GA4 or Clarity beyond the coarse parameters listed above.
- No IP address is stored anywhere. Country comes from Vercel's geo header; the click throttle hashes the IP in memory for 30 seconds.
- GA4 and Clarity never receive names, phones, emails, messages, free text, referrer URLs or the page list.
- Only the Google Ads click id's presence (`hasGclid`) is kept, never the id.
- Paths are stored without query strings.
- Internal/test leads are kept (as spam) so tests can be debugged; delete them in Studio as needed.

## Env

`TELEGRAM_BOT_TOKEN`, `TELEGRAM_GENERAL_CHAT_ID` (existing),
`SANITY_API_TOKEN` (write; without it leads are not saved but Telegram still
works), `NEXT_PUBLIC_SANITY_PROJECT_ID` (property lookup),
`NEXT_PUBLIC_SITE_URL` (listing links), `NEXT_PUBLIC_ENABLE_ANALYTICS=true`
(events). `TELEGRAM_API_BASE_URL` can point at a local mock for testing.
