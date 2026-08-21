'use client'

import * as React from 'react'
import { useTranslations } from 'next-intl'

type Props = {
  locale: string
  propertySlug: string
  propertyTitle: string
  agentSlug: string | null
  agentName: string | null
  /** Localized button label (rendered server-side). */
  label: string
  /** Button styling — the modal itself is fixed-position and unaffected. */
  className?: string
}

/**
 * "Get in touch" CTA on the property page: opens a contact modal that posts to
 * `/api/contact-agent` with `submissionKind: 'agent'` and the property context,
 * delivered to the team's Telegram chat. Success is shown inline.
 */
export function PropertyContactButton({
  locale,
  propertySlug,
  propertyTitle,
  agentSlug,
  agentName,
  label,
  className,
}: Props) {
  const t = useTranslations('Contacts')
  const tp = useTranslations('Shared.propertyDetail')

  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [message, setMessage] = React.useState('')
  /** Honeypot — leave empty; must be submitted for server checks. */
  const [companyWebsite, setCompanyWebsite] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [sent, setSent] = React.useState(false)

  const close = React.useCallback(() => {
    if (submitting) return
    setOpen(false)
    setError(null)
  }, [submitting])

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
        }),
      })
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null
      if (!res.ok || !data || data.ok !== true) {
        setError(data?.error ?? t('errorSubmit'))
        return
      }
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

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {label}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
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
                  className="mt-2 rounded-full bg-primary px-8 py-3 text-base font-semibold text-white duration-300 hover:bg-dark"
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
                  className="mt-1 w-full rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-white duration-300 hover:bg-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? t('formSubmitting') : t('formSubmit')}
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  )
}
