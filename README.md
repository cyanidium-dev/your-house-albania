# DomLivo — Your House Albania (Frontend)

Public real-estate frontend for **DomLivo / Your House Albania**: multilingual property catalog, city/district landing pages, blog and guides for the Albanian market. Content is served headlessly from Sanity; the companion Studio lives in the `domlivo-admin` repo.

## Stack

- **Next.js 15** (App Router) + **React 19**, TypeScript
- **next-intl** — 5 locales (`en`, `uk`, `ru`, `sq`, `it`), default `sq`
- **Tailwind CSS v4**
- **Sanity** content backend (project `g4aqp6ex`); GROQ query layer in `src/lib/sanity/queries/`

## Run

```bash
npm install
npm run dev        # cleans .next, starts dev server
npm run build      # production build
npm start          # serve production build
npm run lint
```

## Environment variables

See `.env.example` for the full annotated list. Groups:

- **Sanity** — `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`; write client (`SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_API_VERSION`, `SANITY_WRITE_TOKEN`) used by the currency cron and editor persistence
- **Cron** — `FIXER_API_KEY`, `CRON_SECRET` (Vercel cron → `/api/cron/update-currency-rates` patches exchange rates into `siteSettings`)
- **Revalidation** — `SANITY_REVALIDATE_SECRET` (bearer secret for `POST /api/revalidate/sanity`; route is disabled without it)
- **Telegram** — `TELEGRAM_BOT_TOKEN`, `TELEGRAM_GENERAL_CHAT_ID` (contact/registration form delivery), optional `TELEGRAM_API_BASE_URL`, agent-inbox stub vars
- **Editor auth** — `EDITOR_PASSWORD`, `EDITOR_SESSION_SECRET` (HMAC cookie signing) for the hidden `/editor` route tree
- **SEO / flags** — `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_ENABLE_INDEXING` (keep `false` outside production)

## Route map (under `/[locale]`)

- `/` — home (CMS `landing-home` landing page)
- `/{country}/{city}/[[...filters]]` — geo property catalog (e.g. `/albania/tirana/...`); `/catalog` — root catalog
- `/{country}/{city}/districts` and `/districts/[district]` — district index and pages; `/{city}/info` — city info landing
- `/property/[slug]` — property detail
- `/blog`, `/blog/[slug]` — blog index and articles
- `/guides/[slug]` — editorial guides (CMS landings, route family `custom`)
- `/<slug>` — unique landings (route family `unique`): final fallback of the top-level single-segment resolver — statics, country, deal, type, and city slugs all take precedence. No index page; wire navigation manually. Contract: workspace `docs/engineering/ROUTING.md`
- `/sale`, `/rent`, `/short-term-rent` — deal-type routes. **Rentals are currently hidden from the public UI** (product decision 2026-07): `src/lib/catalog/publicDealTypes.ts` exposes only `sale`; rent routes still resolve via direct URL with `noindex`
- `/contacts`, `/register`, `/for-realtors`, `/how-to-publish`, `/sell`, `/investment`, `/favorites`, `/agent/[agent]` — supporting pages
- `/editor` — hidden password-protected landing editor (outside the locale tree, never loaded by the public site)
- Sitemaps are split per content type (`sitemap.xml` + `sitemap-*.xml` in `src/app/`)

## Documentation

- `docs/` — Sanity↔frontend contracts (blog, registration requests, revalidation webhook), canonical technical audit (`TECHNICAL_AUDIT_LATEST.md`), refactor prompt series (`docs/refactor-prompts/`), archived reports (`docs/archive/`)
- Live backlog: workspace `docs/engineering/BACKLOG.md`
