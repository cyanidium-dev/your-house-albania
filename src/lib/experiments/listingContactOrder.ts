/**
 * Experiment E001: the order of the two contact controls on a listing page.
 * See docs/experiments/001-listing-contact-order.md for the hypothesis,
 * metric and review date.
 *
 * The variant comes from the PostHog multivariate flag below. Anyone PostHog
 * has not bucketed (no analytics consent, flags still loading, PostHog off,
 * flag deleted) sees the control, which is the order the site had before.
 */

export const LISTING_CONTACT_ORDER_FLAG = 'listing-contact-order'

/** `control`: the inquiry form button first. `messenger-first`: WhatsApp/Telegram first. */
export const LISTING_CONTACT_ORDER_VARIANTS = ['control', 'messenger-first'] as const

export type ListingContactOrder = 'form-first' | 'messenger-first'

export function contactOrderFromFlag(value: string | undefined): ListingContactOrder {
  return value === 'messenger-first' ? 'messenger-first' : 'form-first'
}
