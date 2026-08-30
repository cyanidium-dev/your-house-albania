# Frontend Agent Communication Audit

## 1) Understanding

This is a frontend-only audit (no implementation) of agent-related wiring and communication flows in this Next.js App Router + `next-sanity` repo, focused on operational paths (forms, routing, Telegram/email, Sanity writes, and agent-targeting behavior), with explicit separation between implemented, partial/disabled, and missing areas.

## 2) Current Agent-Related Frontend Usage

### Relevant files and roles

- `src/app/[locale]/agent/[agent]/page.tsx`  
  Agent-scoped listing page (`/[locale]/agent/[slug]`), fetches agent by slug and renders agent-aware catalog.
- `src/app/[locale]/agent/[agent]/[country]/[city]/[[...filters]]/page.tsx`  
  Agent + geo listing page with canonicalization/redirect logic.
- `src/lib/sanity/client.ts`  
  Core agent fetch (`fetchAgentBySlug`), agent slugs for sitemap, landing section agent projection, and property filtering by `agent->slug`.
- `src/lib/sanity/agentAdapter.ts`  
  Maps raw Sanity `agent` to normalized frontend `AgentContactPage`.
- `src/lib/routes/listingRoutes.ts`, `src/lib/routes/listingRouteResolver.ts`, `src/lib/catalog/parseCatalogFilters.ts`  
  Agent route normalization, filter parsing, redirect/canonical handling.
- `src/components/Properties/PropertyList/index.tsx`  
  Applies `agentSlug` filtering to catalog queries.
- `src/components/landing/sections/investorLogosShared.tsx`  
  Uses agent logo/photo + social URLs; explicitly notes per-agent contact page is decommissioned.

### Agent data currently read from Sanity

From `fetchAgentBySlug` in `src/lib/sanity/client.ts`:

- `_id`
- `name` (localized in adapter)
- `slug.current`
- `bio` (localized in adapter)
- `email`
- `phone`
- `photo` (`alt`, `asset.url`)
- `agentLogo` (`alt`, `asset.url`)
- `telegramUrl`
- `facebookUrl`
- `instagramUrl`
- `youtubeUrl`

Also used:

- `property.agent->slug.current` for catalog filtering (`fetchCatalogProperties` predicate).
- Landing sections project `agents[]->` with logo/social fields for logo rows.

### Agent-specific pages/forms currently present

- Agent pages: yes (`/[locale]/agent/...` listing routes).
- Agent-specific contact page/form: not currently active.
- Agent-specific submission API branch: exists in backend route (`submissionKind: 'agent'`) but no active UI found posting that branch.

## 3) Current Contact / Communication Flows

### Generic contact flow

- UI: `src/app/[locale]/contacts/page.tsx` -> `src/components/contact/ContactPageContent.tsx` -> `src/components/contact/GeneralContactForm.tsx`
- Submit target: `POST /api/contact-agent`
- Payload includes `submissionKind: 'general'`, filters + contact fields + honeypot `companyWebsite`
- Success handling: redirect to `src/app/[locale]/contact/thank-you/page.tsx`
- Failure handling: inline error; no redirect

### Agent-specific contact flow

- API supports `submissionKind: 'agent'` in `src/app/api/contact-agent/route.ts`
- Validates `agentSlug` for agent branch
- Delivery behavior for this branch is stub/simulated, not real routing
- No active frontend form currently posting `submissionKind: 'agent'`

### Telegram flow

- Routing/env resolution: `src/lib/notifications/agentContact/routing.ts`
  - `TELEGRAM_BOT_TOKEN`
  - `TELEGRAM_GENERAL_CHAT_ID`
  - `TELEGRAM_AGENT_CONTACT_CHAT_ID` (documented as testing/future single personal inbox)
- Real Telegram send via Bot API: `src/lib/notifications/agentContact/telegramBotSend.ts`
- Contact delivery orchestrator: `src/lib/notifications/agentContact/telegramStubDelivery.ts`
  - `general` -> real send (if configured)
  - `agent` -> simulated sends only (both general and agent targets simulated)
- Registration route also uses Telegram real send to general chat:
  - `src/app/api/registration-request/route.ts`
  - formatted by `src/lib/notifications/registrationRequest/formatTelegramRegistrationRequest.ts`

### Email flow

- No outbound email sending integration found (no active mail sender/provider integration in current communication routes).
- Contact page shows manager email as `mailto:` display link only.

### Sanity write flow

- Active write path exists in repo for cron:
  - `src/app/api/cron/update-currency-rates/route.ts` -> `patchSiteSettingsCurrency` in `src/lib/sanity/writeClient.ts`
- Contact form submissions: no Sanity create.
- Registration submissions:
  - helper exists: `createRegistrationRequest` in `src/lib/sanity/writeClient.ts`
  - route has create block commented out / disabled in `src/app/api/registration-request/route.ts`
  - explicitly documented in `docs/registration-request-sanity-frontend-contract.md`

### Success/failure behavior

- Contact + registration: success only when API returns `{ ok: true }`
- Both redirect to dedicated thank-you pages after success
- Telegram misconfig/send failure => API 500 => no redirect

## 4) Current Technical Capabilities

Frontend already supports these backend-like patterns relevant to future agent workflow:

- Server-side validated intake APIs (`/api/contact-agent`, `/api/registration-request`) with consistent JSON responses.
- Telegram transport already in production path (general inbox delivery is real).
- Honeypot anti-spam implemented in both public forms and validated server-side.
- Sanity write client exists and works in production for another feature (currency cron), proving server-side write token pattern is established.
- Agent lookup + routing infrastructure is mature for listing-level scoping (`agentSlug` in routes, parser, catalog filters).
- Env contract is explicit in `.env.example` for Telegram and Sanity write credentials.

## 5) Gaps / Risks

### Missing pieces

- No active agent contact UI posting `submissionKind: 'agent'`.
- No per-agent real Telegram delivery path yet (agent branch remains simulated).
- No per-agent destination resolution from CMS (no agent chat-id/email routing map in active flow).
- No active Sanity lead persistence for contact submissions (and registration is intentionally disabled).

### Disabled/partial

- `createRegistrationRequest` exists but not called in live route.
- Agent submission branch exists but delivery is stubbed.

### Hardcoded behavior

- Both general contact and registration currently route to `TELEGRAM_GENERAL_CHAT_ID`.
- Agent branch fallback routing currently based on env variable, not per-agent CMS field mapping.

### Security / abuse considerations

- Present: required field validation, enum constraints, email validation, max lengths, honeypot.
- Missing in observed flow: explicit rate limiting, CAPTCHA/challenge, explicit CSRF strategy for these JSON endpoints.
- Operational risk: if Telegram fails, submissions fail (no queue/fallback storage path currently active).
- Logging includes payload previews; useful but may increase PII exposure in logs.

### Potential blockers for clean agent routing

- No persisted per-agent communication identifier currently used (e.g., Telegram chat ID).
- No active pipeline to collect/store chat IDs from runtime interactions.
- No current write path creating lead docs tied to agent refs/slugs.

## 6) Recommended Support Plan for Sanity Workflow

Frontend perspective only:

### Reuse as-is

- Reuse existing `/api/contact-agent` intake/validation structure.
- Reuse Telegram sender abstraction in `telegramBotSend.ts`.
- Reuse `fetchAgentBySlug` and existing agent slug routing/canonical logic.
- Reuse server-side Sanity write pattern from `writeClient.ts` + existing env token approach.

### Small additions likely needed later (minimal scope)

- Add/restore one active agent-specific submit path from UI to `submissionKind: 'agent'`.
- Replace agent-branch simulation with real destination resolution based on agent data (likely Sanity-sourced).
- Add Sanity lead/submission create for contact flow (document type + minimal fields + agent linkage).
- Decide delivery strategy order (Telegram-first vs write-first vs dual with partial failure policy).

### Telegram chat-id capture/storage feasibility

- Feasible in current architecture, but currently absent.
- Needs a defined source-of-truth (likely Sanity field on agent or linked routing doc) and secure write/update pathway.
- Existing code already consumes `telegramUrl`; no current extraction of chat IDs from it.

### Can contact submissions be safely written to Sanity and routed per agent?

- Yes, structurally feasible with current server-route + write-client patterns.
- Safety/completeness depends on adding:
  - controlled write auth usage
  - idempotency/failure policy
  - abuse/rate controls
  - agent destination resolution contract

## 7) Minimal Next Step Recommendation

After Sanity-side schema/routing design is finalized, smallest practical frontend support scope:

- enable one canonical submission flow (contact API) to:
  1) resolve destination agent
  2) create Sanity submission doc
  3) send Telegram notification (or fallback policy)
- keep current `/contacts` generic flow intact, and add agent-specific submit payload only where needed
- avoid broader routing/UI redesign

## 8) Open Questions

- What is the canonical Sanity model for routing destination: `agent` field(s) vs separate routing document?
- Should Telegram delivery failure block UX success when Sanity write succeeds (or vice versa)?
- Should both generic and agent leads persist to same Sanity document type with discriminator, or separate types?
- Is per-agent email routing required as fallback, or Telegram-only in phase 1?
- Do you want rate limiting/challenge in scope for first implementation increment?

## Already reusable for upcoming agent workflow

- `fetchAgentBySlug` + agent route infrastructure (`/[locale]/agent/...`)
- `POST /api/contact-agent` server validation pattern
- Telegram Bot send utility (`telegramBotSend.ts`) for real sends
- write-client/token pattern (`writeClient.ts`) proven by active cron writes
- existing success/failure + thank-you UX pattern

## Would likely require frontend work

- Activate real agent-specific form submit path
- Replace agent-branch Telegram stub with real per-agent routing
- Add Sanity create for contact/lead docs (currently absent for contacts)
- Add per-agent destination source (chat id/email mapping) consumption logic
- Add resiliency/abuse controls (rate limit/challenge) if required by ops

## Probably should stay out of scope for now

- Large routing/SEO/UI restructuring unrelated to operational submission flow
- Broad architecture redesign beyond minimal route-handler + helper extension
- Multi-channel orchestration platform work before validating Sanity-side schema and routing rules

## Implementation handoff notes for next prompt

- Confirm target Sanity schema for lead/submission docs and agent linkage key.
- Confirm destination routing contract (where per-agent Telegram chat id lives).
- Define failure policy matrix (Sanity fail, Telegram fail, both fail).
- Update `/api/contact-agent` to support real `submissionKind: 'agent'` delivery path.
- Decide if generic submissions should also write to Sanity in phase 1.
- Add minimal abuse protections (at least basic rate limit) before go-live.
- Keep existing thank-you redirect contract unchanged (`{ ok: true }` -> redirect).
