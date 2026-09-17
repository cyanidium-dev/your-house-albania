import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type FakeWindow = {
  dataLayer: Record<string, unknown>[]
  clarity: ReturnType<typeof vi.fn>
  location: { search: string }
  localStorage: Storage
}

function fakeStorage(): Storage {
  const m = new Map<string, string>()
  return {
    get length() {
      return m.size
    },
    clear: () => m.clear(),
    getItem: (k) => m.get(k) ?? null,
    key: (i) => [...m.keys()][i] ?? null,
    removeItem: (k) => void m.delete(k),
    setItem: (k, v) => void m.set(k, String(v)),
  }
}

async function load(search = '') {
  vi.resetModules()
  vi.stubEnv('NEXT_PUBLIC_ENABLE_ANALYTICS', 'true')
  const win: FakeWindow = {
    dataLayer: [],
    clarity: vi.fn(),
    location: { search },
    localStorage: fakeStorage(),
  }
  vi.stubGlobal('window', win)
  vi.stubGlobal('document', {})
  const mod = await import('./track')
  return { win, track: mod.track }
}

describe('track', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('pushes to the dataLayer and mirrors the event to Clarity', async () => {
    const { win, track } = await load()
    track({ event: 'click_whatsapp', lead_type: 'click_whatsapp', placement: 'footer', source: 'google' })
    expect(win.dataLayer).toHaveLength(1)
    expect(win.dataLayer[0]).toMatchObject({ event: 'click_whatsapp', placement: 'footer', source: 'google' })
    expect(win.clarity).toHaveBeenCalledWith('event', 'click_whatsapp')
    expect(win.clarity).toHaveBeenCalledWith('set', 'placement', 'footer')
  })

  it('resets lead parameters a previous lead left in the GTM model', async () => {
    const { win, track } = await load()
    track({ event: 'generate_lead', lead_type: 'contact_form' })
    const pushed = win.dataLayer[0]
    expect(Object.prototype.hasOwnProperty.call(pushed, 'property_slug')).toBe(true)
    expect(pushed.property_slug).toBeUndefined()
  })

  it('leaves older events untouched', async () => {
    const { win, track } = await load()
    track({ event: 'lead_submit', kind: 'general' })
    expect(win.dataLayer[0]).toEqual({ event: 'lead_submit', kind: 'general' })
  })

  it('marks internal traffic before the first event', async () => {
    const { win, track } = await load('?domlivo_internal=1')
    track({ event: 'search_submit', placement: 'hero', city: 'durres' })
    expect(win.dataLayer[0]).toEqual({ traffic_type: 'internal' })
    expect(win.dataLayer[1]).toMatchObject({ event: 'search_submit', traffic_type: 'internal' })
    expect(win.clarity).toHaveBeenCalledWith('set', 'internal', '1')
    expect(win.localStorage.getItem('domlivo:internal')).toBe('1')
  })

  it('does nothing when analytics is off', async () => {
    vi.resetModules()
    vi.stubEnv('NEXT_PUBLIC_ENABLE_ANALYTICS', 'false')
    const win = { dataLayer: [] as unknown[], clarity: vi.fn(), location: { search: '' } }
    vi.stubGlobal('window', win)
    const { track } = await import('./track')
    track({ event: 'click_phone' })
    expect(win.dataLayer).toHaveLength(0)
    expect(win.clarity).not.toHaveBeenCalled()
  })
})
