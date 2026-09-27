import { describe, expect, it } from 'vitest'
import { FOOTER_STABLE_NAV_ITEMS } from './footerNavConfig'
import { PRIMARY_NAV_ITEMS, orderMenuCities } from './navConfig'

describe('primary navigation', () => {
  it('has no realtor section and no rental deal types', () => {
    const keys = PRIMARY_NAV_ITEMS.map((i) => i.key)
    expect(keys).toEqual(['buy', 'guides', 'blog', 'about', 'contacts'])
    expect(FOOTER_STABLE_NAV_ITEMS.map((i) => i.href)).not.toContain('/for-realtors')
    expect(FOOTER_STABLE_NAV_ITEMS.map((i) => i.href)).not.toContain('/investment/sale')
  })

  it('keeps the listing-a-property scenario reachable from the footer', () => {
    expect(FOOTER_STABLE_NAV_ITEMS.find((i) => i.key === 'addProperty')?.href).toBe('/contacts#add-property')
  })
})

describe('orderMenuCities', () => {
  const cms = [
    { slug: 'durres' },
    { slug: 'sarande' },
    { slug: 'vlore' },
    { slug: 'tirana' },
    { slug: 'shengjin' },
  ]

  it('pins Durrës and Tirana first, then keeps the CMS order', () => {
    expect(orderMenuCities(cms, 6).map((c) => c.slug)).toEqual(['durres', 'tirana', 'sarande', 'vlore', 'shengjin'])
  })

  it('cuts at the limit and skips pinned cities that are missing', () => {
    expect(orderMenuCities([{ slug: 'sarande' }, { slug: 'Durres' }], 1).map((c) => c.slug)).toEqual(['Durres'])
    expect(orderMenuCities([{ slug: 'sarande' }], 3).map((c) => c.slug)).toEqual(['sarande'])
  })
})
