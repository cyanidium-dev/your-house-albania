import { getTranslations } from 'next-intl/server'
import HeaderClient from './HeaderClient'
import type { ResolvedSiteSettings } from '@/lib/sanity/siteSettingsAdapter'
import type { HeaderTranslations } from './HeaderClient'
import { getNavLinks } from '@/data/navigation'

type HeaderProps = {
  siteSettings?: ResolvedSiteSettings
  locale: string
}

export default async function Header({ siteSettings, locale }: HeaderProps) {
  const t = await getTranslations('Header')
  const navLinks = getNavLinks()

  const translations: HeaderTranslations = {
    menu: t('menu'),
    contact: t('contact'),
    cta: { viewProperties: t('cta.viewProperties') },
    nav: Object.fromEntries(navLinks.map((item) => [item.key, t(`nav.${item.key}`)])),
  }

  return (
    <HeaderClient
      locale={locale}
      siteSettings={siteSettings}
      translations={translations}
    />
  )
}
