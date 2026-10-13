import type { NextRequest } from 'next/server'
import { isCronAuthorized } from '@/lib/cron/auth'
import { runNightlyJobs } from '@/lib/cron/nightlyJobs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
/** The Hobby plan's ceiling; the jobs in `NIGHTLY_JOBS` share it. */
export const maxDuration = 60

/**
 * Nightly maintenance (Vercel cron, `vercel.json`). Runs every job in
 * `src/lib/cron/nightlyJobs.ts` and answers `{ job: result }`. Jobs whose
 * configuration is missing report themselves as skipped rather than failing.
 */
export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const results = await runNightlyJobs()
  return Response.json(results, { headers: { 'Cache-Control': 'no-store' } })
}
