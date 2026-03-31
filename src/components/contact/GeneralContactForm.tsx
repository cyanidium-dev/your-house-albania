'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import * as Slider from '@radix-ui/react-slider'
import { FilterSelect, type FilterOption } from '@/components/catalog/FilterSelect'
import { useCurrency } from '@/contexts/CurrencyContext'
import {
  interpretPriceRangeState,
  formatPriceRangeDisplay,
  getPriceQueryParams,
} from '@/lib/catalog/priceRanges'
import {
  interpretAreaRangeState,
  formatAreaRangeDisplay,
  getAreaQueryParams,
} from '@/lib/catalog/areaRanges'
import { cn } from '@/lib/utils'

export type GeneralContactRequestFilterProps = {
  locations: Array<{ value: string; label: string }>
  propertyTypes: Array<{ value: string; label: string }>
  dealTypeValues: readonly string[]
  priceRangesByDeal: Record<string, { min: number; max: number }>
  defaultAreaRange: { min: number; max: number }
}

type Props = {
  locale: string
  filterProps: GeneralContactRequestFilterProps
  /** Optional layout classes (e.g. fill grid column height). */
  className?: string
}

/**
 * General `/contacts` form: catalog filters + contact fields; posts to `/api/contact-agent`
 * with `submissionKind: "general"`. Filter UI aligned with former `AgentContactRequestForm`
 * (`FilterSelect`, price/area sliders, `Catalog.filters` copy).
 */
export function GeneralContactForm({ locale, filterProps, className }: Props) {
  const { locations, propertyTypes, dealTypeValues, priceRangesByDeal, defaultAreaRange } = filterProps
  const tCatalog = useTranslations('Catalog.filters')
  const t = useTranslations('Contacts')
  const { formatFromEur } = useCurrency()
  const router = useRouter()

  const [city, setCity] = React.useState('')
  const [type, setType] = React.useState('')
  const [deal, setDeal] = React.useState('any')

  const currentRange = React.useMemo(
    () =>
      priceRangesByDeal[deal === 'any' ? 'any' : deal] ||
      priceRangesByDeal.any || { min: 0, max: 1_000_000 },
    [priceRangesByDeal, deal]
  )

  const [priceValues, setPriceValues] = React.useState<[number, number]>(() => [
    currentRange.min,
    currentRange.max,
  ])

  const [areaValues, setAreaValues] = React.useState<[number, number]>(() => [
    defaultAreaRange.min,
    defaultAreaRange.max,
  ])

  React.useEffect(() => {
    const r =
      priceRangesByDeal[deal === 'any' ? 'any' : deal] ||
      priceRangesByDeal.any || { min: 0, max: 1_000_000 }
    setPriceValues([r.min, r.max])
  }, [deal, priceRangesByDeal])

  const [name, setName] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [message, setMessage] = React.useState('')
  /** Honeypot — leave empty; must be submitted for server checks. */
  const [companyWebsite, setCompanyWebsite] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const priceState = React.useMemo(
    () => interpretPriceRangeState({ min: priceValues[0], max: priceValues[1] }, currentRange),
    [priceValues, currentRange]
  )

  const areaRangeState = React.useMemo(
    () => interpretAreaRangeState({ min: areaValues[0], max: areaValues[1] }, defaultAreaRange),
    [areaValues, defaultAreaRange]
  )

  const priceDisplay = React.useMemo(
    () =>
      formatPriceRangeDisplay(priceState, {
        formatAmount: (eur) => formatFromEur(eur),
        t: (key: string) => tCatalog(key),
      }),
    [priceState, formatFromEur, tCatalog]
  )

  const areaDisplay = React.useMemo(
    () =>
      formatAreaRangeDisplay(areaRangeState, {
        t: (key: string) => tCatalog(key),
        unit: tCatalog('areaUnit'),
      }),
    [areaRangeState, tCatalog]
  )

  const locationOptions: FilterOption[] = locations.map((o) => ({
    value: o.value,
    label: o.label,
  }))

  const propertyTypeOptions: FilterOption[] = propertyTypes
    .filter((o) => o.value && o.value !== 'any')
    .map((o) => ({ value: o.value, label: o.label }))

  const dealTypeOptions: FilterOption[] = dealTypeValues.map((v) => ({
    value: v,
    label: getDealLabel(v, tCatalog),
  }))

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const pp = getPriceQueryParams(priceState)
      const ap = getAreaQueryParams(areaRangeState)

      const res = await fetch('/api/contact-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionKind: 'general',
          locale,
          companyWebsite,
          city: city || undefined,
          propertyType: type || undefined,
          deal: deal === 'any' ? undefined : deal,
          minPrice: pp.minPrice ? Number(pp.minPrice) : undefined,
          maxPrice: pp.maxPrice ? Number(pp.maxPrice) : undefined,
          minArea: ap.minArea ? Number(ap.minArea) : undefined,
          maxArea: ap.maxArea ? Number(ap.maxArea) : undefined,
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

      router.push(`/${locale}/contact/thank-you`)
    } catch {
      setError(t('errorSubmit'))
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    'w-full rounded-full border border-black/10 px-6 py-3.5 outline-primary focus:outline dark:border-white/10'
  const textareaClass =
    'min-h-[120px] w-full rounded-2xl border border-black/10 px-6 py-3.5 outline-primary focus:outline dark:border-white/10'

  const sliderThumbClass =
    'block size-4 cursor-pointer rounded-full border border-white bg-primary shadow transition-[transform,box-shadow] duration-200 ease-out hover:scale-110 hover:shadow-md focus:scale-110 focus:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40'

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        'flex min-h-0 min-w-0 flex-col gap-4 rounded-2xl border border-dark/10 bg-white/55 p-4 shadow-md backdrop-blur-md dark:border-white/10 dark:bg-dark/55 sm:p-5 md:p-6',
        'lg:flex lg:h-full lg:min-h-0 lg:flex-col',
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
      <div className="min-w-0 shrink-0">
        <h2 className="mb-2 text-xl font-medium text-dark dark:text-white">{t('formHeading')}</h2>
        <p className="mb-3 text-sm text-dark/60 dark:text-white/50 md:mb-4">{t('formIntro')}</p>
      </div>

      <div
        className={cn(
          'grid min-w-0 grid-cols-1 items-start gap-5 md:gap-6 lg:gap-8',
          'md:grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)]'
        )}
      >
        <div className="flex min-w-0 flex-col gap-3 md:gap-3.5 [&>*]:min-w-0">
          <FilterSelect
            label={tCatalog('location')}
            value={city || 'any'}
            onValueChange={(v) => setCity(v === 'any' ? '' : v)}
            options={locationOptions}
            anyLabel={tCatalog('anyLocation')}
          />
          <FilterSelect
            label={tCatalog('propertyType')}
            value={type || 'any'}
            onValueChange={(v) => setType(v === 'any' ? '' : v)}
            options={propertyTypeOptions}
            anyLabel={tCatalog('anyType')}
          />
          <FilterSelect
            label={tCatalog('dealType')}
            value={deal || 'any'}
            onValueChange={setDeal}
            options={dealTypeOptions}
            anyLabel={tCatalog('any')}
          />
          <div className="min-w-0">
            <div className="mb-1 flex min-w-0 items-center justify-between gap-2 text-xs text-dark/70 dark:text-white/80">
              <span className="min-w-0 truncate">{tCatalog('priceRange')}</span>
              <span className="min-w-0 truncate text-right text-[11px] font-medium text-dark dark:text-white">
                {priceDisplay}
              </span>
            </div>
            <Slider.Root
              className="relative flex h-4 w-full touch-none select-none items-center"
              min={currentRange.min}
              max={currentRange.max}
              step={1000}
              value={priceValues}
              onValueChange={(values) => {
                const [min, max] = values as [number, number]
                setPriceValues([min, max])
              }}
            >
              <Slider.Track className="relative h-1 grow rounded-full bg-dark/10 dark:bg-white/20">
                <Slider.Range className="absolute h-full rounded-full bg-primary" />
              </Slider.Track>
              <Slider.Thumb className={sliderThumbClass} />
              <Slider.Thumb className={sliderThumbClass} />
            </Slider.Root>
          </div>
          <div className="min-w-0">
            <div className="mb-1 flex min-w-0 items-center justify-between gap-2 text-xs text-dark/70 dark:text-white/80">
              <span className="min-w-0 truncate">{tCatalog('area')}</span>
              <span className="min-w-0 truncate text-right text-[11px] font-medium text-dark dark:text-white">
                {areaDisplay}
              </span>
            </div>
            <Slider.Root
              className="relative flex h-4 w-full touch-none select-none items-center"
              min={defaultAreaRange.min}
              max={defaultAreaRange.max}
              step={1}
              value={areaValues}
              onValueChange={(values) => {
                const [min, max] = values as [number, number]
                setAreaValues([min, max])
              }}
            >
              <Slider.Track className="relative h-1 grow rounded-full bg-dark/10 dark:bg-white/20">
                <Slider.Range className="absolute h-full rounded-full bg-primary" />
              </Slider.Track>
              <Slider.Thumb className={sliderThumbClass} />
              <Slider.Thumb className={sliderThumbClass} />
            </Slider.Root>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3 md:gap-3.5">
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
            rows={5}
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
            className="mobile:w-fit mt-auto w-full rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-white duration-300 hover:bg-dark disabled:cursor-not-allowed disabled:opacity-60 md:py-4"
          >
            {submitting ? t('formSubmitting') : t('formSubmit')}
          </button>
        </div>
      </div>
    </form>
  )
}

function getDealLabel(value: string, tCatalog: (key: string) => string) {
  if (value === 'sale') return tCatalog('dealSale')
  if (value === 'rent') return tCatalog('dealRent')
  if (value === 'short-term') return tCatalog('dealShortTerm')
  return value
}
