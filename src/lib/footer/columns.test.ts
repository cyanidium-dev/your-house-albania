import { describe, expect, it } from 'vitest'
import { footerLgColsClass } from './columns'

describe('footerLgColsClass (ТЗ-16 footer grid switch)', () => {
  it('4 columns with neither optional column', () => {
    expect(footerLgColsClass(false, false)).toBe('lg:grid-cols-4')
  })
  it('5 columns with exactly one optional column', () => {
    expect(footerLgColsClass(true, false)).toBe('lg:grid-cols-5')
    expect(footerLgColsClass(false, true)).toBe('lg:grid-cols-5')
  })
  it('6 columns with both', () => {
    expect(footerLgColsClass(true, true)).toBe('lg:grid-cols-6')
  })
})
