import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  finishMessengerHref,
  shareablePageUrl,
  telegramBotUsername,
  whatsAppNumberOf,
  whatsAppTextOf,
  whatsAppWebUrl,
  withWhatsAppText,
} from './messengerLinks'
import { messengerContext, messengerPriceLabel, type MessengerTranslator } from './messengerContext'
import { resolveMessengers } from './messengers'

/** The ru messages, formatted the way next-intl would. */
const RU: Record<string, string> = {
  'whatsappText.property': 'Здравствуйте! Интересует {title}, {price}: {url}',
  'whatsappText.propertyNoPrice': 'Здравствуйте! Интересует {title}: {url}',
  'whatsappText.general': 'Здравствуйте! Хочу подобрать недвижимость в Албании',
}
const t: MessengerTranslator = (key, values = {}) => RU[key].replace(/\{(\w+)\}/g, (_, k: string) => values[k] ?? '')

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('whatsAppNumberOf', () => {
  it.each([
    ['https://wa.me/355681234567', '355681234567'],
    ['https://wa.me/+355681234567?text=hi', '355681234567'],
    ['https://api.whatsapp.com/send?phone=355681234567', '355681234567'],
    ['https://web.whatsapp.com/send?phone=%2B355681234567', '355681234567'],
  ])('%s', (url, number) => {
    expect(whatsAppNumberOf(url)).toBe(number)
  })

  it.each(['https://wa.me/message/KPXIGD5DJISGO1', 'https://wa.me/', 'https://example.com/355681234567', 'nonsense'])(
    'no number in %s',
    (url) => {
      expect(whatsAppNumberOf(url)).toBeNull()
    },
  )
})

describe('withWhatsAppText', () => {
  it('prefills the message, encoded', () => {
    const url = withWhatsAppText('https://wa.me/355681234567', 'Здравствуйте! Интересует дом & сад: https://x.y/a?b=1')
    expect(url.startsWith('https://wa.me/355681234567?text=')).toBe(true)
    expect(whatsAppTextOf(url)).toBe('Здравствуйте! Интересует дом & сад: https://x.y/a?b=1')
  })

  it('leaves a Business short link alone without a number', () => {
    expect(withWhatsAppText('https://wa.me/message/KPXIGD5DJISGO1', 'hi')).toBe('https://wa.me/message/KPXIGD5DJISGO1')
  })

  it('writes to the configured number instead of the short link', () => {
    expect(withWhatsAppText('https://wa.me/message/KPXIGD5DJISGO1', 'hi', '355681234567')).toBe(
      'https://wa.me/355681234567?text=hi',
    )
  })
})

describe('whatsAppWebUrl', () => {
  it('carries number and text to WhatsApp Web', () => {
    expect(whatsAppWebUrl('https://wa.me/355681234567?text=hi%20there')).toBe(
      'https://web.whatsapp.com/send?phone=355681234567&text=hi%20there',
    )
    expect(whatsAppWebUrl('https://wa.me/message/KPXIGD5DJISGO1')).toBeNull()
  })
})

describe('telegramBotUsername', () => {
  it('accepts a plain or @-prefixed username', () => {
    expect(telegramBotUsername('@DomlivoBot')).toBe('DomlivoBot')
    expect(telegramBotUsername(' domlivo_help_bot ')).toBe('domlivo_help_bot')
  })
  it.each(['', 'ab', '1domlivo', 'domlivo bot'])('rejects %s', (v) => {
    expect(telegramBotUsername(v)).toBeNull()
  })
})

describe('messengerContext', () => {
  const property = {
    title: 'Квартира 1+1 в Големе',
    price: '120 000 €',
    url: 'https://www.domlivo.com/ru/property/kvartira-1-1-golem-durres-2',
    slug: 'apartamente-ne-shitje-oriental-residence-golem-durres-19621',
    id: 'property-getal-19621',
  }

  it('names the listing, its price and its address', () => {
    const ctx = messengerContext(t, { locale: 'ru', placement: 'property', property })
    expect(ctx.whatsappText).toBe(
      'Здравствуйте! Интересует Квартира 1+1 в Големе, 120 000 €: https://www.domlivo.com/ru/property/kvartira-1-1-golem-durres-2',
    )
    expect(ctx.telegramStart).toBe('p_ru_apartamente-ne-shitje-oriental-residence-golem-durres-19621')
  })

  it('drops the price when the seller named none', () => {
    const ctx = messengerContext(t, { locale: 'ru', placement: 'property', property: { ...property, price: '' } })
    expect(ctx.whatsappText).toBe(`Здравствуйте! Интересует Квартира 1+1 в Големе: ${property.url}`)
  })

  it('general places get the general message and their placement', () => {
    const ctx = messengerContext(t, {
      locale: 'ru',
      placement: 'contact-page',
      pageUrl: 'https://www.domlivo.com/ru/contacts',
    })
    expect(ctx.whatsappText).toBe('Здравствуйте! Хочу подобрать недвижимость в Албании\nhttps://www.domlivo.com/ru/contacts')
    expect(ctx.telegramStart).toBe('g_ru_contact-page')
  })
})

describe('messengerPriceLabel', () => {
  it('formats per locale and tells a rate from a total', () => {
    expect(messengerPriceLabel({ price: 120000, locale: 'en' })).toBe('€120,000')
    expect(messengerPriceLabel({ price: 0, locale: 'en' })).toBe('')
    expect(
      messengerPriceLabel({ price: 1500, priceUnit: 'per-sqm', locale: 'en', perSqm: (a) => `from ${a} / m²` }),
    ).toBe('from €1,500 / m²')
  })
})

describe('resolveMessengers with a context', () => {
  const links = [
    { platform: 'WhatsApp', url: 'https://wa.me/355681234567', channel: 'contact' },
    { platform: 'Telegram', url: 'https://t.me/real_estate_al', channel: 'contact' },
  ]
  const ctx = { whatsappText: 'Hello', telegramStart: 'g_en_footer' }

  it('keeps the old Telegram link when the bot is not configured', () => {
    vi.stubEnv('NEXT_PUBLIC_TELEGRAM_BOT_USERNAME', '')
    vi.stubEnv('NEXT_PUBLIC_WHATSAPP_NUMBER', '')
    const [wa, tg] = resolveMessengers(links, 'en', ctx)
    expect(wa).toEqual({ key: 'whatsapp', url: 'https://wa.me/355681234567?text=Hello' })
    expect(tg).toEqual({ key: 'telegram', url: 'https://t.me/real_estate_al' })
  })

  it('points Telegram at the bot and WhatsApp at the configured number', () => {
    vi.stubEnv('NEXT_PUBLIC_TELEGRAM_BOT_USERNAME', 'DomlivoBot')
    vi.stubEnv('NEXT_PUBLIC_WHATSAPP_NUMBER', '+355 69 000 0000')
    const [tg, wa] = resolveMessengers(links, 'ru', ctx)
    expect(tg.url).toBe('https://t.me/DomlivoBot?start=g_en_footer')
    expect(wa.url).toBe('https://wa.me/355690000000?text=Hello')
  })

  it('changes nothing without a context', () => {
    vi.stubEnv('NEXT_PUBLIC_TELEGRAM_BOT_USERNAME', 'DomlivoBot')
    expect(resolveMessengers(links, 'en').map((m) => m.url)).toEqual(links.map((l) => l.url))
  })
})

describe('finishMessengerHref (the sheet, at the click)', () => {
  const base = {
    locale: 'it',
    placement: 'footer',
    pageUrl: 'https://www.domlivo.com/it/blog/x',
    generalText: 'Buongiorno! Vorrei trovare un immobile in Albania',
    botUsername: 'DomlivoBot',
    whatsAppNumber: '355681234567',
  }

  it('gives a bare footer link the general message and the page', () => {
    const href = finishMessengerHref({ ...base, key: 'whatsapp', href: 'https://wa.me/message/KPXIGD5DJISGO1' })
    expect(whatsAppTextOf(href)).toBe('Buongiorno! Vorrei trovare un immobile in Albania\nhttps://www.domlivo.com/it/blog/x')
    expect(href.startsWith('https://wa.me/355681234567?text=')).toBe(true)
  })

  it('keeps a listing message as the server wrote it', () => {
    const server =
      'https://wa.me/355681234567?text=' + encodeURIComponent('Mi interessa X: https://www.domlivo.com/it/property/x')
    expect(finishMessengerHref({ ...base, key: 'whatsapp', href: server })).toBe(server)
  })

  it('adds the page to a general message without one', () => {
    const href = finishMessengerHref({ ...base, key: 'whatsapp', href: 'https://wa.me/355681234567?text=Ciao' })
    expect(whatsAppTextOf(href)).toBe('Ciao\nhttps://www.domlivo.com/it/blog/x')
  })

  it('leaves an owner link without a message when asked (plain)', () => {
    const href = 'https://wa.me/message/KPXIGD5DJISGO1'
    expect(finishMessengerHref({ ...base, key: 'whatsapp', href, generalText: '' })).toBe(href)
  })

  it('points any Telegram link at the bot with the real placement', () => {
    expect(finishMessengerHref({ ...base, key: 'telegram', href: 'https://t.me/real_estate_al' })).toBe(
      'https://t.me/DomlivoBot?start=g_it_footer',
    )
    expect(finishMessengerHref({ ...base, key: 'telegram', href: 'https://t.me/DomlivoBot?start=g_it_page' })).toBe(
      'https://t.me/DomlivoBot?start=g_it_footer',
    )
  })

  it('uses the listing in the address on a property page', () => {
    expect(
      finishMessengerHref({ ...base, key: 'telegram', href: 'https://t.me/real_estate_al', propertySlug: 'villa-in-vlore' }),
    ).toBe('https://t.me/DomlivoBot?start=p_it_villa-in-vlore')
  })

  it('keeps a listing payload, and the old link without a bot', () => {
    const listing = 'https://t.me/DomlivoBot?start=p_it_villa'
    expect(finishMessengerHref({ ...base, key: 'telegram', href: listing })).toBe(listing)
    expect(
      finishMessengerHref({ ...base, key: 'telegram', href: 'https://t.me/real_estate_al', botUsername: null }),
    ).toBe('https://t.me/real_estate_al')
  })
})

describe('shareablePageUrl', () => {
  it('drops the query and the fragment', () => {
    expect(shareablePageUrl('https://www.domlivo.com/en/catalog?city=durres#map')).toBe(
      'https://www.domlivo.com/en/catalog',
    )
  })
})
