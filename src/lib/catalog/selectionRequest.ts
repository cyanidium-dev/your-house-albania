/**
 * "We'll send a selection by your criteria" (catalogue, from page 2): the
 * filters the visitor is browsing with, twice — as short localised chips they
 * can check, and as a stable English block for the operator, which goes into
 * the lead's `contact.message` and the Telegram message. Pure, so the server
 * builds both and the client only shows them.
 */

export type SelectionCriteriaInput = {
  city?: { slug: string; label?: string }
  district?: { slug: string; label?: string }
  type?: { slug: string; label?: string }
  deal?: { value: string; label?: string }
  minPrice?: number
  maxPrice?: number
  beds?: number
  bedsExact?: number
}

export type SelectionCriteria = {
  /** Localised, in reading order; empty when the visitor set no filter. */
  chips: string[]
  /** For the operator; never empty. */
  message: string
}

type Labels = {
  /** Formats an amount in EUR for the visitor's locale. */
  money: (amount: number) => string
  priceRange: (from: string, to: string) => string
  priceUpTo: (amount: string) => string
  priceOver: (amount: string) => string
  bedsFrom: (n: number) => string
  bedsExact: (n: number) => string
}

const eur = (n: number) => `${Math.round(n).toLocaleString('en-US')} EUR`

const named = (v: { slug: string; label?: string }) => (v.label && v.label !== v.slug ? `${v.label} (${v.slug})` : v.slug)

export function buildSelectionCriteria(input: SelectionCriteriaInput, labels: Labels): SelectionCriteria {
  const min = typeof input.minPrice === 'number' && input.minPrice > 0 ? input.minPrice : undefined
  const max = typeof input.maxPrice === 'number' && input.maxPrice > 0 ? input.maxPrice : undefined
  const bedsExact = typeof input.bedsExact === 'number' && input.bedsExact > 0 ? input.bedsExact : undefined
  const beds = !bedsExact && typeof input.beds === 'number' && input.beds > 0 ? input.beds : undefined

  const chips: string[] = []
  const lines: string[] = ['Catalogue selection request']
  if (input.city) {
    chips.push(input.city.label || input.city.slug)
    lines.push(`City: ${named(input.city)}`)
  }
  if (input.district) {
    chips.push(input.district.label || input.district.slug)
    lines.push(`District: ${named(input.district)}`)
  }
  if (input.type) {
    chips.push(input.type.label || input.type.slug)
    lines.push(`Type: ${named(input.type)}`)
  }
  if (input.deal) {
    chips.push(input.deal.label || input.deal.value)
    lines.push(`Deal: ${input.deal.value}`)
  }
  if (min && max) {
    chips.push(labels.priceRange(labels.money(min), labels.money(max)))
    lines.push(`Price: ${eur(min)} – ${eur(max)}`)
  } else if (max) {
    chips.push(labels.priceUpTo(labels.money(max)))
    lines.push(`Price: up to ${eur(max)}`)
  } else if (min) {
    chips.push(labels.priceOver(labels.money(min)))
    lines.push(`Price: from ${eur(min)}`)
  }
  if (bedsExact) {
    chips.push(labels.bedsExact(bedsExact))
    lines.push(`Bedrooms: ${bedsExact}`)
  } else if (beds) {
    chips.push(labels.bedsFrom(beds))
    lines.push(`Bedrooms: ${beds}+`)
  }
  if (lines.length === 1) lines.push('No filters set')
  return { chips, message: lines.join('\n') }
}

/** Whether the selection block belongs on the page: from page 2, reached or loaded. */
export function showsSelectionBlock(currentPage: number, shownItems: number, pageSize: number): boolean {
  return currentPage >= 2 || shownItems > pageSize
}
