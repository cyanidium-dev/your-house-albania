'use client'

import { Icon } from "@/components/shared/Icon";
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { cn } from '@/lib/utils'
import { brandButtonClass } from '@/components/shared/BrandButton'
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
  const inputRef = useRef<HTMLInputElement>(null)
  // The examples that fit the field whole. On a 390px phone the field is
  // ~240px wide and the longest example was cut mid-phrase ("I want an
  // apartment by the sea", audit 2026-10-18 M5); a phrase that does not fit
  // is skipped there and shown on wider screens only.
  const [fitting, setFitting] = useState<string[] | null>(null)

  useEffect(() => {
    const el = inputRef.current
    if (!el || examples.length === 0) return
    const ctx = document.createElement('canvas').getContext('2d')
    if (!ctx) return
    const measure = () => {
      const style = getComputedStyle(el, '::placeholder')
      ctx.font = style.font || getComputedStyle(el).font
      const room = el.clientWidth - 2
      setFitting(examples.filter((e) => ctx.measureText(e).width <= room))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    document.fonts?.ready.then(measure)
    return () => ro.disconnect()
  }, [examples])

  const shown = fitting ?? examples

  useEffect(() => {
    reduceMotion.current =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion.current || shown.length < 2) return
    const id = window.setInterval(() => {
      setExampleIndex((i) => (i + 1) % shown.length)
    }, ROTATE_MS)
    return () => window.clearInterval(id)
  }, [shown.length])

  const placeholder = shown[exampleIndex % Math.max(shown.length, 1)] ?? t('inputFallbackPlaceholder')

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
          ref={inputRef}
          id="ai-search-hero"
          type="text"
          value={value}
          maxLength={AI_MAX_MESSAGE_CHARS}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          enterKeyHint="search"
          className={cn(
            // The typed text stays 16px (smaller zooms iOS Safari on focus);
            // only the example placeholder is 14px on a phone.
            'min-w-0 flex-1 bg-transparent py-2 text-base outline-none placeholder:text-sm sm:placeholder:text-base',
            'text-dark dark:text-white placeholder:text-dark/50 dark:placeholder:text-white/50',
            'placeholder:transition-opacity placeholder:duration-300',
          )}
        />
        <button
          type="submit"
          aria-label={t('submit')}
          className={brandButtonClass('primary', 'shrink-0 h-11', 'sm')}
        >
          <span className="hidden sm:inline">{t('submit')}</span>
          <Icon icon="ph:arrow-right" width={18} height={18} aria-hidden />
        </button>
      </div>
      <p className="mt-2 pl-4 text-xs text-white/90 dark:text-white/80 sm:pl-5">{t('heroHint')}</p>
    </form>
  )
}
