import { describe, expect, it } from 'vitest'
import { buildGuidesMenu } from './guidesMenu'

const labels = {
  investing: 'Investing',
  buying: 'Buying & legal',
  market: 'Prices & market',
  places: 'Cities & districts',
  living: 'Living in Albania',
  comparisons: 'Comparisons',
}

const posts = [
  { slug: 'a', title: { en: 'A', ru: 'А' }, publishedAt: '2026-10-01', categories: ['market-trends'] },
  { slug: 'b', title: { en: 'B' }, publishedAt: '2026-09-29', categories: ['market-trends', 'investment-guides'] },
  { slug: 'c', title: { en: 'C', ru: 'В' }, publishedAt: '2026-09-20', categories: ['legal-and-taxes', null] },
  { slug: 'd', title: { en: 'D', ru: 'Г' }, publishedAt: '2026-03-08', categories: ['guides'] },
  { slug: 'e', title: { en: 'E', ru: 'Д' }, publishedAt: '2026-03-01', categories: [] },
]

describe('buildGuidesMenu', () => {
  it('counts each topic over its categories and drops the empty ones', () => {
    const menu = buildGuidesMenu({ locale: 'en', posts, guides: [], labels })
    expect(menu.topics.map((t) => [t.key, t.count])).toEqual([
      ['investing', 1],
      ['buying', 2],
      ['market', 2],
    ])
    expect(menu.topics[0].href).toBe('/en/blog?topic=investing')
  })

  it('adds comparisons from the guide landings, linking to their section', () => {
    const menu = buildGuidesMenu({
      locale: 'de',
      posts: [],
      guides: [{ slug: 'durres-vs-vlore' }, { slug: 'buying' }, { slug: 'golem-vs-plazh' }],
      labels,
    })
    expect(menu.topics).toEqual([
      expect.objectContaining({ key: 'comparisons', count: 2, href: '/de/guides#comparisons' }),
    ])
  })

  it('lists the newest articles that have a title in the locale', () => {
    const menu = buildGuidesMenu({ locale: 'ru', posts, guides: [], labels })
    expect(menu.latest.map((p) => p.key)).toEqual(['a', 'c', 'd'])
    expect(menu.latest[0]).toMatchObject({ title: 'А', href: '/ru/blog/a' })
    expect(menu.allGuidesHref).toBe('/ru/guides')
    expect(menu.allArticlesHref).toBe('/ru/blog')
  })
})
