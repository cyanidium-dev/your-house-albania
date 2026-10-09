import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/sanity/queries/_core', () => ({ getClient: () => null }))

import { leadRecipientChatIds } from '../leadRecipients'

describe('lead recipients', () => {
  it('sends every lead to the main group', () => {
    expect(leadRecipientChatIds({ generalChatId: '-1001111111111' })).toEqual(['-1001111111111'])
  })

  it('adds the agent group after the main group, once', () => {
    expect(
      leadRecipientChatIds({ generalChatId: '-1001111111111', agentChatId: '-1002222222222' })
    ).toEqual(['-1001111111111', '-1002222222222'])
    expect(
      leadRecipientChatIds({ generalChatId: '-1001111111111', agentChatId: '-1001111111111' })
    ).toEqual(['-1001111111111'])
  })

  it('ignores an empty or malformed agent chat id', () => {
    expect(leadRecipientChatIds({ generalChatId: '-1001111111111', agentChatId: '' })).toEqual(['-1001111111111'])
    expect(leadRecipientChatIds({ generalChatId: '-1001111111111', agentChatId: 'cactus' })).toEqual(['-1001111111111'])
    expect(leadRecipientChatIds({ generalChatId: '-1001111111111', agentChatId: null })).toEqual(['-1001111111111'])
  })

  it('still reaches the agent group when the main group is not configured', () => {
    expect(leadRecipientChatIds({ agentChatId: '-1002222222222' })).toEqual(['-1002222222222'])
  })
})
