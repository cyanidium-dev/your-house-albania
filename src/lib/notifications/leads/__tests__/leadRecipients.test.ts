import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/sanity/queries/_core', () => ({ getClient: () => null }))

import { leadRecipientChatIds, resolveListingAgent } from '../leadRecipients'

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

describe('whose lead it is', () => {
  it('takes the listing agent when a card sent "unassigned"', () => {
    expect(
      resolveListingAgent({
        clientAgentSlug: 'unassigned',
        clientAgentName: '—',
        listing: { agentSlug: 'cactus', agentName: 'Cactus Real Estate' },
      })
    ).toEqual({ agentSlug: 'cactus', agentName: 'Cactus Real Estate' })
  })

  it('trusts the listing over a stale agent from a cached page', () => {
    expect(
      resolveListingAgent({
        clientAgentSlug: 'agent-1',
        clientAgentName: 'Elena Krasniqi',
        listing: { agentSlug: 'real-estate-al' },
      })
    ).toEqual({ agentSlug: 'real-estate-al', agentName: '—' })
  })

  it('keeps what the browser sent when the listing has no agent or was not found', () => {
    expect(
      resolveListingAgent({ clientAgentSlug: 'cactus', clientAgentName: 'Cactus', listing: null })
    ).toEqual({ agentSlug: 'cactus', agentName: 'Cactus' })
    expect(
      resolveListingAgent({ clientAgentSlug: 'unassigned', clientAgentName: '—', listing: {} })
    ).toEqual({ agentSlug: 'unassigned', agentName: '—' })
  })
})
