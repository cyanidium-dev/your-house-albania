import type { CurrencyCode } from './types'
import { CURRENCY_SYMBOL_FALLBACK_MAP } from './currencySymbolMap'

/**
 * Number and money formatting without `Intl`.
 *
 * Prices are rendered on the server and hydrated in the browser, and the two
 * runtimes do not share ICU data: Node printed "1662 €" for Albanian where a
 * Chromium without the `sq` locale printed "1 662 EUR", and every page with
 * a price threw React #418 (hydration mismatch) and re-rendered its price
 * tree on the client (found 2026-09-27 on /sq, /sq/albania/sarande and
 * /en/albania/sarande). A formatter that owns its separators and symbols
 * gives the same string everywhere, in every browser version.
 *
 * The rules follow CLDR for the site's locales: English groups with a comma
 * and puts the symbol first; German and Italian group with a full stop;
 * Russian, Ukrainian, Polish and Albanian group with a no-break space; the
 * symbol follows the amount after a no-break space in every locale but
 * English. Italian, Polish and Albanian do not group a four-digit number.
 */
type LocaleRule = {
  group: string
  decimal: string
  /** Digits a number needs before it is grouped at all (CLDR minimumGroupingDigits). */
  minGroupingDigits: 1 | 2
  symbolFirst: boolean
}

const NBSP = ' '

const RULES: Record<string, LocaleRule> = {
  en: { group: ',', decimal: '.', minGroupingDigits: 1, symbolFirst: true },
  de: { group: '.', decimal: ',', minGroupingDigits: 1, symbolFirst: false },
  it: { group: '.', decimal: ',', minGroupingDigits: 2, symbolFirst: false },
  ru: { group: NBSP, decimal: ',', minGroupingDigits: 1, symbolFirst: false },
  uk: { group: NBSP, decimal: ',', minGroupingDigits: 1, symbolFirst: false },
  pl: { group: NBSP, decimal: ',', minGroupingDigits: 2, symbolFirst: false },
  sq: { group: NBSP, decimal: ',', minGroupingDigits: 2, symbolFirst: false },
}

function ruleFor(locale: string | undefined): LocaleRule {
  const key = (locale ?? 'en').toLowerCase().split(/[-_]/)[0]
  return RULES[key] ?? RULES.en
}

/** `1234567.8` → `1,234,567.8` in the locale's separators; rounds to `maxFractionDigits`. */
export function formatNumber(value: number, locale: string | undefined, maxFractionDigits = 0): string {
  if (!Number.isFinite(value)) return ''
  const rule = ruleFor(locale)
  const digits = Math.max(0, Math.min(6, Math.trunc(maxFractionDigits)))
  const factor = 10 ** digits
  const rounded = Math.round(Math.abs(value) * factor) / factor
  const [intPart, fracPart = ''] = rounded.toFixed(digits).split('.')
  // Group only when the integer part is long enough: "1662", not "1.662", in
  // Italian, Polish and Albanian; the thousands separator starts at 10 000.
  const grouped =
    intPart.length >= 3 + rule.minGroupingDigits
      ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, rule.group)
      : intPart
  const fraction = fracPart.replace(/0+$/, '')
  const sign = value < 0 && rounded !== 0 ? '-' : ''
  return `${sign}${grouped}${fraction ? `${rule.decimal}${fraction}` : ''}`
}

/** The display symbol of a currency ("€", "$", "₴"); the ISO code when none is known. */
export function getCurrencySymbol(code: CurrencyCode, _locale = 'en'): string {
  const c = typeof code === 'string' && code.trim() ? code.trim().toUpperCase() : 'EUR'
  return CURRENCY_SYMBOL_FALLBACK_MAP[c] ?? c
}

/** A whole-unit amount with its currency: "€1,662" in English, "1 662 €" in Russian. */
export function formatMoney(amount: number, currency: CurrencyCode, locale: string): string {
  const code = typeof currency === 'string' && currency.trim() ? currency.trim().toUpperCase() : 'EUR'
  const symbol = getCurrencySymbol(code)
  const number = formatNumber(amount, locale, 0)
  if (!number) return ''
  const rule = ruleFor(locale)
  // A code-only "currency" (CHF) reads better with a space on either side.
  if (rule.symbolFirst) return symbol === code ? `${symbol}${NBSP}${number}` : `${symbol}${number}`
  return `${number}${NBSP}${symbol}`
}
