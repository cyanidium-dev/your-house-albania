import { describe, it, expect } from 'vitest';
import { displayStatusLabel, displayStatusShortLabel, displayDealLabel } from '../cardFormatters';

const t = (key: string) => {
  const dict: Record<string, string> = {
    dealTypeSale: 'Sale',
    dealTypeRent: 'Rent',
    dealTypeShortTerm: 'Short-term rent',
    dealTypeLongTerm: 'Long-term rent',
    dealTypeShortTermCompact: 'Short rent',
    dealTypeLongTermCompact: 'Long rent',
  };
  return dict[key] ?? key;
};

describe('displayStatusLabel', () => {
  it('translates each known status', () => {
    expect(displayStatusLabel('sale', t)).toBe('Sale');
    expect(displayStatusLabel('rent', t)).toBe('Rent');
    expect(displayStatusLabel('short-term', t)).toBe('Short-term rent');
    expect(displayStatusLabel('shortterm', t)).toBe('Short-term rent');
    expect(displayStatusLabel('long-term', t)).toBe('Long-term rent');
    expect(displayStatusLabel('longterm', t)).toBe('Long-term rent');
  });

  it('is case- and whitespace-insensitive', () => {
    expect(displayStatusLabel(' SALE ', t)).toBe('Sale');
  });

  it('falls back to the raw status for an unknown value', () => {
    expect(displayStatusLabel('draft', t)).toBe('draft');
  });

  it('returns null for a missing status', () => {
    expect(displayStatusLabel(null, t)).toBeNull();
    expect(displayStatusLabel(undefined, t)).toBeNull();
  });
});

describe('displayStatusShortLabel', () => {
  it('shortens short-term and long-term specifically', () => {
    expect(displayStatusShortLabel('short-term', t)).toBe('Short rent');
    expect(displayStatusShortLabel('long-term', t)).toBe('Long rent');
  });

  it('falls back to the full label for sale/rent, which are already short', () => {
    expect(displayStatusShortLabel('sale', t)).toBe('Sale');
    expect(displayStatusShortLabel('rent', t)).toBe('Rent');
  });

  it('returns null for a missing status', () => {
    expect(displayStatusShortLabel(null, t)).toBeNull();
  });
});

describe('displayDealLabel', () => {
  it('dispatches to the short label when compact is requested', () => {
    expect(displayDealLabel('short-term', t, { compact: true })).toBe('Short rent');
  });

  it('dispatches to the full label by default', () => {
    expect(displayDealLabel('short-term', t)).toBe('Short-term rent');
    expect(displayDealLabel('short-term', t, { compact: false })).toBe('Short-term rent');
  });
});
