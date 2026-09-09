import { describe, expect, it } from 'vitest';
import { resolveTableColumns } from '../metrics';
import type { ZoneMetricsDoc } from '@/lib/sanity/queries/zoneMetrics';

const DEFAULT_COLUMNS = ['priceNew', 'priceResale', 'priceAll', 'referencePrice'] as const;

function zone(fields: Partial<ZoneMetricsDoc>): ZoneMetricsDoc {
  return { zone: { slug: 'z', _type: 'district' }, ...fields };
}

/** The Durrës shape: every zone reports `priceAll`, one also reports new/resale. */
function durresRows(): ZoneMetricsDoc[] {
  const bands = Array.from({ length: 12 }, () => zone({ priceAllMin: 1000, priceAllMax: 1500 }));
  return [
    ...bands,
    zone({
      priceAllMedian: 1110,
      priceNewMin: 1200,
      priceNewMax: 2000,
      priceResaleMin: 450,
      priceResaleMax: 800,
    }),
  ];
}

describe('resolveTableColumns', () => {
  it('drops a column that only one row out of thirteen can fill', () => {
    // The bug this guards: `priceNew`/`priceResale` came from Shkëmbi alone and
    // rendered as two columns of dashes on the Durrës city page.
    expect(resolveTableColumns(durresRows(), undefined, DEFAULT_COLUMNS)).toEqual(['priceAll']);
  });

  it('keeps a column the majority of rows can fill', () => {
    const rows = [
      zone({ priceNewMin: 2000, priceAllMin: 1800 }),
      zone({ priceNewMin: 2400, priceAllMin: 2100 }),
      zone({ priceAllMin: 1500 }),
    ];
    expect(resolveTableColumns(rows, undefined, DEFAULT_COLUMNS)).toEqual(['priceNew', 'priceAll']);
  });

  it('keeps a metric only one side of a two-zone comparison reports', () => {
    // Half of two is one, so a comparison page still shows the asymmetry
    // rather than hiding the only figure that distinguishes the pair.
    const rows = [zone({ priceAllMin: 1200, priceNewMin: 1900 }), zone({ priceAllMin: 1400 })];
    expect(resolveTableColumns(rows, undefined, DEFAULT_COLUMNS)).toEqual(['priceNew', 'priceAll']);
  });

  it('honours an explicit column selection, still subject to coverage', () => {
    const rows = [zone({ priceAllMin: 1000 }), zone({ priceAllMin: 1200 })];
    expect(resolveTableColumns(rows, ['priceAll', 'yieldStr'], DEFAULT_COLUMNS)).toEqual([
      'priceAll',
    ]);
  });

  it('falls back to the best-covered metrics when every requested column is empty', () => {
    const rows = [zone({ ratingOverall: 4.2 }), zone({ ratingOverall: 3.8 })];
    expect(resolveTableColumns(rows, ['priceNew'], DEFAULT_COLUMNS)).toEqual(['rating']);
  });

  it('returns nothing for no rows', () => {
    expect(resolveTableColumns([], undefined, DEFAULT_COLUMNS)).toEqual([]);
  });
});
