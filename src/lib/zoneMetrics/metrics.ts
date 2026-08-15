import type { ZoneMetricsDoc } from '@/lib/sanity/queries/zoneMetrics';

/**
 * Metric keys an editor can switch on in `zoneStatsAutoSection` /
 * `zonePriceTableAutoSection`. Order here is the default display order.
 */
export const METRIC_KEYS = [
  'priceNew',
  'priceResale',
  'priceAll',
  'rent1br',
  'rent2br',
  'strAdr',
  'strOccupancy',
  'yieldLtr',
  'yieldStr',
  'referencePrice',
  'rating',
] as const;

export type MetricKey = (typeof METRIC_KEYS)[number];

export function isMetricKey(value: unknown): value is MetricKey {
  return typeof value === 'string' && (METRIC_KEYS as readonly string[]).includes(value);
}

const LOCALE_TAG: Record<string, string> = { en: 'en', uk: 'uk', ru: 'ru', sq: 'sq', al: 'sq', it: 'it' };

function nf(locale: string, fractionDigits: number): Intl.NumberFormat {
  return new Intl.NumberFormat(LOCALE_TAG[locale] ?? 'en', {
    maximumFractionDigits: fractionDigits,
  });
}

type Shape = { min?: number; max?: number; median?: number; digits?: number };

function shapeFor(record: ZoneMetricsDoc, key: MetricKey): Shape {
  switch (key) {
    case 'priceNew':
      return { min: record.priceNewMin, max: record.priceNewMax, median: record.priceNewMedian };
    case 'priceResale':
      return { min: record.priceResaleMin, max: record.priceResaleMax, median: record.priceResaleMedian };
    case 'priceAll':
      return { min: record.priceAllMin, max: record.priceAllMax, median: record.priceAllMedian };
    case 'rent1br':
      return { min: record.rentLtr1brMin, max: record.rentLtr1brMax };
    case 'rent2br':
      return { min: record.rentLtr2brMin, max: record.rentLtr2brMax };
    case 'strAdr':
      return { median: record.strAdr };
    case 'strOccupancy':
      return { median: record.strOccupancyPct, digits: 1 };
    case 'yieldLtr':
      return {
        min: record.grossYieldLtrPctMin,
        max: record.grossYieldLtrPctMax,
        median: record.grossYieldLtrPct,
        digits: 1,
      };
    case 'yieldStr':
      return {
        min: record.grossYieldStrPctMin,
        max: record.grossYieldStrPctMax,
        median: record.grossYieldStrPct,
        digits: 1,
      };
    case 'referencePrice':
      return {
        min: record.referencePriceMin,
        max: record.referencePriceMax,
        median: record.referencePrice,
      };
    case 'rating':
      return { median: record.ratingOverall, digits: 1 };
  }
}

/**
 * One metric as display text, or null when the record has nothing for it.
 *
 * A median wins over a range: sources that publish a median (the listing
 * parser) are more precise than sources that publish a band, and showing both
 * in one cell makes the table unreadable. A lone min or max renders on its own
 * rather than as a half-empty range.
 */
export function formatMetric(record: ZoneMetricsDoc, key: MetricKey, locale: string): string | null {
  const { min, max, median, digits = 0 } = shapeFor(record, key);
  const format = nf(locale, digits);

  if (typeof median === 'number') return format.format(median);
  if (typeof min === 'number' && typeof max === 'number') {
    return min === max ? format.format(min) : `${format.format(min)}–${format.format(max)}`;
  }
  if (typeof min === 'number') return format.format(min);
  if (typeof max === 'number') return format.format(max);
  return null;
}

/** Metric keys this record can actually fill, in display order. */
export function availableMetrics(record: ZoneMetricsDoc, locale = 'en'): MetricKey[] {
  return METRIC_KEYS.filter((key) => formatMetric(record, key, locale) !== null);
}

/** Editor selection intersected with what the record holds; falls back to whatever exists. */
export function resolveSelectedMetrics(
  record: ZoneMetricsDoc,
  selected: unknown,
  locale = 'en',
): MetricKey[] {
  const available = availableMetrics(record, locale);
  const wanted = Array.isArray(selected) ? selected.filter(isMetricKey) : [];
  if (wanted.length === 0) return available;
  const keep = wanted.filter((key) => available.includes(key));
  return keep.length > 0 ? keep : available;
}

/** De-duplicate sources across several records, keyed by URL. */
export function mergeSources(records: ZoneMetricsDoc[]) {
  const byUrl = new Map<string, NonNullable<ZoneMetricsDoc['sources']>[number]>();
  for (const record of records) {
    for (const source of record.sources ?? []) {
      if (!source?.url) continue;
      if (!byUrl.has(source.url)) byUrl.set(source.url, source);
    }
  }
  return Array.from(byUrl.values());
}

/** Newest `periodLabel` across records — what the "updated" line should show. */
export function latestPeriodLabel(records: ZoneMetricsDoc[]): string | undefined {
  const sorted = records
    .filter((r) => r.periodLabel)
    .slice()
    .sort((a, b) => String(b.periodDate ?? '').localeCompare(String(a.periodDate ?? '')));
  return sorted[0]?.periodLabel;
}
