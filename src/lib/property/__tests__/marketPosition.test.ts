import { describe, it, expect } from 'vitest';
import { computeMarketPosition } from '../marketPosition';
import type { ZoneMetricsDoc } from '@/lib/sanity/queries/zoneMetrics';

function metrics(overrides: Partial<ZoneMetricsDoc> = {}): ZoneMetricsDoc {
  return { zone: { _id: 'zone-1' }, ...overrides };
}

describe('computeMarketPosition', () => {
  it('returns null with no metrics', () => {
    expect(computeMarketPosition({ price: 100000, area: 50 }, null)).toBeNull();
  });

  it('returns null when price is missing or non-positive', () => {
    const m = metrics({ priceAllMin: 1000, priceAllMax: 2000 });
    expect(computeMarketPosition({ price: undefined, area: 50 }, m)).toBeNull();
    expect(computeMarketPosition({ price: 0, area: 50 }, m)).toBeNull();
  });

  it('returns null when area is missing or non-positive', () => {
    const m = metrics({ priceAllMin: 1000, priceAllMax: 2000 });
    expect(computeMarketPosition({ price: 100000, area: undefined }, m)).toBeNull();
    expect(computeMarketPosition({ price: 100000, area: 0 }, m)).toBeNull();
  });

  it('falls back to the resale bucket with no yearBuilt', () => {
    const m = metrics({ priceResaleMin: 1000, priceResaleMax: 1500 });
    const result = computeMarketPosition({ price: 120000, area: 100 }, m);
    expect(result?.rangeBasis).toBe('resale');
  });

  it('uses the new bucket when yearBuilt is within 3 years', () => {
    const m = metrics({ priceNewMin: 1200, priceNewMax: 1800, priceResaleMin: 900, priceResaleMax: 1100 });
    const result = computeMarketPosition(
      { price: 150000, area: 100, yearBuilt: 2024 },
      m,
      { now: new Date('2026-08-26') },
    );
    expect(result?.rangeBasis).toBe('new');
  });

  it('treats the 3-year boundary as still new, and one year past it as resale', () => {
    const m = metrics({ priceNewMin: 1200, priceNewMax: 1800, priceResaleMin: 900, priceResaleMax: 1100 });
    const atBoundary = computeMarketPosition(
      { price: 100000, area: 100, yearBuilt: 2023 },
      m,
      { now: new Date('2026-08-26') },
    );
    expect(atBoundary?.rangeBasis).toBe('new');
    const pastBoundary = computeMarketPosition(
      { price: 100000, area: 100, yearBuilt: 2022 },
      m,
      { now: new Date('2026-08-26') },
    );
    expect(pastBoundary?.rangeBasis).toBe('resale');
  });

  it('falls back to priceAll when the chosen bucket is empty', () => {
    const m = metrics({ priceAllMin: 1000, priceAllMax: 1600 });
    const result = computeMarketPosition({ price: 150000, area: 100 }, m);
    expect(result?.rangeBasis).toBe('all');
    expect(result?.rangeMin).toBe(1000);
    expect(result?.rangeMax).toBe(1600);
  });

  it('returns null when neither the chosen bucket nor priceAll has both bounds', () => {
    const m = metrics({ priceResaleMin: 900 });
    expect(computeMarketPosition({ price: 100000, area: 100 }, m)).toBeNull();
  });

  it('labels below, in, and above market correctly', () => {
    const m = metrics({ priceAllMin: 1000, priceAllMax: 1500 });
    expect(computeMarketPosition({ price: 80000, area: 100 }, m)?.label).toBe('below');
    expect(computeMarketPosition({ price: 120000, area: 100 }, m)?.label).toBe('in');
    expect(computeMarketPosition({ price: 200000, area: 100 }, m)?.label).toBe('above');
  });

  it('reads referencePrice when present, otherwise leaves it undefined', () => {
    const withRef = metrics({ priceAllMin: 1000, priceAllMax: 1500, referencePrice: 1300 });
    expect(computeMarketPosition({ price: 100000, area: 100 }, withRef)?.referencePrice).toBe(1300);
    const withoutRef = metrics({ priceAllMin: 1000, priceAllMax: 1500 });
    expect(computeMarketPosition({ price: 100000, area: 100 }, withoutRef)?.referencePrice).toBeUndefined();
  });

  it('prefers the point yield over the range floor, and falls back to the floor', () => {
    const withPoint = metrics({ priceAllMin: 1000, priceAllMax: 1500, grossYieldLtrPct: 6.2, grossYieldLtrPctMin: 5 });
    expect(computeMarketPosition({ price: 100000, area: 100 }, withPoint)?.grossYieldPct).toBe(6.2);
    const withMinOnly = metrics({ priceAllMin: 1000, priceAllMax: 1500, grossYieldLtrPctMin: 5 });
    expect(computeMarketPosition({ price: 100000, area: 100 }, withMinOnly)?.grossYieldPct).toBe(5);
    const withNeither = metrics({ priceAllMin: 1000, priceAllMax: 1500 });
    expect(computeMarketPosition({ price: 100000, area: 100 }, withNeither)?.grossYieldPct).toBeUndefined();
  });
});
