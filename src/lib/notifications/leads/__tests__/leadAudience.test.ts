import { beforeEach, describe, expect, it, vi } from 'vitest'

const fetchMock = vi.fn()
vi.mock('@/lib/sanity/queries/_core', () => ({ getClient: () => ({ fetch: fetchMock }) }))

describe('leadAudience', () => {
  beforeEach(() => {
    vi.resetModules()
    fetchMock.mockReset()
  })

  it('sends a listing lead to that agency only, labelled unique', async () => {
    const { leadAudience } = await import('../leadRecipients')
    const r = await leadAudience({ listingBound: true, agentChatId: '-5422332960', generalChatId: '-1001111111111' })
    expect(r).toEqual({ scope: 'unique', chatIds: ['-5422332960'] })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('keeps a listing lead of an agency without a group in the general chat', async () => {
    const { leadAudience } = await import('../leadRecipients')
    const r = await leadAudience({ listingBound: true, agentChatId: null, generalChatId: '-1001111111111' })
    expect(r).toEqual({ scope: 'unique', chatIds: ['-1001111111111'] })
  })

  it('sends a general lead to the general chat and every agency group, once each', async () => {
    fetchMock.mockResolvedValue(['-5422332960', '-5422332960', 'junk', '-1002222222222'])
    const { leadAudience } = await import('../leadRecipients')
    const r = await leadAudience({ listingBound: false, generalChatId: '-1001111111111' })
    expect(r.scope).toBe('general')
    expect(r.chatIds).toEqual(['-1001111111111', '-5422332960', '-1002222222222'])
  })

  it('labels the two kinds', async () => {
    const { leadScopeLabel } = await import('../leadRecipients')
    expect(leadScopeLabel('unique')).toMatch(/Уникальная заявка/)
    expect(leadScopeLabel('general')).toMatch(/Общая заявка/)
  })
})
