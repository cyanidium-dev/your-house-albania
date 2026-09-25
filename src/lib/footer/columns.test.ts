import { describe, expect, it } from 'vitest'
import { footerLgColsClass } from './columns'

describe('footerLgColsClass (footer grid switch)', () => {
  it('four columns without the App column', () => {
    expect(footerLgColsClass(false)).toBe('lg:grid-cols-4')
  })
  it('five columns with the App column', () => {
    expect(footerLgColsClass(true)).toBe('lg:grid-cols-5')
  })
})
