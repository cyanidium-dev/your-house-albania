import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { fetchSiteSettings } from '@/lib/sanity/client'
import { mapContactsManagerFromSiteSettings } from '@/lib/sanity/contactsManagerFromSiteSettings'
import { ContactsHero } from '@/components/contact/ContactsHero'
import { ContactPageContent } from '@/components/contact/ContactPageContent'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Contacts' })
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
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
