import { describe, expect, it } from 'vitest'
import {
  dealPricePrompt,
  formatEuro,
  formatLeadCard,
  leadBelongsToChat,
  leadCode,
  leadIdFromDealMarker,
  openCallbackData,
  parseDealPrice,
  parseLeadCallback,
  STATUS_BUTTONS,
  STATUS_MARK,
  statusCallbackData,
  statusKeyboard,
  statusLine,
  whoPressed,
  withStatusLine,
} from './status'

const ID = '1QlUgsV9fqcFtaZqLZACnO'

describe('callback data', () => {
  it('round-trips every button and stays under the 64-byte limit', () => {
    for (const b of STATUS_BUTTONS) {
      const data = statusCallbackData(ID, b.status)
      expect(new TextEncoder().encode(data).length).toBeLessThanOrEqual(64)
      expect(parseLeadCallback(data)).toEqual({ kind: 'status', leadId: ID, status: b.status })
    }
    expect(parseLeadCallback(openCallbackData(ID))).toEqual({ kind: 'open', leadId: ID })
  })

  it('refuses unknown codes, drafts and junk', () => {
    expect(parseLeadCallback('ls:x:' + ID)).toBeNull()
    expect(parseLeadCallback('ls:w:drafts.' + ID)).toBeNull()
    expect(parseLeadCallback('ls:w:*[_type]')).toBeNull()
    expect(parseLeadCallback('')).toBeNull()
    expect(parseLeadCallback(undefined)).toBeNull()
  })
})

describe('keyboard and status line', () => {
  it('has six buttons in two rows and marks the current status', () => {
    const kb = statusKeyboard(ID, 'viewing')
    expect(kb.inline_keyboard.map((r) => r.length)).toEqual([3, 3])
    const labels = kb.inline_keyboard.flat().map((b) => b.text)
    expect(labels).toEqual(['Связался', '• Просмотр', 'Торг', 'Сделка ✅', 'Отказ', 'Спам'])
  })

  it('shows status, who, when, price and the lead number', () => {
    const line = statusLine({
      leadId: ID,
      status: 'won',
      by: 'Ivan (@ivan)',
      at: new Date('2026-10-21T12:05:00Z'),
      price: 85000,
    })
    expect(line).toBe(`${STATUS_MARK}✅ сделка, 85 000 € - Ivan (@ivan), 21.10 14:05 · #LLZACnO`)
    expect(leadCode(ID)).toBe("LLZACnO")
  })

  it('replaces the previous status block and keeps the entities before it', () => {
    const original = 'Новая заявка\nИмя: Анна'
    const entities = [{ type: 'bold', offset: 0, length: 12 }]
    const first = withStatusLine(original, entities, statusLine({ leadId: ID, status: 'new' }))
    expect(first.text).toBe(`${original}\n\n${STATUS_MARK}🆕 новая · #LLZACnO`)
    const second = withStatusLine(first.text, [...first.entities, { type: 'hashtag', offset: first.text.length - 7, length: 7 }], 'X')
    expect(second.text).toBe(`${original}\n\nX`)
    expect(second.entities).toEqual(entities)
  })

  it('fits Telegram length limits', () => {
    const long = 'a'.repeat(5000)
    expect(withStatusLine(long, [], 'line').text.length).toBeLessThanOrEqual(4096)
  })

  it('names who pressed', () => {
    expect(whoPressed({ first_name: 'Ivan', last_name: 'P', username: 'ivan' })).toBe('Ivan P (@ivan)')
    expect(whoPressed({ username: 'ivan' })).toBe('@ivan')
    expect(whoPressed(undefined, 'Канал')).toBe('Канал')
  })
})

describe('deal price', () => {
  it('reads what partners type', () => {
    expect(parseDealPrice('85000')).toBe(85000)
    expect(parseDealPrice('85 000 €')).toBe(85000)
    expect(parseDealPrice('85.000')).toBe(85000)
    expect(parseDealPrice('1,250,000 EUR')).toBe(1250000)
    expect(parseDealPrice('120k')).toBe(120000)
    expect(parseDealPrice('120 тыс')).toBe(120000)
    expect(parseDealPrice('1,2 млн')).toBe(1200000)
    expect(parseDealPrice('€ 99 500')).toBe(99500)
  })

  it('refuses text and implausible amounts', () => {
    expect(parseDealPrice('договорились')).toBeNull()
    expect(parseDealPrice('85')).toBeNull()
    expect(parseDealPrice('85000 или 90000')).toBeNull()
    expect(parseDealPrice('999999999999')).toBeNull()
  })

  it('carries the lead id in the question', () => {
    expect(leadIdFromDealMarker(dealPricePrompt(ID))).toBe(ID)
    expect(leadIdFromDealMarker('#tg12345')).toBeNull()
    expect(formatEuro(1234567)).toBe('1 234 567 €')
  })
})

describe('which chat a lead belongs to', () => {
  const general = '-1003830946552'
  it('an agency lead belongs to the agency group only', () => {
    const lead = { agentChat: '-5422332960' }
    expect(leadBelongsToChat(lead, '-5422332960', general)).toBe(true)
    expect(leadBelongsToChat(lead, general, general)).toBe(false)
  })
  it('any other lead belongs to the main chat, or wherever the bot posted it', () => {
    expect(leadBelongsToChat({}, general, general)).toBe(true)
    expect(leadBelongsToChat({}, '-5422332960', general)).toBe(false)
    expect(leadBelongsToChat({ posts: [{ chatId: '-5422332960', messageId: 3 }] }, '-5422332960', general)).toBe(true)
  })
})

describe('lead card', () => {
  it('keeps the visitor marker so a reply reaches them', () => {
    const card = formatLeadCard({
      _id: ID,
      type: 'telegram_start',
      status: 'new',
      createdAt: '2026-10-18T10:00:00Z',
      name: 'Anna',
      telegramUserId: '123456',
      telegramUsername: 'anna',
      propertyTitle: 'Квартира в Дурресе',
      propertySlug: 'flat-durres',
    })
    expect(card).toContain('Заявка от 18.10 (бот Telegram)')
    expect(card).toContain('Объект: Квартира в Дурресе (flat-durres)')
    expect(card.endsWith('#tg123456')).toBe(true)
  })
})
