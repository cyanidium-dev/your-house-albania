import { beforeEach, describe, expect, it, vi } from 'vitest'

/** Recording stand-in for the Sanity transaction the log builds. */
type PatchCall = { method: string; args: unknown[] }

const created: Record<string, unknown>[] = []
const patched: PatchCall[] = []
const commits: unknown[] = []
let clientPresent = true
let commitThrows = false

function makePatch() {
  const record = (method: string) => (...args: unknown[]) => {
    patched.push({ method, args })
    return patch
  }
  const patch = {
    setIfMissing: record('setIfMissing'),
    inc: record('inc'),
    set: record('set'),
    insert: record('insert'),
  }
  return patch
}

vi.mock('@/lib/sanity/writeClient', () => ({
  getWriteClient: () =>
    clientPresent
      ? {
          transaction: () => {
            const tx = {
              createIfNotExists: (doc: Record<string, unknown>) => {
                created.push(doc)
                return tx
              },
              patch: (_id: string, fn: (p: ReturnType<typeof makePatch>) => unknown) => {
                fn(makePatch())
                return tx
              },
              commit: async (opts: unknown) => {
                if (commitThrows) throw new Error('sanity is down')
                commits.push(opts)
              },
            }
            return tx
          },
        }
      : null,
}))

const { dialogueDocId, isValidSessionId, recordDialogueTurn } = await import('./dialogueLog')

const base = {
  sessionId: 'abc123def456',
  locale: 'ru',
  surface: 'search' as const,
  question: 'квартира у моря до 100к',
  answer: 'вот три варианта',
  shownSlugs: ['plazh-1br'],
  citedIds: ['DUR-RENT-1BR'],
  usage: { inputTokens: 1000, outputTokens: 200, cacheReadTokens: 0, cacheWriteTokens: 0 },
  turnIndex: 1,
}

beforeEach(() => {
  created.length = 0
  patched.length = 0
  commits.length = 0
  clientPresent = true
  commitThrows = false
  delete process.env.AI_DIALOGUE_LOG
})

describe('isValidSessionId', () => {
  it('accepts a browser-minted id', () => {
    expect(isValidSessionId('0f8c2b9a41d74e6b8f1a2c3d4e5f6071')).toBe(true)
  })

  it('rejects anything that could steer the document id', () => {
    expect(isValidSessionId('../siteSettings')).toBe(false)
    expect(isValidSessionId('drafts.abc12345')).toBe(false)
    expect(isValidSessionId('short')).toBe(false)
    expect(isValidSessionId('UPPER1234567')).toBe(false)
    expect(isValidSessionId(42)).toBe(false)
  })
})

describe('dialogueDocId', () => {
  it('namespaces the document', () => {
    expect(dialogueDocId('abc123def456')).toBe('ai-dialogue-abc123def456')
  })
})

describe('recordDialogueTurn', () => {
  it('creates the conversation and appends the exchange', async () => {
    await recordDialogueTurn(base)
    expect(created[0]).toMatchObject({
      _id: 'ai-dialogue-abc123def456',
      _type: 'aiDialogue',
      surface: 'search',
      locale: 'ru',
      turnCount: 0,
    })
    const insert = patched.find((call) => call.method === 'insert')
    expect(insert).toBeDefined()
    expect(insert?.args[2]).toMatchObject([
      { question: base.question, answer: base.answer, shownSlugs: ['plazh-1br'] },
    ])
    expect(commits).toHaveLength(1)
  })

  it('counts a long conversation but stops transcribing it', async () => {
    await recordDialogueTurn({ ...base, turnIndex: 21 })
    expect(patched.some((call) => call.method === 'inc')).toBe(true)
    expect(patched.some((call) => call.method === 'insert')).toBe(false)
  })

  it('writes nothing for a session id it does not recognise', async () => {
    await recordDialogueTurn({ ...base, sessionId: 'nope' })
    expect(commits).toHaveLength(0)
  })

  it('writes nothing when the log is switched off', async () => {
    process.env.AI_DIALOGUE_LOG = 'off'
    await recordDialogueTurn(base)
    expect(commits).toHaveLength(0)
  })

  it('writes nothing without a write token', async () => {
    clientPresent = false
    await recordDialogueTurn(base)
    expect(commits).toHaveLength(0)
  })

  it('skips an empty question rather than storing a blank exchange', async () => {
    await recordDialogueTurn({ ...base, question: '   ' })
    expect(commits).toHaveLength(0)
  })

  it('swallows a failed write — the visitor already has their answer', async () => {
    commitThrows = true
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await expect(recordDialogueTurn(base)).resolves.toBeUndefined()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
