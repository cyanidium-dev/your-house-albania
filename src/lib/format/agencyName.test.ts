import { describe, expect, it } from 'vitest'
import { displayAgencyName } from './agencyName'

describe('displayAgencyName', () => {
  it('title-cases a name written in capitals', () => {
    expect(displayAgencyName('FIND ALL PROPERTIES')).toBe('Find All Properties')
    expect(displayAgencyName('AGJENCIA SHTËPIA')).toBe('Agjencia Shtëpia')
  })

  it("keeps a name that already mixes cases", () => {
    expect(displayAgencyName('Cactus Real Estate')).toBe('Cactus Real Estate')
    expect(displayAgencyName('DomLivo')).toBe('DomLivo')
  })

  it('keeps acronyms and words with symbols', () => {
    expect(displayAgencyName('ERA')).toBe('ERA')
    expect(displayAgencyName('RE/MAX ALBANIA')).toBe('RE/MAX Albania')
  })
})
