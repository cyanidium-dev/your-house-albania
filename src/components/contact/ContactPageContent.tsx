import Image from 'next/image'
import type { ReactNode } from 'react'
import { getTranslations } from 'next-intl/server'
import { PhotoHeroFlag } from '@/components/shared/PhotoHeroFlag'
import { CONTAINER, HERO_LEAD, HERO_TITLE } from '@/components/shared/layout'
import { DEFAULT_ALBANIA_PHOTO } from '@/lib/media/albaniaPhotos'
import { SpriteIcon as Icon } from "@/components/shared/SpriteIcon";
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
import { MessengerButtons } from '@/components/contact/MessengerButtons'
import { brandButtonClass } from '@/components/shared/BrandButton'
import { nonMessengerLinks, resolveMessengers } from '@/lib/contacts/messengers'
import { getMessengerContext } from '@/lib/contacts/messengerContext.server'
import { getSiteBaseUrl } from '@/lib/siteUrl'
import type { SocialLinkInput } from '@/lib/footer/socialChannels'
import { SiteTrustContactLines } from '@/components/capture/SiteTrust'
import { mapSiteTrust } from '@/lib/sanity/trustFromSiteSettings'

type ContactPageContentProps = {
  locale: string
  manager: ContactsManagerBlock
  /** The breadcrumb, drawn in white on the photo. */
  breadcrumb?: ReactNode
}

const DEAL_TYPE_VALUES = ['sale', 'rent', 'short-term'] as const

export async function ContactPageContent({ locale, manager, breadcrumb }: ContactPageContentProps) {
  const t = await getTranslations({ locale, namespace: 'Contacts' })
  const tPhoto = await getTranslations({ locale, namespace: 'AlbaniaPhotos' })
  const heroPhoto = DEFAULT_ALBANIA_PHOTO
  const tBar = await getTranslations({ locale, namespace: 'ContactBar' })
  const tQuick = await getTranslations({ locale, namespace: 'QuickContact' })
  const photo = manager.photo
  const photoAlt = photo?.alt?.trim() || t('managerPhotoAlt')

  const [filterOptions, siteSettings, areaBoundsFromData] = await Promise.all([
    fetchCatalogFilterOptions(locale),
    fetchSiteSettings(),
    fetchCatalogAreaBoundsFromData(),
  ])

  // WhatsApp and Telegram get buttons of their own (CMS link first, the
  // business link when the CMS has none); the "follow" list keeps the rest.
  const messengers = resolveMessengers(
    (siteSettings as { socialLinks?: SocialLinkInput[] } | null)?.socialLinks,
    locale,
    await getMessengerContext({ locale, placement: 'contact-page', pageUrl: `${getSiteBaseUrl()}/${locale}/contacts` })
  )
  const followLinks = nonMessengerLinks(manager.socialLinks)
  // Phone, reply time and address as the owner enters them in Site Settings;
  // nothing is printed for an empty field.
  const trust = mapSiteTrust(siteSettings, locale)
  // The owners' address, for the day the CMS field is empty.
  const email = manager.email ?? 'hello@domlivo.com'

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

  // The contacts page is one screen: a photo of the coast with the heading,
  // and the request form on top of it (owner, 2026-10-24: the old hero was a
  // 498 px picture stretched to full width, with the form a screen below).
  // Phone order: heading, form, then the ways to write to us.
  return (
    <section
      className="relative overflow-x-clip pb-12 pt-24 md:pb-20 md:pt-32"
      aria-labelledby="contacts-heading"
      data-lead-placement="contact-page"
    >
      <PhotoHeroFlag />
      <div className="absolute inset-x-0 top-0 z-0 h-[30rem] md:h-[34rem] xl:bottom-0 xl:h-auto">
        <Image
          src={heroPhoto.src}
          alt={tPhoto(heroPhoto.key)}
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority
          fetchPriority="high"
        />
        <div className="pointer-events-none absolute inset-0 bg-dark/50" aria-hidden />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-dark/50 via-dark/20 to-transparent" aria-hidden />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent dark:from-black"
          aria-hidden
        />
      </div>

      <div className={`${CONTAINER} relative z-10`}>
        {breadcrumb ? (
          <div className="text-left [text-shadow:0_1px_16px_rgba(0,0,0,0.35)] [&_*]:!text-white/85 [&_a:hover]:!text-white">
            {breadcrumb}
          </div>
        ) : null}
        <div className="mt-6 grid gap-6 lg:mt-10 xl:grid-cols-12 xl:gap-x-16 xl:gap-y-8">
          <div className="min-w-0 text-white [text-shadow:0_1px_16px_rgba(0,0,0,0.35)] xl:col-span-5 xl:row-start-1">
            <h1 id="contacts-heading" className={HERO_TITLE}>
              {t('heroH1')}
            </h1>
            <p className={`${HERO_LEAD} mt-4`}>{t('heroH2')}</p>
          </div>

          <div className="min-w-0 xl:col-span-7 xl:col-start-6 xl:row-span-2 xl:row-start-1">
            <GeneralContactForm
              locale={locale}
              filterProps={filterProps}
              className="rounded-3xl border-0 bg-white shadow-2xl backdrop-blur-none dark:bg-dark"
            />
          </div>

          <div className="min-w-0 self-start rounded-3xl bg-white p-5 shadow-xl dark:bg-dark md:p-6 xl:col-span-5 xl:row-start-2">
            <div className="mb-3 flex items-center gap-3">
              {photo?.url ? (
                <Image
                  src={photo.url}
                  alt={photoAlt}
                  width={44}
                  height={44}
                  className="h-11 w-11 shrink-0 rounded-full object-cover"
                />
              ) : null}
              <p className="text-sm font-medium text-dark/70 dark:text-white/70">{tBar('messageUs')}</p>
            </div>
            <MessengerButtons
              messengers={messengers}
              ariaLabels={{ whatsapp: tQuick('channel.whatsapp'), telegram: tQuick('channel.telegram') }}
              className="mb-5 flex gap-3 [&>a]:h-12 [&>a]:text-sm sm:[&>a]:text-base"
            />
            <SiteTrustContactLines locale={locale} trust={trust} className="mb-3" />
            {email ? (
              <a
                href={`mailto:${email}`}
                className="inline-flex min-h-11 max-w-full items-center gap-3 break-all text-base text-dark transition-colors hover:text-primary dark:text-white dark:hover:text-primary"
              >
                <Icon icon="ph:envelope-simple" width={22} height={22} className="shrink-0 text-primary" aria-hidden />
                <span>
                  <span className="text-sm text-dark/60 dark:text-white/60">{t('managerEmailLabel')}: </span>
                  {email}
                </span>
              </a>
            ) : null}

            {followLinks.length > 0 ? (
              <div className="mt-5">
                <p className="mb-3 text-sm font-medium text-dark/70 dark:text-white/70">{t('follow')}</p>
                <ul className="grid grid-cols-2 gap-3">
                  {followLinks.map((s, i) => (
                    <li key={`${s.url}-${i}`} className="min-w-0">
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={brandButtonClass('secondary', 'w-full min-w-0', 'sm')}
                      >
                        <Icon icon={iconForContactsSocialPlatform(s.platform)} width={20} height={20} aria-hidden />
                        {s.platform}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
