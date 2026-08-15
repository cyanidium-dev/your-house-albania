import { getClient, sanityCache, SANITY_TAGS } from './_core';
import type { SourceItemDoc } from './referenceDocs';

type LocalizedField = Record<string, string> | null | undefined;

/**
 * Market figures for one zone over one period (`zoneMetrics` document).
 * Every metric is optional: a record carries only what its sources actually
 * state, and the renderers skip what is absent rather than showing a blank.
 */
export type ZoneMetricsDoc = {
  _id?: string;
  periodLabel?: string;
  periodDate?: string;
  basis?: 'asking' | 'transaction' | 'official' | 'calculated' | 'mixed' | string;
  confidence?: 'high' | 'medium' | 'low' | string;
  sampleSize?: number;

  priceNewMin?: number;
  priceNewMax?: number;
  priceNewMedian?: number;
  priceResaleMin?: number;
  priceResaleMax?: number;
  priceResaleMedian?: number;
  priceAllMin?: number;
  priceAllMax?: number;
  priceAllMedian?: number;

  rentLtr1brMin?: number;
  rentLtr1brMax?: number;
  rentLtr2brMin?: number;
  rentLtr2brMax?: number;
  strAdr?: number;
  strOccupancyPct?: number;
  grossYieldLtrPct?: number;
  grossYieldStrPct?: number;

  referencePrice?: number;
  referencePriceMin?: number;
  referencePriceMax?: number;
  referencePriceEdition?: string;

  ratingOverall?: number;
  sources?: SourceItemDoc[];
  notes?: LocalizedField;

  zone?: {
    _id?: string;
    _type?: 'district' | 'city' | string;
    title?: LocalizedField;
    slug?: string;
    citySlug?: string;
    countrySlug?: string;
  } | null;
};

const ZONE_METRICS_PROJECTION = `{
  _id,
  periodLabel,
  periodDate,
  basis,
  confidence,
  sampleSize,
  priceNewMin, priceNewMax, priceNewMedian,
  priceResaleMin, priceResaleMax, priceResaleMedian,
  priceAllMin, priceAllMax, priceAllMedian,
  rentLtr1brMin, rentLtr1brMax, rentLtr2brMin, rentLtr2brMax,
  strAdr, strOccupancyPct, grossYieldLtrPct, grossYieldStrPct,
  referencePrice, referencePriceMin, referencePriceMax, referencePriceEdition,
  ratingOverall,
  "sources": sources[] { _key, label, url, publisher, date },
  notes,
  "zone": zone-> {
    _id,
    _type,
    title,
    "slug": slug.current,
    "citySlug": select(_type == "district" => city->slug.current, slug.current),
    "countrySlug": select(_type == "district" => city->country->slug.current, country->slug.current)
  }
}`;

const TAGS = [SANITY_TAGS.zoneMetrics, SANITY_TAGS.district, SANITY_TAGS.city];

/** Newest record for one zone document. */
export async function fetchLatestZoneMetricsByZoneId(zoneId: string): Promise<ZoneMetricsDoc | null> {
  const id = typeof zoneId === 'string' ? zoneId.trim() : '';
  if (!id) return null;
  const cached = sanityCache(
    async () => {
      const client = getClient();
      if (!client) return null;
      const query = `*[_type == "zoneMetrics" && zone._ref == $id] | order(periodDate desc)[0] ${ZONE_METRICS_PROJECTION}`;
      try {
        return await client.fetch<ZoneMetricsDoc | null>(query, { id });
      } catch (err) {
        console.warn('[Sanity] fetchLatestZoneMetricsByZoneId failed:', err);
        return null;
      }
    },
    ['sanity-zone-metrics-latest-v1', id],
    { revalidate: 60, tags: TAGS },
  );
  return cached();
}

/** Every period for one zone, newest first. Nothing renders history yet. */
export async function fetchZoneMetricsHistoryByZoneId(zoneId: string): Promise<ZoneMetricsDoc[]> {
  const id = typeof zoneId === 'string' ? zoneId.trim() : '';
  if (!id) return [];
  const cached = sanityCache(
    async () => {
      const client = getClient();
      if (!client) return [];
      const query = `*[_type == "zoneMetrics" && zone._ref == $id] | order(periodDate desc) ${ZONE_METRICS_PROJECTION}`;
      try {
        return await client.fetch<ZoneMetricsDoc[]>(query, { id });
      } catch (err) {
        console.warn('[Sanity] fetchZoneMetricsHistoryByZoneId failed:', err);
        return [];
      }
    },
    ['sanity-zone-metrics-history-v1', id],
    { revalidate: 60, tags: TAGS },
  );
  return cached();
}

/**
 * Newest record for each published district of a city — the "districts of this
 * city" table mode. Districts without a record are absent from the result, so
 * the table has no blank rows.
 */
export async function fetchLatestZoneMetricsForCityDistricts(city: {
  id?: string;
  slug?: string;
}): Promise<ZoneMetricsDoc[]> {
  const id = typeof city?.id === 'string' ? city.id.trim() : '';
  const slug = typeof city?.slug === 'string' ? city.slug.trim().toLowerCase() : '';
  if (!id && !slug) return [];
  // A section may reference the city document directly; a landing only knows its slug.
  const match = id ? 'city._ref == $id' : 'city->slug.current == $slug';
  const cached = sanityCache(
    async () => {
      const client = getClient();
      if (!client) return [];
      // One record per district: the newest period for each zone ref. The
      // wrapper object is unwrapped here rather than in GROQ — projecting
      // `.latest` on the result set yields nulls, not the records.
      const query = `*[
        _type == "district" &&
        isPublished != false &&
        city->isPublished != false &&
        ${match}
      ] {
        "latest": *[_type == "zoneMetrics" && zone._ref == ^._id] | order(periodDate desc)[0] ${ZONE_METRICS_PROJECTION}
      }`;
      try {
        const rows = await client.fetch<{ latest: ZoneMetricsDoc | null }[]>(query, { id, slug });
        return rows.map((row) => row?.latest).filter((r): r is ZoneMetricsDoc => Boolean(r));
      } catch (err) {
        console.warn('[Sanity] fetchLatestZoneMetricsForCityDistricts failed:', err);
        return [];
      }
    },
    ['sanity-zone-metrics-city-districts-v3', id || slug],
    { revalidate: 60, tags: TAGS },
  );
  return cached();
}

/** Newest record for each of the given zone documents (manual comparison mode). */
export async function fetchLatestZoneMetricsByZoneIds(zoneIds: string[]): Promise<ZoneMetricsDoc[]> {
  const ids = Array.isArray(zoneIds)
    ? zoneIds.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).map((x) => x.trim())
    : [];
  if (ids.length === 0) return [];
  const cached = sanityCache(
    async () => {
      const client = getClient();
      if (!client) return [];
      const query = `*[_id in $ids] {
        "latest": *[_type == "zoneMetrics" && zone._ref == ^._id] | order(periodDate desc)[0] ${ZONE_METRICS_PROJECTION}
      }`;
      try {
        const wrapped = await client.fetch<{ latest: ZoneMetricsDoc | null }[]>(query, { ids });
        const rows = wrapped.map((row) => row?.latest).filter((r): r is ZoneMetricsDoc => Boolean(r));
        // Preserve the editor's chosen order rather than Sanity's document order.
        const byZone = new Map(rows.map((r) => [r.zone?._id, r]));
        return ids.map((id) => byZone.get(id)).filter((r): r is ZoneMetricsDoc => Boolean(r));
      } catch (err) {
        console.warn('[Sanity] fetchLatestZoneMetricsByZoneIds failed:', err);
        return [];
      }
    },
    ['sanity-zone-metrics-by-ids-v2', ids.slice().sort().join(',')],
    { revalidate: 60, tags: TAGS },
  );
  return cached();
}
