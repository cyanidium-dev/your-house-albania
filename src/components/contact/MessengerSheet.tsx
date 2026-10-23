'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { SpriteIcon as Icon } from '@/components/shared/SpriteIcon'
import { brandButtonClass } from '@/components/shared/BrandButton'
import { QuickLeadForm } from '@/components/shared/QuickLead/QuickLeadForm'
import { track } from '@/lib/analytics/track'
import { MESSENGER_ICON, type MessengerKey } from '@/lib/contacts/messengers'
import {
  configuredWhatsAppNumber,
  finishMessengerHref,
  shareablePageUrl,
  telegramBotUsername,
  whatsAppTextOf,
  whatsAppWebUrl,
} from '@/lib/contacts/messengerLinks'
import { useContactModalFlag } from '@/lib/contacts/useContactModalFlag'
import type { LeadPlacement } from '@/lib/leads/types'

export type MessengerSheetRequest = {
  /** A fresh sheet per click, even on the same link. */
  id: number
  key: MessengerKey
  /** The href of the link the visitor clicked. */
  href: string
  locale: string
  placement: LeadPlacement
  propertySlug: string | null
  /** No general "I'd like to find a home" message (`data-messenger-plain`). */
  plain: boolean
  /** The listing agent's own chat (`data-messenger-agent`): keep its target. */
  agent?: boolean
}

type Props = {
  request: MessengerSheetRequest
  onClose: () => void
}

/**
 * The small sheet a WhatsApp or Telegram click opens, one for the whole site
 * (mounted by `LeadTracker`, which intercepts the click). One tap on the main
 * button still opens the chat — WhatsApp with the ready message, Telegram
 * with a person (the agent or the business account) — and under it the visitor can leave a number instead, for those on
 * a desktop without the app or who would rather be written to.
 *
 * A native modal `<dialog>`: it sits in the top layer above the cookie banner
 * (z-90) and the phone contact bar, traps focus, closes on Escape, and is
 * `display: none` when closed. A bottom sheet on phones, a centred panel from
 * `md`.
 */
export default function MessengerSheet({ request, onClose }: Props) {
  const t = useTranslations('Messengers')
  const ref = useRef<HTMLDialogElement>(null)
  useContactModalFlag(true)

  const { href, isDesktopWeb, ready } = useMemo(() => {
    const finished = finishMessengerHref({
      key: request.key,
      href: request.href,
      locale: request.locale,
      placement: request.placement,
      pageUrl: shareablePageUrl(window.location.href),
      propertySlug: request.propertySlug,
      generalText: request.plain ? '' : t('whatsappText.general'),
      botUsername: telegramBotUsername(),
      whatsAppNumber: configuredWhatsAppNumber(),
      agent: request.agent === true,
    })
    // A desktop has WhatsApp Web more often than the app; wa.me there is only a
    // landing page. Needs the number, which a Business short link hides.
    const desktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const web = request.key === 'whatsapp' && desktop ? whatsAppWebUrl(finished) : null
    return {
      href: web ?? finished,
      isDesktopWeb: web !== null,
      // Telegram cannot pre-fill a chat with a person: its hint says what to write.
      ready: request.key === 'whatsapp' ? whatsAppTextOf(finished) !== '' : true,
    }
  }, [request, t])

  // Opened from the ref, not an effect: the lazily loaded sheet can mount its
  // element more than once while it loads, and every element must open itself.
  // Every way out calls `close`, which unmounts the sheet itself rather than
  // waiting for the dialog's `close` event: that is queued as a task and a
  // background tab may not run it before the next click.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])
  const close = useCallback(() => {
    if (ref.current?.open) ref.current.close()
    onCloseRef.current()
  }, [])
  const attach = useCallback(
    (el: HTMLDialogElement | null) => {
      ref.current = el
      if (!el) return
      el.addEventListener('cancel', (e) => {
        // Escape: close the same way as the button.
        e.preventDefault()
        close()
      })
      // A close without `cancel` (a second Escape, the Android back gesture).
      // Only while this element is the sheet's: a late event from a sheet
      // already gone must not close the next one.
      el.addEventListener('close', () => {
        if (ref.current === el) onCloseRef.current()
      })
      if (!el.open) el.showModal()
    },
    [close],
  )

  useEffect(() => {
    const root = document.documentElement
    const previous = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = previous
    }
  }, [])

  return (
    <dialog
      ref={attach}
      data-lead-ignore=""
      aria-labelledby="messenger-sheet-title"
      // A click on the backdrop lands on the dialog itself.
      onClick={(e) => {
        if (e.target === e.currentTarget) close()
      }}
      className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-[90dvh] w-full max-w-none overflow-y-auto rounded-t-3xl border-0 bg-white p-0 text-dark shadow-2xl backdrop:bg-black/60 dark:bg-dark dark:text-white md:inset-0 md:m-auto md:h-fit md:max-w-md md:rounded-3xl"
    >
      <div
        className="px-5 pt-5 md:px-8 md:pt-7"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="flex items-start gap-3">
          <Icon icon={MESSENGER_ICON[request.key]} width={28} height={28} className="mt-1.5 shrink-0 text-primary" aria-hidden />
          <h2 id="messenger-sheet-title" className="min-w-0 flex-1 pt-1.5 text-xl font-semibold leading-snug">
            {t(`sheet.title.${request.key}`)}
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label={t('sheet.close')}
            className="-mr-2 -mt-1 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-dark/50 transition-colors hover:bg-dark/5 hover:text-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <Icon icon="ph:x" width={22} height={22} aria-hidden />
          </button>
        </div>

        {ready ? (
          <p className="mt-2 text-sm leading-relaxed text-dark/60 dark:text-white/60">{t(`sheet.hint.${request.key}`)}</p>
        ) : null}

        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            track({
              event: 'messenger_open',
              messenger: request.key,
              placement: request.placement,
              ...(isDesktopWeb ? { web: true } : {}),
            })
            window.setTimeout(close, 300)
          }}
          className={brandButtonClass('primary', 'mt-5 w-full', 'lg')}
        >
          <Icon icon={MESSENGER_ICON[request.key]} width={20} height={20} aria-hidden />
          {t(`sheet.open.${request.key}`)}
        </a>

        <div className="mt-6 flex items-center gap-3 text-sm text-dark/60 dark:text-white/60">
          <span className="h-px flex-1 bg-dark/10 dark:bg-white/15" aria-hidden />
          <span className="text-center">{t('sheet.orPhone')}</span>
          <span className="h-px flex-1 bg-dark/10 dark:bg-white/15" aria-hidden />
        </div>

        <QuickLeadForm
          locale={request.locale}
          sourceLabel={`messenger-sheet:${request.key}`}
          placement={request.placement}
          showMessengers={false}
          stacked
          className="mt-4"
          onSent={() => window.setTimeout(close, 2500)}
        />
      </div>
    </dialog>
  )
}
