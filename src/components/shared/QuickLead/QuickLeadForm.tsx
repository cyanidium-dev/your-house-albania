'use client'

import * as React from 'react'
import { useTranslations } from 'next-intl'
import { leadContextForRequest, trackFormLead } from '@/lib/analytics/leadEvents'
import type { LeadPlacement } from '@/lib/leads/types'
import { brandButtonClass } from '@/components/shared/BrandButton'
import { LeadMessengerRow } from '@/components/contact/LeadMessengerRow'

type Props = {
  locale: string
  /** Short placement label sent to Telegram so the operator knows where the lead came from. */
  sourceLabel: string
  /** Analytics placement of this form. */
  placement?: LeadPlacement
  /** Renders the optional name field next to the phone. */
  withName?: boolean
  /** Stacks the field and the button instead of putting them on one row. */
  stacked?: boolean
  className?: string
  /** Called after a successful send (used by the widget to auto-close). */
  onSent?: () => void
  /** Button text; the dictionary's when empty. */
  submitLabel?: string
  /** Budget choices; a select appears when there are any. Sent as `budget`. */
  budgetOptions?: string[]
  /** Optional free-text "what are you looking for" field. */
  withMessage?: boolean
  /** WhatsApp / Telegram row under the form (on by default). */
  showMessengers?: boolean
  /** CMS landing slug, so the lead and the Telegram message name the landing. */
  landingSlug?: string
}

const inputClass =
  'w-full rounded-full border border-black/10 bg-white px-6 py-3.5 text-dark outline-primary placeholder:text-dark/40 focus:outline dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40'

const buttonClass = brandButtonClass('primary')

/** A chevron for the budget select, drawn in the muted text colour of both themes. */
const SELECT_CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23888'%3E%3Cpath d='M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4z'/%3E%3C/svg%3E\")"

/**
 * One-field callback form: the visitor leaves a phone number and we promise a
 * quote within an hour. Posts to `/api/contact-agent` with
 * `submissionKind: 'quote'`, which requires the phone and nothing else.
 * Used by the blog CTA block and by the floating QuickContact widget.
 */
export function QuickLeadForm({
  locale,
  sourceLabel,
  placement = 'page',
  withName = false,
  stacked = false,
  className,
  onSent,
  submitLabel,
  budgetOptions,
  withMessage = false,
  showMessengers = true,
  landingSlug,
}: Props) {
  const t = useTranslations('QuickLead')

  const [phone, setPhone] = React.useState('')
  const [name, setName] = React.useState('')
  const [budget, setBudget] = React.useState('')
  const [message, setMessage] = React.useState('')
  const budgets = (budgetOptions ?? []).map((b) => b.trim()).filter(Boolean)
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
          budget: budget || undefined,
          message: message.trim() || undefined,
          landingSlug: landingSlug || undefined,
          sourceLabel,
          sourcePath: typeof window === 'undefined' ? undefined : window.location.pathname,
          placement,
          context: leadContextForRequest(),
        }),
      })
      const data = (await res.json().catch(() => null)) as { ok?: boolean } | null
      if (!res.ok || data?.ok !== true) {
        setError(t('error'))
        return
      }
      trackFormLead({
        leadType: 'contact_form',
        placement,
        legacy: { kind: 'quote', source: sourceLabel },
      })
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
        {budgets.length > 0 ? (
          <select
            name="quoteBudget"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            aria-label={t('budgetPlaceholder')}
            className={`${inputClass} appearance-none bg-[length:16px] bg-[right_1.25rem_center] bg-no-repeat pr-12 ${budget ? '' : 'text-dark/40 dark:text-white/40'}`}
            style={{ backgroundImage: SELECT_CHEVRON }}
          >
            <option value="">{t('budgetPlaceholder')}</option>
            {budgets.map((b) => (
              <option key={b} value={b} className="text-dark">
                {b}
              </option>
            ))}
          </select>
        ) : null}
        {withMessage ? (
          <textarea
            name="quoteMessage"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder={t('messagePlaceholder')}
            aria-label={t('messagePlaceholder')}
            className={`${inputClass} rounded-3xl resize-y min-h-24`}
          />
        ) : null}
        <button type="submit" disabled={submitting || phone.trim().length < 5} className={buttonClass}>
          {submitting ? t('submitting') : submitLabel?.trim() || t('submit')}
        </button>
      </div>

      {error ? (
        <p className="text-sm font-medium text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      {showMessengers ? <LeadMessengerRow locale={locale} /> : null}
      <p className="text-xs text-dark/50 dark:text-white/50">{t('consent')}</p>
    </form>
  )
}
