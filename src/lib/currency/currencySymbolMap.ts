/**
 * Fallback currency display symbols for the cron sync when Fixer does not supply `symbol`.
 * Keys are ISO 4217 codes (uppercase). Fixer-provided symbol always wins when non-empty.
 */
export const CURRENCY_SYMBOL_FALLBACK_MAP: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  UAH: '₴',
  ALL: 'L',
  BGN: 'лв',
  CHF: 'CHF',
  PLN: 'zł',
  CZK: 'Kč',
  RON: 'lei',
  TRY: '₺',
  AED: 'د.إ',
  THB: '฿',
  JPY: '¥',
  CNY: '¥',
  CAD: 'C$',
  AUD: 'A$',
  SGD: 'S$',
  HKD: 'HK$',
  INR: '₹',
};

/**
 * Symbol precedence: (1) non-empty Fixer `symbol`, (2) {@link CURRENCY_SYMBOL_FALLBACK_MAP}, (3) undefined.
 */
export function resolveCurrencyDisplaySymbol(
  code: string,
  fixerSymbol: string | undefined,
): string | undefined {
  const trimmed = typeof fixerSymbol === 'string' ? fixerSymbol.trim() : '';
  if (trimmed) return trimmed;
  const key = typeof code === 'string' ? code.trim().toUpperCase() : '';
  if (!key) return undefined;
  return CURRENCY_SYMBOL_FALLBACK_MAP[key];
}
