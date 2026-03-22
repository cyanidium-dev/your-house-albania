import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { fetchCatalogFilterOptions } from '@/lib/sanity/client'
import { HeroSearchWidget } from '@/components/catalog/widgets/HeroSearchWidget'

type HeroData = {
  shortLine?: string;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
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
  const cmsTabs = Array.isArray(heroData?.searchTabs)
    ? heroData.searchTabs
        .map((tab) => {
          const key = tab?.key
          if (key !== 'sale' && key !== 'rent' && key !== 'short-term') return null
          return { key, label: tab?.label }
        })
        .filter(Boolean) as Array<{ key: 'sale' | 'rent' | 'short-term'; label?: string }>
    : []

  const filterOptions = await fetchCatalogFilterOptions(locale)
  const locationOptions = filterOptions.locations.map((o) => ({ value: o.value, label: o.label }))
  const propertyTypeOptions = filterOptions.propertyTypes
    .filter((o) => o.value && o.value !== 'any')
    .map((o) => ({ value: o.value, label: o.label }))

  return (
    <section className='!py-0'>
      <div className='bg-gradient-to-b from-skyblue via-lightskyblue dark:via-[#4298b0] to-white/10 dark:to-black/10 overflow-hidden relative min-h-screen flex'>
        {bgImageUrl ? (
          <>
            <div className="absolute inset-0 z-0">
              <Image
                src={bgImageUrl}
                alt={bgImageAlt}
                fill
                className="object-cover object-center"
                priority={false}
                unoptimized={bgImageUrl.startsWith('http')}
              />
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-72 bg-gradient-to-t from-white via-white/50 to-transparent dark:from-black dark:via-black/50" aria-hidden />
          </>
        ) : (
          <>
            <div className='hidden md:block absolute bottom-0 -right-68 z-0'>
              <Image
                src='/images/hero/heroBanner.png'
                alt='Hero'
                width={1082}
                height={1016}
                priority={false}
                unoptimized
                className="select-none"
              />
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-72 bg-gradient-to-t from-white via-white/50 to-transparent dark:from-black dark:via-black/50" aria-hidden />
          </>
        )}
        <div className='container max-w-8xl mx-auto px-5 2xl:px-0 pt-32 md:pt-60 md:pb-20 flex-1 relative'>
          {breadcrumb ? (
            <div className="relative z-20 text-left mb-4">{breadcrumb}</div>
          ) : null}
          <div className='relative text-white text-center md:text-start z-20'>
            <p className='text-inherit text-xm font-medium'>{shortLine}</p>
            <h1 className='text-inherit text-3xl md:text-4xl lg:text-5xl leading-[1.25] font-semibold -tracking-wider md:max-w-45p mt-4 mb-6'>
              {title}
            </h1>
            {subtitle ? (
              <p className='text-inherit text-lg mb-6'>{subtitle}</p>
            ) : null}
            {heroData?.ctaLabel && heroData?.ctaHref ? (
              <Link
                href={heroData.ctaHref.startsWith('/') ? `/${locale}${heroData.ctaHref}` : heroData.ctaHref}
                className="inline-flex items-center justify-center h-11 px-8 rounded-full font-semibold bg-primary text-white hover:bg-dark transition-colors duration-200 ease-out"
              >
                {heroData.ctaLabel}
              </Link>
            ) : null}
            {searchEnabled ? (
              <div className="mt-12 md:mt-16 flex justify-center">
                <HeroSearchWidget
                  locationOptions={locationOptions}
                  propertyTypeOptions={propertyTypeOptions}
                  searchTabs={cmsTabs}
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
