import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const landings = vi.hoisted(() => ({
  rows: [] as Array<{ path: string; lastModified?: Date; locales: string[] }>,
}))

vi.mock('@/lib/sanity/client', () => ({
  fetchAllAgentSlugsForSitemap: async () => [],
  fetchAllLandingPathsForSitemap: async () => landings.rows,
}))

import { GET } from '@/app/sitemap-static.xml/route'

async function locs(): Promise<string[]> {
  const res = await GET()
  const xml = await res.text()
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
}

describe('sitemap-static: locale-scoped landings', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_ENABLE_INDEXING', 'true')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://domlivo.com')
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    landings.rows = []
  })

  it('lists a landing restricted to one locale under that locale only', async () => {
    landings.rows = [{ path: 'nieruchomosci-albania-nad-morzem', locales: ['pl'] }]
    const urls = (await locs()).filter((u) => u.endsWith('/nieruchomosci-albania-nad-morzem'))
    expect(urls).toEqual(['https://domlivo.com/pl/nieruchomosci-albania-nad-morzem'])
  })

  it('lists a landing restricted to two locales under both', async () => {
    landings.rows = [{ path: 'kupit-kvartiru-v-albanii', locales: ['ru', 'uk'] }]
    const urls = (await locs()).filter((u) => u.endsWith('/kupit-kvartiru-v-albanii'))
    expect(urls.sort()).toEqual([
      'https://domlivo.com/ru/kupit-kvartiru-v-albanii',
      'https://domlivo.com/uk/kupit-kvartiru-v-albanii',
    ])
  })

  it('keeps an unscoped landing in every locale', async () => {
    landings.rows = [{ path: 'for-realtors', locales: [] }]
    const urls = (await locs()).filter((u) => u.endsWith('/for-realtors'))
    expect(urls).toHaveLength(7)
  })
})
