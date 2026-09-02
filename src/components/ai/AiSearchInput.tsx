'use client'

import { Icon } from '@iconify/react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { cn } from '@/lib/utils'
import { AI_MAX_MESSAGE_CHARS } from '@/lib/ai/limits'
import { aiSearchPath } from '@/lib/ai/routes'

/** How long each example stays in the placeholder, milliseconds. */
const ROTATE_MS = 4200

/**
 * The plain-language entry point on the home hero.
 *
 * It does not answer anything itself: a submit hands the question to the
 * dedicated assistant page, which is where the conversation belongs. Keeping
 * the hero free of chat state also keeps the homepage a server component.
 */
export default function AiSearchInput({ locale }: { locale: string }) {
  const t = useTranslations('AiSearch')
  const router = useRouter()
  const [value, setValue] = useState('')
  const [exampleIndex, setExampleIndex] = useState(0)

  const examples = useMemo(() => {
    const raw = t.raw('examples')
    return Array.isArray(raw) ? raw.filter((e): e is string => typeof e === 'string') : []
  }, [t])

  const reduceMotion = useRef(false)

  useEffect(() => {
    reduceMotion.current =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion.current || examples.length < 2) return
    const id = window.setInterval(() => {
      setExampleIndex((i) => (i + 1) % examples.length)
    }, ROTATE_MS)
    return () => window.clearInterval(id)
  }, [examples.length])

  const placeholder = examples[exampleIndex] ?? t('inputFallbackPlaceholder')

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const query = value.trim()
    if (!query) {
      router.push(aiSearchPath(locale))
      return
    }
    router.push(`${aiSearchPath(locale)}?q=${encodeURIComponent(query.slice(0, AI_MAX_MESSAGE_CHARS))}`)
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-2xl" role="search">
      <label htmlFor="ai-search-hero" className="sr-only">
        {t('inputLabel')}
      </label>
      <div
        className={cn(
          'group flex items-center gap-2 rounded-full py-2 pl-4 pr-2 sm:pl-5',
          'bg-white/95 dark:bg-dark/90 backdrop-blur-md',
          'border border-white/40 dark:border-white/15 shadow-lg',
          'focus-within:border-primary/60 transition-colors duration-200',
        )}
      >
        <Icon
          icon="ph:sparkle"
          width={22}
          height={22}
          className="shrink-0 text-primary"
          aria-hidden
        />
        <input
          id="ai-search-hero"
          type="text"
          value={value}
          maxLength={AI_MAX_MESSAGE_CHARS}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          enterKeyHint="search"
          className={cn(
            'min-w-0 flex-1 bg-transparent py-2 text-base outline-none',
            'text-dark dark:text-white placeholder:text-dark/50 dark:placeholder:text-white/50',
            'placeholder:transition-opacity placeholder:duration-300',
          )}
        />
        <button
          type="submit"
          aria-label={t('submit')}
          className={cn(
            'inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full px-4 sm:px-5',
            'bg-primary text-white font-semibold text-sm',
            'transition-colors duration-200 hover:bg-dark dark:hover:bg-white dark:hover:text-dark',
          )}
        >
          <span className="hidden sm:inline">{t('submit')}</span>
          <Icon icon="ph:arrow-right" width={18} height={18} aria-hidden />
        </button>
      </div>
      <p className="mt-2 pl-4 text-xs text-white/80 dark:text-white/70 sm:pl-5">{t('heroHint')}</p>
    </form>
  )
}
