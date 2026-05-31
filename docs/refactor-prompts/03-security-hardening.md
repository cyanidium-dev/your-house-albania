# Refactor Prompt 03 — Security Hardening (P1)

## Goal
Make public POST endpoints abuse-resistant and remove latent hardcoded credentials.

## Context
`/api/contact-agent`, `/api/registration-request`, `/api/editor/login` accept unauthenticated POSTs with only a `companyWebsite` honeypot — vulnerable to Telegram-notification flooding, registration spam, and editor-password brute-force. Separately, the dead `src/components/Auth/*` island ships hardcoded `admin/admin123` defaults. Audit §2.3, §12.

## Files to inspect
- `src/app/api/contact-agent/route.ts`
- `src/app/api/registration-request/route.ts`
- `src/app/api/editor/login/route.ts`
- `src/lib/editor/signCookie.ts` (existing HMAC/timingSafeEqual — do not weaken)
- `src/components/Auth/{SignIn,SignUp,SocialSignIn,SocialSignUp}` (hardcoded creds)

## Allowed changes
- Add IP-based rate limiting (token bucket / fixed window) to the 3 public POST routes.
- Return `429` with a clear JSON body on limit breach.
- Delete the dead `Auth` island (0 JSX usage — confirm with grep first).

## Forbidden changes
- Do NOT change the editor session signing scheme or its secret (`EDITOR_SESSION_SECRET`); do NOT reuse `SANITY_WRITE_TOKEN`/`SANITY_API_TOKEN` for signing.
- Do NOT remove the existing honeypot.
- Do NOT expose any server-only token to the client.

## Step-by-step plan
1. Pick a rate-limit mechanism (in-memory for single instance, or a shared store if multi-instance) and a sensible limit per route (e.g. login 5/min/IP, contact 10/min/IP).
2. Wrap each route handler; on breach return `429 {ok:false,reason:"rate_limited"}`.
3. Grep to confirm `src/components/Auth/*` has zero importers/JSX usage, then delete the directory.
4. Run checks.

## Acceptance criteria
- Exceeding the limit on each route returns `429` and does not perform the side effect (no Telegram send / no Sanity write / no session issue).
- Legitimate single requests still succeed.
- No hardcoded credentials remain in the repo (grep `admin123` → 0 hits).

## Required checks
```
npm run lint
npm run typecheck
npm run build
```

## Output format
List changed files, the chosen limits per route, and confirmation that `admin123` no longer appears in the codebase.
