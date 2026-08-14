import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { fetchSiteSettings } from '@/lib/sanity/client'
import { mapContactsManagerFromSiteSettings } from '@/lib/sanity/contactsManagerFromSiteSettings'
import { ContactsHero } from '@/components/contact/ContactsHero'
import { ContactPageContent } from '@/components/contact/ContactPageContent'
import { buildHreflangAlternates } from '@/lib/seo/hreflang'
import { indexingDisabledRobots, isIndexingEnabled } from '@/lib/seo/envSeo'
import { getSiteBaseUrl } from '@/lib/siteUrl'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Contacts' })
  const title = t('metaTitle')
  const description = t('metaDescription')

  if (!isIndexingEnabled()) {
    return {
      title,
      description,
      robots: indexingDisabledRobots,
    }
  }

  const baseUrl = getSiteBaseUrl()
  const path = '/contacts'
  const canonical = `${baseUrl}/${locale}${path}`
  const href = buildHreflangAlternates(path)

  return {
    title,
    description,
    alternates: {
      canonical,
      ...(href?.languages ? { languages: href.languages } : {}),
    },
    robots: { index: true, follow: true },
  }
}

export default async function ContactsPage({ params }: Props) {
  const { locale } = await params
  const raw = await fetchSiteSettings()
  const manager = mapContactsManagerFromSiteSettings(raw)

  return (
    <>
      <ContactsHero locale={locale} />
      <ContactPageContent locale={locale} manager={manager} />
    </>
  )
}
