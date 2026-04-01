import type { PropertyHomes } from '@/types/propertyHomes'
import { SectionHeader } from '@/components/landing/sectionPrimitives'
import { TopOffersCarouselClient, type TopOffersGroup } from './TopOffersCarouselClient'

type PropertiesData = { badge?: string; title?: string; description?: string } | null;

const Properties: React.FC<{
  locale: string;
  propertiesData?: PropertiesData;
  propertyItems?: PropertyHomes[] | null;
  topOffersGroups?: Record<TopOffersGroup, PropertyHomes[]> | null;
  initialGroup?: TopOffersGroup;
}> = async ({ locale, propertiesData, propertyItems, topOffersGroups, initialGroup }) => {
  const debug = process.env.NODE_ENV === 'development'
  const badge = propertiesData?.badge
  const title = propertiesData?.title
  const description = propertiesData?.description

  let groups: Record<TopOffersGroup, PropertyHomes[]>
  if (topOffersGroups && Object.keys(topOffersGroups).length > 0) {
    groups = topOffersGroups
  } else if (Array.isArray(propertyItems) && propertyItems.length > 0) {
    const fallbackItems = propertyItems.slice(0, 24)
    groups = {
      popular: fallbackItems,
      new: fallbackItems,
      highDemand: fallbackItems,
    }
  } else {
    groups = {
      popular: [],
      new: [],
      highDemand: [],
    }
  }
  const groupsCounts = {
    popular: Array.isArray(groups.popular) ? groups.popular.length : 0,
    new: Array.isArray(groups.new) ? groups.new.length : 0,
    highDemand: Array.isArray(groups.highDemand) ? groups.highDemand.length : 0,
  }
  const hasAnyItems =
    groupsCounts.popular > 0 || groupsCounts.new > 0 || groupsCounts.highDemand > 0

  // Strict CMS-driven section: render nothing when no data.
  if (!hasAnyItems) return null
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
      groupsCounts: safeCounts(groups),
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
        <SectionHeader
          variant="center"
          eyebrowText={badge}
          title={title}
          subtitle={description}
        />
        <TopOffersCarouselClient
          locale={locale}
          groups={groups}
          initialGroup={initialGroup}
        />
      </div>
    </section>
  )
}

export default Properties
