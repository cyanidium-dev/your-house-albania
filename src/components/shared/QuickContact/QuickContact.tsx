'use client'

import * as React from 'react'
import { Icon } from '@iconify/react'
import { useTranslations } from 'next-intl'
import { QuickLeadForm } from '@/components/shared/QuickLead/QuickLeadForm'
import { partitionSocialLinks, type SocialLinkInput } from '@/lib/footer/socialChannels'

export type QuickContactChannels = {
  phone: string
  email: string
  /**
   * Telegram and WhatsApp live here, as `socialLinks[]` entries carrying
   * `channel: 'contact'` — the dedicated CMS string fields were migrated away
   * on 2026-08-22. See `@/lib/footer/socialChannels`.
   */
  socialLinks?: SocialLinkInput[]
}

type Props = {
  locale: string
  channels: QuickContactChannels
}

type Action = {
  key: string
  href: string
  icon: string
  /** Brand colour of the channel; the callback action reuses the site primary. */
  color: string
}

/** `tel:` needs the number without spaces, brackets or dashes. */
function telHref(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, '')
  return cleaned ? `tel:${cleaned}` : ''
}

/**
 * Finds a messenger among the site's links. Contact-channel entries win, but a
 * link left on the default channel still counts — an editor who adds Telegram
 * without touching the channel field should still get a button.
 */
function messengerUrl(
  links: SocialLinkInput[] | undefined,
  platform: string,
  hostPattern: RegExp
): string {
  const { contact, social } = partitionSocialLinks(links)
  const matches = (l: { platform: string; url: string }) =>
    l.url.startsWith('http') &&
    (l.platform.toLowerCase().includes(platform) || hostPattern.test(l.url))
  return (contact.find(matches) ?? social.find(matches))?.url ?? ''
}

/**
 * Floating contact button, mounted in the locale layout so it follows the
 * visitor on every page. Collapsed it is a single bubble; expanded it fans out
 * the channels configured in Sanity (Telegram, WhatsApp, phone, email) plus a
 * callback form that asks only for a phone number.
 */
export function QuickContact({ locale, channels }: Props) {
  const t = useTranslations('QuickContact')

  const [open, setOpen] = React.useState(false)
  const [formOpen, setFormOpen] = React.useState(false)
  const wrapRef = React.useRef<HTMLDivElement>(null)

  const actions = React.useMemo<Action[]>(() => {
    const list: Action[] = []
    const telegram = messengerUrl(channels.socialLinks, 'telegram', /(^|\/\/)([\w.]*\.)?t\.me\//i)
    const whatsapp = messengerUrl(channels.socialLinks, 'whatsapp', /(^|\/\/)([\w.]*\.)?wa\.me\//i)
    if (telegram) {
      list.push({ key: 'telegram', href: telegram, icon: 'ph:telegram-logo-fill', color: '#229ED9' })
    }
    if (whatsapp) {
      list.push({ key: 'whatsapp', href: whatsapp, icon: 'ph:whatsapp-logo-fill', color: '#25D366' })
    }
    const tel = telHref(channels.phone)
    if (tel) {
      list.push({ key: 'phone', href: tel, icon: 'ph:phone-fill', color: '#0F172A' })
    }
    if (channels.email) {
      list.push({ key: 'email', href: `mailto:${channels.email}`, icon: 'ph:envelope-simple-fill', color: '#64748B' })
    }
    return list
  }, [channels])

  const close = React.useCallback(() => {
    setOpen(false)
    setFormOpen(false)
  }, [])

  React.useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) close()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close])

  // Nothing configured in the CMS and no callback form would be useful on its
  // own — render nothing rather than an empty bubble.
  if (actions.length === 0) return null

  return (
    <div
      ref={wrapRef}
      className="fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-3 print:hidden"
    >
      <div className="flex flex-col items-end gap-3">
        {actions.map((a, i) => {
          const isExternal = a.href.startsWith('http')
          // Items closest to the trigger appear first.
          const delay = open ? (actions.length - 1 - i) * 45 : 0
          return (
            <a
              key={a.key}
              href={a.href}
              aria-label={t(`channel.${a.key}`)}
              title={t(`channel.${a.key}`)}
              tabIndex={open ? 0 : -1}
              aria-hidden={!open}
              {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              style={{ backgroundColor: a.color, transitionDelay: `${delay}ms` }}
              className={`flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-all duration-300 ease-out hover:scale-110 ${
                open
                  ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
                  : 'pointer-events-none translate-y-3 scale-75 opacity-0'
              }`}
            >
              <Icon icon={a.icon} width={22} height={22} aria-hidden />
            </a>
          )
        })}

        <button
          type="button"
          onClick={() => setFormOpen((v) => !v)}
          tabIndex={open ? 0 : -1}
          aria-hidden={!open}
          style={{ transitionDelay: open ? `${actions.length * 45}ms` : '0ms' }}
          className={`flex h-12 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-white shadow-lg transition-all duration-300 ease-out hover:scale-105 ${
            open
              ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
              : 'pointer-events-none translate-y-3 scale-75 opacity-0'
          }`}
        >
          <Icon icon="ph:phone-call-fill" width={18} height={18} aria-hidden />
          {t('callbackAction')}
        </button>
      </div>

      {formOpen ? (
        <div
          className="w-[min(20rem,calc(100vw-2.5rem))] rounded-2xl border border-black/10 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-dark"
          role="dialog"
          aria-label={t('formHeading')}
        >
          <p className="text-base font-medium text-dark dark:text-white">{t('formHeading')}</p>
          <p className="mt-1 text-sm text-dark/60 dark:text-white/60">{t('formBody')}</p>
          <QuickLeadForm
            locale={locale}
            sourceLabel="Floating widget"
            stacked
            className="mt-4"
            onSent={() => window.setTimeout(close, 2500)}
          />
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-label={open ? t('close') : t('open')}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-xl transition-transform duration-300 hover:scale-105 active:scale-95"
      >
        <Icon
          icon={open ? 'ph:x-bold' : 'ph:chat-circle-dots-fill'}
          width={open ? 24 : 28}
          height={open ? 24 : 28}
          aria-hidden
        />
      </button>
    </div>
  )
}
