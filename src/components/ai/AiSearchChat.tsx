'use client'

import { Icon } from '@iconify/react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import PropertyCard from '@/components/shared/property/PropertyCard'
import { cn } from '@/lib/utils'
import { parseAiEvent, type AiChatMessage, type AiErrorCode } from '@/lib/ai/events'
import { AI_MAX_MESSAGE_CHARS, AI_MAX_TURNS } from '@/lib/ai/limits'
import { track } from '@/lib/analytics/track'
import type { PropertyHomes } from '@/types/propertyHomes'

type CardGroup = { items: PropertyHomes[]; catalogUrl?: string }

type Turn =
  | { role: 'user'; text: string }
  | {
      role: 'assistant'
      text: string
      cards: CardGroup[]
      pending: boolean
      searching: boolean
      /**
       * The model writes once before a tool call and again after it. Without a
       * separator the two runs collide mid-sentence ("in Durrës:Would you
       * like…"), so a tool call marks the next text as a new paragraph.
       */
      breakBeforeNextText: boolean
    }

function isAssistant(turn: Turn): turn is Extract<Turn, { role: 'assistant' }> {
  return turn.role === 'assistant'
}

/** Replaces the trailing assistant turn — the only one a stream ever mutates. */
function patchLastAssistant(
  turns: Turn[],
  patch: (turn: Extract<Turn, { role: 'assistant' }>) => Extract<Turn, { role: 'assistant' }>,
): Turn[] {
  const index = turns.length - 1
  const last = turns[index]
  if (!last || !isAssistant(last)) return turns
  const next = turns.slice()
  next[index] = patch(last)
  return next
}

/**
 * Closes the trailing assistant turn. A turn that produced neither text nor
 * cards — an aborted stream, or an error before the first token — is dropped
 * rather than left as an empty avatar above the error banner.
 */
function settleLastAssistant(turns: Turn[]): Turn[] {
  const index = turns.length - 1
  const last = turns[index]
  if (!last || !isAssistant(last)) return turns
  if (!last.text.trim() && last.cards.length === 0) return turns.slice(0, index)
  return patchLastAssistant(turns, (turn) => ({ ...turn, pending: false, searching: false }))
}

export default function AiSearchChat({
  locale,
  initialQuery,
  entry = 'direct',
  propertySlug,
}: {
  locale: string
  /** Question carried over from the home hero; sent automatically on mount. */
  initialQuery?: string
  /** Where the visitor arrived from, for the analytics event on mount. */
  entry?: 'hero' | 'header' | 'direct'
  /**
   * When set, the conversation is about this one listing: the route loads its
   * facts and zone figures, and the prompts and suggestions change with it.
   */
  propertySlug?: string
}) {
  const t = useTranslations('AiSearch')
  const aboutProperty = Boolean(propertySlug)
  const key = (name: string) => (aboutProperty ? `property.${name}` : name)
  const [turns, setTurns] = useState<Turn[]>([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [errorCode, setErrorCode] = useState<AiErrorCode | null>(null)

  const abortRef = useRef<AbortController | null>(null)
  const autoSentRef = useRef(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const userTurns = useMemo(() => turns.filter((turn) => turn.role === 'user').length, [turns])
  const limitReached = userTurns >= AI_MAX_TURNS

  const suggestions = useMemo(() => {
    const raw = t.raw(aboutProperty ? 'property.examples' : 'examples')
    return Array.isArray(raw) ? raw.filter((e): e is string => typeof e === 'string') : []
  }, [t, aboutProperty])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [turns])

  useEffect(() => () => abortRef.current?.abort(), [])

  const openTracked = useRef(false)
  useEffect(() => {
    if (openTracked.current) return
    openTracked.current = true
    track({ event: 'ai_search_open', entry })
  }, [entry])

  const send = useCallback(
    async (text: string) => {
      const question = text.trim().slice(0, AI_MAX_MESSAGE_CHARS)
      if (!question || busy) return

      setErrorCode(null)
      setBusy(true)
      setDraft('')
      track({
        event: 'ai_search_query',
        queryLength: question.length,
        turn: turns.filter((t) => t.role === 'user').length + 1,
      })
      let cardsThisTurn = 0

      // The model only needs the prose of the conversation: cards it produced
      // are described by the text around them, and replaying tool blocks would
      // bloat every request for nothing.
      const history: AiChatMessage[] = turns
        .map((turn) =>
          turn.role === 'user'
            ? { role: 'user' as const, content: turn.text }
            : { role: 'assistant' as const, content: turn.text },
        )
        .filter((m) => m.content.trim().length > 0)

      setTurns((prev) => [
        ...prev,
        { role: 'user', text: question },
        { role: 'assistant', text: '', cards: [], pending: true, searching: false, breakBeforeNextText: false },
      ])

      const controller = new AbortController()
      abortRef.current = controller

      try {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            locale,
            propertySlug,
            messages: [...history, { role: 'user', content: question }],
          }),
          signal: controller.signal,
        })

        if (!response.body) {
          setErrorCode('failed')
          return
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })

          const frames = buffer.split('\n\n')
          buffer = frames.pop() ?? ''

          for (const frame of frames) {
            for (const line of frame.split('\n')) {
              const event = parseAiEvent(line)
              if (!event) continue

              if (event.type === 'text') {
                setTurns((prev) =>
                  patchLastAssistant(prev, (turn) => {
                    const separator = turn.breakBeforeNextText && turn.text.trim() ? '\n\n' : ''
                    return {
                      ...turn,
                      text: turn.text + separator + event.delta,
                      pending: false,
                      searching: false,
                      breakBeforeNextText: false,
                    }
                  }),
                )
              } else if (event.type === 'tool_start') {
                setTurns((prev) =>
                  patchLastAssistant(prev, (turn) => ({
                    ...turn,
                    searching: true,
                    breakBeforeNextText: true,
                  })),
                )
              } else if (event.type === 'cards') {
                cardsThisTurn += event.items.length
                setTurns((prev) =>
                  patchLastAssistant(prev, (turn) => ({
                    ...turn,
                    pending: false,
                    searching: false,
                    cards: [...turn.cards, { items: event.items, catalogUrl: event.catalogUrl }],
                  })),
                )
              } else if (event.type === 'error') {
                setErrorCode(event.code)
              }
            }
          }
        }
      } catch (err) {
        if ((err as Error)?.name !== 'AbortError') setErrorCode('failed')
      } finally {
        abortRef.current = null
        setBusy(false)
        setTurns(settleLastAssistant)
        // Zero cards is the "nothing in the catalog matches" case, which is the
        // most useful signal this feature produces.
        track({ event: 'ai_search_result', cards: cardsThisTurn, hadResults: cardsThisTurn > 0 })
      }
    },
    [busy, locale, propertySlug, turns],
  )

  useEffect(() => {
    const question = initialQuery?.trim()
    if (!question || autoSentRef.current) return
    autoSentRef.current = true
    void send(question)
    // `send` closes over `turns`, which is empty on mount — exactly what the
    // first message needs. Re-running on its identity would resend the query.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery])

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    void send(draft)
  }

  function restart() {
    abortRef.current?.abort()
    setTurns([])
    setDraft('')
    setErrorCode(null)
  }

  const showIntro = turns.length === 0 && !busy

  return (
    <div className="flex min-h-[60vh] flex-col gap-6">
      <div className="flex-1 space-y-8" aria-live="polite">
        {showIntro ? (
          <div className="rounded-2xl border border-dark/10 bg-white p-6 dark:border-white/10 dark:bg-white/5 sm:p-8">
            <p className="text-lg font-semibold text-dark dark:text-white">{t(key('intro.title'))}</p>
            <p className="mt-2 text-dark/70 dark:text-white/70">{t(key('intro.body'))}</p>
            {suggestions.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => void send(suggestion)}
                    className={cn(
                      'cursor-pointer rounded-full border border-dark/15 px-4 py-2 text-sm text-dark/80',
                      'transition-colors duration-200 hover:border-primary hover:text-primary',
                      'dark:border-white/20 dark:text-white/80 dark:hover:border-primary',
                    )}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {turns.map((turn, index) =>
          turn.role === 'user' ? (
            <div key={`u-${index}`} className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-white">
                {turn.text}
              </p>
            </div>
          ) : (
            <div key={`a-${index}`} className="space-y-4">
              <div className="flex gap-3">
                <span
                  className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                  aria-hidden
                >
                  <Icon icon="ph:sparkle" width={18} height={18} />
                </span>
                <div className="min-w-0 flex-1">
                  {turn.text ? (
                    <p className="whitespace-pre-wrap text-dark dark:text-white">{turn.text}</p>
                  ) : null}
                  {turn.pending || turn.searching ? (
                    <p className="flex items-center gap-2 text-dark/60 dark:text-white/60">
                      <Icon icon="ph:circle-notch" className="animate-spin" width={16} height={16} aria-hidden />
                      {turn.searching ? t('status.searching') : t('status.thinking')}
                    </p>
                  ) : null}
                </div>
              </div>

              {turn.cards.map((group, groupIndex) => (
                <div key={`c-${index}-${groupIndex}`} className="space-y-4 pl-11">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {group.items.map((item) => (
                      // The card renders its own link; the click bubbles here.
                      <div
                        key={item.slug}
                        onClick={() => track({ event: 'ai_card_click', slug: item.slug })}
                      >
                        <PropertyCard item={item} locale={locale} view="small" />
                      </div>
                    ))}
                  </div>
                  {group.catalogUrl ? (
                    <Link
                      href={group.catalogUrl}
                      onClick={() => track({ event: 'ai_catalog_click' })}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-full border border-primary px-5 py-2.5',
                        'text-sm font-semibold text-primary transition-colors duration-200',
                        'hover:bg-primary hover:text-white',
                      )}
                    >
                      {t('seeAllInCatalog')}
                      <Icon icon="ph:arrow-right" width={16} height={16} aria-hidden />
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          ),
        )}
        <div ref={bottomRef} />
      </div>

      {errorCode ? (
        <p
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-700 dark:text-red-300"
        >
          {t(`errors.${errorCode}`)}
        </p>
      ) : null}

      <div className="sticky bottom-0 -mx-4 border-t border-dark/10 bg-white/95 px-4 py-4 backdrop-blur-md dark:border-white/10 dark:bg-black/90 sm:mx-0 sm:rounded-2xl sm:border sm:px-4">
        {limitReached ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-dark/70 dark:text-white/70">{t('errors.too_many_turns')}</p>
            <button
              type="button"
              onClick={restart}
              className="cursor-pointer rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white"
            >
              {t('restart')}
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex items-center gap-2">
            <label htmlFor="ai-chat-input" className="sr-only">
              {t(key('chatPlaceholder'))}
            </label>
            <input
              id="ai-chat-input"
              type="text"
              value={draft}
              maxLength={AI_MAX_MESSAGE_CHARS}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t(key('chatPlaceholder'))}
              autoComplete="off"
              enterKeyHint="send"
              disabled={busy}
              className={cn(
                'min-w-0 flex-1 rounded-full border border-dark/15 bg-transparent px-5 py-3 outline-none',
                'text-dark placeholder:text-dark/45 focus:border-primary',
                'dark:border-white/20 dark:text-white dark:placeholder:text-white/45',
                'disabled:opacity-60',
              )}
            />
            <button
              type="submit"
              disabled={busy || draft.trim().length === 0}
              aria-label={t('submit')}
              className={cn(
                'inline-flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full',
                'bg-primary text-white transition-colors duration-200',
                'hover:bg-dark disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-white dark:hover:text-dark',
              )}
            >
              <Icon
                icon={busy ? 'ph:circle-notch' : 'ph:paper-plane-tilt'}
                className={busy ? 'animate-spin' : undefined}
                width={20}
                height={20}
                aria-hidden
              />
            </button>
          </form>
        )}
        <p className="mt-2 px-2 text-xs text-dark/50 dark:text-white/50">{t('disclaimer')}</p>
      </div>
    </div>
  )
}
