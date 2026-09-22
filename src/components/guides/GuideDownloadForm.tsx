'use client'

import * as React from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { leadContextForRequest, trackFormLead, type LeadSubject } from '@/lib/analytics/leadEvents'
import { GUIDE_ID } from '@/lib/guides/durresGuide'

type Props = {
  locale: string
  /** The listing the card sits on, if any: saved with the lead and sent with the event. */
  propertySlug?: string
  subject?: LeadSubject
}

const inputClass =
  'w-full rounded-full border border-black/10 bg-white px-5 py-3 text-sm text-dark outline-primary placeholder:text-dark/40 focus:outline dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40'

const buttonClass =
  'shrink-0 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white duration-300 hover:bg-dark disabled:cursor-not-allowed disabled:opacity-60'

/**
 * The island inside `GuideDownloadCard`: email + consent → `/api/guide-request`
 * → the static PDF opens. The card around it is server-rendered so the
 * listing and property pages stay cacheable; this only touches the DOM.
 */
export function GuideDownloadForm({ locale, propertySlug, subject }: Props) {
  const t = useTranslations('DurresGuide')

  const [email, setEmail] = React.useState('')
  const [consent, setConsent] = React.useState(false)
  /** Honeypot — real users never fill this. */
  const [companyWebsite, setCompanyWebsite] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [url, setUrl] = React.useState<string | null>(null)
  const id = React.useId()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/guide-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale,
          email: email.trim(),
          consent,
          companyWebsite,
          ...(propertySlug ? { propertySlug } : {}),
          context: leadContextForRequest(),
        }),
      })
      const data = (await res.json().catch(() => null)) as { ok?: boolean; url?: string; duplicate?: boolean } | null
      if (!res.ok || data?.ok !== true || typeof data.url !== 'string') {
        setError(t('error'))
        return
      }
      if (!data.duplicate) {
        trackFormLead({
          leadType: 'guide_download',
          placement: 'guide',
          ...(subject ? { subject } : {}),
          legacy: { kind: 'guide', source: GUIDE_ID },
        })
      }
      setUrl(data.url)
      // Same-origin file: the `download` attribute is honoured, so the PDF is
      // saved rather than replacing the page the visitor is reading.
      const a = document.createElement('a')
      a.href = data.url
      a.download = data.url.split('/').pop() ?? 'durres-buying-guide.pdf'
      a.rel = 'noopener'
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch {
      setError(t('error'))
    } finally {
      setSubmitting(false)
    }
  }

  if (url) {
    return (
      <div className="rounded-2xl bg-primary/10 px-5 py-5" role="status">
        <p className="text-base font-semibold text-dark dark:text-white">{t('successTitle')}</p>
        <p className="mt-1 text-sm text-dark/70 dark:text-white/70">{t('successBody')}</p>
        <a
          href={url}
          download
          className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary hover:text-white duration-300"
        >
          {t('download')}
        </a>
      </div>
    )
  }

  const canSubmit = consent && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
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
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          name="guideEmail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          inputMode="email"
          placeholder={t('emailPlaceholder')}
          aria-label={t('emailLabel')}
          required
          className={inputClass}
        />
        <button type="submit" disabled={submitting || !canSubmit} className={buttonClass}>
          {submitting ? t('submitting') : t('submit')}
        </button>
      </div>
      <label htmlFor={`${id}-consent`} className="flex items-start gap-2 text-xs text-dark/60 dark:text-white/60">
        <input
          id={`${id}-consent`}
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          required
          className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
        />
        <span>
          {t.rich('consent', {
            privacy: (chunks) => (
              <Link href={`/${locale}/privacy`} className="underline underline-offset-2 hover:text-primary">
                {chunks}
              </Link>
            ),
          })}
        </span>
      </label>
      {error ? (
        <p className="text-sm font-medium text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  )
}
