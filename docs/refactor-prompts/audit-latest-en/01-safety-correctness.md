# Goal
Remove safety footguns and correctness bugs **without changing any user-visible behavior**. This is the warm-up phase: small, low-risk, high-confidence fixes that make the rest of the roadmap safe.

# Context
Domlyva is a Next.js 15 (App Router, React 19) real-estate site backed by Sanity CMS, 5 locales (next-intl), planned to become a multi-tenant SaaS. A fresh audit (`docs/TECHNICAL_AUDIT_LATEST.md`) found the codebase is sound but carries a few defense-in-depth gaps and a correctness bug in a locale list. Fix these first so later phases build on a clean base.

# Files to inspect
- `src/lib/sanity/writeClient.ts` (missing `server-only`)
- `src/app/editor/login/page.tsx` (~line 33) and `.env.example` (~line 42) — stale editor-secret guidance
- `src/components/Auth/SignIn/index.tsx` (line 11) and `src/components/Auth/SignUp/index.tsx` (line 9) — `LOCALES` array missing `it`
- `src/app/api/contact-agent/route.ts` and `src/app/api/registration-request/route.ts` — no rate limiting; PII logging at `contact-agent/route.ts:~147`
- `src/app/api/editor/login/route.ts` (~line 28) — non-constant-time password compare

# Allowed changes
- Add `import 'server-only';` to `writeClient.ts`.
- Add `it` to the hardcoded locale arrays in the two Auth files (ONLY if you are NOT deleting `Auth/**` in Phase 2; if Phase 2 deletes it, skip).
- Add a minimal in-memory/edge IP token-bucket rate limiter to the two public form routes (return 429 on abuse). Keep it dependency-free or use an existing lightweight approach.
- Reduce `contact-agent` log line to non-PII (counts/lengths only, not name/phone/email).
- Make the editor password comparison constant-time (e.g. `crypto.timingSafeEqual`).
- Update the stale docs strings in `editor/login/page.tsx` and `.env.example` to state that `EDITOR_SESSION_SECRET` is required and `SANITY_WRITE_TOKEN` is NOT a fallback.

# Forbidden changes
- No refactors, renames, file moves, or deletions (that is Phase 2+).
- No change to the editor auth flow semantics, cookie flags, or token handling beyond constant-time compare.
- No new heavy dependencies.
- Do not alter form fields, endpoints, or the Telegram payload shape.

# Step-by-step plan
1. `server-only` import in `writeClient.ts`; verify nothing client-side imports it (grep).
2. Fix the `it` locale omission in both Auth files (or note skipped because Phase 2 deletes them).
3. Implement the rate limiter as a small helper; wire into both routes before processing.
4. Swap the PII log for a safe summary.
5. Constant-time password compare in the login route.
6. Correct the two stale doc strings.

# Acceptance criteria
- `writeClient.ts` starts with `import 'server-only';` and build still succeeds.
- Hitting `contact-agent`/`registration-request` rapidly returns 429 after the threshold; a single normal submit still works.
- Editor login still succeeds with the correct password and fails with a wrong one.
- No PII (name/phone/email) appears in server logs for a contact submit.
- `.env.example` and the login page no longer mention `SANITY_WRITE_TOKEN` as an editor secret.

# Required checks
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`

# Output format
Report: changed files (with one-line rationale each), any files intentionally skipped (and why), residual risks, and what is deferred to later phases.
