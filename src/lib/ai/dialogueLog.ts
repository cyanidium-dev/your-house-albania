/**
 * Transcript log for the assistant.
 *
 * The usage counter in `budget.ts` answers "what did this month cost"; this
 * answers "what are people actually asking". One Sanity document per
 * conversation, appended a turn at a time, readable in the Studio next to the
 * listings the questions are about.
 *
 * Three rules it lives by:
 *
 * - It never affects the visitor's answer. Every write runs in `after()`, once
 *   the response has finished streaming, and every failure is swallowed.
 * - It never grows without bound. A conversation stops appending at
 *   `MAX_LOGGED_TURNS`, and the daily cron in `/api/cron/prune-ai-dialogues`
 *   deletes documents untouched for `AI_DIALOGUE_RETENTION_DAYS`.
 * - It stores what visitors wrote, so the privacy policy has to say so. See
 *   the AI assistant section of the `privacy` landing page.
 */

import { getWriteClient } from '@/lib/sanity/writeClient'
import { sliceSafe } from './text'
import { estimateUsd, type TurnUsage } from './budget'

/** Days a conversation is kept before the cron deletes it. */
export const AI_DIALOGUE_RETENTION_DAYS = 90

/**
 * Exchanges written per conversation. Past this the counters still move, so a
 * long conversation is still visible as one, but the text stops accumulating —
 * 14 user turns is the UI ceiling, and the extra room covers nothing useful.
 */
const MAX_LOGGED_TURNS = 20

/** Longest stored answer, characters. Answers are short by design; this is a guard. */
const MAX_ANSWER_CHARS = 4000

/** Longest stored question. The route already caps input; this survives a change there. */
const MAX_QUESTION_CHARS = 2000

export type DialogueTurnInput = {
  /** Per-conversation id minted by the browser; the document id derives from it. */
  sessionId: string
  locale: string
  /** Which assistant the visitor was talking to. */
  surface: 'search' | 'property'
  /** Set when `surface` is `property`. */
  propertySlug?: string
  question: string
  answer: string
  /** Slugs the assistant put on screen as cards this turn. */
  shownSlugs: string[]
  /** Knowledge-base fact ids the assistant cited this turn. */
  citedIds: string[]
  usage: TurnUsage
  /** Two-letter country from the CDN edge, when it sends one. No IP is stored. */
  country?: string
  /**
   * Which exchange this is, counted from the conversation the browser sent.
   * Cheaper and race-free compared with reading the document back to find out.
   */
  turnIndex: number
}

/** Rejects anything that is not a browser-minted session id. */
export function isValidSessionId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z0-9]{8,64}$/.test(value)
}

export function dialogueDocId(sessionId: string): string {
  return `ai-dialogue-${sessionId}`
}

/** Off without a write token — the same condition the budget counter lives under. */
export function isDialogueLogEnabled(): boolean {
  if (process.env.AI_DIALOGUE_LOG === 'off') return false
  return Boolean(getWriteClient())
}

/**
 * Appends one question-and-answer exchange to its conversation.
 *
 * Create and patch go out as a single transaction: a `patch` alone fails on a
 * document that does not exist yet, and a separate create would double the
 * round trips on every first turn.
 */
export async function recordDialogueTurn(input: DialogueTurnInput): Promise<void> {
  if (!isDialogueLogEnabled()) return
  const client = getWriteClient()
  if (!client) return
  if (!isValidSessionId(input.sessionId)) return
  if (!input.question.trim()) return

  const now = new Date().toISOString()
  const id = dialogueDocId(input.sessionId)
  const usd = estimateUsd(input.usage)

  const base = {
    _id: id,
    _type: 'aiDialogue' as const,
    sessionId: input.sessionId,
    surface: input.surface,
    ...(input.propertySlug ? { propertySlug: input.propertySlug } : {}),
    locale: input.locale,
    ...(input.country ? { country: input.country } : {}),
    startedAt: now,
    updatedAt: now,
    turnCount: 0,
    estimatedUsd: 0,
    turns: [] as unknown[],
  }

  const entry = {
    _type: 'aiDialogueTurn',
    _key: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    at: now,
    question: sliceSafe(input.question, MAX_QUESTION_CHARS),
    answer: sliceSafe(input.answer, MAX_ANSWER_CHARS),
    ...(input.shownSlugs.length > 0 ? { shownSlugs: input.shownSlugs.slice(0, 12) } : {}),
    ...(input.citedIds.length > 0 ? { citedIds: input.citedIds.slice(0, 12) } : {}),
  }

  // Past the cap the counters still move, so the document keeps saying how
  // long the conversation ran; only the text stops being appended.
  const withinCap = input.turnIndex <= MAX_LOGGED_TURNS

  try {
    await client
      .transaction()
      .createIfNotExists(base)
      .patch(id, (patch) => {
        const patched = patch
          .setIfMissing({ turns: [] })
          .inc({ turnCount: 1, estimatedUsd: usd })
          .set({ updatedAt: now })
        return withinCap ? patched.insert('after', 'turns[-1]', [entry]) : patched
      })
      .commit({ visibility: 'async' })
  } catch (err) {
    // A lost transcript is a reporting problem. The visitor already has their
    // answer, and nothing downstream depends on this write.
    console.warn('[ai] dialogue log write failed:', err)
  }
}

/**
 * Deletes conversations last touched before the cutoff, oldest first, in
 * batches. Returns how many went. Used by the retention cron; exported so it
 * can also be run by hand.
 */
export async function pruneDialogues(
  now = new Date(),
  retentionDays = AI_DIALOGUE_RETENTION_DAYS,
): Promise<{ deleted: number }> {
  const client = getWriteClient()
  if (!client) return { deleted: 0 }
  const cutoff = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000).toISOString()
  const ids = await client.fetch<string[]>(
    '*[_type == "aiDialogue" && updatedAt < $cutoff] | order(updatedAt asc) [0...500]._id',
    { cutoff },
  )
  if (!Array.isArray(ids) || ids.length === 0) return { deleted: 0 }
  const tx = ids.reduce((acc, docId) => acc.delete(docId), client.transaction())
  await tx.commit({ visibility: 'async' })
  return { deleted: ids.length }
}
