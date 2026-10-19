import { afterEach, describe, expect, it, vi } from 'vitest'

const ph = {
  init: vi.fn(),
  capture: vi.fn(),
  opt_out_capturing: vi.fn(),
  opt_in_capturing: vi.fn(),
  has_opted_out_capturing: vi.fn(() => false),
  getFeatureFlag: vi.fn(() => 'messenger-first'),
  register: vi.fn(),
  onFeatureFlags: vi.fn(),
}

vi.mock('posthog-js', () => ({ default: ph }))

type Listener = () => void

/** A window whose "first move" listeners the test fires by hand. */
function fakeBrowser() {
  const listeners = new Map<string, Listener[]>()
  const win = {
    location: { pathname: '/en/property/flat-durres', search: '' },
    addEventListener: (type: string, fn: Listener) => listeners.set(type, [...(listeners.get(type) ?? []), fn]),
    removeEventListener: () => {},
    setTimeout: () => 0,
  }
  vi.stubGlobal('window', win)
  vi.stubGlobal('document', { readyState: 'loading' })
  return { firstMove: () => listeners.get('pointerdown')?.forEach((fn) => fn()) }
}

async function load(key = 'phc_test') {
  vi.resetModules()
  vi.stubEnv('NEXT_PUBLIC_ENABLE_ANALYTICS', 'true')
  vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', key)
  const browser = fakeBrowser()
  const mod = await import('./posthog')
  return { ...mod, ...browser }
}

/** Lets the dynamic import and its `then` run. */
const settle = () => new Promise((r) => setTimeout(r, 0))

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('PostHog behind analytics consent', () => {
  it('is off without the project key', async () => {
    const mod = await load('')
    expect(mod.posthogEnabled).toBe(false)
    mod.setPostHogConsent(true)
    mod.firstMove()
    await settle()
    expect(ph.init).not.toHaveBeenCalled()
  })

  it('loads nothing and drops events before consent', async () => {
    const mod = await load()
    mod.setPostHogConsent(false)
    mod.capturePostHog('click_whatsapp', { placement: 'property' })
    mod.firstMove()
    await settle()
    expect(ph.init).not.toHaveBeenCalled()
    expect(ph.capture).not.toHaveBeenCalled()
  })

  it('starts on the first move after a grant, on the EU host, and flushes what was queued', async () => {
    const mod = await load()
    mod.setPostHogConsent(true)
    mod.capturePostHog('property_inquiry', { is_lead: true })
    expect(ph.init).not.toHaveBeenCalled()
    mod.firstMove()
    await settle()
    expect(ph.init).toHaveBeenCalledOnce()
    const [key, config] = ph.init.mock.calls[0] as unknown as [string, Record<string, unknown>]
    expect(key).toBe('phc_test')
    expect(config).toMatchObject({
      api_host: 'https://eu.i.posthog.com',
      capture_pageview: 'history_change',
      autocapture: false,
      disable_session_recording: true,
    })
    expect(ph.capture).toHaveBeenCalledWith('property_inquiry', { is_lead: true })
  })

  it('adds the locale to every event', async () => {
    const mod = await load()
    mod.setPostHogConsent(true)
    mod.firstMove()
    await settle()
    const config = ph.init.mock.calls[0][1] as unknown as {
      before_send: (e: { properties: Record<string, unknown> }) => { properties: Record<string, unknown> }
    }
    expect(config.before_send({ properties: { $current_url: 'x' } }).properties.locale).toBe('en')
  })

  it('opts out at once when consent is withdrawn', async () => {
    const mod = await load()
    mod.setPostHogConsent(true)
    mod.firstMove()
    await settle()
    mod.setPostHogConsent(false)
    expect(ph.opt_out_capturing).toHaveBeenCalled()
    mod.capturePostHog('click_telegram', {})
    expect(ph.capture).not.toHaveBeenCalledWith('click_telegram', {})
  })

  it('reports no flag variant until flags have loaded', async () => {
    const mod = await load()
    mod.setPostHogConsent(true)
    mod.firstMove()
    await settle()
    expect(mod.getFlagVariant('listing-contact-order')).toBeUndefined()
    const config = ph.init.mock.calls[0][1] as unknown as { loaded: (p: typeof ph) => void }
    config.loaded(ph)
    const onFlags = ph.onFeatureFlags.mock.calls[0] as unknown as [() => void]
    const listener = vi.fn()
    mod.onFlagsChange(listener)
    onFlags[0]()
    expect(listener).toHaveBeenCalledOnce()
    expect(mod.getFlagVariant('listing-contact-order')).toBe('messenger-first')
  })
})
