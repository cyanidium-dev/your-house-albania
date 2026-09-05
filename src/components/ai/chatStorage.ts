/**
 * Keeps a conversation alive across navigation.
 *
 * The chat lived only in React state, so opening a listing from the answer and
 * pressing back threw the conversation away and — worse — re-sent the question
 * carried in `?q=`, charging for an answer the visitor had already read. This
 * stores each conversation under its own key for the length of the browser
 * session: `sessionStorage`, not `localStorage`, because a week-old search is
 * not a conversation anyone wants resumed.
 *
 * Persisted turns are inert: no pending or streaming flags survive, so a reload
 * during a reply restores what had arrived rather than a spinner that never
 * resolves.
 */

import type { PropertyHomes } from '@/types/propertyHomes'

export type StoredCardGroup = { items: PropertyHomes[]; catalogUrl?: string }

export type StoredTurn =
  | { role: 'user'; text: string }
  | { role: 'assistant'; text: string; cards: StoredCardGroup[] }

/** Version prefix: a shape change should drop old entries, not crash on them. */
const KEY_PREFIX = 'domlivo:ai-chat:v1:'

/**
 * Cards carry image URLs and descriptions, so a long conversation is the one
 * realistic way to hit the ~5MB session quota. Well under it, and old turns are
 * dropped from the front rather than losing the write.
 */
const MAX_BYTES = 300_000

export function chatStorageKey(propertySlug?: string): string {
  return propertySlug ? `${KEY_PREFIX}property:${propertySlug}` : `${KEY_PREFIX}search`
}

export function loadChat(propertySlug?: string): StoredTurn[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.sessionStorage.getItem(chatStorageKey(propertySlug))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isStoredTurn)
  } catch {
    // Blocked storage, private mode, or a half-written entry: start fresh.
    return []
  }
}

export function saveChat(turns: StoredTurn[], propertySlug?: string): void {
  if (typeof window === 'undefined') return
  const key = chatStorageKey(propertySlug)
  try {
    if (turns.length === 0) {
      window.sessionStorage.removeItem(key)
      return
    }
    let kept = turns
    let payload = JSON.stringify(kept)
    // Drop from the front — the newest exchange is the one worth keeping.
    while (payload.length > MAX_BYTES && kept.length > 2) {
      kept = kept.slice(2)
      payload = JSON.stringify(kept)
    }
    window.sessionStorage.setItem(key, payload)
  } catch {
    // Never let bookkeeping break the chat.
  }
}

export function clearChat(propertySlug?: string): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(chatStorageKey(propertySlug))
  } catch {
    // Nothing to do.
  }
}

function isStoredTurn(value: unknown): value is StoredTurn {
  if (!value || typeof value !== 'object') return false
  const turn = value as { role?: unknown; text?: unknown; cards?: unknown }
  if (typeof turn.text !== 'string') return false
  if (turn.role === 'user') return true
  if (turn.role !== 'assistant') return false
  return turn.cards === undefined || Array.isArray(turn.cards)
}

export const __testables = { isStoredTurn, MAX_BYTES }
