/**
 * Minimal currency symbol map for cron-side enrichment.
 * Only includes symbols when known; omit unknown codes.
 */
export const CURRENCY_SYMBOL_MAP: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  CHF: 'CHF',
  JPY: '¥',
  CNY: '¥',
  AUD: 'A$',
  CAD: 'C$',
};
