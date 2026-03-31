'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { FilterSelect, type FilterOption } from '@/components/catalog/FilterSelect'
import { cn } from '@/lib/utils'

const ROUTING_LOCALES = ['en', 'uk', 'ru', 'sq', 'it'] as const

function normalizeLocale(locale: string): (typeof ROUTING_LOCALES)[number] {
  return ROUTING_LOCALES.includes(locale as (typeof ROUTING_LOCALES)[number])
    ? (locale as (typeof ROUTING_LOCALES)[number])
    : 'en'
}

type Props = {
  locale: string
  /** Optional layout classes (e.g. fill grid column height on register page). */
  className?: string
}

export function RegistrationRequestForm({ locale, className }: Props) {
  const t = useTranslations('Register')
  const router = useRouter()
  const appLocale = useLocale()

  const [name, setName] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [realtorOrAgency, setRealtorOrAgency] = React.useState('any')
  const [language, setLanguage] = React.useState<(typeof ROUTING_LOCALES)[number]>(() =>
    normalizeLocale(appLocale)
  )
  const [termsAccepted, setTermsAccepted] = React.useState(false)
  const [companyWebsite, setCompanyWebsite] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    setLanguage(normalizeLocale(appLocale))
  }, [appLocale])

  const onLanguageChange = React.useCallback((v: string) => {
    setLanguage(normalizeLocale(v))
  }, [])

  const typeOptions = React.useMemo<FilterOption[]>(
    () => [
      { value: 'realtor', label: t('typeRealtor') },
      { value: 'agency', label: t('typeAgency') },
    ],
    [t]
  )

  const languageOptions = React.useMemo<FilterOption[]>(
    () => [
      { value: 'sq', label: t('langSq') },
      { value: 'en', label: t('langEn') },
      { value: 'ru', label: t('langRu') },
      { value: 'uk', label: t('langUk') },
      { value: 'it', label: t('langIt') },
    ],
    [t]
  )

  const inputClass =
    'w-full rounded-full border border-black/10 px-6 py-3.5 outline-primary focus:outline dark:border-white/10'

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!termsAccepted) {
      setError(t('errorTerms'))
      return
    }
    if (!name.trim()) {
      setError(t('errorRequiredName'))
      return
    }
    if (!phone.trim()) {
      setError(t('errorRequiredPhone'))
      return
    }

    const payload: Record<string, unknown> = {
      name: name.trim(),
      phone: phone.trim(),
      language,
      companyWebsite,
    }
    const em = email.trim()
    if (em) payload.email = em
    if (realtorOrAgency !== 'any') payload.realtorOrAgency = realtorOrAgency

    setSubmitting(true)
    try {
      const res = await fetch('/api/registration-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null
      if (!res.ok || !data || data.ok !== true) {
        setError(data?.error ?? t('errorSubmit'))
        return
      }
      router.push(`/${locale}/register/thank-you`)
    } catch {
      setError(t('errorSubmit'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        'flex min-w-0 flex-col gap-5 rounded-2xl border border-dark/10 bg-white/55 p-5 shadow-md backdrop-blur-md dark:border-white/10 dark:bg-dark/55',
        'sm:p-6 md:p-7 lg:p-8',
        className
      )}
    >
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

      <h2
        id="registration-form-heading"
        className="text-xl font-medium leading-snug text-dark dark:text-white md:text-2xl"
      >
        {t('formHeading')}
      </h2>

      <div className="flex flex-col gap-4 md:gap-[1.125rem]">
        <input
          type="text"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          placeholder={t('fieldName')}
          required
          className={inputClass}
          aria-labelledby="registration-form-heading"
        />
        <input
          type="tel"
          name="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
          placeholder={t('fieldPhone')}
          required
          className={inputClass}
        />
        <input
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder={t('fieldEmail')}
          className={inputClass}
        />

        <FilterSelect
          label={t('fieldProfileType')}
          hint={t('fieldTypeHint')}
          value={realtorOrAgency}
          onValueChange={setRealtorOrAgency}
          options={typeOptions}
          anyLabel={t('typeNotSpecified')}
          anyValue="any"
          radius="full"
          className="rounded-full border-black/10 px-6 py-3.5 h-auto min-h-[48px]"
        />

        <FilterSelect
          label={t('fieldLanguage')}
          value={language}
          onValueChange={onLanguageChange}
          options={languageOptions}
          includeAnyOption={false}
          radius="full"
          className="rounded-full border-black/10 px-6 py-3.5 h-auto min-h-[48px]"
        />

        <label className="mt-1 flex cursor-pointer items-start gap-3 border-t border-dark/10 pt-4 text-sm leading-relaxed text-dark/90 dark:border-white/10 dark:text-white/85">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 rounded border-dark/20 text-primary focus:ring-primary/40"
          />
          <span>
            {t.rich('terms', {
              link: (chunks) => (
                <a
                  href="https://realting.com/advertise"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary underline underline-offset-2 hover:text-dark dark:hover:text-white"
                >
                  {chunks}
                </a>
              ),
            })}
          </span>
        </label>

        {error ? (
          <p className="text-sm font-medium text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 w-full rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-white duration-300 hover:bg-dark disabled:cursor-not-allowed disabled:opacity-60 md:py-4"
        >
          {submitting ? t('submitting') : t('submit')}
        </button>
        <p className="text-center text-sm font-medium leading-relaxed text-dark/75 dark:text-white/70">
          {t('footnote')}
        </p>
      </div>
    </form>
  )
}
