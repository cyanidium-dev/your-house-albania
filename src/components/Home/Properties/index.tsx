import { Icon } from '@iconify/react'
import PropertyCard from './Card/Card'
import { getProperties } from '@/data/properties'
import { getTranslations } from 'next-intl/server'
import type { PropertyHomes } from '@/types/properyHomes'

type PropertiesData = { badge?: string; title?: string; description?: string } | null;

const Properties: React.FC<{
  locale: string;
  propertiesData?: PropertiesData;
  propertyItems?: PropertyHomes[] | null;
}> = async ({ locale, propertiesData, propertyItems }) => {
  const t = await getTranslations('Home.properties')
  const badge = propertiesData?.badge ?? t('badge')
  const title = propertiesData?.title ?? t('title')
  const description = propertiesData?.description ?? t('description')
  const items = Array.isArray(propertyItems) && propertyItems.length > 0
    ? propertyItems.slice(0, 6)
    : getProperties().slice(0, 6)
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
        <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10'>
          {items.map((item, index) => (
            <div key={index} className=''>
              <PropertyCard item={item} locale={locale} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Properties
