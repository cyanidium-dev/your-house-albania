import { fetchLatestZoneMetricsByZoneIds } from '@/lib/sanity/queries/zoneMetrics';
import type { ZoneMetricsDoc } from '@/lib/sanity/queries/zoneMetrics';
import type { PropertyHomes } from '@/types/propertyHomes';

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

/**
 * Computes `marketPosition` for a list of cards with one batched zone-metrics
 * fetch (not one per card) — the acceptance bar is "catalog not noticeably
 * slower". `fetchZoneMetrics` defaults to the real Sanity fetch but is a
 * parameter so tests can supply a fake and assert call count/args without a
 * mocking framework — this codebase's test suite doesn't use `vi.mock`.
 */
export async function attachMarketPositionToCards(
  items: PropertyHomes[],
  fetchZoneMetrics: (zoneIds: string[]) => Promise<ZoneMetricsDoc[]> = fetchLatestZoneMetricsByZoneIds,
): Promise<PropertyHomes[]> {
  const districtIds = Array.from(
    new Set(
      items
        .map((item) => item.districtId)
        .filter((id): id is string => typeof id === 'string' && id.length > 0),
    ),
  );
  if (districtIds.length === 0) return items;

  const metricsList = await fetchZoneMetrics(districtIds);
  const metricsByDistrictId = new Map<string, ZoneMetricsDoc>();
  for (const m of metricsList) {
    if (typeof m.zone?._id === 'string') metricsByDistrictId.set(m.zone._id, m);
  }

  return items.map((item) => {
    if (!item.districtId) return item;
    const metrics = metricsByDistrictId.get(item.districtId) ?? null;
    const marketPosition = computeMarketPosition(
      { price: item.price, area: item.area, yearBuilt: item.yearBuilt },
      metrics,
    );
    return { ...item, marketPosition };
  });
}
