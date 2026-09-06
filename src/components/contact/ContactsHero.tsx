import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

type Props = {
  locale: string
}

/**
 * Contacts-only hero: structure and visuals inspired by `Home/Hero`, but smaller
 * (no full-screen height, no search/catalog). Does not import the shared Hero to avoid
 * changing page-builder / home behavior.
 */
export async function ContactsHero({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: 'Contacts' })
  const bgImageUrl = '/images/contactUs/contactUs.jpg'
  const bgImageAlt = t('heroImageAlt')

  return (
    <section className="!py-0">
      <div className="relative flex min-h-[min(58vh,38rem)] max-h-[600px] overflow-hidden bg-gradient-to-b from-skyblue via-lightskyblue dark:via-[#4298b0] to-white/10 dark:to-black/10">
        <div className="absolute inset-0 z-0">
          <Image
            src={bgImageUrl}
            alt={bgImageAlt}
            fill
            className="object-cover object-center"
            priority
            unoptimized
          />
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-36 bg-gradient-to-t from-white via-white/40 to-transparent dark:from-black dark:via-black/40"
          aria-hidden
        />
        <div className="container relative z-20 mx-auto flex max-w-8xl flex-1 flex-col justify-center px-5 pt-20 pb-28 md:px-5 md:pt-28 md:pb-36 2xl:px-0">
          <div className="max-w-3xl pb-2 text-left text-white">
            <h1 className="mb-3 text-3xl font-semibold leading-tight tracking-tight md:text-4xl lg:text-[2.35rem] lg:leading-[1.2]">
              {t('heroH1')}
            </h1>
            <h2 className="mb-4 text-xl font-medium leading-snug text-white/95 md:text-2xl">
              {t('heroH2')}
            </h2>
            <p className="max-w-2xl text-base leading-relaxed text-white/90 md:text-lg">
              {t('heroDescription')}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
