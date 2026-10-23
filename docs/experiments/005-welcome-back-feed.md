# E005 — "Welcome back": picks for a returning visitor

Status: running from 2026-10-24 · review **2026-12-21** · sample check 2026-11-07 · follows [ADR 007](../seo/decisions/007-experiments.md) (hypothesis, success criteria, fixed review date, no silent extension)

## Context

Most visitors look at a few listings and leave without writing. Some come back days later and start again from the home page or the catalogue, with nothing on the site remembering what they looked at. The owner asked (2026-10-24) to recognise such a visitor and offer listings picked for them.

## Hypothesis

Showing a returning visitor "Welcome back, we picked N listings for you" (new listings since the last visit, listings like the ones viewed, and "want us to send you a selection?") raises the share of returning visitors who start a conversation, because they skip the search they already did once.

## Design

| | |
|---|---|
| Flag | PostHog multivariate flag `welcome-back-feed`, used by a PostHog experiment of the same name |
| Variants | `control` (nothing new) · `test` (prompt + picks). 50/50 |
| Who is in it | A visitor who granted analytics consent, comes back after more than 30 minutes, viewed at least one listing before, is on the home page or a listing page, and for whom there are at least two picks. The flag is read only then, so both groups hold the same visitors |
| What test sees | After 2.5 s a card at the bottom: "Welcome back! We picked N listings… M are new since your last visit." "Show me" opens a dialog: new since the last visit, similar to what you viewed, and WhatsApp / Telegram buttons ("want us to send you a selection?", WhatsApp with the criteria pre-filled). "Not now" hides it for a week |
| Picks | `src/lib/personalization/recommend.ts`: city, type, rooms and budget read from the viewed listings (catalogue snapshot); a listing far over the budget or in another city is never picked |
| Memory | `localStorage` only (`domlivo:visits`: viewed slugs and the last activity time). Sent to `/api/recommendations` as slugs and one date; nothing is stored on the server |
| Code | `src/components/personalization/WelcomeBack.tsx`, `WelcomeBackFeed.tsx`, `src/lib/personalization/*`, `src/app/api/recommendations/route.ts`, `src/lib/experiments/welcomeBackFeed.ts` |

## Metrics

Per exposed visitor, in the PostHog experiment (`$feature/welcome-back-feed` on every event after exposure).

- **Primary — conversation rate**: share with at least one of `messenger_open`, `property_inquiry`, `contact_form`.
- **Secondary — listing views per visitor**: `property_view` count. Expected to rise in `test`.
- **Diagnostics (test only)**: `welcome_back_shown`, `welcome_back_open`, `welcome_back_card_click`, `welcome_back_realtor`, `welcome_back_dismiss`. If opens are low, the prompt text is the problem, not the picks.

## Sample size

Returning visitors with consent are few (tens a week in October 2026). On **2026-11-07** read the weekly exposures and write the projected total at the review date below. A small sample can still show a large effect; otherwise the outcome is 3.

## Decision at review (2026-12-21)

1. **`test` wins** (win probability ≥ 90% on the primary metric): keep the feature for everyone, delete the flag in code and in PostHog.
2. **`control` wins**: remove the feature.
3. **No clear winner**: keep it if `welcome_back_open` / `welcome_back_shown` ≥ 30% (people want it) and it costs nothing in the primary metric; otherwise remove it. Record the reading here.

## Result

(to be filled on 2026-11-07 and 2026-12-21)
