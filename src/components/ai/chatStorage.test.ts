import { beforeEach, describe, expect, it } from 'vitest'
import { chatStorageKey, clearChat, loadChat, saveChat, type StoredTurn } from './chatStorage'

/** Minimal sessionStorage so the module can be exercised in a node environment. */
function installStorage(impl?: Partial<Storage>) {
  const data = new Map<string, string>()
  const store: Storage = {
    get length() { return data.size },
    clear: () => data.clear(),
    key: (i: number) => [...data.keys()][i] ?? null,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => { data.set(k, v) },
    removeItem: (k: string) => { data.delete(k) },
    ...impl,
  }
  // @ts-expect-error minimal window for a node test
  globalThis.window = { sessionStorage: store }
  return data
}

const turns: StoredTurn[] = [
  { role: 'user', text: 'квартира у моря до 100к' },
  { role: 'assistant', text: 'вот варианты', cards: [{ items: [], catalogUrl: '/ru/catalog' }] },
]

beforeEach(() => { installStorage() })

describe('chatStorageKey', () => {
  it('separates the catalog conversation from each listing', () => {
    expect(chatStorageKey()).not.toBe(chatStorageKey('plazh-1br'))
    expect(chatStorageKey('a')).not.toBe(chatStorageKey('b'))
  })
})

describe('save and load', () => {
  it('round-trips a conversation', () => {
    saveChat(turns)
    expect(loadChat()).toEqual(turns)
  })

  it('keeps listing conversations apart from the search one', () => {
    saveChat(turns)
    saveChat([{ role: 'user', text: 'про этот объект' }], 'plazh-1br')
    expect(loadChat()).toEqual(turns)
    expect(loadChat('plazh-1br')).toEqual([{ role: 'user', text: 'про этот объект' }])
  })

  it('returns nothing when there is no entry', () => {
    expect(loadChat()).toEqual([])
  })

  it('drops a corrupted entry rather than throwing', () => {
    const data = installStorage()
    data.set(chatStorageKey(), '{ not json')
    expect(loadChat()).toEqual([])
  })

  it('filters entries that are not turns', () => {
    const data = installStorage()
    data.set(chatStorageKey(), JSON.stringify([{ role: 'user', text: 'ok' }, { role: 'nope' }, 42]))
    expect(loadChat()).toEqual([{ role: 'user', text: 'ok' }])
  })

  it('removes the entry when the conversation is emptied', () => {
    saveChat(turns)
    saveChat([])
    expect(loadChat()).toEqual([])
  })

  it('survives storage that throws, as private mode does', () => {
    installStorage({
      setItem: () => { throw new Error('blocked') },
      getItem: () => { throw new Error('blocked') },
    })
    expect(() => saveChat(turns)).not.toThrow()
    expect(loadChat()).toEqual([])
  })

  it('drops the oldest exchanges when the payload is too large', () => {
    const bulky = 'x'.repeat(80_000)
    const long: StoredTurn[] = []
    for (let i = 0; i < 8; i++) {
      long.push({ role: 'user', text: `вопрос ${i}` })
      long.push({ role: 'assistant', text: bulky, cards: [] })
    }
    saveChat(long)
    const restored = loadChat()
    expect(restored.length).toBeLessThan(long.length)
    // The newest exchange is the one worth keeping.
    expect(restored[restored.length - 2]).toEqual({ role: 'user', text: 'вопрос 7' })
  })
})

describe('clearChat', () => {
  it('forgets only the conversation asked for', () => {
    saveChat(turns)
    saveChat([{ role: 'user', text: 'про объект' }], 'plazh-1br')
    clearChat('plazh-1br')
    expect(loadChat('plazh-1br')).toEqual([])
    expect(loadChat()).toEqual(turns)
  })
})
