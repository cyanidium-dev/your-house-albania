import { afterEach, describe, expect, it, vi } from 'vitest'
import { isCronAuthorized } from './auth'
import { NIGHTLY_JOBS, runNightlyJobs } from './nightlyJobs'

describe('runNightlyJobs', () => {
  it('runs every job in order and keeps going after a failure', async () => {
    const order: string[] = []
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const results = await runNightlyJobs([
      { name: 'first', run: async () => { order.push('first'); throw new Error('boom') } },
      { name: 'second', run: async () => { order.push('second'); return { status: 'ok' } } },
    ])
    spy.mockRestore()
    expect(order).toEqual(['first', 'second'])
    expect(results.first).toMatchObject({ ok: false, error: 'boom' })
    expect(results.second).toMatchObject({ ok: true, result: { status: 'ok' } })
  })

  it('has the Search Console import registered', () => {
    expect(NIGHTLY_JOBS.map((j) => j.name)).toContain('gsc')
  })
})

describe('isCronAuthorized', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('needs CRON_SECRET, as a bearer token or ?secret=', () => {
    vi.stubEnv('CRON_SECRET', '')
    expect(isCronAuthorized(new Request('https://x/api/cron/nightly', { headers: { authorization: 'Bearer ' } }))).toBe(false)
    vi.stubEnv('CRON_SECRET', 's3cret')
    expect(isCronAuthorized(new Request('https://x/api/cron/nightly', { headers: { authorization: 'Bearer s3cret' } }))).toBe(true)
    expect(isCronAuthorized(new Request('https://x/api/cron/nightly?secret=s3cret'))).toBe(true)
    expect(isCronAuthorized(new Request('https://x/api/cron/nightly', { headers: { authorization: 'Bearer nope' } }))).toBe(false)
  })
})
