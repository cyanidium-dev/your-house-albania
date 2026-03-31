import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { HowToPublishPageContent } from '@/components/how-to-publish/HowToPublishPageContent'
import { fetchSiteSettings } from '@/lib/sanity/client'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'HowToPublish' })
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

export default async function HowToPublishPage({ params }: Props) {
  const { locale } = await params
  const raw = await fetchSiteSettings()
  const videoUrl =
    typeof (raw as { howToPublishVideoUrl?: unknown } | null)?.howToPublishVideoUrl === 'string'
      ? (raw as { howToPublishVideoUrl: string }).howToPublishVideoUrl.trim() || undefined
      : undefined

  return <HowToPublishPageContent locale={locale} videoUrl={videoUrl} />
}
