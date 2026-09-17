import { describe, expect, it } from 'vitest'
import { sampleContext } from '@/lib/leads/testFixtures'
import { formatAgentContactTelegramMessage } from '@/lib/notifications/agentContact/formatTelegramAgentContact'
import {
  appendLeadAnalytics,
  formatClickLeadTelegram,
  formatDuration,
  formatLeadAnalyticsBlock,
  withTestPrefix,
} from './formatLeadTelegram'

describe('formatDuration', () => {
  it('pads minutes and seconds', () => {
    expect(formatDuration(0)).toBe('00:00')
    expect(formatDuration(275)).toBe('04:35')
    expect(formatDuration(3725)).toBe('62:05')
    expect(formatDuration(Number.NaN)).toBe('00:00')
  })
})

describe('formatLeadAnalyticsBlock', () => {
  it('renders the full block', () => {
    expect(formatLeadAnalyticsBlock({ context: sampleContext(), country: 'DE' })).toBe(
      [
        '📊 Аналитика',
        'Источник: google / organic',
        'Канал: органический поиск',
        'Реферер: google.com',
        'Страница входа: /ru/albania/durres/apartments',
        'Первый визит: 10.09.2026, instagram / social',
        'Просмотрено страниц: 3',
        '• /ru/albania/durres/apartments',
        '• /ru/property/sea-view-apartment-durres',
        '• /ru/property/studio-plazh',
        'Смотрел объекты: sea-view-apartment-durres, studio-plazh',
        'Время на сайте: 04:35',
        'Страна: DE',
        'Устройство: телефон',
        'Язык: сайт RU, браузер ru-RU',
      ].join('\n')
    )
  })

  it('omits the first-visit source when it is the same as this visit', () => {
    const ctx = sampleContext()
    const block = formatLeadAnalyticsBlock({ context: { ...ctx, firstTouch: { ...ctx.session } } })
    expect(block).toContain('Первый визит: 17.09.2026\n')
  })

  it('lists only the last 8 pages of a long journey', () => {
    const pages = Array.from({ length: 12 }, (_, i) => ({ path: `/ru/p${i}`, title: '' }))
    const block = formatLeadAnalyticsBlock({
      context: sampleContext({ pagesViewed: pages, pagesViewedCount: 31 }),
    })
    expect(block).toContain('Просмотрено страниц: 31\nПоследние 8:\n• /ru/p4')
    expect(block).not.toContain('/ru/p3\n')
  })

  it('says so when there is no context', () => {
    expect(formatLeadAnalyticsBlock({ country: 'AL', locale: 'sq' })).toBe(
      [
        '📊 Аналитика',
        'Данных о визите нет (старая вкладка или браузер блокирует хранилище).',
        'Страна: AL',
        'Язык сайта: SQ',
      ].join('\n')
    )
  })

  it('shows campaign and gclid', () => {
    const ctx = sampleContext()
    const block = formatLeadAnalyticsBlock({
      context: {
        ...ctx,
        session: { ...ctx.session, source: 'google', medium: 'cpc', channel: 'paid_search', campaign: 'durres-sea', hasGclid: true },
      },
    })
    expect(block).toContain('Источник: google / cpc\nКампания: durres-sea\nКанал: платный поиск')
    expect(block).toContain('Клик Google Ads: да (gclid)')
  })
})

describe('form lead message', () => {
  it('keeps the existing message and appends analytics', () => {
    const base = formatAgentContactTelegramMessage({
      submissionKind: 'agent',
      agentSlug: 'unassigned',
      agentName: '—',
      locale: 'ru',
      location: undefined,
      propertyType: undefined,
      dealType: undefined,
      priceRangeLabel: '—',
      areaRangeLabel: '—',
      customerName: 'Иван',
      phone: '+49 151 0000000',
      email: 'ivan@example.com',
      message: 'Здравствуйте, квартира ещё продаётся?',
      propertySlug: 'studio-plazh',
      propertyTitle: 'Студия Пляж',
      propertyUrl: 'https://www.domlivo.com/ru/property/studio-plazh',
    })
    const text = appendLeadAnalytics(base, { context: sampleContext(), country: 'DE' })
    expect(text.startsWith('New property contact request\n')).toBe(true)
    expect(text).toContain('Message:\nЗдравствуйте, квартира ещё продаётся?\n\n📊 Аналитика\n')
  })

  it('prefixes internal traffic', () => {
    expect(withTestPrefix('New contact request', true)).toBe('[ТЕСТ] New contact request')
    expect(withTestPrefix('New contact request', false)).toBe('New contact request')
  })
})

describe('formatClickLeadTelegram', () => {
  it('renders a WhatsApp click on a listing', () => {
    const text = formatClickLeadTelegram({
      type: 'click_whatsapp',
      placement: 'property',
      context: sampleContext(),
      country: 'DE',
      property: {
        slug: 'studio-plazh',
        title: 'Студия Пляж',
        url: 'https://www.domlivo.com/ru/property/studio-plazh',
      },
    })
    expect(text.split('\n').slice(0, 7)).toEqual([
      '🟢 Лид кликнул по WhatsApp',
      '',
      'Где: страница объекта',
      'Страница: /ru/property/studio-plazh',
      'Объект: Студия Пляж (studio-plazh)',
      'https://www.domlivo.com/ru/property/studio-plazh',
      '',
    ])
    expect(text).toContain('📊 Аналитика\nИсточник: google / organic')
  })

  it('renders phone and email clicks, marks tests', () => {
    expect(
      formatClickLeadTelegram({ type: 'click_phone', placement: 'footer', context: sampleContext({ internal: true }) })
    ).toMatch(/^\[ТЕСТ\] 📞 Лид кликнул по телефону\n\nГде: подвал сайта\n/)
    expect(formatClickLeadTelegram({ type: 'click_email', placement: 'contact-page' })).toMatch(
      /^✉️ Лид кликнул по email\n\nГде: страница контактов\n\n📊 Аналитика\nДанных о визите нет/
    )
  })
})
