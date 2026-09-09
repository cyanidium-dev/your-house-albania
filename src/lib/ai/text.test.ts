import { describe, expect, it } from 'vitest'
import { sliceSafe, stripLoneSurrogates } from './text'

describe('stripLoneSurrogates', () => {
  it('leaves whole characters alone', () => {
    expect(stripLoneSurrogates('Area: 59.50 m² 💰 Price')).toBe('Area: 59.50 m² 💰 Price')
  })

  it('drops a high surrogate with no partner', () => {
    expect(stripLoneSurrogates('pool \uD83D')).toBe('pool ')
  })

  it('drops a low surrogate with no partner', () => {
    expect(stripLoneSurrogates('\uDCB0 pool')).toBe(' pool')
  })
})

describe('sliceSafe', () => {
  it('never ends on half an emoji', () => {
    // 💰 is a surrogate pair, so a plain slice(0, 6) keeps only its first half
    // and the JSON body built from it is rejected by the API.
    const value = 'pool 💰 Price'
    expect(value.slice(0, 6)).toBe('pool \uD83D')
    expect(sliceSafe(value, 6)).toBe('pool ')
  })

  it('keeps an emoji that fits whole', () => {
    expect(sliceSafe('pool 💰 Price', 7)).toBe('pool 💰')
  })

  it('returns short input unchanged', () => {
    expect(sliceSafe('pool 💰', 50)).toBe('pool 💰')
  })
})
