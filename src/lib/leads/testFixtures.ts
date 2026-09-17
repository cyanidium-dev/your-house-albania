import type { LeadContext } from './context'

/** A realistic context: arrived from Google, first came via Instagram a week earlier. */
export function sampleContext(overrides: Partial<LeadContext> = {}): LeadContext {
  return {
    firstTouch: {
      source: 'instagram',
      medium: 'social',
      channel: 'social',
      hasGclid: false,
      referrerHost: 'l.instagram.com',
      landingPage: '/ru',
      at: '2026-09-10T08:15:00.000Z',
    },
    session: {
      source: 'google',
      medium: 'organic',
      channel: 'organic_search',
      hasGclid: false,
      referrerHost: 'google.com',
      landingPage: '/ru/albania/durres/apartments',
      at: '2026-09-17T10:00:00.000Z',
    },
    pagesViewed: [
      { path: '/ru/albania/durres/apartments', title: 'Квартиры в Дурресе' },
      { path: '/ru/property/sea-view-apartment-durres', title: 'Квартира с видом на море' },
      { path: '/ru/property/studio-plazh', title: 'Студия Пляж' },
    ],
    pagesViewedCount: 3,
    propertySlugsViewed: ['sea-view-apartment-durres', 'studio-plazh'],
    timeOnSiteSec: 275,
    currentPage: '/ru/property/studio-plazh',
    device: 'mobile',
    language: 'ru-RU',
    locale: 'ru',
    internal: false,
    ...overrides,
  }
}
