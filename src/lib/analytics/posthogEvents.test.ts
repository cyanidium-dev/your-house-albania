import { describe, expect, it } from 'vitest'
import { toPostHogEvent } from './posthogEvents'

describe('toPostHogEvent', () => {
  it('names a form lead after its lead type and marks it as a lead', () => {
    expect(
      toPostHogEvent({
        event: 'generate_lead',
        lead_type: 'property_inquiry',
        placement: 'property',
        property_slug: 'flat-durres',
        channel: 'organic',
        source: 'google',
        landing_page: '/en/albania/durres',
        campaign: undefined,
      }),
    ).toEqual({
      name: 'property_inquiry',
      properties: {
        lead_type: 'property_inquiry',
        placement: 'property',
        property_slug: 'flat-durres',
        channel: 'organic',
        source: 'google',
        landing_page: '/en/albania/durres',
        is_lead: true,
      },
    })
    expect(toPostHogEvent({ event: 'generate_lead', lead_type: 'guide_download' })?.name).toBe('guide_download')
    expect(toPostHogEvent({ event: 'generate_lead', lead_type: 'contact_form' })?.name).toBe('contact_form')
  })

  it('drops the GA4-only duplicates of generate_lead', () => {
    expect(toPostHogEvent({ event: 'lead_submit', kind: 'property' })).toBeNull()
    expect(toPostHogEvent({ event: 'property_inquiry_submit', lead_type: 'property_inquiry' })).toBeNull()
    expect(toPostHogEvent({ event: 'contact_form_submit', lead_type: 'contact_form' })).toBeNull()
  })

  it('keeps contact clicks under their own name, as leads', () => {
    expect(toPostHogEvent({ event: 'click_whatsapp', lead_type: 'click_whatsapp', placement: 'property' })).toEqual({
      name: 'click_whatsapp',
      properties: { lead_type: 'click_whatsapp', placement: 'property', is_lead: true },
    })
    expect(toPostHogEvent({ event: 'click_telegram', placement: 'footer' })?.properties.is_lead).toBe(true)
  })

  it('passes other events through unchanged', () => {
    expect(toPostHogEvent({ event: 'property_view', slug: 'flat-durres', city: 'durres' })).toEqual({
      name: 'property_view',
      properties: { slug: 'flat-durres', city: 'durres' },
    })
  })
})
