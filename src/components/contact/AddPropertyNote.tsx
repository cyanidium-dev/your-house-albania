import Link from "@/components/shared/Link";
import { getTranslations } from 'next-intl/server'
import { Icon } from '@/components/shared/Icon'
import { MessengerButtons } from '@/components/contact/MessengerButtons'
import type { MessengerLink } from '@/lib/contacts/messengers'

type Props = {
  locale: string
  messengers: MessengerLink[]
}

/**
 * The owner's and the agency's way onto the site. It used to be a menu
 * section of its own ("For realtors"); since 2026-09-26 it is this note, so the
 * site reads as a place to find a home first. The instructions page and the
 * registration form still exist and are linked from here.
 */
export async function AddPropertyNote({ locale, messengers }: Props) {
  const t = await getTranslations({ locale, namespace: 'Contacts.addProperty' })
  const tQuick = await getTranslations({ locale, namespace: 'QuickContact' })

  return (
    <section
      id="add-property"
      className="scroll-mt-28 border-t border-black/5 py-12 dark:border-white/10 md:py-16"
      aria-labelledby="add-property-heading"
      data-lead-placement="contact-page-add-property"
    >
      <div className="container mx-auto max-w-8xl px-5 2xl:px-0">
        <div className="grid gap-6 rounded-2xl border border-dark/10 bg-dark/[0.03] p-6 dark:border-white/10 dark:bg-white/[0.04] md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:items-center md:gap-10 md:p-8">
          <div>
            <h2 id="add-property-heading" className="font-display text-2xl font-semibold text-dark dark:text-white md:text-3xl">
              {t('title')}
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-dark/70 dark:text-white/70">
              {t('body')}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <MessengerButtons
              messengers={messengers}
              ariaLabels={{ whatsapp: tQuick('channel.whatsapp'), telegram: tQuick('channel.telegram') }}
              className="flex gap-3 [&>a]:h-12 [&>a]:text-base"
            />
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
              <Link
                href={`/${locale}/how-to-publish`}
                className="inline-flex items-center gap-1.5 text-dark/75 underline-offset-4 transition-colors hover:text-primary hover:underline dark:text-white/75"
              >
                <Icon icon="ph:play-circle" width={18} height={18} aria-hidden />
                {t('howTo')}
              </Link>
              <Link
                href={`/${locale}/register`}
                className="inline-flex items-center gap-1.5 text-dark/75 underline-offset-4 transition-colors hover:text-primary hover:underline dark:text-white/75"
              >
                <Icon icon="ph:paper-plane-tilt" width={18} height={18} aria-hidden />
                {t('register')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
