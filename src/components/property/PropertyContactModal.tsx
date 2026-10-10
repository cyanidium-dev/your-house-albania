'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import { leadContextForRequest, trackFormLead, type LeadSubject } from '@/lib/analytics/leadEvents'
import type { LeadPlacement } from '@/lib/leads/types'
import { useContactModalFlag } from '@/lib/contacts/useContactModalFlag'
import { brandButtonClass } from '@/components/shared/BrandButton'
import { LeadMessengerRow } from '@/components/contact/LeadMessengerRow'

type Props = {
  locale: string
  propertySlug: string
  propertyTitle: string
  agentSlug: string | null
  agentName: string | null
  /** Localized button label (rendered server-side). */
  label: string
  /** Full accessible name when `label` is a shortened one (the phone contact bar). */
  ariaLabel?: string
  /** Button styling — the modal itself is fixed-position and unaffected. */
  className?: string
  /** Analytics: where the button is. Defaults to the property page. */
  placement?: LeadPlacement
  /** Analytics: listing dimensions for the lead events (no personal data). */
  analytics?: Omit<LeadSubject, 'propertySlug'>
}

/**
 * "Get in touch" CTA on the property page: opens a contact modal that posts to
 * `/api/contact-agent` with `submissionKind: 'agent'` and the property context,
 * delivered to the team's Telegram chat. Success is shown inline.
 *
 * The button is all that renders until the first click. Every property card
 * carries one, and the form's dozen hooks and its post-mount re-render used to
 * run for each of the 24 cards while a phone hydrated the listing page. The
 * dialog mounts on first open and then stays mounted (rendering nothing while
 * closed), so a half-typed enquiry survives closing and reopening as before.
 */
export function PropertyContactButton({ label, ariaLabel, className, ...dialogProps }: Props) {
  const [open, setOpen] = React.useState(false)
  const [opened, setOpened] = React.useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpened(true)
          setOpen(true)
        }}
        aria-label={ariaLabel}
        className={className}
      >
        {label}
      </button>
      {opened ? <PropertyContactDialog {...dialogProps} open={open} setOpen={setOpen} /> : null}
    </>
  )
}

type DialogProps = Omit<Props, 'label' | 'ariaLabel' | 'className'> & {
  open: boolean
  setOpen: (open: boolean) => void
}

function PropertyContactDialog({
  locale,
  propertySlug,
  propertyTitle,
  agentSlug,
  agentName,
  placement = 'property',
  analytics,
  open,
  setOpen,
}: DialogProps) {
  const t = useTranslations('Contacts')
  const tp = useTranslations('Shared.propertyDetail')

  const [name, setName] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [message, setMessage] = React.useState('')
  /** Honeypot — leave empty; must be submitted for server checks. */
  const [companyWebsite, setCompanyWebsite] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [sent, setSent] = React.useState(false)

  useContactModalFlag(open)

  const close = React.useCallback(() => {
    if (submitting) return
    setOpen(false)
    setError(null)
  }, [submitting, setOpen])

  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, close])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/contact-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionKind: 'agent',
          locale,
          companyWebsite,
          agentSlug: agentSlug || 'unassigned',
          agentName: agentName || undefined,
          propertySlug,
          propertyTitle,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          message: message.trim(),
          placement,
          context: leadContextForRequest(),
        }),
      })
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null
      if (!res.ok || !data || data.ok !== true) {
        setError(data?.error ?? t('errorSubmit'))
        return
      }
      trackFormLead({
        leadType: 'property_inquiry',
        placement,
        subject: { ...analytics, propertySlug },
        legacy: { kind: 'agent', source: propertySlug },
      })
      setSent(true)
    } catch {
      setError(t('errorSubmit'))
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    'w-full rounded-full border border-black/10 bg-transparent px-6 py-3.5 outline-primary focus:outline dark:border-white/10'
  const textareaClass =
    'min-h-[100px] w-full rounded-2xl border border-black/10 bg-transparent px-6 py-3.5 outline-primary focus:outline dark:border-white/10'

  // Portalled to the body, and above the header's z-50. On a listing card the
  // dialog would otherwise render inside the results container, whose own
  // stacking context traps it under the sticky filter bar however high its
  // z-index climbs. Only ever mounted after a click, so `document` exists.
  return open
    ? createPortal(
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={tp('contactHeading')}
        >
          <div className="absolute inset-0 bg-black/60" onClick={close} aria-hidden />
          <div className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-dark sm:p-8">
            <button
              type="button"
              onClick={close}
              aria-label={tp('contactClose')}
              className="absolute right-4 top-4 rounded-full p-1 text-dark/50 hover:text-dark dark:text-white/50 dark:hover:text-white"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>

            {sent ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <p className="text-2xl">✅</p>
                <h3 className="text-xl font-medium text-dark dark:text-white">
                  {tp('contactSuccessTitle')}
                </h3>
                <p className="text-sm text-dark/60 dark:text-white/60">{tp('contactSuccessBody')}</p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className={brandButtonClass('primary', 'mt-2', 'md')}
                >
                  {tp('contactClose')}
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="flex flex-col gap-3">
                <input
                  type="text"
                  name="companyWebsite"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden
                  className="absolute left-[-10000px] h-px w-px overflow-hidden opacity-0"
                />
                <h3 className="pr-8 text-xl font-medium text-dark dark:text-white">
                  {tp('contactHeading')}
                </h3>
                <p className="mb-1 text-sm text-dark/60 dark:text-white/60">{tp('contactIntro')}</p>
                <p className="mb-1 truncate text-sm font-medium text-dark/80 dark:text-white/80">
                  🏠 {propertyTitle}
                </p>
                <input
                  type="text"
                  name="clientName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  placeholder={t('formName')}
                  required
                  className={inputClass}
                />
                <input
                  type="tel"
                  name="clientPhone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                  placeholder={t('formPhone')}
                  required
                  className={inputClass}
                />
                <input
                  type="email"
                  name="clientEmail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder={t('formEmail')}
                  required
                  className={inputClass}
                />
                <textarea
                  name="clientMessage"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t('formMessage')}
                  required
                  maxLength={8000}
                  rows={4}
                  className={textareaClass}
                />
                {error ? (
                  <p className="text-sm font-medium text-red-600 dark:text-red-400" role="alert">
                    {error}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={submitting}
                  className={brandButtonClass('primary', 'mt-1 w-full', 'md')}
                >
                  {submitting ? t('formSubmitting') : t('formSubmit')}
                </button>
                <LeadMessengerRow locale={locale} className="mt-3" />
              </form>
            )}
          </div>
        </div>,
        document.body,
      )
    : null
}
