import { describe, expect, it } from 'vitest'
import {
  botLocale,
  escapeHtml,
  formatMessageHeader,
  formatPropertyCard,
  formatStartForTeam,
  userIdFromMarker,
  type BotTexts,
} from './format'

const texts: BotTexts = {
  greeting: 'Здравствуйте, {name}! Это Domlivo — недвижимость в Албании.',
  greetingNoName: 'Здравствуйте! Это Domlivo — недвижимость в Албании.',
  aboutProperty: 'Вы спрашиваете об этом объекте:',
  askProperty: '…',
  askGeneral: '…',
  shareContact: '📱',
  openListing: 'Открыть на Domlivo',
  priceOnRequest: 'Цена по запросу',
  contactReceived: '…',
}

const anna = { id: 123456789, first_name: 'Anna <script>', username: 'anna_k', language_code: 'ru' }

describe('botLocale', () => {
  it('prefers the site language, then the app language, then English', () => {
    expect(botLocale('it', 'ru')).toBe('it')
    expect(botLocale(null, 'uk')).toBe('uk')
    expect(botLocale(undefined, 'de-AT')).toBe('de')
    expect(botLocale('xx', 'fr')).toBe('en')
  })
})

describe('team messages', () => {
  it('a Start names who, the language, the listing, and ends with the reply marker', () => {
    const text = formatStartForTeam({
      user: anna,
      locale: 'ru',
      siteLocale: 'ru',
      placement: 'property',
      property: { slug: 'flat', title: 'Квартира & вид', price: '120 000 €', url: 'https://www.domlivo.com/ru/property/flat' },
    })
    expect(text).toContain('Anna &lt;script&gt;')
    expect(text).toContain('(@anna_k)')
    expect(text).toContain('Язык: RU (сайт), Telegram: ru')
    expect(text).toContain('Где: страница объекта')
    expect(text).toContain('<b>Квартира &amp; вид</b>, 120 000 €')
    expect(text).toContain('https://t.me/anna_k')
    expect(userIdFromMarker(text)).toBe(123456789)
  })

  it('a visitor message header is "{name}, {locale}, объект {title}"', () => {
    const header = formatMessageHeader({ user: anna, locale: 'ru', propertyTitle: 'Вилла' })
    expect(header).toContain(', RU, объект Вилла')
    expect(userIdFromMarker(header)).toBe(123456789)
  })

  it('reads no marker from an ordinary message', () => {
    expect(userIdFromMarker('Новый лид, звоните')).toBeNull()
    expect(userIdFromMarker(undefined)).toBeNull()
  })
})

describe('the visitor card', () => {
  it('greets by first name and escapes it once', () => {
    const card = formatPropertyCard(texts, anna, { slug: 'f', title: 'Flat', price: '', url: 'https://x' })
    expect(card.startsWith('Здравствуйте, Anna &lt;script&gt;!')).toBe(true)
    expect(card).toContain('<b>Flat</b>')
    expect(card).toContain('Цена по запросу')
  })
})

describe('escapeHtml', () => {
  it('escapes the three characters Telegram HTML needs', () => {
    expect(escapeHtml('a < b & c > d')).toBe('a &lt; b &amp; c &gt; d')
  })
})
