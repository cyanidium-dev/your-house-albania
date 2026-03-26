import { redirect } from 'next/navigation'
import { LandingRenderer } from '@/components/landing/LandingRenderer'
import { fetchDealTypeLanding } from '@/lib/sanity/client'
import type { PropertiesDealParam } from '@/lib/catalog/propertiesDealFromLanding'

export async function DealTypeLandingPage({
  locale,
  deal,
}: {
  locale: string
  deal: PropertiesDealParam
}) {
  const landing = await fetchDealTypeLanding(deal)
  if (!landing) {
    redirect(`/${locale}/properties?deal=${encodeURIComponent(deal)}`)
  }
  return (
    <LandingRenderer
      locale={locale}
      landing={landing as never}
      propertiesDeal={deal}
    />
  )
}
