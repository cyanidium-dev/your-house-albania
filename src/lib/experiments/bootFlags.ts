/**
 * Experiments that change the layout at the top of a page (E002-E004, see
 * docs/experiments). E001 reads its flag when PostHog arrives, after the
 * visitor's first move; for a block in the first screen that would mean the
 * page jumps under the visitor's thumb. These flags are applied before the
 * first paint instead, from the values PostHog stored on an earlier page.
 *
 * How it works:
 * - PostHog keeps the visitor's flags in `localStorage["ph_<key>_posthog"]`
 *   under `$enabled_feature_flags`. That key exists only after the visitor
 *   granted analytics consent and PostHog loaded once (see `posthog.ts`).
 * - `EXPERIMENT_BOOT_SCRIPT` runs at the start of `<body>`, reads those values
 *   and sets `data-x-<flag>="<variant>"` on `<html>`. Components style the
 *   variant with `[[data-x-<flag>=<variant>]_&]:…`; without the attribute
 *   they render the control.
 * - So the first page of a first visit is always the control, and exposure is
 *   recorded (`ExperimentExposure`) only on pages where the attribute was set
 *   at load: a visitor is never counted in a variant they did not see.
 */

export type BootFlag = {
  key: string
  variants: readonly string[]
}

export const CATALOG_COMPACT_HEAD: BootFlag = { key: 'catalog-mobile-compact-head', variants: ['control', 'compact'] }
export const LISTING_PHOTO_FIRST: BootFlag = { key: 'e003-listing-photo-first-on-phones', variants: ['control', 'photo-first'] }
export const CARD_MARKET_BADGE: BootFlag = { key: 'e004-cards-without-above-market-label', variants: ['control', 'no-above'] }

export const BOOT_FLAGS: readonly BootFlag[] = [CATALOG_COMPACT_HEAD, LISTING_PHOTO_FIRST, CARD_MARKET_BADGE]

/** The `<html>` attribute that carries a flag's variant. */
export function bootFlagAttribute(key: string): string {
  return `data-x-${key}`
}

/** PostHog's persistence key for a project token, as posthog-js builds it. */
export function posthogStorageKey(token: string): string {
  return `ph_${token.replace(/\+/g, 'PL').replace(/\//g, 'SL').replace(/=/g, 'EQ')}_posthog`
}

/** The inline script; empty without a PostHog token. */
export function experimentBootScript(token: string, flags: readonly BootFlag[] = BOOT_FLAGS): string {
  if (!token || flags.length === 0) return ''
  const allowed = Object.fromEntries(flags.map((f) => [f.key, f.variants]))
  return `(function(){try{var s=localStorage.getItem(${JSON.stringify(posthogStorageKey(token))});if(!s)return;var f=JSON.parse(s).$enabled_feature_flags||{};var a=${JSON.stringify(allowed)};for(var k in a){var v=f[k];if(typeof v==="string"&&a[k].indexOf(v)>=0)document.documentElement.setAttribute("data-x-"+k,v)}}catch(e){}})();`
}

/** The variant applied at load, `null` when this page shows the control by default. */
export function bootVariant(key: string): string | null {
  if (typeof document === 'undefined') return null
  return document.documentElement.getAttribute(bootFlagAttribute(key))
}
