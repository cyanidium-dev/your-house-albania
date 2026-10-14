import { describe, expect, it } from 'vitest'
import { guideLandingTopic } from './guideTopics'

describe('guide landing topics', () => {
  it('sorts the guide landings into the menu topics', () => {
    expect(guideLandingTopic('investment-albania')).toBe('investing')
    expect(guideLandingTopic('albania-market')).toBe('market')
    expect(guideLandingTopic('czy-warto-kupic-mieszkanie-w-albanii')).toBe('market')
    expect(guideLandingTopic('apartment-durres')).toBe('places')
    expect(guideLandingTopic('villa-vlore')).toBe('places')
    expect(guideLandingTopic('nieruchomosci-saranda')).toBe('places')
    expect(guideLandingTopic('buying')).toBe('buying')
    expect(guideLandingTopic('czy-polak-moze-kupic-mieszkanie-w-albanii')).toBe('buying')
    expect(guideLandingTopic('buying-property-in-albania-from-israel')).toBe('buying')
  })
})
