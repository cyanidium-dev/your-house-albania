/**
 * Price range utilities for hero and properties filters.
 * CMS-driven single range from siteSettings.priceRange { from, to }, with strict fallback.
 */

export type CmsPriceRange = { from: number; to: number };

export type PriceRangesByDeal = Record<string, { min: number; max: number }>;

/** Default range when CMS data is invalid or absent. Same range used for all deal types. */
export const DEFAULT_PRICE_RANGE: CmsPriceRange = {
  from: 50_000,
  to: 1_000_000,
};

/** Legacy shape for components: all keys share the same range. */
const DEAL_KEYS = ["any", "sale", "rent", "short-term"] as const;

/** Default ranges for component compatibility (all identical). */
export const DEFAULT_PRICE_RANGES: PriceRangesByDeal = Object.fromEntries(
  DEAL_KEYS.map((k) => [k, { min: DEFAULT_PRICE_RANGE.from, max: DEFAULT_PRICE_RANGE.to }])
) as PriceRangesByDeal;

/**
 * Normalizes CMS priceRange object. Returns null if invalid.
 */
export function normalizePriceRange(input: unknown): CmsPriceRange | null {
  if (!input) return null;

  const { from, to } = (input as Record<string, unknown>) ?? {};

  if (typeof from !== "number") return null;
  if (typeof to !== "number") return null;
  if (!Number.isFinite(from) || !Number.isFinite(to)) return null;
  if (from < 0) return null;
  if (to < from) return null;

  return { from, to };
}

/**
 * Resolves price range from CMS. Uses CMS when valid, else DEFAULT_PRICE_RANGE.
 * Logs warning in development when fallback is used.
 */
export function resolvePriceRange(priceRange: unknown): CmsPriceRange {
  const normalized = normalizePriceRange(priceRange);

  if (normalized) {
    return { ...normalized };
  }

  if (process.env.NODE_ENV === "development") {
    console.warn("[priceRanges] Invalid or empty priceRange from CMS, using defaults");
  }

  return { ...DEFAULT_PRICE_RANGE };
}

/**
 * Converts single CMS range to component format. All deal keys receive the same range.
 */
export function toRangesByDeal(range: CmsPriceRange): PriceRangesByDeal {
  const r = { min: range.from, max: range.to };
  return Object.fromEntries(DEAL_KEYS.map((k) => [k, r])) as PriceRangesByDeal;
}

/** Price range state for display and query serialization */
export type PriceRangeState =
  | { kind: "unset" }
  | { kind: "fromOnly"; from: number }
  | { kind: "toOnly"; to: number }
  | { kind: "both"; from: number; to: number };

/**
 * Interprets current slider values against default range.
 * Default means current from === defaultFrom and current to === defaultTo.
 */
export function interpretPriceRangeState(
  current: { min: number; max: number },
  defaultRange: { min: number; max: number }
): PriceRangeState {
  const fromMatches = current.min === defaultRange.min;
  const toMatches = current.max === defaultRange.max;

  if (fromMatches && toMatches) return { kind: "unset" };
  if (!fromMatches && toMatches) return { kind: "fromOnly", from: current.min };
  if (fromMatches && !toMatches) return { kind: "toOnly", to: current.max };
  return { kind: "both", from: current.min, to: current.max };
}

/**
 * Returns query params for the given state. Only includes params when needed.
 */
export function getPriceQueryParams(state: PriceRangeState): {
  minPrice?: string;
  maxPrice?: string;
} {
  switch (state.kind) {
    case "unset":
      return {};
    case "fromOnly":
      return { minPrice: String(Math.round(state.from)) };
    case "toOnly":
      return { maxPrice: String(Math.round(state.to)) };
    case "both":
      return {
        minPrice: String(Math.round(state.from)),
        maxPrice: String(Math.round(state.to)),
      };
  }
}

/**
 * Formats price range for display. Uses localized strings.
 */
export function formatPriceRangeDisplay(
  state: PriceRangeState,
  options: {
    formatAmount: (amountEur: number) => string;
    t: (key: string) => string;
  }
): string {
  const { formatAmount, t } = options;
  switch (state.kind) {
    case "unset":
      return t("any");
    case "fromOnly":
      return `${t("priceFrom")} ${formatAmount(state.from)}`;
    case "toOnly":
      return `${t("priceTo")} ${formatAmount(state.to)}`;
    case "both":
      return `${formatAmount(state.from)} – ${formatAmount(state.to)}`;
  }
}
