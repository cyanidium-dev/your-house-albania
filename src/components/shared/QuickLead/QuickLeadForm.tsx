'use client'

import * as React from 'react'
import { useTranslations } from 'next-intl'

type Props = {
  locale: string
  /** Short placement label sent to Telegram so the operator knows where the lead came from. */
  sourceLabel: string
  /** Renders the optional name field next to the phone. */
  withName?: boolean
  /** Stacks the field and the button instead of putting them on one row. */
  stacked?: boolean
  className?: string
  /** Called after a successful send (used by the widget to auto-close). */
  onSent?: () => void
}

const inputClass =
  'w-full rounded-full border border-black/10 bg-white px-6 py-3.5 text-dark outline-primary placeholder:text-dark/40 focus:outline dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40'

const buttonClass =
  'rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-white duration-300 hover:bg-dark disabled:cursor-not-allowed disabled:opacity-60'

/**
 * One-field callback form: the visitor leaves a phone number and we promise a
 * quote within an hour. Posts to `/api/contact-agent` with
 * `submissionKind: 'quote'`, which requires the phone and nothing else.
 * Used by the blog CTA block and by the floating QuickContact widget.
 */
export function QuickLeadForm({
  locale,
  sourceLabel,
  withName = false,
  stacked = false,
  className,
  onSent,
}: Props) {
  const t = useTranslations('QuickLead')

  const [phone, setPhone] = React.useState('')
  const [name, setName] = React.useState('')
  /** Honeypot — real users never fill this. */
  const [companyWebsite, setCompanyWebsite] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [sent, setSent] = React.useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/contact-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionKind: 'quote',
          locale,
          companyWebsite,
          phone: phone.trim(),
          name: name.trim() || undefined,
          sourceLabel,
          sourcePath: typeof window === 'undefined' ? undefined : window.location.pathname,
        }),
      })
      const data = (await res.json().catch(() => null)) as { ok?: boolean } | null
      if (!res.ok || data?.ok !== true) {
        setError(t('error'))
        return
      }
      setSent(true)
      onSent?.()
    } catch {
      setError(t('error'))
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <div
        className={`flex flex-col items-center gap-2 rounded-2xl bg-primary/10 px-6 py-6 text-center ${className ?? ''}`}
        role="status"
      >
        <p className="text-2xl" aria-hidden>
          ✅
        </p>
        <p className="text-lg font-medium text-dark dark:text-white">{t('successTitle')}</p>
        <p className="text-sm text-dark/60 dark:text-white/60">{t('successBody')}</p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className={`flex flex-col gap-3 ${className ?? ''}`} noValidate>
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

      <div className={stacked ? 'flex flex-col gap-3' : 'flex flex-col gap-3 sm:flex-row'}>
        {withName ? (
          <input
            type="text"
            name="quoteName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            placeholder={t('namePlaceholder')}
            className={inputClass}
          />
        ) : null}
        <input
          type="tel"
          name="quotePhone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
          inputMode="tel"
          placeholder={t('phonePlaceholder')}
          aria-label={t('phonePlaceholder')}
          required
          className={inputClass}
        />
        <button type="submit" disabled={submitting || phone.trim().length < 5} className={buttonClass}>
          {submitting ? t('submitting') : t('submit')}
        </button>
      </div>

      {error ? (
        <p className="text-sm font-medium text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      <p className="text-xs text-dark/50 dark:text-white/50">{t('consent')}</p>
    </form>
  )
}
