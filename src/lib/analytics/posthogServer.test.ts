import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildServerCapture } from './posthogServer'

describe('buildServerCapture', () => {
  it('drops empty properties and never builds a person profile', () => {
    const body = buildServerCapture(
      'telegram_start',
      { placement: 'property', property_slug: undefined, site_locale: '', locale: 'ru' },
      { apiKey: 'phc_test', distinctId: 'server-1', now: new Date('2026-10-19T10:00:00Z') },
    )
    expect(body).toEqual({
      api_key: 'phc_test',
      event: 'telegram_start',
      distinct_id: 'server-1',
      timestamp: '2026-10-19T10:00:00.000Z',
      properties: { placement: 'property', locale: 'ru', $process_person_profile: false, $lib: 'domlivo-server' },
    })
  })
})

describe('capturePostHogServer', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  async function load(env: Record<string, string>) {
    vi.resetModules()
    for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v)
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}'))
    vi.stubGlobal('fetch', fetchMock)
    const mod = await import('./posthogServer')
    return { ...mod, fetchMock }
  }

  it('sends nothing without the project key', async () => {
    const { capturePostHogServer, fetchMock } = await load({ NEXT_PUBLIC_ENABLE_ANALYTICS: 'true', NEXT_PUBLIC_POSTHOG_KEY: '' })
    await capturePostHogServer('telegram_start', { placement: 'property' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('posts to the EU capture endpoint by default and swallows failures', async () => {
    const { capturePostHogServer, fetchMock } = await load({
      NEXT_PUBLIC_ENABLE_ANALYTICS: 'true',
      NEXT_PUBLIC_POSTHOG_KEY: 'phc_test',
    })
    await capturePostHogServer('telegram_start', { placement: 'property' })
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock.mock.calls[0][0]).toBe('https://eu.i.posthog.com/i/v0/e/')
    fetchMock.mockRejectedValueOnce(new Error('offline'))
    await expect(capturePostHogServer('telegram_start', {})).resolves.toBeUndefined()
  })
})
