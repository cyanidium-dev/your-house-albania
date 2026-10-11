import type { PropertyHomes } from '@/types/propertyHomes'
import { CONTAINER, SECTION_Y, SectionHeading } from '@/components/shared/layout'
import { TopOffersCarouselClient, type TopOffersGroup } from './TopOffersCarouselClient'
import { ItemListJsonLd } from '@/components/shared/ItemListJsonLd'
import { getBaseUrl } from '@/lib/seo/baseUrl'
import { propertyCardCanonicalCoverUrl } from '@/lib/property/propertyCardImages'

type PropertiesData = { badge?: string; title?: string; description?: string } | null;

const Properties: React.FC<{
  locale: string;
  propertiesData?: PropertiesData;
  propertyItems?: PropertyHomes[] | null;
  topOffersGroups?: Record<TopOffersGroup, PropertyHomes[]> | null;
  initialGroup?: TopOffersGroup;
  /** Filtered feeds: the catalogue page with the same filter, and how many it lists. */
  seeAll?: { href: string; count: number; label?: string };
  /** Emit the cards as a schema.org ItemList (filtered and hand-picked feeds). */
  itemListJsonLd?: boolean;
}> = async ({ locale, propertiesData, propertyItems, topOffersGroups, initialGroup, seeAll, itemListJsonLd }) => {
  const debug = process.env.NODE_ENV === 'development'
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
  const listItems = itemListJsonLd
    ? (groups.popular ?? []).map((item) => ({
        name: item.name,
        slug: item.slug,
        href: item._href,
        image: propertyCardCanonicalCoverUrl(item),
      }))
    : []
  const baseUrl = listItems.length ? await getBaseUrl() : ''

  return (
    <section className={SECTION_Y}>
      {listItems.length ? <ItemListJsonLd items={listItems} baseUrl={baseUrl} locale={locale} /> : null}
      <div className={CONTAINER}>
        <TopOffersCarouselClient
          locale={locale}
          groups={groups}
          initialGroup={initialGroup}
          seeAll={seeAll}
          showTabs={Boolean(topOffersGroups && Object.keys(topOffersGroups).length > 0)}
          header={
            title || description ? (
              <SectionHeading title={title} lead={description} className="mb-0 md:mb-0" />
            ) : undefined
          }
        />
      </div>
    </section>
  )
}

export default Properties
