# E001 — Listing contact block: messenger first or form first

Status: proposed · 2026-10-19 · start when the PostHog experiment is launched · review **2026-12-14** · sample check 2026-11-03 · follows the rules of [ADR 007](../seo/decisions/007-experiments.md) (hypothesis, success criteria, fixed review date, no silent extension)

## Context

A listing page offers two ways to reach the team, side by side: the "Get in touch" button, which opens the inquiry form (name, phone, message), and the WhatsApp / Telegram buttons. Until now the form button has always come first and is the primary button.

The audit of 2026-10-18 found that 70% of the month's "leads" were messenger clicks after which nobody wrote: an empty chat opened, and many desktops have no WhatsApp app (`docs/messenger-leads.md`). The changes shipped that day fixed the reasons: WhatsApp opens with a prefilled message about the listing, Telegram goes to the public bot (a Start is a lead with the listing attached), and every messenger click first opens a sheet with one big "Open WhatsApp/Telegram" button and a "or leave your number" field. A messenger click is now much more likely to end in a conversation than it was when the form-first order was chosen.

The form gives the team a phone number and a written request; a messenger chat is a smaller step for the visitor and starts a conversation at once. Which order produces more real conversations per listing view is an empirical question. With PostHog in place (feature flags, exposure tracking, funnels) it can be answered on live traffic instead of argued.

## Hypothesis

Putting the WhatsApp / Telegram buttons above the inquiry button on a listing page increases the share of listing viewers who start a real conversation, because a chat is a smaller first step than a form, and since 2026-10-18 a messenger click no longer dead-ends in an empty chat.

## Design

| | |
|---|---|
| Flag | PostHog multivariate flag `listing-contact-order`, used by a PostHog experiment of the same name |
| Variants | `control` (form button first, as today) · `messenger-first` (messenger buttons first, form button below). 50/50 |
| Changed | Only the order. Same buttons, same styles, same text, same spacing |
| Where | The two contact blocks on `/{locale}/property/{slug}` (top of the page and the side card). Both are desktop-only (`lg`, 1024 px and up) |
| Not changed | The mobile sticky bar (already messenger icons first), the catalogue, the map sheet |
| Who is in it | Desktop visitors who granted analytics consent. Everyone else sees the control and is not counted |
| Exposure | `$feature_flag_called` for `listing-contact-order`, sent the first time the variant is read. Read only at desktop width, so a phone visitor is never counted as exposed |
| Code | `src/lib/experiments/listingContactOrder.ts`, `src/components/property/ListingContactBlock.tsx`, `src/lib/analytics/useFlagVariant.ts` |

## Metrics

All are per exposed visitor, read in the PostHog experiment, which attaches the variant to every event after exposure (`$feature/listing-contact-order`).

- **Primary — conversation rate**: share of exposed visitors with at least one of `messenger_open` (pressed "Open WhatsApp/Telegram" in the sheet, so the chat really opened), `property_inquiry` (inquiry form sent) or `contact_form` (number left in the sheet).
- **Guardrail — inquiry rate**: share with `property_inquiry`. The form is the only lead that always carries a phone number. It must not fall by more than 20% relative.
- **Secondary — intent rate**: share with `click_whatsapp` or `click_telegram`. Expected to rise in `messenger-first`. A rise here without a rise in the primary metric means the extra clicks are the old empty-chat clicks again.
- **Not attributable**: `telegram_start` is counted server-side and cannot be tied to a browser or variant (Telegram does not pass the site session on). Compare its weekly count by `placement = property` before and during the test as context only.

## Sample size

The baseline is not known yet; PostHog has no data before this release. For a two-sided two-proportion test at 5% significance and 80% power, detecting a 30% relative lift needs about 9,800 exposed visitors per variant at a 2% baseline conversation rate and about 3,800 at 5%.

On **2026-11-03** read the baseline conversation rate and the weekly exposures, and write the projected total at the review date into the Result section below. If the projection is below the requirement, the test still runs to the review date, but the outcome can only be 1 or 2 below if PostHog's win probability clears the bar; otherwise it is outcome 3.

## Decision at review (2026-12-14)

Never by extending the date silently. One of:

1. **`messenger-first` wins**: PostHog win probability for the primary metric ≥ 90% and the inquiry guardrail holds. Make messenger-first the fixed order in `ListingContactBlock` (or inline it back into the page), delete the flag in code and in PostHog.
2. **`control` wins**, or the guardrail fails: keep the form first, delete the flag in code and in PostHog.
3. **No clear winner**: keep the control (a phone number per lead is worth more to the team than an unproven gain), delete the flag, and record the reading here. If the intent rate rose but conversations did not, look at the messenger sheet next, not at the order.

## Alternatives considered

- **Change the button styles as well** (messenger as the primary filled button). Rejected for this test: two changes at once and the result could not say which one worked. A follow-up test if the order wins.
- **Bucket on our side** (hash of a first-party id, as ADR 008 did with listing slugs) and analyse in GA4. Rejected: GA4 has no exposure events or experiment statistics, and a home-made bucketing would need its own consent handling. PostHog flags give exposure, assignment and analysis in one place.
- **Include phones via the sticky bar**. Rejected for now: the sticky bar already shows messenger icons first, so there is no control to compare against without making the phone layout worse for half the visitors.

## Known limits

- PostHog loads after the visitor's first move or 5 s (same deferral as GTM), so on a listing opened straight from search the block can switch order a moment after the first scroll. Visitors who arrive from another page of the site already have PostHog and see the variant from the start. The exposure is recorded only when the variant is applied.
- Consent: only visitors who accept analytics are in the test. They may differ from the rest; the result applies to them.

## Result

_Fill in at the sample check and at review: exposures per variant, the three rates with intervals, PostHog's win probability, the outcome taken and the commit that applied it._
