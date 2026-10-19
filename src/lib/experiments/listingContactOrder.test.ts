import { describe, expect, it } from 'vitest'
import { contactOrderFromFlag, LISTING_CONTACT_ORDER_VARIANTS } from './listingContactOrder'

describe('contactOrderFromFlag', () => {
  it('shows messengers first only in the test variant', () => {
    expect(contactOrderFromFlag('messenger-first')).toBe('messenger-first')
  })

  it('falls back to the control for everyone PostHog has not bucketed', () => {
    expect(contactOrderFromFlag('control')).toBe('form-first')
    expect(contactOrderFromFlag(undefined)).toBe('form-first')
    expect(contactOrderFromFlag('something-else')).toBe('form-first')
  })

  it('keeps control as the first variant (the flag key PostHog experiments expect)', () => {
    expect(LISTING_CONTACT_ORDER_VARIANTS[0]).toBe('control')
  })
})
