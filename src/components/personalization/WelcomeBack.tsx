'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { SpriteIcon as Icon } from '@/components/shared/SpriteIcon'
import { brandButtonClass } from '@/components/shared/BrandButton'
import { track } from '@/lib/analytics/track'
import { useFlagVariant } from '@/lib/analytics/useFlagVariant'
import { isWelcomeBackPath, WELCOME_BACK_FLAG } from '@/lib/experiments/welcomeBackFeed'
import { dismissWelcomeBack, touchVisit } from '@/lib/personalization/visitHistory'
import type { WelcomeBackData } from './WelcomeBackFeed'

const WelcomeBackFeed = dynamic(() => import('./WelcomeBackFeed'), { ssr: false })

/** This session's picks and whether the prompt was answered, so navigation neither refetches nor re-asks. */
const SESSION_DATA = 'domlivo:welcome-data'
const SESSION_DONE = 'domlivo:welcome-done'
/** The prompt waits a moment: a visitor who leaves at once is not interrupted. */
const PROMPT_DELAY_MS = 2500

function readSession<T>(key: string): T | null {
  try {
    return JSON.parse(window.sessionStorage.getItem(key) ?? 'null') as T | null
  } catch {
    return null
  }
}

function writeSession(key: string, value: unknown): void {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Blocked storage: the prompt may ask again on the next page, nothing worse.
  }
}

/**
 * "You were here before; we picked listings for you" (E005). Mounted once in
 * the layout: on every page it keeps the visit clock; on the home page and the
 * listing pages of a returning visitor it fetches picks, reads the flag and,
 * in the test group, asks at the bottom of the screen. Fixed position, so it
 * never moves the page (no layout shift).
 */
export default function WelcomeBack() {
  const pathname = usePathname() ?? '/'
  const locale = useLocale()
  const t = useTranslations('WelcomeBack')
  const [data, setData] = useState<WelcomeBackData | null>(null)
  const [prompt, setPrompt] = useState(false)
  const [open, setOpen] = useState(false)

  const onPath = isWelcomeBackPath(pathname)

  useEffect(() => {
    const visit = touchVisit()
    if (!onPath || data) return
    if (!visit.previousVisitAt || visit.dismissed || visit.earlierViews.length === 0) return
    if (readSession<boolean>(SESSION_DONE)) return
    const cached = readSession<WelcomeBackData>(SESSION_DATA)
    if (cached) {
      setData(cached)
      return
    }
    const controller = new AbortController()
    fetch('/api/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale, slugs: visit.earlierViews, since: new Date(visit.previousVisitAt).toISOString() }),
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((json: WelcomeBackData | null) => {
        if (!json || !Array.isArray(json.picks) || !Array.isArray(json.fresh)) return
        writeSession(SESSION_DATA, json)
        setData(json)
      })
      .catch(() => {
        // Picks are a bonus; a failed request shows nothing.
      })
    return () => controller.abort()
  }, [pathname, onPath, locale, data])

  const enough = data !== null && data.picks.length + data.fresh.length >= 2
  // Read only when the prompt could appear, so only such visitors are exposed.
  const variant = useFlagVariant(WELCOME_BACK_FLAG, enough && onPath)
  const show = variant === 'test' && enough && onPath

  useEffect(() => {
    if (!show || readSession<boolean>(SESSION_DONE)) return
    const timer = window.setTimeout(() => {
      setPrompt(true)
      track({ event: 'welcome_back_shown', picks: data!.picks.length, fresh: data!.fresh.length })
    }, PROMPT_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [show, data])

  if (!show || !data) return null

  const finish = () => {
    writeSession(SESSION_DONE, true)
    setPrompt(false)
  }

  return (
    <>
      {prompt && !open ? (
        <div
          role="dialog"
          aria-labelledby="welcome-back-title"
          className="fixed inset-x-4 z-[45] mx-auto max-w-md rounded-2xl border border-dark/10 bg-white p-4 shadow-2xl dark:border-white/15 dark:bg-dark md:inset-x-auto md:right-6 md:mx-0"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + var(--app-tabbar-offset, 0px) + 76px)' }}
        >
          <div className="flex items-start gap-3">
            <Icon icon="ph:sparkle" width={24} height={24} className="mt-0.5 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0 flex-1">
              <p id="welcome-back-title" className="font-semibold text-dark dark:text-white">
                {t('promptTitle')}
              </p>
              <p className="mt-1 text-sm text-dark/70 dark:text-white/70">
                {t('promptText', { count: data.picks.length + data.fresh.length })}
                {data.freshCount > 0 ? ` ${t('promptFresh', { count: data.freshCount })}` : ''}
              </p>
              <button
                type="button"
                onClick={() => {
                  track({ event: 'welcome_back_open' })
                  writeSession(SESSION_DONE, true)
                  setOpen(true)
                }}
                className={brandButtonClass('primary', 'mt-3', 'sm')}
              >
                {t('promptOpen')}
              </button>
            </div>
            <button
              type="button"
              aria-label={t('notNow')}
              onClick={() => {
                track({ event: 'welcome_back_dismiss', stage: 'prompt' })
                dismissWelcomeBack()
                finish()
              }}
              className="-mr-1 -mt-1 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-dark/50 hover:bg-dark/5 hover:text-dark dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <Icon icon="ph:x" width={20} height={20} aria-hidden />
            </button>
          </div>
        </div>
      ) : null}
      {open ? (
        <WelcomeBackFeed
          data={data}
          locale={locale}
          onClose={() => {
            setOpen(false)
            finish()
          }}
        />
      ) : null}
    </>
  )
}
