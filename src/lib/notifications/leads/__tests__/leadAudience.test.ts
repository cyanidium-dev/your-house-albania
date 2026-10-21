import { beforeEach, describe, expect, it, vi } from 'vitest'

const fetchMock = vi.fn()
vi.mock('@/lib/sanity/queries/_core', () => ({ getClient: () => ({ fetch: fetchMock }) }))

const CACTUS = '-5422332960'
const VIKTOR = '-1003333333333'
const GENERAL = '-1001111111111'

describe('leadAudience', () => {
  beforeEach(() => {
    vi.resetModules()
    fetchMock.mockReset()
  })

  it('sends a Cactus listing lead to Cactus only, labelled unique', async () => {
    fetchMock.mockResolvedValue(VIKTOR)
    const { leadAudience } = await import('../leadRecipients')
    const r = await leadAudience({ listingBound: true, agentChatId: CACTUS, generalChatId: GENERAL })
    expect(r).toEqual({ scope: 'unique', chatIds: [CACTUS] })
  })

  it('sends a listing lead of an agency without a group to the general chat and Viktor', async () => {
    fetchMock.mockResolvedValue(VIKTOR)
    const { leadAudience } = await import('../leadRecipients')
    const r = await leadAudience({ listingBound: true, agentChatId: null, generalChatId: GENERAL })
    expect(r).toEqual({ scope: 'unique', chatIds: [GENERAL, VIKTOR] })
  })

  it("keeps Viktor's own listing leads in the general chat too", async () => {
    fetchMock.mockResolvedValue(VIKTOR)
    const { leadAudience } = await import('../leadRecipients')
    const r = await leadAudience({ listingBound: true, agentChatId: VIKTOR, generalChatId: GENERAL })
    expect(r.chatIds).toEqual([GENERAL, VIKTOR])
  })

  it('sends a general lead to the general chat and Viktor, never to Cactus', async () => {
    fetchMock.mockResolvedValue(VIKTOR)
    const { leadAudience } = await import('../leadRecipients')
    const r = await leadAudience({ listingBound: false, generalChatId: GENERAL })
    expect(r).toEqual({ scope: 'general', chatIds: [GENERAL, VIKTOR] })
  })

  it('falls back to the general chat while Viktor has no group', async () => {
    fetchMock.mockResolvedValue(null)
    const { leadAudience } = await import('../leadRecipients')
    expect((await leadAudience({ listingBound: false, generalChatId: GENERAL })).chatIds).toEqual([GENERAL])
    expect((await leadAudience({ listingBound: true, agentChatId: null, generalChatId: GENERAL })).chatIds).toEqual([GENERAL])
  })

  it('labels the two kinds', async () => {
    const { leadScopeLabel } = await import('../leadRecipients')
    expect(leadScopeLabel('unique')).toMatch(/Уникальная заявка/)
    expect(leadScopeLabel('general')).toMatch(/Общая заявка/)
  })
})
