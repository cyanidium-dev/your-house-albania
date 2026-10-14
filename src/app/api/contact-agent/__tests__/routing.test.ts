import { beforeEach, describe, expect, it, vi } from 'vitest'

// Nothing leaves the test: Telegram delivery and the Sanity write are mocked,
// so checking the routing never sends a message to an agency's group.
const deliver = vi.fn(async () => ({ ok: true as const }))
const createLead = vi.fn(async () => ({ ok: true as const, id: 'lead-test' }))
const lookupLeadProperty = vi.fn()
const fetchAgentLeadChatId = vi.fn(async () => null)

vi.mock('server-only', () => ({}))
vi.mock('@/lib/notifications/agentContact/telegramDelivery', () => ({ deliverAgentContactTelegram: deliver }))
vi.mock('@/lib/leads/createLead', () => ({ createLead, lookupLeadProperty }))
vi.mock('@/lib/notifications/agentContact/routing', () => ({
  resolveAgentContactTelegramRouting: () => ({ generalChatId: '-1001111111111' }),
}))
vi.mock('@/lib/notifications/leads/leadRecipients', async (orig) => ({
  ...(await orig<typeof import('@/lib/notifications/leads/leadRecipients')>()),
  fetchAgentLeadChatId,
}))

const { POST } = await import('../route')

function post(body: Record<string, unknown>) {
  return POST(
    new Request('http://localhost/api/contact-agent', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Routing test',
        phone: '+355 69 000 0000',
        email: 'routing@example.com',
        message: 'Routing test',
        locale: 'it',
        ...body,
      }),
    })
  )
}

describe('contact-agent routing', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sends a card enquiry ("unassigned") on a Cactus listing to the Cactus group', async () => {
    lookupLeadProperty.mockResolvedValue({
      id: 'p1',
      slug: 'casa-valona',
      agentSlug: 'cactus',
      agentName: 'Cactus Real Estate',
      agentLeadChatId: '-5422332960',
    })
    const res = await post({ agentSlug: 'unassigned', propertySlug: 'casa-valona-280m2', placement: 'property-card' })
    expect(res.status).toBe(200)
    expect(deliver).toHaveBeenCalledTimes(1)
    const [normalized, , options] = deliver.mock.calls[0] as unknown as [
      { agentSlug: string; agentName: string },
      unknown,
      { agentChatId: string | null },
    ]
    expect(options.agentChatId).toBe('-5422332960')
    expect(normalized.agentSlug).toBe('cactus')
    expect(normalized.agentName).toBe('Cactus Real Estate')
  })

  it('keeps a listing without an agent on the main group', async () => {
    lookupLeadProperty.mockResolvedValue({ id: 'p2', slug: 'flat' })
    await post({ agentSlug: 'unassigned', propertySlug: 'flat' })
    const [, , options] = deliver.mock.calls[0] as unknown as [unknown, unknown, { agentChatId: string | null }]
    expect(options.agentChatId).toBeNull()
  })
})
