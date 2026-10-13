/**
 * Jobs the nightly cron (`/api/cron/nightly`, 03:30 UTC) runs, in order.
 *
 * One cron entry for all of them because the Hobby plan limits how many cron
 * jobs a project gets and how often they fire. Adding a job is one line here;
 * keep each one well inside the function's 60 s, since they share it.
 */

import { runSearchConsoleImport } from '@/lib/analyticsStore/gscImport'

export type NightlyJob = {
  name: string
  /** Returns a JSON-serialisable summary; throwing marks only this job as failed. */
  run: () => Promise<unknown>
}

export const NIGHTLY_JOBS: NightlyJob[] = [
  { name: 'gsc', run: runSearchConsoleImport },
]

export type NightlyJobResult = { ok: true; ms: number; result: unknown } | { ok: false; ms: number; error: string }

/** Runs jobs one after another; a failure is reported and the next job still runs. */
export async function runNightlyJobs(
  jobs: NightlyJob[] = NIGHTLY_JOBS,
  clock: () => number = Date.now
): Promise<Record<string, NightlyJobResult>> {
  const out: Record<string, NightlyJobResult> = {}
  for (const job of jobs) {
    const started = clock()
    try {
      const result = await job.run()
      out[job.name] = { ok: true, ms: clock() - started, result }
    } catch (err) {
      const error = (err instanceof Error ? err.message : String(err)).slice(0, 500)
      console.error(`[cron/nightly] ${job.name} failed:`, error)
      out[job.name] = { ok: false, ms: clock() - started, error }
    }
  }
  return out
}
