import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { fetchCatalogFilterOptions, fetchSiteSettings } from '@/lib/sanity/client'
import { HeroSearchWidget } from '@/components/catalog/widgets/HeroSearchWidget'
import { resolvePriceRange, toRangesByDeal } from '@/lib/catalog/priceRanges'
import { resolveCta } from '@/lib/routes/resolveLocaleHref'
import { heroPhotoFor } from '@/lib/media/albaniaPhotos'
import { PhotoHeroFlag } from '@/components/shared/PhotoHeroFlag'
import AiSearchInput from '@/components/ai/AiSearchInput'
import { isAiSearchEnabled } from '@/lib/ai/config'

export type HeroData = {
  shortLine?: string;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  searchTabs?: Array<{ key?: string; label?: string }>;
  searchEnabled?: boolean;
  /** Plain-language assistant field. Homepage only — see the hero section handler. */
  aiSearchEnabled?: boolean;
  backgroundImageUrl?: string;
  backgroundImageAlt?: string;
  enabled?: boolean;
  /**
   * What the page is about, so a landing with no background in the CMS still
   * gets a photograph of the right place. See `heroPhotoFor`.
   */
  photoContext?: {
    citySlug?: string | null;
    propertyType?: string | null;
    deal?: string | null;
    slug?: string | null;
  };
} | null;

const Hero: React.FC<{ locale: string; heroData?: HeroData; breadcrumb?: React.ReactNode }> = async ({ locale, heroData, breadcrumb }) => {
  if (heroData?.enabled === false) return null

  const t = await getTranslations('Home.hero')
  const tPhoto = await getTranslations('AlbaniaPhotos')
  const shortLine = heroData?.shortLine ?? t('location')
  const title = heroData?.title ?? t('title')
  const subtitle = heroData?.subtitle
  // No CMS background is the common case — most landings have never had one,
  // and the theme's stock banner (a rendered villa in a desert) is not a
  // picture of Albania. Fall back to a real photograph of the place instead.
  const fallbackPhoto = heroPhotoFor(heroData?.photoContext ?? {})
  const bgImageUrl = heroData?.backgroundImageUrl || fallbackPhoto.src
  const bgImageAlt =
    heroData?.backgroundImageUrl
      ? heroData.backgroundImageAlt || title || 'Hero background'
      : tPhoto(fallbackPhoto.key)
  const searchEnabled = heroData?.searchEnabled === true
  const aiSearchVisible = heroData?.aiSearchEnabled === true && isAiSearchEnabled()
  const primaryCta = resolveCta(heroData?.ctaLabel, heroData?.ctaHref, locale)
  const secondaryCta = resolveCta(heroData?.secondaryCtaLabel, heroData?.secondaryCtaHref, locale)
  const cmsTabs = Array.isArray(heroData?.searchTabs)
    ? heroData.searchTabs
        .map((tab) => {
          const key = tab?.key
          if (key !== 'sale' && key !== 'rent' && key !== 'short-term') return null
          return { key, label: tab?.label }
        })
        .filter(Boolean) as Array<{ key: 'sale' | 'rent' | 'short-term'; label?: string }>
    : []

  const [filterOptions, siteSettings] = await Promise.all([
    fetchCatalogFilterOptions(locale),
    fetchSiteSettings(),
  ])
  const priceRangesByDeal = toRangesByDeal(
    resolvePriceRange((siteSettings as Record<string, unknown>)?.priceRange)
  )
  const locationOptions = filterOptions.locations.map((o) => ({ value: o.value, label: o.label }))
  const propertyTypeOptions = filterOptions.propertyTypes
    .filter((o) => o.value && o.value !== 'any')
    .map((o) => ({ value: o.value, label: o.label }))

  return (
    <section className='relative z-10 !py-0'>
      <div className='bg-gradient-to-b from-skyblue via-lightskyblue dark:via-[#4298b0] to-white/10 dark:to-black/10 relative min-h-screen flex'>
        <PhotoHeroFlag />
        <div className="absolute inset-0 z-0">
          <Image
            src={bgImageUrl}
            alt={bgImageAlt}
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority={false}
            unoptimized={bgImageUrl.startsWith('http')}
          />
        </div>
        {/* Scrim. A photo can be any brightness, so the text needs its own
            ground rather than relying on the image being dark enough:
            a flat wash for the whole frame, then a stronger gradient where
            the copy sits — vertical on mobile, from the left on desktop. */}
        <div className="pointer-events-none absolute inset-0 z-10 bg-dark/45" aria-hidden />
        <div
          className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-dark/80 via-dark/30 to-transparent md:bg-gradient-to-r md:from-dark/85 md:via-dark/45 md:to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-40 bg-gradient-to-t from-white/90 to-transparent dark:from-black/90"
          aria-hidden
        />
        <div className='container max-w-8xl mx-auto px-5 2xl:px-0 pt-32 md:pt-60 md:pb-20 flex-1 relative'>
          {breadcrumb ? (
            <div className="relative z-20 text-left mb-6 [&_*]:!text-white/85 [&_a:hover]:!text-white">
              {breadcrumb}
            </div>
          ) : null}
          {/* The copy always sits on the scrim over a photo now, so it is white
              in both themes. */}
          <div className="relative text-center md:text-start z-20 text-white [text-shadow:0_1px_16px_rgba(0,0,0,0.35)]">
            <p className='text-inherit text-sm md:text-base font-semibold uppercase tracking-[0.14em] opacity-90'>
              {shortLine}
            </p>
            <h1 className='font-display text-inherit text-[2.25rem] leading-[1.08] md:text-5xl lg:text-6xl lg:leading-[1.05] font-bold tracking-[-0.03em] md:max-w-[55%] mt-4 mb-5 text-balance'>
              {title}
            </h1>
            {subtitle ? (
              <p className='text-inherit text-lg md:text-xl leading-relaxed opacity-95 md:max-w-[46%] mb-7 whitespace-pre-line'>
                {subtitle}
              </p>
            ) : null}
            {primaryCta || secondaryCta ? (
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center md:justify-start">
                {primaryCta ? (
                  <Link
                    href={primaryCta.href}
                    className="inline-flex items-center justify-center h-11 px-8 rounded-full font-semibold bg-primary text-white hover:bg-dark transition-colors duration-200 ease-out"
                  >
                    {primaryCta.label}
                  </Link>
                ) : null}
                {secondaryCta ? (
                  <Link
                    href={secondaryCta.href}
                    className="inline-flex items-center justify-center h-11 px-8 rounded-full font-semibold border-2 border-white text-white hover:bg-white/15 transition-colors duration-200 ease-out"
                  >
                    {secondaryCta.label}
                  </Link>
                ) : null}
              </div>
            ) : null}
            {aiSearchVisible ? (
              <div className="mt-8 flex justify-center md:justify-start">
                <AiSearchInput locale={locale} />
              </div>
            ) : null}
            {searchEnabled ? (
              <div className="mt-12 md:mt-16 flex justify-center">
                <HeroSearchWidget
                  locationOptions={locationOptions}
                  propertyTypeOptions={propertyTypeOptions}
                  searchTabs={cmsTabs}
                  priceRangesByDeal={priceRangesByDeal}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
