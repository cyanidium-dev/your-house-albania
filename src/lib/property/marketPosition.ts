import type { ZoneMetricsDoc } from '@/lib/sanity/queries/zoneMetrics';

export type MarketPositionLabel = 'below' | 'in' | 'above';
export type MarketPositionRangeBasis = 'new' | 'resale' | 'all';

export type MarketPosition = {
  label: MarketPositionLabel;
  pricePerSqm: number;
  rangeMin: number;
  rangeMax: number;
  rangeBasis: MarketPositionRangeBasis;
  referencePrice?: number;
  grossYieldPct?: number;
};

type MarketPositionPropertyInput = {
  price?: number | null;
  area?: number | null;
  yearBuilt?: number | null;
};

/**
 * A property built within this many years of "now" is priced against the
 * zone's "new" bucket rather than "resale". No existing convention covers
 * this cutoff (the roadmap only says "choose by yearBuilt") — this is an
 * original decision for this feature, kept in one place so it's easy to
 * change later.
 */
const NEW_BUILD_MAX_AGE_YEARS = 3;

type RangeBucket = { min: number; max: number; basis: MarketPositionRangeBasis };

function pickRange(metrics: ZoneMetricsDoc, isNew: boolean): RangeBucket | null {
  const bucket = isNew
    ? { min: metrics.priceNewMin, max: metrics.priceNewMax, basis: 'new' as const }
    : { min: metrics.priceResaleMin, max: metrics.priceResaleMax, basis: 'resale' as const };
  if (typeof bucket.min === 'number' && typeof bucket.max === 'number') {
    return { min: bucket.min, max: bucket.max, basis: bucket.basis };
  }
  if (typeof metrics.priceAllMin === 'number' && typeof metrics.priceAllMax === 'number') {
    return { min: metrics.priceAllMin, max: metrics.priceAllMax, basis: 'all' };
  }
  return null;
}

/**
 * Property price/area/yearBuilt + a zone's latest `zoneMetrics` record in,
 * a market-position verdict out. No I/O — every input is already resolved.
 * `null` whenever there isn't enough to compare (no metrics, no usable
 * price range, area/price missing or non-positive) — the roadmap's own
 * rule: no metrics means no block renders, not a broken one.
 */
export function computeMarketPosition(
  property: MarketPositionPropertyInput,
  metrics: ZoneMetricsDoc | null | undefined,
  options?: { now?: Date },
): MarketPosition | null {
  const price = property.price;
  const area = property.area;
  if (!metrics || typeof price !== 'number' || price <= 0 || typeof area !== 'number' || area <= 0) {
    return null;
  }

  const currentYear = (options?.now ?? new Date()).getFullYear();
  const yearBuilt = property.yearBuilt;
  const isNew =
    typeof yearBuilt === 'number' &&
    Number.isFinite(yearBuilt) &&
    currentYear - yearBuilt <= NEW_BUILD_MAX_AGE_YEARS;

  const range = pickRange(metrics, isNew);
  if (!range) return null;

  const pricePerSqm = price / area;
  const label: MarketPositionLabel =
    pricePerSqm < range.min ? 'below' : pricePerSqm > range.max ? 'above' : 'in';

  const referencePrice = typeof metrics.referencePrice === 'number' ? metrics.referencePrice : undefined;
  const grossYieldPct =
    typeof metrics.grossYieldLtrPct === 'number'
      ? metrics.grossYieldLtrPct
      : typeof metrics.grossYieldLtrPctMin === 'number'
        ? metrics.grossYieldLtrPctMin
        : undefined;

  return {
    label,
    pricePerSqm,
    rangeMin: range.min,
    rangeMax: range.max,
    rangeBasis: range.basis,
    referencePrice,
    grossYieldPct,
  };
}
