import { beforeEach, describe, expect, it, vi } from 'vitest'

// Nothing leaves the test: the Bot API and Sanity are fakes.
const TOKEN = '777000:test-token'
const BOT_ID = 777000
const GENERAL = '-1003830946552'
const CACTUS = '-5422332960'
const ID = '1QlUgsV9fqcFtaZqLZACnO'

type Call = { method: string; body: Record<string, unknown> }
const calls: Call[] = []
const botCall = vi.fn(async (_token: string, method: string, body: Record<string, unknown>) => {
  calls.push({ method, body })
  return { ok: true as const, result: { message_id: 900 } }
})

type Patch = { id: string; set: Record<string, unknown>; append: [string, unknown[]][] }
const patches: Patch[] = []
let leadRow: Record<string, unknown> | null = null
let failCommit = false
const client = {
  fetch: vi.fn(async () => leadRow),
  patch: (id: string) => {
    const p: Patch = { id, set: {}, append: [] }
    const chain = {
      set: (v: Record<string, unknown>) => ((p.set = { ...p.set, ...v }), chain),
      setIfMissing: () => chain,
      append: (path: string, items: unknown[]) => (p.append.push([path, items]), chain),
      commit: async () => {
        if (failCommit) throw new Error('boom')
        patches.push(p)
        return {}
      },
    }
    return chain
  },
}

vi.mock('server-only', () => ({}))
vi.mock('@/lib/sanity/writeClient', () => ({ getWriteClient: () => client }))
vi.mock('@/lib/notifications/agentContact/routing', () => ({
  resolveAgentContactTelegramRouting: () => ({ generalChatId: GENERAL }),
  resolveTelegramBotToken: () => undefined,
}))
vi.mock('./api', () => ({
  botCall,
  botUserId: () => BOT_ID,
  publicBotToken: () => TOKEN,
}))
// handleUpdate's other collaborators: never reached by these updates.
vi.mock('@/lib/analytics/posthogServer', () => ({ capturePostHogServer: vi.fn() }))
vi.mock('@/lib/leads/createLead', () => ({ createLead: vi.fn() }))
vi.mock('./data', () => ({ latestBotLead: vi.fn(), loadBotTexts: vi.fn(), lookupBotListing: vi.fn() }))
vi.mock('./search', () => ({}))

const { handleTelegramUpdate } = await import('./handleUpdate')

const manager = { id: 42, first_name: 'Viktor', username: 'viktor' }
const leadMessage = (chatId: string, text: string) => ({
  message_id: 10,
  from: { id: BOT_ID, is_bot: true },
  chat: { id: Number(chatId), type: 'supergroup' as const },
  text,
  entities: [{ type: 'bold', offset: 0, length: 5 }],
})

function press(data: string, chatId = GENERAL, text = 'Заявка\nИмя: Анна\n\n📌 Статус: 🆕 новая · #LLZACnO') {
  return handleTelegramUpdate(
    { update_id: 1, callback_query: { id: 'cq1', from: manager, data, message: leadMessage(chatId, text) } },
    TOKEN,
  )
}

const sent = (method: string) => calls.filter((c) => c.method === method)

beforeEach(() => {
  calls.length = 0
  patches.length = 0
  failCommit = false
  leadRow = { _id: ID, type: 'property_inquiry', status: 'new', createdAt: '2026-10-20T10:00:00Z', agentChat: null, posts: null }
  vi.clearAllMocks()
})

describe('status buttons', () => {
  it('"Связался" saves status, who and when, rewrites the status line and tells only the presser', async () => {
    await press(`ls:c:${ID}`)
    expect(patches).toHaveLength(1)
    expect(patches[0].id).toBe(ID)
    expect(patches[0].set).toMatchObject({ status: 'contacted', statusUpdatedBy: 'Viktor (@viktor)' })
    expect(typeof patches[0].set.statusUpdatedAt).toBe('string')
    const [path, [entry]] = patches[0].append[0] as [string, Record<string, unknown>[]]
    expect(path).toBe('statusHistory')
    expect(entry).toMatchObject({ status: 'contacted', from: 'new', by: 'Viktor (@viktor)', chatId: GENERAL })

    const [edit] = sent('editMessageText')
    expect(edit.body.text).toMatch(/^Заявка\nИмя: Анна\n\n📌 Статус: 📞 связался - Viktor \(@viktor\), .* · #LLZACnO$/)
    expect(edit.body.entities).toEqual([{ type: 'bold', offset: 0, length: 5 }])
    const labels = (edit.body.reply_markup as { inline_keyboard: { text: string }[][] }).inline_keyboard.flat()
    expect(labels.map((b) => b.text)).toContain('• Связался')
    expect(sent('answerCallbackQuery')[0].body.text).toBe('Статус: 📞 связался')
    // Nothing goes to the client: the only message sent is none at all.
    expect(sent('sendMessage')).toHaveLength(0)
    expect(sent('copyMessage')).toHaveLength(0)
  })

  it('"Сделка ✅" asks for the price as a reply to the lead message', async () => {
    await press(`ls:w:${ID}`)
    expect(patches[0].set.status).toBe('won')
    const [ask] = sent('sendMessage')
    expect(ask.body.chat_id).toBe(Number(GENERAL))
    expect(ask.body.text).toContain(`#deal${ID}`)
    expect(ask.body.reply_parameters).toMatchObject({ message_id: 10 })
    expect(ask.body.reply_markup).toMatchObject({ force_reply: true })
  })

  it('does not ask again when the price is known', async () => {
    leadRow = { ...leadRow, dealPrice: 90000 }
    await press(`ls:w:${ID}`)
    expect(sent('sendMessage')).toHaveLength(0)
    expect(sent('editMessageText')[0].body.text).toContain('90 000 €')
  })

  it("refuses a lead of another partner's chat", async () => {
    leadRow = { ...leadRow, agentChat: CACTUS }
    await press(`ls:s:${ID}`, GENERAL)
    expect(patches).toHaveLength(0)
    expect(sent('editMessageText')).toHaveLength(0)
    expect(sent('answerCallbackQuery')[0].body).toMatchObject({ show_alert: true })
  })

  it('works in the agency group for its own lead', async () => {
    leadRow = { ...leadRow, agentChat: CACTUS }
    await press(`ls:v:${ID}`, CACTUS)
    expect(patches[0].set.status).toBe('viewing')
  })

  it('keeps the message as it was when Sanity fails', async () => {
    failCommit = true
    await press(`ls:c:${ID}`)
    expect(sent('editMessageText')).toHaveLength(0)
    expect(sent('answerCallbackQuery')[0].body).toMatchObject({ text: 'Не сохранилось, нажмите ещё раз.' })
  })

  it('ignores forged or foreign callback data', async () => {
    await press('ls:w:*[_type=="lead"]')
    expect(client.fetch).not.toHaveBeenCalled()
    expect(sent('answerCallbackQuery')).toHaveLength(1)
  })

  it('a number in the weekly list posts the lead again with its buttons', async () => {
    leadRow = { ...leadRow, name: 'Anna', phone: '+355690000000' }
    await press(`lo:${ID}`, GENERAL, '📊 Заявки за неделю')
    const [card] = sent('sendMessage')
    expect(card.body.chat_id).toBe(GENERAL)
    expect(card.body.text).toContain('Телефон: +355690000000')
    expect(card.body.text).toContain('📌 Статус: 🆕 новая')
    expect((card.body.reply_markup as { inline_keyboard: unknown[][] }).inline_keyboard).toHaveLength(2)
  })
})

describe('deal price reply', () => {
  const question = {
    message_id: 11,
    from: { id: BOT_ID, is_bot: true },
    chat: { id: Number(GENERAL), type: 'supergroup' as const },
    text: `💰 Сделка по заявке #LLZACnO.\nОтветьте на это сообщение ценой сделки в евро, например 85000.\n#deal${ID}`,
  }
  const reply = (text: string) =>
    handleTelegramUpdate(
      {
        update_id: 2,
        message: { message_id: 12, from: manager, chat: { id: Number(GENERAL), type: 'supergroup' }, text, reply_to_message: question },
      },
      TOKEN,
    )

  it('saves the price and confirms in the chat, never to the client', async () => {
    await reply('85 000 €')
    expect(patches[0].set).toMatchObject({ dealPrice: 85000, dealCurrency: 'EUR', dealPriceBy: 'Viktor (@viktor)' })
    const [confirm] = sent('sendMessage')
    expect(confirm.body.chat_id).toBe(Number(GENERAL))
    expect(confirm.body.text).toBe('Записал цену сделки #LLZACnO: 85 000 €.')
  })

  it('asks again on text it cannot read', async () => {
    await reply('договорились')
    expect(patches).toHaveLength(0)
    expect(sent('sendMessage')[0].body.text).toContain('Не понял цену')
  })

  it('reads the answer in a channel too', async () => {
    await handleTelegramUpdate(
      {
        update_id: 3,
        channel_post: {
          message_id: 13,
          chat: { id: Number(GENERAL), type: 'channel' },
          text: '120k',
          reply_to_message: { ...question, from: undefined, chat: { id: Number(GENERAL), type: 'channel' } },
        },
      },
      TOKEN,
    )
    expect(patches[0].set.dealPrice).toBe(120000)
  })

  it('still relays an ordinary reply on a lead message to the visitor', async () => {
    await handleTelegramUpdate(
      {
        update_id: 4,
        message: {
          message_id: 14,
          from: manager,
          chat: { id: Number(GENERAL), type: 'supergroup' },
          text: 'Здравствуйте!',
          reply_to_message: { ...question, text: 'Заявка\n#tg123456\n\n📌 Статус: 🆕 новая · #LLZACnO' },
        },
      },
      TOKEN,
    )
    expect(patches).toHaveLength(0)
    expect(sent('sendMessage')[0].body).toMatchObject({ chat_id: 123456, text: 'Здравствуйте!' })
  })
})
