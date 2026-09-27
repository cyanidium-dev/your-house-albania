import { describe, expect, it } from 'vitest'
import { formatMoney, formatNumber, getCurrencySymbol } from '../format'

const NBSP = ' '

describe('formatNumber', () => {
  it('groups with the locale separator', () => {
    expect(formatNumber(1662, 'en')).toBe('1,662')
    expect(formatNumber(123456, 'de')).toBe('123.456')
    expect(formatNumber(123456, 'ru')).toBe(`123${NBSP}456`)
    expect(formatNumber(123456, 'uk')).toBe(`123${NBSP}456`)
  })

  it('leaves a four-digit number ungrouped where CLDR does', () => {
    expect(formatNumber(1662, 'sq')).toBe('1662')
    expect(formatNumber(1662, 'it')).toBe('1662')
    expect(formatNumber(1662, 'pl')).toBe('1662')
    expect(formatNumber(12345, 'sq')).toBe(`12${NBSP}345`)
    expect(formatNumber(12345, 'it')).toBe('12.345')
  })

  it('rounds to the asked fraction digits with the locale decimal mark', () => {
    expect(formatNumber(1.345, 'en', 1)).toBe('1.3')
    expect(formatNumber(1.345, 'de', 1)).toBe('1,3')
    expect(formatNumber(1.5, 'en')).toBe('2')
    expect(formatNumber(2.0, 'en', 2)).toBe('2')
    expect(formatNumber(-1500, 'en')).toBe('-1,500')
  })

  it('returns nothing for a non-number', () => {
    expect(formatNumber(NaN, 'en')).toBe('')
    expect(formatNumber(Infinity, 'en')).toBe('')
  })
})

describe('formatMoney', () => {
  it('is the same string the server would print', () => {
    expect(formatMoney(1662, 'EUR', 'sq')).toBe(`1662${NBSP}€`)
    expect(formatMoney(1662, 'EUR', 'en')).toBe('€1,662')
    expect(formatMoney(1662, 'EUR', 'de')).toBe(`1.662${NBSP}€`)
    expect(formatMoney(1662, 'EUR', 'uk')).toBe(`1${NBSP}662${NBSP}€`)
    expect(formatMoney(89050, 'USD', 'ru')).toBe(`89${NBSP}050${NBSP}$`)
  })

  it('falls back to the code and the euro', () => {
    expect(formatMoney(100, 'CHF', 'en')).toBe(`CHF${NBSP}100`)
    expect(formatMoney(100, 'CHF', 'pl')).toBe(`100${NBSP}CHF`)
    expect(formatMoney(100, '', 'en')).toBe('€100')
    expect(formatMoney(100, 'xyz', 'en')).toBe(`XYZ${NBSP}100`)
  })

  it('rounds to whole units', () => {
    expect(formatMoney(1661.6, 'EUR', 'en')).toBe('€1,662')
  })
})

describe('getCurrencySymbol', () => {
  it('knows the site currencies and keeps the code for the rest', () => {
    expect(getCurrencySymbol('EUR')).toBe('€')
    expect(getCurrencySymbol('uah')).toBe('₴')
    expect(getCurrencySymbol('CHF')).toBe('CHF')
  })
})
