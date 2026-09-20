import { getTranslations } from 'next-intl/server'
import MobileStickyBar from '@/components/property/MobileStickyBar'
import { HelpChoosingButton } from '@/components/contact/HelpChoosingButton'
import { MessengerButtons } from '@/components/contact/MessengerButtons'
import { resolveMessengers } from '@/lib/contacts/messengers'
import { fetchSiteSettings } from '@/lib/sanity/client'
import type { SocialLinkInput } from '@/lib/footer/socialChannels'

/**
 * The phone contact bar of a city or district listing: a callback request plus
 * WhatsApp and Telegram, Telegram first for Russian and Ukrainian. Below `md`
 * only — from there up the page has room for the header and footer contacts.
 */
export async function ListingContactBar({ locale }: { locale: string }) {
  const [settings, t, tQuick] = await Promise.all([
    fetchSiteSettings(),
    getTranslations({ locale, namespace: 'ContactBar' }),
    getTranslations({ locale, namespace: 'QuickContact' }),
  ])
  const messengers = resolveMessengers(
    (settings as { socialLinks?: SocialLinkInput[] } | null)?.socialLinks,
    locale,
  )

  return (
    <MobileStickyBar hideFrom="md" placement="catalog" label={t('barLabel')}>
      <div
        className="flex items-center gap-2 bg-primary/50 px-4 py-3"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
      >
        <HelpChoosingButton
          locale={locale}
          label={t('helpChoosing')}
          sourceLabel="Listing contact bar"
          placement="catalog"
          className="h-11 min-w-0 flex-1 truncate rounded-full bg-primary px-5 text-base font-semibold text-white transition-colors duration-300 hover:bg-dark"
        />
        <MessengerButtons
          messengers={messengers}
          ariaLabels={{ whatsapp: tQuick('channel.whatsapp'), telegram: tQuick('channel.telegram') }}
          variant="icon"
          className="flex shrink-0 gap-2 [&>a]:bg-white dark:[&>a]:bg-dark"
        />
      </div>
    </MobileStickyBar>
  )
}
