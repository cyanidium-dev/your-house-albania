import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/sanity/queries/_core', () => ({ getClient: () => null }))

import { leadRecipientChatIds } from '../leadRecipients'

describe('lead recipients', () => {
  it('sends a lead without an agent group to the main group', () => {
    expect(leadRecipientChatIds({ generalChatId: '-1001111111111' })).toEqual(['-1001111111111'])
    expect(leadRecipientChatIds({ generalChatId: '-1001111111111', agentChatId: null })).toEqual(['-1001111111111'])
  })

  it('sends an agent lead to the agent group only, never to the main group', () => {
    expect(
      leadRecipientChatIds({ generalChatId: '-1001111111111', agentChatId: '-5422332960' })
    ).toEqual(['-5422332960'])
  })

  it('falls back to the main group when the agent chat id is empty or malformed', () => {
    expect(leadRecipientChatIds({ generalChatId: '-1001111111111', agentChatId: '' })).toEqual(['-1001111111111'])
    expect(leadRecipientChatIds({ generalChatId: '-1001111111111', agentChatId: 'cactus' })).toEqual(['-1001111111111'])
  })

  it('returns nothing when neither is configured', () => {
    expect(leadRecipientChatIds({})).toEqual([])
  })
})
