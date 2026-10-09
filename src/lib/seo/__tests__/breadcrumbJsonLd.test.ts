import { describe, expect, it } from 'vitest'
import { buildBreadcrumbJsonLd } from '../breadcrumbJsonLd'

type List = { itemListElement: Array<{ position: number; name: string; item?: string }> }

describe('breadcrumb JSON-LD', () => {
  it('gives every crumb but the last an absolute item URL', () => {
    const list = buildBreadcrumbJsonLd(
      [{ name: 'Home', url: '/en' }, { name: 'Albania', url: '/en/sale' }, { name: 'Tirana', url: '/en/albania/tirana' }],
      'https://www.domlivo.com/'
    ) as List
    expect(list.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.domlivo.com/en' },
      { '@type': 'ListItem', position: 2, name: 'Albania', item: 'https://www.domlivo.com/en/sale' },
      { '@type': 'ListItem', position: 3, name: 'Tirana', item: 'https://www.domlivo.com/en/albania/tirana' },
    ])
  })

  it('drops a middle crumb without a URL instead of emitting it without item', () => {
    const list = buildBreadcrumbJsonLd(
      [{ name: 'Home', url: '/en' }, { name: 'Durrës' }, { name: 'Plazh', url: '/en/albania/durres/plazh' }],
      'https://www.domlivo.com'
    ) as List
    expect(list.itemListElement.map((i) => [i.position, i.name, Boolean(i.item)])).toEqual([
      [1, 'Home', true],
      [2, 'Plazh', true],
    ])
  })

  it('allows the last crumb to have no URL', () => {
    const list = buildBreadcrumbJsonLd([{ name: 'Home', url: '/en' }, { name: 'This page' }], 'https://www.domlivo.com') as List
    expect(list.itemListElement[1]).toEqual({ '@type': 'ListItem', position: 2, name: 'This page' })
  })
})
