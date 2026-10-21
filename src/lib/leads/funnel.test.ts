import { describe, expect, it } from 'vitest'
import { computeFunnel, formatFunnel, formatWeeklySummary, messageLink, type FunnelLead } from './funnel'

const now = new Date('2026-10-26T07:00:00Z')
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000).toISOString()

function lead(id: string, over: Partial<FunnelLead>): FunnelLead {
  return { _id: `lead${id}xxxxxxxxxxxx`, type: 'property_inquiry', status: 'new', createdAt: daysAgo(1), ...over }
}

const leads: FunnelLead[] = [
  lead('01', { status: 'new', createdAt: daysAgo(1) }),
  lead('02', { status: 'new', createdAt: daysAgo(5), name: 'Anna', posts: [{ chatId: '-1003830946552', messageId: 77 }] }),
  lead('03', { status: 'contacted', createdAt: daysAgo(2), statusHistory: [{ status: 'contacted', at: daysAgo(1) }] }),
  lead('04', {
    status: 'lost',
    createdAt: daysAgo(6),
    statusHistory: [
      { status: 'contacted', at: daysAgo(5) },
      { status: 'viewing', at: daysAgo(3) },
      { status: 'lost', at: daysAgo(2) },
    ],
  }),
  lead('05', {
    status: 'won',
    createdAt: daysAgo(30),
    dealPrice: 120000,
    statusHistory: [
      { status: 'viewing', at: daysAgo(10) },
      { status: 'won', at: daysAgo(2) },
    ],
  }),
  lead('06', { status: 'spam', createdAt: daysAgo(2) }),
  lead('07', { status: 'new', createdAt: daysAgo(4), internal: true }),
  lead('08', { status: 'new', createdAt: daysAgo(4), type: 'registration' }),
]

describe('computeFunnel', () => {
  it('counts the cohort by the furthest stage and deals by when they closed', () => {
    const f = computeFunnel(leads, new Date(daysAgo(7)), now)
    expect(f.leads).toBe(4) // 01-04: spam, test and registration are out, 05 came in a month ago
    expect(f.byStage).toEqual({ contacted: 2, viewing: 1, negotiation: 0, won: 0 })
    expect(f.lost).toBe(1)
    expect(f.stillNew).toBe(2)
    expect(f.deals).toBe(1)
    expect(f.dealVolume).toBe(120000)
    expect(f.ownerShare).toBe(1200)
    expect(formatFunnel(f)).toContain('1 % владельца: 1 200 €')
  })

  it('flags a deal without a price', () => {
    const f = computeFunnel([lead('09', { status: 'won', statusUpdatedAt: daysAgo(1) })], new Date(daysAgo(7)), now)
    expect(f.deals).toBe(1)
    expect(f.dealsWithoutPrice).toBe(1)
    expect(f.ownerShare).toBe(0)
  })
})

describe('formatWeeklySummary', () => {
  const chat = '-1003830946552'
  it('lists the week and the leads without a status for more than three days', () => {
    const s = formatWeeklySummary(leads, chat, now)
    expect(s.text).toContain('Новых заявок: 4')
    expect(s.text).toContain('В работе: 1 (связались 1)')
    expect(s.text).toContain('Просмотров за неделю: 1')
    expect(s.text).toContain('Сделок за неделю: 1')
    expect(s.text).toContain('Без статуса больше 3 дней: 1')
    expect(s.text).toContain(`#L${'02xxxxxxxxxxxx'.slice(-6)}`)
    expect(s.text).toContain('Anna - https://t.me/c/3830946552/77')
    expect(s.text).not.toContain('€')
    expect(s.keyboard?.inline_keyboard.flat()).toHaveLength(1)
    expect(s.keyboard?.inline_keyboard[0][0].callback_data).toBe('lo:lead02xxxxxxxxxxxx')
  })

  it('says so when nothing is waiting', () => {
    const s = formatWeeklySummary([lead('01', { createdAt: daysAgo(1) })], chat, now)
    expect(s.text).toContain('старше 3 дней нет')
    expect(s.keyboard).toBeNull()
  })

  it('links only supergroups and channels', () => {
    expect(messageLink('-5422332960', 5)).toBeNull()
    expect(messageLink('-1003830946552', 5)).toBe('https://t.me/c/3830946552/5')
  })
})
