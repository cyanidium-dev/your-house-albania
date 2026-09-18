import { describe, it, expect } from 'vitest';
import {
  comparableTypeSlugs,
  computeOwnershipCosts,
  notaryFeeEur,
  rankInDistrict,
  DISTRICT_RANK_MIN_LISTINGS,
} from '../ownershipCosts';

const FLAT = { price: 110000, area: 70, typeSlug: 'apartment' };

describe('notaryFeeEur', () => {
  it('uses 0.35% up to 6,000,000 lek', () => {
    expect(notaryFeeEur(50000)).toBeCloseTo(175, 5);
  });

  it('drops to 0.30% above 6,000,000 lek', () => {
    // €110,000 = 10.1M lek → second band.
    expect(notaryFeeEur(110000)).toBeCloseTo(330, 5);
  });

  it('has no fee below the scale', () => {
    expect(notaryFeeEur(500)).toBeNull();
  });
});

describe('computeOwnershipCosts', () => {
  it('returns null for land, missing area or missing price', () => {
    expect(computeOwnershipCosts({ ...FLAT, typeSlug: 'land' })).toBeNull();
    expect(computeOwnershipCosts({ ...FLAT, area: null })).toBeNull();
    expect(computeOwnershipCosts({ ...FLAT, price: 0 })).toBeNull();
  });

  it('adds notary, registration and the 1% buyer fee', () => {
    const c = computeOwnershipCosts(FLAT)!;
    expect(c.purchase.map((l) => l.key)).toEqual(['notary', 'registration', 'agency']);
    expect(c.purchase.find((l) => l.key === 'agency')?.eur).toBe(1100);
    expect(c.purchase.find((l) => l.key === 'registration')?.eur).toBe(38);
    expect(c.purchaseTotalEur).toBe(330 + 38 + 1100);
    expect(c.purchasePct).toBeCloseTo((1468 / 110000) * 100, 5);
  });

  it('prices a per-m² listing at rate × area', () => {
    const c = computeOwnershipCosts({ price: 1300, priceUnit: 'per-sqm', area: 68, typeSlug: 'apartment' })!;
    expect(c.totalPriceEur).toBe(88400);
    expect(c.totalFromRate).toBe(true);
    expect(c.purchase.find((l) => l.key === 'agency')?.eur).toBe(884);
  });

  it('taxes 0.05% of the lek reference value, converted to euros', () => {
    const c = computeOwnershipCosts({ ...FLAT, referencePriceMin: 71200, referencePriceMax: 71200 })!;
    // 71,200 lek × 70 m² × 0.05% = 2,492 lek ≈ €27.
    expect(c.annual.find((l) => l.key === 'propertyTax')?.eur).toBe(27);
  });

  it('adds utilities only when the city has a tariff table', () => {
    const without = computeOwnershipCosts(FLAT)!;
    expect(without.annual).toEqual([]);
    expect(without.monthlyEur).toBeNull();

    const withCity = computeOwnershipCosts({ ...FLAT, utilityCity: 'durres' })!;
    const utilities = withCity.annual.find((l) => l.key === 'utilities');
    expect(utilities?.eur).toBeGreaterThan(0);
    expect(utilities?.dataIds.length).toBeGreaterThan(0);
    expect(withCity.monthlyEur).toBe(Math.round((utilities?.eur ?? 0) / 12));
  });

  it('skips utilities on a building too big for the model', () => {
    const c = computeOwnershipCosts({ ...FLAT, typeSlug: 'villa', area: 600, utilityCity: 'durres' })!;
    expect(c.annual.find((l) => l.key === 'utilities')).toBeUndefined();
  });
});

describe('comparableTypeSlugs', () => {
  it('compares flats with flats and houses with houses', () => {
    expect(comparableTypeSlugs('studio')).toContain('apartment');
    expect(comparableTypeSlugs('villa')).toEqual(['house', 'villa']);
    expect(comparableTypeSlugs('land')).toBeNull();
  });
});

describe('rankInDistrict', () => {
  const rows = Array.from({ length: DISTRICT_RANK_MIN_LISTINGS }, (_, i) => ({ price: 100000 + i * 10000, area: 100 }));

  it('needs enough listings for a median', () => {
    expect(rankInDistrict({ price: 90000, area: 100 }, rows.slice(1))).toBeNull();
  });

  it('measures the listing against the median €/m²', () => {
    // Rates 1000…1700 → median 1350.
    const r = rankInDistrict({ price: 108000, area: 100 }, rows)!;
    expect(r.medianPerSqm).toBe(1350);
    expect(r.count).toBe(DISTRICT_RANK_MIN_LISTINGS);
    expect(r.diffPct).toBeCloseTo(-20, 5);
  });

  it('reads per-m² rows and listings as their rate', () => {
    const r = rankInDistrict({ price: 1350, priceUnit: 'per-sqm', area: 68 }, [
      ...rows.slice(1),
      { price: 1350, priceUnit: 'per-sqm', area: null },
    ])!;
    expect(r.count).toBe(DISTRICT_RANK_MIN_LISTINGS);
    // 1100…1700 without 1000, plus 1350 → median 1375.
    expect(r.medianPerSqm).toBe(1375);
    expect(r.diffPct).toBeCloseTo(((1350 - 1375) / 1375) * 100, 5);
  });
});
