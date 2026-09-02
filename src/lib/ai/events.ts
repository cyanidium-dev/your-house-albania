/**
 * The wire contract between the assistant route and the chat UI.
 *
 * Server-sent events rather than plain text, because a tool result is two
 * things at once: input for the model's next turn, and the payload the browser
 * renders as property cards. A text-only stream would force the UI to parse
 * listings back out of prose.
 */

import type { PropertyHomes } from '@/types/propertyHomes'

export type AiChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type AiChatRequest = {
  locale: string
  messages: AiChatMessage[]
}

export type AiErrorCode =
  | 'unavailable'
  | 'rate_limited'
  | 'too_long'
  | 'too_many_turns'
  /** The month's spend ceiling is reached; the assistant is off until it resets. */
  | 'budget_exhausted'
  | 'failed'

export type AiStreamEvent =
  /** A chunk of the answer, appended as it arrives. */
  | { type: 'text'; delta: string }
  /** The model started a tool call — the UI shows a searching state. */
  | { type: 'tool_start'; name: string }
  /** Listings to render as cards, plus an optional "see all" catalog link. */
  | { type: 'cards'; items: PropertyHomes[]; catalogUrl?: string }
  /** Turn finished cleanly. */
  | { type: 'done' }
  | { type: 'error'; code: AiErrorCode; retryAfterSec?: number }

export function encodeAiEvent(event: AiStreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`
}

/**
 * Parses one SSE `data:` line. Returns null for anything unrecognised so a
 * malformed frame degrades to "ignored" instead of throwing inside the reader.
 */
export function parseAiEvent(line: string): AiStreamEvent | null {
  if (!line.startsWith('data:')) return null
  const raw = line.slice(5).trim()
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as AiStreamEvent
    return typeof parsed?.type === 'string' ? parsed : null
  } catch {
    return null
  }
}
