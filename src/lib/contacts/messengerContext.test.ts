import { describe, expect, it } from 'vitest'
import { SHORTLIST_MAX, shortlistMessengerContext, type MessengerTranslator } from './messengerContext'

const t: MessengerTranslator = (key, values) => `${key}|${values?.list ?? ''}`

describe('shortlistMessengerContext', () => {
  it('puts every listing on its own line with price and address', () => {
    const ctx = shortlistMessengerContext(t, {
      locale: 'de',
      items: [
        { title: ' Wohnung 1+1, Golem ', price: '89.000 €', url: 'https://www.domlivo.com/de/property/a' },
        { title: 'Haus, Golem', url: 'https://www.domlivo.com/de/property/b' },
      ],
    })
    expect(ctx.whatsappText).toBe(
      'whatsappText.shortlist|- Wohnung 1+1, Golem, 89.000 €: https://www.domlivo.com/de/property/a\n- Haus, Golem: https://www.domlivo.com/de/property/b',
    )
    expect(ctx.telegramStart).toBe('g_de_favorites')
  })

  it(`names at most ${SHORTLIST_MAX} listings`, () => {
    const items = Array.from({ length: SHORTLIST_MAX + 3 }, (_, i) => ({ title: `L${i}`, url: `https://x/${i}` }))
    const ctx = shortlistMessengerContext(t, { locale: 'en', items })
    expect(ctx.whatsappText?.split('\n')).toHaveLength(SHORTLIST_MAX)
  })
})
