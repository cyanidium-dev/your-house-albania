'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { usePathname } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { Icon } from '@/components/shared/Icon'
import { track } from '@/lib/analytics/track'
import {
  alternatePathFor,
  localeSwitchHref,
  preferredSiteLocale,
  rememberLocale,
  rememberedLocale,
} from '@/lib/i18n/localeSwitch'

/**
 * "This page is in your language" on deep pages.
 *
 * Language detection only ever ran on the bare domain. Everyone else arrives
 * on a deep link — from Google, an assistant, a Telegram channel — in the
 * link's language, and a Ukrainian following a Russian channel's link stayed
 * in Russian (audit 2026-10-13). Redirecting there would hide language
 * versions from Google, which crawls without a browser language, so the page
 * offers instead, once, in the visitor's own language.
 *
 * Shown only when the browser's language is a site language, differs from
 * the page's, the page has a version in it (its hreflang links say so), and
 * the visitor has neither chosen a language on the switcher nor said no here.
 * It is fixed-position, so it never shifts the page.
 */

type OfferCopy = { text: string; accept: string; decline: string }

/** Each line in its own language: the point is to speak to the visitor in theirs. */
const COPY: Record<string, OfferCopy> = {
  en: { text: 'This page is also available in English.', accept: 'Switch', decline: 'No, thanks' },
  uk: { text: 'Ця сторінка є українською.', accept: 'Відкрити', decline: 'Ні, дякую' },
  ru: { text: 'Эта страница есть на русском.', accept: 'Открыть', decline: 'Нет, спасибо' },
  sq: { text: 'Kjo faqe është edhe në shqip.', accept: 'Hape', decline: 'Jo, faleminderit' },
  it: { text: 'Questa pagina è disponibile in italiano.', accept: 'Apri', decline: 'No, grazie' },
  pl: { text: 'Ta strona jest dostępna po polsku.', accept: 'Otwórz', decline: 'Nie, dziękuję' },
  de: { text: 'Diese Seite gibt es auch auf Deutsch.', accept: 'Öffnen', decline: 'Nein, danke' },
}

const DISMISSED_KEY = 'domlivo:language-offer-dismissed'

function dismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

export default function LanguageOfferBar() {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [target, setTarget] = useState<string | null>(null)

  useEffect(() => {
    setTarget(null)
    // The bare domain already negotiates; this is for every other page.
    if (pathname === '/') return
    const preferred = preferredSiteLocale(routing.locales)
    if (!preferred || preferred === locale) return
    // A language picked on the switcher is a choice, not a mismatch.
    if (rememberedLocale()) return
    if (dismissed()) return

    const offer = () => {
      if (!alternatePathFor(preferred)) return false
      setTarget(preferred)
      track({ event: 'language_offer', action: 'shown', from: locale, to: preferred })
      return true
    }
    if (offer()) return
    // Next streams page metadata after the shell, so the hreflang links can
    // arrive after this effect has run; watch the head for a few seconds.
    const observer = new MutationObserver(() => {
      if (offer()) observer.disconnect()
    })
    observer.observe(document.head, { childList: true, subtree: true })
    const stop = window.setTimeout(() => observer.disconnect(), 8000)
    return () => {
      observer.disconnect()
      window.clearTimeout(stop)
    }
  }, [locale, pathname])

  if (!target) return null
  const copy = COPY[target]
  if (!copy) return null

  const accept = () => {
    track({ event: 'language_offer', action: 'accepted', from: locale, to: target })
    rememberLocale(target)
    router.push(localeSwitchHref(target, pathname))
    setTarget(null)
  }

  const decline = () => {
    track({ event: 'language_offer', action: 'dismissed', from: locale, to: target })
    try {
      window.localStorage.setItem(DISMISSED_KEY, '1')
    } catch {
      // Storage blocked: it closes for this page view only.
    }
    setTarget(null)
  }

  return (
    <div
      lang={target}
      role="region"
      aria-label={copy.text}
      className="fixed inset-x-3 top-[calc(env(safe-area-inset-top)+4.25rem)] z-[60] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-dark/10 bg-white/95 py-2.5 pl-4 pr-2 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-dark/95 md:inset-x-auto md:right-6 md:top-28 md:mx-0"
    >
      <Icon icon="ph:translate" width={20} height={20} className="shrink-0 text-primary" aria-hidden />
      <p className="min-w-0 flex-1 text-sm leading-snug text-dark/80 dark:text-white/80">
        {copy.text}{' '}
        <button
          type="button"
          onClick={accept}
          className="font-semibold text-primary underline-offset-4 hover:underline cursor-pointer"
        >
          {copy.accept}
        </button>
      </p>
      <button
        type="button"
        onClick={decline}
        aria-label={copy.decline}
        title={copy.decline}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-dark/50 transition-colors hover:bg-dark/5 hover:text-dark dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white cursor-pointer"
      >
        <Icon icon="ph:x" width={18} height={18} aria-hidden />
      </button>
    </div>
  )
}
