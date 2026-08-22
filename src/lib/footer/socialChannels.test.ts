import { describe, expect, it } from 'vitest'
import { contactLabelKey, partitionSocialLinks } from './socialChannels'

const SOCIALS = [
  { platform: 'Facebook', url: 'https://facebook.com/domlivo' },
  { platform: 'Instagram', url: 'https://instagram.com/domlivo' },
]

describe('partitionSocialLinks', () => {
  it('splits contact and social channels', () => {
    const { contact, social } = partitionSocialLinks([
      ...SOCIALS.map((s) => ({ ...s, channel: 'social' })),
      { platform: 'Telegram', url: 'https://t.me/domlivobot', channel: 'contact' },
      { platform: 'WhatsApp', url: 'https://wa.me/domlivobot', channel: 'contact' },
    ])
    expect(contact).toEqual([
      { platform: 'Telegram', url: 'https://t.me/domlivobot' },
      { platform: 'WhatsApp', url: 'https://wa.me/domlivobot' },
    ])
    expect(social).toEqual(SOCIALS)
  })

  it('treats a missing channel as social (schema default)', () => {
    const { contact, social } = partitionSocialLinks([{ platform: 'Youtube', url: 'https://youtube.com' }])
    expect(contact).toEqual([])
    expect(social).toEqual([{ platform: 'Youtube', url: 'https://youtube.com' }])
  })

  it('drops entries missing a platform or url, and trims', () => {
    const { social } = partitionSocialLinks([
      { platform: '  ', url: 'https://x.test' },
      { platform: 'X', url: '   ' },
      { platform: ' X ', url: ' https://x.test ' },
    ])
    expect(social).toEqual([{ platform: 'X', url: 'https://x.test' }])
  })

  it('handles absent input', () => {
    expect(partitionSocialLinks(undefined)).toEqual({ contact: [], social: [] })
  })
})

describe('contactLabelKey', () => {
  it('maps a platform to its translation key', () => {
    expect(contactLabelKey('Telegram')).toBe('contacts.telegram')
    expect(contactLabelKey(' WhatsApp ')).toBe('contacts.whatsapp')
  })
})
