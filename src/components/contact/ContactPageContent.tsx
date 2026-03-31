import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { Icon } from '@iconify/react'
import type { ContactsManagerBlock } from '@/lib/sanity/contactsManagerFromSiteSettings'
import {
  fetchCatalogFilterOptions,
  fetchSiteSettings,
  fetchCatalogAreaBoundsFromData,
} from '@/lib/sanity/client'
import { resolvePriceRange, toRangesByDeal } from '@/lib/catalog/priceRanges'
import { resolveAreaRangeBounds } from '@/lib/catalog/areaRanges'
import { GeneralContactForm, type GeneralContactRequestFilterProps } from '@/components/contact/GeneralContactForm'
import { iconForContactsSocialPlatform } from '@/components/contact/contactsSocialIcon'

type ContactPageContentProps = {
  locale: string
  manager: ContactsManagerBlock
}

const DEAL_TYPE_VALUES = ['sale', 'rent', 'short-term'] as const

export async function ContactPageContent({ locale, manager }: ContactPageContentProps) {
  const t = await getTranslations({ locale, namespace: 'Contacts' })
  const photo = manager.photo
  const photoAlt = photo?.alt?.trim() || t('managerPhotoAlt')

  const [filterOptions, siteSettings, areaBoundsFromData] = await Promise.all([
    fetchCatalogFilterOptions(locale),
    fetchSiteSettings(),
    fetchCatalogAreaBoundsFromData(),
  ])

  const { locations: locationOptions, propertyTypes: typeOptions } = filterOptions
  const priceRangesByDeal = toRangesByDeal(
    resolvePriceRange((siteSettings as Record<string, unknown>)?.priceRange)
  )
  const defaultAreaRange = resolveAreaRangeBounds(
    (siteSettings as Record<string, unknown>)?.areaRange,
    areaBoundsFromData
  )

  const filterProps: GeneralContactRequestFilterProps = {
    locations: locationOptions.map((o) => ({ value: o.value, label: o.label })),
    propertyTypes: typeOptions.map((o) => ({ value: o.value, label: o.label })),
    dealTypeValues: DEAL_TYPE_VALUES,
    priceRangesByDeal,
    defaultAreaRange,
  }

  return (
    <section
      className="border-t border-black/5 pb-16 pt-10 dark:border-white/10 md:pb-28 md:pt-12"
      aria-labelledby="contacts-main-heading"
    >
      <h2 id="contacts-main-heading" className="sr-only">
        {t('formHeading')}
      </h2>
      <div className="container mx-auto max-w-8xl px-5 2xl:px-0">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-stretch lg:gap-x-10 lg:gap-y-0 xl:gap-x-12">
          <div className="flex min-w-0 flex-col lg:col-span-5 lg:h-full lg:min-h-0">
            <div className="flex h-full min-h-0 flex-col gap-4">
              <div className="relative min-h-[220px] flex-1 overflow-hidden rounded-2xl border border-dark/10 bg-dark/5 shadow-md dark:border-white/10 dark:bg-white/5 sm:min-h-[260px] lg:min-h-[280px] lg:flex-1">
                {photo?.url ? (
                  <Image
                    src={photo.url}
                    alt={photoAlt}
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 1024px) 100vw, 42vw"
                    priority={false}
                    unoptimized={photo.url.startsWith('http')}
                  />
                ) : (
                  <div
                    className="flex h-full min-h-[220px] items-center justify-center bg-gradient-to-br from-dark/10 to-dark/5 dark:from-white/10 dark:to-white/5"
                    role="img"
                    aria-label={photoAlt}
                  >
                    <Icon icon="ph:user-circle" className="size-20 text-dark/25 dark:text-white/25" aria-hidden />
                  </div>
                )}
              </div>

              {manager.email || manager.socialLinks.length > 0 ? (
                <div className="shrink-0 rounded-2xl border border-dark/10 bg-white/40 p-5 shadow-md backdrop-blur-sm dark:border-white/10 dark:bg-dark/40 md:p-6">
                  {manager.email ? (
                    <a
                      href={`mailto:${manager.email}`}
                      className="mb-5 inline-flex max-w-full items-start gap-3 break-all text-base text-dark transition-colors hover:text-primary dark:text-white dark:hover:text-primary"
                    >
                      <Icon icon="ph:envelope-simple" width={22} height={22} className="mt-0.5 shrink-0 text-primary" />
                      <span>
                        <span className="text-sm text-dark/60 dark:text-white/60">{t('managerEmailLabel')}: </span>
                        {manager.email}
                      </span>
                    </a>
                  ) : null}

                  {manager.socialLinks.length > 0 ? (
                    <div>
                      <p className="mb-3 text-sm font-medium text-dark/70 dark:text-white/70">{t('follow')}</p>
                      <ul className="grid grid-cols-2 gap-3">
                        {manager.socialLinks.map((s, i) => (
                          <li key={`${s.url}-${i}`} className="min-w-0">
                            <a
                              href={s.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex w-full min-w-0 items-center justify-center gap-2 rounded-full border border-dark/10 px-3 py-2 text-center text-sm text-dark transition-colors hover:border-primary hover:text-primary dark:border-white/15 dark:text-white"
                            >
                              <Icon
                                icon={iconForContactsSocialPlatform(s.platform)}
                                width={20}
                                height={20}
                                aria-hidden
                              />
                              {s.platform}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex min-w-0 flex-col lg:col-span-7 lg:min-h-0 lg:h-full">
            <GeneralContactForm locale={locale} filterProps={filterProps} className="lg:flex-1" />
          </div>
        </div>
      </div>
    </section>
  )
}
