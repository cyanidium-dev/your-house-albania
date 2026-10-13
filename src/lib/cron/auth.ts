/**
 * Who may call a cron route. Same contract as
 * `src/app/api/cron/update-currency-rates`: Vercel's scheduler sends
 * `Authorization: Bearer <CRON_SECRET>`; a manual or local run may pass
 * `?secret=<CRON_SECRET>` instead. Without `CRON_SECRET` nobody may.
 */
export function isCronAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false
  const auth = request.headers.get('authorization')
  if (auth === `Bearer ${cronSecret}`) return true
  const secret = new URL(request.url).searchParams.get('secret')
  return secret === cronSecret
}
