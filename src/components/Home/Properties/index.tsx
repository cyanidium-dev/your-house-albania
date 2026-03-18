import { Icon } from '@iconify/react'
import { getProperties } from '@/data/properties'
import { getTranslations } from 'next-intl/server'
import type { PropertyHomes } from '@/types/properyHomes'
import { TopOffersCarouselClient, type TopOffersGroup } from './TopOffersCarouselClient'

type PropertiesData = { badge?: string; title?: string; description?: string } | null;

const Properties: React.FC<{
  locale: string;
  propertiesData?: PropertiesData;
  propertyItems?: PropertyHomes[] | null;
  topOffersGroups?: Record<TopOffersGroup, PropertyHomes[]> | null;
}> = async ({ locale, propertiesData, propertyItems, topOffersGroups }) => {
  const debug = process.env.NODE_ENV === 'development'
  const t = await getTranslations('Home.properties')
  const tTop = await getTranslations('Home.topOffers')
  const badge = propertiesData?.badge ?? t('badge')
  const title = tTop('title')
  const description = tTop('description')

  const fallbackItems = Array.isArray(propertyItems) && propertyItems.length > 0
    ? propertyItems.slice(0, 24)
    : getProperties().slice(0, 24)

  const groups = topOffersGroups && Object.keys(topOffersGroups).length > 0
    ? topOffersGroups
    : {
        popular: fallbackItems.filter((x) => x.featured === true).slice(0, 24),
        new: fallbackItems.slice(0, 24),
        highDemand: fallbackItems.filter((x) => Boolean(x.investment)).slice(0, 24),
      }
  if (debug) {
    const safeCounts = (g: Record<TopOffersGroup, PropertyHomes[]>) => ({
      popular: Array.isArray(g.popular) ? g.popular.length : null,
      new: Array.isArray(g.new) ? g.new.length : null,
      highDemand: Array.isArray(g.highDemand) ? g.highDemand.length : null,
    })
    console.log('[Landing][PropertiesSection] computed', {
      locale,
      hasTopOffersGroupsProp: !!topOffersGroups,
      propertyItemsCount: Array.isArray(propertyItems) ? propertyItems.length : null,
      fallbackItemsCount: Array.isArray(fallbackItems) ? fallbackItems.length : null,
      groupsCounts: safeCounts(groups as Record<TopOffersGroup, PropertyHomes[]>),
      sample: (groups as any)?.popular?.[0]
        ? {
            slug: (groups as any).popular[0].slug,
            name: (groups as any).popular[0].name,
            imagesCount: Array.isArray((groups as any).popular[0].images) ? (groups as any).popular[0].images.length : undefined,
          }
        : null,
    })
  }
  return (
    <section className="py-16 md:py-24">
      <div className='container max-w-8xl mx-auto px-5 2xl:px-0'>
        <div className='mb-16 flex flex-col gap-3 '>
          <div className='flex gap-2.5 items-center justify-center'>
            <span>
              <Icon
                icon={'ph:house-simple-fill'}
                width={20}
                height={20}
                className='text-primary'
              />
            </span>
            <p className='text-base font-semibold text-dark/75 dark:text-white/75'>
              {badge}
            </p>
          </div>
          <h2 className='text-40 lg:text-52 font-medium text-black dark:text-white text-center tracking-tight leading-11 mb-2'>
            {title}
          </h2>
          <p className='text-xm font-normal text-black/50 dark:text-white/50 text-center'>
            {description}
          </p>
        </div>
        <TopOffersCarouselClient
          locale={locale}
          groups={groups as Record<TopOffersGroup, PropertyHomes[]>}
        />
      </div>
    </section>
  )
}

export default Properties
