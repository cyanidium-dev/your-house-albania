import { describe, expect, it } from 'vitest'
import { hasSiteTrust, mapSiteTrust } from './trustFromSiteSettings'

describe('mapSiteTrust', () => {
  it('maps nothing to nothing', () => {
    const t = mapSiteTrust(null, 'en')
    expect(t).toEqual({ phone: null, address: null, replyTime: null, officePhoto: null, testimonials: [] })
    expect(hasSiteTrust(t)).toBe(false)
  })

  it('drops the placeholder phone and incomplete reviews, keeps at most three', () => {
    const t = mapSiteTrust(
      {
        contactPhone: '+355 69 000 0000',
        companyAddress: '  ',
        replyTime: { en: 'We reply within 15 minutes', ru: 'Отвечаем за 15 минут' },
        officePhoto: { alt: 'Office', asset: { url: 'https://cdn.sanity.io/x.jpg' } },
        testimonials: [
          { _key: 'a', quote: { en: 'Great' }, author: 'Anna K.' },
          { _key: 'b', quote: { en: 'No author' } },
          { _key: 'c', quote: { en: 'Two' }, author: 'B.', context: { en: 'Durrës, 2026' } },
          { _key: 'd', quote: { en: 'Three' }, author: 'C.' },
          { _key: 'e', quote: { en: 'Four' }, author: 'D.' },
        ],
      },
      'ru',
    )
    expect(t.phone).toBeNull()
    expect(t.address).toBeNull()
    expect(t.replyTime).toBe('Отвечаем за 15 минут')
    expect(t.officePhoto).toEqual({ url: 'https://cdn.sanity.io/x.jpg', alt: 'Office' })
    expect(t.testimonials.map((x) => x.key)).toEqual(['a', 'c', 'd'])
    expect(hasSiteTrust(t)).toBe(true)
  })
})
