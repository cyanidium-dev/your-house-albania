/**
 * Search and filter events. Named events of our own, because Clarity's
 * automatic "Submit form" counts these forms and lead forms alike.
 */

import { track, type AnalyticsEvent } from './track'

type FilterApplyEvent = Extract<AnalyticsEvent, { event: 'filter_apply' }>

/** Same filters applied again within this window (a double submit, a re-render) count once. */
const FILTER_DEDUPE_MS = 3000

let lastFilterSignature = ''
let lastFilterAt = 0

function isSet(v: string | undefined): v is string {
  return !!v && v !== 'any'
}

/** Drops "any" and empty values so reports show only what was actually chosen. */
function chosen<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {}
  for (const [k, v] of Object.entries(obj) as [keyof T, T[keyof T]][]) {
    if (typeof v === 'string' ? isSet(v) : v !== undefined) out[k] = v
  }
  return out
}

export function trackSearchSubmit(params: { city?: string; propertyType?: string; deal?: string }): void {
  track({
    event: 'search_submit',
    placement: 'hero',
    ...chosen({ city: params.city, property_type: params.propertyType, deal: params.deal }),
  })
}

export function trackFilterApply(params: Omit<FilterApplyEvent, 'event'>): void {
  const payload = { event: 'filter_apply' as const, ...chosen(params), placement: params.placement }
  const signature = JSON.stringify(payload)
  const now = Date.now()
  if (signature === lastFilterSignature && now - lastFilterAt < FILTER_DEDUPE_MS) return
  lastFilterSignature = signature
  lastFilterAt = now
  track(payload)
}
