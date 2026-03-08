import PropertyCard from '@/components/Home/Properties/Card/Card'
import { getProperties } from '@/data/properties'

const ResidentialList: React.FC<{ locale: string }> = ({ locale }) => {
  const properties = getProperties()
  return (
    <section className='pt-0!'>
      <div className='container max-w-8xl mx-auto px-5 2xl:px-0'>
        <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10'>
          {properties.slice(0, 3).map((item, index) => (
            <div key={index} className=''>
              <PropertyCard item={item} locale={locale} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ResidentialList
