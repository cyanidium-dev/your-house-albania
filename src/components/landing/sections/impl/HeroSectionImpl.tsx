import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { fetchCatalogFilterOptions, fetchSiteSettings } from '@/lib/sanity/client'
import { HeroSearchWidget } from '@/components/catalog/widgets/HeroSearchWidget'
import { resolvePriceRange, toRangesByDeal } from '@/lib/catalog/priceRanges'
import { resolveLocaleHref } from '@/lib/routes/resolveLocaleHref'
import { brandButtonClass } from '@/components/shared/BrandButton'

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
  backgroundImageUrl?: string;
  backgroundImageAlt?: string;
  enabled?: boolean;
} | null;

const Hero: React.FC<{ locale: string; heroData?: HeroData; breadcrumb?: React.ReactNode }> = async ({ locale, heroData, breadcrumb }) => {
  if (heroData?.enabled === false) return null

  const t = await getTranslations('Home.hero')
  const shortLine = heroData?.shortLine ?? t('location')
  const title = heroData?.title ?? t('title')
  const subtitle = heroData?.subtitle
  const bgImageUrl = heroData?.backgroundImageUrl
  const bgImageAlt = heroData?.backgroundImageAlt || title || 'Hero background'
  const searchEnabled = heroData?.searchEnabled === true
  const hasPrimaryCta = Boolean(heroData?.ctaLabel && heroData?.ctaHref)
  const hasSecondaryCta = Boolean(heroData?.secondaryCtaLabel && heroData?.secondaryCtaHref)
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

  const primaryHref = hasPrimaryCta ? resolveLocaleHref(heroData!.ctaHref!, locale) : null
  const secondaryHref = hasSecondaryCta ? resolveLocaleHref(heroData!.secondaryCtaHref!, locale) : null

  return (
    <section className="relative z-10 !py-0">
      <div className="relative min-h-[78vh] md:min-h-screen flex bg-dark">
        {bgImageUrl ? (
          <div className="absolute inset-0 z-0">
            <Image
              src={bgImageUrl}
              alt={bgImageAlt}
              fill
              className="object-cover object-center"
              priority
              sizes="100vw"
              unoptimized={bgImageUrl.startsWith('http')}
            />
          </div>
        ) : (
          <div className="hidden md:block absolute bottom-0 -right-68 z-0">
            <Image
              src="/images/hero/heroBanner.png"
              alt="Hero"
              width={1082}
              height={1016}
              priority={false}
              unoptimized
              className="select-none"
            />
          </div>
        )}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/55 via-black/25 to-black/65"
        />
        <div className="container max-w-8xl mx-auto px-5 2xl:px-0 pt-28 sm:pt-32 md:pt-44 lg:pt-56 pb-16 md:pb-24 flex-1 relative">
          {breadcrumb ? (
            <div className="relative z-20 text-left mb-4">{breadcrumb}</div>
          ) : null}
          <div className="relative text-white text-left z-20">
            <p className="text-inherit text-sm sm:text-base font-medium uppercase tracking-[0.18em] text-white/85">
              {shortLine}
            </p>
            <h1 className="text-inherit text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.05] font-semibold -tracking-tight md:max-w-[60%] mt-5 mb-6">
              {title}
            </h1>
            {subtitle ? (
              <p className="text-inherit text-base sm:text-lg mb-8 max-w-2xl whitespace-pre-line text-white/90">
                {subtitle}
              </p>
            ) : null}
            {hasPrimaryCta || hasSecondaryCta ? (
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 mt-2">
                {hasPrimaryCta && primaryHref ? (
                  <a href={primaryHref} className={brandButtonClass('primary')}>
                    {heroData!.ctaLabel}
                  </a>
                ) : null}
                {hasSecondaryCta && secondaryHref ? (
                  <a href={secondaryHref} className={brandButtonClass('onDark')}>
                    {heroData!.secondaryCtaLabel}
                  </a>
                ) : null}
              </div>
            ) : null}
            {searchEnabled ? (
              <div className="mt-10 md:mt-14 flex justify-start">
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
